import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { Container, Typography, Button, MobileStepper, Box } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

import type { Room } from "../../types/room"; // ajustá path
import { db } from "../../services/firebase";
import { useTranslation } from "react-i18next";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";

function RoomCarousel({ urls, alt }: { urls: string[]; alt: string }) {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const max = urls?.length ?? 0;

  if (!max) {
    return (
      <Box sx={{ mb: 3, p: 2, border: "1px solid #eee", borderRadius: 3, color: "text.secondary" }}>
        {t("carousel.empty")}
      </Box>
    );
  }

  const canBack = active > 0;
  const canNext = active < max - 1;

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          width: "100%",
          height: { xs: 240, sm: 320 },
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid #eee",
          mb: 1,
          backgroundColor: "#fafafa",
        }}
      >
        <img
          src={urls[active]}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Box>

      {max > 1 && (
        <MobileStepper
          variant="dots"
          steps={max}
          position="static"
          activeStep={active}
          nextButton={
            <Button size="small" onClick={() => setActive((p) => p + 1)} disabled={!canNext}>
              {t("carousel.next")} <KeyboardArrowRight />
            </Button>
          }
          backButton={
            <Button size="small" onClick={() => setActive((p) => p - 1)} disabled={!canBack}>
              <KeyboardArrowLeft /> {t("carousel.back")}
            </Button>
          }
        />
      )}

      <Box sx={{ mt: 0.5, fontSize: 12, color: "text.secondary", textAlign: "right" }}>
        {t("carousel.of", { current: active + 1, total: max })}
      </Box>
    </Box>
  );
}

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
        <RoomCarousel urls={room.imageUrls ?? []} alt={room.name} />

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