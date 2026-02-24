import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { Container, Typography, Box, Button } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { db } from "../../services/firebase";


type Room = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
};

export const RoomDetailPage = () => {
  const { hostelSlug, id } = useParams<{ hostelSlug: string; id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      if (!hostelSlug || !id) return;

      setLoading(true);
      const snap = await getDoc(doc(db, "hostels", hostelSlug, "rooms", id));

      if (!snap.exists()) {
        setRoom(null);
        setLoading(false);
        return;
      }

      const raw = snap.data() as any;
      setRoom({
        id: snap.id,
        name: raw.name ?? "",
        description: raw.description ?? "",
        price: raw.price ?? 0,
        imageUrl: raw.imageUrl ?? raw.image ?? "",
      });
      setLoading(false);
    };

    fetchRoom();
  }, [hostelSlug, id]);

  if (loading) return <div>Loading...</div>;
  if (!room) return <div>Room not found</div>;

  return (
    <>
      <Button
        component={RouterLink}
        to={`/${hostelSlug}/rooms`} // ✅ back correcto
        startIcon={<ArrowBackIosNewIcon />}
      >
        Back to Rooms
      </Button>

      <Container sx={{ py: 10 }}>
        <Box
          component="img"
          src={room.imageUrl || "https://via.placeholder.com/1200x600?text=Room"}
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

        <Typography sx={{ mb: 4 }}>{room.description}</Typography>

        <Typography sx={{ mb: 4 }}>From ${room.price} / night</Typography>

        <Button
          variant="contained"
          component={RouterLink}
          to={`/${hostelSlug}/booking/${room.id}`} // ✅ booking correcto
        >
          BOOK THIS ROOM
        </Button>
      </Container>
    </>
  );
};