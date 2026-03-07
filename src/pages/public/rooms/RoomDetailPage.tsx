import { useEffect, useMemo, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Chip,
  Divider,
  Skeleton,
} from "@mui/material";
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
  const { t, i18n } = useTranslation();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  const money = useMemo(() => {
    const lang = (i18n.language || "es").slice(0, 2);
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }, [i18n.language]);

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
        <Stack spacing={2}>
          <Skeleton width={180} height={44} />
          <Card sx={{ overflow: "hidden", borderRadius: 5 }}>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                <Skeleton width={90} height={28} />
                <Skeleton width={160} height={28} />
              </Stack>
            </CardContent>
            <Skeleton variant="rectangular" height={420} />
            <CardContent>
              <Skeleton width="50%" height={54} />
              <Skeleton width="100%" />
              <Skeleton width="92%" />
              <Skeleton width="40%" />
            </CardContent>
          </Card>
        </Stack>
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
      <Stack spacing={2.2}>
        <Button
          component={RouterLink}
          to={`/${hostelSlug}/rooms`}
          variant="outlined"
          sx={{ alignSelf: "flex-start" }}
        >
          {t("roomDetail.backToRooms")}
        </Button>

        <Card
          sx={{
            overflow: "hidden",
            borderRadius: 5,
            background: "rgba(255,255,255,0.82)",
          }}
        >
          <CardContent sx={{ pb: 1.25 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
              <Chip
                label={t("rooms.capacity", { n: room.capacity })}
                sx={{ backgroundColor: "rgba(255,255,255,0.96)", fontWeight: 900 }}
              />
              <Chip
                label={`${money.format(room.price)} ${t("rooms.perNight")}`}
                sx={{ backgroundColor: "rgba(255,255,255,0.96)", fontWeight: 900 }}
              />
            </Stack>
          </CardContent>

          <RoomCardCarousel urls={urls} alt={room.name} />

          <CardContent sx={{ p: { xs: 2.2, sm: 3 } }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h2" sx={{ mb: 1 }}>
                  {room.name}
                </Typography>

                <Typography sx={{ color: "text.secondary", maxWidth: 760 }}>
                  {room.description || "Habitación cómoda y lista para tu estadía."}
                </Typography>
              </Box>

              <Divider />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ sm: "center" }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: 22 }}>
                    {money.format(room.price)}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                    {t("rooms.perNight")}
                  </Typography>
                </Box>

                <Button
                  component={RouterLink}
                  to={`/${hostelSlug}/booking/${room.id}`}
                  variant="contained"
                  size="large"
                  sx={{ fontWeight: 900 }}
                >
                  {t("roomDetail.bookThisRoom")}
                </Button>
              </Stack>

              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                {t("booking.summaryNote", "Confirmación por email. Sin comisión.")}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};