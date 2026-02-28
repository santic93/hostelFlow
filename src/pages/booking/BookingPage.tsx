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
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { doc, getDoc } from "firebase/firestore";
import HotelLoading from "../../components/HotelLoading";
import { createReservation } from "../../services/reservations";
import { db } from "../../services/firebase";

dayjs.extend(isSameOrBefore);

function getCallableErrorInfo(err: any) {
  const code = err?.code ?? err?.name ?? "unknown";
  const message = err?.message ?? "Unknown error";
  const details = err?.details ?? null;
  return { code, message, details };
}

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
      if (docSnap.exists()) setSelectedRoom({ id: docSnap.id, ...docSnap.data() });
      else setSelectedRoom(null);
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
      const payload = {
        hostelSlug,
        roomId: selectedRoom.id,
        checkInISO: checkIn.startOf("day").toDate().toISOString(),
        checkOutISO: checkOut.startOf("day").toDate().toISOString(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
      };

      const res = await createReservation(payload);
      if (res?.ok) setSuccess(true);
      else setFormError(t("booking.errorSaving"));
    } catch (err: any) {
      const info = getCallableErrorInfo(err);
      const msg = String(info.message || "").toLowerCase();
      const code = String(info.code || "").toLowerCase();

      if (msg.includes("fechas no disponibles") || code.includes("already-exists")) {
        setFormError(t("booking.unavailable"));
      } else {
        setFormError(t("booking.errorSaving"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!hostelSlug) return null;

  if (loading) return <HotelLoading />;

  if (success) {
    return (
      <Container sx={{ py: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
              {t("booking.successTitle")}
            </Typography>
            <Typography sx={{ color: "text.secondary" }}>{t("booking.successText")}</Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack spacing={2}>
        <Button variant="outlined" onClick={() => navigate(-1)} sx={{ alignSelf: "flex-start" }}>
          {t("booking.back")}
        </Button>

        <Typography variant="h2">{t("booking.title")}</Typography>

        {formError && <Alert severity="error">{formError}</Alert>}

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
          {/* FORM */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Stack spacing={2}>
                <DatePicker
                  label={t("booking.checkIn")}
                  value={checkIn}
                  onChange={(newValue) => {
                    setCheckIn(newValue);
                    if (checkOut && newValue && checkOut.isSameOrBefore(newValue, "day")) {
                      setCheckOut(null);
                    }
                  }}
                />

                <DatePicker
                  label={t("booking.checkOut")}
                  value={checkOut}
                  onChange={(newValue) => setCheckOut(newValue)}
                  minDate={checkIn ? checkIn.add(1, "day") : undefined}
                />

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

                <Button
                  variant="contained"
                  size="large"
                  disabled={!isFormValid}
                  onClick={handleConfirm}
                >
                  {t("booking.confirm")}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* SUMMARY */}
          <Card sx={{ width: { xs: "100%", md: 380 }, flexShrink: 0 }}>
            <CardContent>
              {selectedRoom ? (
                <Stack spacing={1.2}>
                  <Typography sx={{ fontWeight: 900, fontSize: 18 }}>{selectedRoom.name}</Typography>
                  <Typography sx={{ color: "text.secondary" }}>
                    {t("booking.summaryPerNight", { price: selectedRoom.price })}
                  </Typography>
                  <Typography sx={{ color: "text.secondary" }}>
                    {nights > 0 ? t("booking.summaryNights", { n: nights }) : t("booking.summarySelectDates")}
                  </Typography>

                  <Box sx={{ height: 10 }} />

                  <Typography sx={{ fontWeight: 900, fontSize: 20 }}>
                    {t("booking.summaryTotal", { total })}
                  </Typography>

                  <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                    Confirmación por email. Sin comisión.
                  </Typography>
                </Stack>
              ) : (
                <Typography sx={{ opacity: 0.75 }}>{t("booking.summarySelectRoom")}</Typography>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </Container>
  );
};