import { Box, Button, Container, Stack, Typography, Card, CardContent, Chip, Divider } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useHostelPublic } from "../../../hooks/useHostelPublic";
import { Seo } from "../../../components/Seo";

export const HomePage = () => {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const { hostel } = useHostelPublic(hostelSlug);
  const { t } = useTranslation();

  const base = window.location.origin;
  const canonical = hostelSlug ? `${base}/${hostelSlug}` : `${base}/`;

  const title = hostel?.name ? t("seo.homeTitleWithHostel", { hostel: hostel.name }) : t("seo.homeTitle");
  const description = hostel?.name ? t("seo.homeDescWithHostel", { hostel: hostel.name }) : t("seo.homeDesc");

  const roomsUrl = hostelSlug ? `/${hostelSlug}/rooms` : "/";

  return (
    <>
      <Seo title={title} description={description} canonical={canonical} />

      <Container sx={{ py: { xs: 3, sm: 5 } }}>
        <Stack spacing={{ xs: 2.5, sm: 3.5 }}>
          {/* HERO */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 2, md: 3 }}
            alignItems={{ md: "stretch" }}
          >
            {/* Left */}
            <Box sx={{ flex: 1, pt: { xs: 0, md: 1 } }}>
              {!!hostel?.name && (
                <Chip
                  size="small"
                  label={hostel.name}
                  sx={{ mb: 1.25, fontWeight: 800, borderRadius: 999 }}
                />
              )}

              <Typography
                variant="h1"
                sx={{
                  mb: 1,
                  lineHeight: 1.05,
                  letterSpacing: -0.6,
                }}
              >
                {t("home.heroLine1")}
              </Typography>

              <Typography
                variant="h1"
                sx={{
                  opacity: 0.95,
                  lineHeight: 1.05,
                  letterSpacing: -0.6,
                }}
              >
                {t("home.heroLine2")}
              </Typography>

              <Typography sx={{ mt: 1.75, color: "text.secondary", maxWidth: 560 }}>
                {t("home.aboutP1")}
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.2}
                sx={{ mt: 2.25, alignItems: { sm: "center" } }}
              >
                {/* CTA ÚNICO (principal) */}
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

                {/* Secundario */}
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

            {/* Right: Visual card premium */}
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
                  {/* Overlay premium */}
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.10) 60%, rgba(0,0,0,0.10))",
                    }}
                  />

                  {/* Copy */}
                  <Box sx={{ position: "relative", width: "100%" }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Chip
                        size="small"
                        label={t("home.badge", "Book direct")}
                        sx={{
                          borderRadius: 999,
                          bgcolor: "rgba(255,255,255,0.12)",
                          color: "white",
                          fontWeight: 800,
                        }}
                      />
                      <Chip
                        size="small"
                        label={t("home.badge2", "No fees")}
                        sx={{
                          borderRadius: 999,
                          bgcolor: "rgba(255,255,255,0.12)",
                          color: "white",
                          fontWeight: 800,
                        }}
                      />
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

          {/* About card */}
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                {t("home.aboutTitle")}
              </Typography>
              <Typography sx={{ color: "text.secondary" }}>{t("home.aboutP2")}</Typography>

              <Divider sx={{ my: 2 }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button
                  component={RouterLink}
                  to={roomsUrl}
                  variant="outlined"
                  sx={{
                    borderRadius: 999,
                    fontWeight: 900,
                    textTransform: "none",
                    px: 2,
                  }}
                >
                  {t("nav.rooms")}
                </Button>

                <Button
                  component={RouterLink}
                  to={roomsUrl}
                  variant="contained"
                  sx={{
                    borderRadius: 999,
                    fontWeight: 900,
                    textTransform: "none",
                    px: 2,
                    boxShadow: "none",
                    "&:hover": { boxShadow: "none" },
                  }}
                >
                  {t("nav.book")}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </>
  );
};