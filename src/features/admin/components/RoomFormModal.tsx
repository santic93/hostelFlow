import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { addDoc, collection, updateDoc, doc, setDoc } from "firebase/firestore";

import { useEffect, useState } from "react";
import { db, storage } from "../../../services/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
type RoomFormValues = {
  name: string;
  price: number;
  capacity: number;
  description: string;
  imageUrl?: string; // ✅
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
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: RoomFormValues) => {
    if (!hostelSlug) {
      alert("Missing hostelSlug");
      return;
    }

    try {
      setSaving(true);

      let imageUrl = initialData ? (initialData as any)?.imageUrl ?? "" : "";

      // 1) Si hay archivo nuevo, subimos a Storage y obtenemos URL
      if (file) {
        const roomId = initialData?.id ?? crypto.randomUUID();

        // path: hostels/{slug}/rooms/{roomId}/cover.jpg
        const storageRef = ref(storage, `hostels/${hostelSlug}/rooms/${roomId}/cover`);

        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);

        // si estás creando, usamos roomId manual (setDoc) para que coincida con el storage path
        if (!initialData?.id) {
          await setDoc(
            doc(db, "hostels", hostelSlug, "rooms", roomId),
            {
              ...data,
              imageUrl,
              createdAt: new Date(),
            },
            { merge: true }
          );

          onSuccess();
          onClose();
          setFile(null);
          return;
        }
      }

      // 2) Update o create sin file
      if (initialData?.id) {
        await updateDoc(doc(db, "hostels", hostelSlug, "rooms", initialData.id), {
          ...data,
          ...(imageUrl ? { imageUrl } : {}),
        });
      } else {
        await addDoc(collection(db, "hostels", hostelSlug, "rooms"), {
          ...data,
          imageUrl: imageUrl ?? "",
          createdAt: new Date(),
        });
      }

      onSuccess();
      onClose();
      setFile(null);
    } finally {
      setSaving(false);
    }
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
        </Box>
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