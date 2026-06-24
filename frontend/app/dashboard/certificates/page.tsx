"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/certificates")
      .then(res => res.json())
      .then(data => {
        setCertificates(data.certificates || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">All Certificates</h1>
        <Link href="/issue" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20">
          + Issue New
        </Link>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Recipient</th>
                <th className="px-6 py-4 font-medium">Course</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-zinc-500">Loading...</td></tr>
              ) : certificates.map((cert: any) => (
                <tr key={cert.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{cert.recipientName}</div>
                    <div className="text-zinc-500 text-xs">{cert.recipientEmail}</div>
                  </td>
                  <td className="px-6 py-4">{cert.courseName}</td>
                  <td className="px-6 py-4">{new Date(cert.issueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${cert.status === 'ISSUED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : cert.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : cert.status === 'REVOKED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                      {cert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/certificates/${cert.id}`} className="text-indigo-400 hover:text-indigo-300 font-medium">View</Link>
                  </td>
                </tr>
              ))}
              {!loading && certificates.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-zinc-500">No certificates found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
