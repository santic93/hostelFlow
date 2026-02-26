import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Chip, Select, MenuItem } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";

import type { Reservation, ReservationStatus } from "../../types/reservation"; // ajustá path
import { db } from "../../../services/firebase";

export default function ReservationsSection() {
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

  const columns: GridColDef<Reservation>[] = [
    { field: "fullName", headerName: "Guest", flex: 1 },
    { field: "roomName", headerName: "Room", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "checkIn",
      headerName: "Check In",
      flex: 1,
      renderCell: (params) => (params.row.checkIn ? params.row.checkIn.toLocaleDateString() : "-"),
    },
    {
      field: "checkOut",
      headerName: "Check Out",
      flex: 1,
      renderCell: (params) => (params.row.checkOut ? params.row.checkOut.toLocaleDateString() : "-"),
    },
    { field: "total", headerName: "Total", flex: 1, renderCell: (params) => `$${params.row.total}` },
    {
      field: "status",
      headerName: "Estado",
      width: 150,
      renderCell: (params) => {
        const color =
          params.value === "confirmed" ? "success" : params.value === "cancelled" ? "error" : "warning";
        return <Chip label={params.value} color={color as any} />;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.5,
      renderCell: (params) => (
        <Select
          size="small"
          value={params.row.status}
          onChange={(e) => updateStatus(params.row.id, e.target.value as ReservationStatus)}
        >
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="confirmed">Confirmed</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
        </Select>
      ),
    },
  ];

  return (
    <>
      <Typography variant="h3" gutterBottom>
        Reservations
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