// The Ask AI panel is on in a build that's told where the ask service is,
// by variables Next writes into the pages, as it does for telemetry. A
// build made with pnpm build doesn't have them, so the panel isn't there:
// one on your machine, and the tests'. apps/Dockerfile passes them on from
// its build arguments, and apps/ask/README.md says what the service needs.
//
//   NEXT_PUBLIC_ASK_ENDPOINT          the service, such as /api/ask
//   NEXT_PUBLIC_TURNSTILE_SITE_KEY    Turnstile's site key, to check for a person
//   NEXT_PUBLIC_ASK_REGION            where Azure OpenAI answers from, for the note
//
// apps/docs/lib/ask.ts is the same file.
export const ask = {
  endpoint: process.env.NEXT_PUBLIC_ASK_ENDPOINT || undefined,
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined,
  region: process.env.NEXT_PUBLIC_ASK_REGION || undefined,
};

/** The panel's button, the same on both apps. */
export const askTrigger = "nuv-button nuv-button--secondary nuv-button--sm";
