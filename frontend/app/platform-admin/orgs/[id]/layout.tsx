"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function OrgDashboardLayout({ children, params }: { children: React.ReactNode, params: { id: string } }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col space-y-6">
      {/* Top Navigation / Breadcrumbs */}
      <div className="flex items-center space-x-2 text-sm text-zinc-400">
        <Link href="/platform-admin" className="hover:text-white transition-colors">Platform Admin</Link>
        <span>/</span>
        <span className="text-zinc-200">Organization {params.id.slice(0, 8)}...</span>
      </div>

      <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden min-h-[70vh]">
        {/* Secondary Sidebar */}
        <div className="w-64 bg-zinc-950 border-r border-zinc-800 p-6 flex flex-col space-y-2">
          <Link 
            href={`/platform-admin/orgs/${params.id}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === `/platform-admin/orgs/${params.id}` 
                ? "bg-indigo-500/10 text-indigo-400" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            Overview
          </Link>
          <Link 
            href={`/platform-admin/orgs/${params.id}/users`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.includes("/users")
                ? "bg-indigo-500/10 text-indigo-400" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            Manage Users
          </Link>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 bg-zinc-900/10">
          {children}
        </div>
      </div>
    </div>
  );
}
