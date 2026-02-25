import { Box, Typography, Button, Grid } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";

import { RoomsPage } from "../rooms/RoomsPage";
import { useHostelPublic } from "../../hooks/useHostelPublic";
import { Seo } from "../../components/Seo";
import { useTranslation } from "react-i18next";
// ...

export const HomePage = () => {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const { hostel } = useHostelPublic(hostelSlug);
  const { t, i18n } = useTranslation();

  const base = window.location.origin;
  const canonical = hostelSlug ? `${base}/${hostelSlug}` : `${base}/`;

  // SEO traducible
  const title = hostel?.name
    ? t("seo.homeTitleWithHostel", { hostel: hostel.name })
    : t("seo.homeTitle");

  const description = hostel?.name
    ? t("seo.homeDescWithHostel", { hostel: hostel.name })
    : t("seo.homeDesc");

  return (
    <Box>
      <Seo title={title} description={description} canonical={canonical} />

      <Grid container sx={{ minHeight: "80vh" }}>
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{ display: "flex", flexDirection: "column", justifyContent: "center", pr: { md: 6 } }}
        >
          <Typography variant="h1" gutterBottom>
            {t("home.heroLine1")}
            <br />
            {t("home.heroLine2")}
          </Typography>

          <Button
            variant="contained"
            component={RouterLink}
            to={hostelSlug ? `/${hostelSlug}/rooms` : "/"}
            sx={{ mt: 4, width: "fit-content", px: 4, py: 1.5, letterSpacing: 1.5 }}
          >
            {t("nav.book")}
          </Button>
        </Grid>

        {/* imagen igual */}
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            minHeight: { xs: 400, md: "auto" },
            backgroundImage:
              "url(https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1400&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </Grid>

      <Grid container spacing={6} sx={{ mt: 12, alignItems: "center" }}>
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            minHeight: 400,
            backgroundImage:
              "url(https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1400&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h2" gutterBottom>
            {t("home.aboutTitle")}
          </Typography>

          <Typography variant="body1" sx={{ mb: 3 }}>
            {t("home.aboutP1")}
          </Typography>

          <Typography variant="body1" sx={{ mb: 4 }}>
            {t("home.aboutP2")}
          </Typography>

          <Button variant="outlined">{t("home.learnMore")}</Button>
        </Grid>
      </Grid>

      <Box sx={{ mt: 16 }}>
        <Grid container spacing={6}>
          <RoomsPage />
        </Grid>
      </Box>
    </Box>
  );
};