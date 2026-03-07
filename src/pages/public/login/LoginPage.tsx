import { useEffect, useState } from "react";
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "../../../app/providers/AuthContext";
import { auth } from "../../../services/firebase";
import { Seo } from "../../../components/Seo";


export default function LoginPage() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const { isSuperAdmin } = useAuth();

  useEffect(() => {
    if (searchParams.get("forbidden") === "1") {
      setMsg({ type: "error", text: t("login.errors.noAdminPermissions") });
    }
  }, [searchParams, t]);

  const handleLogin = async () => {
    if (loading) return;
    setMsg(null);

    if (!email.trim()) {
      return setMsg({ type: "error", text: t("login.errors.emailRequired") });
    }

    if (password.length < 6) {
      return setMsg({ type: "error", text: t("login.errors.passwordMin") });
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);

      // ✅ refrescar token para traer claims recién seteados
      await auth.currentUser?.getIdToken(true);

      // ✅ 1) si venías redirigido desde una ruta protegida (superadmin, etc), volvés ahí
      const fromPath =
        (location.state as any)?.from?.pathname ||
        (location.state as any)?.from ||
        null;

      if (fromPath) {
        navigate(fromPath, { replace: true });
        return;
      }

      // ✅ 2) si no venías de ningún lado: si sos superadmin → panel superadmin
      // Nota: isSuperAdmin puede tardar 1 tick; por eso también usamos claims directas si hace falta
      const token = await auth.currentUser?.getIdTokenResult?.();
      const role = String((token?.claims as any)?.role || "");
      const superadmin = role === "superadmin" || isSuperAdmin;

      if (superadmin) {
        navigate("/superadmin/invites", { replace: true });
      } else {
        navigate("/admin", { replace: true });
      }
    } catch (err: any) {
      console.error("LOGIN ERROR =>", err);

      const code = err?.code || "";

      const text =
        code === "auth/invalid-credential"
          ? t("login.errors.invalidCredentials")
          : code === "auth/user-not-found"
          ? t("login.errors.userNotFound")
          : code === "auth/wrong-password"
          ? t("login.errors.wrongPassword")
          : code
          ? t("login.errors.genericWithCode", { code })
          : t("login.errors.generic");

      setMsg({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title={t("login.seoTitle")} description={t("login.seoDescription")} noindex />

      <Container sx={{ py: 12, maxWidth: 420 }}>
        <Typography variant="h4" gutterBottom>
          {t("login.title")}
        </Typography>

        {msg && (
          <Alert sx={{ mt: 2 }} severity={msg.type}>
            {msg.text}
          </Alert>
        )}

        <Stack
          spacing={2.5}
          sx={{ mt: 3 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
        >
          <TextField
            label={t("login.fields.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label={t("login.fields.password")}
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPass ? t("common.hidePassword") : t("common.showPassword")}
                    onClick={() => setShowPass((s) => !s)}
                    edge="end"
                  >
                    {showPass ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button variant="contained" onClick={handleLogin} disabled={loading}>
            {loading ? t("login.actions.loggingIn") : t("login.actions.login")}
          </Button>

          <Button component={RouterLink} to="/forgot-password" variant="text" disabled={loading}>
            {t("login.actions.forgotPassword")}
          </Button>

          <Button component={RouterLink} to="/register" variant="outlined">
            {t("login.actions.createHostel")}
          </Button>
        </Stack>
      </Container>
    </>
  );
}