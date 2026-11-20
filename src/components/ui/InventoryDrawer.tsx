import React, { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  Crosshair,
  FolderTree,
  History,
  Layers,
  LogOut,
  PackagePlus,
  Search,
  Snowflake,
  Table,
  Truck,
  Wrench,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import { useTerminalStore } from '../../store/useTerminalStore';
import {
  ContainerIsoType,
  ContainerItem,
  ISO_TYPE_SPECS,
} from '../../types/terminal';

const ISO_FILTER_OPTIONS: ('ALL' | ContainerIsoType)[] = [
  'ALL',
  '20DC',
  '40DC',
  '40HC',
  '20RF',
  '40HCRF',
  '20FR',
  '40FR',
];

type GroupByMode = 'stock_owner' | 'stock' | 'owner' | 'none';

export const InventoryDrawer: React.FC = () => {
  const isInventoryOpen = useTerminalStore((s) => s.isInventoryOpen);
  const setIsInventoryOpen = useTerminalStore((s) => s.setIsInventoryOpen);

  const containers = useTerminalStore((s) => s.containers);
  const stocks = useTerminalStore((s) => s.stocks);
  const clients = useTerminalStore((s) => s.clients);
  const operationLogs = useTerminalStore((s) => s.operationLogs);

  const selectedContainerId = useTerminalStore((s) => s.selectedContainerId);
  const selectedOwnerFilter = useTerminalStore((s) => s.selectedOwnerFilter);
  const flyToContainer = useTerminalStore((s) => s.flyToContainer);
  const flyToStock = useTerminalStore((s) => s.flyToStock);
  const openDropOffModal = useTerminalStore((s) => s.openDropOffModal);
  const requestContainerAction = useTerminalStore((s) => s.requestContainerAction);
  const getBlockingContainers = useTerminalStore((s) => s.getBlockingContainers);
  const cranePricePerOp = useTerminalStore((s) => s.cranePricePerOp);

  const [activeTab, setActiveTab] = useState<'inventory' | 'logs'>('inventory');
  const [groupByMode, setGroupByMode] = useState<GroupByMode>('stock_owner');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isoFilter, setIsoFilter] = useState<'ALL' | ContainerIsoType>('ALL');
  const [stockFilter, setStockFilter] = useState<string>('ALL');

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const filteredContainers = useMemo(() => {
    return containers.filter((c) => {
      if (selectedOwnerFilter !== 'all') {
        if (selectedOwnerFilter === 'repair') {
          if (c.status !== 'in_repair') return false;
        } else if (c.ownerId !== selectedOwnerFilter) {
          return false;
        }
      }

      if (isoFilter !== 'ALL' && c.isoType !== isoFilter) return false;
      if (stockFilter !== 'ALL' && c.stockId !== stockFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const owner =
          clients.find((cl) => cl.id === c.ownerId)?.name.toLowerCase() || '';
        const stock =
          stocks.find((st) => st.id === c.stockId)?.name.toLowerCase() || '';
        const match =
          c.containerNumber.toLowerCase().includes(q) ||
          c.isoType.toLowerCase().includes(q) ||
          owner.includes(q) ||
          stock.includes(q) ||
          (c.cargoNotes && c.cargoNotes.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [
    containers,
    selectedOwnerFilter,
    isoFilter,
    stockFilter,
    searchQuery,
    clients,
    stocks,
  ]);

  // Hierarchical Grouping: Stock -> Owner -> Containers
  const groupedByStockAndOwner = useMemo(() => {
    return stocks
      .map((stock) => {
        const stockContainers = filteredContainers.filter(
          (c) => c.stockId === stock.id
        );
        const ownerGroups = clients
          .map((owner) => {
            const items = stockContainers
              .filter((c) => c.ownerId === owner.id)
              .sort(
                (a, b) =>
                  a.row - b.row || a.bay - b.bay || a.tier - b.tier
              );
            const teu = items.reduce(
              (sum, item) => sum + ISO_TYPE_SPECS[item.isoType].teu,
              0
            );
            return {
              owner,
              items,
              teu,
            };
          })
          .filter((og) => og.items.length > 0);

        const totalTeu = stockContainers.reduce(
          (sum, item) => sum + ISO_TYPE_SPECS[item.isoType].teu,
          0
        );
        const capacityTeu =
          stock.bays * stock.rows * Math.min(6, stock.maxTiers || 6);

        return {
          stock,
          stockContainers,
          ownerGroups,
          totalTeu,
          capacityTeu,
        };
      })
      .filter((sg) => sg.stockContainers.length > 0);
  }, [stocks, clients, filteredContainers]);

  // Single-level Group By Owner -> Stock
  const groupedByOwner = useMemo(() => {
    return clients
      .map((owner) => {
        const items = filteredContainers
          .filter((c) => c.ownerId === owner.id)
          .sort(
            (a, b) =>
              a.stockId.localeCompare(b.stockId) ||
              a.row - b.row ||
              a.bay - b.bay ||
              a.tier - b.tier
          );
        const teu = items.reduce(
          (sum, item) => sum + ISO_TYPE_SPECS[item.isoType].teu,
          0
        );
        return {
          owner,
          items,
          teu,
        };
      })
      .filter((og) => og.items.length > 0);
  }, [clients, filteredContainers]);

  if (!isInventoryOpen) {
    return (
      <button
        onClick={() => setIsInventoryOpen(true)}
        className="fixed top-20 right-4 z-20 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#11192c]/95 border border-sky-500/50 text-sky-300 hover:text-white hover:border-sky-400 font-semibold text-xs shadow-2xl backdrop-blur-md transition"
      >
        <Table className="w-4 h-4" />
        Open Inventory Table ({containers.length})
      </button>
    );
  }

  const renderContainerRow = (
    container: ContainerItem,
    showOwnerCol: boolean,
    showStockCol: boolean
  ) => {
    const owner = clients.find((cl) => cl.id === container.ownerId);
    const stock = stocks.find((st) => st.id === container.stockId);
    const spec = ISO_TYPE_SPECS[container.isoType];
    const isSelected = selectedContainerId === container.id;
    const blocking = getBlockingContainers(container.id);
    const isBuried = blocking.length > 0;

    return (
      <tr
        key={container.id}
        className={`transition ${
          isSelected ? 'bg-sky-500/15' : 'hover:bg-slate-800/50'
        }`}
      >
        {/* Clickable Container Number -> Transfers Camera to 3D View */}
        <td className="py-2 px-3">
          <button
            onClick={() => flyToContainer(container.id)}
            className="group flex items-center gap-1.5 font-mono font-bold text-sky-400 hover:text-sky-300 underline decoration-sky-500/40 underline-offset-2 text-left"
            title="Click to fly camera directly to this container in the 3D view"
          >
            <Crosshair className="w-3.5 h-3.5 text-sky-400 shrink-0 group-hover:scale-110 transition" />
            <span>{container.containerNumber}</span>
          </button>
          {container.cargoNotes && (
            <div className="text-[10px] text-slate-400 truncate max-w-[140px] pl-5">
              {container.cargoNotes}
            </div>
          )}
        </td>

        {/* Optional Owner Column */}
        {showOwnerCol && (
          <td className="py-2 px-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-[11px] font-medium text-slate-200">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: owner?.color || '#38bdf8' }}
              />
              {owner?.name || 'Unknown'}
            </span>
          </td>
        )}

        {/* ISO Type Badge */}
        <td className="py-2 px-2">
          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono font-bold text-[11px] text-slate-100">
            {spec.isReefer && <Snowflake className="w-3 h-3 text-cyan-400" />}
            {spec.isFlatrack && <Layers className="w-3 h-3 text-amber-400" />}
            <span>{container.isoType}</span>
          </div>
          {spec.isReefer && (
            <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
              {container.temperatureC ?? -18}°C
            </div>
          )}
        </td>

        {/* Slot (Bay-Row-Tier) & Optional Stock Name */}
        <td className="py-2 px-2">
          <button
            onClick={() => flyToContainer(container.id)}
            className="text-left group"
          >
            {showStockCol && (
              <div className="font-semibold text-slate-200 group-hover:text-sky-300 truncate max-w-[125px] text-[11px]">
                {stock?.name || 'Unassigned'}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-1 mt-0.5">
              <span className="font-mono text-[11px] text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/50">
                B{container.bay}-R{container.row}-T{container.tier}
              </span>
              {isBuried && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-semibold"
                  title={`Buried under ${blocking.length} container(s). Extra restack cost: $${
                    blocking.length * 2 * cranePricePerOp
                  }`}
                >
                  <AlertTriangle className="w-2.5 h-2.5" />+{blocking.length}
                </span>
              )}
            </div>
          </button>
        </td>

        {/* Action Buttons: Release, Pick Up, Move, Repair */}
        <td className="py-2 px-2.5 text-right whitespace-nowrap">
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => requestContainerAction(container.id, 'release')}
              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition inline-flex items-center gap-1"
              title="Release Container (Gate-Out)"
            >
              <LogOut className="w-3 h-3" />
              Release
            </button>

            <button
              onClick={() => requestContainerAction(container.id, 'pick_up')}
              className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-[11px] transition inline-flex items-center gap-1"
              title="Pick Up Container"
            >
              <Truck className="w-3 h-3" />
              Pick Up
            </button>

            <button
              onClick={() => requestContainerAction(container.id, 'move')}
              className="p-1.5 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition"
              title="Move / Restack to another Stock or Slot"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            {container.status !== 'in_repair' && (
              <button
                onClick={() => requestContainerAction(container.id, 'repair')}
                className="p-1.5 rounded bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition"
                title="Send to Repair & Inspection Shop"
              >
                <Wrench className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <aside className="fixed top-20 right-3.5 bottom-3.5 w-[640px] max-w-[calc(100vw-1.5rem)] z-20 flex flex-col rounded-2xl bg-[#11192c]/95 border border-slate-700/80 shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'inventory'
                ? 'bg-sky-500 text-slate-950 shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Container Inventory ({filteredContainers.length})
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'logs'
                ? 'bg-sky-500 text-slate-950 shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Crane Operations Log ({operationLogs.length})
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openDropOffModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            Drop Off
          </button>
          <button
            onClick={() => setIsInventoryOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Minimize Inventory Panel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Search, Stock Filter & Grouping Controls Bar */}
          <div className="p-3 border-b border-slate-800/80 space-y-2 bg-slate-900/30">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-7 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search container #, owner, stock, cargo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="col-span-5">
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                >
                  <option value="ALL">All Stocks ({stocks.length})</option>
                  {stocks.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grouping Mode Selector + ISO Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              {/* Group By Switcher */}
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-lg p-0.5">
                <span className="flex items-center gap-1 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <FolderTree className="w-3 h-3 text-sky-400" />
                  Group:
                </span>
                {(
                  [
                    { id: 'stock_owner', label: 'Stock & Owner' },
                    { id: 'stock', label: 'By Stock' },
                    { id: 'owner', label: 'By Owner' },
                    { id: 'none', label: 'Flat' },
                  ] as { id: GroupByMode; label: string }[]
                ).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGroupByMode(g.id)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      groupByMode === g.id
                        ? 'bg-sky-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Collapse / Expand All helper when grouped */}
              {groupByMode !== 'none' && (
                <button
                  onClick={() => {
                    const anyCollapsed = Object.values(collapsedGroups).some(Boolean);
                    if (anyCollapsed) {
                      setCollapsedGroups({});
                    } else {
                      const allKeys: Record<string, boolean> = {};
                      stocks.forEach((s) => {
                        allKeys[`stock-${s.id}`] = true;
                        clients.forEach((c) => {
                          allKeys[`stock-${s.id}-owner-${c.id}`] = true;
                        });
                      });
                      clients.forEach((c) => {
                        allKeys[`owner-${c.id}`] = true;
                      });
                      setCollapsedGroups(allKeys);
                    }
                  }}
                  className="text-[11px] text-sky-400 hover:underline font-medium"
                >
                  {Object.values(collapsedGroups).some(Boolean)
                    ? 'Expand All'
                    : 'Collapse All'}
                </button>
              )}
            </div>

            {/* ISO Container Type Filter Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {ISO_FILTER_OPTIONS.map((type) => (
                <button
                  key={type}
                  onClick={() => setIsoFilter(type)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    isoFilter === type
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type === 'ALL' ? 'All ISO' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Grouped / Tabular Inventory Content */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
            {/* MODE 1: GROUPED BY STOCK & OWNER (DEFAULT) */}
            {groupByMode === 'stock_owner' &&
              groupedByStockAndOwner.map((sg) => {
                const stockKey = `stock-${sg.stock.id}`;
                const isStockCollapsed = !!collapsedGroups[stockKey];

                return (
                  <div
                    key={sg.stock.id}
                    className="rounded-xl border border-slate-700/80 bg-slate-900/50 overflow-hidden"
                  >
                    {/* Top-Level Stock Header */}
                    <div
                      onClick={() => toggleGroupCollapse(stockKey)}
                      className="flex items-center justify-between px-3 py-2 bg-[#0e1526] border-b border-slate-800 cursor-pointer hover:bg-slate-800/70 transition"
                    >
                      <div className="flex items-center gap-2">
                        {isStockCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-sky-400" />
                        )}
                        <span
                          className="w-3 h-3 rounded-sm shrink-0"
                          style={{ backgroundColor: sg.stock.color }}
                        />
                        <span className="font-bold text-xs text-white">
                          {sg.stock.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-sky-300">
                          {sg.stockContainers.length} units • {sg.totalTeu}/
                          {sg.capacityTeu} TEU
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => flyToStock(sg.stock.id)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 flex items-center gap-1"
                          title="Focus camera on this Stock"
                        >
                          <MapPin className="w-3 h-3 text-sky-400" />
                          Focus
                        </button>
                        <button
                          onClick={() => openDropOffModal(sg.stock.id)}
                          className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-[10px] font-semibold text-sky-300"
                        >
                          + Add Here
                        </button>
                      </div>
                    </div>

                    {/* Second-Level Owner Subgroups inside this Stock */}
                    {!isStockCollapsed && (
                      <div className="divide-y divide-slate-800/80">
                        {sg.ownerGroups.map((og) => {
                          const ownerSubKey = `stock-${sg.stock.id}-owner-${og.owner.id}`;
                          const isOwnerCollapsed = !!collapsedGroups[ownerSubKey];

                          return (
                            <div key={og.owner.id} className="bg-slate-900/30">
                              {/* Owner Sub-Header Bar */}
                              <div
                                onClick={() => toggleGroupCollapse(ownerSubKey)}
                                className="flex items-center justify-between px-4 py-1.5 bg-slate-900/80 cursor-pointer hover:bg-slate-800/60 transition"
                              >
                                <div className="flex items-center gap-2">
                                  {isOwnerCollapsed ? (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                                  )}
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: og.owner.color }}
                                  />
                                  <span className="text-xs font-bold text-slate-200">
                                    Owner: {og.owner.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    ({og.items.length} container
                                    {og.items.length > 1 ? 's' : ''} • {og.teu}{' '}
                                    TEU)
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">
                                  Prefix: {og.owner.codePrefix}
                                </span>
                              </div>

                              {/* Containers Table for this Stock + Owner */}
                              {!isOwnerCollapsed && (
                                <table className="w-full text-left border-collapse">
                                  <thead className="bg-slate-900/40 border-b border-slate-800/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <tr>
                                      <th className="py-1.5 px-3">
                                        Container # (Click to Locate)
                                      </th>
                                      <th className="py-1.5 px-2">ISO Type</th>
                                      <th className="py-1.5 px-2">
                                        Slot (Bay-Row-Tier)
                                      </th>
                                      <th className="py-1.5 px-2.5 text-right">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/50 text-xs">
                                    {og.items.map((c) =>
                                      renderContainerRow(c, false, false)
                                    )}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

            {/* MODE 2: GROUPED BY STOCK ONLY */}
            {groupByMode === 'stock' &&
              groupedByStockAndOwner.map((sg) => {
                const stockKey = `stock-${sg.stock.id}`;
                const isStockCollapsed = !!collapsedGroups[stockKey];

                return (
                  <div
                    key={sg.stock.id}
                    className="rounded-xl border border-slate-700/80 bg-slate-900/50 overflow-hidden"
                  >
                    <div
                      onClick={() => toggleGroupCollapse(stockKey)}
                      className="flex items-center justify-between px-3 py-2 bg-[#0e1526] border-b border-slate-800 cursor-pointer hover:bg-slate-800/70 transition"
                    >
                      <div className="flex items-center gap-2">
                        {isStockCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-sky-400" />
                        )}
                        <span
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: sg.stock.color }}
                        />
                        <span className="font-bold text-xs text-white">
                          {sg.stock.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-sky-300">
                          {sg.stockContainers.length} units • {sg.totalTeu} TEU
                        </span>
                      </div>
                    </div>

                    {!isStockCollapsed && (
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900/40 border-b border-slate-800/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <tr>
                            <th className="py-1.5 px-3">Container #</th>
                            <th className="py-1.5 px-2">Owner</th>
                            <th className="py-1.5 px-2">Type</th>
                            <th className="py-1.5 px-2">Slot</th>
                            <th className="py-1.5 px-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-xs">
                          {sg.stockContainers.map((c) =>
                            renderContainerRow(c, true, false)
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}

            {/* MODE 3: GROUPED BY OWNER ONLY */}
            {groupByMode === 'owner' &&
              groupedByOwner.map((og) => {
                const ownerKey = `owner-${og.owner.id}`;
                const isOwnerCollapsed = !!collapsedGroups[ownerKey];

                return (
                  <div
                    key={og.owner.id}
                    className="rounded-xl border border-slate-700/80 bg-slate-900/50 overflow-hidden"
                  >
                    <div
                      onClick={() => toggleGroupCollapse(ownerKey)}
                      className="flex items-center justify-between px-3 py-2 bg-[#0e1526] border-b border-slate-800 cursor-pointer hover:bg-slate-800/70 transition"
                    >
                      <div className="flex items-center gap-2">
                        {isOwnerCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-sky-400" />
                        )}
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: og.owner.color }}
                        />
                        <span className="font-bold text-xs text-white">
                          {og.owner.name} ({og.owner.codePrefix})
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-sky-300">
                          {og.items.length} containers • {og.teu} TEU
                        </span>
                      </div>
                    </div>

                    {!isOwnerCollapsed && (
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900/40 border-b border-slate-800/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <tr>
                            <th className="py-1.5 px-3">Container #</th>
                            <th className="py-1.5 px-2">Type</th>
                            <th className="py-1.5 px-2">Stock & Slot</th>
                            <th className="py-1.5 px-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-xs">
                          {og.items.map((c) =>
                            renderContainerRow(c, false, true)
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}

            {/* MODE 4: FLAT LIST (UNGROUPED) */}
            {groupByMode === 'none' && (
              <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#0e1526] border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-2 px-3">Container #</th>
                      <th className="py-2 px-2">Owner</th>
                      <th className="py-2 px-2">Type</th>
                      <th className="py-2 px-2">Stock & Slot</th>
                      <th className="py-2 px-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredContainers.map((c) =>
                      renderContainerRow(c, true, true)
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {filteredContainers.length === 0 && (
              <div className="py-10 text-center text-slate-400 text-xs">
                No containers match the current filter. Click{' '}
                <button
                  onClick={() => openDropOffModal()}
                  className="text-sky-400 underline font-semibold"
                >
                  Drop Off
                </button>{' '}
                to place a new container.
              </div>
            )}
          </div>
        </>
      ) : (
        /* Crane Operations & Billing Log Tab */
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <span className="text-slate-400">
              Total Logged Crane Operations:
            </span>
            <span className="font-mono font-bold text-white">
              {operationLogs.reduce((s, l) => s + l.craneOperations, 0)} ops •{' '}
              <span className="text-emerald-400">
                ${operationLogs.reduce((s, l) => s + l.totalCostUsd, 0)} USD
              </span>
            </span>
          </div>

          {operationLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/90 flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sky-400">
                    {log.containerNumber}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-200">
                    {log.isoType}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    ({log.ownerName})
                  </span>
                  {log.actionType === 'buried_extract' && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                      Buried Extraction
                    </span>
                  )}
                </div>
                <div className="text-slate-300 text-[11px]">{log.details}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {log.timestamp}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-mono font-extrabold text-emerald-400">
                  ${log.totalCostUsd}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {log.craneOperations} crane op
                  {log.craneOperations > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};
