import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  const userCookie = cookieStore.get("user")?.value;

  if (!token || !userCookie) redirect("/login");

  let user: any = {};
  try {
    user = JSON.parse(userCookie);
    if (user.role !== 'STUDENT') redirect("/login");
  } catch (e) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white font-sans selection:bg-indigo-500/30">
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950">
        <header className="h-16 border-b border-zinc-800/50 flex items-center px-8 bg-zinc-900/30 backdrop-blur-md sticky top-0 z-10 justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent">Student Portal</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-zinc-400 text-right">
              <div className="text-white font-medium">{user.name}</div>
              <div className="text-xs">{user.tenantSlug}</div>
            </div>
            <form action={async () => { "use server"; cookies().delete("token"); cookies().delete("user"); redirect("/login"); }}>
              <button type="submit" className="text-sm text-red-400 hover:text-red-300 ml-4 font-medium px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">Sign Out</button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
