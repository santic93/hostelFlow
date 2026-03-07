import { useEffect, useMemo, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
  Skeleton,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
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
  const { t, i18n } = useTranslation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [qText, setQText] = useState("");

  const money = useMemo(() => {
    const lang = (i18n.language || "es").slice(0, 2);
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }, [i18n.language]);

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

      const sorted = data.sort((a, b) => {
        const ai = (a.imageUrls?.length ?? 0) > 0 ? 1 : 0;
        const bi = (b.imageUrls?.length ?? 0) > 0 ? 1 : 0;
        if (ai !== bi) return bi - ai;
        return (a.price ?? 0) - (b.price ?? 0);
      });

      setRooms(sorted);
      setLoading(false);
    };

    fetchRooms();
  }, [hostelSlug]);

  const filteredRooms = useMemo(() => {
    const q = qText.trim().toLowerCase();
    if (!q) return rooms;

    return rooms.filter((room) => {
      return (
        room.name.toLowerCase().includes(q) ||
        room.description.toLowerCase().includes(q)
      );
    });
  }, [rooms, qText]);

  if (loading) {
    return (
      <Container sx={{ py: 5 }}>
        <Stack spacing={2}>
          <Skeleton width={220} height={56} />
          <Skeleton width={360} />

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            }}
          >
            {[0, 1, 2].map((item) => (
              <Card key={item} sx={{ borderRadius: 5, overflow: "hidden" }}>
                <CardContent>
                  <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                    <Skeleton width={90} height={28} />
                    <Skeleton width={140} height={28} />
                  </Stack>
                </CardContent>
                <Skeleton variant="rectangular" height={260} />
                <CardContent>
                  <Skeleton width="70%" />
                  <Skeleton width="100%" />
                  <Skeleton width="85%" />
                  <Skeleton variant="rectangular" height={42} sx={{ borderRadius: 999, mt: 2 }} />
                </CardContent>
              </Card>
            ))}
          </Box>
        </Stack>
      </Container>
    );
  }

  return (
    <Container sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack spacing={2.5} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h2">{t("rooms.title")}</Typography>
          <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
            {t("rooms.subtitle")}
          </Typography>
        </Box>

        <TextField
          size="small"
          value={qText}
          onChange={(e) => setQText(e.target.value)}
          placeholder={t("rooms.searchPlaceholder", "Buscar habitación…")}
          sx={{ maxWidth: 420 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {filteredRooms.length === 0 ? (
        <Card sx={{ borderRadius: 5 }}>
          <CardContent>
            <Typography sx={{ fontWeight: 900 }}>
              {t("rooms.noRooms")}
            </Typography>
            <Typography sx={{ color: "text.secondary", mt: 0.6 }}>
              {t("rooms.noRoomsFiltered", "No encontramos habitaciones con esos filtros.")}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 2.2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          }}
        >
          {filteredRooms.map((room) => {
            const urls = (room.imageUrls ?? []).filter(Boolean);

            return (
              <Card
                key={room.id}
                sx={{
                  overflow: "hidden",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 5,
                  background: "rgba(255,255,255,0.84)",
                }}
              >
                <CardContent sx={{ pb: 1.25 }}>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                    <Chip
                      label={t("rooms.capacity", { n: room.capacity })}
                      size="small"
                      sx={{ backgroundColor: "rgba(255,255,255,0.96)", fontWeight: 900 }}
                    />
                    <Chip
                      label={`${money.format(room.price)} ${t("rooms.perNight")}`}
                      size="small"
                      sx={{ backgroundColor: "rgba(255,255,255,0.96)", fontWeight: 900 }}
                    />
                  </Stack>
                </CardContent>

                <RoomCardCarousel urls={urls} alt={room.name} />

                <CardContent
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    p: 2.2,
                  }}
                >
                  <Typography sx={{ fontWeight: 900, mb: 0.6, fontSize: 18 }}>
                    {room.name}
                  </Typography>

                  <Typography
                    sx={{
                      color: "text.secondary",
                      fontSize: 14,
                      mb: 1.2,
                      minHeight: 66,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.7,
                    }}
                  >
                    {room.description || t("rooms.defaultDesc")}
                  </Typography>

                  <Box sx={{ flex: 1 }} />

                  <Button
                    component={RouterLink}
                    to={`/${hostelSlug}/rooms/${room.id}`}
                    variant="contained"
                    size="medium"
                    sx={{ fontWeight: 900 }}
                  >
                    {t("rooms.viewRoom")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Container>
  );
};