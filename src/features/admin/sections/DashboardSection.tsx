import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { Box, Typography, Grid, Paper } from "@mui/material";
import { db } from "../../../services/firebase";

type Reservation = {
    total: number;
    checkIn: any;
};

export default function DashboardSection() {
    const { hostelSlug } = useParams<{ hostelSlug: string }>();
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalReservations, setTotalReservations] = useState(0);
    const [totalRooms, setTotalRooms] = useState(0);

    const fetchData = async () => {
        if (!hostelSlug) return;

        const roomsSnap = await getDocs(collection(db, "hostels", hostelSlug, "rooms"));
        const reservationsSnap = await getDocs(collection(db, "hostels", hostelSlug, "reservations"));

        const reservations = reservationsSnap.docs.map((d) => d.data() as Reservation);

        const revenue = reservations.reduce((acc, curr) => acc + (curr.total ?? 0), 0);

        setTotalRevenue(revenue);
        setTotalReservations(reservations.length);
        setTotalRooms(roomsSnap.size);
    };

    useEffect(() => {
        fetchData();
    }, [hostelSlug]);
    const Card = ({ title, value }: { title: string; value: any }) => (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="h4" mt={1}>
                {value}
            </Typography>
        </Paper>
    );

    return (
        <Box>
            <Typography variant="h4" mb={4}>
                Dashboard
            </Typography>

            <Grid container spacing={3}>
                <Grid sx={{ xs: 12, md: 4 }}>
                    <Card title="Ingresos Totales" value={`$${totalRevenue}`} />
                </Grid>

                <Grid sx={{ xs: 12, md: 4 }}>
                    <Card title="Reservas Totales" value={totalReservations} />
                </Grid>

                <Grid sx={{ xs: 12, md: 4 }}>
                    <Card title="Habitaciones Activas" value={totalRooms} />
                </Grid>
            </Grid>
        </Box>
    );
}