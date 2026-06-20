import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

const DOCUMENT_NAMES = ["DD", "BG", "Online Payment"];

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

const AccountsTeamDashboard = () => {
    const [pendingTenders, setPendingTenders] = useState([]);
    const [completedTenders, setCompletedTenders] = useState([]);
    const [activeTab, setActiveTab] = useState('Pending Tenders');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedTender, setSelectedTender] = useState(null);

    // Document upload state for the modal
    const [formData, setFormData] = useState({ tender_documents: [{ name: 'DD', url: '' }] });
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
    const [saveErrorMsg, setSaveErrorMsg] = useState('');

    // Save document state for the upload form
    const [isSavingDoc, setIsSavingDoc] = useState(false);
    const [docSaveSuccess, setDocSaveSuccess] = useState('');
    const [docSaveError, setDocSaveError] = useState('');

    const openViewModal = (tender) => {
        setSelectedTender(tender);
        setSaveSuccessMsg('');
        setSaveErrorMsg('');
        setDocSaveSuccess('');
        setDocSaveError('');
        if (tender.payment_type) {
            if (Array.isArray(tender.payment_type)) {
                setFormData({
                    tender_documents: tender.payment_type.map(d => ({
                        name: d.type || 'DD',
                        url: d.doc_url || '',
                        fileName: d.doc_url ? d.doc_url.split('/').pop() : 'Uploaded.pdf'
                    }))
                });
            } else if (tender.payment_type.doc_url) {
                setFormData({
                    tender_documents: [{
                        name: tender.payment_type.type || 'DD',
                        url: tender.payment_type.doc_url,
                        fileName: tender.payment_type.doc_url.split('/').pop() || 'Uploaded.pdf'
                    }]
                });
            } else {
                setFormData({
                    tender_documents: [{ name: 'DD', url: '' }]
                });
            }
        } else {
            setFormData({
                tender_documents: [{ name: 'DD', url: '' }]
            });
        }
    };

    const addDocumentRow = () => {
        setFormData(prev => ({
            ...prev,
            tender_documents: [...prev.tender_documents, { name: 'DD', url: '' }]
        }));
    };

    const removeDocumentRow = (index) => {
        setFormData(prev => {
            const docs = [...prev.tender_documents];
            docs.splice(index, 1);
            return { ...prev, tender_documents: docs };
        });
    };

    const handleDocumentChange = (index, field, value) => {
        setFormData(prev => {
            const docs = [...prev.tender_documents];
            docs[index] = { ...docs[index], [field]: value };
            return { ...prev, tender_documents: docs };
        });
    };

    const handleFileUpload = async (index, file) => {
        if (!file) return;

        // Update uploading state for this row
        const updatedDocs = [...formData.tender_documents];
        updatedDocs[index].uploading = true;
        updatedDocs[index].error = '';
        updatedDocs[index].fileName = file.name;
        setFormData(prev => ({
            ...prev,
            tender_documents: updatedDocs
        }));

        const token = localStorage.getItem('token') || '';
        const uploadFormData = new FormData();
        uploadFormData.append('pdf-file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/tenders/upload-document`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: uploadFormData
            });

            const resData = await response.json().catch(() => null);

            if (response.ok && resData?.status === 'success') {
                const url = resData.data.url;
                setFormData(prev => {
                    const docs = [...prev.tender_documents];
                    docs[index].url = url;
                    docs[index].uploading = false;
                    docs[index].error = '';
                    return { ...prev, tender_documents: docs };
                });
            } else {
                const error = resData?.message || resData?.error || 'Upload failed';
                setFormData(prev => {
                    const docs = [...prev.tender_documents];
                    docs[index].uploading = false;
                    docs[index].error = error;
                    return { ...prev, tender_documents: docs };
                });
            }
        } catch (err) {
            console.error(err);
            setFormData(prev => {
                const docs = [...prev.tender_documents];
                docs[index].uploading = false;
                docs[index].error = `Upload error: ${err.message || err}`;
                return { ...prev, tender_documents: docs };
            });
        }
    };

    const handleSaveDocument = async () => {
        setIsSavingDoc(true);
        setDocSaveSuccess('');
        setDocSaveError('');

        const docs = formData.tender_documents;
        if (docs.length === 0 || !docs[0].url) {
            setDocSaveError('Please upload a document before saving.');
            setIsSavingDoc(false);
            return;
        }

        // Validate upload state
        for (let i = 0; i < docs.length; i++) {
            if (docs[i].uploading) {
                setDocSaveError(`Document #${i + 1} is still uploading. Please wait.`);
                setIsSavingDoc(false);
                return;
            }
        }

        const payload = {
            id: selectedTender.id,
            payment_type: docs.map(d => ({
                doc_url: d.url,
                type: d.name
            }))
        };

        const token = localStorage.getItem('token') || '';
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/tenders/accounts-team-tender-update`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const resData = await response.json().catch(() => null);

            if (response.ok && resData?.status === 'success') {
                setDocSaveSuccess('Document saved successfully!');

                // Update selectedTender in local state so the rest of the modal is sync'ed
                setSelectedTender(prev => ({
                    ...prev,
                    payment_type: docs.map(d => ({
                        doc_url: d.url,
                        type: d.name
                    }))
                }));

                // Refresh tenders lists
                await loadTendersData();
                setTimeout(() => setDocSaveSuccess(''), 3000);
            } else {
                setDocSaveError(resData?.message || 'Failed to save document.');
            }
        } catch (err) {
            console.error(err);
            setDocSaveError('Network error. Failed to save document.');
        } finally {
            setIsSavingDoc(false);
        }
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setSaveSuccessMsg('');
        setSaveErrorMsg('');

        // Form validation
        const docs = formData.tender_documents;
        if (docs.length === 0 || !docs[0].url) {
            setSaveErrorMsg('Please upload at least one document.');
            setIsSaving(false);
            return;
        }

        // Check if any row is still uploading
        for (let i = 0; i < docs.length; i++) {
            if (docs[i].uploading) {
                setSaveErrorMsg(`Document #${i + 1} is still uploading. Please wait.`);
                setIsSaving(false);
                return;
            }
        }

        const payload = {
            id: selectedTender.id
        };

        const token = localStorage.getItem('token') || '';
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/tenders/accounts-team-tender-mark-complete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const resData = await response.json().catch(() => null);

            if (response.ok && resData?.status === 'success') {
                setSaveSuccessMsg(resData?.message || 'Tender marked as complete successfully!');

                // Update selectedTender in local state
                setSelectedTender(prev => ({
                    ...prev,
                    is_accounts_team_work_done: true
                }));

                // Refresh tenders lists
                await loadTendersData();
                // Close modal after brief delay to show success notification
                setTimeout(() => {
                    setSelectedTender(null);
                    setSaveSuccessMsg('');
                }, 1500);
            } else {
                setSaveErrorMsg(resData?.message || 'Failed to mark tender as complete.');
            }
        } catch (err) {
            console.error(err);
            setSaveErrorMsg('Network error. Failed to mark tender as complete.');
        } finally {
            setIsSaving(false);
        }
    };

    const loadTendersData = useCallback(async () => {
        await Promise.resolve();
        setIsLoading(true);
        setError('');
        const token = localStorage.getItem('token') || '';
        try {
            const [pendingRes, completedRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/v1/tenders/get-tenders-accounts-team`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/v1/tenders/get-completed-tenders-accounts-team`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const pendingData = await pendingRes.json().catch(() => null);
            const completedData = await completedRes.json().catch(() => null);

            if (pendingRes.ok && pendingData?.status === 'success') {
                setPendingTenders(pendingData.data || []);
            } else {
                setError(pendingData?.message || 'Failed to load tenders for accounts team.');
            }

            if (completedRes.ok && completedData?.status === 'success') {
                setCompletedTenders(completedData.data || []);
            } else {
                setError(prev => prev || completedData?.message || 'Failed to load completed tenders for accounts team.');
            }
        } catch (err) {
            console.error(err);
            setError('Network error. Could not connect to API server.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTendersData();
    }, [loadTendersData]);

    const activeTenders = activeTab === 'Pending Tenders' ? pendingTenders : completedTenders;

    return (
        <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Pending Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending Tenders</span>
                        <h3 className="text-3xl font-extrabold text-slate-950 dark:text-white">
                            {isLoading ? '...' : pendingTenders.length}
                        </h3>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                {/* Completed Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completed Tenders</span>
                        <h3 className="text-3xl font-extrabold text-slate-950 dark:text-white">
                            {isLoading ? '...' : completedTenders.length}
                        </h3>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Tabs & Content container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                {/* Tab Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex gap-2">
                        {['Pending Tenders', 'Completed Tenders'].map((tab) => (
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
                        onClick={loadTendersData}
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
                                    onClick={loadTendersData}
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
                                            <button
                                                onClick={() => openViewModal(tender)}
                                                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-slate-100 dark:border-slate-800 ml-auto"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View Details
                                            </button>
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
                            {saveErrorMsg && (
                                <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-4 rounded-xl flex items-center gap-2.5 shadow-sm animate-fadeIn">
                                    <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span className="font-semibold">{saveErrorMsg}</span>
                                </div>
                            )}

                            {saveSuccessMsg && (
                                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-4 rounded-xl flex items-center gap-2.5 shadow-sm animate-fadeIn">
                                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-semibold">{saveSuccessMsg}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-950 dark:text-white">{selectedTender.tender_title}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase mt-0.5">{selectedTender.tender_organization}</p>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-450 dark:border-indigo-900">
                                        Accounts Review
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
                                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Tender Fee / EMD</span>
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">₹{Number(selectedTender.tender_fee_inr || 0).toFixed(2)} / ₹{Number(selectedTender.emd_inr || 0).toFixed(2)}</span>
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

                                {/* Tender Documents Upload Utility */}
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Upload Accounts Documents</h3>
                                        <button
                                            type="button"
                                            onClick={addDocumentRow}
                                            className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1 cursor-pointer"
                                        >
                                            <svg className="w-3.5 h-3.5 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add Document
                                        </button>
                                    </div>

                                    {docSaveError && (
                                        <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-3 rounded-lg flex items-center gap-2 animate-fadeIn">
                                            <span className="font-semibold">{docSaveError}</span>
                                        </div>
                                    )}

                                    {docSaveSuccess && (
                                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2 animate-fadeIn">
                                            <span className="font-semibold">{docSaveSuccess}</span>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {formData.tender_documents.map((doc, idx) => (
                                            <div key={idx} className="flex gap-3 items-end bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
                                                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {/* Document Name Dropdown */}
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Document Name <span className="text-rose-500">*</span></label>
                                                        <select
                                                            value={doc.name}
                                                            onChange={(e) => handleDocumentChange(idx, 'name', e.target.value)}
                                                            required
                                                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded text-xs focus:outline-none focus:border-sky-500"
                                                        >
                                                            {DOCUMENT_NAMES.map(name => (
                                                                <option key={name} value={name}>{name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Document PDF Upload */}
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Document PDF <span className="text-rose-500">*</span></label>
                                                        <div className="flex items-center gap-2">
                                                            {doc.uploading ? (
                                                                <div className="flex items-center gap-1.5 py-1.5 text-xs text-slate-500 font-medium">
                                                                    <svg className="animate-spin h-3.5 w-3.5 text-sky-500" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                    </svg>
                                                                    Uploading PDF...
                                                                </div>
                                                            ) : doc.url ? (
                                                                <div className="flex-1 flex items-center justify-between bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950 rounded px-2.5 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium truncate">
                                                                    <span className="truncate flex items-center gap-1">
                                                                        <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                        {doc.fileName || 'Uploaded.pdf'}
                                                                    </span>
                                                                    <a
                                                                        href={doc.url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-[10px] text-sky-500 hover:text-sky-600 font-bold ml-2 shrink-0 uppercase"
                                                                    >
                                                                        View
                                                                    </a>
                                                                </div>
                                                            ) : (
                                                                <div className="flex-1 text-slate-400 dark:text-slate-500 italic text-xs py-1.5">No file uploaded</div>
                                                            )}

                                                            {!doc.uploading && (
                                                                <div>
                                                                    <label
                                                                        htmlFor={`file-upload-${idx}`}
                                                                        className="cursor-pointer bg-white dark:bg-slate-900 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs text-sky-600 dark:text-sky-450 hover:bg-sky-50/50 hover:border-sky-300 transition-all font-semibold shadow-xs flex items-center gap-1 shrink-0"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                                        </svg>
                                                                        {doc.url ? 'Replace' : 'Upload'}
                                                                    </label>
                                                                    <input
                                                                        id={`file-upload-${idx}`}
                                                                        type="file"
                                                                        accept=".pdf"
                                                                        className="hidden"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) handleFileUpload(idx, file);
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {doc.error && (
                                                            <p className="text-[10px] text-rose-500 font-medium mt-1">{doc.error}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {formData.tender_documents.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDocumentRow(idx)}
                                                        className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer mb-0.5"
                                                        title="Delete Row"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Save Document button for this form */}
                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="button"
                                            onClick={handleSaveDocument}
                                            disabled={isSavingDoc}
                                            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-400 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                        >
                                            {isSavingDoc ? 'Saving Document...' : 'Save Document'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                            <button
                                onClick={handleSaveChanges}
                                disabled={isSaving || selectedTender.is_accounts_team_work_done}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-450 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Saving...
                                    </>
                                ) : selectedTender.is_accounts_team_work_done ? (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Completed
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Mark As Complete
                                    </>
                                )}
                            </button>
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
};

export default AccountsTeamDashboard;