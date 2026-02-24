import { useEffect, useState } from "react";
import {

    Typography,

    Card,
    CardContent,
    Grid,


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
import { Chip, Box, Button } from "@mui/material";
import RoomsSection from "./sections/RoomsSection";
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
    const [totalRevenue, setTotalRevenue] = useState(0);

    useEffect(() => {
        if (!hostelSlug) return; // 👈 protección clave

        const fetchReservations = async () => {
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

            const revenue = data.reduce(
                (sum: number, reservation: any) => sum + reservation.total,
                0
            );

            setTotalRevenue(revenue);
        };

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
            headerName: "Status",
            flex: 1,
            renderCell: (params) => {
                const status = params.row.status || "pending";

                const color =
                    status === "confirmed"
                        ? "success"
                        : status === "cancelled"
                            ? "error"
                            : "warning";

                return <Chip label={status} color={color} />;
            },
        },
        {
            field: "actions",
            headerName: "Actions",
            flex: 1.5,
            renderCell: (params) => (
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() =>
                            updateStatus(params.row.id, "confirmed")
                        }
                    >
                        Confirm
                    </Button>

                    <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() =>
                            updateStatus(params.row.id, "cancelled")
                        }
                    >
                        Cancel
                    </Button>
                </Box>
            ),
        },
    ];
    return (
        <AdminLayout>
            {(section) => {
                if (section === "dashboard") {
                    return (
                        <>
                            <Typography variant="h3" gutterBottom>
                                Dashboard
                            </Typography>

                            <Grid container spacing={4} sx={{ mb: 6 }}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6">Total Reservations</Typography>
                                            <Typography variant="h4">
                                                {reservations.length}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6">Total Revenue</Typography>
                                            <Typography variant="h4">
                                                ${totalRevenue}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
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