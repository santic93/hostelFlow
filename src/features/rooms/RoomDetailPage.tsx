import { useParams } from "react-router-dom";
import { rooms } from "./rooms.data";
import { Container, Typography, Box, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
export const RoomDetailPage = () => {
  const { id } = useParams();

  const room = rooms.find((r) => r.id === id);

  if (!room) {
    return <div>Room not found</div>;
  }

  return (
    <>
      <Button
        component={RouterLink}
        to="/rooms"
        startIcon={<ArrowBackIosNewIcon />}
      >
        Back to Rooms
      </Button>

      <Container sx={{ py: 10 }}>

        <Box
          component="img"
          src={room.image}
          sx={{
            width: "100%",
            maxHeight: 500,
            objectFit: "cover",
            borderRadius: 2,
            mb: 6,
          }}
        />

        <Typography variant="h2" gutterBottom>
          {room.name}
        </Typography>

        <Typography sx={{ mb: 4 }}>
          {room.description}
        </Typography>

        <Typography sx={{ mb: 4 }}>
          From ${room.price} / night
        </Typography>

        <Button
          variant="contained"
          component={RouterLink}
          to="/booking"
          state={{ room }}
        >
          BOOK THIS ROOM
        </Button>
      </Container> </>
  );
};