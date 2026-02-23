import { Box, Typography, Container } from "@mui/material";

export const AboutPage = () => {
  return (
    <Container sx={{ py: 10 }}>
      <Typography variant="h2" gutterBottom>
        About Us
      </Typography>

      <Typography variant="body1" sx={{ maxWidth: 600 }}>
        Welcome to our independent hostel located in the heart of the city.
        We offer comfort, community and unforgettable experiences for travelers.
      </Typography>
    </Container>
  );
};