import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
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

  const statusLabel = (s: ReservationStatus) => {
    if (s === "confirmed") return t("admin.reservations.statusValues.confirmed", "Confirmada");
    if (s === "cancelled") return t("admin.reservations.statusValues.cancelled", "Cancelada");
    return t("admin.reservations.statusValues.pending", "Pendiente");
  };
  function downloadBlob(blob: Blob, fileName: string) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
  }

  function buildXlsxAndDownload(args: {
    hostelSlug: string;
    from: string;
    to: string;
    statusLabelText: string;
    searchText: string;
    rows: ReservationRow[];
    moneyFmt: Intl.NumberFormat;
    statusLabelFn: (s: ReservationStatus) => string;
  }) {
    const { hostelSlug, from, to, statusLabelText, searchText, rows, moneyFmt, statusLabelFn } = args;

    // -------------------------
    // Sheet 1: Reservations
    // -------------------------
    const reservationsAoA: any[][] = [
      ["ID", "Huésped", "Habitación", "Email", "Check In", "Check Out", "Noches", "Total", "Estado", "Creada"],
    ];

    for (const r of rows) {
      const checkInStr = r.checkIn ? dayjs(r.checkIn).format("YYYY-MM-DD") : "";
      const checkOutStr = r.checkOut ? dayjs(r.checkOut).format("YYYY-MM-DD") : "";
      const nights =
        r.checkIn && r.checkOut ? Math.max(0, dayjs(r.checkOut).diff(dayjs(r.checkIn), "day")) : "";

      reservationsAoA.push([
        r.id,
        r.fullName || "—",
        r.roomName || "—",
        r.email || "—",
        checkInStr,
        checkOutStr,
        nights,
        Number(r.total ?? 0),
        statusLabelFn(r.status),
        r.createdAt ? dayjs(r.createdAt).format("YYYY-MM-DD HH:mm") : "",
      ]);
    }

    const wsReservations = XLSX.utils.aoa_to_sheet(reservationsAoA);

    // Formato numérico (Total) como número con 0 decimales (Excel)
    // Columna Total = índice 7 (H)
    for (let r = 2; r <= reservationsAoA.length; r++) {
      const cellAddr = XLSX.utils.encode_cell({ r: r - 1, c: 7 });
      const cell = wsReservations[cellAddr];
      if (cell && typeof cell.v === "number") {
        cell.t = "n";
        cell.z = "#,##0"; // formato numérico (si querés USD con símbolo, lo hacemos después)
      }
    }

    wsReservations["!cols"] = [
      { wch: 24 }, // ID
      { wch: 22 }, // Huésped
      { wch: 20 }, // Habitación
      { wch: 28 }, // Email
      { wch: 12 }, // CheckIn
      { wch: 12 }, // CheckOut
      { wch: 8 },  // Noches
      { wch: 12 }, // Total
      { wch: 14 }, // Estado
      { wch: 18 }, // Creada
    ];

    // -------------------------
    // Sheet 2: Summary
    // -------------------------
    const total = rows.reduce((acc, r) => acc + Number(r.total ?? 0), 0);
    const byStatus = {
      pending: rows.filter((r) => r.status === "pending").length,
      confirmed: rows.filter((r) => r.status === "confirmed").length,
      cancelled: rows.filter((r) => r.status === "cancelled").length,
    };

    const summaryAoA: any[][] = [
      ["Reporte de Reservas"],
      [""],
      ["Hostel", hostelSlug],
      ["Desde", from],
      ["Hasta", to],
      ["Estado", statusLabelText],
      ["Búsqueda", searchText || "—"],
      ["Generado", dayjs().format("YYYY-MM-DD HH:mm")],
      [""],
      ["Totales"],
      ["Total reservas", rows.length],
      ["Pendientes", byStatus.pending],
      ["Confirmadas", byStatus.confirmed],
      ["Canceladas", byStatus.cancelled],
      ["Revenue", total],
      [""],
      ["Revenue (formateado)", moneyFmt.format(total)],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoA);
    wsSummary["!cols"] = [{ wch: 26 }, { wch: 40 }];

    // Revenue numérico (fila donde está "Revenue")
    // Ojo: depende del índice exacto (acá es la fila 15 en 1-based AoA)
    // Lo dejamos como número (ya lo pusimos como number en AoA).
    const revenueCell = XLSX.utils.encode_cell({ r: 14, c: 1 }); // (0-based) fila 15, col B
    if (wsSummary[revenueCell]) {
      wsSummary[revenueCell].t = "n";
      wsSummary[revenueCell].z = "#,##0";
    }

    // -------------------------
    // Workbook + download
    // -------------------------
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsReservations, "Reservations");
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const safeSlug = String(hostelSlug).replace(/[^a-z0-9-_]/gi, "_");
    const fileName = `reservas_${safeSlug}_${from}_a_${to}.xlsx`;

    downloadBlob(blob, fileName);
  }
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

  const exportXLSX = async () => {
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

      // aplica búsqueda texto igual que UI
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

      const statusText =
        status === "all" ? t("admin.reservations.filterAll", "Todos los estados") : statusLabel(status as ReservationStatus);

      buildXlsxAndDownload({
        hostelSlug,
        from,
        to,
        statusLabelText: statusText,
        searchText: qText.trim(),
        rows: data,
        moneyFmt: money,
        statusLabelFn: statusLabel,
      });
    } catch (e: any) {
      setErr(e?.message ?? t("admin.reservations.exportError", "Error exportando XLSX"));
    } finally {
      setLoading(false);
    }
  };
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
              <Button
                variant="outlined"
                onClick={exportXLSX}
                sx={{ borderRadius: 999, fontWeight: 900, whiteSpace: "nowrap" }}
                disabled={loading || !hostelSlug}
              >
                Exportar XLSX
              </Button>
            </Stack>
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