import "server-only";

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8000";

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`EduStep API request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
