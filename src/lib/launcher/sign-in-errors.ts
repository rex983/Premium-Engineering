// Messages for the ?error= codes set by the signIn callback in src/auth.ts.
const MESSAGES: Record<string, string> = {
  NoAppAccess:
    "You don't have access to Premium Engineering in the launcher. Ask an admin to grant it in the BBD Launcher.",
  LauncherUnavailable:
    "Couldn't confirm your Premium Engineering access with the launcher. Please try again in a moment.",
  ViewAsDenied:
    "\"View as\" is only available to active launcher admins.",
  AccessDenied:
    "Your account isn't active in the BBD Launcher, or isn't allowed to sign in here.",
};

export function signInErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return MESSAGES[code] ?? "Sign-in failed. Please try again from the launcher.";
}
