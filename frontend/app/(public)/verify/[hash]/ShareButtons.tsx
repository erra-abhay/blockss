"use client";
import { Share2, Download } from "lucide-react";

export default function ShareButtons({ pdfUrl }: { pdfUrl: string }) {
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-6">
      <button 
        onClick={handleShare}
        className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-lg transition-colors shadow-md shadow-blue-600/20"
      >
        <Share2 className="w-5 h-5" />
        <span>Share Certificate</span>
      </button>
      <a 
        href={pdfUrl}
        download
        className="flex-1 flex items-center justify-center space-x-2 bg-white hover:bg-zinc-50 border-2 border-blue-600 text-blue-600 font-bold py-3.5 px-6 rounded-lg transition-colors"
      >
        <Download className="w-5 h-5" />
        <span>Download Certificate</span>
      </a>
    </div>
  );
}
