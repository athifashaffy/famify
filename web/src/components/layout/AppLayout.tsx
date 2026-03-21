import { Outlet } from 'react-router-dom';
import { Sidebar, MobileHeader, MobileBottomNav, TopRightIcons } from './Sidebar';
import { RightPanel } from './RightPanel';
import { ProfilePanel } from '../panels/ProfilePanel';
import { NotificationsPanel } from '../panels/NotificationsPanel';
import { usePanel } from '../../context/PanelContext';

export function AppLayout() {
  const { activePanel, closePanel } = usePanel();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop top bar with right icons */}
        <div className="hidden md:flex items-center justify-end px-6 py-3 bg-white border-b border-slate-200">
          <TopRightIcons />
        </div>
        {/* Mobile header */}
        <MobileHeader />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>

      <RightPanel isOpen={activePanel === 'notifications'} onClose={closePanel} title="Notifications">
        <NotificationsPanel />
      </RightPanel>

      <RightPanel isOpen={activePanel === 'profile'} onClose={closePanel} title="Profile">
        <ProfilePanel />
      </RightPanel>
    </div>
  );
}
