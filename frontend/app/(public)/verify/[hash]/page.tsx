import { verifyCertificateOnChain } from "@/lib/contract";
import { prisma, getTenantPrisma } from "@/lib/prisma";
import { CheckCircle2, Award, ShieldCheck, User } from "lucide-react";
import ShareButtons from "./ShareButtons";

// To bypass fetching the API over HTTP during SSR, we directly call the logic.
async function getVerificationData(hash: string) {
  try {
    const chainResult = await verifyCertificateOnChain(hash);
    if (!chainResult.record || !chainResult.record.tenantId) {
      return { isValid: false, reason: "NOT_FOUND", certificate: null };
    }

    const { isValid, record } = chainResult;
    const tenant = await prisma.tenant.findUnique({
      where: { id: record.tenantId }
    });

    if (!tenant) return { isValid: false, reason: "INVALID_TENANT", certificate: null };
    if (tenant.status === 'BANNED') return { isValid: false, reason: "BANNED", certificate: null };

    const tenantPrisma = getTenantPrisma(tenant.slug);
    const dbCert = await tenantPrisma.certificate.findUnique({
      where: { certificateHash: hash }
    });

    let reason;
    if (!isValid) {
        if (record.revoked) reason = "REVOKED";
        else if (record.expiresAt !== 0 && Date.now() > record.expiresAt * 1000) reason = "EXPIRED";
        else reason = "INVALID";
    }

    return {
      isValid,
      onChain: {
        txHash: dbCert?.txHash,
        blockNumber: dbCert?.blockNumber?.toString(),
        issuedAt: record.issuedAt,
      },
      certificate: dbCert ? {
        recipientName: dbCert.recipientName,
        courseName: dbCert.courseName,
        issueDate: dbCert.issueDate,
        tenantName: tenant.name,
        metadata: dbCert.metadata as any
      } : null,
      reason
    };
  } catch (error) {
    return { isValid: false, reason: "RPC_ERROR", certificate: null };
  }
}

export default async function VerifyPage({ params }: { params: { hash: string } }) {
  const data = await getVerificationData(params.hash);

  if (!data || !data.certificate) {
    if (data?.reason === "BANNED") {
      return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 font-sans text-zinc-900">
          <div className="bg-white border-2 border-red-500/20 rounded-2xl shadow-xl p-10 max-w-lg text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 mb-4">Organization Banned</h1>
            <p className="text-zinc-600 text-lg mb-6 leading-relaxed">
              The issuing organization has been permanently suspended from the platform. Their certificates are no longer recognized as valid.
            </p>
            <div className="bg-zinc-100 p-4 rounded-lg font-mono text-xs text-zinc-500 break-all border border-zinc-200">
              Reference: {params.hash}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 font-sans text-zinc-900">
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-xl p-10 max-w-lg text-center">
          <h1 className="text-3xl font-bold text-zinc-900 mb-4">Certificate Not Found</h1>
          <p className="text-zinc-600 mb-6">This certificate could not be verified on the blockchain.</p>
          <div className="bg-zinc-100 p-4 rounded-lg font-mono text-xs text-zinc-500 break-all border border-zinc-200">
            {params.hash}
          </div>
        </div>
      </div>
    );
  }

  const { isValid, certificate, onChain, reason } = data;

  const issueDateString = new Date(certificate.issueDate).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  // Example placeholder metadata, fallback to empty
  const grade = certificate.metadata?.grade;
  const hours = certificate.metadata?.hours;
  const skills = certificate.metadata?.skills || ["Cryptography", "Network Security", "Cloud Computing", "Blockchain"];

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900">
      {/* Top Banner (Header) */}
      <div className="w-full bg-white border-b border-zinc-200 sticky top-0 z-10 px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2 font-bold text-xl text-blue-600">
          <Award className="w-6 h-6" />
          <span>CertVerify</span>
        </div>
        {!isValid && (
          <div className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
            {reason} - INVALID ON CHAIN
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Main 2-column layout */}
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Column: Details */}
          <div className="w-full lg:w-5/12 space-y-10">
            
            {/* User Info Block */}
            <div className="bg-[#eff2fb] rounded-xl p-8 relative">
              <div className="flex items-start space-x-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-zinc-300 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                    {/* Placeholder Avatar */}
                    <User className="w-10 h-10 text-zinc-500" />
                  </div>
                  {isValid && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                      <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-zinc-900 mb-2">Completed by {certificate.recipientName}</h2>
                  <p className="text-zinc-800 font-medium">{issueDateString}</p>
                  {hours && <p className="text-zinc-600 mt-1">{hours} hours (approximately)</p>}
                  {grade && <p className="text-zinc-900 font-bold mt-1">Grade Achieved: {grade}%</p>}
                </div>
              </div>

              <div className="mt-8 border-t border-[#dce2f5] pt-6">
                <p className="text-sm text-zinc-700 leading-relaxed">
                  {certificate.recipientName}'s account is verified. <strong className="font-semibold">{certificate.tenantName}</strong> certifies their successful completion of <a href="#" className="text-blue-600 hover:underline">{certificate.courseName}</a>.
                </p>
              </div>
            </div>

            {/* Course Details Block */}
            <div className="px-2">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md shadow-blue-600/20">
                  <span className="font-bold text-2xl">{certificate.tenantName.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 leading-tight">{certificate.courseName}</h3>
                  <p className="text-zinc-600 text-sm mt-1">{certificate.tenantName}</p>
                </div>
              </div>

              {/* Hardcoded placeholders for Coursera layout imitation */}
              <div className="mb-8">
                <h4 className="font-bold text-zinc-900 mb-4 text-lg">What you will learn</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700 text-sm">Define the types of networks and components of networks</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700 text-sm">Understand how to secure a network against intrusion tactics</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700 text-sm">Illustrate how data is sent and received over a network</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-zinc-700 text-sm">Describe system hardening techniques</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 mb-4 text-lg">Skills you will gain</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: string, i: number) => (
                    <span key={i} className="px-4 py-1.5 bg-zinc-100 text-zinc-700 text-sm font-medium rounded-full border border-zinc-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: PDF Preview & Actions */}
          <div className="w-full lg:w-7/12 flex flex-col">
            
            {/* PDF Container */}
            <div className="w-full aspect-[4/3] bg-zinc-100 border border-zinc-300 shadow-lg rounded-xl overflow-hidden relative">
              <iframe 
                src={`http://localhost:1501/api/verify/${params.hash}/pdf#toolbar=0`}
                className="w-full h-full border-0"
                title="Certificate PDF Preview"
              />
              {/* Optional: if iframe fails to load or while loading, a spinner could go here */}
            </div>

            {/* Action Buttons */}
            <ShareButtons pdfUrl={`http://localhost:1501/api/verify/${params.hash}/pdf`} />

            {/* On Chain Technical Details (Optional footprint) */}
            <div className="mt-10 p-6 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-500 font-mono overflow-x-auto">
              <p className="font-semibold text-zinc-700 font-sans mb-3">Blockchain Verification Details</p>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-32 shrink-0">Tx Hash:</span>
                  <span className="text-zinc-900 truncate" title={onChain?.txHash}>{onChain?.txHash || 'Pending'}</span>
                </div>
                <div className="flex">
                  <span className="w-32 shrink-0">Block:</span>
                  <span className="text-zinc-900">{onChain?.blockNumber || 'Pending'}</span>
                </div>
                <div className="flex">
                  <span className="w-32 shrink-0">Cert Hash:</span>
                  <span className="text-zinc-900 truncate" title={params.hash}>{params.hash}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
