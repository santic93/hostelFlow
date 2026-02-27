import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { Container, Typography, Grid, Button, Box, Chip, Card, CardContent } from "@mui/material";
import type { Room } from "../../types/room"; // ajustá path
import { db } from "../../services/firebase";
import { useTranslation } from "react-i18next";
import { RoomCardCarousel } from "../../components/RoomCardCarousel";

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
        <Typography variant="h2" sx={{ mb: 1 }}>
          {t("rooms.title")}
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>
          {t("rooms.subtitle", "Elegí tu habitación y reservá en minutos.")}
        </Typography>
      </Box>

      {rooms.length === 0 ? (
        <Typography sx={{ color: "text.secondary" }}>{t("rooms.noRooms")}</Typography>
      ) : (
        <Grid container spacing={{ xs: 3, md: 4 }}>
          {rooms.map((room) => {
            const urls = (room.imageUrls ?? []).filter(Boolean);

            return (
              <Grid key={room.id} sx={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 160ms ease, box-shadow 160ms ease",
                    "&:hover": {
                      transform: { md: "translateY(-4px)" },
                      boxShadow: { md: "0 18px 50px rgba(0,0,0,0.10)" },
                    },
                  }}
                >
                  <RoomCardCarousel urls={urls} alt={room.name} />

                  <CardContent sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.2, flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {room.name}
                      </Typography>

                      <Chip
                        size="small"
                        label={`${room.capacity} ${room.capacity === 1 ? "pax" : "pax"}`}
                        sx={{ borderRadius: 999 }}
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: 56, // mantiene altura consistente aunque un room tenga menos texto
                      }}
                    >
                      {room.description || t("rooms.defaultDesc", "Cómoda, luminosa y lista para tu estadía.")}
                    </Typography>

                    <Box
                      sx={{
                        mt: "auto",
                        pt: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {t("rooms.fromPerNight", { price: room.price })}
                        </Typography>
                        <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                          ${room.price}
                          <Typography component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>
                            {" "}
                            / noche
                          </Typography>
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        component={RouterLink}
                        to={`/${hostelSlug}/rooms/${room.id}`}
                        sx={{
                          borderRadius: 999,
                          textTransform: "none",
                          fontWeight: 800,
                          px: 2.2,
                          py: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t("rooms.viewRoom")}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};