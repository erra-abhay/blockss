import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  const userCookie = cookieStore.get("user")?.value;

  if (!token || !userCookie) {
    redirect("/login");
  }

  let user: any = {};
  try {
    user = JSON.parse(userCookie);
  } catch (e) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800/50 bg-zinc-900/50 flex flex-col backdrop-blur-xl">
        <div className="p-6 border-b border-zinc-800/50">
          <h1 className="text-2xl font-bold bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
            CertPlatform
          </h1>
          <div className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/50">
            Tenant: {user.tenantSlug}
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard" className="block px-4 py-2.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-all text-sm font-medium">Overview</Link>
          <Link href="/dashboard/issue" className="block px-4 py-2.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-all text-sm font-medium">Issue Certificate</Link>
          <Link href="/dashboard/batch" className="block px-4 py-2.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-all text-sm font-medium">Batch Upload</Link>
          <Link href="/dashboard/certificates" className="block px-4 py-2.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-all text-sm font-medium">All Certificates</Link>
          <Link href="/dashboard/templates" className="block px-4 py-2.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-all text-sm font-medium">Templates</Link>
          <Link href="/dashboard/settings" className="block px-4 py-2.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-all text-sm font-medium">Settings</Link>
        </nav>
        <div className="p-4 border-t border-zinc-800/50">
          <form action={async () => { 
            "use server"; 
            cookies().delete("token"); 
            cookies().delete("user"); 
            redirect("/login"); 
          }}>
            <button type="submit" className="w-full px-4 py-2 text-left rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium">Sign Out</button>
          </form>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950">
        <header className="h-16 border-b border-zinc-800/50 flex items-center px-8 bg-zinc-900/30 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-sm font-medium text-zinc-400">Dashboard</h2>
          <div className="ml-auto flex items-center space-x-3">
            <div className="text-sm text-zinc-400 text-right">
              <div className="text-white font-medium">{user.name}</div>
              <div className="text-xs">{user.role}</div>
            </div>
            <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              {user.name?.[0] || 'A'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
