import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Chip,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";

import { db } from "../../services/firebase";
import { Seo } from "../../components/Seo";

type ReservationStatus = "pending" | "confirmed" | "cancelled";

type Reservation = {
  id: string;
  fullName: string;
  roomName: string;
  email: string;
  total: number;
  status: ReservationStatus;
  checkIn: Date | null;
  checkOut: Date | null;
};

export default function AdminReservationsPage() {
  const { t } = useTranslation();
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const fetchReservations = async () => {
    if (!hostelSlug) return;

    const q = query(
      collection(db, "hostels", hostelSlug, "reservations"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const data: Reservation[] = snapshot.docs.map((docu) => {
      const raw = docu.data() as any;
      return {
        id: docu.id,
        fullName: raw.fullName ?? "",
        roomName: raw.roomName ?? "",
        email: raw.email ?? "",
        total: raw.total ?? 0,
        status: raw.status ?? "pending",
        checkIn: raw.checkIn?.toDate?.() ?? null,
        checkOut: raw.checkOut?.toDate?.() ?? null,
      };
    });

    setReservations(data);
  };

  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostelSlug]);

  const updateStatus = async (id: string, newStatus: ReservationStatus) => {
    if (!hostelSlug) return;

    await updateDoc(doc(db, "hostels", hostelSlug, "reservations", id), {
      status: newStatus,
    });

    setReservations((prev) =>
      prev.map((res) => (res.id === id ? { ...res, status: newStatus } : res))
    );
  };

  const columns = useMemo<GridColDef<Reservation>[]>(() => [
    { field: "fullName", headerName: t("admin.reservations.columns.guest"), flex: 1 },
    { field: "roomName", headerName: t("admin.reservations.columns.room"), flex: 1 },
    { field: "email", headerName: t("admin.reservations.columns.email"), flex: 1 },
    {
      field: "checkIn",
      headerName: t("admin.reservations.columns.checkIn"),
      flex: 1,
      renderCell: (params) =>
        params.row.checkIn ? params.row.checkIn.toLocaleDateString() : "-",
    },
    {
      field: "checkOut",
      headerName: t("admin.reservations.columns.checkOut"),
      flex: 1,
      renderCell: (params) =>
        params.row.checkOut ? params.row.checkOut.toLocaleDateString() : "-",
    },
    {
      field: "total",
      headerName: t("admin.reservations.columns.total"),
      flex: 1,
      renderCell: (params) => `$${params.row.total}`,
    },
    {
      field: "status",
      headerName: t("admin.reservations.columns.status"),
      width: 150,
      renderCell: (params) => {
        const color =
          params.value === "confirmed"
            ? "success"
            : params.value === "cancelled"
            ? "error"
            : "warning";

        return (
          <Chip
            label={t(`admin.reservations.statusValues.${params.value}`)}
            color={color as any}
          />
        );
      },
    },
    {
      field: "actions",
      headerName: t("admin.reservations.columns.actions"),
      flex: 1.2,
      renderCell: (params) => (
        <Select
          size="small"
          value={params.row.status}
          onChange={(e) =>
            updateStatus(params.row.id, e.target.value as ReservationStatus)
          }
        >
          <MenuItem value="pending">
            {t("admin.reservations.statusValues.pending")}
          </MenuItem>
          <MenuItem value="confirmed">
            {t("admin.reservations.statusValues.confirmed")}
          </MenuItem>
          <MenuItem value="cancelled">
            {t("admin.reservations.statusValues.cancelled")}
          </MenuItem>
        </Select>
      ),
    },
  ], [t]);

  return (
    <>
      <Seo
        title={t("admin.reservations.seoTitle")}
        description={t("admin.reservations.seoDescription")}
        noindex
      />

      <Typography variant="h3" gutterBottom>
        {t("admin.reservations.title")}
      </Typography>

      <Box sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={reservations}
          columns={columns}
          pageSizeOptions={[5, 10, 20]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
          }}
          disableRowSelectionOnClick
        />
      </Box>
    </>
  );
}