import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { Container, Typography, Grid, Box, Button } from "@mui/material";
import type { Room } from "../../types/room"; // ajustá path
import { db } from "../../services/firebase";
import SafeImage from "../../components/SafeImage";


import { useTranslation } from "react-i18next";

export const RoomsPage = () => {
    const { hostelSlug } = useParams<{ hostelSlug: string }>();
    const { t } = useTranslation();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRooms = async () => {
            if (!hostelSlug) return;

            setLoading(true);

            const snap = await getDocs(
                collection(db, "hostels", hostelSlug, "rooms")
            );

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
            setLoading(false);
        };

        fetchRooms();
    }, [hostelSlug]);

    if (loading) {
        return (
            <Container sx={{ py: 10 }}>
                <Typography>{t("rooms.loading")}</Typography>
            </Container>
        );
    }

    return (
        <Container sx={{ py: 10 }}>
            <Typography variant="h2" sx={{ mb: 8 }}>
                {t("rooms.title")}
            </Typography>

            {rooms.length === 0 ? (
                <Typography sx={{ color: "text.secondary" }}>
                    {t("rooms.noRooms")}
                </Typography>
            ) : (
                <Grid container spacing={6}>
                    {rooms.map((room) => (
                        <Grid key={room.id} sx={{ xs: 12, md: 4 }}>
                            <SafeImage
                                src={room.imageUrl}
                                alt={room.name}
                                sx={{ mb: 3 }}
                            />

                            <Typography variant="h5">{room.name}</Typography>

                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mb: 2 }}
                            >
                                {room.description}
                            </Typography>

                            <Typography sx={{ mb: 3 }}>
                                {t("rooms.fromPerNight", { price: room.price })}
                            </Typography>

                            <Button
                                variant="outlined"
                                fullWidth
                                component={RouterLink}
                                to={`/${hostelSlug}/rooms/${room.id}`}
                            >
                                {t("rooms.viewRoom")}
                            </Button>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
};