import { Container, Typography, Grid, Box, Button } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";
import { rooms } from "./rooms.data";

export const RoomsPage = () => {
    const { hostelSlug } = useParams();

    return (
        <Container sx={{ py: 10 }}>
            <Typography variant="h2" sx={{ mb: 8 }}>
                Our Rooms
            </Typography>

            <Grid container spacing={6}>
                {rooms.map((room) => (
                    <Grid key={room.id} size={{ xs: 12, md: 4 }}>
                        <Box
                            component="img"
                            src={room.image}
                            sx={{
                                width: "100%",
                                aspectRatio: "4 / 3",
                                objectFit: "cover",
                                borderRadius: 2,
                                mb: 3,
                            }}
                        />

                        <Typography variant="h5">{room.name}</Typography>

                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mb: 2 }}
                        >
                            {room.description}
                        </Typography>

                        <Typography sx={{ mb: 3 }}>
                            From ${room.price} / night
                        </Typography>

                        <Button
                            variant="outlined"
                            fullWidth
                            component={RouterLink}
                            to={`/${hostelSlug}/booking/${room.id}`}
                        >
                            VIEW ROOM
                        </Button>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};