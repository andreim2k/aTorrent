import { Sidebar } from './Sidebar.js';
import { TopBar } from './TopBar.js';
import { AmbientBackground } from './AmbientBackground.js';
import { useUIStore } from '../../stores/uiStore.js';

export function Shell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div className="relative flex h-screen overflow-hidden">
      <AmbientBackground />

      {/* Mobile sidebar scrim */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={toggleSidebar} />
      )}
      <div
        className={`relative z-40 p-3 pr-0 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:p-2 max-md:transition-transform max-md:duration-300 max-md:ease-out ${
          sidebarCollapsed ? 'max-md:-translate-x-[110%]' : 'max-md:translate-x-0'
        }`}
      >
        <Sidebar />
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 min-h-0 px-4 pb-4 max-md:px-2 max-md:pb-2">{children}</main>
      </div>
    </div>
  );
}
