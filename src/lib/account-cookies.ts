// Customer sign-in cookies (website). The token is httpOnly; the profile cookie only carries the
// first name so the header can greet the customer without making every page dynamic.

export const SESSION_COOKIE = 'tahrio_session';
export const PROFILE_COOKIE = 'tahrio_user';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // matches the API token (30 days)

export function readProfileCookie(cookieHeader: string): { name: string } | null {
  const raw = cookieHeader
    .split('; ')
    .find((c) => c.startsWith(`${PROFILE_COOKIE}=`))
    ?.slice(PROFILE_COOKIE.length + 1);
  if (!raw) return null;
  try {
    const v = JSON.parse(decodeURIComponent(raw)) as { name?: unknown };
    return typeof v.name === 'string' && v.name ? { name: v.name } : null;
  } catch {
    return null;
  }
}
