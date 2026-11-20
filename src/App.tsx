import React from 'react';
import { TerminalScene } from './components/canvas/TerminalScene';
import { TopBar } from './components/ui/TopBar';
import { ConstructorSidebar } from './components/ui/ConstructorSidebar';
import { ClientFilterDock } from './components/ui/ClientFilterDock';
import { InventoryDrawer } from './components/ui/InventoryDrawer';
import { ContainerActionModal } from './components/ui/ContainerActionModal';
import { useTerminalStore } from './store/useTerminalStore';

export const App: React.FC = () => {
  const themeMode = useTerminalStore((s) => s.themeMode);

  const rootBg =
    themeMode === 'white'
      ? 'bg-[#f1f5f9] theme-white'
      : themeMode === 'gray'
      ? 'bg-[#252a34] theme-gray'
      : 'bg-[#0b101d] theme-dark';

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden select-none transition-colors duration-300 ${rootBg}`}
    >
      {/* 3D / Isometric Digital Twin Canvas */}
      <TerminalScene />

      {/* Top Navigation, Camera Controls, Theme Switcher, Mode Switcher & KPI Dashboard */}
      <TopBar />

      {/* Phase 1: Visual Terminal Constructor Sidebar (Roads, Fences, Named Stocks, Props) */}
      <ConstructorSidebar />

      {/* Phase 2: Bottom-Left Client Filter & Drop-Off Dock */}
      <ClientFilterDock />

      {/* Phase 2: Right Interactive Inventory Table & Crane Operations Log */}
      <InventoryDrawer />

      {/* Modals for Drop Off & Buried Container Crane Cost Calculation */}
      <ContainerActionModal />

      {/* Bottom-Center Controls Legend Pill */}
      <div className="pointer-events-none fixed bottom-3 left-1/2 -translate-x-1/2 z-10 hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#11192c]/85 border border-slate-800 text-[11px] text-slate-400 backdrop-blur-sm">
        <span>Click container or stock for actions</span>
        <span>•</span>
        <span>LMB: Rotate</span>
        <span>•</span>
        <span>RMB: Pan</span>
        <span>•</span>
        <span>Wheel: Zoom</span>
      </div>
    </div>
  );
};

export default App;
