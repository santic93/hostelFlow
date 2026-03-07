import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  CircularProgress,
} from "@mui/material";

import dayjs, { Dayjs } from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

import { getDoc, doc } from "firebase/firestore";
import { db } from "../../services/firebase";

import HotelLoading from "../../components/HotelLoading";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";

import { createReservation, getRoomAvailability } from "../../services/reservations";

dayjs.extend(isSameOrBefore);

function getCallableErrorInfo(err: any) {
  const code = err?.code ?? err?.name ?? "unknown";
  const message = err?.message ?? "Unknown error";
  const details = err?.details ?? null;
  return { code, message, details };
}

// helper: YYYY-MM-DD
function fmt(d: Dayjs) {
  return d.format("YYYY-MM-DD");
}

// check-in inclusive, check-out exclusive (nights)
function eachNightInclusive(from: Dayjs, to: Dayjs) {
  const out: string[] = [];
  let cur = from.startOf("day");
  const end = to.startOf("day");
  while (cur.isBefore(end, "day")) {
    out.push(fmt(cur));
    cur = cur.add(1, "day");
  }
  return out;
}

/**
 * CustomDay para MUI X v6/v7
 * - sin tipos estrictos para evitar conflictos TS por versión
 */
function CustomDay(props: any) {
  const { blockedSet, day, outsideCurrentMonth, ...other } = props;

  const key = dayjs(day).format("YYYY-MM-DD");
  const blocked = blockedSet instanceof Set ? blockedSet.has(key) : false;

  return (
    <Box sx={{ position: "relative" }}>
      <PickersDay {...other} day={day} outsideCurrentMonth={outsideCurrentMonth} />

      {blocked && (
        <Box
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 16,
            height: 16,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            fontWeight: 900,
            bgcolor: "rgba(0,0,0,0.15)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          ×
        </Box>
      )}
    </Box>
  );
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
  const [loadingAvail, setLoadingAvail] = useState(false);

  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // noches ocupadas (YYYY-MM-DD)
  const [blockedSet, setBlockedSet] = useState<Set<string>>(new Set());

  const isEmailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const showEmailError = emailTouched && email.length > 0 && !isEmailValid;

  const today = dayjs().startOf("day");
  const horizonFrom = today;
  const horizonTo = today.add(365, "day");

  // ✅ money formatter (mejora visual, no rompe nada)
  const money = useMemo(() => {
    const lang = (i18n.language || "es").slice(0, 2);
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }, [i18n.language]);

  // 1) room
  useEffect(() => {
    const fetchRoom = async () => {
      if (!hostelSlug || !roomId) return;
      const docSnap = await getDoc(doc(db, "hostels", hostelSlug, "rooms", roomId));
      if (docSnap.exists()) setSelectedRoom({ id: docSnap.id, ...docSnap.data() });
      else setSelectedRoom(null);
    };
    fetchRoom();
  }, [hostelSlug, roomId]);

  // 2) availability (room_nights) vía cloud function
  useEffect(() => {
    const run = async () => {
      if (!hostelSlug || !roomId) return;

      setLoadingAvail(true);
      setFormError(null);

      try {
        const res = await getRoomAvailability({
          hostelSlug,
          roomId,
          from: horizonFrom.format("YYYY-MM-DD"),
          to: horizonTo.format("YYYY-MM-DD"),
        });

        const s = new Set<string>((res?.dates ?? []).filter(Boolean));
        setBlockedSet(s);

        // si el usuario tenía fechas elegidas, revalidamos
        if (checkIn && s.has(fmt(checkIn))) {
          setCheckIn(null);
          setCheckOut(null);
        }

        if (checkIn && checkOut) {
          const nightsArr = eachNightInclusive(checkIn, checkOut);
          if (nightsArr.some((d) => s.has(d))) {
            setCheckOut(null);
          }
        }
      } catch (err: any) {
        // Si falla availability, NO bloqueamos el booking (backend igual valida)
        console.error("getRoomAvailability failed", err);
      } finally {
        setLoadingAvail(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const isBlockedNight = (d: Dayjs) => blockedSet.has(d.format("YYYY-MM-DD"));

  // ✅ check-in: bloquea pasado + noches ocupadas
  const shouldDisableCheckIn = (d: Dayjs) => d.isBefore(today, "day") || isBlockedNight(d);

  // ✅ check-out: SOLO bloquea pasado (porque checkOut es “exclusive”)
  // (el rango se valida en onChange y confirm)
  const shouldDisableCheckOut = (d: Dayjs) => d.isBefore(today.add(1, "day"), "day");

  const handleConfirm = async () => {
    setFormError(null);
    if (!isFormValid || !hostelSlug || !selectedRoom || !checkIn || !checkOut) return;

    // guard extra: no permitir rangos que incluyan noches bloqueadas
    const nightsArr = eachNightInclusive(checkIn, checkOut);
    if (nightsArr.some((d) => blockedSet.has(d))) {
      setFormError(t("booking.unavailable"));
      return;
    }

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
            <Typography sx={{ color: "text.secondary" }}>
              {t("booking.successText")}
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack spacing={2}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{ alignSelf: "flex-start" }}
        >
          {t("booking.back")}
        </Button>

        <Typography variant="h2">{t("booking.title")}</Typography>

        {formError && <Alert severity="error">{formError}</Alert>}

        {loadingAvail && (
          <Alert severity="info" icon={<CircularProgress size={16} />}>
            {t("booking.loadingAvailability", "Cargando disponibilidad…")}
          </Alert>
        )}

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="stretch"
        >
          {/* FORM */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Stack spacing={2}>
                <DatePicker
                  label={t("booking.checkIn")}
                  value={checkIn}
                  minDate={today}
                  shouldDisableDate={(d) => shouldDisableCheckIn(dayjs(d))}
                  onChange={(newValue) => {
                    setFormError(null);

                    if (!newValue) {
                      setCheckIn(null);
                      setCheckOut(null);
                      return;
                    }

                    const v = newValue.startOf("day");

                    if (shouldDisableCheckIn(v)) {
                      setFormError(t("booking.unavailable"));
                      return;
                    }

                    setCheckIn(v);

                    if (checkOut && checkOut.isSameOrBefore(v, "day")) {
                      setCheckOut(null);
                    } else if (checkOut) {
                      const nightsArr = eachNightInclusive(v, checkOut);
                      if (nightsArr.some((d2) => blockedSet.has(d2))) {
                        setCheckOut(null);
                      }
                    }
                  }}
                  slots={{ day: CustomDay }}
                  slotProps={{
                    day: {
                      blockedSet,
                    } as any,
                  }}
                />

                <DatePicker
                  label={t("booking.checkOut")}
                  value={checkOut}
                  minDate={checkIn ? checkIn.add(1, "day") : today.add(1, "day")}
                  // ✅ ya NO bloqueamos por blockedSet
                  shouldDisableDate={(d) => shouldDisableCheckOut(dayjs(d))}
                  onChange={(newValue) => {
                    setFormError(null);

                    if (!newValue) {
                      setCheckOut(null);
                      return;
                    }

                    if (!checkIn) {
                      setFormError(
                        t("booking.selectCheckInFirst", "Primero elegí el check-in.")
                      );
                      return;
                    }

                    const v = newValue.startOf("day");

                    if (v.isSameOrBefore(checkIn, "day")) {
                      setCheckOut(null);
                      return;
                    }

                    // validamos el rango (noches)
                    const nightsArr = eachNightInclusive(checkIn, v);
                    if (nightsArr.some((d2) => blockedSet.has(d2))) {
                      setFormError(t("booking.unavailable"));
                      setCheckOut(null);
                      return;
                    }

                    setCheckOut(v);
                  }}
                  slots={{ day: CustomDay }}
                  slotProps={{
                    day: {
                      blockedSet,
                    } as any,
                  }}
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
                  disabled={!isFormValid || loadingAvail}
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
                  <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                    {selectedRoom.name}
                  </Typography>

                  <Typography sx={{ color: "text.secondary" }}>
                    {t("booking.summaryPerNight", { price: money.format(Number(selectedRoom.price || 0)) })}
                  </Typography>

                  <Typography sx={{ color: "text.secondary" }}>
                    {nights > 0
                      ? t("booking.summaryNights", { n: nights })
                      : t("booking.summarySelectDates")}
                  </Typography>

                  <Box sx={{ height: 10 }} />

                  <Typography sx={{ fontWeight: 900, fontSize: 20 }}>
                    {t("booking.summaryTotal", { total: money.format(total) })}
                  </Typography>

                  <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                    Confirmación por email. Sin comisión.
                  </Typography>
                </Stack>
              ) : (
                <Typography sx={{ opacity: 0.75 }}>
                  {t("booking.summarySelectRoom")}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </Container>
  );
};