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
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../../services/firebase";
import { setReservationStatus, type ReservationStatus } from "../../../services/reservations";

type ReservationRow = {
  id: string;
  fullName: string;
  roomName: string;
  email: string;
  total: number;
  status: ReservationStatus;
  checkIn: Date | null;
  checkOut: Date | null;
  createdAt?: Date | null;
};

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ReservationsSection() {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width:900px)");

  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);

  // loader por fila
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});

  // filtros
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(""); // YYYY-MM-DD
  const [to, setTo] = useState(""); // YYYY-MM-DD

  const fetchReservations = async () => {
    if (!hostelSlug) return;
    setLoading(true);
    try {
      const qy = query(
        collection(db, "hostels", hostelSlug, "reservations"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(qy);

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
  }, [hostelSlug]);

  const statusLabel = (s: ReservationStatus) => {
    if (s === "confirmed") return t("admin.reservations.confirmed");
    if (s === "cancelled") return t("admin.reservations.cancelled");
    return t("admin.reservations.pending");
  };

  const statusColor = (s: ReservationStatus) =>
    s === "confirmed" ? "success" : s === "cancelled" ? "error" : "warning";

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

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    const fromDate = from ? new Date(`${from}T00:00:00`) : null;
    const toDate = to ? new Date(`${to}T23:59:59`) : null;

    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;

      if (qq) {
        const hay =
          `${r.fullName} ${r.email} ${r.roomName}`.toLowerCase().includes(qq);
        if (!hay) return false;
      }

      // filtro por checkIn
      if (fromDate || toDate) {
        const ci = r.checkIn;
        if (!ci) return false;
        if (fromDate && ci < fromDate) return false;
        if (toDate && ci > toDate) return false;
      }

      return true;
    });
  }, [rows, statusFilter, q, from, to]);

  const columns = useMemo<GridColDef<ReservationRow>[]>(() => {
    return [
      { field: "fullName", headerName: t("admin.reservations.guest"), flex: 1, minWidth: 160 },
      { field: "roomName", headerName: t("admin.reservations.room"), flex: 1, minWidth: 140 },
      { field: "email", headerName: t("admin.reservations.email"), flex: 1, minWidth: 200 },
      {
        field: "checkIn",
        headerName: t("admin.reservations.checkIn"),
        flex: 1,
        minWidth: 120,
        valueGetter: (_, row) => (row.checkIn ? row.checkIn.toLocaleDateString() : "-"),
      },
      {
        field: "checkOut",
        headerName: t("admin.reservations.checkOut"),
        flex: 1,
        minWidth: 120,
        valueGetter: (_, row) => (row.checkOut ? row.checkOut.toLocaleDateString() : "-"),
      },
      {
        field: "total",
        headerName: t("admin.reservations.total"),
        flex: 0.7,
        minWidth: 110,
        valueGetter: (_, row) => `$${row.total}`,
      },
      {
        field: "status",
        headerName: t("admin.reservations.status"),
        width: 160,
        renderCell: (params) => {
          const v = params.row.status;
          const saving = !!savingById[params.row.id];
          if (saving) return <CircularProgress size={18} />;

          return <Chip size="small" label={statusLabel(v)} color={statusColor(v)} />;
        },
      },
      {
        field: "actions",
        headerName: t("admin.reservations.actions"),
        width: 200,
        sortable: false,
        renderCell: (params) => {
          const saving = !!savingById[params.row.id];
          return (
            <Select
              size="small"
              value={params.row.status}
              disabled={saving}
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
  }, [t, savingById]);

  const mobileGroups = useMemo(() => {
    const groups = new Map<string, ReservationRow[]>();
    for (const r of filtered) {
      const key = r.checkIn ? toISODate(r.checkIn) : "no-date";
      const arr = groups.get(key) ?? [];
      arr.push(r);
      groups.set(key, arr);
    }
    return Array.from(groups.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1)); // desc
  }, [filtered]);

  return (
    <Box sx={{ width: "100%", overflowX: "hidden" }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        {t("admin.reservations.title")}
      </Typography>

      {/* Filters */}
      <Card
        elevation={0}
        sx={{
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 3,
          mb: 2,
        }}
      >
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            sx={{ alignItems: { md: "center" } }}
          >
            <TextField
              label={t("admin.reservations.search") || "Buscar"}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              size="small"
              fullWidth
            />

            <Select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              sx={{ minWidth: { xs: "100%", md: 200 } }}
            >
              <MenuItem value="all">{t("admin.reservations.all") || "Todos"}</MenuItem>
              <MenuItem value="pending">{t("admin.reservations.pending")}</MenuItem>
              <MenuItem value="confirmed">{t("admin.reservations.confirmed")}</MenuItem>
              <MenuItem value="cancelled">{t("admin.reservations.cancelled")}</MenuItem>
            </Select>

            <TextField
              label={t("admin.reservations.from") || "Desde"}
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={t("admin.reservations.to") || "Hasta"}
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        <Stack spacing={2}>
          {mobileGroups.length === 0 ? (
            <Typography sx={{ opacity: 0.7 }}>Sin resultados</Typography>
          ) : (
            mobileGroups.map(([dateKey, items]) => (
              <Box key={dateKey}>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>
                  {dateKey === "no-date" ? "Sin fecha" : dateKey}
                </Typography>

                <Stack spacing={1.2}>
                  {items.map((r) => {
                    const saving = !!savingById[r.id];
                    return (
                      <Card
                        key={r.id}
                        elevation={0}
                        sx={{
                          border: "1px solid rgba(0,0,0,0.08)",
                          borderRadius: 3,
                        }}
                      >
                        <CardContent>
                          <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography sx={{ fontWeight: 800 }}>{r.fullName}</Typography>
                              {saving ? (
                                <CircularProgress size={18} />
                              ) : (
                                <Chip size="small" label={statusLabel(r.status)} color={statusColor(r.status)} />
                              )}
                            </Stack>

                            <Typography sx={{ opacity: 0.8, fontSize: 13 }}>
                              {r.roomName} • {r.email}
                            </Typography>

                            <Divider />

                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography sx={{ fontWeight: 800 }}>${r.total}</Typography>

                              <Select
                                size="small"
                                value={r.status}
                                disabled={saving}
                                onChange={(e) => updateStatus(r.id, e.target.value as ReservationStatus)}
                                sx={{ minWidth: 160 }}
                              >
                                <MenuItem value="pending">{t("admin.reservations.pending")}</MenuItem>
                                <MenuItem value="confirmed">{t("admin.reservations.confirmed")}</MenuItem>
                                <MenuItem value="cancelled">{t("admin.reservations.cancelled")}</MenuItem>
                              </Select>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
            ))
          )}
        </Stack>
      ) : (
        <Box
          sx={{
            width: "100%",
            overflowX: "hidden",
            "& .MuiDataGrid-root": { borderRadius: 12 },
          }}
        >
          <DataGrid
            autoHeight
            rows={filtered}
            columns={columns}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          />
        </Box>
      )}
    </Box>
  );
}