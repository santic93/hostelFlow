import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { Container, Typography, Button, MobileStepper, Box, Chip, Stack, CardContent, Grid, Card } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

import type { Room } from "../../types/room"; // ajustá path
import { db } from "../../services/firebase";
import { useTranslation } from "react-i18next";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";

function RoomCarousel({ urls, alt }: { urls: string[]; alt: string }) {
  const { t } = useTranslation();
  const safe = (urls ?? []).filter(Boolean);
  const [active, setActive] = useState(0);
  const max = safe.length;

  useEffect(() => {
    setActive(0);
  }, [max]);

  if (!max) {
    return (
      <Box
        sx={{
          mb: 3,
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "grey.50",
          aspectRatio: "16 / 10",
          display: "grid",
          placeItems: "center",
          color: "text.secondary",
        }}
      >
        <Typography variant="body2">{t("carousel.empty")}</Typography>
      </Box>
    );
  }

  const canBack = active > 0;
  const canNext = active < max - 1;

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          width: "100%",
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "grey.50",
          aspectRatio: "16 / 10",
          position: "relative",
        }}
      >
        <Box
          component="img"
          src={safe[active]}
          alt={alt}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        {/* contador */}
        <Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            px: 1,
            py: 0.4,
            borderRadius: 999,
            bgcolor: "rgba(0,0,0,0.55)",
            color: "white",
            fontSize: 12,
          }}
        >
          {t("carousel.of", { current: active + 1, total: max })}
        </Box>
      </Box>

      {max > 1 && (
        <Box sx={{ mt: 1 }}>
          <MobileStepper
            variant="dots"
            steps={max}
            position="static"
            activeStep={active}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
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
        </Box>
      )}
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
      <Container sx={{ py: { xs: 6, md: 10 } }}>
        <Typography>{t("roomDetail.loading")}</Typography>
      </Container>
    );
  }

  if (!room) {
    return (
      <Container sx={{ py: { xs: 6, md: 10 } }}>
        <Typography variant="h5" gutterBottom>
          {t("roomDetail.notFound")}
        </Typography>

        <Button
          component={RouterLink}
          to={hostelSlug ? `/${hostelSlug}/rooms` : "/"}
          startIcon={<ArrowBackIosNewIcon />}
          sx={{ borderRadius: 999, textTransform: "none" }}
        >
          {t("roomDetail.backToRooms")}
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: { xs: 4, md: 8 } }}>
      <Button
        component={RouterLink}
        to={`/${hostelSlug}/rooms`}
        startIcon={<ArrowBackIosNewIcon />}
        sx={{ mb: 2, borderRadius: 999, textTransform: "none" }}
      >
        {t("roomDetail.backToRooms")}
      </Button>

      <Grid container spacing={{ xs: 3, md: 4 }}>
        <Grid sx={{ xs: 12, md: 7 }}>
          <RoomCarousel urls={room.imageUrls ?? []} alt={room.name} />
        </Grid>

        <Grid sx={{ xs: 12, md: 5 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              position: { md: "sticky" },
              top: { md: 24 },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                {room.name}
              </Typography>

              <Typography sx={{ color: "text.secondary", mb: 2 }}>
                {room.description || "Habitación cómoda y lista para tu estadía."}
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip
                  size="small"
                  label={`${room.capacity} ${room.capacity === 1 ? "persona" : "personas"}`}
                  sx={{ borderRadius: 999 }}
                />
                <Chip size="small" label="Wi-Fi" sx={{ borderRadius: 999 }} />
                <Chip size="small" label="Check-in flexible" sx={{ borderRadius: 999 }} />
              </Stack>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "grey.50",
                  border: "1px solid",
                  borderColor: "divider",
                  mb: 2,
                }}
              >
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {t("roomDetail.fromPerNight", { price: room.price })}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>
                  ${room.price}
                  <Typography component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>
                    {" "}
                    / noche
                  </Typography>
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                component={RouterLink}
                to={`/${hostelSlug}/booking/${room.id}`}
                sx={{
                  borderRadius: 999,
                  py: 1.2,
                  textTransform: "none",
                  fontWeight: 800,
                }}
              >
                {t("roomDetail.bookThisRoom")}
              </Button>

              <Typography variant="caption" sx={{ display: "block", mt: 1.5, color: "text.secondary" }}>
                Confirmación por email. Sin comisión.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};