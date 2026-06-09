import { useState } from 'react';
import TendersListView from './TendersListView';
import RepetitiveDocs from './RepetitiveDocs';
import TenderAgentHelpSection from './TenderAgentHelpSection';

export default function TenderDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('tenders');

  return (
    <div className="flex w-full min-h-[calc(100vh-80px)] bg-slate-50 relative">
      {/* Sidebar Navigation */}
      <aside
        className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shrink-0 overflow-hidden ${isSidebarOpen ? 'w-64' : 'w-0'
          }`}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-800 tracking-wide uppercase">Navigation</span>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1 rounded-lg text-slate-400 hover:bg-slate-150 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => setActiveSidebarItem('tenders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeSidebarItem === 'tenders'
              ? 'bg-sky-50 text-sky-600'
              : 'text-slate-650 hover:bg-slate-50 hover:text-slate-800'
              }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Tenders
          </button>
          <button
            onClick={() => setActiveSidebarItem('repetitive-docs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeSidebarItem === 'repetitive-docs'
              ? 'bg-sky-50 text-sky-600'
              : 'text-slate-650 hover:bg-slate-50 hover:text-slate-800'
              }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Repetitive Docs
          </button>
          <button
            onClick={() => setActiveSidebarItem('tender-agent-help-section')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeSidebarItem === 'tender-agent-help-section'
              ? 'bg-sky-50 text-sky-600'
              : 'text-slate-650 hover:bg-slate-50 hover:text-slate-800'
              }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Help
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toggle Sidebar Header Button */}
        <div className="w-full px-4 md:px-8 py-3 flex items-center gap-3 border-b border-slate-200/60 bg-white shadow-xs">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Collapse Navigation" : "Expand Navigation"}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all cursor-pointer flex items-center justify-center"
          >
            <svg className="w-5 h-5 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={isSidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
          <span className="text-xs font-semibold text-slate-400 select-none">Tender Agent Console</span>
        </div>

        {activeSidebarItem === 'tenders' && <TendersListView />}
        {activeSidebarItem === 'repetitive-docs' && <RepetitiveDocs />}
        {activeSidebarItem === 'tender-agent-help-section' && <TenderAgentHelpSection />}
      </div>
    </div>
  );
}
