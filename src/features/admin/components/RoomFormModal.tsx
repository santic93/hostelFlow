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
  CircularProgress,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { httpsCallable } from "firebase/functions";

import { storage, functions } from "../../../services/firebase";
import { useAuth } from "../../../app/providers/AuthContext";

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

type UploadedImage = {
  url: string;
  path: string;
};

export default function RoomFormModal({
  open,
  onClose,
  initialData,
  onSuccess,
  hostelSlug: hostelSlugProp,
}: Props) {
  const { t } = useTranslation();
  const { hostelSlug: hostelSlugCtx, loading: authLoading, canAccessAdmin } = useAuth();

  const resolvedHostelSlug = hostelSlugProp ?? hostelSlugCtx ?? null;

  const MAX_IMAGES = 6;
  const MAX_MB = 2;
  const ALLOWED_TYPES = useMemo(
    () => ["image/jpeg", "image/png", "image/webp"],
    []
  );

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
  const readyForWrite = !authLoading && canAccessAdmin && Boolean(resolvedHostelSlug);

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

    previews.forEach((p) => URL.revokeObjectURL(p));
    setFiles([]);
    setPreviews([]);
    setFormError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, reset, open]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p));
    };
  }, [previews]);

  function openToast(severity: ToastState["severity"], message: string) {
    setToast({ open: true, severity, message });
  }

  function closeToast() {
    setToast((prev) => ({ ...prev, open: false }));
  }

  function validateFileBasics(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        t("admin.rooms.messages.invalidFormat", "Formato inválido (JPG/PNG/WebP).")
      );
    }

    const mb = file.size / (1024 * 1024);
    if (mb > MAX_MB * 3) {
      throw new Error(
        t("admin.rooms.messages.tooLargePre", {
          mb: mb.toFixed(2),
        }) || `Archivo demasiado grande (${mb.toFixed(2)}MB)`
      );
    }
  }

  async function compressToJpeg(file: File): Promise<Blob> {
    const img = new Image();
    const url = URL.createObjectURL(file);

    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
          reject(new Error(t("admin.rooms.messages.invalidImage", "Imagen inválida.")));
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
      if (!ctx) {
        throw new Error(t("admin.rooms.messages.compressFailed", "No se pudo comprimir."));
      }

      ctx.drawImage(img, 0, 0, w, h);

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) =>
            b
              ? resolve(b)
              : reject(
                  new Error(t("admin.rooms.messages.compressFailed", "No se pudo comprimir."))
                ),
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
    const uploaded: UploadedImage[] = [];

    for (const file of filesToUpload) {
      const blob = await compressToJpeg(file);

      const sizeMb = blob.size / (1024 * 1024);
      if (sizeMb > MAX_MB) {
        throw new Error(
          t("admin.rooms.messages.tooLargeAfter", {
            mb: sizeMb.toFixed(2),
          }) || `La imagen quedó pesada (${sizeMb.toFixed(2)}MB)`
        );
      }

      const safeName = `${Date.now()}_${file.name}`
        .replace(/\s+/g, "_")
        .replace(/[^\w.-]/g, "");

      const path = `hostels/${hostelId}/rooms/${roomId}/${safeName}`;
      const fileRef = ref(storage, path);

      await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });

      const url = await getDownloadURL(fileRef);
      uploaded.push({ url, path });
    }

    return uploaded;
  }

  async function deleteStorageByPath(path: string) {
    if (!path) return;
    await deleteObject(ref(storage, path));
  }

  async function cleanupUploadedImages(uploaded: UploadedImage[]) {
    if (!uploaded.length) return;
    await Promise.allSettled(uploaded.map((img) => deleteStorageByPath(img.path)));
  }

  function cleanupLocalPreviews() {
    previews.forEach((p) => URL.revokeObjectURL(p));
    setFiles([]);
    setPreviews([]);
  }

  const onSubmit = async (data: RoomFormValues) => {
    if (!readyForWrite || !resolvedHostelSlug) {
      const msg = t("admin.rooms.messages.waitHostel", "Esperá a que cargue tu hostel/permisos…");
      setFormError(msg);
      openToast("info", t("admin.rooms.messages.waitHostelToast", "Cargando permisos…"));
      return;
    }

    setFormError(null);
    setSaving(true);

    const hostelSlug = resolvedHostelSlug;
    const payloadBase = {
      name: String(data.name ?? "").trim(),
      price: Number(data.price),
      capacity: Number(data.capacity),
      description: String(data.description ?? "").trim(),
    };

    let uploaded: UploadedImage[] = [];

    try {
      let roomId = initialData?.id;

      if (!roomId) {
        const createFn = httpsCallable(functions, "adminCreateRoom");
        const res = await createFn({
          hostelSlug,
          ...payloadBase,
          imageUrls: [],
          imagePaths: [],
        });

        roomId = String((res.data as any)?.roomId ?? "");
        if (!roomId) {
          throw new Error("No se recibió roomId.");
        }
      } else {
        const updateBaseFn = httpsCallable(functions, "adminUpdateRoom");
        await updateBaseFn({
          hostelSlug,
          roomId,
          ...payloadBase,
          imageUrls: existingUrls,
          imagePaths: existingPaths,
        });
      }

      uploaded = files.length ? await uploadImages(hostelSlug, roomId, files) : [];

      const newUrls = uploaded.map((u) => u.url);
      const newPaths = uploaded.map((u) => u.path);

      const finalUrls = [...existingUrls, ...newUrls].slice(0, MAX_IMAGES);
      const finalPaths = [...existingPaths, ...newPaths].slice(0, MAX_IMAGES);

      const updateFinalFn = httpsCallable(functions, "adminUpdateRoom");
      await updateFinalFn({
        hostelSlug,
        roomId,
        ...payloadBase,
        imageUrls: finalUrls,
        imagePaths: finalPaths,
      });

      if (pathsToDelete.length) {
        await Promise.allSettled(pathsToDelete.map((p) => deleteStorageByPath(p)));
      }

      cleanupLocalPreviews();
      setPathsToDelete([]);
      openToast("success", t("admin.rooms.messages.savedOk", "Guardado ✅"));
      onSuccess();
      onClose();
    } catch (e: any) {
      await cleanupUploadedImages(uploaded);

      const msg =
        e?.message ||
        t("admin.rooms.messages.saveError", "No se pudo guardar. Revisá permisos / logs.");

      setFormError(msg);
      openToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (saving) return;
          if (reason === "backdropClick") return;
          onClose();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          {initialData
            ? t("admin.rooms.modal.editTitle", "Editar habitación")
            : t("admin.rooms.modal.createTitle", "Crear habitación")}
        </DialogTitle>

        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {!readyForWrite && (
              <Alert severity="info">
                {t("admin.rooms.messages.loadingPermissions", "Cargando permisos…")}
              </Alert>
            )}

            <TextField
              label={t("admin.rooms.form.name", "Nombre")}
              {...register("name", {
                required: t("admin.rooms.errors.nameRequired", "Nombre requerido") as any,
                minLength: {
                  value: 2,
                  message: t("admin.rooms.errors.nameRequired", "Nombre requerido") as any,
                },
              })}
              error={!!errors.name}
              helperText={errors.name?.message as any}
              disabled={saving}
              fullWidth
            />

            <TextField
              label={t("admin.rooms.form.price", "Precio")}
              type="number"
              inputProps={{ min: 1, step: 1 }}
              {...register("price", {
                valueAsNumber: true,
                required: t("admin.rooms.errors.priceRequired", "Precio requerido") as any,
                min: { value: 1, message: t("admin.rooms.errors.priceMin", "Mínimo 1") as any },
              })}
              error={!!errors.price}
              helperText={errors.price?.message as any}
              disabled={saving}
              fullWidth
            />

            <TextField
              label={t("admin.rooms.form.capacity", "Capacidad")}
              type="number"
              inputProps={{ min: 1, step: 1 }}
              {...register("capacity", {
                valueAsNumber: true,
                required: t("admin.rooms.errors.capacityRequired", "Capacidad requerida") as any,
                min: {
                  value: 1,
                  message: t("admin.rooms.errors.capacityMin", "Mínimo 1") as any,
                },
              })}
              error={!!errors.capacity}
              helperText={errors.capacity?.message as any}
              disabled={saving}
              fullWidth
            />

            <TextField
              label={t("admin.rooms.form.description", "Descripción")}
              multiline
              rows={3}
              {...register("description")}
              disabled={saving}
              fullWidth
            />

            {formError && <Alert severity="error">{formError}</Alert>}

            {existingUrls.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 900 }}>
                  {t("admin.rooms.messages.currentImages", "Imágenes actuales")}
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
                          if (path) {
                            setPathsToDelete((prev) =>
                              prev.includes(path) ? prev : [...prev, path]
                            );
                          }

                          setExistingUrls((prev) => prev.filter((_, i) => i !== idx));
                          setExistingPaths((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        sx={{ mt: 0.5 }}
                      >
                        {t("admin.rooms.actions.delete", "Eliminar")}
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
                disabled={!readyForWrite || totalCount >= MAX_IMAGES || saving}
                sx={{ borderRadius: 999, textTransform: "none" }}
              >
                {t("admin.rooms.form.uploadImages", "Subir imágenes (hasta 6)")}
                <input
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => {
                    const selected = Array.from(e.target.files ?? []);
                    if (!selected.length) return;

                    try {
                      const remaining = Math.max(
                        0,
                        MAX_IMAGES - existingUrls.length - files.length
                      );
                      const limited = selected.slice(0, remaining);

                      limited.forEach(validateFileBasics);

                      const nextPreviews = limited.map((f) => URL.createObjectURL(f));
                      setFiles((prev) => [...prev, ...limited]);
                      setPreviews((prev) => [...prev, ...nextPreviews]);

                      openToast(
                        "info",
                        t("admin.rooms.messages.imagesSelected", { n: limited.length }) ||
                          `Imágenes: ${limited.length}`
                      );
                    } catch (err: any) {
                      const msg =
                        err?.message ||
                        t("admin.rooms.messages.invalidFile", "Archivo inválido");
                      setFormError(msg);
                      openToast("error", msg);
                    } finally {
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </Button>

              <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                {t("admin.rooms.messages.imagesHelp", { max: MAX_IMAGES, mb: MAX_MB }) ||
                  `Máximo ${MAX_IMAGES}. Recomendado JPG/PNG/WebP. Hasta ${MAX_MB}MB (post-compresión).`}
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
                      {t("admin.rooms.form.remove", "Quitar")}
                    </Button>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={saving}>
            {t("admin.rooms.common.cancel", "Cancelar")}
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={!isValid || saving || !readyForWrite}
            sx={{ borderRadius: 999, minWidth: 140 }}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving
              ? t("admin.rooms.common.saving", "Guardando…")
              : t("admin.rooms.common.save", "Guardar")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3200}
        onClose={closeToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeToast}
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