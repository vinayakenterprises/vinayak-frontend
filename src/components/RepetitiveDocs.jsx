import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function RepetitiveDocs() {
  const [docsData, setDocsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'bis' | 'type-tests'
  const [activeTypeTestSubTab, setActiveTypeTestSubTab] = useState('acsr_conductor'); // 'acsr_conductor' | 'aaa_conductor' | 'cable'

  const fetchRepetitiveDocs = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token') || '';

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tenders/get-repetitive-tender-documents`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const resData = await response.json().catch(() => null);

      if (response.ok && resData?.status === 'success') {
        setDocsData(resData.data);
      } else {
        setError(resData?.message || resData?.error || 'Failed to retrieve repetitive documents.');
      }
    } catch (err) {
      console.error(err);
      setError(`Network error: ${err.message || err}. Could not connect to API server.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepetitiveDocs();
  }, []);

  const generalDocKeys = [
    'pan_card',
    'gst_dausa',
    'moa',
    'audit_and_balance_sheet',
    'list_of_manpower',
    'list_of_plant_and_machinery'
  ];

  const bisDocKeys = [
    { key: 'cables', label: 'BIS Certificate - Cables' },
    { key: 'acsr_conductor', label: 'BIS Certificate - ACSR Conductor' },
    { key: 'aaa_conductor', label: 'BIS Certificate - AAA Conductor' }
  ];

  return (
    <div className="w-full px-4 md:px-8 py-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Repetitive Docs</h1>
          {/* <p className="text-sm text-slate-500 mt-1">
            Access and download frequently requested documents for tender applications.
          </p> */}
        </div>

        {!loading && !error && (
          <button
            onClick={fetchRepetitiveDocs}
            className="self-start px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
            </svg>
            Refresh Docs
          </button>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${activeTab === 'general'
            ? 'text-sky-600 border-b-2 border-sky-500 font-bold'
            : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          General Documents
        </button>
        <button
          onClick={() => setActiveTab('bis')}
          className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${activeTab === 'bis'
            ? 'text-sky-600 border-b-2 border-sky-500 font-bold'
            : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          BIS Certificates
        </button>
        <button
          onClick={() => setActiveTab('type-tests')}
          className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${activeTab === 'type-tests'
            ? 'text-sky-600 border-b-2 border-sky-500 font-bold'
            : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          Type Test Reports
        </button>
      </div>

      {/* Loading State Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
              <div className="w-12 h-12 bg-slate-100 rounded-lg"></div>
              <div className="h-4 bg-slate-100 rounded w-2/3"></div>
              <div className="h-8 bg-slate-100 rounded w-full mt-2"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6 text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-rose-800">Failed to Load Documents</h3>
            <p className="text-xs text-rose-700">{error}</p>
          </div>
          <button
            onClick={fetchRepetitiveDocs}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* General Documents View */}
      {activeTab === 'general' && !loading && !error && docsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generalDocKeys.map(key => {
            const doc = docsData[key];
            if (!doc) return null;
            return (
              <div
                key={key}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:shadow-sm hover:border-slate-350 transition-all group"
              >
                <div className="space-y-3">
                  <div className="p-3 bg-sky-50 text-sky-600 rounded-lg self-start inline-block">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm group-hover:text-sky-600 transition-colors">
                      {doc.title || key.replace(/_/g, ' ').toUpperCase()}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 tracking-wider">
                      Standard Tender Doc
                    </p>
                  </div>
                </div>

                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 w-full text-center bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-600 border border-slate-200 hover:border-sky-200 rounded-lg py-2 text-xs font-bold transition-all shadow-3xs flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Document
                  </a>
                ) : (
                  <div className="mt-5 w-full text-center py-2 text-xs font-medium text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                    Document Unattached
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* BIS Certificates View */}
      {activeTab === 'bis' && !loading && !error && docsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bisDocKeys.map(({ key, label }) => {
            const url = docsData.bis?.[key];
            return (
              <div
                key={key}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:shadow-sm hover:border-slate-350 transition-all group"
              >
                <div className="space-y-3">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-lg self-start inline-block">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm group-hover:text-teal-600 transition-colors">
                      {label}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 tracking-wider">
                      BIS Standards Certification
                    </p>
                  </div>
                </div>

                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 w-full text-center bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-600 border border-slate-200 hover:border-teal-200 rounded-lg py-2 text-xs font-bold transition-all shadow-3xs flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Certificate
                  </a>
                ) : (
                  <div className="mt-5 w-full text-center py-2 text-xs font-medium text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                    Certificate Unattached
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Type Test Reports View */}
      {activeTab === 'type-tests' && !loading && !error && docsData && docsData.type_test_reports && (
        <div className="space-y-6">
          {/* Sub-tabs Navigation */}
          <div className="bg-slate-100 p-1.5 rounded-lg flex max-w-lg gap-1 border border-slate-200 shadow-3xs">
            <button
              onClick={() => setActiveTypeTestSubTab('acsr_conductor')}
              className={`flex-1 text-center py-1.5 px-3 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTypeTestSubTab === 'acsr_conductor'
                ? 'bg-white text-sky-600 shadow-3xs'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              ACSR Conductor ({docsData.type_test_reports.acsr_conductor?.length || 0})
            </button>
            <button
              onClick={() => setActiveTypeTestSubTab('aaa_conductor')}
              className={`flex-1 text-center py-1.5 px-3 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTypeTestSubTab === 'aaa_conductor'
                ? 'bg-white text-sky-600 shadow-3xs'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              AAA Conductor ({docsData.type_test_reports.aaa_conductor?.length || 0})
            </button>
            <button
              onClick={() => setActiveTypeTestSubTab('cable')}
              className={`flex-1 text-center py-1.5 px-3 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTypeTestSubTab === 'cable'
                ? 'bg-white text-sky-600 shadow-3xs'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              Cables ({docsData.type_test_reports.cable?.length || 0})
            </button>
          </div>

          {/* Sub-tab content list */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {docsData.type_test_reports[activeTypeTestSubTab] && docsData.type_test_reports[activeTypeTestSubTab].length > 0 ? (
                docsData.type_test_reports[activeTypeTestSubTab].map((report, idx) => (
                  <div
                    key={idx}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">
                          {report.file_name || 'Unnamed Report'}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">
                          Type Test Report PDF
                        </p>
                      </div>
                    </div>

                    <a
                      href={report.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50/70 hover:bg-sky-100/70 border border-sky-100 px-4 py-2 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open Report
                    </a>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-400 italic text-sm">
                  No type test reports available in this category.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
