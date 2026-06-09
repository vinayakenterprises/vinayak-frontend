import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const TABS = [
  { id: 'Active Tenders', label: 'Active Tenders', statusValue: 'Active' },
  { id: 'Pending MD Approval', label: 'Pending MD Approval', statusValue: 'Pending MD Approval' },
  { id: 'Rejected Tender', label: 'Rejected Tender', statusValue: 'Rejected' },
  { id: 'Shortfall Raised', label: 'Shortfall Raised', statusValue: 'Shortfall Raised' },
  { id: 'Submitted Tenders', label: 'Complete Tenders', statusValue: 'Submitted' },
  { id: 'Assigned by Accounts Team', label: 'Assigned by Accounts Team', statusValue: 'AssignedByAccountsTeam' }
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const DOCUMENT_NAMES = ["Spec", "GCC", "IIB", "Notice", "BOQ"];

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

export default function TendersListView() {
  const [tenders, setTenders] = useState([]);
  const [activeTab, setActiveTab] = useState('Active Tenders');
  const [isLoadingTenders, setIsLoadingTenders] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTender, setSelectedTender] = useState(null);

  // Approval states
  const [isSendingApproval, setIsSendingApproval] = useState(false);
  const [approvalError, setApprovalError] = useState('');
  const [approvalSuccess, setApprovalSuccess] = useState('');

  // Details update states (Assigned by Accounts Team tab)
  const [detailsForm, setDetailsForm] = useState({
    shortfall: false,
    docs_resubmitted: [],
    rank_file: '',
    rank_fileName: '',
    counter_offer: {
      enabled: false,
      documents: []
    },
    loi: '',
    loi_fileName: '',
    po: '',
    po_fileName: '',
    contract_agreement: '',
    contract_agreement_fileName: '',
    warranty: '',
    warranty_fileName: '',
    acceptance_letter: '',
    acceptance_letter_fileName: ''
  });
  const [detailsUploadProgress, setDetailsUploadProgress] = useState({});
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [detailsSaveError, setDetailsSaveError] = useState('');
  const [detailsSaveSuccess, setDetailsSaveSuccess] = useState('');

  // Dropdown menu state for specific row
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Fetch tenders on mount
  const loadTenders = async () => {
    setIsLoadingTenders(true);
    setFetchError('');
    const token = localStorage.getItem('token') || '';

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tenders/get-all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const resData = await response.json().catch(() => null);

      if (response.ok && resData?.status === 'success') {
        const mapped = (resData.data || []).map(t => {
          if (t.submission_actual !== undefined && t.submission_actual !== null && t.submission_actual !== '') {
            return {
              ...t,
              status: 'Submitted'
            };
          }
          if (t.is_accounts_team_work_done && Number(t.tender_stage) === 4) {
            return {
              ...t,
              status: 'AssignedByAccountsTeam'
            };
          }
          if (t.send_for_approaval && t.tender_stage == 2) {
            return {
              ...t,
              status: 'Pending MD Approval'
            };
          }
          return {
            ...t,
            status: 'Active'
          };
        });

        console.log('mapped', mapped);
        setTenders(mapped);
      } else {
        setFetchError(resData?.message || resData?.error || 'Failed to retrieve tenders from server.');
      }
    } catch (err) {
      console.error(err);
      setFetchError(`Network error: ${err.message || err}. Could not connect to API server.`);
    } finally {
      setIsLoadingTenders(false);
    }
  };

  useEffect(() => {
    loadTenders();
  }, []);

  // Form state
  const initialFormState = {
    tender_id: '',
    tender_ref_no: '',
    tender_title: '',
    tender_organization: '',
    cable_length_km: '',
    publish_date: '',
    closing_date: '',
    tender_value_cr: '',
    tender_fee_inr: '',
    emd_inr: '',
    state: 'Uttar Pradesh',
    status: 'Active',
    tender_documents: [{ name: 'Spec', url: '', uploading: false, error: '', fileName: '' }]
  };
  const [formData, setFormData] = useState(initialFormState);

  // Loading & Error States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Handle simple input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Document array handlers
  const handleDocumentChange = (index, field, value) => {
    const updatedDocs = [...formData.tender_documents];
    updatedDocs[index][field] = value;
    setFormData(prev => ({
      ...prev,
      tender_documents: updatedDocs
    }));
  };

  const addDocumentRow = () => {
    setFormData(prev => ({
      ...prev,
      tender_documents: [...prev.tender_documents, { name: 'Spec', url: '', uploading: false, error: '', fileName: '' }]
    }));
  };

  const removeDocumentRow = (index) => {
    if (formData.tender_documents.length <= 1) return;
    const updatedDocs = formData.tender_documents.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      tender_documents: updatedDocs
    }));
  };

  // Async document file upload handler
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

  // Open Edit Modal
  const openEditModal = (tender) => {
    setFormData({
      ...tender,
      cable_length_km: tender.cable_length_km.toString(),
      tender_value_cr: tender.tender_value_cr.toString(),
      tender_fee_inr: tender.tender_fee_inr.toString(),
      emd_inr: tender.emd_inr.toString(),
      // Ensure documents array exists
      tender_documents: tender.tender_documents && tender.tender_documents.length > 0
        ? tender.tender_documents
        : [{ name: '', url: '' }]
    });
    setSelectedTender(tender);
    setIsEditModalOpen(true);
    setActiveActionMenuId(null);
  };

  // Open View Modal
  const openViewModal = (tender) => {
    setSelectedTender(tender);
    setApprovalError('');
    setApprovalSuccess('');
    setDetailsSaveError('');
    setDetailsSaveSuccess('');
    setDetailsUploadProgress({});

    setDetailsForm({
      shortfall: !!tender.shortfall,
      docs_resubmitted: Array.isArray(tender.docs_resubmitted)
        ? tender.docs_resubmitted.map(d => ({
          ...d,
          uploading: false,
          error: '',
          fileName: d.name || d.fileName || d.url?.split('/').pop() || 'Uploaded.pdf'
        }))
        : [],
      rank_file: tender.rank_file || '',
      rank_fileName: tender.rank_file ? (tender.rank_file_name || tender.rank_file.split('/').pop()) : '',
      counter_offer: (() => {
        if (!tender.counter_offer || typeof tender.counter_offer !== 'object') {
          return { enabled: false, documents: [] };
        }
        const enabled = !!tender.counter_offer.enabled;
        let documents = [];
        if (Array.isArray(tender.counter_offer.documents)) {
          documents = tender.counter_offer.documents.map(d => ({
            tag: d.tag || 'counter price',
            url: d.url || '',
            uploading: false,
            error: '',
            fileName: d.fileName || d.url?.split('/').pop() || 'Uploaded.pdf'
          }));
        } else if (tender.counter_offer.doc_url) {
          // Fallback mapping from old schema format
          documents = [{
            tag: Array.isArray(tender.counter_offer.tags) && tender.counter_offer.tags.length > 0
              ? tender.counter_offer.tags[0]
              : 'counter price',
            url: tender.counter_offer.doc_url,
            uploading: false,
            error: '',
            fileName: tender.counter_offer.fileName || tender.counter_offer.doc_url.split('/').pop() || 'Uploaded.pdf'
          }];
        }
        return { enabled, documents };
      })(),
      loi: tender.loi || '',
      loi_fileName: tender.loi ? (tender.loi_name || tender.loi.split('/').pop()) : '',
      po: tender.po || '',
      po_fileName: tender.po ? (tender.po_name || tender.po.split('/').pop()) : '',
      contract_agreement: tender.contract_agreement || '',
      contract_agreement_fileName: tender.contract_agreement ? (tender.contract_agreement_name || tender.contract_agreement.split('/').pop()) : '',
      warranty: tender.warranty || '',
      warranty_fileName: tender.warranty ? (tender.warranty_name || tender.warranty.split('/').pop()) : '',
      acceptance_letter: tender.acceptance_letter || '',
      acceptance_letter_fileName: tender.acceptance_letter ? (tender.acceptance_letter_name || tender.acceptance_letter.split('/').pop()) : ''
    });

    setIsViewModalOpen(true);
    setActiveActionMenuId(null);
  };

  // Helper for single document / rank file uploads
  const handleDetailsSingleFileUpload = async (field, file) => {
    if (!file) return;

    // Excel vs PDF validation
    if (field === 'rank_file') {
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls') {
        setDetailsUploadProgress(prev => ({
          ...prev,
          [field]: { uploading: false, error: 'Only Excel files (.xlsx, .xls) are allowed.' }
        }));
        return;
      }
    } else {
      if (file.type !== 'application/pdf') {
        setDetailsUploadProgress(prev => ({
          ...prev,
          [field]: { uploading: false, error: 'Only PDF files (.pdf) are allowed.' }
        }));
        return;
      }
    }

    setDetailsUploadProgress(prev => ({
      ...prev,
      [field]: { uploading: true, error: '', fileName: file.name }
    }));

    const token = localStorage.getItem('token') || '';
    const uploadFormData = new FormData();
    uploadFormData.append('pdf-file', file); // API expects 'pdf-file' key

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
        setDetailsForm(prev => {
          if (field === 'counter_offer') {
            return {
              ...prev,
              counter_offer: {
                ...prev.counter_offer,
                doc_url: url,
                fileName: file.name
              }
            };
          }
          return {
            ...prev,
            [field]: url,
            [`${field}_fileName`]: file.name
          };
        });
        setDetailsUploadProgress(prev => ({
          ...prev,
          [field]: { uploading: false, error: '', fileName: file.name }
        }));
      } else {
        const error = resData?.message || resData?.error || 'Upload failed';
        setDetailsUploadProgress(prev => ({
          ...prev,
          [field]: { uploading: false, error }
        }));
      }
    } catch (err) {
      console.error(err);
      setDetailsUploadProgress(prev => ({
        ...prev,
        [field]: { uploading: false, error: `Upload error: ${err.message || err}` }
      }));
    }
  };

  // Resubmitted documents handlers (Shortfall)
  const handleDocsResubmittedChange = (index, field, value) => {
    const updatedDocs = [...detailsForm.docs_resubmitted];
    updatedDocs[index][field] = value;
    setDetailsForm(prev => ({
      ...prev,
      docs_resubmitted: updatedDocs
    }));
  };

  const addDocsResubmittedRow = () => {
    setDetailsForm(prev => ({
      ...prev,
      docs_resubmitted: [...prev.docs_resubmitted, { name: 'Spec', url: '', uploading: false, error: '', fileName: '' }]
    }));
  };

  const removeDocsResubmittedRow = (index) => {
    const updatedDocs = detailsForm.docs_resubmitted.filter((_, i) => i !== index);
    setDetailsForm(prev => ({
      ...prev,
      docs_resubmitted: updatedDocs
    }));
  };

  const handleDocsResubmittedUpload = async (index, file) => {
    if (!file) return;

    // Check PDF only
    if (file.type !== 'application/pdf') {
      const docs = [...detailsForm.docs_resubmitted];
      docs[index].error = 'Only PDF files (.pdf) are allowed.';
      setDetailsForm(prev => ({ ...prev, docs_resubmitted: docs }));
      return;
    }

    const updatedDocs = [...detailsForm.docs_resubmitted];
    updatedDocs[index].uploading = true;
    updatedDocs[index].error = '';
    updatedDocs[index].fileName = file.name;
    setDetailsForm(prev => ({
      ...prev,
      docs_resubmitted: updatedDocs
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
        setDetailsForm(prev => {
          const docs = [...prev.docs_resubmitted];
          docs[index].url = url;
          docs[index].uploading = false;
          docs[index].error = '';
          return { ...prev, docs_resubmitted: docs };
        });
      } else {
        const error = resData?.message || resData?.error || 'Upload failed';
        setDetailsForm(prev => {
          const docs = [...prev.docs_resubmitted];
          docs[index].uploading = false;
          docs[index].error = error;
          return { ...prev, docs_resubmitted: docs };
        });
      }
    } catch (err) {
      console.error(err);
      setDetailsForm(prev => {
        const docs = [...prev.docs_resubmitted];
        docs[index].uploading = false;
        docs[index].error = `Upload error: ${err.message || err}`;
        return { ...prev, docs_resubmitted: docs };
      });
    }
  };

  // Counter Offer dynamic documents list handlers
  const handleCounterOfferDocChange = (index, field, value) => {
    const updatedDocs = [...detailsForm.counter_offer.documents];
    updatedDocs[index][field] = value;
    setDetailsForm(prev => ({
      ...prev,
      counter_offer: {
        ...prev.counter_offer,
        documents: updatedDocs
      }
    }));
  };

  const addCounterOfferDocRow = () => {
    setDetailsForm(prev => ({
      ...prev,
      counter_offer: {
        ...prev.counter_offer,
        documents: [...prev.counter_offer.documents, { tag: 'counter price', url: '', uploading: false, error: '', fileName: '' }]
      }
    }));
  };

  const removeCounterOfferDocRow = (index) => {
    const updatedDocs = detailsForm.counter_offer.documents.filter((_, i) => i !== index);
    setDetailsForm(prev => ({
      ...prev,
      counter_offer: {
        ...prev.counter_offer,
        documents: updatedDocs
      }
    }));
  };

  const handleCounterOfferDocUpload = async (index, file) => {
    if (!file) return;

    // Check PDF only
    if (file.type !== 'application/pdf') {
      const docs = [...detailsForm.counter_offer.documents];
      docs[index].error = 'Only PDF files (.pdf) are allowed.';
      setDetailsForm(prev => ({
        ...prev,
        counter_offer: {
          ...prev.counter_offer,
          documents: docs
        }
      }));
      return;
    }

    const updatedDocs = [...detailsForm.counter_offer.documents];
    updatedDocs[index].uploading = true;
    updatedDocs[index].error = '';
    updatedDocs[index].fileName = file.name;
    setDetailsForm(prev => ({
      ...prev,
      counter_offer: {
        ...prev.counter_offer,
        documents: updatedDocs
      }
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
        setDetailsForm(prev => {
          const docs = [...prev.counter_offer.documents];
          docs[index].url = url;
          docs[index].uploading = false;
          docs[index].error = '';
          return {
            ...prev,
            counter_offer: {
              ...prev.counter_offer,
              documents: docs
            }
          };
        });
      } else {
        const error = resData?.message || resData?.error || 'Upload failed';
        setDetailsForm(prev => {
          const docs = [...prev.counter_offer.documents];
          docs[index].uploading = false;
          docs[index].error = error;
          return {
            ...prev,
            counter_offer: {
              ...prev.counter_offer,
              documents: docs
            }
          };
        });
      }
    } catch (err) {
      console.error(err);
      setDetailsForm(prev => {
        const docs = [...prev.counter_offer.documents];
        docs[index].uploading = false;
        docs[index].error = `Upload error: ${err.message || err}`;
        return {
          ...prev,
          counter_offer: {
            ...prev.counter_offer,
            documents: docs
          }
        };
      });
    }
  };

  // Save/Update Details to backend
  const handleSaveTenderDetails = async (isMarkComplete = false) => {
    setIsSavingDetails(true);
    setDetailsSaveError('');
    setDetailsSaveSuccess('');

    // Check if any files are still uploading
    const uploadingDocs = detailsForm.docs_resubmitted.some(d => d.uploading);
    const uploadingCounterOffer = detailsForm.counter_offer.documents.some(d => d.uploading);
    const uploadingSingle = Object.values(detailsUploadProgress).some(p => p.uploading);
    if (uploadingDocs || uploadingCounterOffer || uploadingSingle) {
      setDetailsSaveError('Please wait for all file uploads to complete before saving.');
      setIsSavingDetails(false);
      return;
    }

    const currentTimestamp = new Date();
    const payload = {
      id: selectedTender.id,
      shortfall: detailsForm.shortfall,
      docs_resubmitted: detailsForm.shortfall
        ? detailsForm.docs_resubmitted.map(d => ({ name: d.name, url: d.url }))
        : [],
      rank_file: detailsForm.rank_file || null,
      counter_offer: {
        enabled: detailsForm.counter_offer.enabled,
        documents: detailsForm.counter_offer.enabled
          ? detailsForm.counter_offer.documents.map(d => ({ tag: d.tag, url: d.url }))
          : []
      },
      loi: detailsForm.loi || null,
      po: detailsForm.po || null,
      contract_agreement: detailsForm.contract_agreement || null,
      warranty: detailsForm.warranty || null,
      acceptance_letter: detailsForm.acceptance_letter || null,
      ...(isMarkComplete ? { submission_actual: currentTimestamp } : {})
    };

    const token = localStorage.getItem('token') || '';

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tenders/update-tender-details`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json().catch(() => null);

      if (response.ok && resData?.status === 'success') {
        const successMsg = isMarkComplete
          ? 'Tender details updated and marked as complete successfully!'
          : 'Tender details updated successfully!';
        setDetailsSaveSuccess(successMsg);

        // Refresh local selectedTender so any display in the modal gets synced
        setSelectedTender(prev => {
          if (!prev) return null;
          return {
            ...prev,
            shortfall: payload.shortfall,
            docs_resubmitted: payload.docs_resubmitted,
            rank_file: payload.rank_file,
            counter_offer: payload.counter_offer,
            loi: payload.loi,
            po: payload.po,
            contract_agreement: payload.contract_agreement,
            warranty: payload.warranty,
            acceptance_letter: payload.acceptance_letter,
            ...(isMarkComplete ? { submission_actual: currentTimestamp } : {})
          };
        });

        // Reload the main dashboard list
        await loadTenders();

        setTimeout(() => {
          setDetailsSaveSuccess('');
        }, 3000);
      } else {
        setDetailsSaveError(resData?.message || resData?.error || 'Failed to update tender details.');
      }
    } catch (err) {
      console.error(err);
      setDetailsSaveError(`Network error: ${err.message || err}. Could not connect to API server.`);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const isTenderCompleted = selectedTender?.submission_actual != null;

  const renderSingleFileUploadDetails = (field, label, accept = ".pdf") => {
    const fileUrl = detailsForm[field];
    const fileName = detailsForm[`${field}_fileName`];
    const progress = detailsUploadProgress[field] || {};
    const isCompleted = isTenderCompleted;

    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-705 uppercase tracking-wide">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {progress.uploading ? (
            <div className="flex-1 flex items-center gap-1.5 py-2 px-3 border border-slate-200 rounded-lg text-xs text-slate-500 font-medium bg-slate-50/50">
              <svg className="animate-spin h-3.5 w-3.5 text-sky-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Uploading...
            </div>
          ) : fileUrl ? (
            <div className="flex-1 flex items-center justify-between bg-emerald-50/70 border border-emerald-100 rounded-lg px-3 py-1.5 text-xs text-emerald-800 font-medium truncate">
              <span className="truncate flex items-center gap-1.5">
                <svg className="w-4.5 h-4.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {fileName || 'Uploaded file'}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-sky-500 hover:text-sky-655 font-bold uppercase"
                >
                  View
                </a>
                {!isCompleted && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailsForm(prev => ({ ...prev, [field]: '', [`${field}_fileName`]: '' }));
                    }}
                    className="text-rose-500 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                    title="Remove file"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 text-slate-400 italic text-xs py-2 px-3 border border-slate-150 border-dashed rounded-lg bg-slate-50/20 select-none">
              No file uploaded
            </div>
          )}

          {!progress.uploading && !isCompleted && (
            <div>
              <label
                htmlFor={`details-upload-${field}`}
                className="cursor-pointer bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-sky-600 hover:bg-sky-50/50 hover:border-sky-300 transition-all font-semibold shadow-xs flex items-center gap-1 shrink-0 whitespace-nowrap h-[34px]"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {fileUrl ? 'Replace' : 'Upload'}
              </label>
              <input
                id={`details-upload-${field}`}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDetailsSingleFileUpload(field, file);
                }}
              />
            </div>
          )}
        </div>
        {progress.error && (
          <p className="text-[10px] text-rose-500 font-semibold mt-0.5">{progress.error}</p>
        )}
      </div>
    );
  };

  // Send Tender for Approval
  const handleSendForApproval = async (tender) => {
    setIsSendingApproval(true);
    setApprovalError('');
    setApprovalSuccess('');
    const token = localStorage.getItem('token') || '';
    const tenderId = tender.id || tender.tender_id;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tenders/send-for-approval/${tenderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const resData = await response.json().catch(() => null);

      if (response.ok) {
        setApprovalSuccess(resData?.message || 'Tender sent for approval successfully!');
        setSelectedTender(prev => prev ? { ...prev, send_for_approaval: true } : null);
        // Refresh tenders list
        loadTenders();
      } else {
        setApprovalError(resData?.message || resData?.error || 'Failed to send tender for approval.');
      }
    } catch (err) {
      console.error(err);
      setApprovalError(`Network error: ${err.message || err}. Could not connect to API server.`);
    } finally {
      setIsSendingApproval(false);
    }
  };

  // Delete Tender
  const handleDeleteTender = async (id, displayId) => {
    const confirmed = window.confirm(`Are you sure you want to delete tender ${displayId}?`);
    if (!confirmed) {
      setActiveActionMenuId(null);
      return;
    }

    const token = localStorage.getItem('token') || '';
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tenders/delete-tender/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const resData = await response.json().catch(() => null);

      if (response.ok && resData?.status === 'success') {
        setTenders(prev => prev.filter(t => (t.id || t.tender_id) !== id));
        alert(resData?.message || 'Tender deleted successfully');
      } else {
        console.error('[Delete Tender] Backend deletion failed:', resData);
        alert(resData?.message || resData?.error || 'Failed to delete tender.');
      }
    } catch (err) {
      console.error('[Delete Tender] Network error occurred:', err);
      alert(`Network error: ${err.message || err}. Failed to connect to server.`);
    } finally {
      setActiveActionMenuId(null);
    }
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true);

    // Client-side validations
    if (!formData.tender_id.trim() || !formData.tender_ref_no.trim() || !formData.tender_title.trim() ||
      !formData.tender_organization.trim() || !formData.cable_length_km || !formData.publish_date ||
      !formData.closing_date || !formData.tender_value_cr || !formData.tender_fee_inr ||
      !formData.emd_inr || !formData.state) {
      setSubmitError('All fields are required.');
      setIsSubmitting(false);
      return;
    }

    // Validate documents
    for (let i = 0; i < formData.tender_documents.length; i++) {
      const doc = formData.tender_documents[i];
      if (doc.uploading) {
        setSubmitError(`Document #${i + 1} is still uploading. Please wait for it to complete.`);
        setIsSubmitting(false);
        return;
      }
      if (!doc.name) {
        setSubmitError(`Please specify the document type for Document #${i + 1}.`);
        setIsSubmitting(false);
        return;
      }
      if (!doc.url) {
        setSubmitError(`Please upload a PDF file for Document #${i + 1}.`);
        setIsSubmitting(false);
        return;
      }
      // Validate S3 URL format
      try {
        new URL(doc.url);
      } catch {
        setSubmitError(`Document #${i + 1} S3 URL is not valid.`);
        setIsSubmitting(false);
        return;
      }
    }

    // Format payload
    const payload = {
      tender_id: formData.tender_id,
      tender_ref_no: formData.tender_ref_no,
      tender_documents: formData.tender_documents.map(d => ({ name: d.name, url: d.url })),
      tender_title: formData.tender_title,
      tender_organization: formData.tender_organization,
      cable_length_km: Number(formData.cable_length_km),
      publish_date: formData.publish_date,
      closing_date: formData.closing_date,
      tender_value_cr: Number(formData.tender_value_cr),
      tender_fee_inr: Number(formData.tender_fee_inr),
      emd_inr: Number(formData.emd_inr),
      state: formData.state
    };

    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE_URL}/api/v1/tenders/create-tender`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json().catch(() => null);

      if (response.ok) {
        setSubmitSuccess('Tender created successfully!');

        // Refresh tenders from backend
        loadTenders();

        // Reset form & close modal after delay
        setTimeout(() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setFormData(initialFormState);
          setSubmitSuccess('');
        }, 1500);

      } else {
        const errorMsg = responseData?.message || responseData?.error || 'Failed to submit tender. Please try again.';
        setSubmitError(errorMsg);
      }
    } catch (err) {
      console.error(err);
      setSubmitError(`API request failed: ${err.message || err}. (Mock mode: You can still close and see the tender locally if required)`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter tenders based on selected tab's status mapping
  const selectedTabObj = TABS.find(t => t.id === activeTab);
  const filteredTenders = tenders.filter(t => t.status === selectedTabObj?.statusValue);

  return (
    <>
      <div className="w-full px-4 md:px-8 py-6 space-y-6">
        {/* Title & Add Button */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tender Management</h1>
          <button
            onClick={() => {
              setFormData({
                ...initialFormState,
                status: selectedTabObj ? selectedTabObj.statusValue : 'Active'
              });
              setSubmitError('');
              setSubmitSuccess('');
              setIsAddModalOpen(true);
            }}
            className="bg-sky-500 hover:bg-sky-600 active:scale-98 text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm cursor-pointer"
          >
            <svg className="w-4 h-4 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Tender
          </button>
        </div>

        {/* Tabs list */}
        <div className="border border-slate-200 bg-white p-1 rounded-xl shadow-sm overflow-x-auto scrollbar-none flex gap-1">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const count = tenders.filter(t => t.status === tab.statusValue).length;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setActiveActionMenuId(null);
                }}
                className={`flex-1 min-w-max text-center py-2.5 px-4 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${isActive
                  ? 'bg-slate-50 text-sky-600 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-800'
                  }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ms-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tenders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto pb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200">
                  <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Tender ID</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Reference Number</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Project Name</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Organization</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Cable Length</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">State</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Publish Date</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Closing Date</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Tender Value</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Tender Fee / EMD</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingTenders ? (
                  <tr>
                    <td colSpan="11" className="py-12 px-6 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <svg className="animate-spin h-7 w-7 text-sky-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-xs font-semibold text-slate-500">Fetching tenders from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : fetchError ? (
                  <tr>
                    <td colSpan="11" className="py-12 px-6 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2 text-rose-600">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-xs font-bold">Failed to load tenders</span>
                        <p className="text-[11px] text-slate-500 max-w-md">{fetchError}</p>
                        <button
                          onClick={loadTenders}
                          className="mt-2 text-[10px] font-bold text-sky-500 bg-sky-50 hover:bg-sky-100/75 border border-sky-100 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          Retry Fetch
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredTenders.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="py-12 px-6 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="p-3 bg-slate-50 rounded-full text-slate-400">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-700">No tenders available</h3>
                        <p className="text-xs text-slate-500 max-w-xs">There are no tenders listed in this category right now. Click "Add Tender" to create one.</p>
                        <button
                          onClick={() => {
                            setFormData({
                              ...initialFormState,
                              status: selectedTabObj ? selectedTabObj.statusValue : 'Active'
                            });
                            setSubmitError('');
                            setSubmitSuccess('');
                            setIsAddModalOpen(true);
                          }}
                          className="text-xs font-semibold text-sky-500 hover:text-sky-600 bg-sky-50 hover:bg-sky-100/75 border border-sky-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          + Add First Tender
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTenders.map(tender => {
                    const uniqueId = tender.id || tender.tender_id;
                    return (
                      <tr key={uniqueId} className="hover:bg-slate-50/85 transition-colors group">
                        <td className="py-4 px-4 text-sm font-semibold text-slate-800 whitespace-nowrap">{tender.tender_id}</td>
                        <td className="py-4 px-4 text-sm text-slate-650 whitespace-nowrap">{tender.tender_ref_no}</td>
                        <td className="py-4 px-4 text-sm text-slate-650 whitespace-nowrap">{tender.tender_title}</td>
                        <td className="py-4 px-4 text-sm text-slate-500 whitespace-nowrap">{tender.tender_organization}</td>
                        <td className="py-4 px-4 text-sm text-slate-500 whitespace-nowrap">{tender.cable_length_km} KM</td>
                        <td className="py-4 px-4 text-sm text-slate-500 whitespace-nowrap">{tender.state}</td>
                        <td className="py-4 px-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(tender.publish_date)}</td>
                        <td className="py-4 px-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(tender.closing_date)}</td>
                        <td className="py-4 px-4 text-sm font-semibold text-slate-700 whitespace-nowrap">₹{Number(tender.tender_value_cr || 0).toFixed(2)} Cr</td>
                        <td className="py-4 px-4 text-sm text-slate-600 whitespace-nowrap">₹{Number(tender.tender_fee_inr || 0).toFixed(2)} / ₹{Number(tender.emd_inr || 0).toFixed(2)}</td>
                        <td className="py-4 px-6 text-sm text-right relative">
                          <div className="flex items-center justify-end gap-1">
                            {/* View button */}
                            <button
                              onClick={() => openViewModal(tender)}
                              title="View Details"
                              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>

                            {/* Edit button */}
                            <button
                              onClick={() => openEditModal(tender)}
                              title="Edit"
                              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>

                            {/* Ellipsis Actions button */}
                            <div className="relative">
                              <button
                                onClick={() => setActiveActionMenuId(activeActionMenuId === uniqueId ? null : uniqueId)}
                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                              >
                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                </svg>
                              </button>

                              {activeActionMenuId === uniqueId && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setActiveActionMenuId(null)}
                                  />
                                  <div className="absolute right-0 mt-1 w-32 origin-top-right rounded-lg bg-white border border-slate-200 shadow-lg py-1 z-20">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeleteTender(uniqueId, tender.tender_id);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Tender Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col scale-in duration-150 relative">
            {/* Submission Loader Overlay */}
            {isSubmitting && (
              <div className="absolute inset-0 z-30 bg-white/80 flex flex-col items-center justify-center space-y-4 animate-fade-in backdrop-blur-3xs">
                <div className="flex items-center justify-center p-3 bg-sky-50 text-sky-600 rounded-2xl shadow-sm border border-sky-100/50">
                  <svg className="animate-spin h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">Saving Tender Details</h3>
                  <p className="text-xs text-slate-500">Please wait while we publish the changes to the database...</p>
                </div>
              </div>
            )}

            {/* Success Status Overlay */}
            {submitSuccess && (
              <div className="absolute inset-0 z-30 bg-white/95 flex flex-col items-center justify-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm">
                  <svg className="w-8 h-8 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">{submitSuccess}</h3>
                  <p className="text-xs text-slate-400">Closing modal window...</p>
                </div>
              </div>
            )}

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">
                {isEditModalOpen ? `Edit Tender: ${selectedTender?.tender_id}` : 'Create New Tender'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                  setFormData(initialFormState);
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-650 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {submitError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 text-sm p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-semibold">Submission Error</span>
                  </div>
                  <p className="text-xs">{submitError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tender ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Tender ID <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="tender_id"
                    value={formData.tender_id}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. TNDR001"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-shadow"
                  />
                </div>

                {/* Tender Ref No */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Reference Number <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="tender_ref_no"
                    value={formData.tender_ref_no}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. REF-2026-001"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-shadow"
                  />
                </div>

                {/* Tender Title */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Tender Title / Project Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="tender_title"
                    value={formData.tender_title}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Optical Fiber Cable Laying Work"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-shadow"
                  />
                </div>

                {/* Tender Organization */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Organization <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="tender_organization"
                    value={formData.tender_organization}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. BSNL"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-shadow"
                  />
                </div>

                {/* Cable Length KM */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Cable Length (KM) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    name="cable_length_km"
                    value={formData.cable_length_km}
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="e.g. 150"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-shadow"
                  />
                </div>

                {/* Publish Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Publish Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    name="publish_date"
                    value={formData.publish_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-shadow"
                  />
                </div>

                {/* Closing Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Closing Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    name="closing_date"
                    value={formData.closing_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-shadow"
                  />
                </div>

                {/* Tender Value (Cr) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Tender Value (Cr) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    name="tender_value_cr"
                    value={formData.tender_value_cr}
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="e.g. 25.50"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-shadow"
                  />
                </div>

                {/* Tender Fee (INR) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Tender Fee (INR) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    name="tender_fee_inr"
                    value={formData.tender_fee_inr}
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="e.g. 10000"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-shadow"
                  />
                </div>

                {/* EMD INR */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">EMD Amount (INR) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    name="emd_inr"
                    value={formData.emd_inr}
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="e.g. 500000"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-shadow"
                  />
                </div>

                {/* State (Indian States Dropdown) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">State <span className="text-rose-500">*</span></label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-shadow"
                  >
                    <option value="" disabled>Select State</option>
                    {INDIAN_STATES.map(stateName => (
                      <option key={stateName} value={stateName}>{stateName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tender Documents Section */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tender Documents <span className="text-rose-500">*</span></h3>
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

                <div className="space-y-3">
                  {formData.tender_documents.map((doc, idx) => (
                    <div key={idx} className="flex gap-3 items-end bg-slate-50 p-3 rounded-lg border border-slate-150">
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Document Name Dropdown */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-505 uppercase mb-1">Document Name <span className="text-rose-500">*</span></label>
                          <select
                            value={doc.name}
                            onChange={(e) => handleDocumentChange(idx, 'name', e.target.value)}
                            required
                            className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded text-xs focus:outline-none focus:border-sky-505"
                          >
                            {DOCUMENT_NAMES.map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Document PDF Upload */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-505 uppercase mb-1">Document PDF <span className="text-rose-500">*</span></label>
                          <div className="flex items-center gap-2">
                            {doc.uploading ? (
                              <div className="flex items-center gap-1.5 py-1.5 text-xs text-slate-505 font-medium">
                                <svg className="animate-spin h-3.5 w-3.5 text-sky-500" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Uploading PDF...
                              </div>
                            ) : doc.url ? (
                              <div className="flex-1 flex items-center justify-between bg-white border border-emerald-100 rounded px-2.5 py-1.5 text-xs text-emerald-700 font-medium truncate">
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
                              <div className="flex-1 text-slate-400 italic text-xs py-1.5">No file uploaded</div>
                            )}

                            {!doc.uploading && (
                              <div>
                                <label
                                  htmlFor={`file-upload-${idx}`}
                                  className="cursor-pointer bg-white px-3 py-1.5 border border-slate-200 rounded text-xs text-sky-600 hover:bg-sky-50/50 hover:border-sky-300 transition-all font-semibold shadow-xs flex items-center gap-1 shrink-0"
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
                          className="p-1.5 bg-white border border-slate-200 rounded text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer mb-0.5"
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
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-100 pt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setFormData(initialFormState);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 text-sm font-semibold hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-400 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    isEditModalOpen ? 'Save Changes' : 'Create Tender'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Tender Details Modal */}
      {isViewModalOpen && selectedTender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200">
          <div className={`bg-white rounded-2xl border border-slate-200 shadow-2xl w-full ${(activeTab === 'Assigned by Accounts Team' || activeTab === 'Submitted Tenders') ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-hidden flex flex-col scale-in duration-150`}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Tender Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-650 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {approvalError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-4 rounded-xl flex flex-col gap-1.5 animate-fadeIn">
                  <div className="flex gap-2 items-center">
                    <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-semibold text-xs">Error sending for approval</span>
                  </div>
                  <p className="text-[11px]">{approvalError}</p>
                </div>
              )}

              {approvalSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-4 rounded-xl flex items-center gap-2 animate-fadeIn">
                  <svg className="w-4.5 h-4.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-xs">{approvalSuccess}</span>
                </div>
              )}

              {detailsSaveError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-4 rounded-xl flex items-center gap-2.5 shadow-sm animate-fadeIn">
                  <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-semibold">{detailsSaveError}</span>
                </div>
              )}

              {detailsSaveSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-4 rounded-xl flex items-center gap-2.5 shadow-sm animate-fadeIn">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">{detailsSaveSuccess}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* ID & Status */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-955">{selectedTender.tender_title}</h3>
                    <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">{selectedTender.tender_organization}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                    {selectedTender.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 border-t border-b border-slate-100 py-4">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Tender ID</span>
                    <span className="text-xs font-semibold text-slate-700">{selectedTender.tender_id}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Reference Number</span>
                    <span className="text-xs font-semibold text-slate-700">{selectedTender.tender_ref_no}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Cable Length</span>
                    <span className="text-xs font-semibold text-slate-700">{selectedTender.cable_length_km} KM</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">State</span>
                    <span className="text-xs font-semibold text-slate-700">{selectedTender.state}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Publish Date</span>
                    <span className="text-xs font-semibold text-slate-700">{formatDate(selectedTender.publish_date)}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Closing Date</span>
                    <span className="text-xs font-semibold text-slate-700 text-rose-600">{formatDate(selectedTender.closing_date)}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Tender Value</span>
                    <span className="text-xs font-bold text-slate-800">₹{Number(selectedTender.tender_value_cr || 0).toFixed(2)} Cr</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Tender Fee / EMD</span>
                    <span className="text-xs font-semibold text-slate-700">₹{Number(selectedTender.tender_fee_inr || 0).toFixed(2)} / ₹{Number(selectedTender.emd_inr || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Documents List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tender Documents</h4>
                  <div className="space-y-1.5">
                    {selectedTender.tender_documents && selectedTender.tender_documents.length > 0 ? (
                      selectedTender.tender_documents.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-lg border border-slate-150 hover:bg-slate-50 transition-colors text-xs font-medium text-slate-700 group"
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
                      <p className="text-xs text-slate-505 italic">No documents attached.</p>
                    )}
                  </div>
                  {/* Assigned by Accounts Team update form fields */}
                  {activeTab === 'Assigned by Accounts Team' && (
                    <div className="border-t border-slate-100 pt-5 space-y-4">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Update Assigned Tender Details</h3>

                      <div className="space-y-4">
                        {/* Shortfall Toggle */}
                        <div className="space-y-3 p-4 bg-slate-50/70 border border-slate-100 rounded-xl">
                          <div className="flex items-center justify-between">
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={detailsForm.shortfall}
                                onChange={(e) => setDetailsForm(prev => ({ ...prev, shortfall: e.target.checked }))}
                                disabled={isTenderCompleted}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500 peer-disabled:opacity-75"></div>
                              <span className="ms-3 text-sm font-semibold text-slate-700">Shortfall</span>
                            </label>
                          </div>

                          {detailsForm.shortfall && (
                            <div className="space-y-3 border-t border-slate-200/50 pt-3">
                              <div className="flex items-center justify-between">
                                <label className="block text-[10px] font-bold text-slate-550 uppercase">Resubmitted Documents</label>
                                {!isTenderCompleted && (
                                  <button
                                    type="button"
                                    onClick={addDocsResubmittedRow}
                                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                                  >
                                    <svg className="w-3.5 h-3.5 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Document
                                  </button>
                                )}
                              </div>

                              <div className="space-y-3">
                                {detailsForm.docs_resubmitted.map((doc, idx) => (
                                  <div key={idx} className="flex gap-3 items-end bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {/* Document Name Dropdown */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-505 uppercase mb-1">Document Name <span className="text-rose-500">*</span></label>
                                        <select
                                          value={doc.name}
                                          onChange={(e) => handleDocsResubmittedChange(idx, 'name', e.target.value)}
                                          required
                                          disabled={isTenderCompleted}
                                          className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded text-xs focus:outline-none focus:border-sky-505 text-slate-800"
                                        >
                                          {DOCUMENT_NAMES.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Document PDF Upload */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-505 uppercase mb-1">Document PDF <span className="text-rose-500">*</span></label>
                                        <div className="flex items-center gap-2">
                                          {doc.uploading ? (
                                            <div className="flex-1 flex items-center gap-1.5 py-1.5 text-xs text-slate-500 font-medium">
                                              <svg className="animate-spin h-3.5 w-3.5 text-sky-500" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                              </svg>
                                              Uploading PDF...
                                            </div>
                                          ) : doc.url ? (
                                            <div className="flex-1 flex items-center justify-between bg-white border border-emerald-100 rounded px-2.5 py-1.5 text-xs text-emerald-700 font-medium truncate">
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
                                            <div className="flex-1 text-slate-400 italic text-xs py-1.5">No file uploaded</div>
                                          )}

                                          {!doc.uploading && !isTenderCompleted && (
                                            <div>
                                              <label
                                                htmlFor={`details-docs-resubmitted-upload-${idx}`}
                                                className="cursor-pointer bg-white px-3 py-1.5 border border-slate-200 rounded text-xs text-sky-600 hover:bg-sky-50/50 hover:border-sky-300 transition-all font-semibold shadow-xs flex items-center gap-1 shrink-0"
                                              >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                {doc.url ? 'Replace' : 'Upload'}
                                              </label>
                                              <input
                                                id={`details-docs-resubmitted-upload-${idx}`}
                                                type="file"
                                                accept=".pdf"
                                                className="hidden"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) handleDocsResubmittedUpload(idx, file);
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

                                    {!isTenderCompleted && (
                                      <button
                                        type="button"
                                        onClick={() => removeDocsResubmittedRow(idx)}
                                        className="p-1.5 bg-white border border-slate-200 rounded text-rose-550 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer mb-0.5"
                                        title="Delete Row"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                ))}
                                {detailsForm.docs_resubmitted.length === 0 && (
                                  <p className="text-xs text-slate-450 italic text-center py-2">No documents added. Click "Add Document" to start uploading shortfall files.</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Upload Rank (Excel) */}
                        <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl">
                          {renderSingleFileUploadDetails('rank_file', 'Upload Rank (Excel File)', '.xlsx,.xls')}
                        </div>

                        {/* Counter Offer Toggle */}
                        <div className="space-y-3 p-4 bg-slate-50/70 border border-slate-100 rounded-xl">
                          <div className="flex items-center justify-between">
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={detailsForm.counter_offer.enabled}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setDetailsForm(prev => {
                                    // Prepopulate with a default row if enabling and currently empty
                                    const existingDocs = prev.counter_offer.documents || [];
                                    const documents = (checked && existingDocs.length === 0)
                                      ? [{ tag: 'counter price', url: '', uploading: false, error: '', fileName: '' }]
                                      : existingDocs;
                                    return {
                                      ...prev,
                                      counter_offer: {
                                        enabled: checked,
                                        documents
                                      }
                                    };
                                  });
                                }}
                                disabled={isTenderCompleted}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500 peer-disabled:opacity-75"></div>
                              <span className="ms-3 text-sm font-semibold text-slate-700">Counter Offer</span>
                            </label>

                            {detailsForm.counter_offer.enabled && !isTenderCompleted && (
                              <button
                                type="button"
                                onClick={addCounterOfferDocRow}
                                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Document
                              </button>
                            )}
                          </div>

                          {detailsForm.counter_offer.enabled && (
                            <div className="space-y-3 border-t border-slate-200/50 pt-3">
                              <div className="space-y-3">
                                {detailsForm.counter_offer.documents.map((doc, idx) => (
                                  <div key={idx} className="flex gap-3 items-end bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {/* Document Tag / Name Input */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-505 uppercase mb-1">Tag / Document Label <span className="text-rose-500">*</span></label>
                                        <input
                                          type="text"
                                          value={doc.tag}
                                          onChange={(e) => handleCounterOfferDocChange(idx, 'tag', e.target.value)}
                                          required
                                          disabled={isTenderCompleted}
                                          placeholder="e.g. counter price"
                                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-sky-505 bg-white text-slate-800 disabled:bg-slate-50 disabled:text-slate-550"
                                        />
                                      </div>

                                      {/* Document PDF Upload */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-505 uppercase mb-1">Document PDF <span className="text-rose-500">*</span></label>
                                        <div className="flex items-center gap-2">
                                          {doc.uploading ? (
                                            <div className="flex-1 flex items-center gap-1.5 py-1.5 text-xs text-slate-500 font-medium">
                                              <svg className="animate-spin h-3.5 w-3.5 text-sky-500" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                              </svg>
                                              Uploading PDF...
                                            </div>
                                          ) : doc.url ? (
                                            <div className="flex-1 flex items-center justify-between bg-white border border-emerald-100 rounded px-2.5 py-1.5 text-xs text-emerald-700 font-medium truncate">
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
                                            <div className="flex-1 text-slate-400 italic text-xs py-1.5">No file uploaded</div>
                                          )}

                                          {!doc.uploading && !isTenderCompleted && (
                                            <div>
                                              <label
                                                htmlFor={`details-counter-offer-upload-${idx}`}
                                                className="cursor-pointer bg-white px-3 py-1.5 border border-slate-200 rounded text-xs text-sky-600 hover:bg-sky-50/50 hover:border-sky-300 transition-all font-semibold shadow-xs flex items-center gap-1 shrink-0 whitespace-nowrap"
                                              >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                {doc.url ? 'Replace' : 'Upload'}
                                              </label>
                                              <input
                                                id={`details-counter-offer-upload-${idx}`}
                                                type="file"
                                                accept=".pdf"
                                                className="hidden"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) handleCounterOfferDocUpload(idx, file);
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

                                    {!isTenderCompleted && (
                                      <button
                                        type="button"
                                        onClick={() => removeCounterOfferDocRow(idx)}
                                        className="p-1.5 bg-white border border-slate-200 rounded text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer mb-0.5"
                                        title="Delete Row"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                ))}
                                {detailsForm.counter_offer.documents.length === 0 && (
                                  <p className="text-xs text-slate-455 italic text-center py-2">No documents added. Click "Add Document" to start uploading counter offer files.</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* LOI, PO, Contract Agreement, Warranty, Acceptance Letter */}
                        <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-4">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Legal & Execution Documents (PDF)</h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderSingleFileUploadDetails('loi', 'LOI (Letter of Intent)', '.pdf')}
                            {renderSingleFileUploadDetails('po', 'PO (Purchase Order)', '.pdf')}
                            <div className="md:col-span-2">
                              {renderSingleFileUploadDetails('contract_agreement', 'Contract Agreement', '.pdf')}
                            </div>
                            {renderSingleFileUploadDetails('warranty', 'Warranty', '.pdf')}
                            {renderSingleFileUploadDetails('acceptance_letter', 'Acceptance Letter', '.pdf')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Complete Tenders tab read-only view details */}
                  {activeTab === 'Submitted Tenders' && (
                    <div className="border-t border-slate-100 pt-5 space-y-4">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Completed Tender Details</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Timestamps */}
                        {selectedTender.submission_expected && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Submission Expected</span>
                            <span className="text-xs font-semibold text-slate-700">{formatDate(selectedTender.submission_expected)}</span>
                          </div>
                        )}
                        {selectedTender.submission_actual && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Actual Submission</span>
                            <span className="text-xs font-semibold text-slate-700">{new Date(selectedTender.submission_actual).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        {/* Shortfall Details */}
                        {selectedTender.shortfall ? (
                          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">Shortfall Status</span>
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 rounded-full">Raised</span>
                            </div>
                            <div className="space-y-2">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Resubmitted Documents</span>
                              {selectedTender.docs_resubmitted && selectedTender.docs_resubmitted.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {selectedTender.docs_resubmitted.map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white border border-slate-150 rounded-lg p-2.5 text-xs text-slate-700 font-medium">
                                      <span className="truncate pr-2">{doc.name}</span>
                                      <a href={doc.url} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold uppercase shrink-0">View</a>
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
                          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Tender Rank File</span>
                              <span className="text-xs font-semibold text-slate-700">{selectedTender.rank_file.split('/').pop() || 'Rank File.xlsx'}</span>
                            </div>
                            <a href={selectedTender.rank_file} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-xs">Download Excel</a>
                          </div>
                        ) : null}

                        {/* Counter Offer Details */}
                        {selectedTender.counter_offer?.enabled ? (
                          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">Counter Offer Status</span>
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">Enabled</span>
                            </div>
                            <div className="space-y-2">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Counter Offer Documents</span>
                              {selectedTender.counter_offer.documents && selectedTender.counter_offer.documents.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {selectedTender.counter_offer.documents.map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white border border-slate-150 rounded-lg p-2.5 text-xs text-slate-700 font-medium">
                                      <span className="truncate pr-2 font-semibold text-slate-600">{doc.tag}</span>
                                      <a href={doc.url} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold uppercase shrink-0">View</a>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic">No counter offer documents uploaded.</span>
                              )}
                            </div>
                          </div>
                        ) : null}

                        {/* Legal & Execution Documents */}
                        {(selectedTender.loi || selectedTender.po || selectedTender.contract_agreement || selectedTender.warranty || selectedTender.acceptance_letter) ? (
                          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-3">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Legal & Execution Documents</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {selectedTender.loi && (
                                <div className="flex items-center justify-between bg-white border border-slate-150 rounded-lg p-2.5 text-xs text-slate-700 font-medium">
                                  <span className="truncate pr-2">LOI</span>
                                  <a href={selectedTender.loi} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold uppercase shrink-0">View</a>
                                </div>
                              )}
                              {selectedTender.po && (
                                <div className="flex items-center justify-between bg-white border border-slate-150 rounded-lg p-2.5 text-xs text-slate-700 font-medium">
                                  <span className="truncate pr-2">PO</span>
                                  <a href={selectedTender.po} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold uppercase shrink-0">View</a>
                                </div>
                              )}
                              {selectedTender.contract_agreement && (
                                <div className="col-span-1 sm:col-span-2 flex items-center justify-between bg-white border border-slate-150 rounded-lg p-2.5 text-xs text-slate-700 font-medium">
                                  <span className="truncate pr-2">Contract Agreement</span>
                                  <a href={selectedTender.contract_agreement} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold uppercase shrink-0">View</a>
                                </div>
                              )}
                              {selectedTender.warranty && (
                                <div className="flex items-center justify-between bg-white border border-slate-150 rounded-lg p-2.5 text-xs text-slate-700 font-medium">
                                  <span className="truncate pr-2">Warranty</span>
                                  <a href={selectedTender.warranty} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold uppercase shrink-0">View</a>
                                </div>
                              )}
                              {selectedTender.acceptance_letter && (
                                <div className="flex items-center justify-between bg-white border border-slate-150 rounded-lg p-2.5 text-xs text-slate-700 font-medium">
                                  <span className="truncate pr-2">Acceptance Letter</span>
                                  <a href={selectedTender.acceptance_letter} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:text-sky-600 font-bold uppercase shrink-0">View</a>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center gap-2">
                <div className="flex gap-2">
                  {activeTab === 'Assigned by Accounts Team' ? (
                    <>
                      <button
                        onClick={() => handleSaveTenderDetails(false)}
                        disabled={isSavingDetails || isTenderCompleted || Object.values(detailsUploadProgress).some(p => p.uploading) || detailsForm.docs_resubmitted.some(d => d.uploading) || detailsForm.counter_offer.documents.some(d => d.uploading)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-450 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        {isSavingDetails ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Saving...
                          </>
                        ) : (
                          'Save Tender Details'
                        )}
                      </button>

                      <button
                        onClick={() => handleSaveTenderDetails(true)}
                        disabled={isSavingDetails || isTenderCompleted || Object.values(detailsUploadProgress).some(p => p.uploading) || detailsForm.docs_resubmitted.some(d => d.uploading) || detailsForm.counter_offer.documents.some(d => d.uploading)}
                        className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-400 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        {isSavingDetails ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Marking Complete...
                          </>
                        ) : isTenderCompleted ? (
                          'Completed'
                        ) : (
                          'Mark As Complete'
                        )}
                      </button>
                    </>
                  ) : activeTab === 'Submitted Tenders' ? null : (
                    <button
                      onClick={() => handleSendForApproval(selectedTender)}
                      disabled={isSendingApproval || selectedTender?.send_for_approaval}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-400 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {isSendingApproval ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending...
                        </>
                      ) : selectedTender?.send_for_approaval ? (
                        'Already Sent For Approval'
                      ) : (
                        'Send For Approval'
                      )}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
