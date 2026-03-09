/* ============================= */
/* DEMO MODE */
/* ============================= */

function enterDemo() {
  localStorage.setItem("current_session_user", "demo_user");

  window.location.href = "debts-tracker/index.html";
}

/* ============================= */
/* MODALS */
/* ============================= */

function openLogin() {
  const modal = document.getElementById("loginModal");

  if (modal) modal.classList.add("active");
}

function openRegister() {
  const modal = document.getElementById("registerModal");

  if (modal) modal.classList.add("active");
}

function switchToRegister() {
  const login = document.getElementById("loginModal");

  if (login) login.classList.remove("active");

  openRegister();
}

function switchToLogin() {
  const reg = document.getElementById("registerModal");

  if (reg) reg.classList.remove("active");

  openLogin();
}

function fakeLogin() {
  alert("Авторизация будет добавлена позже");
}

function fakeRegister() {
  alert("Регистрация будет добавлена позже");
}

/* ============================= */
/* SCROLL REVEAL */
/* ============================= */

document.addEventListener("DOMContentLoaded", () => {
  const revealItems = document.querySelectorAll(".reveal");

  if (revealItems.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },

      { threshold: 0.2 },
    );

    revealItems.forEach((el) => observer.observe(el));
  }
});

/* ============================= */
/* HERO PARALLAX */
/* ============================= */

const heroImg = document.querySelector(".hero-img");

if (heroImg) {
  document.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;

    const y = (e.clientY / window.innerHeight - 0.5) * 20;

    heroImg.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
  });
}

/* ============================= */
/* STICKY STEP HIGHLIGHT */
/* ============================= */

const steps = document.querySelectorAll(".sticky-step");

if (steps.length) {
  window.addEventListener("scroll", () => {
    let index = 0;

    steps.forEach((step, i) => {
      const rect = step.getBoundingClientRect();

      if (rect.top < window.innerHeight / 2) {
        index = i;
      }
    });

    steps.forEach((s) => s.classList.remove("active"));

    steps[index].classList.add("active");
  });
}

/* ============================= */
/* DEMO AMOUNT ANIMATION */
/* ============================= */

function animateDebt() {
  const amountEl = document.getElementById("demoAmount");

  const trendEl = document.getElementById("demoTrend");

  if (!amountEl) return;

  const finalValue = Math.floor(Math.random() * 900000) + 1000;

  const trend = Math.floor(finalValue * (Math.random() * 0.05 + 0.01));

  if (trendEl) {
    trendEl.textContent =
      "▲ +" + trend.toLocaleString("ru-RU") + " ₽ за неделю";
  }

  const duration = 1400;

  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);

    const eased = 1 - Math.pow(1 - progress, 3);

    const value = Math.floor(finalValue * eased);

    amountEl.textContent = value.toLocaleString("ru-RU") + " ₽";

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

animateDebt();
