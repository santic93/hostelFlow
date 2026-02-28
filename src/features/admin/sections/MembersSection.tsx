import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db, functions } from "../../../services/firebase";

type MemberRole = "owner" | "manager" | "staff";

export default function MembersSection() {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("staff");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const refresh = async () => {
    if (!hostelSlug) return;
    setLoadingMembers(true);
    try {
      const q = query(
        collection(db, "hostels", hostelSlug, "members"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setMembers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [hostelSlug]);

  const onInvite = async () => {
    if (!hostelSlug) return;
    setErr(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setErr("Email inválido");
      return;
    }

    setSubmitting(true);
    try {
      const inviteMember = httpsCallable(functions, "inviteMember");
      await inviteMember({ hostelSlug, email: normalizedEmail, role });
      setEmail("");
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo invitar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
        Members & Roles
      </Typography>

      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Select
          size="small"
          value={role}
          onChange={(e) => setRole(e.target.value as MemberRole)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="staff">Staff</MenuItem>
          <MenuItem value="manager">Manager</MenuItem>
          <MenuItem value="owner">Owner</MenuItem>
        </Select>
        <Button
          variant="contained"
          onClick={onInvite}
          disabled={submitting || !email.trim()}
          sx={{ borderRadius: 3, whiteSpace: "nowrap" }}
        >
          {submitting ? <CircularProgress size={18} /> : "Invitar"}
        </Button>
      </Stack>

      <Typography sx={{ fontWeight: 800, mb: 1, opacity: 0.85 }}>
        Miembros actuales
      </Typography>

      {loadingMembers ? (
        <CircularProgress />
      ) : (
        <Stack spacing={1}>
          {members.map((m) => (
            <Box
              key={m.id}
              sx={{
                p: 1.5,
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 3,
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 900 }}>
                  {m.email ?? m.id}
                </Typography>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>
                  UID: {m.id}
                </Typography>
              </Box>

              <Typography sx={{ fontWeight: 900 }}>
                {String(m.role || "").toUpperCase()}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}