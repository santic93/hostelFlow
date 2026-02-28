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
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../../firebase";
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
};

export default function ReservationsSection() {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const { t } = useTranslation();
  const [rows, setRows] = useState<ReservationRow[]>([]);

  // ✅ loader por fila
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});

  const fetchReservations = async () => {
    if (!hostelSlug) return;

    const q = query(
      collection(db, "hostels", hostelSlug, "reservations"),
      orderBy("createdAt", "desc")
    );

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
      };
    });

    setRows(data);
  };

  useEffect(() => {
    fetchReservations();
  }, [hostelSlug]);

  const statusLabel = (s: ReservationStatus) => {
    if (s === "confirmed") return t("admin.reservations.confirmed");
    if (s === "cancelled") return t("admin.reservations.cancelled");
    return t("admin.reservations.pending");
  };

  const updateStatus = async (reservationId: string, newStatus: ReservationStatus) => {
    if (!hostelSlug) return;

    // si ya está guardando, no hagas nada
    if (savingById[reservationId]) return;

    // UI: loading ON
    setSavingById((prev) => ({ ...prev, [reservationId]: true }));

    // (Opcional) optimista: mostrar el status nuevo ya
    const prevRows = rows;
    setRows((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: newStatus } : r))
    );

    try {
      await setReservationStatus({
        hostelSlug,
        reservationId,
        newStatus,
      });
    } catch (e) {
      // rollback si falla
      setRows(prevRows);
      console.error("setReservationStatus failed", e);
    } finally {
      // UI: loading OFF
      setSavingById((prev) => ({ ...prev, [reservationId]: false }));
    }
  };

  const columns = useMemo<GridColDef<ReservationRow>[]>(() => {
    return [
      { field: "fullName", headerName: t("admin.reservations.guest"), flex: 1 },
      { field: "roomName", headerName: t("admin.reservations.room"), flex: 1 },
      { field: "email", headerName: t("admin.reservations.email"), flex: 1 },
      {
        field: "checkIn",
        headerName: t("admin.reservations.checkIn"),
        flex: 1,
        valueGetter: (_, row) => (row.checkIn ? row.checkIn.toLocaleDateString() : "-"),
      },
      {
        field: "checkOut",
        headerName: t("admin.reservations.checkOut"),
        flex: 1,
        valueGetter: (_, row) => (row.checkOut ? row.checkOut.toLocaleDateString() : "-"),
      },
      {
        field: "total",
        headerName: t("admin.reservations.total"),
        flex: 1,
        valueGetter: (_, row) => `$${row.total}`,
      },
      {
        field: "status",
        headerName: t("admin.reservations.status"),
        width: 180,
        renderCell: (params) => {
          const v = params.row.status;
          const saving = !!savingById[params.row.id];

          if (saving) {
            return (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} />
                <Chip label={t("common.saving") ?? "Guardando..."} color="default" />
              </Stack>
            );
          }

          const color = v === "confirmed" ? "success" : v === "cancelled" ? "error" : "warning";
          return <Chip label={statusLabel(v)} color={color as any} />;
        },
      },
      {
        field: "actions",
        headerName: t("admin.reservations.actions"),
        flex: 1.2,
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
  }, [t, savingById, rows]); // rows no es estrictamente necesario, pero ok

  return (
    <>
      <Typography variant="h3" gutterBottom>
        {t("admin.reservations.title")}
      </Typography>

      <Box sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSizeOptions={[5, 10, 20]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          disableRowSelectionOnClick
          localeText={{ noRowsLabel: t("admin.reservations.empty") }}
        />
      </Box>
    </>
  );
}