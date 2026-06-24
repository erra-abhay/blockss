"use client";
import Cookies from "js-cookie";

export default function TenantAdminDashboard() {
  let user: any = {};
  try {
    const userCookie = Cookies.get("user");
    if (userCookie) {
      user = JSON.parse(userCookie);
    }
  } catch(e) {}

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-white mb-8">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="text-zinc-400 text-sm font-medium mb-2">Total Issued</div>
          <div className="text-4xl font-bold text-white">0</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="text-zinc-400 text-sm font-medium mb-2">Pending Batches</div>
          <div className="text-4xl font-bold text-white">0</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="text-zinc-400 text-sm font-medium mb-2">Students</div>
          <div className="text-4xl font-bold text-white">0</div>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700/50">
          <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-white mb-2">Welcome to {user.tenantSlug || 'your Workspace'}</h3>
        <p className="text-zinc-400 max-w-md mx-auto">
          You are logged in as an Organization Administrator. Use the sidebar to issue new certificates or view existing credentials.
        </p>
      </div>
    </div>
  );
}
