export function getBackendUrl(): string {
  return import.meta.env.VITE_BACKEND_URL || ""
}
