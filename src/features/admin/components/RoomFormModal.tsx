import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from "@mui/material";
import { useForm } from "react-hook-form";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";

import { useEffect } from "react";
import { db } from "../../../services/firebase";

type RoomFormValues = {
  name: string;
  price: number;
  capacity: number;
  description: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
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
    if (initialData?.id) {
      await updateDoc(doc(db, "rooms", initialData.id), data);
    } else {
      await addDoc(collection(db, "rooms"), {
        ...data,
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
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={!isValid}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}