import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useState, useMemo } from "react";

// Simplified configuration focusing on mesh
const CONFIG = {
  sphere: {
    radius: 1.8,
    subdivisions: 15,
    color: '#c65d3b',
    opacity: 0.12,
    rotationSpeed: {
      y: 0.1,
      xAmplitude: 0.2,
      xFrequency: 0.3,
    },
    distortion: {
      distort: 0.4,
      speed: 1.2,
    },
  },
  camera: {
    fov: 55,
    position: [0, 0, 6],
  }
};

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
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

// Data nodes on sphere surface
function SphereNodes({ count = 20, sphereRadius = 2.2, color = '#c65d3b' }) {
  const pointsRef = useRef();
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      
      const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
      const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
      const z = sphereRadius * Math.cos(phi);
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, [count, sphereRadius]);

  useFrame((state) => {
    if (pointsRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
      pointsRef.current.material.size = 0.04 * scale;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} key={count}>
      <PointMaterial
        transparent
        color={color}
        size={0.04}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.6}
      />
    </Points>
  );
}

export default function HeroCanvas({ config = CONFIG, isBackground = true }) {
  return (
    <div style={{
      position: isBackground ? 'fixed' : 'relative', 
      inset: isBackground ? 0 : undefined,
      width: '100%',
      height: isBackground ? '100%' : '400px',
      zIndex: isBackground ? -1 : 0, 
      pointerEvents: 'none',
      background: isBackground ? 'radial-gradient(ellipse at center, #f5f0e8 0%, #faf8f5 100%)' : 'transparent',
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
        <WireSphere config={config.sphere} />
      </Canvas>
    </div>
  );
}

// Gear icon SVG
function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// Interactive version with button controls
export function InteractiveHeroCanvas() {
  const [distortion, setDistortion] = useState('medium');
  const [speed, setSpeed] = useState('medium');
  const [detail, setDetail] = useState('medium');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const distortionValues = { low: 0.2, medium: 0.4, high: 0.6 };
  const speedValues = { slow: 0.05, medium: 0.3, fast: 0.8 };
  const detailValues = { low: 8, medium: 15, high: 25 };

  const config = {
    sphere: {
      ...CONFIG.sphere,
      subdivisions: detailValues[detail],
      rotationSpeed: {
        ...CONFIG.sphere.rotationSpeed,
        y: speedValues[speed],
      },
      distortion: {
        distort: distortionValues[distortion],
        speed: 1.2,
      },
    },
  };

  const ControlGroup = ({ label, options, value, onChange }) => (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ 
        fontSize: '10px', 
        textTransform: 'uppercase', 
        letterSpacing: '0.06em',
        color: '#9a938b',
        marginBottom: '5px',
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: '3px' }}>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              border: value === opt ? '1px solid #c65d3b' : '1px solid rgba(198, 93, 59, 0.25)',
              background: value === opt ? 'rgba(198, 93, 59, 0.15)' : 'transparent',
              color: value === opt ? '#c65d3b' : '#6b6560',
              borderRadius: '3px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: 'Figtree, system-ui, sans-serif',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'relative',
      height: '100%',
      aspectRatio: '1 / 1',
      border: '1px solid rgba(198, 93, 59, 0.25)',
      borderRadius: '4px',
      overflow: 'hidden',
      background: '#faf8f5',
    }}>
      {/* Canvas fills the box */}
      <Canvas
        camera={{ fov: 55, position: [0, 0, 6] }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ width: '100%', height: '100%' }}
      >
        <WireSphere config={config.sphere} />
      </Canvas>

      {/* Gear button in top-right corner */}
      <button
        onClick={() => setSettingsOpen(o => !o)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: settingsOpen ? 'rgba(198, 93, 59, 0.15)' : 'rgba(250, 248, 245, 0.7)',
          border: '1px solid rgba(198, 93, 59, 0.25)',
          borderRadius: '4px',
          cursor: 'pointer',
          color: settingsOpen ? '#c65d3b' : '#9a938b',
          transition: 'all 0.2s ease',
          zIndex: 10,
        }}
      >
        <GearIcon />
      </button>

      {/* Settings panel — slides in from top-right corner */}
      {settingsOpen && (
        <div style={{
          position: 'absolute',
          top: '46px',
          right: '10px',
          padding: '12px 14px',
          background: 'rgba(250, 248, 245, 0.92)',
          border: '1px solid rgba(198, 93, 59, 0.25)',
          borderRadius: '4px',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
        }}>
          <ControlGroup label="Distortion" options={['low', 'medium', 'high']} value={distortion} onChange={setDistortion} />
          <ControlGroup label="Rotation" options={['slow', 'medium', 'fast']} value={speed} onChange={setSpeed} />
          <ControlGroup label="Detail" options={['low', 'medium', 'high']} value={detail} onChange={setDetail} />
        </div>
      )}
    </div>
  );
}
