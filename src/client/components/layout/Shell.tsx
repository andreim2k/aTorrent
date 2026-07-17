import { Sidebar } from './Sidebar.js';
import { TopBar } from './TopBar.js';
import { StatusBar } from './StatusBar.js';
import { useUIStore } from '../../stores/uiStore.js';

export function Shell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div className="terminal-root">
      <div className="terminal-grid" aria-hidden="true" />
      <div className="terminal-scanlines" aria-hidden="true" />
      {!sidebarCollapsed && <button className="mobile-scrim" onClick={toggleSidebar} aria-label="Close navigation" />}
      <div className={`sidebar-dock ${sidebarCollapsed ? 'collapsed' : ''}`}><Sidebar /></div>
      <div className="terminal-stage">
        <TopBar />
        <main className="terminal-workspace">{children}</main>
        <StatusBar />
      </div>
    </div>
  );
}
