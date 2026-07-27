"use client";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function csrfToken() {
  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("XSRF-TOKEN="));

  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export async function getCsrfCookie() {
  const response = await fetch("/sanctum/csrf-cookie", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new ApiError("تعذّر بدء جلسة آمنة.", response.status);
  }
}

export async function apiClient<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const token = csrfToken();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("X-XSRF-TOKEN", token);
  }

  const response = await fetch(path, {
    ...init,
    body: init.json === undefined ? init.body : JSON.stringify(init.json),
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      errors?: Record<string, string[]>;
    };

    throw new ApiError(
      payload.message ?? "حدث خطأ غير متوقع. حاول مرة أخرى.",
      response.status,
      payload.errors,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
