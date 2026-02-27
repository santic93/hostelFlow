import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { Container, Typography, Grid, Button, CardActionArea, Box, Chip, Card } from "@mui/material";
import type { Room } from "../../types/room"; // ajustá path
import { db } from "../../services/firebase";



import { useTranslation } from "react-i18next";
import { RoomImageCarousel } from "../../components/RoomImageCarrousel";

export const RoomsPage = () => {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const { t } = useTranslation();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!hostelSlug) return;

      setLoading(true);

      const snap = await getDocs(collection(db, "hostels", hostelSlug, "rooms"));

      const data: Room[] = snap.docs.map((d) => {
        const raw = d.data() as any;
        return {
          id: d.id,
          name: raw.name ?? "",
          price: raw.price ?? 0,
          capacity: raw.capacity ?? 1,
          description: raw.description ?? "",
          imageUrls: raw.imageUrls ?? (raw.imageUrl ? [raw.imageUrl] : []),
        };
      });

      setRooms(data);
      setLoading(false);
    };

    fetchRooms();
  }, [hostelSlug]);

  if (loading) {
    return (
      <Container sx={{ py: { xs: 6, md: 10 } }}>
        <Typography>{t("rooms.loading")}</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ py: { xs: 6, md: 10 } }}>
      <Box sx={{ mb: { xs: 4, md: 6 } }}>
        <Typography variant="h2" sx={{ mb: 1, fontSize: { xs: 34, md: 48 } }}>
          {t("rooms.title")}
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>
          {rooms.length ? `${rooms.length} habitaciones disponibles` : t("rooms.noRooms")}
        </Typography>
      </Box>

      {rooms.length === 0 ? (
        <Typography sx={{ color: "text.secondary" }}>{t("rooms.noRooms")}</Typography>
      ) : (
        <Grid container spacing={{ xs: 3, md: 4 }}>
          {rooms.map((room) => (
            <Grid key={room.id} sx={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "transform .18s ease, box-shadow .18s ease",
                  "&:hover": {
                    transform: { md: "translateY(-2px)" },
                    boxShadow: { md: "0 16px 40px rgba(0,0,0,0.10)" },
                  },
                }}
              >
                <CardActionArea
                  component={RouterLink}
                  to={`/${hostelSlug}/rooms/${room.id}`}
                  sx={{ display: "block" }}
                >
                  <Box sx={{ p: 2 }}>
                    <RoomImageCarousel images={room.imageUrls ?? []} alt={room.name} ratio="4 / 3" />

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                        {room.name}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          mt: 0.75,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          minHeight: 40,
                        }}
                      >
                        {room.description || "Habitación cómoda y lista para tu estadía."}
                      </Typography>

                      <Box
                        sx={{
                          mt: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                        }}
                      >
                        <Typography sx={{ fontWeight: 700 }}>
                          {t("rooms.fromPerNight", { price: room.price })}
                        </Typography>

                        <Chip
                          size="small"
                          label={`${room.capacity} ${room.capacity === 1 ? "persona" : "personas"}`}
                          sx={{ borderRadius: 999 }}
                        />
                      </Box>

                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{ mt: 2, borderRadius: 999, textTransform: "none" }}
                      >
                        {t("rooms.viewRoom")}
                      </Button>
                    </Box>
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};