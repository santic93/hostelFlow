import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import dayjs, { Dayjs } from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import "dayjs/locale/es";
import "dayjs/locale/en";
import "dayjs/locale/pt-br";
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { doc, getDoc } from "firebase/firestore";
import HotelLoading from "../../components/HotelLoading";
import { createReservation } from "../../services/reservations";
import { db } from "../../firebase";
dayjs.extend(isSameOrBefore);
export const BookingPage = () => {
  const navigate = useNavigate();
  const { hostelSlug, roomId } = useParams();
  const { t, i18n } = useTranslation();

  const lng = (i18n.language || "es").slice(0, 2);
  const dayjsLocale = lng === "pt" ? "pt-br" : lng === "en" ? "en" : "es";

  useEffect(() => {
    dayjs.locale(dayjsLocale);
  }, [dayjsLocale]);

  const [checkIn, setCheckIn] = useState<Dayjs | null>(null);
  const [checkOut, setCheckOut] = useState<Dayjs | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  const isEmailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const showEmailError = emailTouched && email.length > 0 && !isEmailValid;

  useEffect(() => {
    const fetchRoom = async () => {
      if (!hostelSlug || !roomId) return;

      const docSnap = await getDoc(doc(db, "hostels", hostelSlug, "rooms", roomId));
      if (docSnap.exists()) {
        setSelectedRoom({ id: docSnap.id, ...docSnap.data() });
      } else {
        setSelectedRoom(null);
      }
    };

    fetchRoom();
  }, [hostelSlug, roomId]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return Math.max(0, checkOut.diff(checkIn, "day"));
  }, [checkIn, checkOut]);

  const total = useMemo(() => {
    if (!selectedRoom || nights <= 0) return 0;
    return nights * Number(selectedRoom.price || 0);
  }, [selectedRoom, nights]);

  const isFormValid =
    !!hostelSlug &&
    !!selectedRoom &&
    nights > 0 &&
    fullName.trim().length > 2 &&
    isEmailValid;

  const handleConfirm = async () => {
    setFormError(null);
    if (!isFormValid || !hostelSlug || !selectedRoom || !checkIn || !checkOut) return;

    try {
      setLoading(true);

      await createReservation({
        hostelSlug,
        roomId: selectedRoom.id,
        checkInISO: checkIn.startOf("day").toDate().toISOString(),
        checkOutISO: checkOut.startOf("day").toDate().toISOString(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
      });

      setSuccess(true);
    } catch (err: any) {
      console.error("confirmReservation error:", err);

      // Errores más comunes (function)
      const msg = String(err?.message || "");
      if (msg.toLowerCase().includes("fechas no disponibles") || err?.code === "already-exists") {
        setFormError(t("booking.unavailable"));
      } else {
        setFormError(t("booking.errorSaving"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!hostelSlug) return null;

  if (loading) {
    return (
      <HotelLoading
        fullScreen={false}
        text={t("booking.processing")}
        subtitle=""
      />
    );
  }

  if (success) {
    return (
      <Container sx={{ py: 15, textAlign: "center" }}>
        <Typography variant="h2" gutterBottom>
          {t("booking.successTitle")}
        </Typography>
        <Typography sx={{ mb: 4 }}>{t("booking.successText")}</Typography>
      </Container>
    );
  }

  return (
    <>
      <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIosNewIcon />}>
        {t("booking.back")}
      </Button>

      <Container sx={{ py: 10 }}>
        <Typography variant="h2" gutterBottom>
          {t("booking.title")}
        </Typography>

        {formError && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {formError}
          </Alert>
        )}

        <Grid container spacing={8} sx={{ mt: 4 }}>
          {/* LEFT */}
          <Grid sx={{xs: 12, md: 7}}>
            <Stack spacing={4}>
              <DatePicker
                label={t("booking.checkIn")}
                value={checkIn}
                minDate={dayjs()}
                onChange={(newValue) => {
                  setCheckIn(newValue);
                  // si el usuario cambia check-in y el check-out queda inválido, lo reseteo
                  if (checkOut && newValue && checkOut.isSameOrBefore(newValue, "day")) {
                    setCheckOut(null);
                  }
                }}
              />

              <DatePicker
                label={t("booking.checkOut")}
                value={checkOut}
                minDate={checkIn || dayjs()}
                onChange={(newValue) => setCheckOut(newValue)}
              />
            </Stack>

            <Stack spacing={4} sx={{ mt: 6 }}>
              <TextField
                label={t("booking.fullName")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                fullWidth
              />

              <TextField
                label={t("booking.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                fullWidth
                error={showEmailError}
                helperText={showEmailError ? t("booking.emailInvalid") : ""}
              />
            </Stack>

            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 6, py: 2 }}
              disabled={!isFormValid}
              onClick={handleConfirm}
            >
              {t("booking.confirm")}
            </Button>
          </Grid>

          {/* RIGHT */}
          <Grid sx={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                border: "1px solid #E0E0E0",
                borderRadius: 3,
                p: 4,
                position: { md: "sticky" },
                top: { md: 100 },
              }}
            >
              {selectedRoom ? (
                <>
                  <Typography variant="h5" gutterBottom>
                    {selectedRoom.name}
                  </Typography>

                  <Typography sx={{ mb: 2 }}>
                    {t("booking.summaryPerNight", { price: selectedRoom.price })}
                  </Typography>

                  <Box sx={{ borderTop: "1px solid #eee", my: 3 }} />

                  <Typography>
                    {nights > 0
                      ? t("booking.summaryNights", { n: nights })
                      : t("booking.summarySelectDates")}
                  </Typography>

                  <Typography variant="h6" sx={{ mt: 2 }}>
                    {t("booking.summaryTotal", { total })}
                  </Typography>
                </>
              ) : (
                <Typography>{t("booking.summarySelectRoom")}</Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};