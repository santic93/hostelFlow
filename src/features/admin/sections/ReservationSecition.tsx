import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Menu } from "@mui/material";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckIcon from "@mui/icons-material/CheckCircleOutline";
import CancelIcon from "@mui/icons-material/CancelOutlined";

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

  const [err, setErr] = useState<string | null>(null);

  // ✅ Confirm dialog state
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; label: string } | null>(null);

  const openCancelDialog = (row: ReservationRow) => {
    setCancelTarget({
      id: row.id,
      label: `${row.fullName || "—"} · ${row.roomName || "—"}`,
    });
    setConfirmCancelOpen(true);
  };

  const closeCancelDialog = () => {
    setConfirmCancelOpen(false);
    setCancelTarget(null);
  };

  const fetchReservations = async () => {
    if (!hostelSlug) return;
    setErr(null);

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
    } catch (e: any) {
      setErr(e?.message ?? t("admin.reservations.loadError", "Error cargando reservas"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostelSlug, status, from, to]);
  const exportCSV = async (mode: "excel" | "raw" = "excel") => {
    if (!hostelSlug) return;

    try {
      setErr(null);
      setLoading(true);

      const fromDate = dayjs(from).startOf("day").toDate();
      const toDate = dayjs(to).endOf("day").toDate();

      const base = collection(db, "hostels", hostelSlug, "reservations");

      const clauses: any[] = [
        where("checkIn", ">=", fromDate),
        where("checkIn", "<=", toDate),
      ];

      if (status !== "all") clauses.push(where("status", "==", status));

      const q = query(base, ...clauses, orderBy("checkIn", "asc"));
      const snapshot = await getDocs(q);

      let data: ReservationRow[] = snapshot.docs.map((docu) => {
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

      // 🔎 filtro texto (igual que UI)
      const qLower = qText.trim().toLowerCase();
      if (qLower) {
        data = data.filter((r) =>
          (r.fullName || "").toLowerCase().includes(qLower) ||
          (r.email || "").toLowerCase().includes(qLower) ||
          (r.roomName || "").toLowerCase().includes(qLower)
        );
      }

      if (!data.length) {
        setErr(t("admin.reservations.noDataToExport", "No hay reservas para exportar con los filtros actuales."));
        return;
      }

      // ✅ Excel en ES/PT suele abrir mejor con ';'
      const lang = (i18n.language || "es").slice(0, 2);
      const delimiter: "," | ";" =
        mode === "raw" ? "," : (lang === "es" || lang === "pt" ? ";" : ",");

      const includeMetaRows = mode === "excel"; // “pro”: agrega filtros arriba

      const csv = buildCsv({ data, delimiter, includeMetaRows });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

      const safeSlug = String(hostelSlug).replace(/[^a-z0-9-_]/gi, "_");
      const fileName =
        mode === "raw"
          ? `reservas_${safeSlug}_${from}_a_${to}_raw.csv`
          : `reservas_${safeSlug}_${from}_a_${to}.csv`;

      downloadBlob(blob, fileName);
    } catch (e: any) {
      setErr(e?.message ?? t("admin.reservations.exportError", "Error exportando CSV"));
    } finally {
      setLoading(false);
    }
  };
  const statusLabel = (s: ReservationStatus) => {
    if (s === "confirmed") return t("admin.reservations.statusValues.confirmed", "Confirmada");
    if (s === "cancelled") return t("admin.reservations.statusValues.cancelled", "Cancelada");
    return t("admin.reservations.statusValues.pending", "Pendiente");
  };

  const updateStatus = async (reservationId: string, newStatus: ReservationStatus) => {
    if (!hostelSlug) return;
    if (savingById[reservationId]) return;

    setSavingById((prev) => ({ ...prev, [reservationId]: true }));

    const prevRows = rows;
    setRows((prev) => prev.map((r) => (r.id === reservationId ? { ...r, status: newStatus } : r)));

    try {
      await setReservationStatus({ hostelSlug, reservationId, newStatus });
    } catch (e: any) {
      setRows(prevRows);
      setErr(e?.message ?? t("admin.reservations.updateError", "No se pudo actualizar el estado"));
    } finally {
      setSavingById((prev) => ({ ...prev, [reservationId]: false }));
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    await updateStatus(cancelTarget.id, "cancelled");
    closeCancelDialog();
  };

  const filteredRows = useMemo(() => {
    const q = qText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      return (
        (r.fullName || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        (r.roomName || "").toLowerCase().includes(q)
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
  const money = useMemo(() => {
    const lang = (i18n.language || "es").slice(0, 2);
    // si después querés moneda por hostel, acá lo cambiás
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }, [i18n.language]);

  function csvEscape(value: any) {
    // Excel/CSV: escapamos comillas y normalizamos saltos
    const s = String(value ?? "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/"/g, '""');
    return `"${s}"`;
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
  }

  function buildCsv(opts: {
    data: ReservationRow[];
    delimiter: "," | ";";
    includeMetaRows: boolean;
  }) {
    const { data, delimiter, includeMetaRows } = opts;

    const headers = [
      "ID",
      "Huésped",
      "Habitación",
      "Email",
      "Check In",
      "Check Out",
      "Total",
      "Estado",
      "Creada",
    ];

    const lines: string[] = [];

    // ✅ BOM para Excel
    lines.push("\uFEFF" + headers.map(csvEscape).join(delimiter));

    if (includeMetaRows) {
      const nowStr = dayjs().format("YYYY-MM-DD HH:mm");
      const statusStr = status === "all" ? "all" : statusLabel(status as ReservationStatus);
      const queryStr = qText?.trim() ? qText.trim() : "—";

      // filas “metadata” (Excel las lee perfecto)
      lines.push([csvEscape("Generado"), csvEscape(nowStr)].join(delimiter));
      lines.push([csvEscape("Hostel"), csvEscape(hostelSlug ?? "—")].join(delimiter));
      lines.push([csvEscape("Desde"), csvEscape(from)].join(delimiter));
      lines.push([csvEscape("Hasta"), csvEscape(to)].join(delimiter));
      lines.push([csvEscape("Estado"), csvEscape(statusStr)].join(delimiter));
      lines.push([csvEscape("Búsqueda"), csvEscape(queryStr)].join(delimiter));
      lines.push(""); // línea en blanco
      lines.push(headers.map(csvEscape).join(delimiter)); // repetimos headers después de meta
    }

    for (const r of data) {
      const row = [
        r.id,
        r.fullName || "—",
        r.roomName || "—",
        r.email || "—",
        r.checkIn ? dayjs(r.checkIn).format("YYYY-MM-DD") : "",
        r.checkOut ? dayjs(r.checkOut).format("YYYY-MM-DD") : "",
        money.format(Number(r.total ?? 0)),
        statusLabel(r.status),
        r.createdAt ? dayjs(r.createdAt).format("YYYY-MM-DD HH:mm") : "",
      ];

      lines.push(row.map(csvEscape).join(delimiter));
    }

    return lines.join("\n");
  }
  const localeText =
    (i18n.language?.startsWith("es") ? esES : i18n.language?.startsWith("pt") ? ptBR : enUS).components
      .MuiDataGrid.defaultProps.localeText;

  const columns = useMemo<GridColDef[]>(() => {
    return [
      { field: "fullName", headerName: t("admin.reservations.columns.guest", "Huésped"), flex: 1, minWidth: 160 },
      { field: "roomName", headerName: t("admin.reservations.columns.room", "Habitación"), flex: 1, minWidth: 150 },
      { field: "email", headerName: t("admin.reservations.columns.email", "Email"), flex: 1, minWidth: 220 },
      {
        field: "checkIn",
        headerName: t("admin.reservations.columns.checkIn", "Check In"),
        width: 130,
        valueGetter: (_, row) => (row.checkIn ? dayjs(row.checkIn).format("DD/MM/YYYY") : "-"),
      },
      {
        field: "checkOut",
        headerName: t("admin.reservations.columns.checkOut", "Check Out"),
        width: 130,
        valueGetter: (_, row) => (row.checkOut ? dayjs(row.checkOut).format("DD/MM/YYYY") : "-"),
      },
      {
        field: "total",
        headerName: t("admin.reservations.columns.total", "Total"),
        width: 120,
        valueGetter: (_, row) => `$${row.total}`,
      },
      {
        field: "status",
        headerName: t("admin.reservations.columns.status", "Estado"),
        width: 150,
        renderCell: (params) => {
          const v = params.row.status as ReservationStatus;
          const color = v === "confirmed" ? "success" : v === "cancelled" ? "error" : "warning";
          return <Chip size="small" label={statusLabel(v)} color={color as any} />;
        },
      },
      {
        field: "actions",
        headerName: t("admin.reservations.columns.actions", "Acciones"),
        flex: 1,
        minWidth: 280,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const row = params.row as ReservationRow;
          const id = row.id;
          const saving = !!savingById[id];
          const current = row.status;

          if (saving) return <CircularProgress size={18} />;

          return (
            <Box
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 1,
                flexWrap: "wrap",
                py: 0.5,
              }}
            >
              <Tooltip title={t("admin.reservations.quickConfirm", "Confirmar")}>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => updateStatus(id, "confirmed")}
                    disabled={current === "confirmed"}
                    sx={{ border: "1px solid rgba(0,0,0,0.10)", borderRadius: 2 }}
                  >
                    <CheckIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title={t("admin.reservations.quickCancel", "Cancelar")}>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => openCancelDialog(row)}
                    disabled={current === "cancelled"}
                    sx={{ border: "1px solid rgba(0,0,0,0.10)", borderRadius: 2 }}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              <Select
                size="small"
                value={current}
                onChange={(e) => updateStatus(id, e.target.value as ReservationStatus)}
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="pending">{t("admin.reservations.statusValues.pending", "Pendiente")}</MenuItem>
                <MenuItem value="confirmed">{t("admin.reservations.statusValues.confirmed", "Confirmada")}</MenuItem>
                <MenuItem value="cancelled">{t("admin.reservations.statusValues.cancelled", "Cancelada")}</MenuItem>
              </Select>
            </Box>
          );
        },
      },
    ];
  }, [savingById, t, i18n.language]);
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
  const exportOpen = Boolean(exportAnchor);
  return (
    <>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
          >
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {t("admin.reservations.title", "Reservas")}
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <TextField
                size="small"
                type="date"
                label={t("admin.reservations.filterFrom", "Desde")}
                InputLabelProps={{ shrink: true }}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <TextField
                size="small"
                type="date"
                label={t("admin.reservations.filterTo", "Hasta")}
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
                <MenuItem value="all">{t("admin.reservations.filterAll", "Todos los estados")}</MenuItem>
                <MenuItem value="pending">{t("admin.reservations.statusValues.pending", "Pendiente")}</MenuItem>
                <MenuItem value="confirmed">{t("admin.reservations.statusValues.confirmed", "Confirmada")}</MenuItem>
                <MenuItem value="cancelled">{t("admin.reservations.statusValues.cancelled", "Cancelada")}</MenuItem>
              </Select>
              {/* <Button
                variant="outlined"
                onClick={exportCSV}
                sx={{ borderRadius: 999, fontWeight: 800 }}
              >
                Exportar CSV
              </Button> */}
            </Stack>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            {/* ...tus filtros actuales... */}

            <Button
              variant="outlined"
              onClick={(e) => setExportAnchor(e.currentTarget)}
              sx={{ borderRadius: 999, fontWeight: 800, whiteSpace: "nowrap" }}
              startIcon={<MoreVertIcon />}
              disabled={loading}
            >
              Exportar
            </Button>

            <Menu
              anchorEl={exportAnchor}
              open={exportOpen}
              onClose={() => setExportAnchor(null)}
            >
              <MenuItem
                onClick={() => {
                  setExportAnchor(null);
                  exportCSV("excel");
                }}
              >
                Exportar CSV (Excel)
              </MenuItem>

              <MenuItem
                onClick={() => {
                  setExportAnchor(null);
                  exportCSV("raw");
                }}
              >
                Exportar CSV (Raw / Comas)
              </MenuItem>
            </Menu>
          </Stack>
          <TextField
            size="small"
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder={t("admin.reservations.searchPlaceholder", "Buscar por nombre, email o habitación…")}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {err && <Alert severity="error">{err}</Alert>}
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
                  {dayKey === "unknown"
                    ? t("admin.reservations.unknownDate", "Fecha desconocida")
                    : dayjs(dayKey).format("ddd DD/MM")}
                </Typography>

                <Stack spacing={1.2}>
                  {list.map((r) => {
                    const saving = !!savingById[r.id];
                    return (
                      <Card key={r.id} sx={{ borderRadius: 3 }}>
                        <CardContent>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                              {r.fullName || "—"}
                            </Typography>
                            <Chip
                              size="small"
                              label={statusLabel(r.status)}
                              color={
                                (r.status === "confirmed" ? "success" : r.status === "cancelled" ? "error" : "warning") as any
                              }
                            />
                          </Stack>

                          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                            {r.roomName} · {r.email}
                          </Typography>

                          <Divider sx={{ my: 1.2 }} />

                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">
                              {t("admin.reservations.columns.checkIn", "Check In")}:{" "}
                              {r.checkIn ? dayjs(r.checkIn).format("DD/MM") : "—"}
                            </Typography>
                            <Typography variant="body2">
                              {t("admin.reservations.columns.checkOut", "Check Out")}:{" "}
                              {r.checkOut ? dayjs(r.checkOut).format("DD/MM") : "—"}
                            </Typography>
                          </Stack>

                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 900 }}>
                              {t("admin.reservations.columns.total", "Total")}: ${r.total}
                            </Typography>

                            {saving ? (
                              <CircularProgress size={18} />
                            ) : (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <IconButton size="small" onClick={() => updateStatus(r.id, "confirmed")} disabled={r.status === "confirmed"}>
                                  <CheckIcon fontSize="small" />
                                </IconButton>

                                <IconButton size="small" onClick={() => openCancelDialog(r)} disabled={r.status === "cancelled"}>
                                  <CancelIcon fontSize="small" />
                                </IconButton>

                                <Select
                                  size="small"
                                  value={r.status}
                                  onChange={(e) => updateStatus(r.id, e.target.value as ReservationStatus)}
                                >
                                  <MenuItem value="pending">{t("admin.reservations.statusValues.pending", "Pendiente")}</MenuItem>
                                  <MenuItem value="confirmed">{t("admin.reservations.statusValues.confirmed", "Confirmada")}</MenuItem>
                                  <MenuItem value="cancelled">{t("admin.reservations.statusValues.cancelled", "Cancelada")}</MenuItem>
                                </Select>
                              </Stack>
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
          <Box sx={{ height: 660, width: "100%" }}>
            <DataGrid rows={filteredRows} columns={columns} disableRowSelectionOnClick localeText={localeText} rowHeight={52} />
          </Box>
        )}
      </Box>

      {/* ✅ Confirm Cancel Dialog */}
      <Dialog open={confirmCancelOpen} onClose={closeCancelDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>
          {t("admin.reservations.confirmCancel.title", "¿Cancelar reserva?")}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1 }}>
            {t(
              "admin.reservations.confirmCancel.body",
              "Esta acción marcará la reserva como cancelada. Podés volver a cambiar el estado más tarde."
            )}
          </Typography>

          {cancelTarget?.label && (
            <Typography sx={{ mt: 1.2, opacity: 0.8, fontSize: 13 }}>
              {cancelTarget.label}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeCancelDialog} variant="outlined" sx={{ borderRadius: 999 }}>
            {t("admin.reservations.confirmCancel.keep", "Mantener")}
          </Button>
          <Button onClick={confirmCancel} variant="contained" color="error" sx={{ borderRadius: 999, fontWeight: 900 }}>
            {t("admin.reservations.confirmCancel.confirm", "Cancelar")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}