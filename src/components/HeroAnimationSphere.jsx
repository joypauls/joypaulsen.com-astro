import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef } from "react";

const CONFIG = {
  sphere: {
    radius: 2.2,
    subdivisions: 1,
    color: '#452bd7',
    opacity: 0.25,
    rotationSpeed: {
      y: 0.15,
      xAmplitude: 0.1,
      xFrequency: 0.2,
    }
  },
  particles: {
    count: 2000,
    size: 0.015,
    color: '#6366f1',
    radius: 4,
  },
  camera: {
    fov: 55,
    position: [0, 0, 6],
  }
};

function ParticleField({ config = CONFIG.particles }) {
  const ref = useRef();
  const { viewport } = useThree();
  
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(config.count * 3);
    const colors = new Float32Array(config.count * 3);
    const color = new THREE.Color(config.color);
    
    for (let i = 0; i < config.count; i++) {
      const i3 = i * 3;
      const radius = config.radius * (0.5 + Math.random() * 0.5);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      const mixFactor = Math.random();
      colors[i3] = color.r * (0.5 + mixFactor * 0.5);
      colors[i3 + 1] = color.g * (0.5 + mixFactor * 0.5);
      colors[i3 + 2] = color.b * (0.5 + mixFactor * 0.5);
    }
    
    return [positions, colors];
  }, [config.count, config.color, config.radius]);

  useFrame((state, delta) => {
    ref.current.rotation.y += delta * 0.05;
    ref.current.rotation.x += delta * 0.02;
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        vertexColors
        size={config.size}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function WireSphere({ config = CONFIG.sphere, mousePosition }) {
  const ref = useRef();
  
  useFrame((state, dt) => {
    ref.current.rotation.y += dt * config.rotationSpeed.y;
    
    const targetX = Math.sin(state.clock.elapsedTime * config.rotationSpeed.xFrequency) * config.rotationSpeed.xAmplitude;
    const mouseInfluence = mousePosition.x * 0.3;
    ref.current.rotation.x = targetX + mouseInfluence;
    ref.current.rotation.z = mousePosition.y * 0.2;
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[config.radius, config.subdivisions]} />
      <meshBasicMaterial 
        wireframe 
        opacity={config.opacity} 
        transparent 
        color={config.color} 
      />
    </mesh>
  );
}

function NestedGeometry({ config, scale, rotationMultiplier, opacity }) {
  const ref = useRef();
  
  useFrame((state, dt) => {
    ref.current.rotation.y -= dt * config.rotationSpeed.y * rotationMultiplier;
    ref.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.3) * 0.15;
  });

  return (
    <mesh ref={ref} scale={scale}>
      <icosahedronGeometry args={[config.radius, config.subdivisions + 1]} />
      <meshBasicMaterial 
        wireframe 
        opacity={opacity} 
        transparent 
        color={config.color} 
      />
    </mesh>
  );
}

export default function HeroCanvas({ config = CONFIG }) {
  const mousePosition = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    mousePosition.current = {
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: -(e.clientY / window.innerHeight) * 2 + 1,
    };
  };

  return (
    <div 
      style={{position:'fixed', inset:0, zIndex:-1, pointerEvents:'auto'}}
      onMouseMove={handleMouseMove}
    >
      <Canvas 
        camera={{ 
          fov: config.camera.fov, 
          position: config.camera.position 
        }} 
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        {/* <ParticleField config={config.particles} /> */}
        <WireSphere config={config.sphere} mousePosition={mousePosition.current} />
        {/* <NestedGeometry 
          config={config.sphere} 
          scale={0.7} 
          rotationMultiplier={0.7} 
          opacity={0.15} 
        /> */}
        {/* <NestedGeometry 
          config={config.sphere} 
          scale={1.3} 
          rotationMultiplier={1.3} 
          opacity={0.1} 
        /> */}
      </Canvas>
    </div>
  );
}