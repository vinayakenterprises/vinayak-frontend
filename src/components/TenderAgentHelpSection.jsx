import { useState } from 'react';

// EASILY REPLACE THIS URL WITH YOUR S3 VIDEO URL LATER
const HELPFUL_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export default function TenderAgentHelpSection() {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  return (
    <div className="w-full px-4 md:px-8 py-6 space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Help & Support</h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore training videos to get started with the system and learn how workflows operate.
        </p>
      </div>

      {/* Videos Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Helpful Videos</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tendor Flow Video Card */}
          <div
            onClick={() => setIsPlayerOpen(true)}
            className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            {/* Thumbnail Wrapper */}
            <div className="relative aspect-video w-full bg-gradient-to-tr from-slate-900 via-slate-800 to-sky-900 flex items-center justify-center overflow-hidden">
              {/* Play Button Icon */}
              <div className="w-12 h-12 bg-white/10 group-hover:bg-sky-500 text-white rounded-full flex items-center justify-center backdrop-blur-xs transition-all duration-300 group-hover:scale-110 shadow-lg">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>

              {/* Duration Badge */}
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/70 text-slate-200 select-none">
                3:15
              </span>
            </div>

            {/* Content Details */}
            <div className="p-4 space-y-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100 uppercase tracking-wider">
                Workflow
              </span>
              <h3 className="text-sm font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">
                Tendor Flow
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                In this video you will get an idea how tender work flows across different teams.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {isPlayerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden relative scale-in duration-150">
            {/* Close Button Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <span className="text-sm font-bold tracking-wide">Tendor Flow - Walkthrough Video</span>
              <button
                onClick={() => setIsPlayerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title="Close Player"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Video container */}
            <div className="w-full aspect-video bg-black flex items-center justify-center">
              <video
                src={HELPFUL_VIDEO_URL}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}