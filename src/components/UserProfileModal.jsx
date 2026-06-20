import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function UserProfileModal({ isOpen, onClose }) {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProfileData = async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setErrorMsg('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/profile/get-profile-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const responseData = await response.json().catch(() => null);

      if (response.ok && responseData?.status === 'success') {
        setProfileData(responseData.data);
      } else {
        const msg = responseData?.message || 'Failed to fetch profile details.';
        setErrorMsg(msg);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Connection error: Could not reach the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchProfileData(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop click close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col scale-in duration-150">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            My Profile
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <svg className="animate-spin h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Retrieving profile data...</span>
            </div>
          ) : errorMsg ? (
            <div className="space-y-4 py-4">
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs p-4 rounded-xl flex gap-2.5 items-start">
                <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="space-y-1">
                  <span className="font-bold block">Error Loading Profile</span>
                  <p className="leading-relaxed">{errorMsg}</p>
                </div>
              </div>
              <button
                onClick={() => fetchProfileData(true)}
                className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
              >
                Retry
              </button>
            </div>
          ) : profileData ? (
            <div className="space-y-5">
              
              {/* User Avatar Circle Card */}
              <div className="flex flex-col items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 rounded-full flex items-center justify-center font-extrabold text-2xl text-white bg-gradient-to-tr from-sky-400 via-sky-500 to-indigo-500 shadow-md">
                  {profileData.username ? profileData.username.charAt(0).toUpperCase() : '?'}
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-white mt-3">
                  {profileData.username}
                </h4>
                <span className="px-2.5 py-0.5 mt-1.5 text-[10px] font-bold tracking-wider uppercase bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50 rounded-full">
                  {profileData.role}
                </span>
              </div>

              {/* Profile Details List */}
              <div className="space-y-3.5">
                
                {/* ID */}
                <div className="flex flex-col bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">User ID</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{profileData.id}</span>
                </div>

                {/* Email */}
                <div className="flex flex-col bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Email ID</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{profileData.email_id || 'N/A'}</span>
                </div>

                {/* Phone */}
                <div className="flex flex-col bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Phone Number</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{profileData.phone_no || 'N/A'}</span>
                </div>

                {/* Department */}
                <div className="flex flex-col bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Department</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{profileData.department || 'N/A'}</span>
                </div>

                {/* ID Created Date */}
                <div className="flex flex-col bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">ID Created Date</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{formatDate(profileData.created_at)}</span>
                </div>

              </div>

            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
}
