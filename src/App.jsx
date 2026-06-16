import { useState } from 'react';
import Header from './components/common/Header';
import manishAvatar from './assets/manish_avatar.png';
import veLogo from './assets/mittalu-logo.png';
import TenderDashboard from './components/TenderDashboard';
import MDDashboard from './components/MDDashboard';
import Login from './components/Login';
import AccountsTeamDashboard from './components/AccountsTeamDashboard';

function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [, setToken] = useState(() => localStorage.getItem('token') || '');

  const handleLoginSuccess = (loggedInUser, userToken) => {
    setUser(loggedInUser);
    setToken(userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken('');
  };

  // User profile actions
  const userDropdownItems = [
    // {
    //   label: 'My Profile',
    //   onClick: () => alert(`Profile of ${user?.username} (${user?.email_id})`),
    //   icon: (
    //     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    //       <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    //     </svg>
    //   ),
    // },
    // {
    //   label: 'Settings',
    //   onClick: () => alert('Settings Clicked'),
    //   icon: (
    //     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    //       <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    //       <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    //     </svg>
    //   ),
    // },
    // { divider: true },
    {
      label: 'Log out',
      danger: true,
      onClick: handleLogout,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
    },
  ];

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Header
        logoText="Mittalu Pvt Ltd"
        logoUrl={veLogo}
        userName={user.username}
        userRole={`${user.role} (${user.department})`}
        userAvatarUrl={manishAvatar}
        userDropdownItems={userDropdownItems}
      />

      <main className="mx-auto">
        {user.role === 'tender_agent' ? (
          <TenderDashboard />
        ) : user.role === 'MD' ? (
          <MDDashboard />
        ) : user.role === 'tender_handler_accounts' ? (
          <AccountsTeamDashboard />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-10 max-w-md w-full space-y-4">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Your Role is not Defined yet.
              </p>
              <div className="text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                Logged in as: <span className="font-semibold">{user.role}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
