import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from "react-router-dom";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // ✅ Si no está configurado, no rompe ni dev ni prod
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,

    integrations: [
      // ✅ React Router v6/v7
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
    ],

    tracesSampleRate: 0.2,
  });
}

export { Sentry };