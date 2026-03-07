// ==========================================================================
// DASHBOARD - GREEN DARK SILK BACKGROUND (FIXED)
// ==========================================================================

let scene, camera, renderer, mesh, uniforms, clock;

const BACKGROUND_CONFIG = {
  colorLight: "#0c4f48", // чуть светлее
  colorDark: "#011211", // почти тот же тёмный
  speed: 0.2, // чуть медленнее
  scale: 1.6,
  noiseIntensity: 0.18, // меньше шума
  rotation: 0.0,
};

// ==================== SHADERS ====================

const vertexShader = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;

uniform float uTime;
uniform vec3 uColorLight;
uniform vec3 uColorDark;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord){
  float G = e;
  vec2 r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle){
  float c = cos(angle);
  float s = sin(angle);
  mat2 rot = mat2(c,-s,s,c);
  return rot * uv;
}

void main(){

  float rnd = noise(gl_FragCoord.xy);

  vec2 uv = rotateUvs(vUv * uScale, uRotation);
  vec2 tex = uv * uScale;
  float tOffset = uSpeed * uTime;

  // более широкие волны
  tex.y += 0.06 * sin(3.5 * tex.x - tOffset);

  float pattern = 0.5 +
  0.5 * sin(5.0 * (tex.x + tex.y +
        cos(3.0 * tex.x + 5.0 * tex.y) +
        0.02 * tOffset) +
        sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  // вместо белого — смешивание двух зелёных оттенков
  vec3 baseColor = mix(uColorDark, uColorLight, pattern);

  // лёгкий шум
  baseColor -= rnd * 0.06 * uNoiseIntensity;

  gl_FragColor = vec4(baseColor, 1.0);
}
`;

// ==================== INIT ====================

function initBackground() {
  if (!isWebGLSupported()) {
    initFallback();
    return;
  }

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const canvas = document.getElementById("background-canvas");
  if (!canvas) return;

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  uniforms = {
    uTime: { value: 0 },
    uSpeed: { value: BACKGROUND_CONFIG.speed },
    uScale: { value: BACKGROUND_CONFIG.scale },
    uNoiseIntensity: { value: BACKGROUND_CONFIG.noiseIntensity },
    uColorLight: { value: new THREE.Color(BACKGROUND_CONFIG.colorLight) },
    uColorDark: { value: new THREE.Color(BACKGROUND_CONFIG.colorDark) },
    uRotation: { value: BACKGROUND_CONFIG.rotation },
  };

  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader,
    fragmentShader,
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  clock = new THREE.Clock();

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}

// ==================== HELPERS ====================

function isWebGLSupported() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}

function initFallback() {
  const canvas = document.getElementById("background-canvas");
  if (canvas) {
    canvas.style.background = "linear-gradient(135deg,#052e2b 0%,#021c17 100%)";
  }
}

// ==================== START ====================

document.addEventListener("DOMContentLoaded", initBackground);
