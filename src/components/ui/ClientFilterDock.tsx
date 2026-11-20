import React, { useEffect, useState } from 'react';
import {
  Clock,
  Crosshair,
  MapPin,
  Navigation,
  PackagePlus,
  Radio,
  Truck,
} from 'lucide-react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { ISO_TYPE_SPECS, worldXZToGps } from '../../types/terminal';

export const ClientFilterDock: React.FC = () => {
  const appMode = useTerminalStore((s) => s.appMode);
  const clients = useTerminalStore((s) => s.clients);
  const stocks = useTerminalStore((s) => s.stocks);
  const containers = useTerminalStore((s) => s.containers);
  const props = useTerminalStore((s) => s.props);

  const recentlyViewedIds = useTerminalStore((s) => s.recentlyViewedIds);
  const selectedContainerId = useTerminalStore((s) => s.selectedContainerId);
  const reachstackerTelemetry = useTerminalStore((s) => s.reachstackerTelemetry);

  const flyToContainer = useTerminalStore((s) => s.flyToContainer);
  const flyToPosition = useTerminalStore((s) => s.flyToPosition);
  const openDropOffModal = useTerminalStore((s) => s.openDropOffModal);

  const [selectedDropOffStockId, setSelectedDropOffStockId] = useState<string>(
    stocks[0]?.id || ''
  );

  useEffect(() => {
    if (!selectedDropOffStockId && stocks.length > 0) {
      setSelectedDropOffStockId(stocks[0].id);
    }
  }, [stocks, selectedDropOffStockId]);

  if (appMode !== 'operations') return null;

  const recentContainers = recentlyViewedIds
    .map((id) => containers.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const reachstackers = props.filter((p) => p.type === 'reachstacker');

  return (
    <div className="fixed bottom-4 left-4 z-20 w-[415px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl bg-[#11192c]/95 border border-slate-700/80 p-3.5 shadow-2xl backdrop-blur-md space-y-3.5">
      {/* 1. RECENTLY VIEWED CONTAINERS */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            Recently Viewed
          </div>
          <span className="text-[10px] text-slate-400">
            Click to focus in 3D
          </span>
        </div>

        {recentContainers.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {recentContainers.map((c) => {
              const owner = clients.find((cl) => cl.id === c.ownerId);
              const isSelected = selectedContainerId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => flyToContainer(c.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold border transition ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-sm'
                      : 'bg-slate-900/80 border-slate-700/80 text-slate-200 hover:border-sky-400/60 hover:bg-slate-800'
                  }`}
                  title={`Fly to ${c.containerNumber} (${c.isoType} • B${c.bay}-R${c.row}-T${c.tier})`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: owner?.color || '#38bdf8' }}
                  />
                  <span>{c.containerNumber}</span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    {c.isoType}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 italic px-2 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800">
            Click any container in the 3D yard or inventory table to pin it here.
          </div>
        )}
      </div>

      <div className="h-px bg-slate-800" />

      {/* 2. DROP OFF LIST WITH STOCKS */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          <PackagePlus className="w-3.5 h-3.5 text-emerald-400" />
          Drop Off to Stock
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDropOffStockId}
            onChange={(e) => setSelectedDropOffStockId(e.target.value)}
            className="flex-1 min-w-0 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-medium text-white focus:outline-none focus:border-sky-400"
          >
            {stocks.map((st) => {
              const occupiedTeu = containers
                .filter((c) => c.stockId === st.id)
                .reduce((sum, c) => sum + ISO_TYPE_SPECS[c.isoType].teu, 0);
              const capTeu = st.bays * st.rows * Math.min(6, st.maxTiers || 6);
              return (
                <option key={st.id} value={st.id}>
                  {st.name} ({occupiedTeu}/{capTeu} TEU)
                </option>
              );
            })}
          </select>

          <button
            onClick={() => openDropOffModal(selectedDropOffStockId)}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 transition"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            Drop Off
          </button>
        </div>
      </div>

      <div className="h-px bg-slate-800" />

      {/* 3. REACHSTACKERS LIST WITH LIVE GPS, NEAR STOCK & OPERATING STATUS */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            Reachstackers Fleet ({reachstackers.length})
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
            <Radio className="w-3 h-3 animate-pulse" />
            Live GPS
          </span>
        </div>

        <div className="space-y-1.5">
          {reachstackers.map((rs) => {
            const live = reachstackerTelemetry[rs.id];
            const fallbackGps = worldXZToGps(rs.x, rs.z);
            const lat = (live?.lat ?? fallbackGps.lat).toFixed(5);
            const lng = (live?.lng ?? fallbackGps.lng).toFixed(5);
            const nearStock = live?.nearestStockName || 'Loading Corridor';
            const status = live?.status || rs.status || 'operating';
            const speed = live?.speedKmh ?? 0;

            const isOperating = status === 'operating' || status === 'loading';

            return (
              <div
                key={rs.id}
                onClick={() =>
                  flyToPosition([live?.x ?? rs.x, 2, live?.z ?? rs.z])
                }
                className="group p-2.5 rounded-xl bg-slate-900/75 border border-slate-700/70 hover:border-sky-400/70 cursor-pointer transition"
                title="Click to follow this Reachstacker in the 3D terminal"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOperating
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-sky-400 animate-pulse'
                      }`}
                    />
                    <span className="text-xs font-bold text-white group-hover:text-sky-400 transition">
                      {rs.name}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      isOperating
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    }`}
                  >
                    {isOperating
                      ? 'Operating'
                      : `Operating • ${speed} km/h`}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                  <span className="inline-flex items-center gap-1 font-mono text-slate-300">
                    <Navigation className="w-3 h-3 text-sky-400 shrink-0" />
                    {lat}°N, {lng}°E
                  </span>

                  <span className="inline-flex items-center gap-1 truncate max-w-[165px] text-slate-300 font-medium">
                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    Near: {nearStock}
                  </span>
                </div>
              </div>
            );
          })}

          {reachstackers.length === 0 && (
            <div className="text-[11px] text-slate-400 italic px-2 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800">
              No Reachstackers placed. Switch to <strong>1. Constructor</strong> to add one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
