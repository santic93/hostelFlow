import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { db } from "../../../services/firebase";

type RoomFormValues = {
  name: string;
  price: number;
  capacity: number;
  description: string;
  imageUrl?: string;
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
      imageUrl: "",
    },
  });

  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        name: "",
        price: 0,
        capacity: 1,
        description: "",
        imageUrl: "",
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: RoomFormValues) => {
    if (!hostelSlug) return;

    const payload = {
      name: data.name,
      price: Number(data.price),
      capacity: Number(data.capacity),
      description: data.description ?? "",
      imageUrl: data.imageUrl?.trim() ?? "",
    };

    if (initialData?.id) {
      await updateDoc(doc(db, "hostels", hostelSlug, "rooms", initialData.id), payload);
    } else {
      await addDoc(collection(db, "hostels", hostelSlug, "rooms"), {
        ...payload,
        createdAt: new Date(),
      });
    }

    onSuccess();
    onClose();
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

          <TextField
            label={t("admin.rooms.form.imageUrl")}
            {...register("imageUrl", {
              pattern: {
                value: /^https?:\/\/.+/i,
                message: t("admin.rooms.errors.imageUrlInvalid"),
              },
            })}
            error={!!errors.imageUrl}
            helperText={(errors.imageUrl?.message as any) ?? t("admin.rooms.form.imageUrlHelp")}
          />
        </Box>

        {file && (
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 2 }}>
            {t("admin.rooms.form.selectedFile", { name: file.name })}
          </Typography>
        )}
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