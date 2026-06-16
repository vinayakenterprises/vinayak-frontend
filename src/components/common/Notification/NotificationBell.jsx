import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../../hooks/useNotifications.js';
import { BellIcon } from 'lucide-react';

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const { notifications, unreadCount, loading, markOneRead, markAllRead } = useNotifications();
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative inline-block">
            {/* Bell Button */}
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none"
                aria-label="Toggle notifications"
            >
                <BellIcon size={20} className="transition-transform duration-200 group-hover:scale-105" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex min-w-[15px] h-[15px] px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-1 ring-white shadow-sm animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[420px] overflow-hidden bg-white border border-slate-200 rounded-xl shadow-xl z-50 flex flex-col transition-all duration-200 origin-top-right animate-in fade-in slide-in-from-top-2">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
                        <span className="text-sm font-semibold text-slate-800">Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs font-semibold text-sky-500 hover:text-sky-600 transition-colors focus:outline-none cursor-pointer"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[360px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-slate-400">
                                <svg className="animate-spin h-5 w-5 text-sky-500 mb-2" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span className="text-xs text-slate-500 font-medium">Loading notifications...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-2.5">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => !n.is_read && markOneRead(n.id)}
                                    className={`flex gap-3 items-start p-4 text-left transition-colors duration-150 select-none ${
                                        n.is_read 
                                            ? 'bg-white hover:bg-slate-50/50 cursor-default' 
                                            : 'bg-sky-50/20 hover:bg-sky-50/40 cursor-pointer'
                                    }`}
                                >
                                    {/* Unread indicator dot */}
                                    {!n.is_read && (
                                        <span className="w-2 h-2 mt-1.5 rounded-full bg-sky-500 shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs text-slate-700 leading-relaxed mb-1 ${!n.is_read ? 'font-semibold' : 'font-normal'}`}>
                                            {n.message}
                                        </p>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {new Date(n.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}