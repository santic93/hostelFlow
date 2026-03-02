// functions/src/monitoring/sentry.ts
import * as Sentry from "@sentry/node";
import { defineSecret } from "firebase-functions/params";

export const SENTRY_DSN = defineSecret("SENTRY_DSN");

let initialized = false;

/**
 * ✅ IMPORTANTE:
 * - NO llames SENTRY_DSN.value() en top-level
 * - Solo dentro de runtime (en una function)
 */
export function initSentryOnce() {
  if (initialized) return;

  const dsn = SENTRY_DSN.value(); // ✅ Solo disponible en runtime
  if (!dsn) {
    console.warn("[SENTRY] SENTRY_DSN vacío. Sentry desactivado.");
    initialized = true;
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
  });

  initialized = true;
  console.log("[SENTRY] initialized");
}

export function captureToSentry(
  err: any,
  context: { rid: string; fn: string; extra?: Record<string, any> }
) {
  try {
    initSentryOnce();

    Sentry.withScope((scope) => {
      scope.setTag("fn", context.fn);
      scope.setTag("rid", context.rid);

      if (context.extra) scope.setContext("extra", context.extra);

      scope.setContext("error", {
        message: err?.message,
        code: err?.code,
        stack: err?.stack,
      });

      Sentry.captureException(err);
    });
  } catch (e) {
    console.warn("[SENTRY] capture failed", e);
  }
}