import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  Typography,
  Stack,
  TextField,
  useMediaQuery,
  Card,
  CardContent,
  Divider,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import dayjs from "dayjs";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "../../../services/firebase";
import { setReservationStatus, type ReservationStatus } from "../../../services/reservations";
import { esES, enUS, ptBR } from "@mui/x-data-grid/locales";

type ReservationRow = {
  id: string;
  fullName: string;
  roomName: string;
  email: string;
  total: number;
  status: ReservationStatus;
  checkIn: Date | null;
  checkOut: Date | null;
  createdAt: Date | null;
};

export default function ReservationsSection() {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery("(max-width:900px)");

  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [savingById, setSavingById] = useState<Record<string, boolean>>({});

  const [status, setStatus] = useState<ReservationStatus | "all">("all");
  const [from, setFrom] = useState<string>(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [to, setTo] = useState<string>(dayjs().endOf("month").format("YYYY-MM-DD"));
  const [qText, setQText] = useState("");

  const fetchReservations = async () => {
    if (!hostelSlug) return;

    setLoading(true);
    try {
      const fromDate = dayjs(from).startOf("day").toDate();
      const toDate = dayjs(to).endOf("day").toDate();

      const base = collection(db, "hostels", hostelSlug, "reservations");

      const clauses: any[] = [where("checkIn", ">=", fromDate), where("checkIn", "<=", toDate)];
      if (status !== "all") clauses.push(where("status", "==", status));

      const q = query(base, ...clauses, orderBy("checkIn", "asc"));
      const snapshot = await getDocs(q);

      const data: ReservationRow[] = snapshot.docs.map((docu) => {
        const raw = docu.data() as any;
        return {
          id: docu.id,
          fullName: raw.fullName ?? "",
          roomName: raw.roomName ?? "",
          email: raw.email ?? "",
          total: raw.total ?? 0,
          status: (raw.status ?? "pending") as ReservationStatus,
          checkIn: raw.checkIn?.toDate?.() ?? null,
          checkOut: raw.checkOut?.toDate?.() ?? null,
          createdAt: raw.createdAt?.toDate?.() ?? null,
        };
      });

      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostelSlug, status, from, to]);

  const statusLabel = (s: ReservationStatus) => {
    if (s === "confirmed") return t("admin.reservations.confirmed");
    if (s === "cancelled") return t("admin.reservations.cancelled");
    return t("admin.reservations.pending");
  };

  const updateStatus = async (reservationId: string, newStatus: ReservationStatus) => {
    if (!hostelSlug) return;
    if (savingById[reservationId]) return;

    setSavingById((prev) => ({ ...prev, [reservationId]: true }));

    const prevRows = rows;
    setRows((prev) => prev.map((r) => (r.id === reservationId ? { ...r, status: newStatus } : r)));

    try {
      await setReservationStatus({ hostelSlug, reservationId, newStatus });
    } catch (e) {
      setRows(prevRows);
      console.error("setReservationStatus failed", e);
    } finally {
      setSavingById((prev) => ({ ...prev, [reservationId]: false }));
    }
  };

  const filteredRows = useMemo(() => {
    const q = qText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.roomName.toLowerCase().includes(q)
      );
    });
  }, [rows, qText]);

  const groupedMobile = useMemo(() => {
    if (!isMobile) return [];
    const map = new Map<string, ReservationRow[]>();
    for (const r of filteredRows) {
      const key = r.checkIn ? dayjs(r.checkIn).format("YYYY-MM-DD") : "unknown";
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredRows, isMobile]);

  const columns = useMemo<GridColDef[]>(() => {
    return [
      { field: "fullName", headerName: t("admin.reservations.columns.guest"), flex: 1, minWidth: 160 },
      { field: "roomName", headerName: t("admin.reservations.columns.room"), flex: 1, minWidth: 140 },
      { field: "email", headerName: t("admin.reservations.columns.email"), flex: 1, minWidth: 200 },
      {
        field: "checkIn",
        headerName: t("admin.reservations.columns.checkIn"),
        width: 130,
        valueGetter: (_, row) => (row.checkIn ? dayjs(row.checkIn).format("DD/MM/YYYY") : "-"),
      },
      {
        field: "checkOut",
        headerName: t("admin.reservations.columns.checkOut"),
        width: 130,
        valueGetter: (_, row) => (row.checkOut ? dayjs(row.checkOut).format("DD/MM/YYYY") : "-"),
      },
      {
        field: "total",
        headerName: t("admin.reservations.columns.total"),
        width: 120,
        valueGetter: (_, row) => `$${row.total}`,
      },
      {
        field: "status",
        headerName: t("admin.reservations.columns.status"),
        width: 150,
        renderCell: (params) => {
          const v = params.row.status as ReservationStatus;
          const color = v === "confirmed" ? "success" : v === "cancelled" ? "error" : "warning";
          return <Chip size="small" label={statusLabel(v)} color={color as any} />;
        },
      },
      {
        field: "actions",
        headerName: t("admin.reservations.columns.actions"),
        width: 190,
        sortable: false,
        renderCell: (params) => {
          const saving = !!savingById[params.row.id];
          if (saving) return <CircularProgress size={18} />;

          return (
            <Select
              size="small"
              value={params.row.status}
              onChange={(e) => updateStatus(params.row.id, e.target.value as ReservationStatus)}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="pending">{t("admin.reservations.pending")}</MenuItem>
              <MenuItem value="confirmed">{t("admin.reservations.confirmed")}</MenuItem>
              <MenuItem value="cancelled">{t("admin.reservations.cancelled")}</MenuItem>
            </Select>
          );
        },
      },
    ];
  }, [i18n.language, savingById]);
  const localeText =
    (i18n.language?.startsWith("es") ? esES : i18n.language?.startsWith("pt") ? ptBR : enUS).components
      .MuiDataGrid.defaultProps.localeText;
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <Typography variant="h5">{t("admin.reservations.title")}</Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <TextField
              size="small"
              type="date"
              label={t("admin.reservations.filterFrom")}
              InputLabelProps={{ shrink: true }}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <TextField
              size="small"
              type="date"
              label={t("admin.reservations.filterTo")}
              InputLabelProps={{ shrink: true }}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <Select
              size="small"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">{t("admin.reservations.filterAll")}</MenuItem>
              <MenuItem value="pending">{t("admin.reservations.pending")}</MenuItem>
              <MenuItem value="confirmed">{t("admin.reservations.confirmed")}</MenuItem>
              <MenuItem value="cancelled">{t("admin.reservations.cancelled")}</MenuItem>
            </Select>
          </Stack>
        </Stack>

        <TextField
          size="small"
          value={qText}
          onChange={(e) => setQText(e.target.value)}
          placeholder={t("admin.reservations.searchPlaceholder")}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {loading ? (
        <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        <Stack spacing={2}>
          {groupedMobile.map(([dayKey, list]) => (
            <Box key={dayKey}>
              <Typography sx={{ fontWeight: 900, mb: 1 }}>
                {dayKey === "unknown" ? t("admin.reservations.unknownDate") : dayjs(dayKey).format("ddd DD/MM")}
              </Typography>

              <Stack spacing={1.2}>
                {list.map((r) => {
                  const saving = !!savingById[r.id];
                  return (
                    <Card key={r.id} sx={{ borderRadius: 3 }}>
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {r.fullName || "—"}
                          </Typography>
                          <Chip
                            size="small"
                            label={statusLabel(r.status)}
                            color={
                              (r.status === "confirmed"
                                ? "success"
                                : r.status === "cancelled"
                                  ? "error"
                                  : "warning") as any
                            }
                          />
                        </Stack>

                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                          {r.roomName} · {r.email}
                        </Typography>

                        <Divider sx={{ my: 1.2 }} />

                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2">
                            {t("admin.reservations.checkIn")}: {r.checkIn ? dayjs(r.checkIn).format("DD/MM") : "—"}
                          </Typography>
                          <Typography variant="body2">
                            {t("admin.reservations.checkOut")}: {r.checkOut ? dayjs(r.checkOut).format("DD/MM") : "—"}
                          </Typography>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {t("admin.reservations.total")}: ${r.total}
                          </Typography>

                          {saving ? (
                            <CircularProgress size={18} />
                          ) : (
                            <Select
                              size="small"
                              value={r.status}
                              onChange={(e) => updateStatus(r.id, e.target.value as ReservationStatus)}
                            >
                              <MenuItem value="pending">{t("admin.reservations.pending")}</MenuItem>
                              <MenuItem value="confirmed">{t("admin.reservations.confirmed")}</MenuItem>
                              <MenuItem value="cancelled">{t("admin.reservations.cancelled")}</MenuItem>
                            </Select>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <Box sx={{ height: 620, width: "100%" }}>
          <DataGrid rows={filteredRows}
            columns={columns}
            disableRowSelectionOnClick
            localeText={localeText} />
        </Box>
      )}
    </Box>
  );
}