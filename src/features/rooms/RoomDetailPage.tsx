import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { Container, Typography, Box, Button } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

import type { Room } from "../../types/room"; // ajustá path
import { db } from "../../services/firebase";
import SafeImage from "../../components/SafeImage";

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
        price: raw.price ?? 0,
        capacity: raw.capacity ?? 1,
        description: raw.description ?? "",
        imageUrl: raw.imageUrl ?? "",
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
        to={`/${hostelSlug}/rooms`}
        startIcon={<ArrowBackIosNewIcon />}
      >
        Back to Rooms
      </Button>

      <Container sx={{ py: 10 }}>
        <SafeImage
          src={room.imageUrl}
          alt={room.name}
          sx={{ mb: 3 }}
        />
        {/* <Box
          component="img"
     src={room.imageUrl || "https://via.placeholder.com/800x600?text=Room"}
          sx={{
            width: "100%",
            maxHeight: 500,
            objectFit: "cover",
            borderRadius: 2,
            mb: 6,
            bgcolor: "grey.100",
          }}
        /> */}

        <Typography variant="h2" gutterBottom>
          {room.name}
        </Typography>

        <Typography sx={{ mb: 4 }}>{room.description}</Typography>

        <Typography sx={{ mb: 4 }}>From ${room.price} / night</Typography>

        <Button
          variant="contained"
          component={RouterLink}
          to={`/${hostelSlug}/booking/${room.id}`}
        >
          BOOK THIS ROOM
        </Button>
      </Container>
    </>
  );
};