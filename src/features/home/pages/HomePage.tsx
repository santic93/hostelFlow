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

function SoftFeatureCard({
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
        borderRadius: 4,
        overflow: "hidden",
        position: "relative",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* fondo disruptivo sutil (no template) */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 20%, rgba(0,0,0,0.05), transparent 55%), radial-gradient(circle at 80% 0%, rgba(0,0,0,0.04), transparent 45%)",
          pointerEvents: "none",
        }}
      />
      <CardContent sx={{ position: "relative" }}>
        <Typography sx={{ fontSize: 12, opacity: 0.75, fontWeight: 900, letterSpacing: 0.6 }}>
          {eyebrow}
        </Typography>
        <Typography sx={{ fontSize: 16, fontWeight: 900, mt: 0.4 }}>{title}</Typography>
        <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.6, lineHeight: 1.6 }}>
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
    <Card sx={{ borderRadius: 4, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Imagen / placeholder mantiene mismo alto siempre */}
      <Box
        sx={{
          height: 210,
          position: "relative",
          bgcolor: "grey.50",
          borderBottom: "1px solid",
          borderColor: "divider",
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
                background: "linear-gradient(to top, rgba(0,0,0,0.35), transparent 55%)",
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
                  "radial-gradient(circle at 20% 20%, rgba(0,0,0,0.05), transparent 55%), radial-gradient(circle at 80% 0%, rgba(0,0,0,0.04), transparent 45%)",
              }}
            />
            <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", px: 2 }}>
              <Stack spacing={0.5} alignItems="center">
                <Typography sx={{ fontWeight: 900, fontSize: 14, opacity: 0.9 }}>Sin fotos</Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary", textAlign: "center" }}>
                  Esta habitación todavía no tiene imágenes.
                </Typography>
              </Stack>
            </Box>
          </>
        )}

        {/* chips flotantes */}
        <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 10, left: 10 }}>
          <Chip
            size="small"
            label={`${room.capacity} pax`}
            sx={{ bgcolor: "rgba(255,255,255,0.92)", fontWeight: 900, borderRadius: 999 }}
          />
          {room.price > 0 && (
            <Chip
              size="small"
              label={`$${room.price} / noche`}
              sx={{ bgcolor: "rgba(255,255,255,0.92)", fontWeight: 900, borderRadius: 999 }}
            />
          )}
        </Stack>
      </Box>

      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Typography sx={{ fontWeight: 900, mb: 0.5 }}>{room.name}</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 13, lineHeight: 1.6, flex: 1 }}>
          {room.description?.trim() ? room.description : fallbackDesc}
        </Typography>

        <Button
          component={RouterLink}
          to={`/${hostelSlug}/rooms/${room.id}`}
          variant="contained"
          sx={{
            mt: 1.5,
            borderRadius: 999,
            fontWeight: 900,
            textTransform: "none",
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
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

  const title = hostel?.name ? t("seo.homeTitleWithHostel", { hostel: hostel.name }) : t("seo.homeTitle");
  const description = hostel?.name ? t("seo.homeDescWithHostel", { hostel: hostel.name }) : t("seo.homeDesc");

  const roomsUrl = hostelSlug ? `/${hostelSlug}/rooms` : "/";

  // Preview Rooms
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

        // orden simple: primero las que tengan imagen, después por precio
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
        title: t("home.features.a.title", "Reserva sin vueltas"),
        desc: t("home.features.a.desc", "Elegís habitación, confirmás fechas y listo. Sin pasos raros."),
      },
      b: {
        eyebrow: t("home.features.b.eyebrow", "CLARO"),
        title: t("home.features.b.title", "Precios transparentes"),
        desc: t("home.features.b.desc", "Ves el total antes de enviar la solicitud. Sin sorpresas."),
      },
      c: {
        eyebrow: t("home.features.c.eyebrow", "MULTI-IDIOMA"),
        title: t("home.features.c.title", "Tu sitio, en 1 click"),
        desc: t("home.features.c.desc", "Español, English, Português. El huésped entra y entiende."),
      },
    }),
    [t]
  );

  return (
    <>
      <Seo title={title} description={description} canonical={canonical} />

      <Container sx={{ py: { xs: 3, sm: 5 } }}>
        <Stack spacing={{ xs: 2.5, sm: 3.5 }}>
          {/* HERO */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2, md: 3 }} alignItems={{ md: "stretch" }}>
            <Box sx={{ flex: 1, pt: { xs: 0, md: 1 } }}>
              {!!hostel?.name && (
                <Chip size="small" label={hostel.name} sx={{ mb: 1.25, fontWeight: 900, borderRadius: 999 }} />
              )}

              <Typography variant="h1" sx={{ mb: 1, lineHeight: 1.05, letterSpacing: -0.6 }}>
                {t("home.heroLine1")}
              </Typography>

              <Typography variant="h1" sx={{ opacity: 0.95, lineHeight: 1.05, letterSpacing: -0.6 }}>
                {t("home.heroLine2")}
              </Typography>

              <Typography sx={{ mt: 1.75, color: "text.secondary", maxWidth: 560 }}>
                {t("home.aboutP1")}
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 2.25 }}>
                {/* CTA único */}
                <Button
                  component={RouterLink}
                  to={roomsUrl}
                  variant="contained"
                  size="large"
                  sx={{
                    borderRadius: 999,
                    px: 2.4,
                    py: 1.2,
                    fontWeight: 900,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": { boxShadow: "none" },
                  }}
                >
                  {t("nav.book")}
                </Button>

                <Button
                  component={RouterLink}
                  to={roomsUrl}
                  variant="text"
                  size="large"
                  sx={{
                    borderRadius: 999,
                    px: 1.2,
                    fontWeight: 900,
                    textTransform: "none",
                    opacity: 0.9,
                  }}
                >
                  {t("nav.rooms")}
                </Button>
              </Stack>
            </Box>

            {/* Visual card */}
            <Card
              sx={{
                flex: 1,
                minHeight: { xs: 260, md: 440 },
                overflow: "hidden",
                borderRadius: 4,
                position: "relative",
              }}
            >
              <CardContent sx={{ p: 0, height: "100%" }}>
                <Box
                  sx={{
                    height: "100%",
                    backgroundImage:
                      "url(https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1400&q=80)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "flex-end",
                    p: { xs: 1.5, sm: 2 },
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.10) 60%, rgba(0,0,0,0.10))",
                    }}
                  />

                  <Box sx={{ position: "relative", width: "100%" }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: "wrap" }}>
                      <Chip
                        size="small"
                        label={t("home.badge", "Reserva directa")}
                        sx={{
                          borderRadius: 999,
                          bgcolor: "rgba(255,255,255,0.12)",
                          color: "white",
                          fontWeight: 900,
                        }}
                      />
                      <Chip
                        size="small"
                        label={t("home.badge2", "Sin comisiones")}
                        sx={{
                          borderRadius: 999,
                          bgcolor: "rgba(255,255,255,0.12)",
                          color: "white",
                          fontWeight: 900,
                        }}
                      />
                      {!!hostel?.name && (
                        <Chip
                          size="small"
                          label={hostel.name}
                          sx={{
                            borderRadius: 999,
                            bgcolor: "rgba(255,255,255,0.12)",
                            color: "white",
                            fontWeight: 900,
                          }}
                        />
                      )}
                    </Stack>

                    <Typography sx={{ color: "white", fontWeight: 900, fontSize: { xs: 18, sm: 20 } }}>
                      {t("home.visualTitle", "Tu próxima estadía empieza acá.")}
                    </Typography>

                    <Typography sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontSize: 13 }}>
                      {t("home.visualSubtitle", "Elegí habitación, confirmá fechas y listo.")}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Stack>

          {/* MICRO FEATURES (diferencial) */}
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            }}
          >
            <SoftFeatureCard {...featureCopy.a} />

            <SoftFeatureCard {...featureCopy.b} />


            <SoftFeatureCard {...featureCopy.c} />
          </Box>

          {/* PREVIEW HABITACIONES */}
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1}
              >
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                    {t("home.previewTitle", "Habitaciones destacadas")}
                  </Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.3 }}>
                    {t("home.previewSubtitle", "Un vistazo rápido para elegir más fácil.")}
                  </Typography>
                </Box>

                <Button
                  component={RouterLink}
                  to={roomsUrl}
                  variant="outlined"
                  sx={{ borderRadius: 999, fontWeight: 900, textTransform: "none" }}
                >
                  {t("home.previewCta", "Ver todas")}
                </Button>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {roomsLoading ? (
                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                  }}
                >
                  {[0, 1, 2].map((k) => (
                    <Card key={k} sx={{ borderRadius: 4, overflow: "hidden" }}>
                      <Skeleton variant="rectangular" height={210} />
                      <CardContent>
                        <Skeleton width="70%" />
                        <Skeleton width="90%" />
                        <Skeleton width="50%" />
                        <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 999, mt: 1 }} />
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : rooms.length === 0 ? (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: "1px dashed",
                    borderColor: "divider",
                    background:
                      "radial-gradient(circle at 20% 20%, rgba(0,0,0,0.04), transparent 55%), radial-gradient(circle at 80% 0%, rgba(0,0,0,0.03), transparent 45%)",
                  }}
                >
                  <Typography sx={{ fontWeight: 900 }}>
                    {t("home.previewEmptyTitle", "Todavía no hay habitaciones publicadas")}
                  </Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }}>
                    {t(
                      "home.previewEmptyDesc",
                      "Si estás en modo admin, cargá la primera habitación para que la gente pueda reservar."
                    )}
                  </Typography>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }}>
                    <Button
                      component={RouterLink}
                      to={roomsUrl}
                      variant="contained"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 900,
                        textTransform: "none",
                        boxShadow: "none",
                        "&:hover": { boxShadow: "none" },
                      }}
                    >
                      {t("nav.book")}
                    </Button>
                    <Button
                      component={RouterLink}
                      to={roomsUrl}
                      variant="text"
                      sx={{ borderRadius: 999, fontWeight: 900, textTransform: "none" }}
                    >
                      {t("nav.rooms")}
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                  }}
                >
                  {rooms.map((room) => (
                    <RoomPreviewCard
                      key={room.id}
                      hostelSlug={hostelSlug!}
                      room={room}
                      fallbackDesc={t("rooms.defaultDesc", "Cómoda, luminosa y lista para tu estadía.")}
                      ctaLabel={t("rooms.viewRoom", "Ver habitación")}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* ABOUT (tu card original, más compacta) */}
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                {t("home.aboutTitle")}
              </Typography>
              <Typography sx={{ color: "text.secondary" }}>{t("home.aboutP2")}</Typography>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </>
  );
};