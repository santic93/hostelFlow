import { useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions, auth } from "../../services/firebase";
import { useAuth } from "../../app/providers/AuthContext";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Stack,
  Divider,
  Chip,
} from "@mui/material";
import { signOut } from "firebase/auth";

function getCallableErrorText(e: any) {
  const code = String(e?.code || "");
  const message = String(e?.message || "Error desconocido");
  const details = e?.details ? String(e.details) : "";

  if (code.includes("permission-denied")) return "No autorizado (solo superadmin).";
  if (code.includes("unauthenticated")) return "Necesitás iniciar sesión.";
  if (code.includes("internal")) return "Error interno (revisá logs de Functions).";
  return details ? `${message} (${details})` : message;
}

export default function SuperAdminInvitesPage() {
  const { user, isSuperAdmin, claimsRole } = useAuth();

  const [notes, setNotes] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canCreate = useMemo(() => Boolean(user) && isSuperAdmin && !loading, [user, isSuperAdmin, loading]);

  const logout = async () => {
    try {
      await signOut(auth);
      setMsg({ type: "success", text: "Sesión cerrada." });
      setCode(null);
    } catch {
      setMsg({ type: "error", text: "No se pudo cerrar sesión." });
    }
  };

  const createInvite = async () => {
    setMsg(null);
    setCode(null);
    setLoading(true);

    try {
      const fn = httpsCallable(functions, "createInvite");
      const res = await fn({ notes: notes.trim() || null });

      const created = (res.data as any)?.code ?? null;
      if (!created) throw new Error("No se recibió el código.");

      setCode(String(created));
      setMsg({ type: "success", text: "Invite generado." });
    } catch (e: any) {
      setMsg({ type: "error", text: getCallableErrorText(e) });
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setMsg({ type: "success", text: "Copiado al portapapeles." });
    } catch {
      setMsg({ type: "error", text: "No se pudo copiar. Copialo manualmente." });
    }
  };

  // ✅ Bloqueo duro: si no hay user o no es superadmin, NO existe pantalla funcional
  if (!user || !isSuperAdmin) {
    return (
      <Container sx={{ py: 10, maxWidth: 520 }}>
        <Alert severity="error">No autorizado.</Alert>
        <Box sx={{ mt: 2, fontSize: 13, opacity: 0.8 }}>
          user: {user?.email ?? "null"} · claimsRole: {claimsRole || "—"}
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 10, maxWidth: 720 }}>
      <Typography variant="h4" gutterBottom>
        SuperAdmin · Invites
      </Typography>

      <Typography sx={{ opacity: 0.8, mb: 2 }}>
        Generá un código para habilitar la creación de un hostel. El usuario lo ingresa en el registro.
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <Chip label={`Logueado: ${user.email ?? "—"}`} />
        <Chip label={`Claims: ${claimsRole || "—"}`} color="success" />
        <Button variant="outlined" onClick={logout}>
          Cerrar sesión
        </Button>
      </Stack>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 2 }}>
          {msg.text}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Notas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            placeholder="Ej: Hostel Luna · Plan Starter · vendido por WhatsApp"
          />

          <Button variant="contained" onClick={createInvite} disabled={!canCreate}>
            {loading ? "Generando..." : "Generar Invite"}
          </Button>

          {code && (
            <>
              <Divider />
              <Alert severity="info">
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Box>
                    <div style={{ fontWeight: 700 }}>Código</div>
                    <Box sx={{ fontWeight: 900, fontSize: 22, letterSpacing: 1, mt: 0.5 }}>{code}</Box>
                  </Box>

                  <Button variant="outlined" onClick={copy}>
                    Copiar
                  </Button>
                </Box>
              </Alert>
            </>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}