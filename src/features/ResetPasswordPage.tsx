import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Container, TextField, Typography } from "@mui/material";
import { confirmPasswordReset, getAuth, verifyPasswordResetCode } from "firebase/auth";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const oobCode = useMemo(() => params.get("oobCode") || "", [params]);

  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleReset = async () => {
    setMsg(null);

    if (!oobCode) {
      setMsg({ type: "error", text: "Link inválido o incompleto. Volvé a pedir el email de reset." });
      return;
    }
    if (pass.length < 6) {
      setMsg({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }
    if (pass !== pass2) {
      setMsg({ type: "error", text: "Las contraseñas no coinciden." });
      return;
    }

    try {
      setLoading(true);
      const auth = getAuth();

      // ✅ valida que el código sea real/no expirado
      await verifyPasswordResetCode(auth, oobCode);

      // ✅ confirma el cambio
      await confirmPasswordReset(auth, oobCode, pass);

      setMsg({ type: "success", text: "Contraseña actualizada. Ya podés iniciar sesión." });
      setTimeout(() => navigate("/login"), 1200);
    } catch (e: any) {
      setMsg({
        type: "error",
        text: "No se pudo restablecer. El link puede haber expirado. Pedí uno nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ py: 10, maxWidth: 520 }}>
      <Typography variant="h4" gutterBottom>
        Crear nueva contraseña
      </Typography>

      <Typography sx={{ color: "text.secondary", mb: 3 }}>
        Ingresá tu nueva contraseña para tu cuenta de HOSTLY.
      </Typography>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 2 }}>
          {msg.text}
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          type="password"
          label="Nueva contraseña"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
        <TextField
          type="password"
          label="Repetir contraseña"
          value={pass2}
          onChange={(e) => setPass2(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleReset();
          }}
        />

        <Button variant="contained" onClick={handleReset} disabled={loading}>
          {loading ? "Guardando..." : "Guardar contraseña"}
        </Button>

        <Button variant="text" onClick={() => navigate("/forgot-password")}>
          Pedir un nuevo link
        </Button>
      </Box>
    </Container>
  );
}