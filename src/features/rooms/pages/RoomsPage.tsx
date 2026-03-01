import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { Box, Button, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { useTranslation } from "react-i18next";
import { db } from "../../../services/firebase";
import { RoomCardCarousel } from "../../../components/RoomCardCarousel";


type Room = {
  id: string;
  name: string;
  price: number;
  capacity: number;
  description: string;
  imageUrls: string[];
};

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
      <Container sx={{ py: 5 }}>
        <Typography sx={{ opacity: 0.75 }}>{t("rooms.loading")}</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h2">{t("rooms.title")}</Typography>
        <Typography sx={{ color: "text.secondary" }}>
          {t("rooms.subtitle")}
        </Typography>
      </Stack>

      {rooms.length === 0 ? (
        <Typography sx={{ opacity: 0.75 }}>{t("rooms.noRooms")}</Typography>
      ) : (
        <Grid container spacing={2}>
          {rooms.map((room) => {
            const urls = (room.imageUrls ?? []).filter(Boolean);
            return (
              <Grid item key={room.id} xs={12} sm={6} md={4}>
                <Card sx={{ overflow: "hidden" }}>
                  <Box sx={{ position: "relative" }}>
                    <RoomCardCarousel urls={urls} alt={room.name} />
                    <Chip
                      label={t("rooms.capacity", { n: room.capacity })}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        backgroundColor: "rgba(255,255,255,0.92)",
                      }}
                    />
                  </Box>

                  <CardContent>
                    <Typography sx={{ fontWeight: 900, mb: 0.5 }}>{room.name}</Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: 13, mb: 1 }}>
                      {room.description || t("rooms.defaultDesc", "Cómoda, luminosa y lista para tu estadía.")}
                    </Typography>

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontWeight: 900 }}>
                        ${room.price} <span style={{ fontWeight: 600, opacity: 0.7 }}>{t("rooms.perNight")}</span>
                      </Typography>

                      <Button
                        component={RouterLink}
                        to={`/${hostelSlug}/rooms/${room.id}`}
                        variant="contained"
                        size="small"
                      >
                        {t("rooms.viewRoom")}
                      </Button>
                    </Stack>
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