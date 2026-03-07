console.log("CHARTS JS LOADED");
// ============================================================================
// CHARTS.JS
// Отрисовка диаграммы должников + анимации + тренд
// ============================================================================

let chartInstance = null;

// ----------------------------------------------------------------------------
// Палитра современных цветов диаграммы
// ----------------------------------------------------------------------------
const CHART_COLORS = ["#34d399", "#60a5fa", "#a78bfa", "#f472b6"];

// ----------------------------------------------------------------------------
// Форматирование суммы
// ----------------------------------------------------------------------------
function formatAmount(value) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
}

// ----------------------------------------------------------------------------
// Форматирование имени должника
// ----------------------------------------------------------------------------
function formatDebtorName(name) {
  if (!name || !name.trim()) return "Без имени";

  const s = name.trim();

  const formatted = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  return formatted.length > 15 ? formatted.slice(0, 13) + "…" : formatted;
}

// ----------------------------------------------------------------------------
// Группировка долгов по должникам
// ----------------------------------------------------------------------------
function getDebtsByDebtor() {
  const debts = typeof getDebts === "function" ? getDebts() : [];

  const byName = {};

  debts.forEach((d) => {
    if (!d.paid && d.amount > 0) {
      const name = (d.debtorName || d.name || "Без имени").trim();

      byName[name] = (byName[name] || 0) + d.amount;
    }
  });

  const total = Object.values(byName).reduce((s, a) => s + a, 0);

  const list = Object.entries(byName).map(([name, amount]) => ({
    name: formatDebtorName(name),

    fullName: name,

    amount,

    percent: total > 0 ? (amount / total) * 100 : 0,
  }));

  list.sort((a, b) => b.amount - a.amount);

  return { list, total };
}

// ----------------------------------------------------------------------------
// АНИМАЦИЯ ЧИСЕЛ (дорогой easing)
// ----------------------------------------------------------------------------
function animateValue(obj, start, end, duration) {
  if (!obj) return;

  let startTimestamp = null;

  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;

    const progress = Math.min((timestamp - startTimestamp) / duration, 1);

    const easeOut = 1 - Math.pow(1 - progress, 3);

    const current = Math.floor(easeOut * (end - start) + start);

    obj.innerHTML = current.toLocaleString("ru-RU") + " ₽";

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

// ----------------------------------------------------------------------------
// Обновление плашки тренда
// ----------------------------------------------------------------------------
function updateTrend(currentTotal) {
  const trendContainer = document.getElementById("trend-container");

  if (!trendContainer) return;

  let lastTotal = localStorage.getItem("dashboard_last_total");

  // первый запуск
  if (lastTotal === null) {
    localStorage.setItem("dashboard_last_total", currentTotal);

    trendContainer.innerHTML = `<div class="debt-trend trend-neutral">
        0% <small>старт</small>
      </div>`;

    return;
  }

  lastTotal = parseFloat(lastTotal);

  const diff = currentTotal - lastTotal;

  if (diff !== 0) {
    let percent = 0;

    if (lastTotal !== 0) {
      percent = Math.abs((diff / lastTotal) * 100).toFixed(0);
    } else {
      percent = 100;
    }

    const isUp = diff > 0;

    const trendHTML = `
      <div class="debt-trend ${isUp ? "trend-up" : "trend-down"}">
        <span>${isUp ? "▲" : "▼"}</span>
        <span>${percent}%</span>
        <small>${isUp ? "рост" : "снижение"}</small>
      </div>
    `;

    trendContainer.innerHTML = trendHTML;

    localStorage.setItem("dashboard_trend_html", trendHTML);

    localStorage.setItem("dashboard_last_total", currentTotal);
  } else {
    const saved = localStorage.getItem("dashboard_trend_html");

    if (saved) {
      trendContainer.innerHTML = saved;
    } else {
      trendContainer.innerHTML = `<div class="debt-trend trend-neutral">
         0% <small>стабильно</small>
        </div>`;
    }
  }
}

// ----------------------------------------------------------------------------
// ОСНОВНАЯ ФУНКЦИЯ ОТРИСОВКИ ДИАГРАММЫ
// ----------------------------------------------------------------------------
function renderChart() {
  const { list, total } = getDebtsByDebtor();

  // обновляем тренд
  updateTrend(total);

  // анимация главной суммы
  const totalDisplay = document.getElementById("totalAmount");

  if (totalDisplay) {
    const current = parseInt(totalDisplay.innerText.replace(/\D/g, "")) || 0;

    if (total > 0) {
      animateValue(totalDisplay, current, total, 1200);
    } else {
      totalDisplay.innerHTML = "0 ₽";
    }
  }

  const canvas = document.getElementById("debtorsChart");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (chartInstance instanceof Chart) {
    chartInstance.destroy();
  }

  // если долгов нет
  if (list.length === 0) {
    drawEmptyState(ctx, canvas);

    return;
  }

  const labels = list.map((d) => d.name);
  const data = list.map((d) => d.amount);
  const colors = list.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

  // ---- фикс маленьких сегментов ----

  chartInstance = new Chart(ctx, {
    type: "doughnut",

    data: {
      labels,

      datasets: [
        {
          data: data,
          backgroundColor: colors,

          borderColor: "#021c17",
          borderWidth: 6,
          spacing: 0,
          borderRadius: 0,

          hoverOffset: 6,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: true,

      cutout: "74%",

      layout: {
        padding: 20,
      },

      animation: {
        duration: 1500,
        easing: "easeOutQuart",
      },

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          backgroundColor: "rgba(10,10,10,0.95)",
          padding: 16,
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          displayColors: true,
          boxPadding: 6,

          titleFont: {
            family: "Inter",
            size: 14,
            weight: "bold",
          },

          bodyFont: {
            family: "Inter",
            size: 13,
          },

          callbacks: {
            label: (context) => {
              const item = list[context.dataIndex];
              return ` ${formatAmount(item.amount)}`;
            },
          },
        },
      },
    },
  });
}

// ----------------------------------------------------------------------------
// Отрисовка состояния "нет данных"
// ----------------------------------------------------------------------------
function drawEmptyState(g, canvas) {
  const dpr = window.devicePixelRatio || 1;

  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  g.scale(dpr, dpr);

  g.strokeStyle = "rgba(255,255,255,0.05)";

  g.lineWidth = 15;

  g.beginPath();

  g.arc(rect.width / 2, rect.height / 2, 60, 0, Math.PI * 2);

  g.stroke();

  g.fillStyle = "rgba(255,255,255,0.3)";

  g.font = "500 14px Inter, sans-serif";

  g.textAlign = "center";

  g.fillText("Активных долгов нет", rect.width / 2, rect.height / 2 + 5);
}
