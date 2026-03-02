let chartInstance = null;

// Палитра современных цветов
const CHART_COLORS = [
  "rgba(16, 185, 129, 0.85)",
  "rgba(6, 182, 212, 0.85)",
  "rgba(99, 102, 241, 0.85)",
  "rgba(244, 63, 94, 0.85)",
  "rgba(251, 191, 36, 0.85)",
  "rgba(168, 85, 247, 0.85)",
  "rgba(34, 211, 238, 0.85)",
  "rgba(74, 222, 128, 0.85)",
];

function formatAmount(value) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
}

function formatDebtorName(name) {
  if (!name || !name.trim()) return "Без имени";
  const s = name.trim();
  const formatted = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return formatted.length > 15 ? formatted.slice(0, 13) + "…" : formatted;
}

function getDebtsByDebtor() {
  const debts = typeof getDebts === "function" ? getDebts() : [];
  const byName = {};

  debts.forEach((d) => {
    if (!d.paid && d.amount > 0) {
      const name = (d.debtorName || "Без имени").trim();
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

/**
 * АНИМАЦИЯ ЧИСЕЛ С ЗАМЕДЛЕНИЕМ (Ease Out)
 */
function animateValue(obj, start, end, duration) {
  if (!obj) return;
  let startTimestamp = null;

  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);

    // Кубическое замедление для "дорогого" эффекта
    const easeOutProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.floor(easeOutProgress * (end - start) + start);

    obj.innerHTML = currentValue.toLocaleString("ru-RU") + " ₽";

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

/**
 * ОБРАБОТКА И ВЫВОД ТРЕНДА (%)
 */
function updateTrend(currentTotal) {
  const trendContainer = document.getElementById("trend-container");
  if (!trendContainer) return;

  // 1. Получаем прошлое значение
  let lastTotal = localStorage.getItem("dashboard_last_total");

  // Если это самый первый запуск в истории
  if (lastTotal === null) {
    localStorage.setItem("dashboard_last_total", currentTotal);
    trendContainer.innerHTML = `<div class="debt-trend trend-neutral">0% <small>старт</small></div>`;
    return;
  }

  lastTotal = parseFloat(lastTotal);
  const diff = currentTotal - lastTotal;

  // 2. Если сумма изменилась (добавили или списали долг)
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

    // Сохраняем не только сумму, но и сам HTML плашки, чтобы он не исчезал при перезагрузке
    trendContainer.innerHTML = trendHTML;
    localStorage.setItem("dashboard_trend_html", trendHTML);

    // Обновляем базу только ПРИ ИЗМЕНЕНИИ, чтобы в следующий раз считать от этой цифры
    localStorage.setItem("dashboard_last_total", currentTotal);
  } else {
    // 3. Если сумма НЕ изменилась (просто обновили страницу)
    // Достаем сохраненный ранее HTML плашки
    const savedTrend = localStorage.getItem("dashboard_trend_html");
    if (savedTrend) {
      trendContainer.innerHTML = savedTrend;
    } else {
      trendContainer.innerHTML = `<div class="debt-trend trend-neutral">0% <small>стабильно</small></div>`;
    }
  }
}

/**
 * ГЛАВНАЯ ФУНКЦИЯ ОТРИСОВКИ
 */
function renderChart() {
  const { list, total } = getDebtsByDebtor();

  // 1. Обновляем метку тренда
  updateTrend(total);

  // 2. Анимируем главную сумму (ищем строго по ID)
  const totalDisplay = document.getElementById("totalAmount");

  if (totalDisplay) {
    // Проверяем, не пустой ли total
    if (total > 0) {
      animateValue(totalDisplay, 0, total, 2000);
    } else {
      totalDisplay.innerHTML = "0 ₽";
    }
  }

  const canvas = document.getElementById("pieChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (chartInstance) chartInstance.destroy();

  if (list.length === 0) {
    drawEmptyState(ctx, canvas);
    return;
  }

  const labels = list.map((d) => d.name);
  const data = list.map((d) => d.amount);
  const colors = list.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: "rgba(255, 255, 255, 0.05)",
          borderWidth: 0,
          borderRadius: 8,
          spacing: 8,
          cutout: "78%",
          hoverOffset: 15,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      layout: { padding: 15 },
      animation: {
        duration: 1500,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: "rgba(255, 255, 255, 0.7)",
            padding: 20,
            usePointStyle: true,
            pointStyle: "circle",
            font: { family: "Inter", size: 12, weight: "500" },
            generateLabels: (chart) => {
              return chart.data.labels.map((label, i) => ({
                text: label.toUpperCase(),
                fillStyle: chart.data.datasets[0].backgroundColor[i],
                index: i,
              }));
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(10, 10, 10, 0.95)",
          titleFont: { family: "Inter", size: 14, weight: "bold" },
          bodyFont: { family: "Inter", size: 13 },
          padding: 16,
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 1,
          displayColors: true,
          boxPadding: 6,
          callbacks: {
            label: (context) => {
              const item = list[context.dataIndex];
              return ` ${formatAmount(item.amount)} (${item.percent.toFixed(1)}%)`;
            },
          },
        },
      },
    },
  });
}

function drawEmptyState(g, canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  g.scale(dpr, dpr);

  g.strokeStyle = "rgba(255, 255, 255, 0.05)";
  g.lineWidth = 15;
  g.beginPath();
  g.arc(rect.width / 2, rect.height / 2, 60, 0, Math.PI * 2);
  g.stroke();

  g.fillStyle = "rgba(255, 255, 255, 0.3)";
  g.font = "500 14px Inter, sans-serif";
  g.textAlign = "center";
  g.fillText("Активных долгов нет", rect.width / 2, rect.height / 2 + 5);
}
