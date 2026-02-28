import { Box, Typography } from "@mui/material";

import { useParams } from "react-router-dom";
import { Seo } from "../../components/Seo";

export function PrivacyPage() {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const base = window.location.origin;
  const canonical = hostelSlug ? `${base}/${hostelSlug}/privacy` : `${base}/privacy`;

  return (
    <Box>
      <Seo title="Privacy — HOSTLY" description="Privacy policy." canonical={canonical} noindex />
      <Typography variant="h3" gutterBottom>Privacy Policy</Typography>
      <Typography sx={{ color: "text.secondary" }}>
        (MVP) Explicá qué guardás: nombre, email, fechas de reserva, roomId, etc.
      </Typography>
    </Box>
  );
}