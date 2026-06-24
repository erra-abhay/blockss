"use client";
export default function StudentDashboard() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-white mb-8">My Certificates</h1>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700/50">
          <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-white mb-2">No Certificates Yet</h3>
        <p className="text-zinc-400 max-w-md mx-auto">
          You have not been awarded any certificates yet. When your organization issues a certificate to you, it will appear here.
        </p>
      </div>
    </div>
  );
}
