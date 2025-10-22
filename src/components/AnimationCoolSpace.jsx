import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef } from "react";

// Simplified configuration focusing on mesh and particles
const CONFIG = {
  sphere: {
    radius: 2.2,
    // subdivisions: 3,
    subdivisions: 15,
    color: '#6356ee',
    opacity: 0.05,
    rotationSpeed: {
      y: 0.1,
      xAmplitude: 0.2,
      xFrequency: 0.3,
    },
    distortion: {
      distort: 0.4,
      speed: 1.3,
    },
  },
  particles: {
    count: 2000,
    radius: 4,
    color: '#a855f7',
    size: 0.02,
    speed: 0.5,
  },
  camera: {
    fov: 55,
    position: [0, 0, 6],
  }
};

// // Animated particle field around the sphere
// function ParticleField({ config = CONFIG.particles }) {
//   const ref = useRef();
  
//   const particles = useMemo(() => {
//     const positions = new Float32Array(config.count * 3);
//     for (let i = 0; i < config.count; i++) {
//       const phi = Math.acos(-1 + (2 * i) / config.count);
//       const theta = Math.sqrt(config.count * Math.PI) * phi;
//       const x = Math.cos(theta) * Math.sin(phi) * config.radius;
//       const y = Math.sin(theta) * Math.sin(phi) * config.radius;
//       const z = Math.cos(phi) * config.radius;
//       positions[i * 3] = x + (Math.random() - 0.5) * 2;
//       positions[i * 3 + 1] = y + (Math.random() - 0.5) * 2;
//       positions[i * 3 + 2] = z + (Math.random() - 0.5) * 2;
//     }
//     return positions;
//   }, [config.count, config.radius]);

//   useFrame((state) => {
//     if (ref.current) {
//       ref.current.rotation.y += 0.001;
//       // Pulsing effect
//       const scale = 1 + Math.sin(state.clock.elapsedTime * config.speed) * 0.1;
//       ref.current.scale.setScalar(scale);
//     }
//   });

//   return (
//     <Points ref={ref} positions={particles}>
//       <PointMaterial
//         transparent
//         color={config.color}
//         size={config.size}
//         sizeAttenuation={true}
//         depthWrite={false}
//         blending={THREE.AdditiveBlending}
//       />
//     </Points>
//   );
// }

// Clean wireframe sphere with distortion
function WireSphere({ config = CONFIG.sphere }) {
  const meshRef = useRef();
  
  useFrame((state, dt) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * config.rotationSpeed.y;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * config.rotationSpeed.xFrequency) * config.rotationSpeed.xAmplitude;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[config.radius, config.subdivisions]} />
      {/* <meshBasicMaterial
        wireframe
        transparent
        color={config.color}
        opacity={config.opacity}
      /> */}
      <MeshDistortMaterial
        wireframe
        transparent
        color={config.color}
        opacity={config.opacity}
        distort={config.distortion.distort}
        speed={config.distortion.speed}
        roughness={0}
        metalness={0}
        emissive={config.color}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

export default function HeroCanvas({ config = CONFIG }) {
  return (
    <div style={{
      position: 'fixed', 
      inset: 0, 
      zIndex: -1, 
      pointerEvents: 'none',
      // background: 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a0a 100%)'
      // background: 'radial-gradient(circle at center, #c9c9ebff 0%, #ffffff 100%)'
    }}>
      <Canvas 
        camera={{ 
          fov: config.camera.fov, 
          position: config.camera.position 
        }} 
        dpr={[1, 2]}
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: "high-performance"
        }}
      >
        {/* <ParticleField config={config.particles} /> */}
        <WireSphere config={config.sphere} />
      </Canvas>
    </div>
  );
}
