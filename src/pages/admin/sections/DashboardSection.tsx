import { useEffect, useState } from "react";
type Reservation = {
  total?: number;
};

type Language = "es" | "en" | "pt";
import {  useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";

import { db } from "../../../services/firebase"; // ajustá path



export default function DashboardSection() {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const { t, i18n } = useTranslation();

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalReservations, setTotalReservations] = useState(0);
  const [totalRooms, setTotalRooms] = useState(0);

  const [defaultLanguage, setDefaultLanguage] = useState<Language>("es");
  const [savingLang, setSavingLang] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const currency = "USD"; // después lo hacemos configurable por hostel (AR$ / EUR / USD)
  const money = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language || "es", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }),
    [i18n.language, currency]
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

        const reservations = reservationsSnap.docs.map((d) => d.data() as Reservation);
        const revenue = reservations.reduce((acc, curr) => acc + (curr.total ?? 0), 0);

        setTotalRevenue(revenue);
        setTotalReservations(reservations.length);
        setTotalRooms(roomsSnap.size);

        if (hostelSnap.exists()) {
          const data = hostelSnap.data() as any;
          const lng = (data?.defaultLanguage ?? "es") as Language;
          if (lng === "es" || lng === "en" || lng === "pt") setDefaultLanguage(lng);
          else setDefaultLanguage("es");
        }
      } catch (err) {
        console.error("DashboardSection fetch error:", err);
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [hostelSlug]);

  const handleSaveLanguage = async () => {
    if (!hostelSlug) return;

    setMsg(null);
    try {
      setSavingLang(true);

      await updateDoc(doc(db, "hostels", hostelSlug), {
        defaultLanguage,
      });

      // aplica al toque en el panel (admin)
      i18n.changeLanguage(defaultLanguage);

      setMsg({ type: "success", text: t("admin.dashboard.msgSaved") });
    } catch (err) {
      console.error("SAVE defaultLanguage error:", err);
      setMsg({ type: "error", text: t("admin.dashboard.msgSaveError") });
    } finally {
      setSavingLang(false);
    }
  };

  const StatCard = ({ title, value }: { title: string; value: React.ReactNode }) => (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
        {title}
      </Typography>
      <Typography variant="h4" mt={1}>
        {value}
      </Typography>
    </Paper>
  );

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        {t("admin.dashboard.title")}
      </Typography>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 3 }}>
          {msg.text}
        </Alert>
      )}

      {/* CONFIG */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {t("admin.dashboard.configTitle")}
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <FormControl size="small" sx={{ minWidth: 240 }} disabled={loading}>
            <InputLabel>{t("admin.dashboard.defaultLanguageLabel")}</InputLabel>
            <Select
              label={t("admin.dashboard.defaultLanguageLabel")}
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value as Language)}
            >
              <MenuItem value="es">{t("admin.dashboard.languages.es")}</MenuItem>
              <MenuItem value="en">{t("admin.dashboard.languages.en")}</MenuItem>
              <MenuItem value="pt">{t("admin.dashboard.languages.pt")}</MenuItem>
            </Select>
          </FormControl>

          <Button variant="contained" onClick={handleSaveLanguage} disabled={savingLang || loading}>
            {savingLang ? t("admin.dashboard.saving") : t("admin.dashboard.save")}
          </Button>
        </Stack>

        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5 }}>
          {t("admin.dashboard.help")}
        </Typography>
      </Paper>

      {/* STATS */}
      <Grid container spacing={3}>
        <Grid sx={{ xs: 12, md: 4 }}>
          <StatCard title={t("admin.dashboard.cards.revenue")} value={money.format(totalRevenue)} />
        </Grid>

        <Grid sx={{ xs: 12, md: 4 }}>
          <StatCard title={t("admin.dashboard.cards.reservations")} value={totalReservations} />
        </Grid>

        <Grid sx={{ xs: 12, md: 4 }}>
          <StatCard title={t("admin.dashboard.cards.rooms")} value={totalRooms} />
        </Grid>
      </Grid>
    </Box>
  );
}