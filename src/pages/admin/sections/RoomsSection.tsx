import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid, } from "@mui/x-data-grid";
import { Box, Button, Typography } from "@mui/material";
import { db, storage } from "../../../services/firebase";
import RoomFormModal from "../components/RoomFormModal";
import { useParams } from "react-router-dom";
import { deleteObject, ref } from "firebase/storage";
type Room = {
  id: string;
  name: string;
  price: number;
  capacity: number;
  description: string;
  imageUrls: string[];
  imagePaths?: string[];
};

export default function RoomsSection() {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();

  const [openModal, setOpenModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [rooms, setRooms] = useState<Room[]>([]);

  const fetchRooms = async () => {
    if (!hostelSlug) return;

    const snapshot = await getDocs(collection(db, "hostels", hostelSlug, "rooms"));

    const data: Room[] = snapshot.docs.map((docSnap) => {
      const raw = docSnap.data() as any;

      return {
        id: docSnap.id,
        name: raw.name ?? "",
        price: raw.price ?? 0,
        capacity: raw.capacity ?? 0,
        description: raw.description ?? "",
        imageUrls: raw.imageUrls ?? (raw.imageUrl ? [raw.imageUrl] : []),
        imagePaths: raw.imagePaths ?? [],
      };
    });

    setRooms(data);
  };

  useEffect(() => {
    fetchRooms();
  }, [hostelSlug]);

  const handleDelete = async (id: string) => {
    if (!hostelSlug) return;

    const roomRef = doc(db, "hostels", hostelSlug, "rooms", id);
    const snap = await getDoc(roomRef);

    if (snap.exists()) {
      const data = snap.data() as any;
      const paths: string[] = data.imagePaths ?? [];

      await Promise.allSettled(paths.map((p) => deleteObject(ref(storage, p))));
    }

    await deleteDoc(roomRef);
    setRooms((prev) => prev.filter((room) => room.id !== id));
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Nombre", flex: 1 },
    { field: "price", headerName: "Precio", width: 120 },
    { field: "capacity", headerName: "Capacidad", width: 120 },
    {
      field: "actions",
      headerName: "Acciones",
      width: 180,
      renderCell: (params) => (
        <>
          <Button
            size="small"
            onClick={() => {
              setSelectedRoom(params.row);
              setOpenModal(true);
            }}
          >
            Editar
          </Button>

          <Button size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            Eliminar
          </Button>
        </>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" mb={2}>
        Gestión de Habitaciones
      </Typography>

      <Button
        variant="contained"
        sx={{ mb: 2 }}
        onClick={() => {
          setSelectedRoom(null);
          setOpenModal(true);
        }}
      >
        Crear Habitación
      </Button>

      <DataGrid rows={rooms} columns={columns} autoHeight pageSizeOptions={[5, 10]} />

      <RoomFormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        initialData={selectedRoom}
        onSuccess={fetchRooms}
        hostelSlug={hostelSlug}
      />
    </Box>
  );
}