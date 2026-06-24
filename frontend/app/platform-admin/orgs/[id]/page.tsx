"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

export default function OrgOverviewPage({ params }: { params: { id: string } }) {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenant = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/tenant/${params.id}`, {
        headers: { "Authorization": `Bearer ${Cookies.get("token")}` }
      });
      if (res.ok) {
        setTenant(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, [params.id]);

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tenant/${params.id}/status`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${Cookies.get("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchTenant();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-zinc-500">Loading overview...</div>;
  if (!tenant) return <div className="text-red-400">Organization not found.</div>;

  return (
    <div className="animate-in fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">{tenant.name} Overview</h1>
        <p className="text-zinc-400 text-sm">UUID: <span className="font-mono">{tenant.id}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm text-zinc-500 font-medium mb-1">Total Certificates Issued</h3>
          <p className="text-4xl font-bold text-white">{tenant.certificateCount}</p>
        </div>
        
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm text-zinc-500 font-medium mb-1">Total Users</h3>
          <p className="text-4xl font-bold text-white">{tenant.users?.length || 0}</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm text-zinc-500 font-medium mb-1">Organization Status</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border mt-2
              ${tenant.status === 'ACTIVE' ? 'border-green-500/30 text-green-400 bg-green-500/10' : ''}
              ${tenant.status === 'PAUSED' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' : ''}
              ${tenant.status === 'BANNED' ? 'border-red-500/30 text-red-400 bg-red-500/10' : ''}
            `}>
              {tenant.status}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800/50">
            <select 
              value={tenant.status}
              onChange={(e) => updateStatus(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-300 px-3 py-2 outline-none"
            >
              <option value="ACTIVE">Set ACTIVE</option>
              <option value="PAUSED">Set PAUSED (Stop Issuance)</option>
              <option value="BANNED">Set BANNED</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-medium text-white">Technical Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-zinc-500 mb-1">Slug</p>
            <p className="text-zinc-300 font-mono">{tenant.slug}</p>
          </div>
          <div>
            <p className="text-zinc-500 mb-1">Short Name</p>
            <p className="text-zinc-300 font-mono">{tenant.shortName}</p>
          </div>
          <div className="col-span-2">
            <p className="text-zinc-500 mb-1">Blockchain Wallet Address</p>
            <p className="text-zinc-300 font-mono text-xs">{tenant.walletAddress}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
