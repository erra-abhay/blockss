"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import Link from "next/link";

export default function PlatformAdminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/tenant", {
        headers: { "Authorization": `Bearer ${Cookies.get("token")}` }
      });
      const data = await res.json();
      if (res.ok) setTenants(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  if (loading) return <div className="p-8 text-zinc-400">Loading organizations...</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">All Organizations</h1>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
            <tr>
              <th className="px-6 py-4 font-medium">Organization</th>
              <th className="px-6 py-4 font-medium">Slug</th>
              <th className="px-6 py-4 font-medium text-right">Certificates Issued</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
            {tenants.map(tenant => (
              <tr key={tenant.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{tenant.name}</td>
                <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{tenant.slug}</td>
                <td className="px-6 py-4 text-right font-bold text-indigo-400">{tenant.certificateCount}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full border
                      ${tenant.status === 'ACTIVE' ? 'border-green-500/30 text-green-400 bg-green-500/10' : ''}
                      ${tenant.status === 'PAUSED' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' : ''}
                      ${tenant.status === 'BANNED' ? 'border-red-500/30 text-red-400 bg-red-500/10' : ''}
                    `}>
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/platform-admin/orgs/${tenant.id}`}
                    className="text-xs px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg font-medium transition-colors border border-indigo-500/20"
                  >
                    Manage Org
                  </Link>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No organizations found. Register one in the sidebar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
