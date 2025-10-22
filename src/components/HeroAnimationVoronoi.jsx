import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMemo } from 'react';

/** ---- Tunables ---- */
const PALETTE = {
  bg: '#0b0f1a',
  c1: '#7aa8ff',
  c2: '#a8d1ff',
  c3: '#ffffff',
};
const WAVE_AMP   = 0.55;
const WAVE_FREQ  = 7.0;
const WAVE_SPEED = 0.4;
const SOURCES    = 3;
const FALL_OFF   = 0.6;
const VIGNETTE   = 0.65;
const GRAIN      = 0.08;

function FullscreenWaves() {
  const { viewport, size } = useThree();
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Build shader once (per mount)
  const shader = useMemo(() => {
    const uniforms = {
      uTime:       { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uAmp:        { value: WAVE_AMP },
      uFreq:       { value: WAVE_FREQ },
      uSpeed:      { value: prefersReducedMotion ? 0.0 : WAVE_SPEED },
      uSources:    { value: SOURCES },
      uFalloff:    { value: FALL_OFF },
      uColBg:      { value: new THREE.Color(PALETTE.bg).convertSRGBToLinear() },
      uCol1:       { value: new THREE.Color(PALETTE.c1).convertSRGBToLinear() },
      uCol2:       { value: new THREE.Color(PALETTE.c2).convertSRGBToLinear() },
      uCol3:       { value: new THREE.Color(PALETTE.c3).convertSRGBToLinear() },
      uVignette:   { value: VIGNETTE },
      uGrain:      { value: GRAIN },
    };

    const vs = /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fs = /* glsl */`
      precision highp float;
      varying vec2 vUv;

      uniform vec2  uResolution;
      uniform float uTime;
      uniform float uAmp;
      uniform float uFreq;
      uniform float uSpeed;
      uniform float uFalloff;
      uniform float uVignette;
      uniform float uGrain;
      uniform int   uSources;
      uniform vec3  uColBg, uCol1, uCol2, uCol3;

      float hash(vec2 p){
        p = vec2(dot(p, vec2(127.1,311.7)), dot(p, vec2(269.5,183.3)));
        return fract(sin(p.x+p.y)*43758.5453123);
      }
      vec3 palette(float t){
        vec3 a = mix(uCol1, uCol2, smoothstep(0.0, 1.0, t));
        vec3 b = mix(uCol2, uCol3, smoothstep(0.0, 1.0, t));
        return mix(a, b, t*(1.0-t)*4.0);
      }

      void main(){
        vec2 uv = vUv;
        vec2 st = uv*2.0-1.0;
        st.x *= uResolution.x/uResolution.y;

        float t = uTime * uSpeed;
        float sum = 0.0;
        float ring = 0.55;

        for(int i=0; i<6; i++){
          if(i >= uSources) break;
          float fi = float(i);
          float ang = fi*6.2831853/float(max(uSources,1)) + sin(t*0.3 + fi)*0.15;
          vec2 src = vec2(cos(ang), sin(ang))*ring;
          src *= (1.0 + 0.05 * sin(t*0.7 + fi*1.3));

          float d = length(st - src);
          float phase = uFreq * d - t * 6.2831853;
          float w = sin(phase);
          float fall = 1.0 / (1.0 + uFalloff * d * 2.0);

          sum += w * fall;
        }

        float n = 0.5 + 0.5 * (sum * 0.6);
        n = smoothstep(0.15, 0.85, n);

        vec3 col = palette(n);
        col = mix(uColBg, col, 0.9);

        float grad = length(vec2(dFdx(n), dFdy(n)));
        float highlight = smoothstep(0.08, 0.0, grad);
        col += 0.15 * highlight;

        float r = length(st);
        float vig = smoothstep(1.2, uVignette, r);
        col *= mix(1.0, 0.85, vig);

        if(uGrain > 0.001){
          float g = hash(uv + fract(t))*2.0 - 1.0;
          col += g * 0.02 * uGrain;
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    return { uniforms, vs, fs };
  }, [size.width, size.height, prefersReducedMotion]);

  // Animate time + keep resolution in sync
  useFrame(({ clock, size }) => {
    shader.uniforms.uTime.value = clock.getElapsedTime();
    shader.uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        vertexShader={shader.vs}
        fragmentShader={shader.fs}
        uniforms={shader.uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function HeroWaves() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }} aria-hidden="true">
      <Canvas camera={{ fov: 55, position: [0, 0, 5] }} dpr={[1, 2]}>
        <color attach="background" args={['transparent']} />
        <FullscreenWaves />
      </Canvas>
    </div>
  );
}
