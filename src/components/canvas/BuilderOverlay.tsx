import React, { useState } from 'react';
import { Edges, Html, Line } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { useTerminalStore } from '../../store/useTerminalStore';
import { BAY_PITCH_M, ROW_PITCH_M } from '../../data/demoTerminal';

function snapToGrid(val: number, step = 2): number {
  return Math.round(val / step) * step;
}

export const BuilderOverlay: React.FC = () => {
  const appMode = useTerminalStore((s) => s.appMode);
  const activeTool = useTerminalStore((s) => s.activeTool);
  const stocks = useTerminalStore((s) => s.stocks);

  const addStock = useTerminalStore((s) => s.addStock);
  const addRoad = useTerminalStore((s) => s.addRoad);
  const addFence = useTerminalStore((s) => s.addFence);
  const addProp = useTerminalStore((s) => s.addProp);

  const [cursorXZ, setCursorXZ] = useState<[number, number]>([0, 0]);
  const [drawStartXZ, setDrawStartXZ] = useState<[number, number] | null>(null);

  if (appMode !== 'constructor' || activeTool === 'select') {
    return null;
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const sx = snapToGrid(e.point.x, 2);
    const sz = snapToGrid(e.point.z, 2);
    setCursorXZ([sx, sz]);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const sx = snapToGrid(e.point.x, 2);
    const sz = snapToGrid(e.point.z, 2);

    if (activeTool === 'add_stock') {
      const nextIndex = stocks.length + 1;
      addStock({
        name: `Stock ${String.fromCharCode(64 + nextIndex)}`,
        zoneType: 'standard',
        x: sx,
        z: sz,
        bays: 2,
        rows: 3,
        maxTiers: 6,
        rotationDeg: 0,
        color: '#38bdf8',
        badgeNumber: nextIndex + 1,
        badgeLabel: `Stock ${String.fromCharCode(64 + nextIndex)}`,
      });
      return;
    }

    if (activeTool === 'add_gate_ocr') {
      addProp({
        type: 'gate_ocr',
        name: 'OCR Gate Checkpoint',
        x: sx,
        z: sz,
        rotationDeg: 0,
        badgeLabel: 'Gate & Weighbridge (OCR)',
      });
      return;
    }

    if (activeTool === 'add_light_tower') {
      addProp({
        type: 'light_tower',
        name: 'Yard Floodlight',
        x: sx,
        z: sz,
        rotationDeg: 0,
      });
      return;
    }

    if (activeTool === 'add_reachstacker') {
      addProp({
        type: 'reachstacker',
        name: 'Reachstacker Loader',
        x: sx,
        z: sz,
        rotationDeg: 0,
        badgeLabel: 'Loading Zone / Reachstacker',
      });
      return;
    }

    if (activeTool === 'add_road' || activeTool === 'add_fence') {
      if (!drawStartXZ) {
        setDrawStartXZ([sx, sz]);
      } else {
        const [startX, startZ] = drawStartXZ;
        if (Math.hypot(sx - startX, sz - startZ) >= 2) {
          if (activeTool === 'add_road') {
            addRoad({
              name: 'Terminal Roadway',
              startX,
              startZ,
              endX: sx,
              endZ: sz,
              width: 6,
              markingColor: 'white',
            });
          } else {
            addFence({
              name: 'Perimeter Fence',
              startX,
              startZ,
              endX: sx,
              endZ: sz,
              height: 2.6,
            });
          }
        }
        setDrawStartXZ(null);
      }
    }
  };

  return (
    <group>
      {/* Invisible Raycast Plane for Constructor Tool Placement */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.08, 0]}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
      >
        <planeGeometry args={[240, 240]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Ghost Preview for Stock Placement */}
      {activeTool === 'add_stock' && (
        <group position={[cursorXZ[0], 0.15, cursorXZ[1]]}>
          <mesh>
            <boxGeometry args={[2 * BAY_PITCH_M, 0.2, 3 * ROW_PITCH_M]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.28} />
            <Edges color="#38bdf8" />
          </mesh>
          <Html position={[0, 2.2, 0]} center>
            <div className="px-2.5 py-1 rounded bg-sky-500 text-slate-950 font-bold text-xs whitespace-nowrap shadow">
              Click to Place New Stock ({cursorXZ[0]}m, {cursorXZ[1]}m)
            </div>
          </Html>
        </group>
      )}

      {/* Ghost Preview for Road or Fence Two-Click Drawing */}
      {(activeTool === 'add_road' || activeTool === 'add_fence') && (
        <group>
          <mesh position={[cursorXZ[0], 0.25, cursorXZ[1]]}>
            <sphereGeometry args={[0.45, 16, 16]} />
            <meshBasicMaterial
              color={activeTool === 'add_road' ? '#eab308' : '#38bdf8'}
            />
          </mesh>
          <Html position={[cursorXZ[0], 2, cursorXZ[1]]} center>
            <div className="px-2.5 py-1 rounded bg-slate-900/95 border border-sky-400 text-sky-300 font-semibold text-xs whitespace-nowrap">
              {!drawStartXZ
                ? `Click Start Point (${cursorXZ[0]}m, ${cursorXZ[1]}m)`
                : `Click End Point (${cursorXZ[0]}m, ${cursorXZ[1]}m)`}
            </div>
          </Html>

          {drawStartXZ && (
            <Line
              points={[
                [drawStartXZ[0], 0.3, drawStartXZ[1]],
                [cursorXZ[0], 0.3, cursorXZ[1]],
              ]}
              color={activeTool === 'add_road' ? '#eab308' : '#38bdf8'}
              lineWidth={3}
            />
          )}
        </group>
      )}

      {/* Ghost Preview for Props */}
      {(activeTool === 'add_gate_ocr' ||
        activeTool === 'add_light_tower' ||
        activeTool === 'add_reachstacker') && (
        <group position={[cursorXZ[0], 0.5, cursorXZ[1]]}>
          <mesh>
            <boxGeometry args={[3, 1, 3]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} />
            <Edges color="#38bdf8" />
          </mesh>
          <Html position={[0, 2, 0]} center>
            <div className="px-2.5 py-1 rounded bg-sky-500 text-slate-950 font-bold text-xs whitespace-nowrap">
              Click to Place ({cursorXZ[0]}m, {cursorXZ[1]}m)
            </div>
          </Html>
        </group>
      )}
    </group>
  );
};
