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
  Snackbar,
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
  hostelSlug?: string;
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

type ToastState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
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

  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "info",
  });

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

    // limpiar selección local
    previews.forEach((p) => URL.revokeObjectURL(p));
    setFiles([]);
    setPreviews([]);

    setFormError(null);
  }, [initialData, reset, open]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p));
    };
  }, [previews]);

  function openToast(severity: ToastState["severity"], message: string) {
    setToast({ open: true, severity, message });
  }

  function validateFileBasics(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(t("admin.rooms.messages.invalidFormat"));
    }
    const mb = file.size / (1024 * 1024);
    if (mb > MAX_MB * 3) {
      throw new Error(t("admin.rooms.messages.tooLargePre", { mb: mb.toFixed(2) }));
    }
  }

  async function compressToJpeg(file: File): Promise<Blob> {
    const img = new Image();
    const url = URL.createObjectURL(file);

    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(t("admin.rooms.messages.invalidImage")));
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
          (b) => (b ? resolve(b) : reject(new Error(t("admin.rooms.messages.compressFailed")))),
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
        throw new Error(t("admin.rooms.messages.tooLargeAfter", { mb: sizeMb.toFixed(2) }));
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
    if (!readyForWrite || !resolvedHostelSlug) {
      setFormError(t("admin.rooms.messages.waitHostel"));
      openToast("info", t("admin.rooms.messages.waitHostelToast"));
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

      // limpiar selección local
      previews.forEach((p) => URL.revokeObjectURL(p));
      setFiles([]);
      setPreviews([]);
      setPathsToDelete([]);

      openToast("success", t("admin.rooms.messages.savedOk"));

      onSuccess();
      onClose();
    } catch (e: any) {
      const msg = e?.message || t("admin.rooms.messages.saveError");
      setFormError(msg);
      openToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
        <DialogTitle>
          {initialData ? t("admin.rooms.modal.editTitle") : t("admin.rooms.modal.createTitle")}
        </DialogTitle>

        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {!readyForWrite && (
              <Alert severity="info">{t("admin.rooms.messages.loadingPermissions")}</Alert>
            )}

            <TextField
              label={t("admin.rooms.form.name")}
              {...register("name", { required: t("admin.rooms.errors.nameRequired") })}
              error={!!errors.name}
              helperText={errors.name?.message as any}
              disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
            />

            <TextField
              label={t("admin.rooms.form.description")}
              multiline
              rows={3}
              {...register("description")}
              disabled={saving}
            />

            {formError && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {formError}
              </Alert>
            )}

            {/* EXISTENTES */}
            {existingUrls.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t("admin.rooms.messages.currentImages")}
                </Typography>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {existingUrls.map((url, idx) => (
                    <Box key={`${url}-${idx}`} sx={{ position: "relative" }}>
                      <Box
                        component="img"
                        src={url}
                        alt={`existing-${idx}`}
                        sx={{
                          width: 92,
                          height: 72,
                          objectFit: "cover",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          display: "block",
                        }}
                      />

                      <Button
                        size="small"
                        color="error"
                        disabled={saving}
                        onClick={() => {
                          const path = existingPaths[idx];
                          if (path) setPathsToDelete((prev) => [...prev, path]);

                          setExistingUrls((prev) => prev.filter((_, i) => i !== idx));
                          setExistingPaths((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        sx={{ mt: 0.5 }}
                      >
                        {t("admin.rooms.actions.delete")}
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* SUBIR NUEVAS */}
            <Box>
              <Button
                variant="outlined"
                component="label"
                disabled={!readyForWrite || totalCount >= MAX_IMAGES || saving}
                sx={{ borderRadius: 999, textTransform: "none" }}
              >
                {t("admin.rooms.form.uploadImages")}
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

                      openToast("info", t("admin.rooms.messages.imagesSelected", { n: limited.length }));
                    } catch (err: any) {
                      const msg = err?.message ?? t("admin.rooms.messages.invalidFile");
                      setFormError(msg);
                      openToast("error", msg);
                    } finally {
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </Button>

              <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                {t("admin.rooms.messages.imagesHelp", { max: MAX_IMAGES, mb: MAX_MB })}
              </Typography>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                {previews.map((p, idx) => (
                  <Box key={p} sx={{ position: "relative" }}>
                    <Box
                      component="img"
                      src={p}
                      alt={`preview-${idx}`}
                      sx={{
                        width: 92,
                        height: 72,
                        objectFit: "cover",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        display: "block",
                      }}
                    />
                    <Button
                      size="small"
                      color="error"
                      disabled={saving}
                      onClick={() => {
                        URL.revokeObjectURL(p);
                        setPreviews((prev) => prev.filter((x) => x !== p));
                        setFiles((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      sx={{ mt: 0.5 }}
                    >
                      {t("admin.rooms.form.remove")}
                    </Button>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            {t("admin.rooms.common.cancel")}
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={!isValid || saving || !readyForWrite}
            sx={{ borderRadius: 999 }}
          >
            {saving ? t("admin.rooms.common.saving") : t("admin.rooms.common.save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast moderno minimalista */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3200}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast((p) => ({ ...p, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{
            borderRadius: 3,
            boxShadow: "0 16px 40px rgba(0,0,0,0.20)",
            alignItems: "center",
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}