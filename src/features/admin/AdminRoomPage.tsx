import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import type { Room } from "../../types/room";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid, } from "@mui/x-data-grid";
import { Button, Box, Typography } from "@mui/material";
import { db } from "../../services/firebase";


export default function AdminRoomsPage() {
    const [rooms, setRooms] = useState<Room[]>([]);

    const fetchRooms = async () => {
        const snapshot = await getDocs(collection(db, "rooms"));

        const data: Room[] = snapshot.docs.map((docSnap) => {
            const raw = docSnap.data();

            return {
                id: docSnap.id,
                name: raw.name ?? "",
                description: raw.description ?? "",
                price: raw.price ?? 0,
                capacity: raw.capacity ?? 0,
                imageUrl: raw.imageUrl ?? "",
                createdAt: raw.createdAt?.toDate() ?? null,
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
            width: 200,
            renderCell: (params) => (
                <>
                    <Button size="small">Editar</Button>
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

            <DataGrid
                rows={rooms}
                columns={columns}
                autoHeight
                pageSizeOptions={[5, 10]}
            />
        </Box>
    );
}