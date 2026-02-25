import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";

import { useEffect, useState } from "react";
import { db } from "../../../services/firebase";

type RoomFormValues = {
  name: string;
  price: number;
  capacity: number;
  description: string;
  imageUrl?: string; // ✅ opcional
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
      imageUrl: data.imageUrl?.trim() ?? "", // ✅
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
        {initialData ? "Editar Habitación" : "Crear Habitación"}
      </DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Nombre"
            {...register("name", { required: "El nombre es obligatorio" })}
            error={!!errors.name}
            helperText={errors.name?.message}
          />

          <TextField
            label="Precio"
            type="number"
            {...register("price", {
              required: "Precio obligatorio",
              min: { value: 1, message: "Debe ser mayor a 0" },
            })}
            error={!!errors.price}
            helperText={errors.price?.message}
          />

          <TextField
            label="Capacidad"
            type="number"
            {...register("capacity", {
              required: "Capacidad obligatoria",
              min: { value: 1, message: "Mínimo 1 persona" },
            })}
            error={!!errors.capacity}
            helperText={errors.capacity?.message}
          />

          <TextField
            label="Descripción"
            multiline
            rows={3}
            {...register("description")}
          />
          {/* 
          ////esto por ahora reemplaza la imagen */}
          <TextField
            label="Image URL (optional)"
            {...register("imageUrl", {
              pattern: {
                value: /^https?:\/\/.+/i,
                message: "Debe ser una URL válida (http/https)",
              },
            })}
            error={!!errors.imageUrl}
            helperText={errors.imageUrl?.message ?? "Ej: https://.../foto.jpg"}
          />
        </Box>

        {/* ///SE IMPLEMENTA EL DIA DE MAÑANA CON IMAGEN Y STORAGE DE FIREBASE */}
        {/* <Button variant="outlined" component="label">
          Upload image
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
            }}
          />
        </Button> */}

        {file && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Selected: {file.name}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={!isValid || saving}
        >
          {saving ? "Saving..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}