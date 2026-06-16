import React from 'react';
import UserProfile from './UserProfile/UserProfile';
import NotificationBell from './Notification/NotificationBell';

/**
 * Reusable Header component for the application layout.
 *
 * @param {Object} props
 * @param {string} [props.logoText='Company'] - Branding name of the company
 * @param {string} [props.logoLetter='C'] - Branding initial letter
 * @param {string} [props.logoBg='bg-blue-600 dark:bg-blue-500'] - Tailwind background class for logo badge
 * @param {string} [props.userName='Manish'] - Logged-in user's name
 * @param {string} [props.userRole='Tender Coordinator'] - Logged-in user's subtitle or role
 * @param {string} [props.userAvatarUrl] - URL for the user's avatar image
 * @param {Array<Object>} [props.userDropdownItems=[]] - Dropdown options for the user profile menu
 * @param {React.ReactNode} [props.children] - Optional center/navigation elements (e.g. links, search bars)
 * @param {string} [props.className=''] - Additional Tailwind classes for layout adjustments
 */
export const Header = ({
  logoText = 'Mittalu Pvt Ltd',
  logoLetter = 'V',
  logoBg = 'bg-sky-500',
  userName = 'Manish',
  userRole = 'Tender Coordinator',
  userAvatarUrl,
  userDropdownItems = [],
  children,
  className = '',
  logoUrl,
}) => {
  return (
    <header
      className={`w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex ps-2 pe-2 items-center justify-between shadow-sm transition-colors duration-200 ${className}`}
    >
      {/* Brand Logo Section */}
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-9 h-9 object-contain rounded-xl shadow-sm border border-slate-100 bg-white" />
        ) : (
          <div
            className={`w-9 h-9 rounded-xl ${logoBg} flex items-center justify-center text-white font-extrabold text-lg shadow-sm shadow-blue-500/10`}
          >
            {logoLetter}
          </div>
        )}
        <span className="font-bold text-slate-850 dark:text-slate-100 text-lg tracking-tight select-none">
          {logoText}
        </span>
      </div>

      {/* Center Navigation Slot (Optional) */}
      {children && (
        <div className="flex-1 max-w-xl mx-8 hidden md:block">
          {children}
        </div>
      )}

      {/* User Actions & Profile Section */}
      <div className="flex items-center gap-4">
        <NotificationBell />
        <UserProfile
          name={userName}
          role={userRole}
          avatarUrl={userAvatarUrl}
          dropdownItems={userDropdownItems}
          size="md"
        />
      </div>
    </header>
  );
};

export default Header;
