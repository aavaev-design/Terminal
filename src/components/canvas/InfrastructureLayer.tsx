import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useTerminalStore } from '../../store/useTerminalStore';
import { BAY_PITCH_M, ROW_PITCH_M } from '../../data/demoTerminal';
import {
  FenceSegment,
  ReachstackerStatus,
  RoadSegment,
  StockZone,
  TerminalProp,
  worldXZToGps,
} from '../../types/terminal';

function FloatingBadge({
  number,
  label,
  position,
  onClick,
}: {
  number?: number;
  label: string;
  position: [number, number, number];
  onClick?: () => void;
}) {
  return (
    <Html
      position={position}
      center
      zIndexRange={[10, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div
        onClick={(e) => {
          if (!onClick) return;
          e.stopPropagation();
          onClick();
        }}
        className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#11192c]/90 border border-sky-500/40 shadow-md shadow-black/60 backdrop-blur-sm cursor-pointer hover:border-sky-400 transition-all select-none whitespace-nowrap"
      >
        {number !== undefined && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-sky-500 text-[#090d16] font-bold text-[10px]">
            {number}
          </span>
        )}
        <span className="text-[11px] font-semibold text-slate-100 tracking-wide">
          {label}
        </span>
      </div>
    </Html>
  );
}

function StockPadMesh({ stock }: { stock: StockZone }) {
  const appMode = useTerminalStore((s) => s.appMode);
  const themeMode = useTerminalStore((s) => s.themeMode);
  const selectedInfraId = useTerminalStore((s) => s.selectedInfraId);
  const selectInfrastructure = useTerminalStore((s) => s.selectInfrastructure);
  const openDropOffModal = useTerminalStore((s) => s.openDropOffModal);

  const isSelected = selectedInfraId === stock.id;
  const totalLength = stock.bays * BAY_PITCH_M;
  const totalWidth = stock.rows * ROW_PITCH_M;
  const rad = (stock.rotationDeg * Math.PI) / 180;

  const slotCellColor =
    themeMode === 'white'
      ? '#cbd5e1'
      : themeMode === 'gray'
      ? '#1f242d'
      : '#0f172a';

  // Build individual bay-row slot outlines
  const slotCells: { key: string; lx: number; lz: number }[] = [];
  for (let b = 0; b < stock.bays; b++) {
    for (let r = 0; r < stock.rows; r++) {
      const lx = -totalLength / 2 + BAY_PITCH_M / 2 + b * BAY_PITCH_M;
      const lz = -totalWidth / 2 + ROW_PITCH_M / 2 + r * ROW_PITCH_M;
      slotCells.push({ key: `${b}-${r}`, lx, lz });
    }
  }

  return (
    <group
      position={[stock.x, 0, stock.z]}
      rotation={[0, -rad, 0]}
      onClick={(e) => {
        if (appMode === 'constructor') {
          e.stopPropagation();
          selectInfrastructure(stock.id, 'stock');
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        openDropOffModal(stock.id);
      }}
    >
      {/* Base Pad */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[totalLength + 0.8, 0.1, totalWidth + 0.8]} />
        <meshStandardMaterial
          color={stock.color}
          transparent
          opacity={isSelected ? 0.38 : 0.18}
          roughness={0.85}
        />
        <Edges
          scale={1}
          threshold={15}
          color={isSelected ? '#38bdf8' : stock.color}
        />
      </mesh>

      {/* Individual 20ft Bay x Row Slot Grid Markings */}
      {slotCells.map((cell) => (
        <mesh key={cell.key} position={[cell.lx, 0.11, cell.lz]}>
          <boxGeometry args={[BAY_PITCH_M - 0.25, 0.02, ROW_PITCH_M - 0.25]} />
          <meshStandardMaterial
            color={slotCellColor}
            transparent
            opacity={0.55}
            roughness={0.9}
          />
        </mesh>
      ))}

      {/* If Repair Shop zoneType === 'repair', render the Canopy Shed Structure on 4 columns */}
      {stock.zoneType === 'repair' && (
        <group>
          {/* 4 Corner Steel Columns */}
          {[
            [-totalLength / 2 - 0.3, -totalWidth / 2 - 0.3],
            [totalLength / 2 + 0.3, -totalWidth / 2 - 0.3],
            [-totalLength / 2 - 0.3, totalWidth / 2 + 0.3],
            [totalLength / 2 + 0.3, totalWidth / 2 + 0.3],
          ].map(([cx, cz], idx) => (
            <mesh key={idx} position={[cx, 4.5, cz]} castShadow>
              <boxGeometry args={[0.3, 9, 0.3]} />
              <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.5} />
            </mesh>
          ))}

          {/* Canopy Roof with Yellow Safety Trim (matching screenshot #3) */}
          <mesh position={[0, 9.1, 0]} castShadow receiveShadow>
            <boxGeometry args={[totalLength + 1.6, 0.45, totalWidth + 1.6]} />
            <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.3} />
            <Edges color="#eab308" />
          </mesh>
        </group>
      )}

      {/* Floating Badge */}
      <FloatingBadge
        number={stock.badgeNumber}
        label={stock.badgeLabel || `${stock.name} (${stock.bays}B×${stock.rows}R)`}
        position={[0, stock.zoneType === 'repair' ? 11.2 : 10.5, 0]}
        onClick={() => {
          if (appMode === 'constructor') {
            selectInfrastructure(stock.id, 'stock');
          } else {
            openDropOffModal(stock.id);
          }
        }}
      />
    </group>
  );
}

function RoadMesh({ road }: { road: RoadSegment }) {
  const appMode = useTerminalStore((s) => s.appMode);
  const themeMode = useTerminalStore((s) => s.themeMode);
  const selectedInfraId = useTerminalStore((s) => s.selectedInfraId);
  const selectInfrastructure = useTerminalStore((s) => s.selectInfrastructure);

  const dx = road.endX - road.startX;
  const dz = road.endZ - road.startZ;
  const length = Math.hypot(dx, dz) || 1;
  const midX = (road.startX + road.endX) / 2;
  const midZ = (road.startZ + road.endZ) / 2;
  const angle = Math.atan2(dz, dx);
  const isSelected = selectedInfraId === road.id;

  const dashColor =
    road.markingColor === 'yellow'
      ? '#eab308'
      : themeMode === 'white'
      ? '#f8fafc'
      : '#cbd5e1';

  const roadBaseColor = isSelected
    ? '#1e3a5f'
    : themeMode === 'white'
    ? '#64748b'
    : themeMode === 'gray'
    ? '#1e222a'
    : '#111a2e';

  return (
    <group>
      <mesh
        position={[midX, 0.02, midZ]}
        rotation={[0, -angle, 0]}
        receiveShadow
        onClick={(e) => {
          if (appMode === 'constructor') {
            e.stopPropagation();
            selectInfrastructure(road.id, 'road');
          }
        }}
      >
        <boxGeometry args={[length, 0.03, road.width]} />
        <meshStandardMaterial
          color={roadBaseColor}
          roughness={0.95}
        />
        {isSelected && <Edges color="#38bdf8" />}
      </mesh>

      {/* Center Dashed Lane Line */}
      <Line
        points={[
          [road.startX, 0.06, road.startZ],
          [road.endX, 0.06, road.endZ],
        ]}
        color={dashColor}
        lineWidth={1.6}
        dashed
        dashSize={1.6}
        gapSize={1.4}
      />
    </group>
  );
}

function FenceMesh({ fence }: { fence: FenceSegment }) {
  const appMode = useTerminalStore((s) => s.appMode);
  const selectedInfraId = useTerminalStore((s) => s.selectedInfraId);
  const selectInfrastructure = useTerminalStore((s) => s.selectInfrastructure);

  const dx = fence.endX - fence.startX;
  const dz = fence.endZ - fence.startZ;
  const length = Math.hypot(dx, dz) || 1;
  const midX = (fence.startX + fence.endX) / 2;
  const midZ = (fence.startZ + fence.endZ) / 2;
  const angle = Math.atan2(dz, dx);
  const isSelected = selectedInfraId === fence.id;

  // Number of fence posts every ~8m
  const postCount = Math.max(2, Math.floor(length / 8) + 1);
  const posts = Array.from({ length: postCount }, (_, i) => {
    const t = i / (postCount - 1);
    return -length / 2 + t * length;
  });

  return (
    <group
      position={[midX, 0, midZ]}
      rotation={[0, -angle, 0]}
      onClick={(e) => {
        if (appMode === 'constructor') {
          e.stopPropagation();
          selectInfrastructure(fence.id, 'fence');
        }
      }}
    >
      {/* Translucent security mesh panel */}
      <mesh position={[0, fence.height / 2, 0]}>
        <boxGeometry args={[length, fence.height, 0.12]} />
        <meshStandardMaterial
          color={isSelected ? '#38bdf8' : '#334155'}
          transparent
          opacity={0.28}
        />
      </mesh>

      {/* Fence posts */}
      {posts.map((lx, idx) => (
        <mesh key={idx} position={[lx, fence.height / 2 + 0.1, 0]}>
          <boxGeometry args={[0.22, fence.height + 0.2, 0.22]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      ))}
    </group>
  );
}

function AnimatedReachstackerMesh({
  prop,
  isSelected,
  onSelect,
}: {
  prop: TerminalProp;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const boomRef = useRef<THREE.Mesh>(null);
  const stocks = useTerminalStore((s) => s.stocks);
  const updateReachstackerTelemetry = useTerminalStore(
    (s) => s.updateReachstackerTelemetry
  );

  // Build patrol path: use prop.waypoints if provided, otherwise patrol around spawn point
  const waypointsRef = useRef<[number, number][]>(
    prop.waypoints && prop.waypoints.length >= 2
      ? prop.waypoints
      : [
          [prop.x - 10, prop.z],
          [prop.x + 10, prop.z],
        ]
  );

  const posRef = useRef(new THREE.Vector3(prop.x, 0, prop.z));
  const headingRef = useRef((prop.rotationDeg * Math.PI) / 180);
  const wpIndexRef = useRef(0);
  const pauseTimerRef = useRef(0);
  const telemetryTimerRef = useRef(0);

  // Report initial telemetry on mount
  useEffect(() => {
    const { lat, lng } = worldXZToGps(prop.x, prop.z);
    let nearestName = 'Main Corridor';
    let bestDist = Infinity;
    for (const st of stocks) {
      const d = Math.hypot(st.x - prop.x, st.z - prop.z);
      if (d < bestDist) {
        bestDist = d;
        nearestName = st.name;
      }
    }
    updateReachstackerTelemetry({
      id: prop.id,
      x: prop.x,
      z: prop.z,
      lat,
      lng,
      nearestStockName: nearestName,
      status: prop.status || 'operating',
      speedKmh: 14,
    });
  }, [prop.id]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const waypoints = waypointsRef.current;
    const targetWP = waypoints[wpIndexRef.current % waypoints.length];

    let status: ReachstackerStatus = 'operating';
    let speedKmh = 0;

    if (pauseTimerRef.current > 0) {
      // Operating / lifting container at waypoint near stock
      pauseTimerRef.current -= dt;
      status = 'operating';
      speedKmh = 0;
      if (boomRef.current) {
        boomRef.current.rotation.z =
          0.38 + Math.sin(pauseTimerRef.current * 2.5) * 0.14;
      }
    } else {
      // Driving along road toward next waypoint
      const dx = targetWP[0] - posRef.current.x;
      const dz = targetWP[1] - posRef.current.z;
      const dist = Math.hypot(dx, dz);
      const speedMps = 4.2; // ~15 km/h

      if (dist < 0.35) {
        wpIndexRef.current = (wpIndexRef.current + 1) % waypoints.length;
        pauseTimerRef.current = 2.4; // Pause to operate near stock
      } else {
        const moveDist = Math.min(dist, speedMps * dt);
        posRef.current.x += (dx / dist) * moveDist;
        posRef.current.z += (dz / dist) * moveDist;

        // Smoothly rotate heading to face direction of travel
        const desiredAngle = -Math.atan2(dz, dx);
        let diff = desiredAngle - headingRef.current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        headingRef.current += diff * Math.min(1, dt * 6);

        status = 'transit';
        speedKmh = 15;
        if (boomRef.current) {
          boomRef.current.rotation.z = THREE.MathUtils.lerp(
            boomRef.current.rotation.z,
            0.3,
            dt * 4
          );
        }
      }
    }

    if (groupRef.current) {
      groupRef.current.position.set(posRef.current.x, 0, posRef.current.z);
      groupRef.current.rotation.y = headingRef.current;
    }

    // Throttle live GPS & nearest-stock telemetry updates to every 0.45s
    telemetryTimerRef.current += dt;
    if (telemetryTimerRef.current >= 0.45) {
      telemetryTimerRef.current = 0;
      const cx = posRef.current.x;
      const cz = posRef.current.z;
      const { lat, lng } = worldXZToGps(cx, cz);

      let nearestName = 'Main Corridor';
      let bestDist = Infinity;
      for (const st of stocks) {
        const d = Math.hypot(st.x - cx, st.z - cz);
        if (d < bestDist) {
          bestDist = d;
          nearestName = st.name;
        }
      }

      updateReachstackerTelemetry({
        id: prop.id,
        x: cx,
        z: cz,
        lat,
        lng,
        nearestStockName: nearestName,
        status,
        speedKmh,
      });
    }
  });

  return (
    <group
      ref={groupRef}
      position={[prop.x, 0, prop.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Heavy Yellow Chassis */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[5.2, 1.8, 2.8]} />
        <meshStandardMaterial color="#eab308" roughness={0.5} />
        <Edges color={isSelected ? '#38bdf8' : '#0f172a'} />
      </mesh>
      {/* Operator Cab */}
      <mesh position={[0.4, 2.5, 0]} castShadow>
        <boxGeometry args={[2.1, 1.3, 2.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} />
      </mesh>
      {/* Live GPS Beacon on Cab Roof */}
      <mesh position={[0.4, 3.3, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.3, 12]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
      {/* Telescopic Boom */}
      <mesh
        ref={boomRef}
        position={[1.4, 3.1, 0]}
        rotation={[0, 0, 0.35]}
        castShadow
      >
        <boxGeometry args={[5.5, 0.65, 0.8]} />
        <meshStandardMaterial color="#ca8a04" roughness={0.5} />
      </mesh>
      {/* 4 Heavy Tires */}
      {[
        [-1.7, 0.65, -1.45],
        [-1.7, 0.65, 1.45],
        [1.7, 0.65, -1.45],
        [1.7, 0.65, 1.45],
      ].map(([wx, wy, wz], idx) => (
        <mesh
          key={idx}
          position={[wx, wy, wz]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.65, 0.65, 0.5, 12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
      ))}

      {prop.badgeLabel && (
        <FloatingBadge
          number={prop.badgeNumber}
          label={prop.badgeLabel}
          position={[0, 5.2, 0]}
        />
      )}
    </group>
  );
}

function PropMesh({ prop }: { prop: TerminalProp }) {
  const appMode = useTerminalStore((s) => s.appMode);
  const selectedInfraId = useTerminalStore((s) => s.selectedInfraId);
  const selectInfrastructure = useTerminalStore((s) => s.selectInfrastructure);

  const isSelected = selectedInfraId === prop.id;
  const rad = (prop.rotationDeg * Math.PI) / 180;

  if (prop.type === 'reachstacker') {
    return (
      <AnimatedReachstackerMesh
        prop={prop}
        isSelected={isSelected}
        onSelect={() => {
          if (appMode === 'constructor') {
            selectInfrastructure(prop.id, 'prop');
          }
        }}
      />
    );
  }

  return (
    <group
      position={[prop.x, 0, prop.z]}
      rotation={[0, -rad, 0]}
      onClick={(e) => {
        if (appMode === 'constructor') {
          e.stopPropagation();
          selectInfrastructure(prop.id, 'prop');
        }
      }}
    >
      {prop.type === 'gate_ocr' && (
        <group>
          {/* Security Gate House */}
          <mesh position={[-3.2, 1.8, 0]} castShadow>
            <boxGeometry args={[4.2, 3.6, 3.4]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
            <Edges color={isSelected ? '#38bdf8' : '#0f172a'} />
          </mesh>
          {/* Overhanging Gate Roof */}
          <mesh position={[-1.2, 3.8, 0]} castShadow>
            <boxGeometry args={[8.5, 0.35, 4.4]} />
            <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
            <Edges color="#38bdf8" />
          </mesh>
          {/* Weighbridge Platform */}
          <mesh position={[2.2, 0.08, 0]} receiveShadow>
            <boxGeometry args={[4.5, 0.14, 10]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        </group>
      )}

      {prop.type === 'light_tower' && (
        <group>
          {/* Pole */}
          <mesh position={[0, 6.5, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.28, 13, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Floodlight Fixture Head */}
          <mesh position={[0.6, 13, 0]} rotation={[0, 0, -0.25]}>
            <boxGeometry args={[1.6, 0.35, 1.1]} />
            <meshStandardMaterial
              color="#e2e8f0"
              emissive="#38bdf8"
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      )}

      {prop.badgeLabel && (
        <FloatingBadge
          number={prop.badgeNumber}
          label={prop.badgeLabel}
          position={[0, prop.type === 'gate_ocr' ? 6.5 : 5.2, 0]}
        />
      )}
    </group>
  );
}

export const InfrastructureLayer: React.FC = () => {
  const stocks = useTerminalStore((s) => s.stocks);
  const roads = useTerminalStore((s) => s.roads);
  const fences = useTerminalStore((s) => s.fences);
  const props = useTerminalStore((s) => s.props);
  const themeMode = useTerminalStore((s) => s.themeMode);

  const floorColor =
    themeMode === 'white'
      ? '#e2e8f0'
      : themeMode === 'gray'
      ? '#252a34'
      : '#0b101d';

  const gridPrimary =
    themeMode === 'white'
      ? '#94a3b8'
      : themeMode === 'gray'
      ? '#434c5e'
      : '#1e2c4a';

  const gridSecondary =
    themeMode === 'white'
      ? '#cbd5e1'
      : themeMode === 'gray'
      ? '#323946'
      : '#141e33';

  return (
    <group>
      {/* Blueprint Ground Plane & Isometric Grid */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[240, 240]} />
        <meshStandardMaterial color={floorColor} roughness={0.98} />
      </mesh>

      <gridHelper
        key={themeMode}
        args={[180, 90, gridPrimary, gridSecondary]}
        position={[0, 0.01, 0]}
      />

      {/* Roads */}
      {roads.map((road) => (
        <RoadMesh key={road.id} road={road} />
      ))}

      {/* Fences */}
      {fences.map((fence) => (
        <FenceMesh key={fence.id} fence={fence} />
      ))}

      {/* Storage Stocks */}
      {stocks.map((stock) => (
        <StockPadMesh key={stock.id} stock={stock} />
      ))}

      {/* Terminal Landmarks & Props */}
      {props.map((prop) => (
        <PropMesh key={prop.id} prop={prop} />
      ))}
    </group>
  );
};
