// ==========================================================================
// LANDING PAGE - АНИМИРОВАННЫЙ ФОН С ВОЛНАМИ (SILK EFFECT)
// Версия: 1.0
// ==========================================================================

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let scene, camera, renderer, mesh, uniforms, clock;

// ==================== НАСТРОЙКИ ФОНА ====================
const BACKGROUND_CONFIG = {
  color: "#059669", // Зеленый цвет (как у банкнот)
  speed: 1.4, // Скорость анимации (уменьшена на 30%)
  scale: 1.5, // Масштаб узора
  noiseIntensity: 1.5, // Интенсивность шума
  rotation: 0.1, // Поворот
};

// ==================== ШЕЙДЕРЫ ====================

// Vertex Shader
const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
        vPosition = position;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Fragment Shader (Silk/Wave Effect)
const fragmentShader = `
    varying vec2 vUv;
    varying vec3 vPosition;

    uniform float uTime;
    uniform vec3 uColor;
    uniform float uSpeed;
    uniform float uScale;
    uniform float uRotation;
    uniform float uNoiseIntensity;

    const float e = 2.71828182845904523536;

    // Функция шума
    float noise(vec2 texCoord) {
        float G = e;
        vec2 r = (G * sin(G * texCoord));
        return fract(r.x * r.y * (1.0 + texCoord.x));
    }

    // Поворот UV координат
    vec2 rotateUvs(vec2 uv, float angle) {
        float c = cos(angle);
        float s = sin(angle);
        mat2 rot = mat2(c, -s, s, c);
        return rot * uv;
    }

    void main() {
        float rnd = noise(gl_FragCoord.xy);
        vec2 uv = rotateUvs(vUv * uScale, uRotation);
        vec2 tex = uv * uScale;
        float tOffset = uSpeed * uTime;

        // Волновой эффект
        tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

        // Паттерн шелка
        float pattern = 0.6 +
                        0.4 * sin(5.0 * (tex.x + tex.y +
                                        cos(3.0 * tex.x + 5.0 * tex.y) +
                                        0.02 * tOffset) +
                                sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

        vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
        col.a = 1.0;
        gl_FragColor = col;
    }
`;

// ==================== ИНИЦИАЛИЗАЦИЯ THREE.JS ====================

function initBackground() {
  console.log("Initializing background animation...");

  // Сцена
  scene = new THREE.Scene();

  // Камера (Orthographic для полного экрана)
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // Рендерер
  const canvas = document.getElementById("background-canvas");
  if (!canvas) {
    console.error("Background canvas not found!");
    return;
  }

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Uniforms для шейдера
  uniforms = {
    uTime: { value: 0 },
    uSpeed: { value: BACKGROUND_CONFIG.speed },
    uScale: { value: BACKGROUND_CONFIG.scale },
    uNoiseIntensity: { value: BACKGROUND_CONFIG.noiseIntensity },
    uColor: { value: new THREE.Color(BACKGROUND_CONFIG.color) },
    uRotation: { value: BACKGROUND_CONFIG.rotation },
  };

  // Геометрия (плоскость на весь экран)
  const geometry = new THREE.PlaneGeometry(2, 2);

  // Материал (ShaderMaterial)
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });

  // Меш
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Обработчик изменения размера окна
  window.addEventListener("resize", onWindowResize, false);

  // Часы для анимации
  clock = new THREE.Clock();

  // Запуск анимации
  animate();

  console.log("Background animation initialized successfully!");
}

// ==================== ОБРАБОТКА ИЗМЕНЕНИЯ РАЗМЕРА ====================

function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  console.log("Window resized:", window.innerWidth, "x", window.innerHeight);
}

// ==================== АНИМАЦИЯ ====================

function animate() {
  requestAnimationFrame(animate);

  // Обновление времени
  uniforms.uTime.value = clock.getElapsedTime();

  // Рендер
  renderer.render(scene, camera);
}

// ==================== ФУНКЦИИ УПРАВЛЕНИЯ ====================

// Изменить цвет фона
function setBackgroundColor(color) {
  if (uniforms && uniforms.uColor) {
    uniforms.uColor.value = new THREE.Color(color);
  }
}

// Изменить скорость анимации
function setAnimationSpeed(speed) {
  if (uniforms && uniforms.uSpeed) {
    uniforms.uSpeed.value = speed;
  }
}

// Остановить анимацию
function pauseAnimation() {
  // Можно добавить флаг паузы
  console.log("Animation paused");
}

// Возобновить анимацию
function resumeAnimation() {
  console.log("Animation resumed");
}

// ==================== АЛЬТЕРНАТИВНЫЙ ФОН (CSS) ====================
// Если Three.js не поддерживается

function initFallbackBackground() {
  const canvas = document.getElementById("background-canvas");
  if (!canvas) return;

  // CSS градиент как fallback
  canvas.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
  console.log("Fallback background initialized");
}

// ==================== ПРОВЕРКА ПОДДЕРЖКИ WEBGL ====================

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

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Content Loaded");

  // Проверка поддержки WebGL
  if (isWebGLSupported()) {
    initBackground();
  } else {
    console.warn("WebGL not supported, using fallback");
    initFallbackBackground();
  }
});

// ==================== ЭКСПОРТ ФУНКЦИЙ ====================

window.BackgroundAnimation = {
  init: initBackground,
  setColor: setBackgroundColor,
  setSpeed: setAnimationSpeed,
  pause: pauseAnimation,
  resume: resumeAnimation,
  isWebGLSupported: isWebGLSupported,
};
