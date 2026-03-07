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
import Grid from "@mui/material/GridLegacy";
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
  const { t } = useTranslation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [qText, setQText] = useState("");

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
          <Grid container spacing={2}>
            {[0, 1, 2].map((item) => (
              <Grid key={item} item xs={12} sm={6} md={4}>
                <Card sx={{ borderRadius: 5, overflow: "hidden" }}>
                  <Skeleton variant="rectangular" height={260} />
                  <CardContent>
                    <Skeleton width="70%" />
                    <Skeleton width="100%" />
                    <Skeleton width="85%" />
                    <Skeleton variant="rectangular" height={42} sx={{ borderRadius: 999, mt: 2 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
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
        <Grid container spacing={2.2}>
          {filteredRooms.map((room) => {
            const urls = (room.imageUrls ?? []).filter(Boolean);

            return (
              <Grid item key={room.id} xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    overflow: "hidden",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 5,
                    background: "rgba(255,255,255,0.84)",
                  }}
                >
                  <Box sx={{ position: "relative" }}>
                    <RoomCardCarousel urls={urls} alt={room.name} />
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ position: "absolute", top: 12, left: 12, flexWrap: "wrap" }}
                    >
                      <Chip
                        label={t("rooms.capacity", { n: room.capacity })}
                        size="small"
                        sx={{
                          backgroundColor: "rgba(255,255,255,0.92)",
                        }}
                      />
                      <Chip
                        label={`$${room.price} ${t("rooms.perNight")}`}
                        size="small"
                        sx={{
                          backgroundColor: "rgba(255,255,255,0.92)",
                        }}
                      />
                    </Stack>
                  </Box>

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
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};