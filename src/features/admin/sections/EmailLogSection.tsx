import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  MenuItem,
  Select,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import dayjs from "dayjs";
import { db } from "../../../services/firebase";

import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useAuth } from "../../../app/providers/AuthContext";

type EmailKind = "reservation_created" | "reservation_status" | "reservation_cancelled" | "invite_member";

type EmailLogRow = {
  id: string;
  createdAt: Date | null;
  ok: boolean;
  kind: EmailKind | string;
  to: string;
  subject: string;
  provider?: string | null;
  error?: string | null;
  meta?: Record<string, any> | null;
};

function kindLabel(kind: string) {
  if (kind === "reservation_created") return "Reserva creada";
  if (kind === "reservation_status") return "Cambio de estado";
  if (kind === "reservation_cancelled") return "Reserva cancelada";
  if (kind === "invite_member") return "Invitación miembro";
  return kind || "—";
}

function kindChipColor(kind: string): "default" | "primary" | "secondary" | "success" | "warning" | "error" {
  if (kind === "reservation_created") return "primary";
  if (kind === "reservation_status") return "secondary";
  if (kind === "reservation_cancelled") return "warning";
  if (kind === "invite_member") return "success";
  return "default";
}

export default function EmailLogsSection() {
  const { hostelSlug } = useParams<{ hostelSlug: string }>();
  const { isManager, loading: authLoading } = useAuth();
  const isMobile = useMediaQuery("(max-width:900px)");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<EmailLogRow[]>([]);

  // filtros
  const [qText, setQText] = useState("");
  const [kind, setKind] = useState<EmailKind | "all">("all");
  const [ok, setOk] = useState<"all" | "ok" | "fail">("all");

  const fetchLogs = async () => {
    if (!hostelSlug) return;

    setErr(null);
    setLoading(true);
    try {
      const base = collection(db, "hostels", hostelSlug, "email_logs");
      const q = query(base, orderBy("createdAt", "desc"), limit(250));
      const snap = await getDocs(q);

      const data: EmailLogRow[] = snap.docs.map((d) => {
        const raw = d.data() as any;
        return {
          id: d.id,
          createdAt: raw.createdAt?.toDate?.() ?? null,
          ok: Boolean(raw.ok),
          kind: String(raw.kind ?? ""),
          to: String(raw.to ?? ""),
          subject: String(raw.subject ?? ""),
          provider: raw.provider ?? null,
          error: raw.error ? String(raw.error) : null,
          meta: raw.meta ?? null,
        };
      });

      setRows(data);
    } catch (e: any) {
      setErr(e?.message ?? "No se pudieron cargar los logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostelSlug]);

  const filtered = useMemo(() => {
    const q = qText.trim().toLowerCase();

    return rows.filter((r) => {
      if (kind !== "all" && r.kind !== kind) return false;
      if (ok === "ok" && !r.ok) return false;
      if (ok === "fail" && r.ok) return false;

      if (!q) return true;

      const hay =
        (r.to || "").toLowerCase() +
        " " +
        (r.subject || "").toLowerCase() +
        " " +
        (r.kind || "").toLowerCase() +
        " " +
        (r.error || "").toLowerCase();

      return hay.includes(q);
    });
  }, [rows, qText, kind, ok]);

  const columns = useMemo<GridColDef[]>(() => {
    return [
      {
        field: "createdAt",
        headerName: "Fecha",
        width: 160,
        valueGetter: (_, row) => (row.createdAt ? dayjs(row.createdAt).format("DD/MM HH:mm") : "—"),
      },
      {
        field: "ok",
        headerName: "OK",
        width: 90,
        renderCell: (p) =>
          p.row.ok ? (
            <Chip size="small" icon={<CheckCircleIcon />} label="OK" color="success" />
          ) : (
            <Chip size="small" icon={<ErrorOutlineIcon />} label="Fail" color="error" />
          ),
      },
      {
        field: "kind",
        headerName: "Tipo",
        width: 170,
        renderCell: (p) => (
          <Chip size="small" label={kindLabel(String(p.row.kind))} color={kindChipColor(String(p.row.kind))} />
        ),
      },
      { field: "to", headerName: "To", flex: 1, minWidth: 220 },
      { field: "subject", headerName: "Subject", flex: 1, minWidth: 260 },
      {
        field: "provider",
        headerName: "Provider",
        width: 120,
        valueGetter: (_, row) => row.provider ?? "—",
      },
    ];
  }, []);

  if (authLoading) {
    return (
      <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // manager+ solamente (rules también)
  if (!isManager) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">No tenés permisos para ver Email Logs (solo manager/owner).</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ gap: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <MailOutlineIcon />
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Email Logs
            </Typography>
          </Stack>

          <Chip
            size="small"
            label={`${filtered.length}/${rows.length}`}
            sx={{
              borderRadius: 999,
              fontWeight: 900,
              background: "rgba(0,0,0,0.06)",
            }}
          />
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            size="small"
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder="Buscar por email, asunto, error…"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Select size="small" value={kind} onChange={(e) => setKind(e.target.value as any)} sx={{ minWidth: 210 }}>
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="reservation_created">Reserva creada</MenuItem>
            <MenuItem value="reservation_status">Cambio de estado</MenuItem>
            <MenuItem value="reservation_cancelled">Reserva cancelada</MenuItem>
            <MenuItem value="invite_member">Invitación miembro</MenuItem>
          </Select>

          <Select size="small" value={ok} onChange={(e) => setOk(e.target.value as any)} sx={{ minWidth: 140 }}>
            <MenuItem value="all">OK + Fail</MenuItem>
            <MenuItem value="ok">Solo OK</MenuItem>
            <MenuItem value="fail">Solo Fail</MenuItem>
          </Select>

          <Chip
            clickable
            onClick={fetchLogs}
            label={loading ? "Cargando…" : "Refrescar"}
            sx={{
              borderRadius: 999,
              fontWeight: 900,
              px: 1,
              background: "rgba(115, 2, 2, 0.10)",
              "&:hover": { background: "rgba(115, 2, 2, 0.16)" },
            }}
          />
        </Stack>

        {err && <Alert severity="error">{err}</Alert>}
      </Stack>

      {loading ? (
        <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        <Stack spacing={1.2}>
          {filtered.map((r) => (
            <Card key={r.id} sx={{ borderRadius: 3, overflow: "hidden" }}>
              <CardContent sx={{ pb: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ gap: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Chip
                      size="small"
                      label={kindLabel(r.kind)}
                      color={kindChipColor(r.kind)}
                      sx={{ borderRadius: 999, fontWeight: 900 }}
                    />
                    <Typography sx={{ fontSize: 12, opacity: 0.75 }} noWrap>
                      {r.createdAt ? dayjs(r.createdAt).format("DD/MM HH:mm") : "—"}
                    </Typography>
                  </Stack>

                  {r.ok ? (
                    <Chip size="small" icon={<CheckCircleIcon />} label="OK" color="success" />
                  ) : (
                    <Chip size="small" icon={<ErrorOutlineIcon />} label="Fail" color="error" />
                  )}
                </Stack>

                <Typography sx={{ mt: 1, fontWeight: 900 }} noWrap>
                  {r.to || "—"}
                </Typography>

                <Typography sx={{ mt: 0.4, opacity: 0.85 }} noWrap>
                  {r.subject || "—"}
                </Typography>

                {r.error ? (
                  <>
                    <Divider sx={{ my: 1.2 }} />
                    <Typography sx={{ fontSize: 12, color: "error.main" }}>
                      {r.error}
                    </Typography>
                  </>
                ) : null}

                <Divider sx={{ my: 1.2 }} />

                <Stack direction="row" justifyContent="space-between" sx={{ opacity: 0.8 }}>
                  <Typography sx={{ fontSize: 12 }}>Provider: {r.provider ?? "—"}</Typography>
                  <Typography sx={{ fontSize: 12 }}>ID: {r.id.slice(0, 8)}…</Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <Box sx={{ py: 6, textAlign: "center", opacity: 0.7 }}>
              <Typography sx={{ fontWeight: 900 }}>Sin logs</Typography>
              <Typography sx={{ fontSize: 13 }}>Probá cambiando filtros o refrescando.</Typography>
            </Box>
          )}
        </Stack>
      ) : (
        <Box
          sx={{
            height: 660,
            width: "100%",
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <DataGrid
            rows={filtered}
            columns={columns}
            disableRowSelectionOnClick
            getRowId={(r) => r.id}
          />
        </Box>
      )}
    </Box>
  );
}