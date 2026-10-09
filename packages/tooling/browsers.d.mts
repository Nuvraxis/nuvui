export const engines: string[];

export function askedBrowsers(): string[];

export function askedProjects<
  Project extends { use?: { defaultBrowserType?: string } },
>(projects: Project[]): Project[];
