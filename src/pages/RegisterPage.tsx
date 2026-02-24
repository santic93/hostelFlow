import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { Container, Typography, Box, TextField, Button } from "@mui/material";
import { auth, db } from "../services/firebase";


function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [hostelName, setHostelName] = useState("");
  const [hostelSlug, setHostelSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const slug = slugify(hostelSlug);

    if (!hostelName.trim()) return alert("Ingresá el nombre del hostel");
    if (!slug) return alert("Ingresá un slug válido (ej: selina-palermo)");
    if (!email.trim()) return alert("Ingresá un email");
    if (password.length < 6) return alert("Password mínimo 6 caracteres");
    let createdUser: any = null;

    try {
      setLoading(true);

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      createdUser = cred.user;

      await runTransaction(db, async (tx) => {
        const hostelRef = doc(db, "hostels", slug);
        const hostelSnap = await tx.get(hostelRef);
        if (hostelSnap.exists()) throw new Error("SLUG_TAKEN");

        tx.set(hostelRef, {
          name: hostelName.trim(),
          slug,
          ownerUid: createdUser.uid,
          createdAt: serverTimestamp(),
        });

        const userRef = doc(db, "users", createdUser.uid);
        tx.set(userRef, {
          role: "admin",
          hostelSlug: slug,
          email: email.trim().toLowerCase(),
          createdAt: serverTimestamp(),
        }, { merge: true });
      });

      // ✅ éxito
      alert("Hostel creado correctamente ✅");
      navigate(`/${slug}/admin`, { replace: true });

    } catch (err: any) {
      console.error(err);

      // rollback si auth se creó pero firestore falló
      if (createdUser) {
        try { await deleteUser(createdUser); } catch { }
      }

      if (err?.message === "SLUG_TAKEN") {
        alert("Ese slug ya está en uso. Elegí otro.");
      } else if (err?.code === "auth/email-already-in-use") {
        alert("Ese email ya está en uso.");
      } else if (err?.code === "permission-denied") {
        alert("Permisos insuficientes. Revisá Firestore Rules.");
      } else {
        alert("Error creando el hostel. Revisá consola.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ py: 12, maxWidth: 520 }}>
      <Typography variant="h4" gutterBottom>
        Crear mi Hostel
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 3 }}>
        <TextField
          label="Nombre del hostel"
          value={hostelName}
          onChange={(e) => setHostelName(e.target.value)}
        />

        <TextField
          label="Slug (URL)"
          value={hostelSlug}
          onChange={(e) => setHostelSlug(e.target.value)}
          helperText="Tu URL será: tudominio.com/tu-slug"
        />

        <TextField
          label="Email admin"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="Mínimo 6 caracteres"
        />

        <Button variant="contained" disabled={loading} onClick={handleRegister}>
          {loading ? "Creando..." : "Crear hostel"}
        </Button>
      </Box>
    </Container>
  );
}