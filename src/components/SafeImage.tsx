import { useState } from "react";
import BrokenImageOutlinedIcon from "@mui/icons-material/BrokenImageOutlined";
import { Box, Typography } from "@mui/material";
type Props = {
  src?: string;
  alt?: string;
  sx?: any;
  ratio?: string; // "4 / 3" | "16 / 9" etc
};

export default function SafeImage({ src, alt, sx, ratio = "4 / 3" }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const showFallback = !src || failed;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: ratio,
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "grey.100",
        ...sx,
      }}
    >
      {/* Skeleton mientras carga */}
      {!showFallback && !loaded && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "grey.100",
          }}
        >
          <Box sx={{ width: "100%", height: "100%" }}>
            <Box
              sx={{
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.2s infinite",
              }}
            />
          </Box>
          <style>
            {`
              @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}
          </style>
        </Box>
      )}

      {/* Fallback */}
      {showFallback ? (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "grey.500",
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <BrokenImageOutlinedIcon sx={{ fontSize: 56 }} />
            <Typography variant="caption" sx={{ display: "block", mt: 1, color: "grey.600" }}>
              Sin imagen
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          <Box
            component="img"
            src={src}
            alt={alt ?? ""}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              opacity: loaded ? 1 : 0,
              transition: "opacity .25s ease",
            }}
          />

          {/* Overlay sutil para look premium */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.00) 45%, rgba(0,0,0,0.10) 100%)",
            }}
          />
        </>
      )}
    </Box>
  );
}