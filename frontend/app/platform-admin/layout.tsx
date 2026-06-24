import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  const userCookie = cookieStore.get("user")?.value;

  if (!token || !userCookie) redirect("/login");

  let user: any = {};
  try {
    user = JSON.parse(userCookie);
    if (user.role !== 'PLATFORM_ADMIN') redirect("/login");
  } catch (e) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white font-sans selection:bg-indigo-500/30">
      <div className="w-64 border-r border-zinc-800/50 bg-zinc-900/50 flex flex-col backdrop-blur-xl">
        <div className="p-6 border-b border-zinc-800/50">
          <h1 className="text-2xl font-bold bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">Platform Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/platform-admin" className="block px-4 py-2.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-all text-sm font-medium">Tenants</Link>
          <Link href="/platform-admin/create" className="block px-4 py-2.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-all text-sm font-medium">Create Tenant</Link>
        </nav>
        <div className="p-4 border-t border-zinc-800/50">
          <form action={async () => { "use server"; cookies().delete("token"); cookies().delete("user"); redirect("/login"); }}>
            <button type="submit" className="w-full px-4 py-2 text-left rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium">Sign Out</button>
          </form>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
