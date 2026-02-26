import { Box, Typography, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";

type Props = {
  text?: string;
  subtitle?: string;
  fullScreen?: boolean;
};

export default function HotelLoading({
  text,
  subtitle,
  fullScreen = true,
}: Props) {
  const { t } = useTranslation();

  const title = text ?? t("loading.title");
  const sub = subtitle ?? t("loading.subtitle");

  return (
    <Box
      sx={{
        minHeight: fullScreen ? "100vh" : "auto",
        display: "grid",
        placeItems: "center",
        px: 3,
      }}
    >
      <Box
        sx={{
          width: "min(460px, 100%)",
          border: "1px solid #E6E0DB",
          borderRadius: 3,
          p: 4,
          textAlign: "center",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(6px)",
        }}
      >
        {/* 🔥 LOGO + ANIMACIÓN */}
        <Box
          sx={{
            position: "relative",
            height: 100,
            mb: 3,
            display: "grid",
            placeItems: "center",
          }}
        >
          {/* Logo */}
          <Box
            component="img"
            src="/favicon.svg"
            alt="HOSTLY"
            sx={{
              width: 72,
              height: 72,
              borderRadius: 3,
              filter: "drop-shadow(0px 12px 22px rgba(0,0,0,0.22))",
              transformOrigin: "center",
              animation: "logoPulse 1.8s ease-in-out infinite",
              "@keyframes logoPulse": {
                "0%, 100%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.05)" },
              },
            }}
          />

          {/* Overlay tipo barra de carga */}
          <Box
            sx={{
              position: "absolute",
              width: 72,
              height: 72,
              borderRadius: 3,
              overflow: "hidden",
              pointerEvents: "none",

              // Capa que se llena hacia arriba
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                bottom: 0,
                width: "100%",
                height: "0%",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.55) 100%)",
                animation: "fillUp 2.2s ease-in-out infinite",
              },

              // Línea brillante que sube
              "&::after": {
                content: '""',
                position: "absolute",
                left: 0,
                bottom: 0,
                width: "100%",
                height: "3px",
                background: "rgba(255,255,255,0.9)",
                filter: "blur(0.4px)",
                animation: "fillLine 2.2s ease-in-out infinite",
              },

              "@keyframes fillUp": {
                "0%": { height: "0%", opacity: 0.0 },
                "10%": { opacity: 0.55 },
                "35%": { height: "35%", opacity: 0.55 },
                "60%": { height: "70%", opacity: 0.55 },
                "85%": { height: "100%", opacity: 0.55 },
                "100%": { height: "100%", opacity: 0.0 },
              },

              "@keyframes fillLine": {
                "0%": { transform: "translateY(0px)", opacity: 0.0 },
                "10%": { opacity: 0.9 },
                "35%": { transform: "translateY(-25px)", opacity: 0.9 },
                "60%": { transform: "translateY(-50px)", opacity: 0.9 },
                "85%": { transform: "translateY(-69px)", opacity: 0.9 },
                "100%": { transform: "translateY(-69px)", opacity: 0.0 },
              },
            }}
          />
        </Box>

        {/* Texto */}
        <Typography sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress size={22} />
        </Box>

        {!!sub && (
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 2 }}>
            {sub}
          </Typography>
        )}
      </Box>
    </Box>
  );
}