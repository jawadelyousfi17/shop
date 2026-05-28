import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet) {
          toSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl;
  const isAdminRoute = url.pathname.startsWith("/admin") &&
    url.pathname !== "/admin/login";

  if (isAdminRoute) {
    if (!user) {
      const redirectUrl = url.clone();
      redirectUrl.pathname = "/admin/login";
      redirectUrl.searchParams.set("next", url.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    if (user.email !== process.env.ADMIN_EMAIL) {
      const redirectUrl = url.clone();
      redirectUrl.pathname = "/admin/login";
      redirectUrl.searchParams.set("error", "not_admin");
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
