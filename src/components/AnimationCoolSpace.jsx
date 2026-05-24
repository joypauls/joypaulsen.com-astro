import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useState, useMemo, useEffect } from "react";

// Simplified configuration focusing on mesh
const CONFIG = {
  sphere: {
    radius: 1.8,
    subdivisions: 15,
    color: '#c65d3b',
    opacity: 0.2,
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
  const wireRef = useRef();
  const matRef = useRef();
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(config.color) },
    uTime: { value: 0 },
    uDistort: { value: config.distortion.distort },
    uSpeed: { value: config.distortion.speed },
  }), []);

  useFrame((state, dt) => {
    const cfg = configRef.current;
    const ry = dt * cfg.rotationSpeed.y;
    const rx = Math.sin(state.clock.elapsedTime * cfg.rotationSpeed.xFrequency) * cfg.rotationSpeed.xAmplitude;
    if (meshRef.current) { meshRef.current.rotation.y += ry; meshRef.current.rotation.x = rx; }
    if (wireRef.current) { wireRef.current.rotation.y += ry; wireRef.current.rotation.x = rx; }
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uDistort.value = cfg.distortion.distort;
    uniforms.uSpeed.value = cfg.distortion.speed;
  });

  return (
    <>
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[config.radius, Math.max(config.subdivisions, 20)]} />
      <shaderMaterial
        ref={matRef}
        transparent
        side={THREE.FrontSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          uniform float uTime;
          uniform float uDistort;
          uniform float uSpeed;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          varying vec3 vPos;
          void main() {
            float t = uTime * uSpeed * 0.4;
            vec3 pos = position;
            pos += normal * (
              sin(pos.y * 2.1 + t * 1.1) * cos(pos.z * 1.7 + t * 0.9) +
              sin(pos.z * 1.9 + t * 0.7) * cos(pos.x * 2.3 + t * 1.3) +
              sin(pos.x * 1.5 + t * 1.4) * cos(pos.y * 2.0 + t * 0.8)
            ) * uDistort * 0.33;
            vPos = pos;
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
            vViewDir = normalize(-mvPos.xyz);
            gl_Position = projectionMatrix * mvPos;
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float fresnel = 1.0 - abs(dot(normalize(vNormal), normalize(vViewDir)));
            float luma = dot(uColor, vec3(0.299, 0.587, 0.114));
            vec3 color = mix(vec3(luma), uColor, 0.75);
            float alpha = pow(fresnel, 3.0) * 0.5;
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
    <mesh ref={wireRef}>
      <icosahedronGeometry args={[config.radius, config.subdivisions]} />
      <shaderMaterial
        wireframe
        transparent
        side={THREE.FrontSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          uniform float uTime;
          uniform float uDistort;
          uniform float uSpeed;
          void main() {
            float t = uTime * uSpeed * 0.4;
            vec3 pos = position;
            vec3 n = normal;
            pos += n * (
              sin(pos.y * 2.1 + t * 1.1) * cos(pos.z * 1.7 + t * 0.9) +
              sin(pos.z * 1.9 + t * 0.7) * cos(pos.x * 2.3 + t * 1.3) +
              sin(pos.x * 1.5 + t * 1.4) * cos(pos.y * 2.0 + t * 0.8)
            ) * uDistort * 0.33;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          void main() {
            float luma = dot(uColor, vec3(0.299, 0.587, 0.114));
            vec3 color = mix(vec3(luma), uColor, 0.75);
            gl_FragColor = vec4(color, 0.2);
          }
        `}
      />
    </mesh>
    </>
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
        dpr={[1, 4]}
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

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const placeholder = document.getElementById('anim-placeholder');
    if (placeholder) placeholder.style.display = 'none';
    // Small delay to let WebGL context initialize before showing canvas
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const distortionValues = { low: 0.2, medium: 0.5, high: 0.8 };
  const speedValues = { slow: 0.05, medium: 0.3, fast: 0.8 };
  const detailValues = { low: 8, medium: 15, high: 22 };

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
              border: value === opt ? '1px solid #c65d3b' : '1px solid rgba(198, 93, 59, 0.55)',
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
      border: '1px solid rgba(198, 93, 59, 0.55)',
      borderRadius: '4px',
      overflow: 'hidden',
      background: '#faf8f5',
    }}>
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '28px', height: '28px', border: '2px solid rgba(198,93,59,0.15)', borderTopColor: 'rgba(198,93,59,0.5)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      )}
      {ready && (
        <Canvas
          camera={{ fov: 55, position: [0, 0, 6] }}
          dpr={[1, 4]}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          style={{ width: '100%', height: '100%' }}
        >
          <WireSphere config={config.sphere} />
        </Canvas>
      )}

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
          border: '1px solid rgba(198, 93, 59, 0.55)',
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
          border: '1px solid rgba(198, 93, 59, 0.55)',
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
