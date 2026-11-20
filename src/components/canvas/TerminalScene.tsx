import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
} from '@react-three/drei';
import * as THREE from 'three';
import { useTerminalStore } from '../../store/useTerminalStore';
import { InfrastructureLayer } from './InfrastructureLayer';
import { ContainerLayer } from './ContainerLayer';
import { BuilderOverlay } from './BuilderOverlay';

function CameraAnimator({
  controlsRef,
}: {
  controlsRef: React.MutableRefObject<any>;
}) {
  const cameraMode = useTerminalStore((s) => s.cameraMode);
  const cameraTarget = useTerminalStore((s) => s.cameraTarget);
  const resetCameraTrigger = useTerminalStore((s) => s.resetCameraTrigger);
  const { camera } = useThree();

  const desiredLookAt = useRef(new THREE.Vector3(0, 1, 0));
  const desiredCamPos = useRef(new THREE.Vector3(55, 48, 55));
  const isAnimating = useRef(false);
  const animElapsed = useRef(0);
  const prevResetCount = useRef(resetCameraTrigger);
  const prevTargetTimestamp = useRef<number | null>(null);

  // Only trigger fly-to animation when user explicitly clicks a container link in the Inventory Table
  useEffect(() => {
    if (!cameraTarget) return;
    if (prevTargetTimestamp.current === cameraTarget.timestamp) return;
    prevTargetTimestamp.current = cameraTarget.timestamp;

    const [tx, ty, tz] = cameraTarget.position;
    desiredLookAt.current.set(tx, ty, tz);

    if (cameraMode === 'isometric') {
      desiredCamPos.current.set(tx + 42, ty + 38, tz + 42);
      if ('zoom' in camera) {
        (camera as THREE.OrthographicCamera).zoom = 15;
        camera.updateProjectionMatrix();
      }
    } else {
      desiredCamPos.current.set(tx + 24, ty + 18, tz + 24);
    }
    animElapsed.current = 0;
    isAnimating.current = true;
  }, [cameraTarget, cameraMode, camera]);

  // Only trigger reset animation when user explicitly clicks the Reset button
  useEffect(() => {
    if (resetCameraTrigger === prevResetCount.current) return;
    prevResetCount.current = resetCameraTrigger;

    desiredLookAt.current.set(0, 1, 0);
    if (cameraMode === 'isometric') {
      desiredCamPos.current.set(55, 48, 55);
      if ('zoom' in camera) {
        (camera as THREE.OrthographicCamera).zoom = 11.5;
        camera.updateProjectionMatrix();
      }
    } else {
      desiredCamPos.current.set(48, 38, 52);
    }
    animElapsed.current = 0;
    isAnimating.current = true;
  }, [resetCameraTrigger, cameraMode, camera]);

  useFrame((_, delta) => {
    if (!isAnimating.current || !controlsRef.current) return;

    animElapsed.current += delta;
    const step = Math.min(1, delta * 8);

    controlsRef.current.target.lerp(desiredLookAt.current, step);
    camera.position.lerp(desiredCamPos.current, step);
    controlsRef.current.update();

    // Always terminate animation after 0.6s or when close enough so OrbitControls never gets stuck
    if (
      animElapsed.current >= 0.6 ||
      (controlsRef.current.target.distanceTo(desiredLookAt.current) < 0.2 &&
        camera.position.distanceTo(desiredCamPos.current) < 0.3)
    ) {
      isAnimating.current = false;
    }
  });

  // Stop any programmatic animation immediately when the user grabs the canvas with mouse/wheel
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const stopAnim = () => {
      isAnimating.current = false;
    };
    controls.addEventListener('start', stopAnim);
    return () => {
      controls.removeEventListener('start', stopAnim);
    };
  });

  return null;
}

export const TerminalScene: React.FC = () => {
  const cameraMode = useTerminalStore((s) => s.cameraMode);
  const themeMode = useTerminalStore((s) => s.themeMode);
  const setSelectedContainerId = useTerminalStore((s) => s.setSelectedContainerId);
  const selectInfrastructure = useTerminalStore((s) => s.selectInfrastructure);
  const controlsRef = useRef<any>(null);

  const canvasBg =
    themeMode === 'white'
      ? '#eef2f6'
      : themeMode === 'gray'
      ? '#252a34'
      : '#0b101d';

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: canvasBg }}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        onPointerMissed={() => {
          setSelectedContainerId(null);
          selectInfrastructure(null, null);
        }}
      >
        <color attach="background" args={[canvasBg]} />
        <fog attach="fog" args={[canvasBg, 110, 230]} />

        {cameraMode === 'isometric' ? (
          <OrthographicCamera
            makeDefault
            position={[55, 48, 55]}
            zoom={11.5}
            near={-200}
            far={500}
          />
        ) : (
          <PerspectiveCamera
            makeDefault
            position={[48, 38, 52]}
            fov={42}
            near={0.5}
            far={500}
          />
        )}

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.1}
          rotateSpeed={0.85}
          panSpeed={0.9}
          zoomSpeed={1.1}
          maxPolarAngle={Math.PI / 2 - 0.04}
          minPolarAngle={0.15}
          minDistance={10}
          maxDistance={160}
        />

        <CameraAnimator controlsRef={controlsRef} />

        {/* Industrial Terminal Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight
          castShadow
          position={[45, 70, 35]}
          intensity={1.35}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-65}
          shadow-camera-right={65}
          shadow-camera-top={65}
          shadow-camera-bottom={-65}
        />
        <directionalLight
          position={[-40, 30, -35]}
          intensity={0.45}
          color="#38bdf8"
        />

        {/* Layers */}
        <InfrastructureLayer />
        <ContainerLayer />
        <BuilderOverlay />
      </Canvas>
    </div>
  );
};
