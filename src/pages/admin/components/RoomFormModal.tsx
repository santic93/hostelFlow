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
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

type RoomFormValues = {
  name: string;
  price: number;
  capacity: number;
  description: string;
  imageUrls?: string[]; // ✅ se guarda como array
};

type Props = {
  open: boolean;
  onClose: () => void;
  hostelSlug?: string;
  initialData?: {
    id: string;
    name: string;
    price: number;
    capacity: number;
    description: string;
    imageUrls?: string[];
  } | null;
  onSuccess: () => void;
};

export default function RoomFormModal({
  open,
  onClose,
  initialData,
  onSuccess,
  hostelSlug,
}: Props) {
  const { t } = useTranslation();
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
      imageUrls: [],
    },
  });

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        price: initialData.price,
        capacity: initialData.capacity,
        description: initialData.description,
        imageUrls: initialData.imageUrls ?? [],
      });
    } else {
      reset({
        name: "",
        price: 0,
        capacity: 1,
        description: "",
        imageUrls: [],
      });
    }
  }, [initialData, reset]);
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p));
    };
  }, [previews]);

  const MAX_IMAGES = 6;
  const MAX_MB = 2;

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

  async function uploadImages(hostelSlug: string, roomId: string, files: File[]) {
    const urls: string[] = [];

    for (const file of files) {
      const blob = await compressToJpeg(file);

      const sizeMb = blob.size / (1024 * 1024);
      if (sizeMb > MAX_MB) {
        throw new Error(`Una imagen quedó muy pesada (${sizeMb.toFixed(2)}MB). Probá otra.`);
      }

      const safeName = `${Date.now()}_${file.name}`.replace(/\s+/g, "_");
      const path = `hostels/${hostelSlug}/rooms/${roomId}/${safeName}`;
      const fileRef = ref(storage, path);

      await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
      const url = await getDownloadURL(fileRef);
      urls.push(url);
    }

    return urls;
  }

  const onSubmit = async (data: RoomFormValues) => {
    if (!hostelSlug) return;

    setFormError(null);
    setSaving(true);

    try {
      const payloadBase = {
        name: data.name,
        price: Number(data.price),
        capacity: Number(data.capacity),
        description: data.description ?? "",
      };

      // ✅ 1) crear o usar roomId
      let roomId = initialData?.id;

      if (!roomId) {
        const newRef = await addDoc(collection(db, "hostels", hostelSlug, "rooms"), {
          ...payloadBase,
          imageUrls: [],
          createdAt: new Date(),
        });
        roomId = newRef.id;
      } else {
        await updateDoc(doc(db, "hostels", hostelSlug, "rooms", roomId), {
          ...payloadBase,
          updatedAt: new Date(),
        });
      }

      // ✅ 2) subir nuevas imágenes
      const newUrls = files.length ? await uploadImages(hostelSlug, roomId, files) : [];

      // ✅ 3) merge con existentes (las del doc actual)
      const existing = (initialData?.imageUrls ?? []);
      const finalUrls = [...existing, ...newUrls].slice(0, MAX_IMAGES);

      // ✅ 4) guardar urls finales
      await updateDoc(doc(db, "hostels", hostelSlug, "rooms", roomId), {
        imageUrls: finalUrls,
        updatedAt: new Date(),
      });

      // ✅ limpiar
      previews.forEach((p) => URL.revokeObjectURL(p));
      setFiles([]);
      setPreviews([]);

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
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box>
            <Button variant="outlined" component="label">
              {t("admin.rooms.form.uploadImages") ?? "Subir imágenes (hasta 6)"}
              <input
                hidden
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const selected = Array.from(e.target.files ?? []);
                  if (!selected.length) return;

                  const max = 6;
                  const roomImgsCount = (initialData?.imageUrls?.length ?? 0);

                  // total permitido (existentes + nuevas)
                  const remaining = Math.max(0, max - roomImgsCount - files.length);
                  const limited = selected.slice(0, remaining);

                  const nextPreviews = limited.map((f) => URL.createObjectURL(f));
                  setFiles((prev) => [...prev, ...limited]);
                  setPreviews((prev) => [...prev, ...nextPreviews]);

                  e.currentTarget.value = "";
                }}
              />
            </Button>

            <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
              Máximo 6 imágenes. Recomendado: JPG/PNG, hasta ~2MB.
            </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
              {previews.map((p, idx) => (
                <Box key={p} sx={{ position: "relative" }}>
                  <img
                    src={p}
                    alt={`preview-${idx}`}
                    style={{ width: 90, height: 70, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }}
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
                    Quitar
                  </Button>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>


      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>

        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={!isValid || saving}
        >
          {saving ? t("common.saving") : t("common.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}