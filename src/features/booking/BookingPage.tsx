import { useLocation, useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";

import { useState } from "react";
import {
  DatePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {

  Button,
  Stack,
  Box,
  Typography,
  Container,
  Grid,
  TextField,
} from "@mui/material";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase"
import { query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
export const BookingPage = () => {
  const { hostelSlug } = useAuth();
  const location = useLocation();
  const selectedRoom = location.state?.room;

  const [checkIn, setCheckIn] = useState<Dayjs | null>(null);
  const [checkOut, setCheckOut] = useState<Dayjs | null>(null);

  const nights =
    checkIn && checkOut
      ? checkOut.diff(checkIn, "day")
      : 0;

  const total =
    selectedRoom && nights > 0
      ? nights * selectedRoom.price
      : 0;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [touched,] = useState(false);

  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const isFormValid =
    selectedRoom &&
    nights > 0 &&
    fullName.trim().length > 2 &&
    isEmailValid;


  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const checkAvailability = async () => {
    if (!hostelSlug || !selectedRoom) return false;

    const q = query(
      collection(db, "hostels", hostelSlug, "reservations"),
      where("roomId", "==", selectedRoom.id)
    );

    const snapshot = await getDocs(q);

    const newCheckIn = checkIn?.toDate();
    const newCheckOut = checkOut?.toDate();

    for (const doc of snapshot.docs) {
      const data = doc.data();

      const existingCheckIn = data.checkIn.toDate();
      const existingCheckOut = data.checkOut.toDate();

      const isOverlapping =
        newCheckIn &&
        newCheckIn < existingCheckOut &&
        newCheckOut &&
        newCheckOut > existingCheckIn;

      if (isOverlapping) return false;
    }

    return true;
  };
  const handleConfirm = async () => {
    if (!isFormValid || !hostelSlug || !selectedRoom) return;

    try {
      setLoading(true);

      const available = await checkAvailability();

      if (!available) {
        alert("Selected dates are not available for this room.");
        setLoading(false);
        return;
      }

  await addDoc(
  collection(db, "hostels", hostelSlug, "reservations"),
  {
    roomId: selectedRoom.id,
    roomName: selectedRoom.name,
    pricePerNight: selectedRoom.price,
    checkIn: checkIn?.toDate(),
    checkOut: checkOut?.toDate(),
    nights,
    total,
    fullName,
    email,
    status: "pending", // 👈 NUEVO
    createdAt: serverTimestamp(),
  }
);

      setSuccess(true);
    } catch (error) {
      console.error("Error saving reservation:", error);
    } finally {
      setLoading(false);
    }
  };
  if (success) {
    return (
      <Container sx={{ py: 15, textAlign: "center" }}>
        <Typography variant="h2" gutterBottom>
          Reservation Confirmed
        </Typography>

        <Typography sx={{ mb: 4 }}>
          We’ve received your booking request.
          A confirmation email will be sent shortly.
        </Typography>
      </Container>
    );
  }
  if (!hostelSlug) {
    return null; // o un loader si querés algo más elegante
  }
  const navigate = useNavigate();
  return (
    <>
      <Button
        onClick={() => navigate(-1)}
        startIcon={<ArrowBackIosNewIcon />}
      >
        Back
      </Button>
      <Container sx={{ py: 10 }}>
        <Typography variant="h2" gutterBottom>
          Book Your Stay
        </Typography>

        <Grid container spacing={8} sx={{ mt: 4 }}>

          {/* LEFT COLUMN — FORM */}
          <Grid size={{ xs: 12, md: 7 }}>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack spacing={4}>

                <DatePicker
                  label="Check-in"
                  value={checkIn}
                  minDate={dayjs()}
                  onChange={(newValue) => setCheckIn(newValue)}
                />

                <DatePicker
                  label="Check-out"
                  value={checkOut}
                  minDate={checkIn || dayjs()}
                  onChange={(newValue) => setCheckOut(newValue)}
                />

              </Stack>

            </LocalizationProvider>
            <Stack spacing={4} sx={{ mt: 6 }}>
              <TextField

                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                fullWidth
              />

              <TextField
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                error={touched && !isEmailValid}
                helperText={
                  touched && !isEmailValid
                    ? "Enter a valid email address"
                    : ""
                }
              />
            </Stack>
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 6, py: 2 }}
              disabled={!isFormValid || loading}
              onClick={handleConfirm}
            >
              {loading ? "Processing..." : "CONFIRM RESERVATION"}
            </Button>

          </Grid>

          {/* RIGHT COLUMN — SUMMARY */}
          <Grid size={{ xs: 12, md: 5 }}>

            <Box
              sx={{
                border: "1px solid #E0E0E0",
                borderRadius: 3,
                p: 4,
                position: { md: "sticky" },
                top: { md: 100 },
              }}
            >

              {selectedRoom ? (
                <>
                  <Typography variant="h5" gutterBottom>
                    {selectedRoom.name}
                  </Typography>

                  <Typography sx={{ mb: 2 }}>
                    ${selectedRoom.price} per night
                  </Typography>

                  <Box sx={{ borderTop: "1px solid #eee", my: 3 }} />

                  <Typography>
                    {nights > 0 ? `${nights} nights` : "Select dates"}
                  </Typography>

                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Total: ${total}
                  </Typography>
                </>
              ) : (
                <Typography>Select a room first.</Typography>
              )}

            </Box>

          </Grid>

        </Grid>
      </Container>
    </>
  );
};