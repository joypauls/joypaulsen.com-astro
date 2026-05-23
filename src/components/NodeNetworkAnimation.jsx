import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef } from "react";

const CONFIG = {
  nodes: {
    count: 60,
    radius: 3.5,
    color: "#4fd1c5",
    size: 0.05,
    connectionDistance: 1.6,
    maxConnections: 3,
  },
  animation: {
    rotationSpeed: 0.03,
  },
  camera: {
    fov: 55,
    position: [0, 0, 6],
  },
};

function NodeNetwork() {
  const groupRef = useRef();
  const linesRef = useRef();

  const { positions, connections, lineGeometry } = useMemo(() => {
    const positions = [];
    const connections = [];

    for (let i = 0; i < CONFIG.nodes.count; i++) {
      const phi = Math.acos(-1 + (2 * i) / CONFIG.nodes.count);
      const theta = Math.sqrt(CONFIG.nodes.count * Math.PI) * phi;
      const r = CONFIG.nodes.radius * (0.8 + Math.random() * 0.4);

      positions.push(
        new THREE.Vector3(
          r * Math.cos(theta) * Math.sin(phi),
          r * Math.sin(theta) * Math.sin(phi),
          r * Math.cos(phi)
        )
      );
    }

    for (let i = 0; i < positions.length; i++) {
      let count = 0;
      for (let j = i + 1; j < positions.length && count < CONFIG.nodes.maxConnections; j++) {
        if (positions[i].distanceTo(positions[j]) < CONFIG.nodes.connectionDistance) {
          connections.push([i, j]);
          count++;
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(connections.length * 6);
    connections.forEach((conn, i) => {
      const from = positions[conn[0]];
      const to = positions[conn[1]];
      linePositions[i * 6] = from.x;
      linePositions[i * 6 + 1] = from.y;
      linePositions[i * 6 + 2] = from.z;
      linePositions[i * 6 + 3] = to.x;
      linePositions[i * 6 + 4] = to.y;
      linePositions[i * 6 + 5] = to.z;
    });
    geometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    return { positions, connections, lineGeometry: geometry };
  }, []);

  useFrame((state, dt) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * CONFIG.animation.rotationSpeed;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color={CONFIG.nodes.color}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[CONFIG.nodes.size, 8, 8]} />
          <meshBasicMaterial
            color={CONFIG.nodes.color}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          color={CONFIG.nodes.color}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export default function NodeNetworkCanvas() {
  return (
    <div style={{
      position: 'fixed', 
      inset: 0, 
      zIndex: -1, 
      pointerEvents: 'none',
      background: 'radial-gradient(ellipse at center, #0f1419 0%, #0a0a0f 100%)'
    }}>
      <Canvas 
        camera={{ 
          fov: CONFIG.camera.fov, 
          position: CONFIG.camera.position 
        }} 
        dpr={[1, 2]}
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: "high-performance"
        }}
      >
        <NodeNetwork />
      </Canvas>
    </div>
  );
}
