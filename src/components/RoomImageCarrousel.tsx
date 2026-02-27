import { useEffect, useRef, useState } from "react";
import SafeImage from "./SafeImage";
import { Box, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

type Props = {
  images: string[];
  alt?: string;
  sx?: any;
  ratio?: string;
};

export function RoomImageCarousel({ images, alt, sx, ratio = "4 / 3" }: Props) {
  const safe = (images ?? []).filter(Boolean);
  const [index, setIndex] = useState(0);

  const canCarousel = safe.length >= 2;

  useEffect(() => {
    // si cambia la lista, reseteo
    setIndex(0);
  }, [safe.length]);

  const go = (next: number) => {
    if (!safe.length) return;
    const max = safe.length - 1;
    const clamped = Math.max(0, Math.min(max, next));
    setIndex(clamped);
  };

  // simple swipe/drag
  const startX = useRef<number | null>(null);

  const onDown = (clientX: number) => {
    startX.current = clientX;
  };

  const onUp = (clientX: number) => {
    if (startX.current == null) return;
    const dx = clientX - startX.current;
    startX.current = null;

    if (Math.abs(dx) < 40) return;
    if (dx < 0) go(index + 1);
    else go(index - 1);
  };

  if (!safe.length) {
    return <SafeImage src="" alt={alt} sx={sx} ratio={ratio} />;
  }

  if (!canCarousel) {
    return <SafeImage src={safe[0]} alt={alt} sx={sx} ratio={ratio} />;
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        ...sx,
      }}
    >
      <Box
        sx={{
          position: "relative",
          borderRadius: 3,
          overflow: "hidden",
          touchAction: "pan-y",
        }}
        onMouseDown={(e) => onDown(e.clientX)}
        onMouseUp={(e) => onUp(e.clientX)}
        onTouchStart={(e) => onDown(e.touches[0].clientX)}
        onTouchEnd={(e) => onUp(e.changedTouches[0].clientX)}
      >
        <SafeImage src={safe[index]} alt={alt} ratio={ratio} />

        {/* Flechas (desktop) */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
          }}
        >
          <IconButton
            onClick={() => go(index - 1)}
            disabled={index === 0}
            sx={{
              position: "absolute",
              top: "50%",
              left: 8,
              transform: "translateY(-50%)",
              bgcolor: "rgba(255,255,255,0.9)",
              "&:hover": { bgcolor: "rgba(255,255,255,1)" },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>

          <IconButton
            onClick={() => go(index + 1)}
            disabled={index === safe.length - 1}
            sx={{
              position: "absolute",
              top: "50%",
              right: 8,
              transform: "translateY(-50%)",
              bgcolor: "rgba(255,255,255,0.9)",
              "&:hover": { bgcolor: "rgba(255,255,255,1)" },
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Dots */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 8,
            display: "flex",
            justifyContent: "center",
            gap: 0.75,
            pointerEvents: "none",
          }}
        >
          {safe.map((_, i) => (
            <Box
              key={i}
              sx={{
                width: i === index ? 18 : 8,
                height: 8,
                borderRadius: 999,
                bgcolor: i === index ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)",
                transition: "all .2s ease",
                boxShadow: "0 2px 8px rgba(0,0,0,0.20)",
              }}
            />
          ))}
        </Box>
      </Box>

      {/* contador */}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          px: 1,
          py: 0.4,
          borderRadius: 999,
          bgcolor: "rgba(0,0,0,0.55)",
          color: "white",
          fontSize: 12,
        }}
      >
        {index + 1}/{safe.length}
      </Box>
    </Box>
  );
}