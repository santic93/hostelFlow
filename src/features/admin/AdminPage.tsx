import { useEffect, useState } from "react";
import {
    MenuItem,
    Select,
    Typography,
} from "@mui/material";
import {
    collection,
   
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { AdminLayout } from "../../layouts/admin/AdminLayout";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { Chip, Box, } from "@mui/material";
import RoomsSection from "./sections/RoomsSection";
import DashboardSection from "./sections/DashboardSection";
type ReservationStatus = "pending" | "confirmed" | "cancelled";
type Reservation = {
    id: string;
    fullName: string;
    roomName: string;
    email: string;
    checkIn: Date | null;
    checkOut: Date | null;
    total: number;
    status: ReservationStatus;
};

const AdminPage = () => {
    const { hostelSlug } = useAuth();

    const [reservations, setReservations] = useState<Reservation[]>([]);
   
    const fetchReservations = async () => {
        if (!hostelSlug) return;

        const q = query(
            collection(db, "hostels", hostelSlug, "reservations"),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        const data: Reservation[] = snapshot.docs.map((doc) => {
            const raw = doc.data();

            return {
                id: doc.id,
                fullName: raw.fullName ?? "",
                roomName: raw.roomName ?? "",
                email: raw.email ?? "",
                total: raw.total ?? 0,
                status: raw.status ?? "pending",
                checkIn: raw.checkIn?.toDate() ?? null,
                checkOut: raw.checkOut?.toDate() ?? null,
            };
        });

        setReservations(data);

   

    };

    useEffect(() => {
        if (!hostelSlug) return; // 👈 protección clave



        fetchReservations();


    }, [hostelSlug]);
    const updateStatus = async (
        id: string,
        newStatus: ReservationStatus
    ) => {
        if (!hostelSlug) return;

        await updateDoc(
            doc(db, "hostels", hostelSlug, "reservations", id),
            { status: newStatus }
        );

        setReservations((prev) =>
            prev.map((res) =>
                res.id === id ? { ...res, status: newStatus } : res
            )
        );
    };
    const columns: GridColDef<Reservation>[] = [
        {
            field: "fullName",
            headerName: "Guest",
            flex: 1,
        },
        {
            field: "roomName",
            headerName: "Room",
            flex: 1,
        },
        {
            field: "email",
            headerName: "Email",
            flex: 1,
        },
        {
            field: "checkIn",
            headerName: "Check In",
            flex: 1,
            renderCell: (params) =>
                params.row.checkIn
                    ? params.row.checkIn.toLocaleDateString()
                    : "-"
        },
        {
            field: "checkOut",
            headerName: "Check Out",
            flex: 1,
            renderCell: (params) =>
                params.row.checkIn
                    ? params.row.checkIn.toLocaleDateString()
                    : "-"
        },
        {
            field: "total",
            headerName: "Total",
            flex: 1,
            renderCell: (params) => `$${params.row.total}`,
        },
        {
            field: "status",
            headerName: "Estado",
            width: 150,
            renderCell: (params) => {
                const color =
                    params.value === "confirmed"
                        ? "success"
                        : params.value === "cancelled"
                            ? "error"
                            : "warning";

                return <Chip label={params.value} color={color} />;
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
                    onChange={(e) =>
                        updateStatus(params.row.id, e.target.value as ReservationStatus)
                    }
                >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>

            ),
        },
    ];
    // const handleDelete = async (id: string) => {
    //     if (!hostelSlug) return;

    //     const confirm = window.confirm("¿Eliminar reserva?");
    //     if (!confirm) return;

    //     await deleteDoc(
    //         doc(db, "hostels", hostelSlug, "reservations", id)
    //     );

    //     fetchReservations();
    // };
    return (
        <AdminLayout>
            {(section) => {
                if (section === "dashboard") {
                    return (
                        <>
                            <DashboardSection />
                        </>
                    );
                }

                if (section === "reservations") {
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
                                        pagination: {
                                            paginationModel: { pageSize: 10, page: 0 },
                                        },
                                    }}
                                    disableRowSelectionOnClick
                                />
                            </Box>
                        </>
                    );
                }

                if (section === "rooms") {
                    return (
                        <>
                            <RoomsSection />
                        </>
                    );
                }

                return null;
            }}
        </AdminLayout>
    );
};

export default AdminPage;