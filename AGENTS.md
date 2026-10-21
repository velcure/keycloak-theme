# Working in this repository

- Use Biome; do not add ESLint or Prettier.
- Use the existing Velcure Nah + Fokus assets and petrol/mint tokens.
- Keycloak is the SSR authentication runtime. Astro is the SSR review studio. Do not replace authentication with a client-side simulation.
- Keep native form actions, input names, sanitization and WebAuthn/OTP scripts intact.
- Add new layouts to the shared native template and CSS. Verify both the isolated render and real Keycloak when changing authentication markup.
- Keep email HTML and plain text usable. No tracking pixels, external fonts or JavaScript in emails.
- Treat `vendor/keycloak` as an unmodified, versioned upstream reference. Keep licenses.
- Keep the Core and marketing repositories read-only during this task.
- Before committing: `pnpm render`, `pnpm check`, `pnpm build`, `pnpm build:theme`.
- Keep the working tree clean after delivery. Never commit generated previews, dependencies, credentials, caches or browser test output. The documented local fixture credentials are disposable test data only.
- Dependabot cadence is monthly. No automatic dependency merges or production rollout.
