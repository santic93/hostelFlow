import { useEffect, useState } from "react";
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Grid,
} from "@mui/material";
import {
    collection,
    getDocs,
    orderBy,
    query,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

const AdminPage = () => {
    const [reservations, setReservations] = useState<any[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);

    useEffect(() => {
        const fetchReservations = async () => {
            const q = query(
                collection(db, "reservations"),
                orderBy("createdAt", "desc")
            );

            const snapshot = await getDocs(q);

            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setReservations(data);

            const revenue = data.reduce(
                (sum, reservation: any) => sum + reservation.total,
                0
            );

            setTotalRevenue(revenue);
        };

        fetchReservations();
    }, []);

    return (
        <Container sx={{ py: 10 }}>
            <Typography variant="h3" gutterBottom>
                Admin Dashboard
            </Typography>

            <Grid container spacing={4} sx={{ mb: 6 }}>
                <Grid item size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Total Reservations</Typography>
                            <Typography variant="h4">
                                {reservations.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
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
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Container>
    );
};

export default AdminPage;