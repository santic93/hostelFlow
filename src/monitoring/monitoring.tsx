import * as Sentry from "@sentry/react";
import { browserTracingIntegration } from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) return; // no rompe dev si no está configurado

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    integrations: [browserTracingIntegration()],
    tracesSampleRate: 0.2,
  });
}

export { Sentry };