import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid, } from "@mui/x-data-grid";
import { Box, Button, Typography } from "@mui/material";
import { db } from "../../../lib/firebase";

type Room = {
    id: string;
    name: string;
    price: number;
    capacity: number;
};

export default function RoomsSection() {
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
                <Button
                    color="error"
                    size="small"
                    onClick={() => handleDelete(params.row.id)}
                >
                    Eliminar
                </Button>
            ),
        },
    ];

    return (
        <Box>
            <Typography variant="h4" mb={2}>
                Gestión de Habitaciones
            </Typography>

            <DataGrid
                rows={rooms}
                columns={columns}
                autoHeight
                pageSizeOptions={[5, 10]}
            />
        </Box>
    );
}