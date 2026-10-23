// The parts of Cloudflare's Turnstile script this uses.
interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      execution: "execute";
      appearance: "interaction-only";
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
    },
  ): string;
  execute(widget: string): void;
  reset(widget: string): void;
  remove(widget: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const script =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading: Promise<TurnstileApi> | undefined;

/** Cloudflare's script, added to the page the first time it's needed. */
function load(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = script;
    tag.async = true;
    tag.onload = () =>
      window.turnstile
        ? resolve(window.turnstile)
        : reject(new Error("Turnstile didn't load"));
    tag.onerror = () => {
      loading = undefined;
      reject(new Error("Turnstile didn't load"));
    };
    document.head.append(tag);
  });
  return loading;
}

/**
 * A Turnstile widget in `container`, out of sight unless Cloudflare needs
 * the person to do something. A token is good for one question, so each
 * one asks for a new token.
 */
export function createTurnstile(siteKey: string, container: HTMLElement) {
  let api: TurnstileApi | undefined;
  let widget: string | undefined;
  let waiting:
    | { resolve: (token: string) => void; reject: (error: Error) => void }
    | undefined;

  const settle = (token: string | undefined) => {
    const current = waiting;
    waiting = undefined;
    if (!current) return;
    if (token) current.resolve(token);
    else current.reject(new Error("Turnstile failed"));
  };

  return {
    async token(): Promise<string> {
      api ??= await load();
      if (!widget) {
        widget = api.render(container, {
          sitekey: siteKey,
          execution: "execute",
          appearance: "interaction-only",
          callback: (token) => settle(token),
          "error-callback": () => settle(undefined),
          "expired-callback": () => settle(undefined),
        });
      } else {
        api.reset(widget);
      }
      const token = new Promise<string>((resolve, reject) => {
        waiting = { resolve, reject };
      });
      api.execute(widget);
      return token;
    },
    remove() {
      if (api && widget) api.remove(widget);
      widget = undefined;
      settle(undefined);
    },
  };
}
