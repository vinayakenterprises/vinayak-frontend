import React, { useState, useEffect, useRef } from 'react';

/**
 * Reusable UserProfile component displaying avatar, name, role, and optional interactive dropdown.
 *
 * @param {Object} props
 * @param {string} props.name - The name of the user (e.g. "Manish")
 * @param {string} [props.role] - The subtitle or role of the user (e.g. "Tender Coordinator")
 * @param {string} [props.avatarUrl] - The source URL for the avatar image
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Sizing variation
 * @param {boolean} [props.showDropdownIndicator=true] - Whether to show the chevron/dropdown icon
 * @param {Array<{label: string, onClick: Function, icon?: React.ReactNode, danger?: boolean}>} [props.dropdownItems] - List of actions for the dropdown menu
 * @param {Function} [props.onProfileClick] - Custom click handler for the profile header block
 * @param {string} [props.className] - Additional Tailwind classes for styling the wrapper
 */
export const UserProfile = ({
  name,
  role,
  avatarUrl,
  size = 'md',
  showDropdownIndicator = true,
  dropdownItems = [],
  onProfileClick,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef(null);

  // Fallback if image fails or is empty
  const getInitials = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle click on the profile widget
  const handleWidgetClick = (e) => {
    if (onProfileClick) {
      onProfileClick(e);
    }
    if (dropdownItems.length > 0) {
      setIsOpen(!isOpen);
    }
  };

  // Determine size classes
  const sizeConfig = {
    sm: {
      container: 'gap-2',
      avatar: 'w-8 h-8 text-xs',
      name: 'text-xs font-semibold text-gray-800 dark:text-gray-200',
      role: 'text-[10px] text-gray-500 dark:text-gray-400 leading-tight',
      chevron: 'w-3 h-3',
      dropdown: 'top-10',
    },
    md: {
      container: 'gap-3',
      avatar: 'w-10 h-10 text-sm',
      name: 'text-sm font-semibold text-gray-800 dark:text-gray-200',
      role: 'text-xs text-gray-500 dark:text-gray-400 leading-tight',
      chevron: 'w-4 h-4',
      dropdown: 'top-12',
    },
    lg: {
      container: 'gap-4',
      avatar: 'w-14 h-14 text-lg',
      name: 'text-base font-bold text-gray-800 dark:text-gray-200',
      role: 'text-sm text-gray-500 dark:text-gray-400 leading-tight',
      chevron: 'w-5 h-5',
      dropdown: 'top-16',
    },
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;
  const hasDropdown = dropdownItems.length > 0;

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
    >
      {/* Profile Header Button */}
      <button
        type="button"
        onClick={handleWidgetClick}
        disabled={!hasDropdown && !onProfileClick}
        className={`flex items-center text-left focus:outline-none transition-all duration-200 rounded-lg p-1.5 
          ${hasDropdown || onProfileClick ? 'hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer active:scale-98' : 'cursor-default'} 
          ${currentSize.container}`}
        aria-haspopup={hasDropdown ? 'true' : undefined}
        aria-expanded={hasDropdown ? isOpen : undefined}
      >
        {/* Avatar Area */}
        <div className="relative flex-shrink-0">
          {avatarUrl && !imageError ? (
            <img
              src={avatarUrl}
              alt={name}
              onError={() => setImageError(true)}
              className={`rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-sm ${currentSize.avatar}`}
            />
          ) : (
            <div
              className={`rounded-full flex items-center justify-center font-bold text-white shadow-sm border border-gray-100 dark:border-gray-800 bg-gradient-to-tr from-sky-400 via-sky-500 to-indigo-500 ${currentSize.avatar}`}
            >
              {getInitials(name)}
            </div>
          )}
          {/* Active Status Ring (Green dot) */}
          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
        </div>

        {/* Text Details */}
        <div className="flex flex-col justify-center">
          <span className={currentSize.name}>{name}</span>
          {role && <span className={currentSize.role}>{role}</span>}
        </div>

        {/* Dropdown Chevron */}
        {showDropdownIndicator && hasDropdown && (
          <svg
            className={`text-gray-400 transition-transform duration-200 ${currentSize.chevron} ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Interactive Dropdown Menu */}
      {hasDropdown && isOpen && (
        <div
          className={`absolute right-0 z-50 mt-1 w-52 origin-top-right rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl focus:outline-none transition-all duration-200 animate-in fade-in slide-in-from-top-2 duration-150 ${currentSize.dropdown}`}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1.5 px-1" role="none">
            {dropdownItems.map((item, index) => {
              if (item.divider) {
                return (
                  <hr
                    key={`div-${index}`}
                    className="my-1 border-gray-100 dark:border-gray-800"
                  />
                );
              }

              return (
                <button
                  key={item.label || index}
                  onClick={() => {
                    item.onClick && item.onClick();
                    setIsOpen(false);
                  }}
                  className={`group flex w-full items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-left transition-colors duration-150
                    ${
                      item.danger
                        ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  role="menuitem"
                >
                  {item.icon && (
                    <span
                      className={`flex-shrink-0 transition-colors duration-150 ${
                        item.danger
                          ? 'text-rose-500 group-hover:text-rose-600'
                          : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                      }`}
                    >
                      {item.icon}
                    </span>
                  )}
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
