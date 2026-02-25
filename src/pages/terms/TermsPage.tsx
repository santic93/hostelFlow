import { Box, Typography } from "@mui/material";

import { useParams } from "react-router-dom";
import { Seo } from "../../components/Seo";

export function TermsPage() {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const base = window.location.origin;
  const canonical = hostelSlug ? `${base}/${hostelSlug}/terms` : `${base}/terms`;

  return (
    <Box>
      <Seo title="Terms — REDSTAYS" description="Terms and conditions." canonical={canonical} noindex />
      <Typography variant="h3" gutterBottom>Terms & Conditions</Typography>
      <Typography sx={{ color: "text.secondary" }}>
        (MVP) Acá van tus términos. Te conviene tenerlo para vender B2B.
      </Typography>
    </Box>
  );
}