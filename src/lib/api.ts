/**
 * API utility for Tauri/web compatibility
 * 
 * In development and web production: uses relative URLs (/api/...)
 * In Tauri production: uses absolute URLs to Vercel backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export function getApiUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

/**
 * Fetch wrapper that uses the correct API base URL
 */
export async function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(getApiUrl(path), options);
}
