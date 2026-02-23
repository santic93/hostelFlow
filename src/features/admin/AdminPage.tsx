import { useEffect, useState } from "react";
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Grid,
    Button,
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

const AdminPage = () => {
    const { hostelSlug } = useAuth();

    const [reservations, setReservations] = useState<any[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);

    useEffect(() => {
        if (!hostelSlug) return; // 👈 protección clave

        const fetchReservations = async () => {
            const q = query(
                collection(db, "hostels", hostelSlug, "reservations"),
                orderBy("createdAt", "desc")
            );

            const snapshot = await getDocs(q);

            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setReservations(data);

            const revenue = data.reduce(
                (sum: number, reservation: any) => sum + reservation.total,
                0
            );

            setTotalRevenue(revenue);
        };

        fetchReservations();
    }, [hostelSlug]);
    const updateStatus = async (id: string, newStatus: string) => {
        if (!hostelSlug) return;

        await updateDoc(
            doc(db, "hostels", hostelSlug, "reservations", id),
            { status: newStatus }
        );

        // refrescamos
        setReservations((prev) =>
            prev.map((res) =>
                res.id === id ? { ...res, status: newStatus } : res
            )
        );
    };
    return (
        <Container sx={{ py: 10 }}>
            <Typography variant="h3" gutterBottom>
                Admin Dashboard
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

            <Box>
                {reservations.map((reservation) => (
                    <Card key={reservation.id} sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6">
                                {reservation.fullName}
                            </Typography>

                            <Typography>
                                Room: {reservation.roomName}
                            </Typography>

                            <Typography>
                                Email: {reservation.email}
                            </Typography>

                            <Typography>
                                Total: ${reservation.total}
                            </Typography>
                            <Typography>
                                Status: {reservation.status}
                            </Typography>
                        </CardContent>
                        <Box sx={{ mt: 2 }}>
                            <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => updateStatus(reservation.id, "confirmed")}
                                sx={{ mr: 1 }}
                            >
                                Confirm
                            </Button>

                            <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={() => updateStatus(reservation.id, "cancelled")}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Card>
                ))}
            </Box>
        </Container>
    );
};

export default AdminPage;