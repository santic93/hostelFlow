import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { Container, Typography, Grid, Box, Button } from "@mui/material";

import type { Room } from "../../types/room"; // ajustá path
import { db } from "../../services/firebase";
import SafeImage from "../../components/SafeImage";

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
                    price: raw.price ?? 0,
                    capacity: raw.capacity ?? 1,
                    description: raw.description ?? "",
                    imageUrl: raw.imageUrl ?? "",
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
                        {/* <Box
                            component="img"
                           src={room.imageUrl || "https://via.placeholder.com/1200x600?text=Room"}
                            sx={{
                                width: "100%",
                                aspectRatio: "4 / 3",
                                objectFit: "cover",
                                borderRadius: 2,
                                mb: 3,
                                bgcolor: "grey.100",
                            }}
                        /> */}
                        <SafeImage
                            src={room.imageUrl}
                            alt={room.name}
                            sx={{ mb: 3 }}
                        />
                        <Typography variant="h5">{room.name}</Typography>

                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                            {room.description}
                        </Typography>

                        <Typography sx={{ mb: 3 }}>From ${room.price} / night</Typography>

                        <Button
                            variant="outlined"
                            fullWidth
                            component={RouterLink}
                            to={`/${hostelSlug}/rooms/${room.id}`}
                        >
                            VIEW ROOM
                        </Button>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};