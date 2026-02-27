import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { db, storage } from "../../../services/firebase";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useAuth } from "../../../context/AuthContext";
type RoomFormValues = {
  name: string;
  price: number;
  capacity: number;
  description: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  hostelSlug?: string; // puede venir de props, pero no confiamos 100%
  initialData?: {
    id: string;
    name: string;
    price: number;
    capacity: number;
    description: string;
    imageUrls?: string[];
    imagePaths?: string[];
  } | null;
  onSuccess: () => void;
};

export default function RoomFormModal({
  open,
  onClose,
  initialData,
  onSuccess,
  hostelSlug: hostelSlugProp,
}: Props) {
  const { t } = useTranslation();
  const { hostelSlug: hostelSlugCtx, role, loading: authLoading } = useAuth();

  // ✅ Fuente única real: si prop viene, ok; si no, uso contexto
  const resolvedHostelSlug = hostelSlugProp ?? hostelSlugCtx ?? null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<RoomFormValues>({
    mode: "onChange",
    defaultValues: {
      name: "",
      price: 0,
      capacity: 1,
      description: "",
    },
  });

  const MAX_IMAGES = 6;
  const MAX_MB = 2;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [existingPaths, setExistingPaths] = useState<string[]>([]);
  const [pathsToDelete, setPathsToDelete] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const totalCount = existingUrls.length + files.length;

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        price: initialData.price,
        capacity: initialData.capacity,
        description: initialData.description,
      });
      setExistingUrls(initialData.imageUrls ?? []);
      setExistingPaths(initialData.imagePaths ?? []);
      setPathsToDelete([]);
    } else {
      reset({
        name: "",
        price: 0,
        capacity: 1,
        description: "",
      });
      setExistingUrls([]);
      setExistingPaths([]);
      setPathsToDelete([]);
    }

    setFiles([]);
    setPreviews([]);
    setFormError(null);
  }, [initialData, reset, open]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p));
    };
  }, [previews]);

  function validateFileBasics(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error("Formato inválido. Usá JPG, PNG o WebP.");
    }
    const mb = file.size / (1024 * 1024);
    if (mb > MAX_MB * 3) {
      throw new Error(`La imagen es muy pesada (${mb.toFixed(2)}MB). Probá otra.`);
    }
  }

  async function compressToJpeg(file: File): Promise<Blob> {
    const img = new Image();
    const url = URL.createObjectURL(file);

    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Imagen inválida"));
        img.src = url;
      });

      const maxW = 1600;
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas");

      ctx.drawImage(img, 0, 0, w, h);

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Error comprimiendo imagen"))),
          "image/jpeg",
          0.82
        );
      });

      return blob;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function uploadImages(hostelId: string, roomId: string, filesToUpload: File[]) {
    const uploaded: { url: string; path: string }[] = [];

    for (const file of filesToUpload) {
      const blob = await compressToJpeg(file);

      const sizeMb = blob.size / (1024 * 1024);
      if (sizeMb > MAX_MB) {
        throw new Error(`Una imagen quedó muy pesada (${sizeMb.toFixed(2)}MB). Probá otra.`);
      }

      const safeName = `${Date.now()}_${file.name}`.replace(/\s+/g, "_");
      const path = `hostels/${hostelId}/rooms/${roomId}/${safeName}`;
      const fileRef = ref(storage, path);

      await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });

      const url = await getDownloadURL(fileRef);
      uploaded.push({ url, path });
    }

    return uploaded;
  }

  async function deleteStorageByPath(path: string) {
    await deleteObject(ref(storage, path));
  }

  const readyForWrite = !authLoading && role === "admin" && Boolean(resolvedHostelSlug);

  const onSubmit = async (data: RoomFormValues) => {
    // ✅ guard definitivo anti “slug null / race”
    if (!readyForWrite || !resolvedHostelSlug) {
      setFormError("Cargando tu hostel... probá de nuevo en 1 segundo.");
      return;
    }

    setFormError(null);
    setSaving(true);

    try {
      const hostelId = resolvedHostelSlug;

      const payloadBase = {
        name: data.name,
        price: Number(data.price),
        capacity: Number(data.capacity),
        description: data.description ?? "",
      };

      let roomId = initialData?.id;

      // 1) crear o actualizar base
      if (!roomId) {
        const newRef = await addDoc(collection(db, "hostels", hostelId, "rooms"), {
          ...payloadBase,
          imageUrls: [],
          imagePaths: [],
          createdAt: new Date(),
        });
        roomId = newRef.id;
      } else {
        await updateDoc(doc(db, "hostels", hostelId, "rooms", roomId), {
          ...payloadBase,
          updatedAt: new Date(),
        });
      }

      // 2) borrar marcadas
      if (pathsToDelete.length) {
        await Promise.allSettled(pathsToDelete.map((p) => deleteStorageByPath(p)));
      }

      // 3) subir nuevas
      const uploaded = files.length ? await uploadImages(hostelId, roomId, files) : [];
      const newUrls = uploaded.map((u) => u.url);
      const newPaths = uploaded.map((u) => u.path);

      // 4) finales
      const finalUrls = [...existingUrls, ...newUrls].slice(0, MAX_IMAGES);
      const finalPaths = [...existingPaths, ...newPaths].slice(0, MAX_IMAGES);

      await updateDoc(doc(db, "hostels", hostelId, "rooms", roomId), {
        imageUrls: finalUrls,
        imagePaths: finalPaths,
        updatedAt: new Date(),
      });

      previews.forEach((p) => URL.revokeObjectURL(p));
      setFiles([]);
      setPreviews([]);
      setPathsToDelete([]);

      onSuccess();
      onClose();
    } catch (e: any) {
      setFormError(e?.message || "Error guardando la habitación");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {initialData ? t("admin.rooms.modal.editTitle") : t("admin.rooms.modal.createTitle")}
      </DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          {!readyForWrite && (
            <Alert severity="info">
              Cargando permisos/hostel… (esto evita errores 403 al subir imágenes)
            </Alert>
          )}

          <TextField
            label={t("admin.rooms.form.name")}
            {...register("name", { required: t("admin.rooms.errors.nameRequired") })}
            error={!!errors.name}
            helperText={errors.name?.message as any}
          />

          <TextField
            label={t("admin.rooms.form.price")}
            type="number"
            {...register("price", {
              required: t("admin.rooms.errors.priceRequired"),
              min: { value: 1, message: t("admin.rooms.errors.priceMin") },
            })}
            error={!!errors.price}
            helperText={errors.price?.message as any}
          />

          <TextField
            label={t("admin.rooms.form.capacity")}
            type="number"
            {...register("capacity", {
              required: t("admin.rooms.errors.capacityRequired"),
              min: { value: 1, message: t("admin.rooms.errors.capacityMin") },
            })}
            error={!!errors.capacity}
            helperText={errors.capacity?.message as any}
          />

          <TextField
            label={t("admin.rooms.form.description")}
            multiline
            rows={3}
            {...register("description")}
          />

          {formError && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {formError}
            </Alert>
          )}

          {existingUrls.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Imágenes actuales
              </Typography>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {existingUrls.map((url, idx) => (
                  <Box key={`${url}-${idx}`} sx={{ position: "relative" }}>
                    <img
                      src={url}
                      alt={`existing-${idx}`}
                      style={{
                        width: 90,
                        height: 70,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #eee",
                      }}
                    />
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        const path = existingPaths[idx];
                        if (path) setPathsToDelete((prev) => [...prev, path]);

                        setExistingUrls((prev) => prev.filter((_, i) => i !== idx));
                        setExistingPaths((prev) => prev.filter((_, i) => i !== idx));
                      }}
                    >
                      Borrar
                    </Button>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Box>
            <Button
              variant="outlined"
              component="label"
              disabled={!readyForWrite || totalCount >= MAX_IMAGES}
            >
              {t("uploadImages")}
              <input
                hidden
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const selected = Array.from(e.target.files ?? []);
                  if (!selected.length) return;

                  try {
                    const remaining = Math.max(0, MAX_IMAGES - existingUrls.length - files.length);
                    const limited = selected.slice(0, remaining);

                    limited.forEach(validateFileBasics);

                    const nextPreviews = limited.map((f) => URL.createObjectURL(f));
                    setFiles((prev) => [...prev, ...limited]);
                    setPreviews((prev) => [...prev, ...nextPreviews]);
                  } catch (err: any) {
                    setFormError(err?.message ?? "Archivo inválido");
                  } finally {
                    e.currentTarget.value = "";
                  }
                }}
              />
            </Button>

            <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
              Máximo {MAX_IMAGES} imágenes. JPG/PNG/WebP. Final &lt;= {MAX_MB}MB (se comprimen).
            </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
              {previews.map((p, idx) => (
                <Box key={p} sx={{ position: "relative" }}>
                  <img
                    src={p}
                    alt={`preview-${idx}`}
                    style={{
                      width: 90,
                      height: 70,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #eee",
                    }}
                  />
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      URL.revokeObjectURL(p);
                      setPreviews((prev) => prev.filter((x) => x !== p));
                      setFiles((prev) => prev.filter((_, i) => i !== idx));
                    }}
                  >
                    {t("remove")}
                  </Button>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t("admin.rooms.common.cancel")}</Button>

        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={!isValid || saving || !readyForWrite}
        >
          {saving ? t("admin.rooms.common.saving") : t("admin.rooms.common.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}