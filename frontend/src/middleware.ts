// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;

  // اگر توکن نبود → بفرست به صفحه‌ی لاگین
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // ✅ اعتبارسنجی توکن از بک‌اند
  const isValid = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/verify-token`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  ).then((res) => res.ok);

  if (!isValid) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";

    const response = NextResponse.redirect(url);
    response.cookies.set("auth_token", "", { maxAge: -1 }); // پاک کردن کوکی

    return response;
  }

  return NextResponse.next();
}

// ✅ matcher: فقط روی صفحات اعمال بشه
export const config = {
  matcher: ["/((?!api|auth|_next|favicon.ico).*)"],
};
