import React, { useRef } from 'react';
import {
  Box,
  Compass,
  Download,
  Hammer,
  Layers,
  RotateCcw,
  Upload,
  DollarSign,
  RefreshCw,
  Palette,
} from 'lucide-react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { ISO_TYPE_SPECS, ThemeMode } from '../../types/terminal';

const THEME_OPTIONS: { id: ThemeMode; label: string; dot: string }[] = [
  { id: 'dark', label: 'Dark', dot: '#0b101d' },
  { id: 'gray', label: 'Gray', dot: '#64748b' },
  { id: 'white', label: 'White', dot: '#f8fafc' },
];

export const TopBar: React.FC = () => {
  const appMode = useTerminalStore((s) => s.appMode);
  const setAppMode = useTerminalStore((s) => s.setAppMode);
  const cameraMode = useTerminalStore((s) => s.cameraMode);
  const setCameraMode = useTerminalStore((s) => s.setCameraMode);
  const themeMode = useTerminalStore((s) => s.themeMode);
  const setThemeMode = useTerminalStore((s) => s.setThemeMode);
  const triggerCameraReset = useTerminalStore((s) => s.triggerCameraReset);

  const containers = useTerminalStore((s) => s.containers);
  const stocks = useTerminalStore((s) => s.stocks);
  const roads = useTerminalStore((s) => s.roads);
  const fences = useTerminalStore((s) => s.fences);
  const props = useTerminalStore((s) => s.props);
  const clients = useTerminalStore((s) => s.clients);
  const operationLogs = useTerminalStore((s) => s.operationLogs);

  const cranePricePerOp = useTerminalStore((s) => s.cranePricePerOp);
  const setCranePricePerOp = useTerminalStore((s) => s.setCranePricePerOp);
  const resetToDemoTerminal = useTerminalStore((s) => s.resetToDemoTerminal);
  const importTerminalJson = useTerminalStore((s) => s.importTerminalJson);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute live KPIs
  const totalContainers = containers.length;
  const totalTeuOccupied = containers.reduce(
    (sum, c) => sum + ISO_TYPE_SPECS[c.isoType].teu,
    0
  );
  const totalTeuCapacity = stocks.reduce(
    (sum, s) => sum + s.bays * s.rows * Math.min(6, s.maxTiers || 6),
    0
  );
  const occupancyPct =
    totalTeuCapacity > 0
      ? Math.min(100, Math.round((totalTeuOccupied / totalTeuCapacity) * 100))
      : 0;
  const inRepairCount = containers.filter((c) => c.status === 'in_repair').length;

  const handleExportJson = () => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      cranePricePerOp,
      clients,
      stocks,
      roads,
      fences,
      props,
      containers,
      operationLogs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-digital-twin-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const res = importTerminalJson(reader.result);
        if (!res.success) {
          alert(`Import error: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="pointer-events-none fixed top-0 left-0 right-0 z-30 flex flex-wrap items-start justify-between gap-2.5 p-3">
      {/* Top-Left: Camera Controls + Color Scheme Switcher */}
      <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-xl bg-[#11192c]/95 border border-slate-700/70 p-1.5 shadow-xl backdrop-blur-md">
        <button
          onClick={() => setCameraMode('isometric')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            cameraMode === 'isometric'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
              : 'text-slate-300 hover:bg-slate-800/80'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Pure Isometric
        </button>

        <button
          onClick={() => setCameraMode('perspective')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            cameraMode === 'perspective'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
              : 'text-slate-300 hover:bg-slate-800/80'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Free 3D View
        </button>

        <button
          onClick={triggerCameraReset}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/60 transition"
          title="Reset camera angle & zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>

        <div className="h-5 w-px bg-slate-700/80 mx-0.5" />

        {/* Color Scheme Switcher: Dark | Gray | White */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-900/80 border border-slate-700/70">
          <Palette className="w-3.5 h-3.5 text-sky-400 mr-0.5" />
          {THEME_OPTIONS.map((t) => {
            const active = themeMode === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setThemeMode(t.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition ${
                  active
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                title={`Switch to ${t.label} color scheme`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-slate-400/60"
                  style={{ backgroundColor: t.dot }}
                />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top-Center: 2-Phase Workflow Switcher + Crane Op Rate + JSON Import/Export */}
      <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-xl bg-[#11192c]/95 border border-slate-700/70 p-1.5 shadow-xl backdrop-blur-md">
        <button
          onClick={() => setAppMode('constructor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            appMode === 'constructor'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Hammer className="w-3.5 h-3.5" />
          1. Constructor
        </button>

        <button
          onClick={() => setAppMode('operations')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            appMode === 'operations'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          2. Operations
        </button>

        <div className="h-5 w-px bg-slate-700/80 mx-0.5" />

        {/* Editable Crane Operation Price ($20 default) */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs"
          title="Price per Crane Operation (used to calculate buried container re-handling costs)"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400 text-[11px]">Crane Op:</span>
          <input
            type="number"
            min={0}
            step={1}
            value={cranePricePerOp}
            onChange={(e) => setCranePricePerOp(Number(e.target.value))}
            className="w-12 bg-slate-800 text-emerald-300 font-mono font-bold text-xs px-1.5 py-0.5 rounded border border-slate-600 focus:outline-none focus:border-sky-400"
          />
        </div>

        <div className="h-5 w-px bg-slate-700/80 mx-0.5" />

        {/* Export / Import / Demo Reset */}
        <button
          onClick={handleExportJson}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Export Terminal Layout & Inventory to JSON"
        >
          <Download className="w-3.5 h-3.5 text-sky-400" />
          Export
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Import Terminal Layout & Inventory from JSON"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-400" />
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />

        <button
          onClick={() => {
            if (
              window.confirm(
                'Reset layout and container inventory back to the pre-loaded Demo Digital Twin?'
              )
            ) {
              resetToDemoTerminal();
            }
          }}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
          title="Restore default Demo Terminal"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Demo
        </button>
      </div>

      {/* Top-Right: Live KPI HUD Card */}
      <div className="pointer-events-auto flex items-center gap-5 rounded-2xl bg-[#11192c]/95 border border-slate-700/70 px-4 py-2 shadow-xl backdrop-blur-md">
        <div>
          <div className="text-lg font-extrabold text-white leading-none">
            {totalContainers}{' '}
            <span className="text-xs font-normal text-slate-400">
              ({totalTeuOccupied} TEU)
            </span>
          </div>
          <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-1">
            Containers in Depot
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        <div>
          <div className="text-lg font-extrabold text-sky-400 leading-none">
            {occupancyPct}%
          </div>
          <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-1">
            Stock Occupancy
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        <div>
          <div className="text-lg font-extrabold text-rose-500 leading-none">
            {inRepairCount}
          </div>
          <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-1">
            In Repair
          </div>
        </div>
      </div>
    </header>
  );
};
