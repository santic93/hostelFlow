import { isRouteErrorResponse, useRouteError, Link as RouterLink } from "react-router-dom";
import { Container, Typography, Button, Stack } from "@mui/material";

export default function AppErrorPage() {
  const error = useRouteError();

  let title = "Algo salió mal";
  let description = "Ocurrió un error inesperado.";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Página no encontrada (404)";
      description = "El link no existe o fue movido.";
    } else {
      title = `Error ${error.status}`;
      description = error.statusText || description;
    }
  }

  return (
    <Container sx={{ py: 12 }}>
      <Typography variant="h3" gutterBottom>{title}</Typography>
      <Typography sx={{ color: "text.secondary", mb: 4 }}>{description}</Typography>

      <Stack direction="row" spacing={2}>
        <Button variant="contained" component={RouterLink} to="/">
          Ir al inicio
        </Button>
        <Button variant="outlined" onClick={() => window.history.back()}>
          Volver
        </Button>
      </Stack>
    </Container>
  );
}