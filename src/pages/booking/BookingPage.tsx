import { useNavigate, useParams } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { DatePicker } from "@mui/x-date-pickers";
// locales dayjs
import "dayjs/locale/es";
import "dayjs/locale/pt-br";
// MUI date pickers locales

import {
  Button,
  Stack,
  Box,
  Typography,
  Container,
  Grid,
  TextField,
  Alert,
} from "@mui/material";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useTranslation } from "react-i18next";

import { db } from "../../services/firebase";

export const BookingPage = () => {
  const navigate = useNavigate();
  const { hostelSlug, roomId } = useParams();
  const { t, i18n } = useTranslation();

  // idioma corto: es | en | pt
  const lng = (i18n.language || "es").slice(0, 2);

  // mapeo de dayjs locale
  const dayjsLocale = lng === "pt" ? "pt-br" : lng === "en" ? "en" : "es";

  // setear dayjs locale cuando cambie el idioma
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

  // mensajes UX
  const [formError, setFormError] = useState<string | null>(null);

  const isEmailValid = /^\S+@\S+\.\S+$/.test(email);
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

  const nights = checkIn && checkOut ? Math.max(0, checkOut.diff(checkIn, "day")) : 0;
  const total = selectedRoom && nights > 0 ? nights * selectedRoom.price : 0;

  const isFormValid =
    !!selectedRoom && nights > 0 && fullName.trim().length > 2 && isEmailValid;

  const checkAvailability = async () => {
    if (!hostelSlug || !selectedRoom || !checkIn || !checkOut) return false;

    const q = query(
      collection(db, "hostels", hostelSlug, "reservations"),
      where("roomId", "==", selectedRoom.id)
    );

    const snapshot = await getDocs(q);

    const newCheckIn = checkIn.toDate();
    const newCheckOut = checkOut.toDate();

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as any;

      if (data.status === "cancelled") continue;
      if (!data.checkIn || !data.checkOut) continue;

      const existingCheckIn = data.checkIn.toDate();
      const existingCheckOut = data.checkOut.toDate();

      const isOverlapping = newCheckIn < existingCheckOut && newCheckOut > existingCheckIn;
      if (isOverlapping) return false;
    }

    return true;
  };

  const handleConfirm = async () => {
    setFormError(null);

    if (!isFormValid || !hostelSlug || !selectedRoom) return;

    try {
      setLoading(true);

      const available = await checkAvailability();
      if (!available) {
        setFormError(t("booking.unavailable"));
        return;
      }

      await addDoc(collection(db, "hostels", hostelSlug, "reservations"), {
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        pricePerNight: selectedRoom.price,
        checkIn: checkIn?.toDate(),
        checkOut: checkOut?.toDate(),
        nights,
        total,
        fullName,
        email,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
    } catch (error) {
      console.error("Error saving reservation:", error);
      setFormError(t("booking.errorSaving"));
    } finally {
      setLoading(false);
    }
  };

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

  if (!hostelSlug) return null;

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
          <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={4}>
                <DatePicker
                  label={t("booking.checkIn")}
                  value={checkIn}
                  minDate={dayjs()}
                  onChange={(newValue) => setCheckIn(newValue)}
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
              disabled={!isFormValid || loading}
              onClick={handleConfirm}
            >
              {loading ? t("booking.processing") : t("booking.confirm")}
            </Button>
          </Grid>

          {/* RIGHT */}
          <Grid size={{ xs: 12, md: 5 }}>
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
                    {nights > 0 ? t("booking.summaryNights", { n: nights }) : t("booking.summarySelectDates")}
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