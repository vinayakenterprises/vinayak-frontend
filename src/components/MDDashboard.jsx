import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { formatToIST, calculateTenderSLAs } from '../utils/helper-functions';
import MDTimelineTable from './MDTimelineTable';


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

const formatDeadline = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateString;
  }
};
const getStatusDisplay = (tender) => {
  if (!tender) return { label: 'N/A', color: 'slate', footerLabel: 'N/A' };

  const co = tender.counter_offer;
  const hasCounterOffer = co?.enabled || co?.counter_offer;

  // 1. Check Counter Offer approval status first if it was sent for approval
  if (hasCounterOffer && co?.sent_for_approval) {
    if (co.counter_offer_approve_by_md === true) {
      return { label: 'Counter Offer Approved', color: 'emerald', footerLabel: 'Counter Offer Approved' };
    }
    if (co.counter_offer_approve_by_md === false) {
      return { label: 'Counter Offer Rejected', color: 'rose', footerLabel: 'Counter Offer Rejected' };
    }
    return { label: 'Counter Offer Pending', color: 'amber', footerLabel: 'Counter Offer Pending' };
  }

  // 2. Check main tender approval status
  if (tender.approved === true) {
    return { label: 'Approved', color: 'emerald', footerLabel: 'Already Approved' };
  }
  if (tender.approved === false) {
    return { label: 'Rejected', color: 'rose', footerLabel: 'Rejected' };
  }
  return { label: 'Pending Approval', color: 'amber', footerLabel: 'Pending Approval' };
};

export default function MDDashboard() {
  const [pendingTenders, setPendingTenders] = useState([]);

  const [counterOfferTenders, setCounterOfferTenders] = useState([]);
  const [approvedTenders, setApprovedTenders] = useState([]);
  const [rejectedTenders, setRejectedTenders] = useState([]);
  const [counterOfferApprovedTenders, setCounterOfferApprovedTenders] = useState([]);
  const [counterOfferRejectedTenders, setCounterOfferRejectedTenders] = useState([]);
  const [timelineTenders, setTimelineTenders] = useState([]);
  const [activeTab, setActiveTab] = useState('Approval Requests');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cardData, setCardData] = useState({
    totalTenders: 0,
    totalActiveTenders: 0,
    totalApprovedTenders: 0,
    pendingFromAccountsTeam: 0,
    completedTenders: 0,
    rejectedTenders: 0
  });

  // Modal & Actions state
  const [selectedTender, setSelectedTender] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvingAction, setApprovingAction] = useState(null); // 'approve' or 'reject'
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  const loadDashboardData = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    setError('');
    const token = localStorage.getItem('token') || '';
    try {
      const [
        pendingRes,
        counterOfferRes,
        approvedRes,
        cardsRes,
        rejectedRes,
        counterOfferApprovedRes,
        counterOfferRejectedRes,
        timelineRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/tenders/approval-request-tenders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/tenders/get-counter-offer-approval-request-tenders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/tenders/get-approved-tenders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/tenders/tender-cards-count-data`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/tenders/get-rejected-tenders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/tenders/get-counter-offer-approved-tenders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/tenders/get-counter-offer-rejected-tenders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/tenders/get-tenders-for-md`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const pendingData = await pendingRes.json().catch(() => null);
      const counterOfferData = await counterOfferRes.json().catch(() => null);
      const approvedData = await approvedRes.json().catch(() => null);
      const cardsData = await cardsRes.json().catch(() => null);
      const rejectedData = await rejectedRes.json().catch(() => null);
      const counterOfferApprovedData = await counterOfferApprovedRes.json().catch(() => null);
      const counterOfferRejectedData = await counterOfferRejectedRes.json().catch(() => null);
      const timelineData = await timelineRes.json().catch(() => null);

      if (pendingRes.ok && pendingData?.status === 'success') {
        setPendingTenders(pendingData.data || []);
      } else {
        setError(pendingData?.message || 'Failed to load pending approval tenders.');
      }

      if (counterOfferRes.ok && counterOfferData?.status === 'success') {
        setCounterOfferTenders(counterOfferData.data || []);
      } else {
        setError(prev => prev || counterOfferData?.message || 'Failed to load counter offer approval request tenders.');
      }

      if (approvedRes.ok && approvedData?.status === 'success') {
        setApprovedTenders(approvedData.data || []);
      } else {
        setError(prev => prev || approvedData?.message || 'Failed to load approved tenders.');
      }

      if (rejectedRes.ok && rejectedData?.status === 'success') {
        setRejectedTenders(rejectedData.data || []);
      } else {
        setError(prev => prev || rejectedData?.message || 'Failed to load rejected tenders.');
      }

      if (counterOfferApprovedRes.ok && counterOfferApprovedData?.status === 'success') {
        setCounterOfferApprovedTenders(counterOfferApprovedData.data || []);
      } else {
        setError(prev => prev || counterOfferApprovedData?.message || 'Failed to load counter offer approved tenders.');
      }

      if (counterOfferRejectedRes.ok && counterOfferRejectedData?.status === 'success') {
        setCounterOfferRejectedTenders(counterOfferRejectedData.data || []);
      } else {
        setError(prev => prev || counterOfferRejectedData?.message || 'Failed to load counter offer rejected tenders.');
      }

      if (timelineRes.ok && timelineData?.status === 'success') {
        setTimelineTenders(timelineData.data || []);
      } else {
        setError(prev => prev || timelineData?.message || 'Failed to load timeline tenders.');
      }

      if (cardsRes.ok && cardsData?.status === 'success') {
        setCardData(cardsData.data || {
          totalTenders: 0,
          totalActiveTenders: 0,
          totalApprovedTenders: 0,
          pendingFromAccountsTeam: 0,
          completedTenders: 0,
          rejectedTenders: 0
        });
      } else {
        setError(prev => prev || cardsData?.message || 'Failed to load tender card counts.');
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

  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveActionMenuId(null);
    };
    if (activeActionMenuId) {
      document.addEventListener('click', handleDocumentClick);
    }
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [activeActionMenuId]);

  const handleApproveTender = async (tenderId, approveStatus) => {
    setIsApproving(true);
    setApprovingAction(approveStatus ? 'approve' : 'reject');
    setSuccessMsg('');
    setErrorMsg('');
    const token = localStorage.getItem('token') || '';
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tenders/approve-tender/${tenderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approveStatus })
      });
      const resData = await response.json().catch(() => null);
      if (response.ok && resData?.status === 'success') {
        const actionLabel = approveStatus ? 'approved' : 'rejected';
        setSuccessMsg(resData?.message || `Tender ${actionLabel} successfully!`);
        setSelectedTender(null);
        await loadDashboardData();
        // Clear success message after 4 seconds
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const actionLabel = approveStatus ? 'approve' : 'reject';
        setErrorMsg(resData?.message || `Failed to ${actionLabel} tender.`);
      }
    } catch (err) {
      console.error(err);
      const actionLabel = approveStatus ? 'approve' : 'reject';
      setErrorMsg(`Network error. Failed to ${actionLabel} tender.`);
    } finally {
      setIsApproving(false);
      setApprovingAction(null);
    }
  };

  const openViewModal = (tender) => {
    setErrorMsg('');
    setSuccessMsg('');
    setSelectedTender(tender);
  };

  const handleApproveCounterOffer = async (tenderId, approveStatus) => {
    setIsApproving(true);
    setApprovingAction(approveStatus ? 'approve' : 'reject');
    setSuccessMsg('');
    setErrorMsg('');
    const token = localStorage.getItem('token') || '';
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tenders/approve-counter-offer-tender/${tenderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approveStatus })
      });
      const resData = await response.json().catch(() => null);
      if (response.ok && resData?.status === 'success') {
        const actionLabel = approveStatus ? 'approved' : 'rejected';
        setSuccessMsg(resData?.message || `Counter offer ${actionLabel} successfully!`);
        setSelectedTender(null);
        await loadDashboardData();
        // Clear success message after 4 seconds
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const actionLabel = approveStatus ? 'approve' : 'reject';
        setErrorMsg(resData?.message || `Failed to ${actionLabel} counter offer.`);
      }
    } catch (err) {
      console.error(err);
      const actionLabel = approveStatus ? 'approve' : 'reject';
      setErrorMsg(`Network error. Failed to ${actionLabel} counter offer.`);
    } finally {
      setIsApproving(false);
      setApprovingAction(null);
    }
  };

  const activeTenders =
    activeTab === 'Approval Requests'
      ? pendingTenders
      : activeTab === 'Approved Tenders'
        ? approvedTenders
        : activeTab === 'Rejected Tenders'
          ? rejectedTenders
          : activeTab === 'Counter Offer Requests'
            ? counterOfferTenders
            : activeTab === 'Counter Offer Approved'
              ? counterOfferApprovedTenders
              : activeTab === 'Time Line'
                ? timelineTenders
                : counterOfferRejectedTenders; // 'Counter Offer Rejected'


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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-2 mr-2 ml-2">
        {/* Total Tenders Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Tenders</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : cardData.totalTenders}
            </h3>
          </div>
          <div className="w-9 h-9 bg-purple-50 dark:bg-purple-950/30 text-purple-500 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>

        {/* Active Tenders Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Tenders</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : cardData.totalActiveTenders}
            </h3>
          </div>
          <div className="w-9 h-9 bg-sky-50 dark:bg-sky-950/30 text-sky-500 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        {/* Approved Tenders Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Approved Tenders</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : cardData.totalApprovedTenders}
            </h3>
          </div>
          <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        {/* Pending From Accounts Tenders Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending From Accounts Tenders</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : cardData.pendingFromAccountsTeam}
            </h3>
          </div>
          <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Completed Tenders Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completed Tenders</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : cardData.completedTenders}
            </h3>
          </div>
          <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>

        {/* Rejected Tenders Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Rejected Tenders</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : cardData.rejectedTenders}
            </h3>
          </div>
          <div className="w-9 h-9 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabs & Content container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Tab Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {['Approval Requests', 'Approved Tenders', 'Rejected Tenders', 'Counter Offer Requests', 'Counter Offer Approved', 'Counter Offer Rejected', 'Time Line'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setActiveActionMenuId(null);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === tab
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/10'
                  : 'bg-slate-50 hover:bg-slate-100/80 text-slate-650 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/80'
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
        <div className="overflow-x-auto pb-16">
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
          ) : activeTab === 'Time Line' ? (
            <MDTimelineTable tenders={activeTenders} onViewClick={openViewModal} />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
                  <th className="py-3.5 px-6">Tender ID</th>
                  <th className="py-3.5 px-4">Title &amp; Reference</th>
                  <th className="py-3.5 px-4">Organization</th>
                  {activeTab === 'Counter Offer Requests' && (
                    <th className="py-3.5 px-4">Deadline</th>
                  )}
                  <th className="py-3.5 px-4">Total Order Length</th>
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
                    <td className="py-4 px-6 text-sm font-semibold text-slate-800 dark:text-slate-355">
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
                    {activeTab === 'Counter Offer Requests' && (
                      <td className="py-4 px-4 text-sm font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {formatDeadline(tender.counter_offer?.counter_offer_deadline)}
                      </td>
                    )}
                    <td className="py-4 px-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {tender.cable_length_km} KM
                    </td>
                    <td className="py-4 px-4 text-sm">
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
                        {(activeTab === 'Approval Requests' || activeTab === 'Counter Offer Requests') && (
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveActionMenuId(activeActionMenuId === tender.id ? null : tender.id);
                              }}
                              className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs shadow-sky-500/10"
                            >
                              Actions
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {activeActionMenuId === tender.id && (
                              <div className="absolute right-0 mt-1 w-28 origin-top-right rounded-lg bg-white border border-slate-200 shadow-lg py-1 z-20 text-left">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (activeTab === 'Counter Offer Requests') {
                                      handleApproveCounterOffer(tender.id, true);
                                    } else {
                                      handleApproveTender(tender.id, true);
                                    }
                                    setActiveActionMenuId(null);
                                  }}
                                  disabled={isApproving}
                                  className="w-full px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer font-semibold text-left"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (activeTab === 'Counter Offer Requests') {
                                      handleApproveCounterOffer(tender.id, false);
                                    } else {
                                      handleApproveTender(tender.id, false);
                                    }
                                    setActiveActionMenuId(null);
                                  }}
                                  disabled={isApproving}
                                  className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-semibold text-left"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
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
          <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full ${(activeTab.startsWith('Counter Offer') || selectedTender.counter_offer || selectedTender.shortfall) ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-hidden flex flex-col scale-in duration-150`}>
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
                  {(() => {
                    const disp = getStatusDisplay(selectedTender);
                    const isEmerald = disp.color === 'emerald';
                    const isRose = disp.color === 'rose';
                    return (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        isEmerald
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                          : isRose
                            ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900'
                            : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-955/30 dark:text-amber-400 dark:border-amber-900'
                      }`}>
                        {disp.label}
                      </span>
                    );
                  })()}
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
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Order Length</span>
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

                {/* Courier Details */}
                {selectedTender.courier?.courier_status ? (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between animate-fadeIn">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Courier Status</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enabled</span>
                    </div>
                    {selectedTender.courier.added_at && (
                      <div className="text-right">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Sent Date</span>
                        <span className="text-xs font-semibold text-slate-650 dark:text-slate-400">{new Date(selectedTender.courier.added_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Submit to Govt Portal Details */}
                {selectedTender.submission_actual?.submission_actual_status ? (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Submit to Govt Portal Status</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enabled</span>
                      </div>
                      {selectedTender.submission_actual.added_at && (
                        <div className="text-right">
                          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Submission Date</span>
                          <span className="text-xs font-semibold text-slate-650 dark:text-slate-400">{new Date(selectedTender.submission_actual.added_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    {(selectedTender.submit_to_govt_portal_slip?.document_url || selectedTender.a9slip?.document_url) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-slate-200/50 dark:border-slate-800/50 pt-3 animate-fadeIn">
                        {selectedTender.submit_to_govt_portal_slip?.document_url && (
                          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                            <span className="truncate pr-2">Submission Slip</span>
                            <a href={selectedTender.submit_to_govt_portal_slip.document_url} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold uppercase shrink-0">View</a>
                          </div>
                        )}
                        {selectedTender.a9slip?.document_url && (
                          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                            <span className="truncate pr-2">A9 Slip</span>
                            <a href={selectedTender.a9slip.document_url} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold uppercase shrink-0">View</a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Shortfall Details */}
                {selectedTender.shortfall ? (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Shortfall Status</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-955/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900 rounded-full">Raised</span>
                    </div>
                    <div className="space-y-2">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Resubmitted Documents</span>
                      {selectedTender.docs_resubmitted && selectedTender.docs_resubmitted.length > 0 ? (
                        <div className="space-y-2">
                          {selectedTender.docs_resubmitted.map((doc, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg p-3 text-xs font-medium text-slate-700 dark:text-slate-300 animate-fadeIn">
                              <div className="flex-1 min-w-0">
                                <span className="block font-bold text-slate-800 dark:text-slate-200 truncate">{doc.document_name || doc.name || 'Uploaded Document'}</span>
                                {doc.reason && (
                                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-1 bg-slate-50/50 dark:bg-slate-850 p-1.5 rounded border border-slate-100/50 dark:border-slate-800/50">
                                    <span className="font-semibold text-slate-600 dark:text-slate-300">Changes:</span> {doc.reason}
                                  </span>
                                )}
                              </div>
                              <a href={doc.document_url || doc.url} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold uppercase shrink-0 self-end sm:self-center">View File</a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No shortfall documents uploaded.</span>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Rank File */}
                {selectedTender.rank_file ? (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between animate-fadeIn">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Tender Rank File</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {(() => {
                          const url = typeof selectedTender.rank_file === 'object'
                            ? selectedTender.rank_file?.document_url
                            : selectedTender.rank_file;
                          return url ? url.split('/').pop() : 'Rank File.xlsx';
                        })()}
                      </span>
                    </div>
                    <a
                      href={typeof selectedTender.rank_file === 'object' ? selectedTender.rank_file?.document_url : selectedTender.rank_file}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-xs"
                    >
                      Download Excel
                    </a>
                  </div>
                ) : null}

                {/* Counter Offer Details */}
                {selectedTender.counter_offer?.enabled || selectedTender.counter_offer?.counter_offer ? (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-355">Counter Offer Status</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 rounded-full">Enabled</span>
                    </div>

                    {(selectedTender.counter_offer?.sent_for_approval || selectedTender.counter_offer?.counter_offer_approve_by_md_at || selectedTender.counter_offer?.counter_offer_deadline) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800 pt-3 animate-fadeIn">
                        {selectedTender.counter_offer?.sent_for_approval && (
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Sent for Approval At</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {new Date(selectedTender.counter_offer.sent_for_approval_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {selectedTender.counter_offer?.counter_offer_deadline && (
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Deadline</span>
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                              {formatDeadline(selectedTender.counter_offer.counter_offer_deadline)}
                            </span>
                          </div>
                        )}
                        {selectedTender.counter_offer?.counter_offer_approve_by_md_at && (
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">MD Approval Status</span>
                            {selectedTender.counter_offer.counter_offer_approve_by_md ? (
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                Approved {selectedTender.counter_offer.counter_offer_approve_by_md_at ? `at ${new Date(selectedTender.counter_offer.counter_offer_approve_by_md_at).toLocaleString()}` : ''}
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                Rejected {selectedTender.counter_offer.counter_offer_approve_by_md_at ? `at ${new Date(selectedTender.counter_offer.counter_offer_approve_by_md_at).toLocaleString()}` : ''}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Counter Offer Documents</span>
                      {selectedTender.counter_offer.documents && selectedTender.counter_offer.documents.length > 0 ? (
                        <div className="space-y-2">
                          {selectedTender.counter_offer.documents.map((doc, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg p-3 text-xs font-medium text-slate-700 dark:text-slate-355 animate-fadeIn">
                              <div className="flex-1 min-w-0">
                                <span className="block font-bold text-slate-850 dark:text-slate-200 truncate">{doc.fileName || doc.url?.split('/').pop() || 'Uploaded Document'}</span>
                                {doc.remark && (
                                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-1 bg-slate-50/50 dark:bg-slate-850 p-1.5 rounded border border-slate-100/50 dark:border-slate-800/50">
                                    <span className="font-semibold text-slate-600 dark:text-slate-300">Remark:</span> {doc.remark}
                                  </span>
                                )}
                              </div>
                              <a href={doc.url} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold uppercase shrink-0 self-end sm:self-center">View File</a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No counter offer documents uploaded.</span>
                      )}
                    </div>

                    {(selectedTender.counter_offer?.acceptance_pdf || selectedTender.counter_offer?.non_acceptance_pdf) && (
                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Acceptance/Non Acceptance of Counter Offer File</span>
                        {selectedTender.counter_offer?.acceptance_pdf && (
                          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg p-3 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between animate-fadeIn">
                            <div className="flex-1 min-w-0">
                              <span className="block font-bold text-slate-800 dark:text-slate-200">Acceptance Counter Offer PDF</span>
                              <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{selectedTender.counter_offer.acceptance_pdf.split('/').pop()}</span>
                            </div>
                            <a href={selectedTender.counter_offer.acceptance_pdf} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold uppercase shrink-0">View</a>
                          </div>
                        )}
                        {selectedTender.counter_offer?.non_acceptance_pdf && (
                          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg p-3 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between animate-fadeIn">
                            <div className="flex-1 min-w-0">
                              <span className="block font-bold text-slate-800 dark:text-slate-200">Non Acceptance Counter Offer PDF</span>
                              <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{selectedTender.counter_offer.non_acceptance_pdf.split('/').pop()}</span>
                            </div>
                            <a href={selectedTender.counter_offer.non_acceptance_pdf} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold uppercase shrink-0">View</a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Tender Submission Documents */}
                {(selectedTender.fee_document || selectedTender.technical_document || selectedTender.boq_filled) ? (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3 animate-fadeIn">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-355 uppercase tracking-wide">Tender Submission Documents</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedTender.fee_document?.document_url && (
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                          <span className="truncate pr-2 text-slate-750">Fee Document</span>
                          <a href={selectedTender.fee_document.document_url} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold uppercase shrink-0">View</a>
                        </div>
                      )}
                      {selectedTender.technical_document?.document_url && (
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                          <span className="truncate pr-2 text-slate-750">Technical Document</span>
                          <a href={selectedTender.technical_document.document_url} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold uppercase shrink-0">View</a>
                        </div>
                      )}
                      {selectedTender.boq_filled?.document_url && (
                        <div className="col-span-1 sm:col-span-2 flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                          <span className="truncate pr-2 text-slate-750">BOQ Filled</span>
                          <a href={selectedTender.boq_filled.document_url} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold uppercase shrink-0">View</a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Timeline Trackers & SLAs */}
                {(() => {
                  const slas = calculateTenderSLAs(selectedTender);
                  return (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-xl space-y-4 animate-fadeIn">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-355 uppercase tracking-wide">Timeline Trackers &amp; SLAs</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* 1. Sent for Approval Card */}
                        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg space-y-1.5">
                          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Sent for Approval</span>
                          <div className="text-[11px] space-y-0.5 text-slate-650 dark:text-slate-355">
                            <div>
                              <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Planned:</span>
                              {slas.approval.planned ? formatToIST(slas.approval.planned) : 'NA'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Actual:</span>
                              {slas.approval.actual ? formatToIST(slas.approval.actual) : 'NA'}
                            </div>
                            <div className="pt-1">
                              <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Late:</span>
                              {slas.approval.status === 'NA' ? (
                                <span className="text-slate-400 font-semibold">NA</span>
                              ) : slas.approval.status === 'OnTime' ? (
                                <span className="text-emerald-600 font-bold">{slas.approval.label}</span>
                              ) : (
                                <span className={slas.approval.status === 'Late' ? "text-rose-600 font-bold" : "text-amber-600 font-bold"}>{slas.approval.label}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 2. Upload Submission Slip Card */}
                        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg space-y-1.5">
                          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Upload Submission Slip</span>
                          <div className="text-[11px] space-y-0.5 text-slate-650 dark:text-slate-355">
                            <div>
                              <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Planned:</span>
                              {slas.submissionSlip.planned ? formatToIST(slas.submissionSlip.planned) : 'NA'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Actual:</span>
                              {slas.submissionSlip.actual ? formatToIST(slas.submissionSlip.actual) : 'NA'}
                            </div>
                            <div className="pt-1">
                              <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Late:</span>
                              {slas.submissionSlip.status === 'NA' ? (
                                <span className="text-slate-400 font-semibold">NA</span>
                              ) : slas.submissionSlip.status === 'OnTime' ? (
                                <span className="text-emerald-600 font-bold">{slas.submissionSlip.label}</span>
                              ) : (
                                <span className={slas.submissionSlip.status === 'Late' ? "text-rose-600 font-bold" : "text-amber-600 font-bold"}>{slas.submissionSlip.label}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 3. MD CO Approval Card */}
                        {(selectedTender.counter_offer?.enabled || selectedTender.counter_offer?.counter_offer) && (
                          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg space-y-1.5">
                            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Counter Offer MD Approval</span>
                            <div className="text-[11px] space-y-0.5 text-slate-650 dark:text-slate-355">
                              <div>
                                <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Planned:</span>
                                {slas.mdCoApproval.planned ? formatToIST(slas.mdCoApproval.planned) : 'NA'}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Actual:</span>
                                {slas.mdCoApproval.actual ? formatToIST(slas.mdCoApproval.actual) : 'NA'}
                              </div>
                              <div className="pt-1">
                                <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Late:</span>
                                {slas.mdCoApproval.status === 'NA' ? (
                                  <span className="text-slate-400 font-semibold">NA</span>
                                ) : slas.mdCoApproval.status === 'OnTime' ? (
                                  <span className="text-emerald-600 font-bold">{slas.mdCoApproval.label}</span>
                                ) : (
                                  <span className={slas.mdCoApproval.status === 'Late' ? "text-rose-600 font-bold" : "text-amber-600 font-bold"}>{slas.mdCoApproval.label}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 4. Immediate Processing Documents Card */}
                        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg space-y-1.5">
                          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Immediate Processing Documents</span>
                          <div className="text-[11px] space-y-0.5 text-slate-650 dark:text-slate-355">
                            <div>
                              <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Planned:</span>
                              {slas.immediateDocs.planned ? formatToIST(slas.immediateDocs.planned) : 'NA'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Actual:</span>
                              {slas.immediateDocs.actual ? formatToIST(slas.immediateDocs.actual) : 'NA'}
                            </div>
                            <div className="pt-1">
                              <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Late:</span>
                              {slas.immediateDocs.status === 'NA' ? (
                                <span className="text-slate-400 font-semibold">NA</span>
                              ) : slas.immediateDocs.status === 'OnTime' ? (
                                <span className="text-emerald-600 font-bold">{slas.immediateDocs.label}</span>
                              ) : (
                                <span className={slas.immediateDocs.status === 'Late' ? "text-rose-600 font-bold" : "text-amber-600 font-bold"}>{slas.immediateDocs.label}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 5. Acceptance Letter After Document Processing Card */}
                        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg space-y-1.5">
                          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Acceptance Letter After Document Processing</span>
                          <div className="text-[11px] space-y-0.5 text-slate-650 dark:text-slate-355">
                            <div>
                              <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Planned:</span>
                              {slas.acceptanceLetter.planned ? formatToIST(slas.acceptanceLetter.planned) : 'NA'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Actual:</span>
                              {slas.acceptanceLetter.actual ? formatToIST(slas.acceptanceLetter.actual) : 'NA'}
                            </div>
                            <div className="pt-1">
                              <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Late:</span>
                              {slas.acceptanceLetter.status === 'NA' ? (
                                <span className="text-slate-400 font-semibold">NA</span>
                              ) : slas.acceptanceLetter.status === 'OnTime' ? (
                                <span className="text-emerald-600 font-bold">{slas.acceptanceLetter.label}</span>
                              ) : (
                                <span className={slas.acceptanceLetter.status === 'Late' ? "text-rose-600 font-bold" : "text-amber-600 font-bold"}>{slas.acceptanceLetter.label}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 6. Mark Completion After Acceptance Letter Timeline Card */}
                        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg space-y-1.5">
                          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Mark Completion After Acceptance Letter</span>
                          <div className="text-[11px] space-y-0.5 text-slate-650 dark:text-slate-355">
                            <div>
                              <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Planned:</span>
                              {slas.completion.planned ? formatToIST(slas.completion.planned) : 'NA'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Actual:</span>
                              {slas.completion.actual ? formatToIST(slas.completion.actual) : 'NA'}
                            </div>
                            <div className="pt-1">
                              <span className="font-semibold text-slate-400 uppercase text-[9px] mr-1">Late:</span>
                              {slas.completion.status === 'NA' ? (
                                <span className="text-slate-400 font-semibold">NA</span>
                              ) : slas.completion.status === 'OnTime' ? (
                                <span className="text-emerald-600 font-bold">{slas.completion.label}</span>
                              ) : (
                                <span className={slas.completion.status === 'Late' ? "text-rose-600 font-bold" : "text-amber-600 font-bold"}>{slas.completion.label}</span>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()}
            </div>
          </div>
            {/* Modal Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              {activeTab === 'Approval Requests' ? (
                <button
                  onClick={() => handleApproveTender(selectedTender.id, true)}
                  disabled={isApproving}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-450 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {isApproving && approvingAction === 'approve' ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
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
              ) : activeTab === 'Counter Offer Requests' ? (
                <div className="flex gap-2 animate-fadeIn">
                  <button
                    onClick={() => handleApproveCounterOffer(selectedTender.id, true)}
                    disabled={isApproving}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    {isApproving && approvingAction === 'approve' ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Approving...
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Approve Counter Offer
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleApproveCounterOffer(selectedTender.id, false)}
                    disabled={isApproving}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    {isApproving && approvingAction === 'reject' ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Reject Counter Offer
                      </>
                    )}
                  </button>
                </div>
              ) : (
                (() => {
                  const disp = getStatusDisplay(selectedTender);
                  const isEmerald = disp.color === 'emerald';
                  const isRose = disp.color === 'rose';
                  
                  if (isEmerald) {
                    return (
                      <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {disp.footerLabel}
                      </div>
                    );
                  } else if (isRose) {
                    return (
                      <div className="flex items-center gap-1 text-rose-600 text-xs font-bold">
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {disp.footerLabel}
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex items-center gap-1 text-amber-600 text-xs font-bold">
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {disp.footerLabel}
                      </div>
                    );
                  }
                })()
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
