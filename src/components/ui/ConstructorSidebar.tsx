import React, { useState } from 'react';
import {
  Fence,
  Grid,
  Lightbulb,
  MousePointer,
  Plus,
  Route,
  ShieldCheck,
  Trash2,
  Truck,
  Users,
} from 'lucide-react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { ConstructorTool, StockZoneType } from '../../types/terminal';

const TOOL_ITEMS: {
  id: ConstructorTool;
  label: string;
  hint: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'select',
    label: 'Select & Inspect',
    hint: 'Click any Stock, Road, Fence or Prop to edit',
    icon: <MousePointer className="w-4 h-4" />,
  },
  {
    id: 'add_stock',
    label: 'Add Stock (Storage Space)',
    hint: 'Click on grid to create a named container block',
    icon: <Grid className="w-4 h-4 text-sky-400" />,
  },
  {
    id: 'add_road',
    label: 'Draw Roadway',
    hint: 'Click start point and end point on grid',
    icon: <Route className="w-4 h-4 text-amber-400" />,
  },
  {
    id: 'add_fence',
    label: 'Draw Perimeter Fence',
    hint: 'Click start point and end point on grid',
    icon: <Fence className="w-4 h-4 text-emerald-400" />,
  },
  {
    id: 'add_gate_ocr',
    label: 'Place OCR Gate & Scale',
    hint: 'Click on grid to place checkpoint & weighbridge',
    icon: <ShieldCheck className="w-4 h-4 text-purple-400" />,
  },
  {
    id: 'add_reachstacker',
    label: 'Place Reachstacker',
    hint: 'Click on grid to place container loader vehicle',
    icon: <Truck className="w-4 h-4 text-yellow-400" />,
  },
  {
    id: 'add_light_tower',
    label: 'Place Yard Floodlight',
    hint: 'Click on grid to place 13m illumination pole',
    icon: <Lightbulb className="w-4 h-4 text-cyan-300" />,
  },
];

export const ConstructorSidebar: React.FC = () => {
  const appMode = useTerminalStore((s) => s.appMode);
  const activeTool = useTerminalStore((s) => s.activeTool);
  const setActiveTool = useTerminalStore((s) => s.setActiveTool);

  const selectedInfraId = useTerminalStore((s) => s.selectedInfraId);
  const selectedInfraType = useTerminalStore((s) => s.selectedInfraType);
  const selectInfrastructure = useTerminalStore((s) => s.selectInfrastructure);

  const stocks = useTerminalStore((s) => s.stocks);
  const roads = useTerminalStore((s) => s.roads);
  const fences = useTerminalStore((s) => s.fences);
  const props = useTerminalStore((s) => s.props);
  const clients = useTerminalStore((s) => s.clients);

  const updateStock = useTerminalStore((s) => s.updateStock);
  const deleteStock = useTerminalStore((s) => s.deleteStock);
  const updateRoad = useTerminalStore((s) => s.updateRoad);
  const deleteRoad = useTerminalStore((s) => s.deleteRoad);
  const updateFence = useTerminalStore((s) => s.updateFence);
  const deleteFence = useTerminalStore((s) => s.deleteFence);
  const updateProp = useTerminalStore((s) => s.updateProp);
  const deleteProp = useTerminalStore((s) => s.deleteProp);
  const addClient = useTerminalStore((s) => s.addClient);

  const [newClientName, setNewClientName] = useState('');
  const [newClientPrefix, setNewClientPrefix] = useState('');
  const [newClientColor, setNewClientColor] = useState('#a855f7');

  if (appMode !== 'constructor') return null;

  const selectedStock =
    selectedInfraType === 'stock'
      ? stocks.find((s) => s.id === selectedInfraId)
      : null;
  const selectedRoad =
    selectedInfraType === 'road'
      ? roads.find((r) => r.id === selectedInfraId)
      : null;
  const selectedFence =
    selectedInfraType === 'fence'
      ? fences.find((f) => f.id === selectedInfraId)
      : null;
  const selectedProp =
    selectedInfraType === 'prop'
      ? props.find((p) => p.id === selectedInfraId)
      : null;

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    const prefix =
      newClientPrefix.trim().toUpperCase().slice(0, 4) ||
      `${newClientName.trim().toUpperCase().slice(0, 3)}U`;
    addClient({
      name: newClientName.trim(),
      codePrefix: prefix,
      color: newClientColor,
    });
    setNewClientName('');
    setNewClientPrefix('');
  };

  return (
    <aside className="fixed top-20 left-3.5 bottom-3.5 w-80 z-20 flex flex-col gap-3 rounded-2xl bg-[#11192c]/95 border border-slate-700/80 p-3.5 shadow-2xl backdrop-blur-md overflow-y-auto">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
          <span>Phase 1: Terminal Layout Builder</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
            Edit Mode
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Place roads, perimeter fences, and named storage stocks first, then switch to Operations to stack containers.
        </p>
      </div>

      {/* Constructor Tools Palette */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Placement Tools
        </div>
        {TOOL_ITEMS.map((item) => {
          const isActive = activeTool === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTool(item.id)}
              className={`w-full flex items-start gap-2.5 p-2 rounded-xl border text-left transition ${
                isActive
                  ? 'bg-sky-500/20 border-sky-400 text-white shadow'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/70'
              }`}
            >
              <div className="mt-0.5">{item.icon}</div>
              <div>
                <div className="text-xs font-semibold">{item.label}</div>
                <div className="text-[10px] text-slate-400">{item.hint}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Inspector for Selected Stock */}
      {selectedStock && (
        <div className="rounded-xl bg-slate-900/90 border border-sky-500/40 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              Edit Stock Space
            </span>
            <button
              onClick={() => deleteStock(selectedStock.id)}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-rose-500/15"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Stock Name
            </label>
            <input
              type="text"
              value={selectedStock.name}
              onChange={(e) =>
                updateStock(selectedStock.id, {
                  name: e.target.value,
                  badgeLabel: e.target.value,
                })
              }
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Zone Type
              </label>
              <select
                value={selectedStock.zoneType}
                onChange={(e) =>
                  updateStock(selectedStock.id, {
                    zoneType: e.target.value as StockZoneType,
                  })
                }
                className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
              >
                <option value="standard">Standard Stock</option>
                <option value="reefer">Reefer Stock</option>
                <option value="repair">Repair Shop (Roof)</option>
                <option value="loading">Loading Zone</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Pad Color
              </label>
              <input
                type="color"
                value={selectedStock.color}
                onChange={(e) =>
                  updateStock(selectedStock.id, { color: e.target.value })
                }
                className="w-full h-8 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                20ft Bays (L)
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={selectedStock.bays}
                onChange={(e) =>
                  updateStock(selectedStock.id, {
                    bays: Math.max(1, Number(e.target.value)),
                  })
                }
                className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Rows (W)
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={selectedStock.rows}
                onChange={(e) =>
                  updateStock(selectedStock.id, {
                    rows: Math.max(1, Number(e.target.value)),
                  })
                }
                className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Max Tiers (≤6)
              </label>
              <input
                type="number"
                min={1}
                max={6}
                value={selectedStock.maxTiers}
                onChange={(e) =>
                  updateStock(selectedStock.id, {
                    maxTiers: Math.min(6, Math.max(1, Number(e.target.value))),
                  })
                }
                className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Pos X (m)
              </label>
              <input
                type="number"
                step={2}
                value={selectedStock.x}
                onChange={(e) =>
                  updateStock(selectedStock.id, { x: Number(e.target.value) })
                }
                className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Pos Z (m)
              </label>
              <input
                type="number"
                step={2}
                value={selectedStock.z}
                onChange={(e) =>
                  updateStock(selectedStock.id, { z: Number(e.target.value) })
                }
                className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Rotation
              </label>
              <button
                onClick={() =>
                  updateStock(selectedStock.id, {
                    rotationDeg: selectedStock.rotationDeg === 0 ? 90 : 0,
                  })
                }
                className="w-full px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-sky-300"
              >
                {selectedStock.rotationDeg}°
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspector for Selected Road */}
      {selectedRoad && (
        <div className="rounded-xl bg-slate-900/90 border border-amber-500/40 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase">
              Edit Roadway
            </span>
            <button
              onClick={() => deleteRoad(selectedRoad.id)}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-rose-500/15"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Road Name
            </label>
            <input
              type="text"
              value={selectedRoad.name}
              onChange={(e) =>
                updateRoad(selectedRoad.id, { name: e.target.value })
              }
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Width (m)
              </label>
              <input
                type="number"
                min={3}
                max={16}
                step={0.5}
                value={selectedRoad.width}
                onChange={(e) =>
                  updateRoad(selectedRoad.id, { width: Number(e.target.value) })
                }
                className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Dashed Line
              </label>
              <select
                value={selectedRoad.markingColor}
                onChange={(e) =>
                  updateRoad(selectedRoad.id, {
                    markingColor: e.target.value as 'white' | 'yellow',
                  })
                }
                className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
              >
                <option value="white">White Standard</option>
                <option value="yellow">Yellow Loading</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Inspector for Selected Fence */}
      {selectedFence && (
        <div className="rounded-xl bg-slate-900/90 border border-emerald-500/40 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase">
              Edit Fence Segment
            </span>
            <button
              onClick={() => deleteFence(selectedFence.id)}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-rose-500/15"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Fence Label
            </label>
            <input
              type="text"
              value={selectedFence.name}
              onChange={(e) =>
                updateFence(selectedFence.id, { name: e.target.value })
              }
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
            />
          </div>
        </div>
      )}

      {/* Inspector for Selected Prop */}
      {selectedProp && (
        <div className="rounded-xl bg-slate-900/90 border border-purple-500/40 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase">
              Edit Terminal Equipment
            </span>
            <button
              onClick={() => deleteProp(selectedProp.id)}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-rose-500/15"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Badge Label
            </label>
            <input
              type="text"
              value={selectedProp.badgeLabel || ''}
              onChange={(e) =>
                updateProp(selectedProp.id, { badgeLabel: e.target.value })
              }
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Pos X
              </label>
              <input
                type="number"
                step={2}
                value={selectedProp.x}
                onChange={(e) =>
                  updateProp(selectedProp.id, { x: Number(e.target.value) })
                }
                className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Pos Z
              </label>
              <input
                type="number"
                step={2}
                value={selectedProp.z}
                onChange={(e) =>
                  updateProp(selectedProp.id, { z: Number(e.target.value) })
                }
                className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">
                Rotate
              </label>
              <button
                onClick={() =>
                  updateProp(selectedProp.id, {
                    rotationDeg: (selectedProp.rotationDeg + 90) % 360,
                  })
                }
                className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-sky-300"
              >
                {selectedProp.rotationDeg}°
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick List of Existing Stocks */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Configured Stocks ({stocks.length})
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {stocks.map((st) => (
            <button
              key={st.id}
              onClick={() => selectInfrastructure(st.id, 'stock')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border transition ${
                selectedInfraId === st.id
                  ? 'bg-sky-500/20 border-sky-400 text-white'
                  : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: st.color }}
                />
                <span className="truncate font-medium">{st.name}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {st.bays}B×{st.rows}R×{st.maxTiers}T
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Clients / Shipping Lines Manager */}
      <div className="border-t border-slate-800 pt-2.5 space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-sky-400" />
          Clients / Shipping Lines
        </div>
        <div className="flex flex-wrap gap-1.5">
          {clients.map((cl) => (
            <span
              key={cl.id}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[11px] text-slate-200"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cl.color }}
              />
              {cl.name} ({cl.codePrefix})
            </span>
          ))}
        </div>

        <form onSubmit={handleAddClient} className="grid grid-cols-12 gap-1.5">
          <input
            type="text"
            placeholder="New Client"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            className="col-span-5 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
          />
          <input
            type="text"
            placeholder="Prefix"
            maxLength={4}
            value={newClientPrefix}
            onChange={(e) => setNewClientPrefix(e.target.value)}
            className="col-span-3 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-white uppercase"
          />
          <input
            type="color"
            value={newClientColor}
            onChange={(e) => setNewClientColor(e.target.value)}
            className="col-span-2 h-7 w-full rounded bg-slate-900 border border-slate-700 cursor-pointer"
          />
          <button
            type="submit"
            className="col-span-2 flex items-center justify-center rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold"
            title="Add Client"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
};
