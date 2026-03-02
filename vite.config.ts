// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    // ✅ Sentry sourcemaps upload (solo si están las env vars)
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,

      // Si tu build output es "dist" (Vite default)
      sourcemaps: {
        assets: "./dist/**",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },

  // ✅ necesario para sourcemaps correctos
  build: {
    sourcemap: true,
  },
});