import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { CameraRig } from './CameraRig';
import { Particles } from './fx';
import { TaskMarker } from './common';
import { Realism, setShadows } from './realism';

/**
 * 3D の舞台。スマホの発熱を おさえるため、
 * 描画解像度は最大 2 倍まで、重いときは自動で 1 倍まで下げる。
 */
export function Stage({ children, onLost }: { children: ReactNode; onLost?: () => void }) {
  const maxDpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2);
  const [dpr, setDpr] = useState(Math.min(maxDpr, 1.75));
  return (
    <Canvas
      className="stage"
      shadows
      dpr={dpr}
      gl={{ antialias: true, alpha: false, stencil: false, powerPreference: 'default' }}
      camera={{ fov: 45, near: 0.1, far: 320, position: [0, 5, 10], manual: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.setClearColor('#fff6dc');
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          onLost?.();
        });
      }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(maxDpr, d + 0.25))}
        flipflops={4}
        onFallback={() => {
          setDpr(1);
          setShadows(false);
        }}
      />
      <CameraRig />
      <Realism />
      <Particles />
      <TaskMarker />
      {children}
    </Canvas>
  );
}
