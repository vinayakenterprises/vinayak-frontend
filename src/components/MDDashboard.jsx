export default function MDDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm p-10 max-w-lg w-full space-y-4">
        <div className="w-16 h-16 bg-sky-50 dark:bg-sky-950 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">MD Dashboard</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          MD Dashboard component
        </p>
      </div>
    </div>
  );
}
