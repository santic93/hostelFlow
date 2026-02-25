import { Box, Button, Container, Typography } from "@mui/material";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { db } from "../../services/firebase";


type Status = "loading" | "ok" | "notfound" | "error";

export default function TenantGuard() {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [hostelName, setHostelName] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      if (!hostelSlug) return;

      try {
        setStatus("loading");
        const snap = await getDoc(doc(db, "hostels", hostelSlug));

        if (!snap.exists()) {
          setStatus("notfound");
          return;
        }

        const data = snap.data() as any;
        setHostelName(data?.name ?? hostelSlug);
        setStatus("ok");
      } catch (e) {
        setStatus("error");
      }
    };

    run();
  }, [hostelSlug]);

  if (status === "loading") {
    return (
      <Container sx={{ py: 12 }}>
        <Typography variant="h5">Cargando hostel...</Typography>
      </Container>
    );
  }

  if (status === "notfound") {
    return (
      <Container sx={{ py: 12, maxWidth: 600 }}>
        <Typography variant="h3" gutterBottom>
          Hostel no encontrado
        </Typography>
        <Typography sx={{ color: "text.secondary", mb: 3 }}>
          El link <b>/{hostelSlug}</b> no existe o está mal escrito.
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button variant="contained" onClick={() => navigate("/", { replace: true })}>
            Volver al inicio
          </Button>
          <Button variant="outlined" onClick={() => navigate("/login")}>
            Admin Login
          </Button>
        </Box>
      </Container>
    );
  }

  if (status === "error") {
    return (
      <Container sx={{ py: 12, maxWidth: 600 }}>
        <Typography variant="h3" gutterBottom>
          Error cargando hostel
        </Typography>
        <Typography sx={{ color: "text.secondary", mb: 3 }}>
          Probá de nuevo.
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </Container>
    );
  }

  // status === "ok"
  // Podés guardar hostelName en contexto luego, si querés
  return <Outlet />;
}