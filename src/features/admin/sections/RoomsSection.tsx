import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid, } from "@mui/x-data-grid";
import { Box, Button, Typography } from "@mui/material";
import { db } from "../../../services/firebase";
import RoomFormModal from "../components/RoomFormModal";

type Room = {
    id: string;
    name: string;
    price: number;
    capacity: number;
};
export default function RoomsSection() {
  const [openModal, setOpenModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [rooms, setRooms] = useState<Room[]>([]);

  const fetchRooms = async () => {
    const snapshot = await getDocs(collection(db, "rooms"));

    const data: Room[] = snapshot.docs.map((docSnap) => {
      const raw = docSnap.data();

      return {
        id: docSnap.id,
        name: raw.name ?? "",
        price: raw.price ?? 0,
        capacity: raw.capacity ?? 0,
        description: raw.description ?? "",
      };
    });

    setRooms(data);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "rooms", id));
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

          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
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

      {/* 🔥 BOTÓN CREAR (ESTO TE FALTABA) */}
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

      <DataGrid
        rows={rooms}
        columns={columns}
        autoHeight
        pageSizeOptions={[5, 10]}
      />

      {/* 🔥 MODAL FUERA DEL DATAGRID */}
      <RoomFormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        initialData={selectedRoom}
        onSuccess={fetchRooms}
      />
    </Box>
  );
}