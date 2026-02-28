import { Outlet, useParams, Link as RouterLink } from "react-router-dom";
import { Container, Typography, Button, Stack } from "@mui/material";
import { useHostelPublic } from "../../../hooks/useHostelPublic";
import { useTranslation } from "react-i18next";
import HotelLoading from "../../../components/HotelLoading";
import { useAuth } from "../../providers/AuthContext";

function safeSlug(input?: string) {
  return (input ?? "").toString().trim();
}

export default function TenantGuard() {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const { hostel, loading } = useHostelPublic(hostelSlug);
  const { loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const slug = safeSlug(hostelSlug);

  // 🔥 Si Auth todavía está cargando, no hacemos nada (AuthProvider ya muestra loader)
  if (authLoading) return null;

  // 🔥 Si el tenant está cargando, mostramos el MISMO loader pero con texto distinto
  if (loading) {
    return (
      <HotelLoading
        text={t("tenant.loadingTitle")}
        subtitle={t("tenant.loadingSubtitle")}
      />
    );
  }

  if (!hostel) {
    return (
      <Container sx={{ py: 12 }}>
        <Typography variant="h3" gutterBottom>
          {t("tenant.notFoundTitle")}
        </Typography>

        <Typography sx={{ color: "text.secondary", mb: 4 }}>
          {t("tenant.notFoundDesc", { slug })}
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button variant="contained" component={RouterLink} to="/">
            {t("tenant.actions.search")}
          </Button>

          <Button variant="outlined" component={RouterLink} to="/login">
            {t("tenant.actions.adminLogin")}
          </Button>
        </Stack>
      </Container>
    );
  }

  return <Outlet />;
}