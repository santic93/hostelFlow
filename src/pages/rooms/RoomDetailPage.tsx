import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { Container, Typography, Box, Button } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import type { Room } from "../../types/room"; // ajustá path
import { db } from "../../services/firebase";
import SafeImage from "../../components/SafeImage";
import { useTranslation } from "react-i18next";



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
        imageUrl: raw.imageUrl ?? "",
      });
      setLoading(false);
    };

    fetchRoom();
  }, [hostelSlug, id]);

  if (loading) {
    return (
      <Container sx={{ py: 10 }}>
        <Typography>{t("roomDetail.loading")}</Typography>
      </Container>
    );
  }

  if (!room) {
    return (
      <Container sx={{ py: 10 }}>
        <Typography variant="h5" gutterBottom>
          {t("roomDetail.notFound")}
        </Typography>

        <Button
          component={RouterLink}
          to={hostelSlug ? `/${hostelSlug}/rooms` : "/"}
          startIcon={<ArrowBackIosNewIcon />}
        >
          {t("roomDetail.backToRooms")}
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Button
        component={RouterLink}
        to={`/${hostelSlug}/rooms`}
        startIcon={<ArrowBackIosNewIcon />}
      >
        {t("roomDetail.backToRooms")}
      </Button>

      <Container sx={{ py: 10 }}>
        <SafeImage src={room.imageUrl} alt={room.name} sx={{ mb: 3 }} />

        <Typography variant="h2" gutterBottom>
          {room.name}
        </Typography>

        <Typography sx={{ mb: 4 }}>{room.description}</Typography>

        <Typography sx={{ mb: 4 }}>
          {t("roomDetail.fromPerNight", { price: room.price })}
        </Typography>

        <Button
          variant="contained"
          component={RouterLink}
          to={`/${hostelSlug}/booking/${room.id}`}
        >
          {t("roomDetail.bookThisRoom")}
        </Button>
      </Container>
    </>
  );
};