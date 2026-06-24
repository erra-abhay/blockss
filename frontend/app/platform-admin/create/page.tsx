"use client";
import { useState } from "react";
import Cookies from "js-cookie";

export default function CreateTenantPage() {
  const [formData, setFormData] = useState({ orgName: "", slug: "", shortName: "" });
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{username: string, password: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCredentials(null);
    try {
      const token = Cookies.get("token");
      const res = await fetch("http://localhost:1501/api/tenant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setCredentials(data.adminCredentials);
        setFormData({ orgName: "", slug: "", shortName: "" });
      } else {
        alert(data.error || "Failed");
      }
    } catch (e) {
      alert("Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-white mb-8">Create New Tenant</h1>
      
      {credentials && (
        <div className="mb-8 p-6 bg-green-900/20 border border-green-500/50 rounded-xl">
          <h3 className="text-xl font-bold text-green-400 mb-2">Tenant Created Successfully!</h3>
          <p className="text-zinc-300 mb-4">Please save these credentials securely. They will not be shown again.</p>
          <div className="space-y-2 font-mono bg-zinc-950 p-4 rounded-lg">
            <div><span className="text-zinc-500">Username:</span> {credentials.username}</div>
            <div><span className="text-zinc-500">Password:</span> {credentials.password}</div>
          </div>
        </div>
      )}

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Organization Name</label>
              <input required type="text" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" value={formData.orgName} onChange={e => setFormData({...formData, orgName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Organization Slug</label>
              <input required type="text" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Short Name (e.g. KITSW)</label>
              <input required type="text" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" value={formData.shortName} onChange={e => setFormData({...formData, shortName: e.target.value})} />
            </div>
          </div>
          <button disabled={loading} type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-8 rounded-xl shadow-lg transition-all disabled:opacity-50 mt-4">
            {loading ? "Processing..." : "Create Tenant"}
          </button>
        </form>
      </div>
    </div>
  );
}
