import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { db } from "../../../services/firebase";

type Reservation = { total?: number };
type Language = "es" | "en" | "pt";

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

  const currency = "USD";
  const money = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language || "es", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }),
    [i18n.language]
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
          setDefaultLanguage(lng === "en" || lng === "pt" || lng === "es" ? lng : "es");
        }
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
      await updateDoc(doc(db, "hostels", hostelSlug), { defaultLanguage });
      i18n.changeLanguage(defaultLanguage);
      setMsg({ type: "success", text: t("admin.dashboard.msgSaved") });
    } catch {
      setMsg({ type: "error", text: t("admin.dashboard.msgSaveError") });
    } finally {
      setSavingLang(false);
    }
  };

  const Stat = ({ title, value }: { title: string; value: React.ReactNode }) => (
    <Card>
      <CardContent>
        <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 0.5 }}>{title}</Typography>
        <Typography sx={{ fontWeight: 900, fontSize: 24 }}>{value}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Container disableGutters>
      <Stack spacing={2}>
        <Typography variant="h5">{t("admin.dashboard.title")}</Typography>

        {msg && <Alert severity={msg.type}>{msg.text}</Alert>}

        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Typography sx={{ fontWeight: 900 }}>{t("admin.dashboard.configTitle")}</Typography>

              <FormControl size="small" fullWidth>
                <InputLabel>{t("admin.dashboard.defaultLanguageLabel")}</InputLabel>
                <Select
                  value={defaultLanguage}
                  label={t("admin.dashboard.defaultLanguageLabel")}
                  onChange={(e) => setDefaultLanguage(e.target.value as Language)}
                >
                  <MenuItem value="es">{t("admin.dashboard.languages.es")}</MenuItem>
                  <MenuItem value="en">{t("admin.dashboard.languages.en")}</MenuItem>
                  <MenuItem value="pt">{t("admin.dashboard.languages.pt")}</MenuItem>
                </Select>
              </FormControl>

              <Button variant="contained" onClick={handleSaveLanguage} disabled={savingLang}>
                {savingLang ? t("admin.dashboard.saving") : t("admin.dashboard.save")}
              </Button>

              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                {t("admin.dashboard.help")}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Stat title={t("admin.dashboard.cards.revenue")} value={money.format(totalRevenue)} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
           <Stat title={t("admin.dashboard.cards.reservations")} value={totalReservations} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
        <Stat title={t("admin.dashboard.cards.rooms")} value={totalRooms} />
          </Grid>
        </Grid>

        {loading && (
          <Box sx={{ py: 2 }}>
            <Typography sx={{ opacity: 0.75 }}>{t("loading.subtitle")}</Typography>
          </Box>
        )}
      </Stack>
    </Container>
  );
}