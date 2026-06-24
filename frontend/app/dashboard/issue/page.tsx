"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function IssueCertificatePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    recipientName: "",
    recipientEmail: "",
    courseName: "",
    issueDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch("http://localhost:1501/api/certificates", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Certificate issuance queued! ID: " + data.certificateId);
        router.push("/certificates");
      } else {
        alert(data.error || "Failed to issue certificate");
      }
    } catch (e) {
      alert("Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Issue New Certificate</h1>
        <p className="text-zinc-400 mt-2">Fill in the details below to issue a verifiable certificate on the blockchain.</p>
      </div>
      
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Recipient Name</label>
              <input required type="text" placeholder="John Doe" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" value={formData.recipientName} onChange={e => setFormData({...formData, recipientName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Recipient Email</label>
              <input required type="email" placeholder="john@example.com" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" value={formData.recipientEmail} onChange={e => setFormData({...formData, recipientEmail: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Course / Credential Name</label>
              <input required type="text" placeholder="Advanced Blockchain Engineering" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" value={formData.courseName} onChange={e => setFormData({...formData, courseName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Issue Date</label>
              <input required type="date" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} />
            </div>
          </div>
          
          <div className="flex justify-end pt-6 border-t border-zinc-800/50 mt-8">
            <button disabled={loading} type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-8 rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:shadow-none flex items-center space-x-2">
              {loading ? "Processing..." : "Issue Certificate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
