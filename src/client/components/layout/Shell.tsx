import { Sidebar } from './Sidebar.js';
import { TopBar } from './TopBar.js';
import { StatusBar } from './StatusBar.js';
import { AmbientField } from './AmbientField.js';
import { useUIStore } from '../../stores/uiStore.js';

export function Shell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div className="holo-app">
      <AmbientField />
      {!sidebarCollapsed && (
        <button className="holo-rail-scrim" onClick={toggleSidebar} aria-label="Close navigation" />
      )}
      <div className={`holo-rail-dock ${sidebarCollapsed ? 'is-min' : ''}`}>
        <Sidebar />
      </div>
      <div className="holo-stage">
        <TopBar />
        <main className="holo-workspace">{children}</main>
        <StatusBar />
      </div>
    </div>
  );
}
