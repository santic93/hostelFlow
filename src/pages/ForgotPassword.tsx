import { useState } from "react";
import { Alert, Box, Button, Container, TextField, Typography } from "@mui/material";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";



export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSend = async () => {
        setMsg(null);

        const trimmed = email.trim().toLowerCase();
        if (!trimmed || !trimmed.includes("@")) {
            setMsg({ type: "error", text: "Ingresá un email válido." });
            return;
        }

        try {
            setLoading(true);

            const auth = getAuth();
            await sendPasswordResetEmail(auth, email.trim().toLowerCase(), {
                url: "https://hostly-eight.vercel.app/reset-password",
                handleCodeInApp: true,
            });
            setMsg({
                type: "success",
                text: "Listo. Te enviamos un email para restablecer tu contraseña (revisá spam/promociones).",
            });
        } catch (e: any) {
            // No revelamos si el email existe o no (mejor práctica)
            setMsg({
                type: "success",
                text: "Si el email está registrado, vas a recibir un link para restablecer tu contraseña.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container sx={{ py: 10, maxWidth: 520 }}>
            <Typography variant="h4" gutterBottom>
                Olvidé mi contraseña
            </Typography>

            <Typography sx={{ color: "text.secondary", mb: 3 }}>
                Ingresá tu email y te enviamos un link para crear una nueva contraseña.
            </Typography>

            {msg && (
                <Alert severity={msg.type} sx={{ mb: 2 }}>
                    {msg.text}
                </Alert>
            )}

            <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                    fullWidth
                    label="Email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                    }}
                />
                <Button variant="contained" onClick={handleSend} disabled={loading}>
                    {loading ? "Enviando..." : "Enviar"}
                </Button>
            </Box>

            <Box sx={{ mt: 3 }}>
                <Button variant="text" onClick={() => navigate("/login")}>
                    Volver a login
                </Button>
            </Box>
        </Container>
    );
}