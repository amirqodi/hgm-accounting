import { NextRequest, NextResponse } from "next/server";

/**
 * Generic proxy handler
 * @param req NextRequest
 * @param path API endpoint in Go backend (e.g. "/api/price")
 * @param options fetch options (method, body, etc.)
 */
export async function proxy(
  req: NextRequest,
  path: string,
  options: RequestInit = {}
) {
  const token = req.cookies.get("auth_token")?.value;

  const res = await fetch(`${process.env.API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  // اگر توکن معتبر نباشه
  if (res.status === 401) {
    // می‌تونی اینجا مستقیم redirect کنی یا خطا بدی
    const url = req.nextUrl.clone();
    url.pathname = "/auth";

    // کوکی رو هم پاک می‌کنیم
    const response = NextResponse.redirect(url);
    response.cookies.delete("auth_token");
    return response;
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
