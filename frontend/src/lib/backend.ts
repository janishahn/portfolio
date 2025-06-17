export function getBackendUrl(): string {
  // Server-side execution (Node.js)
  if (typeof window === "undefined") {
    return (
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://localhost:8012"
    );
  }

  // Client-side execution (browser). Use same-origin by default to avoid CORS.
  return process.env.NEXT_PUBLIC_BACKEND_URL || "";
} 