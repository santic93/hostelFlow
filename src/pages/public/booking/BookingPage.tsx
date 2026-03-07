import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Divider,
} from "@mui/material";

import dayjs, { Dayjs } from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { getDoc, doc } from "firebase/firestore";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { createReservation, getRoomAvailability, type PublicRoom } from "../../../services/reservations";
import { db } from "../../../services/firebase";


dayjs.extend(isSameOrBefore);

type ReservationSuccessData = {
  fullName: string;
  email: string;
  roomName: string;
  checkInLabel: string;
  checkOutLabel: string;
  nights: number;
  total: number;
};

function getCallableErrorInfo(err: any) {
  const code = err?.code ?? err?.name ?? "unknown";
  const message = err?.message ?? "Unknown error";
  const details = err?.details ?? null;
  return { code, message, details };
}

function fmt(d: Dayjs) {
  return d.format("YYYY-MM-DD");
}

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
  const [nameTouched, setNameTouched] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState<PublicRoom | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [availabilityWarning, setAvailabilityWarning] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState<ReservationSuccessData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [blockedSet, setBlockedSet] = useState<Set<string>>(new Set());

  const isEmailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const isNameValid = fullName.trim().length >= 3;

  const showEmailError = emailTouched && email.length > 0 && !isEmailValid;
  const showNameError = nameTouched && fullName.length > 0 && !isNameValid;

  const today = dayjs().startOf("day");
  const horizonFrom = today;
  const horizonTo = today.add(365, "day");

  const money = useMemo(() => {
    const lang = (i18n.language || "es").slice(0, 2);
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }, [i18n.language]);

  useEffect(() => {
    const fetchRoom = async () => {
      if (!hostelSlug || !roomId) {
        setLoadingRoom(false);
        setRoomError(t("booking.roomNotFound", "No encontramos esta habitación."));
        return;
      }

      setLoadingRoom(true);
      setRoomError(null);

      try {
        const docSnap = await getDoc(doc(db, "hostels", hostelSlug, "rooms", roomId));

        if (!docSnap.exists()) {
          setSelectedRoom(null);
          setRoomError(t("booking.roomNotFound", "No encontramos esta habitación."));
          return;
        }

        const raw = docSnap.data() as any;
        setSelectedRoom({
          id: docSnap.id,
          name: raw.name ?? "",
          price: Number(raw.price ?? 0),
          capacity: Number(raw.capacity ?? 1),
          description: raw.description ?? "",
          imageUrls: Array.isArray(raw.imageUrls) ? raw.imageUrls : [],
        });
      } catch (err: any) {
        console.error("fetchRoom failed", err);
        setSelectedRoom(null);
        setRoomError(
          t("booking.roomLoadError", "No pudimos cargar esta habitación. Probá de nuevo.")
        );
      } finally {
        setLoadingRoom(false);
      }
    };

    fetchRoom();
  }, [hostelSlug, roomId, t]);

  useEffect(() => {
    const run = async () => {
      if (!hostelSlug || !roomId) return;

      setLoadingAvail(true);
      setAvailabilityWarning(null);

      try {
        const res = await getRoomAvailability({
          hostelSlug,
          roomId,
          from: horizonFrom.format("YYYY-MM-DD"),
          to: horizonTo.format("YYYY-MM-DD"),
        });

        const s = new Set<string>((res?.dates ?? []).filter(Boolean));
        setBlockedSet(s);

        if (res?.buildingIndex) {
          setAvailabilityWarning(
            t(
              "booking.availabilityPartial",
              "La disponibilidad visual se está actualizando. La validación final se hace al confirmar la reserva."
            )
          );
        }

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
        console.error("getRoomAvailability failed", err);
        setAvailabilityWarning(
          t(
            "booking.availabilityLoadError",
            "No pudimos cargar la disponibilidad visual. La confirmación final se valida al reservar."
          )
        );
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

  const roomImage = selectedRoom?.imageUrls?.[0] || null;

  const isFormValid =
    !!hostelSlug &&
    !!selectedRoom &&
    nights > 0 &&
    isNameValid &&
    isEmailValid;

  const isBlockedNight = (d: Dayjs) => blockedSet.has(d.format("YYYY-MM-DD"));

  const shouldDisableCheckIn = (d: Dayjs) => d.isBefore(today, "day") || isBlockedNight(d);
  const shouldDisableCheckOut = (d: Dayjs) => d.isBefore(today.add(1, "day"), "day");

  const handleConfirm = async () => {
    setFormError(null);
    setNameTouched(true);
    setEmailTouched(true);

    if (!isFormValid || !hostelSlug || !selectedRoom || !checkIn || !checkOut) return;

    const nightsArr = eachNightInclusive(checkIn, checkOut);
    if (nightsArr.some((d) => blockedSet.has(d))) {
      setFormError(t("booking.unavailable"));
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        hostelSlug,
        roomId: selectedRoom.id,
        checkInISO: checkIn.startOf("day").toDate().toISOString(),
        checkOutISO: checkOut.startOf("day").toDate().toISOString(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
      };

      const res = await createReservation(payload);

      if (res?.ok) {
        setSuccessData({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          roomName: selectedRoom.name,
          checkInLabel: checkIn.format("DD/MM/YYYY"),
          checkOutLabel: checkOut.format("DD/MM/YYYY"),
          nights,
          total,
        });
        setSuccess(true);
      } else {
        setFormError(t("booking.errorSaving"));
      }
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
      setSubmitting(false);
    }
  };

  if (!hostelSlug) return null;

  if (success) {
    return (
      <Container sx={{ py: 6 }}>
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                {t("booking.successTitle")}
              </Typography>

              <Typography sx={{ color: "text.secondary" }}>
                {t("booking.successText")}
              </Typography>

              {successData && (
                <>
                  <Divider />
                  <Stack spacing={1}>
                    <Typography sx={{ fontWeight: 800 }}>
                      {successData.roomName}
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                      {successData.fullName} · {successData.email}
                    </Typography>
                    <Typography sx={{ fontSize: 14 }}>
                      {t("booking.checkIn", "Check-in")}: {successData.checkInLabel}
                    </Typography>
                    <Typography sx={{ fontSize: 14 }}>
                      {t("booking.checkOut", "Check-out")}: {successData.checkOutLabel}
                    </Typography>
                    <Typography sx={{ fontSize: 14 }}>
                      {t("booking.summaryNights", { n: successData.nights })}
                    </Typography>
                    <Typography sx={{ fontWeight: 900 }}>
                      {t("booking.summaryTotal", {
                        total: money.format(successData.total),
                      })}
                    </Typography>
                  </Stack>
                </>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button
                  variant="contained"
                  onClick={() => navigate(`/${hostelSlug}`)}
                  sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                >
                  {t("booking.backToSite", "Volver al sitio")}
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                >
                  {t("booking.back", "Volver")}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (loadingRoom) {
    return (
      <Container sx={{ py: 6 }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (roomError) {
    return (
      <Container sx={{ py: 6 }}>
        <Stack spacing={2}>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={{ alignSelf: "flex-start" }}
          >
            {t("booking.back")}
          </Button>

          <Alert severity="error">{roomError}</Alert>
        </Stack>
      </Container>
    );
  }

  return (
    <Container sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack spacing={2}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{ alignSelf: "flex-start", borderRadius: 999, textTransform: "none" }}
          disabled={submitting}
        >
          {t("booking.back")}
        </Button>

        <Typography variant="h2">{t("booking.title")}</Typography>

        {formError && <Alert severity="error">{formError}</Alert>}
        {availabilityWarning && <Alert severity="info">{availabilityWarning}</Alert>}

        {loadingAvail && (
          <Alert severity="info" icon={<CircularProgress size={16} />}>
            {t("booking.loadingAvailability", "Cargando disponibilidad…")}
          </Alert>
        )}

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
          <Card sx={{ flex: 1, borderRadius: 4 }}>
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
                  onBlur={() => setNameTouched(true)}
                  fullWidth
                  disabled={submitting}
                  error={showNameError}
                  helperText={showNameError ? t("booking.nameInvalid", "Ingresá un nombre válido.") : ""}
                />

                <TextField
                  label={t("booking.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  fullWidth
                  disabled={submitting}
                  error={showEmailError}
                  helperText={showEmailError ? t("booking.emailInvalid") : ""}
                />

                <Button
                  variant="contained"
                  size="large"
                  disabled={!isFormValid || loadingAvail || submitting}
                  onClick={handleConfirm}
                  startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                  sx={{ minHeight: 48, borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                >
                  {submitting ? t("booking.confirming", "Confirmando…") : t("booking.confirm")}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ width: { xs: "100%", md: 380 }, flexShrink: 0, borderRadius: 4 }}>
            <CardContent>
              {selectedRoom ? (
                <Stack spacing={1.4}>
                  {roomImage ? (
                    <Box
                      component="img"
                      src={roomImage}
                      alt={selectedRoom.name}
                      sx={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    />
                  ) : null}

                  <Typography sx={{ fontWeight: 900, fontSize: 20 }}>
                    {selectedRoom.name}
                  </Typography>

                  {selectedRoom.capacity ? (
                    <Chip
                      label={t("booking.capacityLabel", {
                        count: selectedRoom.capacity,
                        defaultValue: `Capacidad: ${selectedRoom.capacity}`,
                      })}
                      sx={{ alignSelf: "flex-start", borderRadius: 999, fontWeight: 900 }}
                    />
                  ) : null}

                  {selectedRoom.description ? (
                    <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                      {selectedRoom.description}
                    </Typography>
                  ) : null}

                  <Divider />

                  <Typography sx={{ color: "text.secondary" }}>
                    {t("booking.summaryPerNight", {
                      price: money.format(Number(selectedRoom.price || 0)),
                    })}
                  </Typography>

                  <Typography sx={{ color: "text.secondary" }}>
                    {nights > 0
                      ? t("booking.summaryNights", { n: nights })
                      : t("booking.summarySelectDates")}
                  </Typography>

                  {checkIn && checkOut ? (
                    <Stack spacing={0.4}>
                      <Typography sx={{ fontSize: 14 }}>
                        <strong>{t("booking.checkIn", "Check-in")}:</strong>{" "}
                        {checkIn.format("DD/MM/YYYY")}
                      </Typography>
                      <Typography sx={{ fontSize: 14 }}>
                        <strong>{t("booking.checkOut", "Check-out")}:</strong>{" "}
                        {checkOut.format("DD/MM/YYYY")}
                      </Typography>
                    </Stack>
                  ) : null}

                  <Box sx={{ height: 6 }} />

                  <Typography sx={{ fontWeight: 900, fontSize: 22 }}>
                    {t("booking.summaryTotal", { total: money.format(total) })}
                  </Typography>

                  <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                    {t(
                      "booking.summaryNote",
                      "Confirmación por email. Sin comisión."
                    )}
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