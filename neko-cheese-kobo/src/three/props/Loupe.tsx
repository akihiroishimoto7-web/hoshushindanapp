import * as THREE from 'three';

/** まほうの むしめがね */
export function Loupe() {
  return (
    <group>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.3, 0.05, 12, 32]} />
        <meshStandardMaterial color="#f2c94c" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.29, 32]} />
        <meshStandardMaterial color="#cfeeff" transparent opacity={0.45} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0.48, 0, 0]} rotation-z={Math.PI / 2}>
        <capsuleGeometry args={[0.05, 0.32, 4, 10]} />
        <meshStandardMaterial color="#b0603a" roughness={0.6} />
      </mesh>
      <mesh position={[0.08, 0.02, -0.1]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.06, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}
