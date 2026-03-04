import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Stack,
  Chip,
} from "@mui/material";
import { signOut } from "firebase/auth";
import { useAuth } from "../app/providers/AuthContext";
import { auth, functions } from "../services/firebase";

export default function SuperAdminInvitesPage() {
  const { user, isSuperAdmin, claimsRole } = useAuth();

  const [notes, setNotes] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // nada
    }
  };

  const createInvite = async () => {
    setMsg(null);
    setCode(null);
    setLoading(true);
    try {
      const fn = httpsCallable(functions, "createInvite");
      const res = await fn({ notes: notes.trim() || null });
      setCode((res.data as any)?.code ?? null);
      setMsg({ type: "success", text: "Invite generado." });
    } catch (e: any) {
      setMsg({ type: "error", text: e?.message ?? "No se pudo generar el invite." });
    } finally {
      setLoading(false);
    }
  };

  // ✅ doble guard (UX) — la seguridad real igual la da el backend
  if (!user || !isSuperAdmin) {
    return (
      <Container sx={{ py: 10, maxWidth: 520 }}>
        <Alert severity="error">No autorizado.</Alert>
        <Box sx={{ mt: 2, opacity: 0.8, fontSize: 14 }}>
          user: {user?.email ?? "null"} · claimsRole: {claimsRole || "—"}
        </Box>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 10, maxWidth: 640 }}>
      <Typography variant="h4" gutterBottom>
        SuperAdmin · Invites
      </Typography>

      <Typography sx={{ opacity: 0.8, mb: 2 }}>
        Generá un código para habilitar la creación de un hostel. El usuario lo ingresa en el registro.
      </Typography>

      {/* ✅ DEBUG VISIBLE para que nunca haya dudas */}
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
        <Chip label={`Logueado: ${user.email ?? "—"}`} />
        <Chip label={`Claims: ${claimsRole || "—"}`} color="success" />
        <Button variant="outlined" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </Stack>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 2 }}>
          {msg.text}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <TextField
          label="Notas (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <Button variant="contained" onClick={createInvite} disabled={loading}>
          {loading ? "Generando..." : "Generar Invite"}
        </Button>

        {code && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info">
              Código:
              <Box component="span" sx={{ ml: 1, fontWeight: 800, fontSize: 22, letterSpacing: 1 }}>
                {code}
              </Box>
            </Alert>
          </Box>
        )}
      </Paper>
    </Container>
  );
}