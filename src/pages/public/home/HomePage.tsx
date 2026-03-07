import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  Skeleton,
} from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useHostelPublic } from "../../../hooks/useHostelPublic";
import { Seo } from "../../../components/Seo";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../services/firebase";

type Room = {
  id: string;
  name: string;
  price: number;
  capacity: number;
  description: string;
  imageUrls?: string[];
  imageUrl?: string;
};

function EditorialFeature({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <Card
      sx={{
        borderRadius: 5,
        overflow: "hidden",
        position: "relative",
        minHeight: 180,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.92) 100%)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 10% 10%, rgba(124,58,45,0.08), transparent 36%), radial-gradient(circle at 90% 0%, rgba(31,59,55,0.08), transparent 30%)",
          pointerEvents: "none",
        }}
      />
      <CardContent sx={{ position: "relative", p: 2.5 }}>
        <Typography
          sx={{
            fontSize: 12,
            opacity: 0.75,
            fontWeight: 900,
            letterSpacing: 1,
          }}
        >
          {eyebrow}
        </Typography>
        <Typography sx={{ fontSize: 18, fontWeight: 900, mt: 0.6 }}>
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: 13,
            color: "text.secondary",
            mt: 0.9,
            lineHeight: 1.7,
            maxWidth: 300,
          }}
        >
          {desc}
        </Typography>
      </CardContent>
    </Card>
  );
}

function RoomPreviewCard({
  hostelSlug,
  room,
  fallbackDesc,
  ctaLabel,
}: {
  hostelSlug: string;
  room: Room;
  fallbackDesc: string;
  ctaLabel: string;
}) {
  const urls = (room.imageUrls ?? (room.imageUrl ? [room.imageUrl] : [])).filter(Boolean);
  const cover = urls[0];

  return (
    <Card
      sx={{
        borderRadius: 5,
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "rgba(255,255,255,0.86)",
      }}
    >
      <CardContent sx={{ pb: 1.25 }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          <Chip
            size="small"
            label={`${room.capacity} pax`}
            sx={{
              bgcolor: "rgba(255,255,255,0.96)",
              fontWeight: 900,
            }}
          />
          {room.price > 0 && (
            <Chip
              size="small"
              label={`$${room.price} / noche`}
              sx={{
                bgcolor: "rgba(255,255,255,0.96)",
                fontWeight: 900,
              }}
            />
          )}
        </Stack>
      </CardContent>

      <Box sx={{ px: 1.5 }}>
        <Box
          sx={{
            height: 250,
            position: "relative",
            bgcolor: "grey.50",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          {cover ? (
            <>
              <Box
                component="img"
                src={cover}
                alt={room.name}
                sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.48), rgba(0,0,0,0.08) 52%, rgba(0,0,0,0.02))",
                }}
              />
            </>
          ) : (
            <>
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 20% 20%, rgba(124,58,45,0.08), transparent 55%), radial-gradient(circle at 80% 0%, rgba(31,59,55,0.06), transparent 45%)",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  px: 2,
                }}
              >
                <Stack spacing={0.5} alignItems="center">
                  <Typography sx={{ fontWeight: 900, fontSize: 14, opacity: 0.9 }}>
                    Sin fotos
                  </Typography>
                  <Typography
                    sx={{ fontSize: 12, color: "text.secondary", textAlign: "center" }}
                  >
                    Esta habitación todavía no tiene imágenes.
                  </Typography>
                </Stack>
              </Box>
            </>
          )}

          <Box sx={{ position: "absolute", left: 16, right: 16, bottom: 16, zIndex: 2 }}>
            <Typography
              sx={{
                color: "white",
                fontWeight: 900,
                fontSize: 20,
                textShadow: "0 4px 16px rgba(0,0,0,0.30)",
              }}
            >
              {room.name}
            </Typography>
          </Box>
        </Box>
      </Box>

      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2.25 }}>
        <Typography
          sx={{
            color: "text.secondary",
            fontSize: 14,
            lineHeight: 1.7,
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {room.description?.trim() ? room.description : fallbackDesc}
        </Typography>

        <Button
          component={RouterLink}
          to={`/${hostelSlug}/rooms/${room.id}`}
          variant="contained"
          sx={{
            mt: 2,
            fontWeight: 900,
            textTransform: "none",
          }}
        >
          {ctaLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export const HomePage = () => {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const { hostel } = useHostelPublic(hostelSlug);
  const { t } = useTranslation();

  const base = window.location.origin;
  const canonical = hostelSlug ? `${base}/${hostelSlug}` : `${base}/`;

  const title = hostel?.name
    ? t("seo.homeTitleWithHostel", { hostel: hostel.name })
    : t("seo.homeTitle");
  const description = hostel?.name
    ? t("seo.homeDescWithHostel", { hostel: hostel.name })
    : t("seo.homeDesc");

  const roomsUrl = hostelSlug ? `/${hostelSlug}/rooms` : "/";

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!hostelSlug) return;
      setRoomsLoading(true);

      try {
        const snap = await getDocs(collection(db, "hostels", hostelSlug, "rooms"));
        if (!alive) return;

        const data: Room[] = snap.docs.map((d) => {
          const raw = d.data() as any;
          return {
            id: d.id,
            name: raw.name ?? "",
            price: raw.price ?? 0,
            capacity: raw.capacity ?? 1,
            description: raw.description ?? "",
            imageUrls: raw.imageUrls ?? (raw.imageUrl ? [raw.imageUrl] : []),
            imageUrl: raw.imageUrl ?? "",
          };
        });

        const sorted = data.sort((a, b) => {
          const ai = (a.imageUrls?.length ?? 0) > 0 ? 1 : 0;
          const bi = (b.imageUrls?.length ?? 0) > 0 ? 1 : 0;
          if (ai !== bi) return bi - ai;
          return (a.price ?? 0) - (b.price ?? 0);
        });

        setRooms(sorted.slice(0, 3));
      } finally {
        if (alive) setRoomsLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [hostelSlug]);

  const featureCopy = useMemo(
    () => ({
      a: {
        eyebrow: t("home.features.a.eyebrow", "DIRECTO"),
        title: t("home.features.a.title", "Reservá sin vueltas"),
        desc: t(
          "home.features.a.desc",
          "Elegís la habitación, mirás fechas disponibles y enviás tu reserva en pocos pasos."
        ),
      },
      b: {
        eyebrow: t("home.features.b.eyebrow", "CLARO"),
        title: t("home.features.b.title", "Todo antes de confirmar"),
        desc: t(
          "home.features.b.desc",
          "Capacidad, precio por noche, total de estadía y confirmación por email."
        ),
      },
      c: {
        eyebrow: t("home.features.c.eyebrow", "SIMPLE"),
        title: t("home.features.c.title", "Una experiencia más humana"),
        desc: t(
          "home.features.c.desc",
          "Sin comisiones raras, sin pantallas saturadas, sin perder tiempo."
        ),
      },
    }),
    [t]
  );

  return (
    <>
      <Seo title={title} description={description} canonical={canonical} />

      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container sx={{ py: { xs: 3, sm: 5, md: 7 } }}>
          <Stack spacing={{ xs: 3, sm: 4.5 }}>
            <Card
              sx={{
                borderRadius: { xs: 5, md: 6 },
                overflow: "hidden",
                background: "#1B1714",
                color: "white",
                minHeight: { xs: 520, md: 620 },
                position: "relative",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "url(https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  transform: "scale(1.02)",
                }}
              />

              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, rgba(17,13,11,0.82) 0%, rgba(17,13,11,0.54) 42%, rgba(17,13,11,0.18) 100%)",
                }}
              />

              <Box
                sx={{
                  position: "relative",
                  zIndex: 1,
                  p: { xs: 2.25, sm: 3.5, md: 5 },
                  height: "100%",
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                <Box sx={{ maxWidth: 680 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }}>
                    <Chip
                      size="small"
                      label={t("home.badge", "Reserva directa")}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.12)",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.10)",
                      }}
                    />
                    <Chip
                      size="small"
                      label={t("home.badge2", "Sin comisiones")}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.12)",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.10)",
                      }}
                    />
                    {!!hostel?.name && (
                      <Chip
                        size="small"
                        label={hostel.name}
                        sx={{
                          bgcolor: "rgba(255,255,255,0.12)",
                          color: "white",
                          border: "1px solid rgba(255,255,255,0.10)",
                        }}
                      />
                    )}
                  </Stack>

                  <Typography variant="h1" sx={{ color: "white", maxWidth: 620 }}>
                    {t("home.heroLine1")}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 1.2,
                      color: "rgba(255,255,255,0.86)",
                      maxWidth: 560,
                      fontSize: { xs: 15, sm: 17 },
                      lineHeight: 1.75,
                    }}
                  >
                    {t("home.aboutP1")}
                  </Typography>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 2.5 }}>
                    <Button
                      component={RouterLink}
                      to={roomsUrl}
                      variant="contained"
                      size="large"
                      sx={{
                        bgcolor: "#FFF7F1",
                        color: "#1B1714",
                        "&:hover": { bgcolor: "#fff" },
                        px: 2.5,
                        py: 1.2,
                        fontWeight: 900,
                      }}
                    >
                      {t("nav.book")}
                    </Button>

                    <Button
                      component={RouterLink}
                      to={roomsUrl}
                      variant="outlined"
                      size="large"
                      sx={{
                        borderColor: "rgba(255,255,255,0.22)",
                        color: "white",
                        "&:hover": { borderColor: "rgba(255,255,255,0.38)" },
                        px: 2.2,
                        py: 1.2,
                        fontWeight: 900,
                      }}
                    >
                      {t("nav.rooms")}
                    </Button>
                  </Stack>
                </Box>
              </Box>
            </Card>

            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              }}
            >
              <EditorialFeature {...featureCopy.a} />
              <EditorialFeature {...featureCopy.b} />
              <EditorialFeature {...featureCopy.c} />
            </Box>

            <Card
              sx={{
                borderRadius: 5,
                background: "rgba(255,255,255,0.72)",
                backdropFilter: "blur(6px)",
              }}
            >
              <CardContent sx={{ p: { xs: 2.2, sm: 3 } }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1}
                >
                  <Box>
                    <Typography variant="h2" sx={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
                      {t("home.previewTitle", "Habitaciones destacadas")}
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: 14, mt: 0.45 }}>
                      {t("home.previewSubtitle", "Un vistazo rápido para elegir más fácil.")}
                    </Typography>
                  </Box>

                  <Button
                    component={RouterLink}
                    to={roomsUrl}
                    variant="outlined"
                    sx={{ fontWeight: 900 }}
                  >
                    {t("home.previewCta", "Ver todas")}
                  </Button>
                </Stack>

                <Divider sx={{ my: 2.4 }} />

                {roomsLoading ? (
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                      },
                    }}
                  >
                    {[0, 1, 2].map((k) => (
                      <Card key={k} sx={{ borderRadius: 5, overflow: "hidden" }}>
                        <CardContent>
                          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                            <Skeleton width={90} height={28} />
                            <Skeleton width={140} height={28} />
                          </Stack>
                        </CardContent>
                        <Skeleton variant="rectangular" height={250} />
                        <CardContent>
                          <Skeleton width="70%" />
                          <Skeleton width="92%" />
                          <Skeleton width="80%" />
                          <Skeleton variant="rectangular" height={44} sx={{ borderRadius: 999, mt: 2 }} />
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : rooms.length === 0 ? (
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 4,
                      border: "1px dashed",
                      borderColor: "divider",
                      background:
                        "radial-gradient(circle at 20% 20%, rgba(124,58,45,0.05), transparent 55%), radial-gradient(circle at 80% 0%, rgba(31,59,55,0.04), transparent 45%)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 900 }}>
                      {t("home.previewEmptyTitle", "Todavía no hay habitaciones publicadas")}
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: 14, mt: 0.7 }}>
                      {t(
                        "home.previewEmptyDesc",
                        "Si estás en modo admin, cargá la primera habitación para que la gente pueda reservar."
                      )}
                    </Typography>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.8 }}>
                      <Button component={RouterLink} to={roomsUrl} variant="contained">
                        {t("nav.book")}
                      </Button>
                      <Button component={RouterLink} to={roomsUrl} variant="text">
                        {t("nav.rooms")}
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                      },
                    }}
                  >
                    {rooms.map((room) => (
                      <RoomPreviewCard
                        key={room.id}
                        hostelSlug={hostelSlug!}
                        room={room}
                        fallbackDesc={t(
                          "rooms.defaultDesc",
                          "Cómoda, luminosa y lista para tu estadía."
                        )}
                        ctaLabel={t("rooms.viewRoom", "Ver habitación")}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
              }}
            >
              <Card
                sx={{
                  borderRadius: 5,
                  minHeight: 320,
                  background:
                    "linear-gradient(180deg, rgba(255,253,249,0.90) 0%, rgba(255,255,255,0.72) 100%)",
                }}
              >
                <CardContent sx={{ p: { xs: 2.2, sm: 3 } }}>
                  <Typography variant="h2" sx={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)", mb: 1 }}>
                    {t("home.aboutTitle")}
                  </Typography>

                  <Typography sx={{ color: "text.secondary", maxWidth: 560 }}>
                    {t("home.aboutP2")}
                  </Typography>

                  <Typography sx={{ color: "text.secondary", mt: 1.4 }}>
                    {t(
                      "home.editorialBlock",
                      "Una experiencia simple, visual y directa para que reservar sea parte del viaje, no un trámite."
                    )}
                  </Typography>
                </CardContent>
              </Card>

              <Card
                sx={{
                  borderRadius: 5,
                  minHeight: 320,
                  overflow: "hidden",
                  background: "#1A1613",
                  color: "white",
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                      "url(https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.42,
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(26,22,19,0.35), rgba(26,22,19,0.78))",
                  }}
                />
                <CardContent
                  sx={{
                    position: "relative",
                    p: { xs: 2.2, sm: 3 },
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }}
                >
                  <Typography sx={{ fontWeight: 900, fontSize: 24 }}>
                    {t("home.visualTitle", "Tu próxima estadía empieza acá.")}
                  </Typography>
                  <Typography sx={{ mt: 0.7, color: "rgba(255,255,255,0.82)" }}>
                    {t("home.visualSubtitle", "Elegí habitación, confirmá fechas y listo.")}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        </Container>
      </Box>
    </>
  );
};