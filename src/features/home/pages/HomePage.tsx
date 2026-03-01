import { Box, Button, Container, Stack, Typography, Card, CardContent } from "@mui/material";
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

  const title = hostel?.name
    ? t("seo.homeTitleWithHostel", { hostel: hostel.name })
    : t("seo.homeTitle");
  const description = hostel?.name
    ? t("seo.homeDescWithHostel", { hostel: hostel.name })
    : t("seo.homeDesc");

  return (
    <>
      <Seo title={title} description={description} canonical={canonical} />

      <Container sx={{ py: { xs: 3, sm: 5 } }}>
        <Stack spacing={{ xs: 2, sm: 3 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 2, md: 3 }}
            alignItems={{ md: "stretch" }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="h1" sx={{ mb: 1 }}>
                {t("home.heroLine1")}
              </Typography>
              <Typography variant="h1" sx={{ opacity: 0.95 }}>
                {t("home.heroLine2")}
              </Typography>

              <Stack direction="row" spacing={1.2} sx={{ mt: 2, flexWrap: "wrap" }}>
                <Button
                  component={RouterLink}
                  to={hostelSlug ? `/${hostelSlug}/rooms` : "/"}
                  variant="contained"
                  size="large"
                >
                  {t("nav.book")}
                </Button>
                <Button
                  component={RouterLink}
                  to={hostelSlug ? `/${hostelSlug}/rooms` : "/"}
                  variant="outlined"
                  size="large"
                >
                  {t("nav.rooms")}
                </Button>
              </Stack>

              <Typography sx={{ mt: 2, color: "text.secondary", maxWidth: 560 }}>
                {t("home.aboutP1")}
              </Typography>
            </Box>

            <Card sx={{ flex: 1, minHeight: { xs: 240, md: 420 }, overflow: "hidden" }}>
              <CardContent sx={{ p: 0, height: "100%" }}>
                <Box
                  sx={{
                    height: "100%",
                    backgroundImage:
                      "url(https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1400&q=80)",
                    display: "flex",
                    alignItems: "flex-end",
                    p: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 800, letterSpacing: 0.2 }}>
                    {<b style={{ color: "white", textDecoration: "underline", fontStyle: "italic" }}>{"Hospedaje " + (hostel?.name.toUpperCase() ?? "HOSTLY")}</b>}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Stack>

          <Card>
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