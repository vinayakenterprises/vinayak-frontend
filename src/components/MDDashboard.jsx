import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    return dateString;
  } catch {
    return dateString;
  }
};

export default function MDDashboard() {
  const [pendingTenders, setPendingTenders] = useState([]);
  const [approvedTenders, setApprovedTenders] = useState([]);
  const [activeTab, setActiveTab] = useState('Approval Requests');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal & Actions state
  const [selectedTender, setSelectedTender] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadDashboardData = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    setError('');
    const token = localStorage.getItem('token') || '';
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/tenders/approval-request-tenders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/tenders/get-approved-tenders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const pendingData = await pendingRes.json().catch(() => null);
      const approvedData = await approvedRes.json().catch(() => null);

      if (pendingRes.ok && pendingData?.status === 'success') {
        setPendingTenders(pendingData.data || []);
      } else {
        setError(pendingData?.message || 'Failed to load pending approval tenders.');
      }

      if (approvedRes.ok && approvedData?.status === 'success') {
        setApprovedTenders(approvedData.data || []);
      } else {
        setError(prev => prev || approvedData?.message || 'Failed to load approved tenders.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Could not connect to API server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData();
  }, [loadDashboardData]);

  const handleApproveTender = async (tenderId) => {
    setIsApproving(true);
    setSuccessMsg('');
    setErrorMsg('');
    const token = localStorage.getItem('token') || '';
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tenders/approve-tender/${tenderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const resData = await response.json().catch(() => null);
      if (response.ok && resData?.status === 'success') {
        setSuccessMsg(resData?.message || 'Tender approved successfully!');
        setSelectedTender(null);
        await loadDashboardData();
        // Clear success message after 4 seconds
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(resData?.message || 'Failed to approve tender.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error. Failed to approve tender.');
    } finally {
      setIsApproving(false);
    }
  };

  const openViewModal = (tender) => {
    setErrorMsg('');
    setSuccessMsg('');
    setSelectedTender(tender);
  };

  const activeTenders = activeTab === 'Approval Requests' ? pendingTenders : approvedTenders;

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-4 rounded-xl flex items-center gap-2.5 shadow-sm animate-fadeIn">
          <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-4 rounded-xl flex items-center gap-2.5 shadow-sm animate-fadeIn">
          <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pending Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending Approval</span>
            <h3 className="text-3xl font-extrabold text-slate-950 dark:text-white">
              {isLoading ? '...' : pendingTenders.length}
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Approved Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Approved Tenders</span>
            <h3 className="text-3xl font-extrabold text-slate-950 dark:text-white">
              {isLoading ? '...' : approvedTenders.length}
            </h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabs & Content container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Tab Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {['Approval Requests', 'Approved Tenders'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === tab
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/10'
                  : 'bg-slate-50 hover:bg-slate-100/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/80'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="p-2 bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3m0 0l3 3m-3-3v12" />
            </svg>
          </button>
        </div>

        {/* Table/List Area */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <svg className="animate-spin h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading tenders...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Failed to retrieve tenders</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450">{error}</p>
                <button
                  onClick={loadDashboardData}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Retry Load
                </button>
              </div>
            </div>
          ) : activeTenders.length === 0 ? (
            <div className="py-20 text-center">
              <div className="max-w-xs mx-auto space-y-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-550 w-fit mx-auto">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No tenders listed</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                  There are currently no tenders in the &quot;{activeTab}&quot; category.
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
                  <th className="py-3.5 px-6">Tender ID</th>
                  <th className="py-3.5 px-4">Title &amp; Reference</th>
                  <th className="py-3.5 px-4">Organization</th>
                  <th className="py-3.5 px-4">Cable Length</th>
                  <th className="py-3.5 px-4">State</th>
                  <th className="py-3.5 px-4">Closing Date</th>
                  <th className="py-3.5 px-4">Value</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {activeTenders.map((tender) => (
                  <tr
                    key={tender.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group"
                  >
                    <td className="py-4 px-6 text-sm font-semibold text-slate-800 dark:text-slate-350">
                      {tender.tender_id}
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {tender.tender_title}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                        {tender.tender_ref_no}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-500 dark:text-slate-400">
                      {tender.tender_organization}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {tender.cable_length_km} KM
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-500 dark:text-slate-400">
                      {tender.state}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(tender.closing_date)}
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-slate-800 dark:text-slate-350 whitespace-nowrap">
                      ₹{Number(tender.tender_value_cr || 0).toFixed(2)} Cr
                    </td>
                    <td className="py-4 px-6 text-sm text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openViewModal(tender)}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-slate-100 dark:border-slate-800"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        {activeTab === 'Approval Requests' && (
                          <button
                            onClick={() => handleApproveTender(tender.id)}
                            disabled={isApproving}
                            className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-450 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs shadow-emerald-500/10"
                          >
                            {isApproving ? (
                              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedTender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col scale-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tender Details</h2>
              <button
                onClick={() => setSelectedTender(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-650 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white">{selectedTender.tender_title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase mt-0.5">{selectedTender.tender_organization}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${selectedTender.approved
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                    : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900'
                    }`}>
                    {selectedTender.approved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 border-t border-b border-slate-100 dark:border-slate-800 py-4">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Tender ID</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{selectedTender.tender_id}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Reference Number</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{selectedTender.tender_ref_no}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Cable Length</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{selectedTender.cable_length_km} KM</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">State</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{selectedTender.state}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Publish Date</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatDate(selectedTender.publish_date)}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Closing Date</span>
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">{formatDate(selectedTender.closing_date)}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Tender Value</span>
                    <span className="text-xs font-bold text-slate-850 dark:text-slate-200">₹{Number(selectedTender.tender_value_cr || 0).toFixed(2)} Cr</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Tender Fee</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">₹{Number(selectedTender.tender_fee_inr || 0).toFixed(2)}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">EMD</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">₹{Number(selectedTender.emd_inr || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Documents List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Tender Documents</h4>
                  <div className="space-y-1.5">
                    {selectedTender.tender_documents && selectedTender.tender_documents.length > 0 ? (
                      selectedTender.tender_documents.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-lg border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-xs font-medium text-slate-700 dark:text-slate-300 group"
                        >
                          <span className="truncate pr-2">{doc.name}</span>
                          <span className="text-sky-500 group-hover:text-sky-600 shrink-0 flex items-center gap-0.5">
                            View Document
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </span>
                        </a>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">No documents attached.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              {!selectedTender.approved ? (
                <button
                  onClick={() => handleApproveTender(selectedTender.id)}
                  disabled={isApproving}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-450 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {isApproving ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Approving...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Approve Tender
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Already Approved
                </div>
              )}
              <button
                onClick={() => setSelectedTender(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-355 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
