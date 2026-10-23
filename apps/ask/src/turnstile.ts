const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Whether Cloudflare says the token the panel sent came from a person who
 * passed Turnstile just now. A token is good once, so a question is
 * checked once. Anything that isn't a clear yes is a no.
 */
export async function verifyTurnstile({
  secret,
  token,
  remoteIp,
  signal,
  fetch = globalThis.fetch,
}: {
  secret: string;
  token: string;
  remoteIp?: string;
  signal?: AbortSignal;
  fetch?: typeof globalThis.fetch;
}): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);
  try {
    const response = await fetch(verifyUrl, { method: "POST", body, signal });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: unknown };
    return result.success === true;
  } catch {
    return false;
  }
}
