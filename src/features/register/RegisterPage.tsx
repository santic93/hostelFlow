import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Container,
  Paper,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import { auth, functions } from "../../services/firebase"; // ajustá path si difiere
import { createUserWithEmailAndPassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import HotelLoading from "../../components/HotelLoading"; // ajustá path si difiere

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function validatePasswordStrong(pass: string) {
  // Reglas: 10+ chars, 1 mayus, 1 minus, 1 numero, 1 simbolo
  const errors: string[] = [];
  if (pass.length < 10) errors.push("minLength");
  if (!/[A-Z]/.test(pass)) errors.push("upper");
  if (!/[a-z]/.test(pass)) errors.push("lower");
  if (!/[0-9]/.test(pass)) errors.push("number");
  if (!/[^\w\s]/.test(pass)) errors.push("symbol"); // simbolo
  return errors;
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Step 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Step 2
  const [hostelName, setHostelName] = useState("");
  const [hostelSlug, setHostelSlug] = useState("");

  const [createdUser, setCreatedUser] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const normalizedSlug = useMemo(() => slugify(hostelSlug), [hostelSlug]);

  // ✅ fuente de verdad del flujo
  const effectiveUser = auth.currentUser ?? createdUser;
  const step: 1 | 2 = effectiveUser ? 2 : 1;

  // ✅ si Auth se actualiza después, sincronizamos createdUser
  useEffect(() => {
    if (auth.currentUser && !createdUser) {
      setCreatedUser(auth.currentUser);
    }
  }, [createdUser]);

  const passwordErrors = useMemo(() => validatePasswordStrong(password), [password]);
  const passwordOk = passwordErrors.length === 0;

  const passwordHelper = useMemo(() => {
    if (!password) return t("register.password.help");
    if (passwordOk) return t("register.password.ok");
    // mostrar 1 sola línea con bullets (más limpio)
    const parts = passwordErrors.map((k) => t(`register.password.rules.${k}`));
    return parts.join(" · ");
  }, [password, passwordOk, passwordErrors, t]);

  const handleCreateAccount = async () => {
    if (loading) return;
    setMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password;

    if (!cleanEmail) return setMessage({ type: "error", text: t("register.errors.emailRequired") });

    // 🔒 nuevo: password fuerte
    if (!passwordOk) {
      return setMessage({ type: "error", text: t("register.errors.passwordWeak") });
    }

    try {
      setLoading(true);

      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);

      setCreatedUser(cred.user);
      await cred.user.getIdToken();

      setMessage({ type: "success", text: t("register.messages.accountCreated") });
    } catch (err: any) {
      console.error("REGISTER ERROR =>", err);

      if (err?.code === "auth/email-already-in-use") {
        setMessage({ type: "error", text: t("register.errors.emailInUse") });
      } else if (err?.code === "auth/invalid-email") {
        setMessage({ type: "error", text: t("register.errors.emailInvalid") });
      } else if (err?.code === "auth/weak-password") {
        // por si Firebase lo detecta también
        setMessage({ type: "error", text: t("register.errors.passwordWeak") });
      } else {
        setMessage({
          type: "error",
          text: err?.code ? t("register.errors.genericWithCode", { code: err.code }) : t("register.errors.generic"),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHostel = async () => {
    if (loading) return;
    setMessage(null);

    const current = auth.currentUser ?? createdUser;
    await (auth.currentUser ?? createdUser)?.getIdToken(true);
    if (!current) return setMessage({ type: "error", text: t("register.errors.sessionUnavailable") });

    if (!hostelName.trim()) return setMessage({ type: "error", text: t("register.errors.hostelNameRequired") });
    if (!normalizedSlug) return setMessage({ type: "error", text: t("register.errors.slugInvalid") });

    try {
      setLoading(true);

      const createHostel = httpsCallable(functions, "createHostel");

      await createHostel({
        name: hostelName.trim(),
        slug: normalizedSlug,
      });

      setMessage({ type: "success", text: t("register.messages.hostelCreatedRedirecting") });
      navigate(`/${normalizedSlug}/admin`, { replace: true });
    } catch (err: any) {
      console.error(err);

      setCreatedUser(auth.currentUser ?? createdUser);

      if (err?.code === "functions/already-exists" || err?.message === "SLUG_TAKEN") {
        setMessage({ type: "error", text: t("register.errors.slugTaken") });
      } else {
        setMessage({ type: "error", text: t("register.errors.hostelCreateGeneric") });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <HotelLoading
        text={step === 1 ? t("register.loading.creatingAccount") : t("register.loading.creatingHostel")}
      />
    );
  }

  return (
    <Container sx={{ py: 12, maxWidth: 520 }}>
      <Button component={RouterLink} to="/login" variant="text">
        {t("register.haveAccount")}
      </Button>

      <Typography variant="h4" gutterBottom>
        {step === 1 ? t("register.title.step1") : t("register.title.step2")}
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <Chip
          label={t("register.steps.account")}
          color={step === 1 ? "primary" : "default"}
          variant={step === 1 ? "filled" : "outlined"}
        />
        <Chip
          label={t("register.steps.hostel")}
          color={step === 2 ? "primary" : "default"}
          variant={step === 2 ? "filled" : "outlined"}
        />
      </Box>

      {message && (
        <Alert sx={{ mt: 2 }} severity={message.type}>
          {message.text}
        </Alert>
      )}

      <Collapse in={step === 1}>
        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 3 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateAccount();
          }}
        >
          <TextField
            label={t("register.fields.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
          />

          <TextField
            label={t("register.fields.password")}
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            helperText={passwordHelper}
            error={Boolean(password) && !passwordOk}
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

          <Button variant="contained" onClick={handleCreateAccount} disabled={!email.trim() || !passwordOk}>
            {t("register.actions.continue")}
          </Button>
        </Box>
      </Collapse>

      <Collapse in={step === 2}>
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            {t("register.messages.accountCreatedLabel")}{" "}
            <b>{(auth.currentUser?.email ?? email).trim().toLowerCase()}</b>
          </Alert>

          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateHostel();
            }}
          >
            <TextField
              label={t("register.fields.hostelName")}
              value={hostelName}
              onChange={(e) => setHostelName(e.target.value)}
            />

            <TextField
              label={t("register.fields.slug")}
              value={hostelSlug}
              onChange={(e) => setHostelSlug(e.target.value)}
              helperText={
                normalizedSlug
                  ? t("register.helpers.yourUrl", { slug: normalizedSlug })
                  : t("register.helpers.slugExample")
              }
            />

            <Button
              variant="contained"
              onClick={handleCreateHostel}
              disabled={!hostelName.trim() || !normalizedSlug}
            >
              {t("register.actions.createHostel")}
            </Button>
          </Box>
        </Paper>
      </Collapse>
    </Container>
  );
}