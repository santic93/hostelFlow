import { isRouteErrorResponse, useRouteError, Link as RouterLink } from "react-router-dom";
import { Container, Typography, Button, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function AppErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();

  let title = t("errors.genericTitle");
  let description = t("errors.genericDesc");

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = t("errors.notFoundTitle");
      description = t("errors.notFoundDesc");
    } else {
      title = t("errors.errorWithStatus", { status: error.status });
      description = error.data ? String(error.data) : error.statusText || description;
    }
  }

  return (
    <Container sx={{ py: 12 }}>
      <Typography variant="h3" gutterBottom>{title}</Typography>
      <Typography sx={{ color: "text.secondary", mb: 4 }}>{description}</Typography>

      <Stack direction="row" spacing={2}>
        <Button variant="contained" component={RouterLink} to="/">
          {t("errors.goHome")}
        </Button>
        <Button variant="outlined" onClick={() => window.history.back()}>
          {t("errors.back")}
        </Button>
      </Stack>
    </Container>
  );
}