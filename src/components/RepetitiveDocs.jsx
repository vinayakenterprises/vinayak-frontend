export default function RepetitiveDocs() {
  return (
    <div className="w-full px-4 md:px-8 py-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Repetitive Docs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage and access documents that are frequently used for your tender submissions.
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-lg shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-800">About Repetitive Documents</h3>
            <p className="text-sm text-slate-550 leading-relaxed">
              This module is designed to help you pre-upload standard company documents that are regularly required across different bids (e.g., GST Registration Certificate, Company PAN Card, MSME Certificate, Audited Financial Sheets).
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 flex justify-end">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Under Development
          </span>
        </div>
      </div>

      {/* Expected Templates */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Expected Document Templates</h3>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800">GST Registration Certificate</h4>
                <p className="text-xs text-slate-400 mt-0.5">Required for tax and business entity verification</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-medium italic">Configuring soon...</span>
          </div>
          
          <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800">Company PAN Card</h4>
                <p className="text-xs text-slate-400 mt-0.5">Required for financial identification</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-medium italic">Configuring soon...</span>
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800">Certificate of Incorporation</h4>
                <p className="text-xs text-slate-400 mt-0.5">Required for company incorporation validation</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-medium italic">Configuring soon...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
