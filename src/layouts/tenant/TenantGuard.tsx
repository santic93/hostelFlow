import { Outlet, useParams, Link as RouterLink } from "react-router-dom";
import { Container, Typography, Button, Stack } from "@mui/material";
import { useHostelPublic } from "../../hooks/useHostelPublic";


export default function TenantGuard() {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const { hostel, loading } = useHostelPublic(hostelSlug);

  if (loading) {
    return (
      <Container sx={{ py: 10 }}>
        <Typography>Cargando...</Typography>
      </Container>
    );
  }

  if (!hostel) {
    return (
      <Container sx={{ py: 12 }}>
        <Typography variant="h3" gutterBottom>Hostel no encontrado</Typography>
        <Typography sx={{ color: "text.secondary", mb: 4 }}>
          El link <b>{hostelSlug}</b> no existe. Revisá el slug o buscá otro.
        </Typography>

        <Stack direction="row" spacing={2}>
          <Button variant="contained" component={RouterLink} to="/">
            Buscar hostel
          </Button>
          <Button variant="outlined" component={RouterLink} to="/login">
            Admin login
          </Button>
        </Stack>
      </Container>
    );
  }

  return <Outlet />;
}