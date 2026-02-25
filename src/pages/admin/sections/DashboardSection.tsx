import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { Box, Typography, Grid, Paper, Alert, Stack, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";
import { db } from "../../../services/firebase";


import { useTranslation } from "react-i18next";

type Reservation = {
  total?: number;
};

type Language = "es" | "en" | "pt";

export default function DashboardSection() {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const { i18n } = useTranslation();

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalReservations, setTotalReservations] = useState(0);
  const [totalRooms, setTotalRooms] = useState(0);

  // ✅ config hostel
  const [defaultLanguage, setDefaultLanguage] = useState<Language>("es");
  const [savingLang, setSavingLang] = useState(false);  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    if (!hostelSlug) return;

    // 1) stats
    const roomsSnap = await getDocs(collection(db, "hostels", hostelSlug, "rooms"));
    const reservationsSnap = await getDocs(collection(db, "hostels", hostelSlug, "reservations"));
    const reservations = reservationsSnap.docs.map((d) => d.data() as Reservation);
    const revenue = reservations.reduce((acc, curr) => acc + (curr.total ?? 0), 0);

    setTotalRevenue(revenue);
    setTotalReservations(reservations.length);
    setTotalRooms(roomsSnap.size);

    // 2) hostel config (defaultLanguage)
    const hostelSnap = await getDoc(doc(db, "hostels", hostelSlug));
    if (hostelSnap.exists()) {
      const data = hostelSnap.data() as any;
      const lng = (data?.defaultLanguage ?? "es") as Language;
      if (lng === "es" || lng === "en" || lng === "pt") {
        setDefaultLanguage(lng);
      } else {
        setDefaultLanguage("es");
      }
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostelSlug]);

  const handleSaveLanguage = async () => {
    if (!hostelSlug) return;

    setMsg(null);
    try {
      setSavingLang(true);

      await updateDoc(doc(db, "hostels", hostelSlug), {
        defaultLanguage,
      });

      // ✅ opcional pero recomendado: aplicar al instante en el panel
      i18n.changeLanguage(defaultLanguage);

      setMsg({ type: "success", text: "Idioma predeterminado actualizado ✅" });
    } catch (err) {
      console.error("SAVE defaultLanguage error:", err);
      setMsg({ type: "error", text: "No se pudo guardar el idioma. Revisá permisos/reglas." });
    } finally {
      setSavingLang(false);
    }
  };

  const Card = ({ title, value }: { title: string; value: any }) => (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="h4" mt={1}>
        {value}
      </Typography>
    </Paper>
  );

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Dashboard
      </Typography>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 3 }}>
          {msg.text}
        </Alert>
      )}

      {/* ✅ BLOQUE CONFIG */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Configuración del sitio
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Idioma predeterminado</InputLabel>
            <Select
              label="Idioma predeterminado"
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value as Language)}
            >
              <MenuItem value="es">Español (ES)</MenuItem>
              <MenuItem value="en">English (EN)</MenuItem>
              <MenuItem value="pt">Português (PT)</MenuItem>
            </Select>
          </FormControl>

          <Button variant="contained" onClick={handleSaveLanguage} disabled={savingLang}>
            {savingLang ? "Guardando..." : "Guardar"}
          </Button>
        </Stack>

        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5 }}>
          Esto define el idioma inicial que verán los huéspedes al entrar al sitio del hostel (si no eligieron otro antes).
        </Typography>
      </Paper>

      {/* ✅ STATS */}
      <Grid container spacing={3}>
        <Grid sx={{ xs: 12, md: 4 }}>
          <Card title="Ingresos Totales" value={`$${totalRevenue}`} />
        </Grid>

        <Grid sx={{ xs: 12, md: 4 }}>
          <Card title="Reservas Totales" value={totalReservations} />
        </Grid>

        <Grid sx={{ xs: 12, md: 4 }}>
          <Card title="Habitaciones Activas" value={totalRooms} />
        </Grid>
      </Grid>
    </Box>
  );
}