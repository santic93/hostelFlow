import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
import { Container, Typography, TextField, Button, Alert, Stack } from "@mui/material";
import { signInWithEmailAndPassword, } from "firebase/auth";
import { auth } from "../../services/firebase";
import { Seo } from "../../components/Seo";
import { useTranslation } from "react-i18next";


export default function LoginPage() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("forbidden") === "1") {
      setMsg({ type: "error", text: t("login.errors.noAdminPermissions") });
    }
  }, [searchParams, t]);

  const handleLogin = async () => {
    setMsg(null);

    if (!email.trim()) {
      return setMsg({ type: "error", text: t("login.errors.emailRequired") });
    }

    if (password.length < 6) {
      return setMsg({ type: "error", text: t("login.errors.passwordMin") });
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      navigate("/admin", { replace: true });
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
      <Seo
        title={t("login.seoTitle")}
        description={t("login.seoDescription")}
        noindex
      />

      <Container sx={{ py: 12, maxWidth: 420 }}>
        <Typography variant="h4" gutterBottom>
          {t("login.title")}
        </Typography>

        {msg && (
          <Alert sx={{ mt: 2 }} severity={msg.type}>
            {msg.text}
          </Alert>
        )}

        <Stack spacing={2.5} sx={{ mt: 3 }}>
          <TextField
            label={t("login.fields.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label={t("login.fields.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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