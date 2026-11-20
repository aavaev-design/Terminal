import React, { useMemo, useState } from 'react';
import { Edges, Html } from '@react-three/drei';
import { useTerminalStore } from '../../store/useTerminalStore';
import { ContainerItem, ISO_TYPE_SPECS } from '../../types/terminal';
import { getContainerWorldPosition } from '../../data/demoTerminal';

function SingleContainerMesh({
  container,
  isSelected,
  isBlockingSelected,
  isDimmedByFilter,
}: {
  container: ContainerItem;
  isSelected: boolean;
  isBlockingSelected: boolean;
  isDimmedByFilter: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const stocks = useTerminalStore((s) => s.stocks);
  const clients = useTerminalStore((s) => s.clients);
  const setSelectedContainerId = useTerminalStore((s) => s.setSelectedContainerId);
  const requestContainerAction = useTerminalStore((s) => s.requestContainerAction);
  const getBlockingContainers = useTerminalStore((s) => s.getBlockingContainers);
  const cranePricePerOp = useTerminalStore((s) => s.cranePricePerOp);

  const stock = stocks.find((st) => st.id === container.stockId);
  const client = clients.find((cl) => cl.id === container.ownerId);

  if (!stock) return null;

  const spec = ISO_TYPE_SPECS[container.isoType];
  const { position, rotationY } = getContainerWorldPosition(stock, container);

  const baseColor =
    container.status === 'in_repair'
      ? '#e11d48'
      : client?.color || '#38bdf8';

  // Visual dimensions with slight gap so stacked edges are super crisp
  const L = spec.lengthM - 0.14;
  const W = spec.widthM - 0.12;
  const H = spec.heightM - 0.08;

  // Opacity logic:
  // - If this container is blocking the currently selected buried container, make it X-Ray translucent (0.2)
  // - If dimmed by bottom shipping-line filter, make it 0.24
  const isTransparent = isBlockingSelected || isDimmedByFilter;
  const opacity = isBlockingSelected ? 0.2 : isDimmedByFilter ? 0.24 : 1;

  const edgeColor = isSelected
    ? '#38bdf8'
    : hovered
    ? '#f8fafc'
    : isBlockingSelected
    ? '#38bdf8'
    : '#090d16';

  const blockingAbove = isSelected ? getBlockingContainers(container.id) : [];

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedContainerId(isSelected ? null : container.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* FLATRACK GEOMETRY (20FR / 40FR) */}
      {spec.isFlatrack ? (
        <group>
          {/* Heavy Bottom Platform Beam */}
          <mesh position={[0, -H / 2 + 0.18, 0]} castShadow receiveShadow>
            <boxGeometry args={[L, 0.34, W]} />
            <meshStandardMaterial
              color={baseColor}
              transparent={isTransparent}
              opacity={opacity}
              roughness={0.55}
            />
            <Edges color={edgeColor} />
          </mesh>

          {/* Left End Bulkhead Wall */}
          <mesh position={[-L / 2 + 0.2, 0, 0]} castShadow>
            <boxGeometry args={[0.36, H, W]} />
            <meshStandardMaterial
              color={baseColor}
              transparent={isTransparent}
              opacity={opacity}
              roughness={0.55}
            />
            <Edges color={edgeColor} />
          </mesh>

          {/* Right End Bulkhead Wall */}
          <mesh position={[L / 2 - 0.2, 0, 0]} castShadow>
            <boxGeometry args={[0.36, H, W]} />
            <meshStandardMaterial
              color={baseColor}
              transparent={isTransparent}
              opacity={opacity}
              roughness={0.55}
            />
            <Edges color={edgeColor} />
          </mesh>

          {/* Industrial Machinery / Cargo Crate on Flatrack Deck */}
          <mesh position={[0, -0.15, 0]} castShadow>
            <boxGeometry args={[L * 0.65, H * 0.62, W * 0.72]} />
            <meshStandardMaterial
              color="#475569"
              transparent={isTransparent}
              opacity={opacity}
              metalness={0.35}
              roughness={0.6}
            />
          </mesh>
        </group>
      ) : (
        /* STANDARD DRY / HIGH CUBE / REEFER BOX GEOMETRY */
        <group>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[L, H, W]} />
            <meshStandardMaterial
              color={isSelected ? '#38bdf8' : baseColor}
              transparent={isTransparent}
              opacity={opacity}
              roughness={0.58}
              metalness={0.12}
            />
            <Edges scale={1} threshold={15} color={edgeColor} />
          </mesh>

          {/* Stylized Side Corrugation Accent Bars (like screenshot) */}
          {!isTransparent && (
            <>
              <mesh position={[0, 0.35, W / 2 + 0.01]}>
                <boxGeometry args={[L * 0.84, 0.07, 0.02]} />
                <meshBasicMaterial color="#090d16" />
              </mesh>
              <mesh position={[0, -0.35, W / 2 + 0.01]}>
                <boxGeometry args={[L * 0.84, 0.07, 0.02]} />
                <meshBasicMaterial color="#090d16" />
              </mesh>
              <mesh position={[0, 0.35, -W / 2 - 0.01]}>
                <boxGeometry args={[L * 0.84, 0.07, 0.02]} />
                <meshBasicMaterial color="#090d16" />
              </mesh>
              <mesh position={[0, -0.35, -W / 2 - 0.01]}>
                <boxGeometry args={[L * 0.84, 0.07, 0.02]} />
                <meshBasicMaterial color="#090d16" />
              </mesh>
            </>
          )}

          {/* REEFER COOLING UNIT ON END WALL (20RF / 40HCRF) */}
          {spec.isReefer && (
            <group position={[-L / 2 - 0.06, 0, 0]}>
              <mesh>
                <boxGeometry args={[0.14, H * 0.82, W * 0.78]} />
                <meshStandardMaterial
                  color="#f8fafc"
                  transparent={isTransparent}
                  opacity={opacity}
                  roughness={0.3}
                />
              </mesh>
              {/* Glowing Cyan Reefer Status LED */}
              <mesh position={[-0.09, H * 0.25, 0]}>
                <boxGeometry args={[0.04, 0.22, 0.45]} />
                <meshBasicMaterial color="#06b6d4" />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* Selected Container 3D Popover Card */}
      {isSelected && (
        <Html
          position={[0, H / 2 + 2.2, 0]}
          center
          zIndexRange={[30, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto w-72 rounded-xl bg-[#0f172a]/95 border border-sky-400/70 p-3 shadow-2xl shadow-black/80 backdrop-blur-md text-slate-100 select-none"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2 mb-2">
              <div>
                <div className="text-xs text-sky-400 font-semibold uppercase tracking-wider">
                  {client?.name || 'Client'} • {container.isoType}
                </div>
                <div className="text-sm font-bold font-mono tracking-wide text-white">
                  {container.containerNumber}
                </div>
              </div>
              <button
                onClick={() => setSelectedContainerId(null)}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300 mb-2.5">
              <div className="bg-slate-800/80 px-2 py-1 rounded">
                <span className="text-slate-400 block text-[10px]">Stock</span>
                <span className="font-semibold text-white truncate block">
                  {stock.name}
                </span>
              </div>
              <div className="bg-slate-800/80 px-2 py-1 rounded">
                <span className="text-slate-400 block text-[10px]">
                  Slot (Bay-Row-Tier)
                </span>
                <span className="font-mono font-semibold text-sky-300">
                  B{container.bay}-R{container.row}-T{container.tier}
                </span>
              </div>
              <div className="bg-slate-800/80 px-2 py-1 rounded">
                <span className="text-slate-400 block text-[10px]">Weight</span>
                <span className="font-semibold text-white">
                  {container.weightTons} t
                </span>
              </div>
              <div className="bg-slate-800/80 px-2 py-1 rounded">
                <span className="text-slate-400 block text-[10px]">
                  {spec.isReefer ? 'Reefer Temp' : 'Type'}
                </span>
                <span className="font-semibold text-cyan-300">
                  {spec.isReefer
                    ? `${container.temperatureC ?? -18}°C`
                    : spec.isFlatrack
                    ? 'Open Flatrack'
                    : spec.isHighCube
                    ? 'High Cube 9\'6"'
                    : 'Standard 8\'6"'}
                </span>
              </div>
            </div>

            {/* Buried Container Alert Banner */}
            {blockingAbove.length > 0 && (
              <div className="mb-2.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[11px]">
                <div className="font-semibold text-amber-300 flex items-center justify-between">
                  <span>⚠️ Buried under {blockingAbove.length} container(s)</span>
                  <span className="font-mono">
                    +${blockingAbove.length * 2 * cranePricePerOp}
                  </span>
                </div>
                <div className="text-[10px] text-amber-200/80 mt-0.5">
                  Requires {blockingAbove.length * 2} extra crane ops (move near + place back)
                </div>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => requestContainerAction(container.id, 'release')}
                className="px-2 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition"
              >
                Release
              </button>
              <button
                onClick={() => requestContainerAction(container.id, 'pick_up')}
                className="px-2 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-[11px] transition"
              >
                Pick Up
              </button>
              <button
                onClick={() => requestContainerAction(container.id, 'move')}
                className="px-2 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition"
              >
                Move
              </button>
              <button
                onClick={() => requestContainerAction(container.id, 'repair')}
                className="px-2 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] transition"
              >
                Repair
              </button>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export const ContainerLayer: React.FC = () => {
  const containers = useTerminalStore((s) => s.containers);
  const selectedContainerId = useTerminalStore((s) => s.selectedContainerId);
  const selectedOwnerFilter = useTerminalStore((s) => s.selectedOwnerFilter);
  const getBlockingContainers = useTerminalStore((s) => s.getBlockingContainers);

  // Determine which containers are sitting ON TOP OF the currently selected container
  // so we can render them in X-Ray mode!
  const blockingSelectedIds = useMemo(() => {
    if (!selectedContainerId) return new Set<string>();
    const list = getBlockingContainers(selectedContainerId);
    return new Set(list.map((c) => c.id));
  }, [selectedContainerId, containers, getBlockingContainers]);

  return (
    <group>
      {containers.map((container) => {
        const isSelected = container.id === selectedContainerId;
        const isBlockingSelected = blockingSelectedIds.has(container.id);

        let isDimmedByFilter = false;
        if (selectedOwnerFilter !== 'all') {
          if (selectedOwnerFilter === 'repair') {
            isDimmedByFilter = container.status !== 'in_repair';
          } else {
            isDimmedByFilter = container.ownerId !== selectedOwnerFilter;
          }
        }

        return (
          <SingleContainerMesh
            key={container.id}
            container={container}
            isSelected={isSelected}
            isBlockingSelected={isBlockingSelected}
            isDimmedByFilter={isDimmedByFilter}
          />
        );
      })}
    </group>
  );
};
