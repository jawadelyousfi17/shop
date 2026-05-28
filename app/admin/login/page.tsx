import { LoginForm } from "./login-form";

type SearchParams = Promise<{ next?: string; error?: string }>;

export const metadata = { title: "Admin login" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next, error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-6">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Admin login</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Sign in to manage the store.
        </p>
        {error === "not_admin" && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            That account is not authorized.
          </p>
        )}
        <div className="mt-6">
          <LoginForm next={next ?? "/admin"} />
        </div>
      </div>
    </main>
  );
}
