import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
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

export const RoomDetailPage = () => {
  const { hostelSlug, id } = useParams<{ hostelSlug: string; id: string }>();
  const { t } = useTranslation();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      if (!hostelSlug || !id) return;
      setLoading(true);

      const snap = await getDoc(doc(db, "hostels", hostelSlug, "rooms", id));
      if (!snap.exists()) {
        setRoom(null);
        setLoading(false);
        return;
      }

      const raw = snap.data() as any;
      setRoom({
        id: snap.id,
        name: raw.name ?? "",
        price: raw.price ?? 0,
        capacity: raw.capacity ?? 1,
        description: raw.description ?? "",
        imageUrls: raw.imageUrls ?? (raw.imageUrl ? [raw.imageUrl] : []),
      });

      setLoading(false);
    };

    fetchRoom();
  }, [hostelSlug, id]);

  if (loading) {
    return (
      <Container sx={{ py: 5 }}>
        <Typography sx={{ opacity: 0.75 }}>{t("roomDetail.loading")}</Typography>
      </Container>
    );
  }

  if (!room) {
    return (
      <Container sx={{ py: 5 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>{t("roomDetail.notFound")}</Typography>
        <Button component={RouterLink} to={`/${hostelSlug}/rooms`} variant="contained">
          {t("roomDetail.backToRooms")}
        </Button>
      </Container>
    );
  }

  const urls = (room.imageUrls ?? []).filter(Boolean);

  return (
    <Container sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack spacing={2}>
        <Button
          component={RouterLink}
          to={`/${hostelSlug}/rooms`}
          variant="outlined"
          sx={{ alignSelf: "flex-start" }}
        >
          {t("roomDetail.backToRooms")}
        </Button>

        <Card sx={{ overflow: "hidden" }}>
          <Box sx={{ position: "relative" }}>
            <RoomCardCarousel urls={urls} alt={room.name} />
          </Box>
          <CardContent>
            <Typography variant="h2" sx={{ mb: 1 }}>
              {room.name}
            </Typography>

            <Typography sx={{ color: "text.secondary", mb: 2 }}>
              {room.description || "Habitación cómoda y lista para tu estadía."}
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ sm: "center" }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                ${room.price} <span style={{ fontWeight: 600, opacity: 0.7 }}>/ noche</span>
              </Typography>

              <Button
                component={RouterLink}
                to={`/${hostelSlug}/booking/${room.id}`}
                variant="contained"
                size="large"
              >
                {t("roomDetail.bookThisRoom")}
              </Button>
            </Stack>

            <Typography sx={{ mt: 1.5, fontSize: 13, color: "text.secondary" }}>
              Confirmación por email. Sin comisión.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};