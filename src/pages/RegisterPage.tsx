import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { Box, Button, Container, TextField, Typography, Collapse, Alert } from "@mui/material";
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

  // Step 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2
  const [hostelName, setHostelName] = useState("");
  const [hostelSlug, setHostelSlug] = useState("");

  const [step, setStep] = useState<1 | 2>(1);
  const [createdUser, setCreatedUser] = useState<null | any>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const normalizedSlug = useMemo(() => slugify(hostelSlug), [hostelSlug]);

  const handleCreateAccount = async () => {
    setMessage(null);
    console.log("before setStep", step);
    setStep(2);
    console.log("after setStep -> 2");
    if (!email.trim()) return setMessage({ type: "error", text: "Ingresá un email" });
    if (password.length < 6) return setMessage({ type: "error", text: "Password mínimo 6 caracteres" });

    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      setCreatedUser(cred.user);
      setStep(2);
      setMessage({ type: "success", text: "Cuenta creada ✅ Ahora creá tu hostel." });
    } catch (err: any) {
      if (err?.code === "auth/email-already-in-use") {
        setMessage({ type: "error", text: "Ese email ya está en uso." });
      } else {
        setMessage({ type: "error", text: "Error creando cuenta. Revisá consola." });
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHostel = async () => {

    setMessage(null);

    const current = auth.currentUser;
    if (!current) return setMessage({ type: "error", text: "Sesión no disponible. Reintentá." });
    if (!hostelName.trim()) return setMessage({ type: "error", text: "Ingresá el nombre del hostel" });
    if (!normalizedSlug) return setMessage({ type: "error", text: "Ingresá un slug válido" });

    try {
      setLoading(true);

      const uid = current.uid;

      await runTransaction(db, async (tx) => {
        const hostelRef = doc(db, "hostels", normalizedSlug);
        const hostelSnap = await tx.get(hostelRef);
        if (hostelSnap.exists()) throw new Error("SLUG_TAKEN");

        tx.set(hostelRef, {
          name: hostelName.trim(),
          slug: normalizedSlug,
          ownerUid: uid,
          createdAt: serverTimestamp(),
        });

        const userRef = doc(db, "users", uid);
        tx.set(
          userRef,
          {
            role: "admin",
            hostelSlug: normalizedSlug,
            email: email.trim().toLowerCase(),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      });

      setMessage({ type: "success", text: "Hostel creado ✅ Redirigiendo al panel..." });

      // IMPORTANTÍSIMO: no dependas de que el AuthContext ya haya “levantado” el role
      // Mandalo a /admin global y AdminRedirect lo lleva al tenant correcto.
      navigate("/admin", { replace: true });
    } catch (err: any) {
      console.error(err);

      // rollback: si falló firestore, borramos el usuario recién creado
      try {
        if (auth.currentUser) await deleteUser(auth.currentUser);
      } catch { }

      setCreatedUser(null);
      setStep(1);

      if (err?.message === "SLUG_TAKEN") {
        setMessage({ type: "error", text: "Ese slug ya está en uso. Elegí otro." });
      } else {
        setMessage({ type: "error", text: "Error creando hostel (Firestore). Revisá reglas/permisos." });
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

      {message && (
        <Alert sx={{ mt: 2 }} severity={message.type}>
          {message.text}
        </Alert>
      )}

      {/* STEP 1 */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 3 }}>
        <TextField label="Email admin" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button variant="contained" disabled={loading} onClick={handleCreateAccount}>
          {loading ? "Creando..." : "Crear cuenta"}
        </Button>
      </Box>

      {/* STEP 2 (aparece solo cuando step=2) */}
      <Collapse in={step === 2}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 4 }}>
          <TextField
            label="Nombre del hostel"
            value={hostelName}
            onChange={(e) => setHostelName(e.target.value)}
          />

          <TextField
            label="Slug (URL)"
            value={hostelSlug}
            onChange={(e) => setHostelSlug(e.target.value)}
            helperText={normalizedSlug ? `Tu URL: /${normalizedSlug}` : "Ej: selina-palermo"}
          />

          <Button variant="contained" disabled={loading} onClick={handleCreateHostel}>
            {loading ? "Creando..." : "Crear hostel"}
          </Button>
        </Box>
      </Collapse>
    </Container>
  );
}