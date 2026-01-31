import { Sidebar } from './Sidebar.js';
import { TopBar } from './TopBar.js';
import { StatusBar } from './StatusBar.js';
import { useUIStore } from '../../stores/uiStore.js';

export function Shell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      {/* Mobile sidebar overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      <div className={`max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:transition-transform max-md:duration-200 ${
        sidebarCollapsed ? 'max-md:-translate-x-full' : 'max-md:translate-x-0'
      }`}>
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-4 max-md:p-2">
          {children}
        </main>
        <StatusBar />
      </div>
    </div>
  );
}
