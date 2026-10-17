import * as THREE from 'three'

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uOpacity;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }

  void main() {
    float y = vUv.y;
    float x = (vUv.x - 0.5) * 2.0;

    // oscilação lateral que cresce em direção à ponta
    float sway = (noise(vec2(y * 3.0 - uTime * 2.2, uTime * 0.7)) - 0.5) * 0.55 * y * y;
    sway += sin(uTime * 7.0 + y * 5.0) * 0.05 * y;
    x += sway;

    // silhueta em gota
    float w = 0.62 * pow(sin(3.14159 * pow(y, 0.62)), 0.85) * (1.0 - 0.25 * y);
    float d = abs(x) / max(w, 0.001);
    float body = 1.0 - smoothstep(0.55, 1.0, d);
    body *= smoothstep(0.0, 0.06, y) * (1.0 - smoothstep(0.92, 1.0, y));

    vec3 blue = vec3(0.35, 0.55, 1.0);
    vec3 yellow = vec3(1.0, 0.86, 0.45);
    vec3 orange = vec3(1.0, 0.45, 0.12);
    vec3 col = mix(yellow, orange, smoothstep(0.25, 0.9, y));
    col = mix(blue, col, smoothstep(0.0, 0.2, y + (1.0 - d) * 0.1));
    float core = smoothstep(0.55, 0.0, d) * smoothstep(0.55, 0.0, y);
    col += core * vec3(0.5, 0.45, 0.4);

    float a = body * uIntensity * uOpacity;
    gl_FragColor = vec4(col * (0.9 + 0.5 * body), a);
  }
`

export const createFlameMaterial = () =>
  new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uOpacity: { value: 1 },
    },
  })

const haloFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform float uTime;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float pulse = 0.92 + 0.08 * sin(uTime * 7.0);
    float a = pow(max(1.0 - r, 0.0), 2.4) * 0.5 * uIntensity * uOpacity * pulse;
    gl_FragColor = vec4(vec3(1.0, 0.55, 0.2), a);
  }
`

/** Halo quente ao redor da chama (brilho que se espalha sobre a cera). */
export const createHaloMaterial = () =>
  new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: haloFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uOpacity: { value: 1 },
    },
  })
