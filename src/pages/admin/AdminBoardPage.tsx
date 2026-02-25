import { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { collection, deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { Seo } from "../../components/Seo";
import { db } from "../../services/firebase";

type Room = {
    id: string;
    name: string;
    description: string;
    price: number;
    capacity: number;
    imageUrl: string;
    createdAt: Date | null;
};

export default function AdminRoomsPage() {
    const { hostelSlug } = useParams<{ hostelSlug: string }>();
    const [rooms, setRooms] = useState<Room[]>([]);

    const fetchRooms = async () => {
        if (!hostelSlug) return;

        const q = query(
            collection(db, "hostels", hostelSlug, "rooms"),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        const data: Room[] = snapshot.docs.map((d) => {
            const raw = d.data() as any;
            return {
                id: d.id,
                name: raw.name ?? "",
                description: raw.description ?? "",
                price: raw.price ?? 0,
                capacity: raw.capacity ?? 0,
                imageUrl: raw.imageUrl ?? "",
                createdAt: raw.createdAt?.toDate?.() ?? null,
            };
        });

        setRooms(data);
    };

    useEffect(() => {
        fetchRooms();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hostelSlug]);

    const handleDelete = async (id: string) => {
        if (!hostelSlug) return;
        await deleteDoc(doc(db, "hostels", hostelSlug, "rooms", id));
        setRooms((prev) => prev.filter((r) => r.id !== id));
    };

    const columns: GridColDef[] = [
        { field: "name", headerName: "Nombre", flex: 1 },
        { field: "price", headerName: "Precio", width: 120 },
        { field: "capacity", headerName: "Capacidad", width: 120 },
        {
            field: "actions",
            headerName: "Acciones",
            width: 220,
            renderCell: (params) => (
                <>
                    <Button size="small" disabled>
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
        <>
            <Seo title="Rooms — REDSTAYS" description="Admin rooms" noindex />
            <Box>
                <Typography variant="h3" gutterBottom>Rooms</Typography>

                <DataGrid rows={rooms} columns={columns} autoHeight pageSizeOptions={[5, 10]} />
            </Box>
        </>
    );
}