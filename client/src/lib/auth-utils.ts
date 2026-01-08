export function isUnauthorizedError(error: Error): boolean {
  // In local dev, never treat errors as auth failures
  if (import.meta.env.DEV) return false;

  return /^401: .*Unauthorized/.test(error.message);
}

export function redirectToLogin(
  toast?: (options: {
    title: string;
    description: string;
    variant: string;
  }) => void
) {
  // Do nothing in local development
  if (import.meta.env.DEV) {
    console.warn("Auth redirect skipped in development");
    return;
  }

  if (toast) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
  }

  setTimeout(() => {
    window.location.href = "/api/login";
  }, 500);
}
