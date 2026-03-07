import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AddIcon from "@mui/icons-material/Add";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../../services/firebase";

type ReservationStatus = "pending" | "confirmed" | "cancelled";
type Reservation = {
  total?: number;
  status?: ReservationStatus;
  checkIn?: any;
  checkOut?: any;
  roomId?: string;
  roomName?: string;
};

type Room = {
  capacity?: number;
  imageUrls?: string[];
};

type Language = "es" | "en" | "pt";

export default function DashboardSection() {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(
    null
  );

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalReservations, setTotalReservations] = useState(0);
  const [totalRooms, setTotalRooms] = useState(0);

  const [pendingCount, setPendingCount] = useState(0);

  const [todayCheckins, setTodayCheckins] = useState(0);
  const [todayCheckouts, setTodayCheckouts] = useState(0);
  const [next7Checkins, setNext7Checkins] = useState(0);
  const [next7Checkouts, setNext7Checkouts] = useState(0);

  const [occupancyPct, setOccupancyPct] = useState(0);

  const [defaultLang, setDefaultLang] = useState<Language>("es");
  const [savingLang, setSavingLang] = useState(false);

  const [roomsWithImages, setRoomsWithImages] = useState(0);

  const base = window.location.origin;
  const publicUrl = hostelSlug ? `${base}/${hostelSlug}` : base;

  const money = useMemo(
    () =>
      new Intl.NumberFormat((i18n.language || "es").slice(0, 2), {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
    [i18n.language]
  );

  const badgeSx = { borderRadius: 999, fontWeight: 900, bgcolor: "rgba(0,0,0,0.06)" } as const;

  const copyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setMsg({ type: "success", text: t("admin.dashboard.copied") });
    } catch {
      setMsg({ type: "error", text: t("admin.dashboard.copyError") });
    }
  };

  const openPublic = () => window.open(publicUrl, "_blank", "noopener,noreferrer");

  const goCreateRoom = () => {
    if (!hostelSlug) return;
    navigate(`/${hostelSlug}/admin/rooms?new=1`);
  };

  const goReservationsWith = (params: {
    from?: string;
    to?: string;
    status?: string;
    q?: string;
    roomId?: string;
  }) => {
    if (!hostelSlug) return;
    const sp = new URLSearchParams();
    if (params.from) sp.set("from", params.from);
    if (params.to) sp.set("to", params.to);
    if (params.status) sp.set("status", params.status);
    if (params.q) sp.set("q", params.q);
    if (params.roomId) sp.set("roomId", params.roomId);
    navigate(`/${hostelSlug}/admin/reservations?${sp.toString()}`);
  };

  const saveDefaultLanguage = async () => {
    if (!hostelSlug) return;
    setSavingLang(true);
    setMsg(null);

    try {
      await updateDoc(doc(db, "hostels", hostelSlug), {
        defaultLanguage: defaultLang,
        updatedAt: new Date(),
      });
      setMsg({ type: "success", text: t("admin.dashboard.msgSaved") });
    } catch {
      setMsg({ type: "error", text: t("admin.dashboard.msgSaveError") });
    } finally {
      setSavingLang(false);
    }
  };

  const StatCard = ({
    title,
    value,
    hint,
    onClick,
  }: {
    title: string;
    value: React.ReactNode;
    hint?: string;
    onClick?: () => void;
  }) => (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: 4,
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.12s ease, box-shadow 0.12s ease",
        "&:hover": onClick
          ? { transform: "translateY(-1px)", boxShadow: "0 10px 30px rgba(0,0,0,0.10)" }
          : undefined,
      }}
    >
      <CardContent>
        <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 0.5 }}>{title}</Typography>
        <Typography sx={{ fontWeight: 900, fontSize: 26, letterSpacing: -0.3 }}>{value}</Typography>
        {hint ? (
          <Typography sx={{ mt: 0.5, fontSize: 12, opacity: 0.75 }}>
            {hint}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!hostelSlug) return;
      setLoading(true);
      setMsg(null);

      try {
        const [roomsSnap, reservationsSnap, hostelSnap] = await Promise.all([
          getDocs(collection(db, "hostels", hostelSlug, "rooms")),
          getDocs(collection(db, "hostels", hostelSlug, "reservations")),
          getDoc(doc(db, "hostels", hostelSlug)),
        ]);

        if (!alive) return;

        if (hostelSnap.exists()) {
          const data = hostelSnap.data() as any;
          const lng = String(data?.defaultLanguage ?? "es").slice(0, 2) as Language;
          setDefaultLang(lng === "en" || lng === "pt" || lng === "es" ? lng : "es");
        } else {
          setDefaultLang("es");
        }

        const rooms = roomsSnap.docs.map((d) => d.data() as Room);
        const reservations = reservationsSnap.docs.map((d) => d.data() as Reservation);

        const revenue = reservations.reduce((acc, curr) => acc + Number(curr.total ?? 0), 0);
        setTotalRevenue(revenue);
        setTotalReservations(reservations.length);
        setTotalRooms(roomsSnap.size);

        const roomsImgs = rooms.filter((room) => Array.isArray(room.imageUrls) && room.imageUrls.length > 0).length;
        setRoomsWithImages(roomsImgs);

        const pending = reservations.filter((r) => (r.status ?? "pending") === "pending").length;
        setPendingCount(pending);

        const today = dayjs().startOf("day");
        const end7 = today.add(7, "day").endOf("day");

        let tIn = 0;
        let tOut = 0;
        let nIn7 = 0;
        let nOut7 = 0;

        for (const r of reservations) {
          const ci = r.checkIn?.toDate?.();
          const co = r.checkOut?.toDate?.();

          if (ci) {
            const d = dayjs(ci).startOf("day");
            if (d.isSame(today, "day")) tIn++;
            if ((d.isAfter(today, "day") || d.isSame(today, "day")) && dayjs(ci).isBefore(end7)) {
              nIn7++;
            }
          }

          if (co) {
            const d = dayjs(co).startOf("day");
            if (d.isSame(today, "day")) tOut++;
            if ((d.isAfter(today, "day") || d.isSame(today, "day")) && dayjs(co).isBefore(end7)) {
              nOut7++;
            }
          }
        }

        setTodayCheckins(tIn);
        setTodayCheckouts(tOut);
        setNext7Checkins(nIn7);
        setNext7Checkouts(nOut7);

        const days = 30;
        const horizonStart = today;
        const horizonEnd = today.add(days, "day");

        const totalCapacityNights =
          Math.max(
            1,
            rooms.reduce((acc, r) => acc + Math.max(1, Number(r.capacity ?? 1)), 0)
          ) * days;

        let occupiedNights = 0;

        for (const r of reservations) {
          const inD = r.checkIn?.toDate?.();
          const outD = r.checkOut?.toDate?.();
          if (!inD || !outD) continue;

          const a = dayjs(inD).startOf("day");
          const b = dayjs(outD).startOf("day");

          const start = a.isAfter(horizonStart) ? a : horizonStart;
          const end = b.isBefore(horizonEnd) ? b : horizonEnd;

          occupiedNights += Math.max(0, end.diff(start, "day"));
        }

        const pct = Math.max(
          0,
          Math.min(100, Math.round((occupiedNights / totalCapacityNights) * 100))
        );
        setOccupancyPct(pct);
      } catch {
        setMsg({ type: "error", text: t("admin.dashboard.loadError") });
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [hostelSlug, t]);

  const checklist = useMemo(() => {
    const hasHostel = Boolean(hostelSlug);
    const hasRoom = totalRooms > 0;
    const imagesOk = totalRooms > 0 && roomsWithImages > 0;
    const hasReservation = totalReservations > 0;
    return { hasHostel, hasRoom, imagesOk, hasReservation };
  }, [hostelSlug, totalRooms, totalReservations, roomsWithImages]);

  const ChecklistItem = ({ done, label }: { done: boolean; label: string }) => (
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip
        size="small"
        label={done ? t("common.done") : t("common.todo")}
        color={done ? "success" : "warning"}
        sx={{ borderRadius: 999, fontWeight: 900, minWidth: 92 }}
      />
      <Typography sx={{ fontWeight: 800 }}>{label}</Typography>
    </Stack>
  );

  const todayStr = dayjs().format("YYYY-MM-DD");
  const end7Str = dayjs().add(7, "day").format("YYYY-MM-DD");

  return (
    <Container disableGutters>
      <Stack spacing={2.2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {t("admin.dashboard.title")}
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
              {t("admin.dashboard.subtitle")}
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={goCreateRoom}
              disabled={!hostelSlug}
              sx={{ borderRadius: 999, fontWeight: 900, textTransform: "none" }}
            >
              {t("admin.dashboard.ctaCreateRoom")}
            </Button>

            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              onClick={openPublic}
              disabled={!hostelSlug}
              sx={{ borderRadius: 999, fontWeight: 900, textTransform: "none" }}
            >
              {t("admin.dashboard.viewSite")}
            </Button>
          </Stack>
        </Stack>

        {msg && <Alert severity={msg.type}>{msg.text}</Alert>}

        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>
              {t("admin.dashboard.configTitle")}
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.2}
              alignItems={{ sm: "center" }}
            >
              <Box sx={{ minWidth: 220 }}>
                <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 0.5 }}>
                  {t("admin.dashboard.defaultLanguageLabel")}
                </Typography>

                <Select
                  size="small"
                  value={defaultLang}
                  onChange={(e) => setDefaultLang(e.target.value as Language)}
                  sx={{ width: "100%" }}
                >
                  <MenuItem value="es">{t("admin.dashboard.languages.es")}</MenuItem>
                  <MenuItem value="en">{t("admin.dashboard.languages.en")}</MenuItem>
                  <MenuItem value="pt">{t("admin.dashboard.languages.pt")}</MenuItem>
                </Select>
              </Box>

              <Button
                variant="contained"
                onClick={saveDefaultLanguage}
                disabled={!hostelSlug || savingLang}
                sx={{
                  borderRadius: 999,
                  fontWeight: 900,
                  textTransform: "none",
                  alignSelf: { xs: "stretch", sm: "end" },
                }}
              >
                {savingLang ? t("admin.dashboard.saving") : t("admin.dashboard.save")}
              </Button>
            </Stack>

            <Typography sx={{ mt: 1, fontSize: 13, color: "text.secondary" }}>
              {t("admin.dashboard.help")}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack spacing={1.2}>
              <Typography sx={{ fontWeight: 900 }}>
                {t("admin.dashboard.publicLinkTitle")}
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ sm: "center" }}
              >
                <Box
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 3,
                    border: "1px solid rgba(0,0,0,0.08)",
                    bgcolor: "rgba(0,0,0,0.02)",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 13,
                    flex: 1,
                    overflowX: "auto",
                  }}
                >
                  {publicUrl}
                </Box>

                <IconButton
                  onClick={copyPublicLink}
                  sx={{ border: "1px solid rgba(0,0,0,0.10)", borderRadius: 3 }}
                  aria-label={t("admin.dashboard.copyAria", "Copiar link")}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>

                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <Chip sx={badgeSx} label={`${pendingCount} ${t("admin.dashboard.badges.pending")}`} />
                  <Chip sx={badgeSx} label={`${next7Checkins} ${t("admin.dashboard.badges.nextCheckins")}`} />
                  <Chip sx={badgeSx} label={`${next7Checkouts} ${t("admin.dashboard.badges.nextCheckouts")}`} />
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>
              {t("admin.dashboard.checklistTitle")}
            </Typography>

            <Stack spacing={1}>
              <ChecklistItem done={checklist.hasHostel} label={t("admin.dashboard.checklist.createdHostel")} />
              <ChecklistItem done={checklist.hasRoom} label={t("admin.dashboard.checklist.firstRoom")} />
              <ChecklistItem done={checklist.imagesOk} label={t("admin.dashboard.checklist.images")} />
              <ChecklistItem done={checklist.hasReservation} label={t("admin.dashboard.checklist.testBooking")} />
            </Stack>

            <Divider sx={{ my: 1.6 }} />

            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              {t("admin.dashboard.checklistHelp")}
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" } }}>
          <StatCard
            title={t("admin.dashboard.cards.checkinsToday", "Check-ins hoy")}
            value={todayCheckins}
            hint={t("admin.dashboard.cards.tapToSee", "Tocá para ver en Reservas")}
            onClick={() => goReservationsWith({ from: todayStr, to: todayStr })}
          />
          <StatCard
            title={t("admin.dashboard.cards.checkoutsToday", "Check-outs hoy")}
            value={todayCheckouts}
            hint={t("admin.dashboard.cards.tapToSee", "Tocá para ver en Reservas")}
            onClick={() => goReservationsWith({ from: todayStr, to: todayStr })}
          />
          <StatCard
            title={t("admin.dashboard.cards.next7Checkins", "Próx. 7 días · Check-ins")}
            value={next7Checkins}
            hint={`${todayStr} → ${end7Str}`}
            onClick={() => goReservationsWith({ from: todayStr, to: end7Str })}
          />
          <StatCard
            title={t("admin.dashboard.cards.pending", "Pendientes")}
            value={pendingCount}
            hint={t("admin.dashboard.cards.tapToSee", "Tocá para ver en Reservas")}
            onClick={() => goReservationsWith({ status: "pending" })}
          />
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" } }}>
          <StatCard title={t("admin.dashboard.cards.revenue")} value={money.format(totalRevenue)} />
          <StatCard title={t("admin.dashboard.cards.reservations")} value={totalReservations} />
          <StatCard title={t("admin.dashboard.cards.rooms")} value={totalRooms} />
        </Box>

        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontWeight: 900 }}>
                {t("admin.dashboard.occupancyTitle")}
              </Typography>
              <Chip sx={{ borderRadius: 999, fontWeight: 900 }} label={`${occupancyPct}%`} />
            </Stack>

            <Box sx={{ mt: 1.5 }}>
              <LinearProgress variant="determinate" value={occupancyPct} />
            </Box>

            <Typography sx={{ mt: 1, fontSize: 13, color: "text.secondary" }}>
              {t("admin.dashboard.occupancyHelp")}
            </Typography>
          </CardContent>
        </Card>

        {loading && (
          <Box sx={{ py: 1 }}>
            <Typography sx={{ opacity: 0.75, fontSize: 13 }}>
              {t("common.loading")}
            </Typography>
          </Box>
        )}
      </Stack>
    </Container>
  );
}