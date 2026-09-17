/** Shared site constants for the Forge of Traders Next.js clone. */
export const site = {
  name: "Forge of Traders",
  port: 3013,
  liveUrl: "https://forgeoftraders.com",
} as const;

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `http://localhost:${site.port}${normalized}`;
}
