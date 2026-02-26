import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Chip, Select, MenuItem } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "../../../services/firebase"; // ajustá si tu path es distinto

type ReservationStatus = "pending" | "confirmed" | "cancelled";

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
  const [rows, setRows] = useState<ReservationRow[]>([]);

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

  const updateStatus = async (id: string, newStatus: ReservationStatus) => {
    if (!hostelSlug) return;

    await updateDoc(doc(db, "hostels", hostelSlug, "reservations", id), {
      status: newStatus,
    });

    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
  };

  const columns: GridColDef<ReservationRow>[] = [
    { field: "fullName", headerName: "Guest", flex: 1 },
    { field: "roomName", headerName: "Room", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "checkIn",
      headerName: "Check In",
      flex: 1,
      valueGetter: (_, row) => (row.checkIn ? row.checkIn.toLocaleDateString() : "-"),
    },
    {
      field: "checkOut",
      headerName: "Check Out",
      flex: 1,
      valueGetter: (_, row) => (row.checkOut ? row.checkOut.toLocaleDateString() : "-"),
    },
    { field: "total", headerName: "Total", flex: 1, valueGetter: (_, row) => `$${row.total}` },
    {
      field: "status",
      headerName: "Estado",
      width: 150,
      renderCell: (params) => {
        const v = params.value as ReservationStatus;
        const color = v === "confirmed" ? "success" : v === "cancelled" ? "error" : "warning";
        return <Chip label={v} color={color as any} />;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.2,
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
          rows={rows}
          columns={columns}
          pageSizeOptions={[5, 10, 20]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          disableRowSelectionOnClick
        />
      </Box>
    </>
  );
}