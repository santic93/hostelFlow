import { Box, Button, MobileStepper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";

export function RoomCardCarousel({ urls, alt }: { urls: string[]; alt: string }) {
  const safe = (urls ?? []).filter(Boolean);
  const { t } = useTranslation();
  const [active, setActive] = useState(0);

  const max = safe.length;

  useEffect(() => {
    setActive(0);
  }, [max]);

  const imageHeight = { xs: 220, sm: 240, md: 230 };

  if (!max) {
    return (
      <Box sx={{ p: 1.5, pb: 0 }}>
        <Box
          sx={{
            height: imageHeight,
            bgcolor: "grey.50",
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            display: "grid",
            placeItems: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 20% 20%, rgba(0,0,0,0.05), transparent 55%), radial-gradient(circle at 80% 0%, rgba(0,0,0,0.04), transparent 45%)",
            }}
          />
          <Box sx={{ position: "relative", textAlign: "center", px: 2 }}>
            <Typography sx={{ fontWeight: 800 }}>
              {t("rooms.noImageTitle", "Sin imagen")}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t("rooms.noImageSubtitle", "Esta habitación todavía no tiene fotos.")}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  const canBack = active > 0;
  const canNext = active < max - 1;

  return (
    <Box>
      <Box sx={{ p: 1.5, pb: 0 }}>
        <Box
          sx={{
            height: imageHeight,
            overflow: "hidden",
            position: "relative",
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "grey.50",
          }}
        >
          <Box
            component="img"
            src={safe[active]}
            alt={alt}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.35), transparent 55%)",
              pointerEvents: "none",
            }}
          />

          {max > 1 && (
            <Box
              sx={{
                position: "absolute",
                top: 14,
                right: 14,
                px: 1,
                py: 0.45,
                borderRadius: 999,
                bgcolor: "rgba(0,0,0,0.55)",
                color: "white",
                fontSize: 12,
                fontWeight: 700,
                zIndex: 2,
              }}
            >
              {t("carousel.of", { current: active + 1, total: max })}
            </Box>
          )}

          {max > 1 && (
            <>
              <Box
                onClick={() => canBack && setActive((p) => p - 1)}
                role="button"
                aria-label="prev"
                sx={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "32%",
                  cursor: canBack ? "pointer" : "default",
                }}
              />
              <Box
                onClick={() => canNext && setActive((p) => p + 1)}
                role="button"
                aria-label="next"
                sx={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: "32%",
                  cursor: canNext ? "pointer" : "default",
                }}
              />
            </>
          )}
        </Box>
      </Box>

      {max > 1 && (
        <Box sx={{ px: 1.5, py: 0.85 }}>
          <MobileStepper
            variant="dots"
            steps={max}
            position="static"
            activeStep={active}
            sx={{
              bgcolor: "transparent",
              p: 0,
              "& .MuiMobileStepper-dot": { mx: 0.3 },
            }}
            nextButton={
              <Button size="small" onClick={() => setActive((p) => p + 1)} disabled={!canNext}>
                {t("carousel.next")} <KeyboardArrowRight />
              </Button>
            }
            backButton={
              <Button size="small" onClick={() => setActive((p) => p - 1)} disabled={!canBack}>
                <KeyboardArrowLeft /> {t("carousel.back")}
              </Button>
            }
          />
        </Box>
      )}
    </Box>
  );
}