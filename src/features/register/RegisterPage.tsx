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
  Stack,
  Divider,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import { auth, functions } from "../../services/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import HotelLoading from "../../components/HotelLoading";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function validatePasswordStrong(pass: string) {
  const errors: string[] = [];
  if (pass.length < 10) errors.push("minLength");
  if (!/[A-Z]/.test(pass)) errors.push("upper");
  if (!/[a-z]/.test(pass)) errors.push("lower");
  if (!/[0-9]/.test(pass)) errors.push("number");
  if (!/[^\w\s]/.test(pass)) errors.push("symbol");
  return errors;
}

function normalizeCallableError(err: any) {
  const code = String(err?.code || ""); // functions/permission-denied, etc
  const message = String(err?.message || ""); // INVITE_NOT_FOUND, etc
  const details = err?.details ? String(err.details) : "";
  return { code, message, details };
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Step 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Step 2
  const [inviteCode, setInviteCode] = useState("");
  const [hostelName, setHostelName] = useState("");
  const [hostelSlug, setHostelSlug] = useState("");

  const [createdUser, setCreatedUser] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const normalizedSlug = useMemo(() => slugify(hostelSlug), [hostelSlug]);

  const effectiveUser = auth.currentUser ?? createdUser;
  const step: 1 | 2 = effectiveUser ? 2 : 1;

  useEffect(() => {
    if (auth.currentUser && !createdUser) setCreatedUser(auth.currentUser);
  }, [createdUser]);

  const passwordErrors = useMemo(() => validatePasswordStrong(password), [password]);
  const passwordOk = passwordErrors.length === 0;

  const passwordHelper = useMemo(() => {
    if (!password) return t("register.password.help");
    if (passwordOk) return t("register.password.ok");
    const parts = passwordErrors.map((k) => t(`register.password.rules.${k}`));
    return parts.join(" · ");
  }, [password, passwordOk, passwordErrors, t]);

  // ✅ contactos (cambiá a lo tuyo)
  const SUPPORT_EMAIL = "santiagocastro.sac@gmail.com";
  const WHATSAPP_E164 = "54911XXXXXXXX"; // <-- PONÉ TU NÚMERO EN FORMATO E164 (Argentina ej: 54911...)
  const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(
    "Hola! Quiero activar mi hostel en Hostly. ¿Me pasan un código de activación (invite)?"
  )}`;

  const copyText = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      setMessage({ type: "success", text: "Copiado al portapapeles." });
    } catch {
      setMessage({ type: "error", text: "No se pudo copiar. Copialo manualmente." });
    }
  };

  const handleCreateAccount = async () => {
    if (loading) return;
    setMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password;

    if (!cleanEmail) return setMessage({ type: "error", text: t("register.errors.emailRequired") });
    if (!passwordOk) return setMessage({ type: "error", text: t("register.errors.passwordWeak") });

    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
      setCreatedUser(cred.user);
      await cred.user.getIdToken();
      setMessage({ type: "success", text: t("register.messages.accountCreated") });
    } catch (err: any) {
      console.error("REGISTER ERROR =>", err);
      if (err?.code === "auth/email-already-in-use") setMessage({ type: "error", text: t("register.errors.emailInUse") });
      else if (err?.code === "auth/invalid-email") setMessage({ type: "error", text: t("register.errors.emailInvalid") });
      else if (err?.code === "auth/weak-password") setMessage({ type: "error", text: t("register.errors.passwordWeak") });
      else setMessage({ type: "error", text: err?.code ? t("register.errors.genericWithCode", { code: err.code }) : t("register.errors.generic") });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHostel = async () => {
    if (loading) return;
    setMessage(null);

    const current = auth.currentUser ?? createdUser;
    await current?.getIdToken(true);
    if (!current) return setMessage({ type: "error", text: t("register.errors.sessionUnavailable") });

    if (!inviteCode.trim()) {
      return setMessage({
        type: "error",
        text: "Necesitás un código de activación para crear tu hostel.",
      });
    }

    if (!hostelName.trim()) return setMessage({ type: "error", text: t("register.errors.hostelNameRequired") });
    if (!normalizedSlug) return setMessage({ type: "error", text: t("register.errors.slugInvalid") });

    try {
      setLoading(true);

      const createHostel = httpsCallable(functions, "createHostel");
      await createHostel({
        name: hostelName.trim(),
        slug: normalizedSlug,
        inviteCode: inviteCode.trim().toUpperCase(),
      });

      await current.getIdToken(true);

      setMessage({ type: "success", text: t("register.messages.hostelCreatedRedirecting") });
      navigate(`/${normalizedSlug}/admin`, { replace: true });
    } catch (err: any) {
      console.error("CREATE HOSTEL ERROR =>", err);
      setCreatedUser(auth.currentUser ?? createdUser);

      const e = normalizeCallableError(err);
      const msg = `${e.message || ""}`.trim();

      // ✅ Primero: reconocer por message (lo más útil si vos mandás INVITE_* desde backend)
      if (msg === "INVITE_REQUIRED") {
        setMessage({ type: "error", text: "Necesitás un código de activación para crear tu hostel." });
        return;
      }
      if (msg === "INVITE_NOT_FOUND") {
        setMessage({
          type: "error",
          text: "Ese código no existe. Si querés activar tu hostel en Hostly, escribinos y te ayudamos.",
        });
        return;
      }
      if (msg === "INVITE_INACTIVE") {
        setMessage({
          type: "error",
          text: "Ese código está inactivo. Si te lo pasaron, pedí uno nuevo por WhatsApp o email.",
        });
        return;
      }
      if (msg === "INVITE_USED") {
        setMessage({
          type: "error",
          text: "Ese código ya fue usado. Escribinos y te generamos uno nuevo.",
        });
        return;
      }
      if (msg === "USER_ALREADY_HAS_HOSTEL") {
        setMessage({
          type: "error",
          text: "Tu usuario ya tiene un hostel asociado. Si necesitás otro, escribinos.",
        });
        return;
      }
      if (msg === "SLUG_TAKEN") {
        setMessage({ type: "error", text: t("register.errors.slugTaken") });
        return;
      }

      // ✅ fallback por err.code
      if (e.code === "functions/permission-denied") {
        setMessage({ type: "error", text: "No autorizado. Necesitás un código válido para activar tu hostel." });
      } else if (e.code === "functions/not-found") {
        setMessage({ type: "error", text: "El código no existe." });
      } else if (e.code === "functions/already-exists") {
        setMessage({ type: "error", text: "Ese código ya fue usado." });
      } else if (e.code === "functions/failed-precondition") {
        setMessage({ type: "error", text: "Ese código está inactivo." });
      } else {
        setMessage({ type: "error", text: t("register.errors.hostelCreateGeneric") });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <HotelLoading text={step === 1 ? t("register.loading.creatingAccount") : t("register.loading.creatingHostel")} />;
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
        <Chip label={t("register.steps.account")} color={step === 1 ? "primary" : "default"} variant={step === 1 ? "filled" : "outlined"} />
        <Chip label={t("register.steps.hostel")} color={step === 2 ? "primary" : "default"} variant={step === 2 ? "filled" : "outlined"} />
      </Box>

      {message && (
        <Alert sx={{ mt: 2 }} severity={message.type}>
          {message.text}
        </Alert>
      )}

      <Collapse in={step === 1}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 3 }} onKeyDown={(e) => e.key === "Enter" && handleCreateAccount()}>
          <TextField label={t("register.fields.email")} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />

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
                  <IconButton aria-label={showPass ? t("common.hidePassword") : t("common.showPassword")} onClick={() => setShowPass((s) => !s)} edge="end">
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
            {t("register.messages.accountCreatedLabel")} <b>{(auth.currentUser?.email ?? email).trim().toLowerCase()}</b>
          </Alert>

          <Alert severity="info" sx={{ mb: 2 }}>
            Para activar tu hostel necesitás un <b>código de activación</b>.
          </Alert>

          {/* ✅ CTA de venta/soporte */}
          <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
              ¿No tenés código?
            </Typography>
            <Typography sx={{ opacity: 0.8, mb: 1.5 }}>
              Si querés tener tu hostel en Hostly, escribinos y te lo activamos.
            </Typography>

            <Stack spacing={1}>
              <Button
                component="a"
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                variant="contained"
              >
                Escribir por WhatsApp
              </Button>

              <Button variant="outlined" onClick={() => copyText(SUPPORT_EMAIL)}>
                Copiar email de soporte
              </Button>

              <Divider />

              <Typography sx={{ fontSize: 13, opacity: 0.75 }}>
                Email: <b>{SUPPORT_EMAIL}</b>
              </Typography>
              <Typography sx={{ fontSize: 13, opacity: 0.75 }}>
                WhatsApp: <b>{WHATSAPP_E164}</b>
              </Typography>
            </Stack>
          </Paper>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }} onKeyDown={(e) => e.key === "Enter" && handleCreateHostel()}>
            <TextField
              label="Código de activación"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Ej: S85BD2B3GX"
            />

            <TextField label={t("register.fields.hostelName")} value={hostelName} onChange={(e) => setHostelName(e.target.value)} />

            <TextField
              label={t("register.fields.slug")}
              value={hostelSlug}
              onChange={(e) => setHostelSlug(e.target.value)}
              helperText={normalizedSlug ? t("register.helpers.yourUrl", { slug: normalizedSlug }) : t("register.helpers.slugExample")}
            />

            <Button variant="contained" onClick={handleCreateHostel} disabled={!inviteCode.trim() || !hostelName.trim() || !normalizedSlug}>
              {t("register.actions.createHostel")}
            </Button>
          </Box>
        </Paper>
      </Collapse>
    </Container>
  );
}