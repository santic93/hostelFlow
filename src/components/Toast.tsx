import { Alert, Snackbar } from "@mui/material";

type ToastState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
};

type Props = {
  state: ToastState;
  onClose: () => void;
};

export function Toast({ state, onClose }: Props) {
  return (
    <Snackbar
      open={state.open}
      autoHideDuration={3200}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        onClose={onClose}
        severity={state.severity}
        variant="filled"
        sx={{
          borderRadius: 3,
          boxShadow: "0 16px 40px rgba(0,0,0,0.20)",
          alignItems: "center",
        }}
      >
        {state.message}
      </Alert>
    </Snackbar>
  );
}