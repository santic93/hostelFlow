import { useState } from "react";
import { Container, Typography, TextField, Button, Alert, Stack } from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../services/firebase";
import { Seo } from "../../components/Seo";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setMsg(null);
    if (!email.trim()) return setMsg({ type: "error", text: "Ingresá tu email" });
    if (password.length < 6) return setMsg({ type: "error", text: "Password mínimo 6 caracteres" });

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/admin", { replace: true }); // AdminRedirect decide a qué hostel ir
    } catch (err: any) {
      const code = err?.code;
      const text =
        code === "auth/invalid-credential" ? "Credenciales inválidas" :
        code === "auth/user-not-found" ? "Usuario no encontrado" :
        code === "auth/wrong-password" ? "Password incorrecta" :
        "Error al iniciar sesión";
      setMsg({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setMsg(null);
    if (!email.trim()) return setMsg({ type: "error", text: "Ingresá tu email para recuperar la contraseña" });
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setMsg({ type: "success", text: "Te enviamos un email para resetear tu contraseña ✅" });
    } catch {
      setMsg({ type: "error", text: "No se pudo enviar el email de recuperación" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Login — REDSTAYS" description="Admin login" noindex />
      <Container sx={{ py: 12, maxWidth: 420 }}>
        <Typography variant="h4" gutterBottom>Admin Login</Typography>

        {msg && <Alert sx={{ mt: 2 }} severity={msg.type}>{msg.text}</Alert>}

        <Stack spacing={2.5} sx={{ mt: 3 }}>
          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <Button variant="contained" onClick={handleLogin} disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>

          <Button variant="text" onClick={handleReset} disabled={loading}>
            Olvidé mi contraseña
          </Button>

          <Button component={RouterLink} to="/register" variant="outlined">
            Crear mi hostel (registro)
          </Button>
        </Stack>
      </Container>
    </>
  );
}