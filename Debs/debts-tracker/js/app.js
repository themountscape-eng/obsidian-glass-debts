// ==========================================================================
// APP LOGIC (app.js) - FIXED & CLEANED
// ==========================================================================

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  console.log("App initializing...");
  updateAllUI();

  const dateInput = document.getElementById("debtDateInput");

  if (dateInput && dateInput.showPicker) {
    dateInput.addEventListener("mousedown", (e) => {
      e.preventDefault();
      dateInput.showPicker();
    });
  }
}

function updateAllUI() {
  if (typeof renderLayout === "function") renderLayout();
  const stats = refreshAppState();
  if (typeof updateStatsUI === "function" && stats) updateStatsUI(stats);
  if (typeof renderFeed === "function") renderFeed();
  if (typeof initCharts === "function") requestAnimationFrame(initCharts);
}

function refreshAppState() {
  if (typeof DB === "undefined") return null;
  const allDebts = DB.getRaw() || [];
  const activeDebts = allDebts.filter((d) => !d.paid && Number(d.amount) > 0);

  return {
    total: activeDebts.reduce((s, d) => s + (Number(d.amount) || 0), 0),
    count: allDebts.length,
    active: activeDebts.length,
    transfer: activeDebts
      .filter((d) => d.category === "transfer")
      .reduce((s, d) => s + (Number(d.amount) || 0), 0),
    cash: activeDebts
      .filter((d) => d.category === "cash")
      .reduce((s, d) => s + (Number(d.amount) || 0), 0),
  };
}

window.handleAddDebtClick = function () {
  const btn = document.getElementById("saveDebtBtn");

  const nameInput = document.getElementById("debtorNameInput");
  const amountInput = document.getElementById("amountInput");
  const phoneInput = document.getElementById("debtorPhoneInput");
  const commentInput = document.getElementById("debtCommentInput");
  const dateInput = document.getElementById("debtDateInput");
  const categoryBtn = document.querySelector(".category-btn.active");

  if (!nameInput?.value.trim() || !amountInput?.value) {
    alert("Заполните имя и сумму!");
    return;
  }

  const amount = parseFloat(
    amountInput.value.replace(/\s/g, "").replace(",", "."),
  );

  if (isNaN(amount)) {
    alert("Некорректная сумма!");
    return;
  }

  const name = nameInput.value.trim();
  const category = categoryBtn?.dataset?.type || "transfer";
  const dateValue = dateInput?.value || new Date().toISOString().slice(0, 10);

  /* ===== состояние загрузки ===== */

  if (btn) {
    btn.disabled = true;
    btn.innerText = "Добавляем долг...";
  }

  setTimeout(() => {
    if (window.DB && typeof window.DB.add === "function") {
      window.DB.add(
        name,
        amount,
        category,
        phoneInput?.value || "",
        commentInput?.value || "",
        dateValue,
      );
    }

    /* ===== состояние успеха ===== */

    if (btn) btn.innerText = "✓ Долг добавлен";

    setTimeout(() => {
      closeAllModals();
      updateAllUI();

      if (btn) {
        btn.innerText = "Сохранить долг";
        btn.disabled = false;
      }
    }, 800);
  }, 500);
};

let selectedDebtId = null;

window.selectFullDebtor = function (name, el) {
  const nameInput = document.getElementById("writeOffNameInput");
  const amountInput = document.getElementById("writeOffAmountInput");
  const confirmBtn = document.getElementById("confirmWriteOffBtn");

  if (window.selectedDebtor === name) {
    window.selectedDebtor = null;

    el.classList.remove("selected");

    if (nameInput) nameInput.value = "";
    if (amountInput) amountInput.value = "";
    if (confirmBtn) confirmBtn.disabled = true;

    return;
  }

  document
    .querySelectorAll(".debt-card")
    .forEach((card) => card.classList.remove("selected"));

  el.classList.add("selected");

  const debts = DB.getActive().filter((d) => d.name === name);

  const total = debts.reduce((s, d) => s + Number(d.amount || 0), 0);

  if (nameInput) nameInput.value = name;
  if (amountInput) amountInput.value = total.toLocaleString("ru-RU");

  window.selectedDebtor = name;

  if (confirmBtn) confirmBtn.disabled = false;
};

window.handleSelectDebtor = function (name, el) {
  document
    .querySelectorAll(".debtor-tag")
    .forEach((t) => t.classList.remove("active"));
  el.classList.add("active");
  selectedDebtId = null;

  const confirmBtn = document.getElementById("confirmWriteOffBtn");
  if (confirmBtn) confirmBtn.disabled = true;

  const area = document.getElementById("debtSelectionArea");
  if (area) area.style.display = "block";

  if (typeof renderSpecificDebtsList === "function")
    renderSpecificDebtsList(name);
};

window.handleSelectSpecificDebt = function (id, amount, el) {
  const amountInput = document.getElementById("writeOffAmountInput");
  const nameInput = document.getElementById("writeOffNameInput");
  const confirmBtn = document.getElementById("confirmWriteOffBtn");

  const debt = DB.getRaw().find((d) => d.id === id);
  if (!debt) return;

  /* если нажали повторно — снять выбор */

  if (selectedDebtId === id) {
    selectedDebtId = null;

    el.classList.remove("selected");

    if (amountInput) amountInput.value = "";
    if (nameInput) nameInput.value = "";

    if (confirmBtn) confirmBtn.disabled = true;

    return;
  }

  /* снять выделение */

  document
    .querySelectorAll(".debt-card")
    .forEach((r) => r.classList.remove("selected"));

  selectedDebtId = id;

  el.classList.add("selected");

  if (amountInput) {
    amountInput.value = Number(amount).toLocaleString("ru-RU");
  }

  if (nameInput) {
    nameInput.value = debt.name;
  }

  if (confirmBtn) confirmBtn.disabled = false;
};

window.switchToDemoUser = function () {
  if (typeof DB === "undefined") return;
  const newUser = prompt("Введите имя кабинета:", DB.currentUser);
  if (newUser?.trim()) DB.login(newUser.trim());
};

function initCharts() {
  const canvas = document.getElementById("debtorsChart");
  if (!canvas || typeof DB === "undefined" || typeof Chart === "undefined")
    return;

  const activeDebts = DB.getActive();
  if (!activeDebts.length) {
    if (
      window.myDebtorsChart &&
      typeof window.myDebtorsChart.destroy === "function"
    ) {
      window.myDebtorsChart.destroy();
    }
    // можно добавить текст "нет долгов" прямо в canvas, если хочешь
    return;
  }

  // Группируем и берём топ-3 (или меньше, если долгов мало)
  const grouped = activeDebts.reduce((acc, d) => {
    const amount = Number(d.amount) || 0;
    acc[d.name] = (acc[d.name] || 0) + amount;
    return acc;
  }, {});

  const topItems = Object.entries(grouped)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3); // можно .slice(0, 4) или вообще убрать slice, если хочешь всех

  if (topItems.length === 0) return;

  const css = getComputedStyle(document.documentElement);
  const colors = [
    css.getPropertyValue("--chart-1")?.trim() || "#34d399",
    css.getPropertyValue("--chart-2")?.trim() || "#60a5fa",
    css.getPropertyValue("--chart-3")?.trim() || "#a78bfa",
  ];

  // Легенда
  const legendEl = document.getElementById("debtorsLegend");
  if (legendEl) {
    const total = topItems.reduce((s, d) => s + d.amount, 0);
    legendEl.innerHTML = topItems
      .map((d, i) => {
        return `
      <div class="legend-item" style="--legend-color: ${colors[i]}">
        <div class="legend-dot"></div>
        <div class="legend-name">${escapeHtml(d.name)}</div>
        <div class="legend-percent">
          ${d.amount.toLocaleString("ru-RU")} ₽
        </div>
      </div>`;
      })
      .join("");
  }

  // Уничтожаем старый график, если был
  if (
    window.myDebtorsChart &&
    typeof window.myDebtorsChart.destroy === "function"
  ) {
    window.myDebtorsChart.destroy();
  }

  window.myDebtorsChart = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: topItems.map((d) => d.name),
      datasets: [
        {
          data: topItems.map((d) => d.amount),
          backgroundColor: colors.slice(0, topItems.length),

          borderColor: "transparent",
          borderWidth: 0,

          spacing: 0,
          borderRadius: 6,

          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // важно для полукруга в контейнере
      rotation: -90, // начинаем сверху
      circumference: 180, // ровно полукруг
      cutout: "78%", // толщина кольца (72–82% — хороший диапазон)
      layout: {
        padding: { top: 10, bottom: 20, left: 10, right: 10 },
      },
      animation: {
        animateRotate: true,
        duration: 1000,
        easing: "easeOutCubic",
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: "rgba(20,20,30,0.92)",
          titleFont: { size: 14, weight: "600" },
          bodyFont: { size: 13 },
          padding: 12,
          callbacks: {
            label: (ctx) => {
              const val = ctx.raw;
              const total = topItems.reduce((s, d) => s + d.amount, 0);
              return ` ${val.toLocaleString("ru-RU")} ₽`;
            },
          },
        },
      },
    },
  });
}

// Маленькая вспомогательная функция (если нет в проекте)
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// ==========================================================================
// WRITE OFF PROCESS
// ==========================================================================

window.processWriteOff = function () {
  // если выбран конкретный долг
  if (selectedDebtId) {
    const debt = DB.getRaw().find((d) => d.id === selectedDebtId);

    if (!debt) return;

    const confirmWrite = confirm(
      `Списать долг ${debt.name} на сумму ${Number(debt.amount).toLocaleString("ru-RU")} ₽ ?`,
    );

    if (!confirmWrite) return;

    DB.writeOffById(debt.id, debt.amount, true);

    closeAllModals();
    updateAllUI();
    return;
  }

  // если выбран должник (режим списать все)
  const name = window.selectedDebtor;

  if (!name) {
    alert("Выберите долг или должника");
    return;
  }

  const debts = DB.getActive().filter((d) => d.name === name);

  if (!debts.length) return;

  const total = debts.reduce((s, d) => s + Number(d.amount || 0), 0);

  const confirmWrite = confirm(
    `Вы точно хотите списать все долги должника ${name} на сумму ${total.toLocaleString("ru-RU")} ₽ ?`,
  );

  if (!confirmWrite) return;

  debts.forEach((d) => {
    DB.writeOffById(d.id, d.amount, true);
  });

  closeAllModals();
  updateAllUI();
};
