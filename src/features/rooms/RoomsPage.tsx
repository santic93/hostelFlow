import { Container, Typography, Grid, Box, Button } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";



type Room = {
    id: string;
    name: string;
    description: string;
    price: number;
    capacity?: number;
    imageUrl?: string; // si no lo tenés, lo dejamos opcional
};

export const RoomsPage = () => {
    const { hostelSlug } = useParams<{ hostelSlug: string }>();
    const [rooms, setRooms] = useState<Room[]>([]);

    useEffect(() => {
        const fetchRooms = async () => {
            if (!hostelSlug) return;

            const snap = await getDocs(collection(db, "hostels", hostelSlug, "rooms"));
            const data: Room[] = snap.docs.map((d) => {
                const raw = d.data() as any;
                return {
                    id: d.id,
                    name: raw.name ?? "",
                    description: raw.description ?? "",
                    price: raw.price ?? 0,
                    capacity: raw.capacity ?? 0,
                    imageUrl: raw.imageUrl ?? raw.image ?? "", // por si venías usando "image"
                };
            });

            setRooms(data);
        };

        fetchRooms();
    }, [hostelSlug]);

    return (
        <Container sx={{ py: 10 }}>
            <Typography variant="h2" sx={{ mb: 8 }}>
                Our Rooms
            </Typography>

            <Grid container spacing={6}>
                {rooms.map((room) => (
                    <Grid key={room.id} sx={{ xs: 12, md: 4 }}>
                        <Box
                            component="img"
                            src={room.imageUrl || "https://via.placeholder.com/800x600?text=Room"}
                            sx={{
                                width: "100%",
                                aspectRatio: "4 / 3",
                                objectFit: "cover",
                                borderRadius: 2,
                                mb: 3,
                            }}
                        />

                        <Typography variant="h5">{room.name}</Typography>

                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                            {room.description}
                        </Typography>

                        <Typography sx={{ mb: 3 }}>
                            From ${room.price} / night
                        </Typography>

                        <Button
                            variant="outlined"
                            fullWidth
                            component={RouterLink}
                            to={`/${hostelSlug}/rooms/${room.id}`} // ✅ detalle
                        >
                            VIEW ROOM
                        </Button>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};