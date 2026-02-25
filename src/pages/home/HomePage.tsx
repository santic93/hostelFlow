import { Box, Typography, Button, Grid } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";

import { RoomsPage } from "../rooms/RoomsPage";
import { useHostelPublic } from "../../hooks/useHostelPublic";
import { Seo } from "../../components/Seo";
export const HomePage = () => {
    const { hostelSlug } = useParams<{ hostelSlug: string }>();
    const { hostel } = useHostelPublic(hostelSlug);

    const base = window.location.origin;
    const canonical = hostelSlug ? `${base}/${hostelSlug}` : `${base}/`;

    const title = hostel?.name
        ? `${hostel.name} — Book your stay`
        : "REDSTAYS — Book your stay";

    const description = hostel?.name
        ? `Book rooms at ${hostel.name}. Fast reservation and simple experience.`
        : "Book rooms and manage your hostel with REDSTAYS.";

    return (
        <Box>
            <Seo title={title} description={description} canonical={canonical} />
            <Grid
                container
                sx={{ minHeight: "80vh" }}
            >

                {/* LEFT */}
                <Grid
                    size={{ xs: 12, md: 6 }}
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        pr: { md: 6 },
                    }}
                >
                    <Typography variant="h1" gutterBottom>
                        Independent hostel
                        <br />
                        in the heart of the city
                    </Typography>

                    <Button
                        variant="contained"
                        component={RouterLink}
                        to="/booking"
                        sx={{
                            mt: 4,
                            width: "fit-content",
                            px: 4,
                            py: 1.5,
                            letterSpacing: 1.5,
                        }}
                    >
                        BOOK YOUR STAY
                    </Button>
                </Grid>

                {/* RIGHT IMAGE */}
                <Grid
                    size={{ xs: 12, md: 6 }}
                    sx={{
                        minHeight: { xs: 400, md: "auto" },
                        backgroundImage:
                            "url(https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1400&q=80)",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />

            </Grid>
            {/* ABOUT SECTION */}
            <Grid
                container
                spacing={6}
                sx={{ mt: 12, alignItems: "center" }}
            >

                {/* IMAGE LEFT */}
                <Grid
                    size={{ xs: 12, md: 6 }}
                    sx={{
                        minHeight: 400,
                        backgroundImage:
                            "url(https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1400&q=80)",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />

                {/* TEXT RIGHT */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h2" gutterBottom>
                        About Our Hostel
                    </Typography>

                    <Typography variant="body1" sx={{ mb: 3 }}>
                        Located in the vibrant center of the city, our hostel blends comfort,
                        design and community for travelers who seek more than just a bed.
                    </Typography>

                    <Typography variant="body1" sx={{ mb: 4 }}>
                        From cozy shared rooms to private suites, every detail is crafted to
                        create a warm and inspiring atmosphere.
                    </Typography>

                    <Button variant="outlined">
                        LEARN MORE
                    </Button>
                </Grid>

            </Grid>
            {/* ROOMS PREVIEW */}
            <Box sx={{ mt: 16 }}>


                <Grid container spacing={6}>


                    <RoomsPage />
                </Grid>
            </Box>
        </Box>
    );
};