import { Box, Typography } from "@mui/material";
import HotelIcon from "@mui/icons-material/Hotel";
import LuggageIcon from "@mui/icons-material/Luggage";
import CircularProgress from "@mui/material/CircularProgress";

type Props = {
  text?: string;
  fullScreen?: boolean;
};

export default function HotelLoading({ text = "Cargando...", fullScreen = true }: Props) {
  const Wrapper = fullScreen ? Box : Box;

  return (
    <Wrapper
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
        }}
      >
        <Box sx={{ position: "relative", height: 86, mb: 2 }}>
          {/* Hotel */}
          <HotelIcon
            sx={{
              fontSize: 64,
              color: "#730202",
              position: "absolute",
              left: "50%",
              top: 0,
              transform: "translateX(-50%)",
            }}
          />

          {/* Valija “moviéndose” */}
          <LuggageIcon
            sx={{
              fontSize: 34,
              color: "#ab003c",
              position: "absolute",
              left: "50%",
              bottom: 0,
              transform: "translateX(-50%)",
              animation: "suitcaseMove 1.2s ease-in-out infinite",
              "@keyframes suitcaseMove": {
                "0%": { transform: "translateX(-60px)" },
                "50%": { transform: "translateX(20px)" },
                "100%": { transform: "translateX(-60px)" },
              },
            }}
          />
        </Box>

        <Typography sx={{ fontWeight: 600, mb: 1 }}>{text}</Typography>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress size={22} />
        </Box>

        <Typography variant="body2" sx={{ color: "text.secondary", mt: 2 }}>
          Preparando tu panel de reservas…
        </Typography>
      </Box>
    </Wrapper>
  );
}