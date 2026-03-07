import { Container, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export const GalleryPage = () => {
  const { t } = useTranslation();

  return (
    <Container sx={{ py: 10 }}>
      <Typography variant="h2">
        {t("gallery.title")}
      </Typography>
    </Container>
  );
};