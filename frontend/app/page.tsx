import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30 font-sans overflow-hidden relative">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px] mix-blend-screen" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="px-8 py-6 flex justify-between items-center border-b border-white/5 backdrop-blur-xl">
          <div className="text-2xl font-black tracking-tighter bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">
            Cert<span className="text-indigo-400">Platform</span>
          </div>
          <Link 
            href="/login" 
            className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-medium text-sm backdrop-blur-md"
          >
            Sign In
          </Link>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-4">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Web3 Powered Credentials
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Secure & Verifiable <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Digital Certificates
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              The modern standard for educational institutions and organizations to issue, manage, and cryptographically verify credentials on the blockchain.
            </p>

            <div className="flex items-center justify-center gap-4 pt-8">
              <Link 
                href="/login"
                className="px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-all font-medium text-white shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] hover:shadow-[0_0_60px_-10px_rgba(99,102,241,0.6)]"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>

          {/* Stats/Feature Cards Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-24 mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl hover:bg-zinc-900/60 transition-all group text-left">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Cryptographic Proof</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Every certificate is backed by an immutable transaction on our bespoke EVM-compatible blockchain.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl hover:bg-zinc-900/60 transition-all group text-left">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Multi-Tenant Setup</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Platform admins can onboard infinite universities and organizations, each with isolated workspaces.</p>
            </div>

            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl hover:bg-zinc-900/60 transition-all group text-left">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Instant Verification</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Students can share their public verification links, allowing anyone to instantly verify authenticity.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
