// Client-safe launcher URLs. The launcher is the source of truth for users,
// roles and app access; this app only links back to it.
export const LAUNCHER_URL = (
  process.env.NEXT_PUBLIC_LAUNCHER_URL || "https://bbd-launcher.vercel.app"
).replace(/\/+$/, "");

export const LAUNCHER_DASHBOARD_URL = `${LAUNCHER_URL}/dashboard`;
export const LAUNCHER_USERS_URL = `${LAUNCHER_URL}/admin/users`;
