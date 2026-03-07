import { Outlet } from 'react-router-dom';
import { Sidebar, MobileHeader, MobileBottomNav } from './Sidebar';

export function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
