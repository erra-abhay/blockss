"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CertificateDetail({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/certificates/${params.id}`)
      .then(res => res.json())
      .then(setData);
  }, [params.id]);

  const handleRevoke = async () => {
    if (!confirm("Are you sure you want to revoke this certificate on the blockchain? This is irreversible.")) return;
    try {
      const res = await fetch(`/api/certificates/${params.id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Certificate revoked successfully");
        router.refresh();
        window.location.reload();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to revoke");
      }
    } catch (e) {
      alert("Error revoking");
    }
  };

  if (!data) return <div className="p-8 text-zinc-500">Loading...</div>;

  const { certificate, chainStatus } = data;

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Certificate Details</h1>
        <div className="space-x-3">
          {certificate.localPdfPath && (
            <a href={`/api/certificates/${certificate.id}/download`} target="_blank" className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-all inline-block">
              Download PDF
            </a>
          )}
          {certificate.status === "ISSUED" && (
            <button onClick={handleRevoke} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg font-medium transition-all">
              Revoke On-Chain
            </button>
          )}
        </div>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl p-8 mb-8">
        <h2 className="text-xl font-bold text-white mb-6 border-b border-zinc-800 pb-4">Metadata</h2>
        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
          <div>
            <p className="text-sm text-zinc-500 mb-1">Recipient Name</p>
            <p className="text-white font-medium">{certificate.recipientName}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Recipient Email</p>
            <p className="text-white font-medium">{certificate.recipientEmail}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Course Name</p>
            <p className="text-white font-medium">{certificate.courseName}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Issue Date</p>
            <p className="text-white font-medium">{new Date(certificate.issueDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Status</p>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border inline-block mt-1 ${certificate.status === 'ISSUED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : certificate.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : certificate.status === 'REVOKED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
              {certificate.status}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-6 border-b border-zinc-800 pb-4">Blockchain Proof</h2>
        <div className="space-y-6 font-mono text-sm">
          <div>
            <p className="text-zinc-500 mb-2">Certificate Hash</p>
            <p className="text-zinc-300 break-all bg-zinc-950 p-4 rounded-lg border border-zinc-800">{certificate.certificateHash}</p>
          </div>
          <div>
            <p className="text-zinc-500 mb-2">Transaction Hash</p>
            <p className="text-indigo-400 break-all bg-zinc-950 p-4 rounded-lg border border-zinc-800">{certificate.txHash || "Pending..."}</p>
          </div>
          <div>
            <p className="text-zinc-500 mb-2">Block Number</p>
            <p className="text-zinc-300 bg-zinc-950 p-4 rounded-lg border border-zinc-800">{certificate.blockNumber ? certificate.blockNumber.toString() : "Pending..."}</p>
          </div>
          {chainStatus && chainStatus.isValid && (
             <div className="mt-6 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 flex items-center">
               ✅ <span className="ml-2 font-sans font-medium">Verified On-Chain: Record exists and is valid.</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
