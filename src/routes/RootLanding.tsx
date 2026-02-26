import { Box, Button, Container, TextField, Typography, Alert } from "@mui/material";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { collection, getDocs, limit, query } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import HotelLoading from "../components/HotelLoading";


function extractTenantSlug(input: string) {
  const raw = input.trim();
  if (!raw) return "";

  // sacamos hash y query
  const noHash = raw.split("#")[0];
  const noQuery = noHash.split("?")[0];

  // si pega una URL completa, sacamos el dominio
  const noProtocol = noQuery.replace(/^https?:\/\//i, "");
  const parts = noProtocol.split("/").filter(Boolean);

  // Si parts[0] parece dominio (tiene punto), el slug del tenant es parts[1]
  // Si no hay dominio, el slug es parts[0]
  const candidate = (parts.length >= 2 && parts[0].includes("."))
    ? parts[1]
    : parts[0];

  return (candidate || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function RootRedirect() {
  const { user, role, hostelSlug, loading } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [slug, setSlug] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("recentTenants") || "[]");
    } catch {
      return [];
    }
  });
  if (loading) return <HotelLoading text="Cargando..." />;

  // admin logueado -> panel
  if (user && role === "admin" && hostelSlug) {
    return <Navigate to={`/${hostelSlug}/admin`} replace />;
  }

  const handleEnter = async () => {

    setError(null);

    const cleaned = extractTenantSlug(slug);
    if (!cleaned) {
      setError("Ingresá un slug válido. Ej: selina-palermo");
      return;
    }

    try {
      setChecking(true);
      const snap = await getDoc(doc(db, "hostels", cleaned));


      // ...

      if (!snap.exists()) {
        // Traemos algunos slugs existentes para sugerir (modo demo)
        const listSnap = await getDocs(query(collection(db, "hostels"), limit(20)));
        const all = listSnap.docs.map(d => d.id);

        // sugerencias: los más parecidos por "incluye" (simple y efectivo)
        const c = cleaned.toLowerCase();
        const close = all
          .filter(s => s.toLowerCase().includes(c.slice(0, 3))) // usa primeras 3 letras
          .slice(0, 5);

        setSuggestions(close);

        setError(`No encontramos el hostel "${cleaned}". ¿Quisiste decir alguno de estos?`);
        return;
      }

      // guardar reciente
      const next = [cleaned, ...recent.filter((x) => x !== cleaned)].slice(0, 6);
      setRecent(next);
      localStorage.setItem("recentTenants", JSON.stringify(next));

      navigate(`/${cleaned}`);
    } catch (e) {
      setError("Error verificando el hostel. Probá de nuevo.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Container sx={{ py: 12, maxWidth: 520 }}>
      <Typography variant="h3" gutterBottom>
        HOSTLY
      </Typography>
      <Typography sx={{ color: "text.secondary", mb: 3 }}>
        Ingresá el link del hostel (slug) para ver habitaciones y reservar.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {suggestions.length > 0 && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          {suggestions.map((s) => (
            <Button key={s} size="small" variant="outlined" onClick={() => {  
              setError(null);
              setSuggestions([]);
              const next = [s, ...recent.filter((x) => x !== s)].slice(0, 6);
              setRecent(next);
              localStorage.setItem("recentTenants", JSON.stringify(next));
              navigate(`/${s}`);
            }}>
              {s}
            </Button>
          ))}
        </Box>
      )}
      {recent.length > 0 && (
  <Box sx={{ mb: 2 }}>
    <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
      Recientes
    </Typography>
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      {recent.map((s) => (
        <Button
          key={s}
          size="small"
          variant="outlined"
          onClick={() => navigate(`/${s}`)}
        >
          {s}
        </Button>
      ))}
    </Box>
  </Box>
)}
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          fullWidth
          label="Hostel slug"
          placeholder="ej: selina-palermo"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleEnter();
          }}
        />
        <Button variant="contained" onClick={handleEnter} disabled={checking}>
          {checking ? "Verificando..." : "Entrar"}
        </Button>
      </Box>

      <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate("/login")}>
          Admin Login
        </Button>
        <Button variant="text" onClick={() => navigate("/register")}>
          Crear mi hostel
        </Button>
      </Box>
    </Container>
  );
}