// ==========================================================================
// UI RENDERER (ui.js) — OPTIMIZED & CLEAN VERSION
// ==========================================================================

// защита от XSS
function esc(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ==========================================================================
// SIZE HELPERS
// ==========================================================================

function getAmountFontSize(text, type = "main") {
  const len = text.toString().length;

  if (type === "main") {
    if (len > 12) return "72px";
    if (len > 10) return "84px";
    if (len > 8) return "92px";
    return "104px";
  }

  return len > 10 ? "16px" : len > 7 ? "20px" : "24px";
}

// ==========================================================================
// ACTIVITY FEED
// ==========================================================================

function renderFeed() {
  const container = document.getElementById("feedList");
  if (!container) return;

  const historyKey = window.DB ? window.DB.HISTORY_KEY : "debt_history_v1";

  let history = [];

  try {
    history = JSON.parse(localStorage.getItem(historyKey)) || [];
  } catch {
    history = [];
  }

  if (!history.length) {
    container.innerHTML = '<div class="empty-tip">Активности пока нет</div>';
    return;
  }

  container.innerHTML = history
    .slice(0, 30)
    .map((item) => {
      const isAdd = item.type === "add";

      const icon = isAdd ? iconPlus(14) : iconCheck(14);

      const typeClass = isAdd ? "feed-icon-add" : "feed-icon-pay";

      const accent = isAdd ? "var(--accent-success)" : "var(--accent-info)";

      const category = item.category || "transfer";

      const payIcon = category === "cash" ? iconCash(14) : iconCreditCard(14);

      const payLabel = category === "cash" ? "Наличные" : "Перевод";

      const d = new Date(item.date);
      const dateStr = isNaN(d) ? item.date : d.toLocaleDateString("ru-RU");

      return `
      <div class="feed-item-card" style="border-left:4px solid ${accent}">

        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">

          <div class="feed-icon ${typeClass}">
            ${icon}
          </div>

          <div class="feed-action-type" style="color:${accent}">
            ${isAdd ? "Добавление" : "Погашение"}
          </div>

        </div>

        <div class="feed-description">
          ${esc(item.text)}
        </div>

        <div style="
          display:flex;
          align-items:center;
          gap:6px;
          margin-top:6px;
          opacity:.65;
          font-size:12px;
        ">
          ${payIcon}
          <span>${payLabel}</span>
        </div>

        <div class="feed-timestamp">
          ${dateStr}
        </div>

      </div>
    `;
    })
    .join("");
}

function openDebtCard(debt) {
  const modal = document.getElementById("debtCardModal");
  const content = document.getElementById("debtCardContent");

  /* закрываем список */
  closeStatsModal();

  const date = new Date(debt.date).toLocaleDateString("ru-RU");

  content.innerHTML = `
    <div class="debt-card-name">${debt.name}</div>

    <div class="debt-card-amount">
      ${Number(debt.amount).toLocaleString("ru-RU")} ₽
    </div>

    <div class="debt-card-meta">
      Тип: ${debt.category === "transfer" ? "Перевод" : "Наличные"}<br>
      Дата: ${date}
    </div>

    <div class="debt-card-actions">

      <button class="btn-pay" onclick="payDebt('${debt.id}')">
        Погасить
      </button>

      <button class="btn-writeoff" onclick="writeOffDebt('${debt.id}')">
        Списать
      </button>

    </div>
  `;

  modal.classList.add("active");
}

function closeDebtCard() {
  document.getElementById("debtCardModal").classList.remove("active");
}

// ==========================================================================
// Новый блок расчёта статистики
// ==========================================================================

function calculateStats(debts) {
  const getAmount = (d) => Number(String(d.amount).replace(/\s/g, "")) || 0;

  const activeDebts = debts
    .map((d) => ({ ...d, _amount: getAmount(d) }))
    .filter((d) => d._amount > 0);

  const total = activeDebts.reduce((s, d) => s + getAmount(d), 0);

  const transfer = activeDebts
    .filter((d) => d.category === "transfer")
    .reduce((s, d) => s + getAmount(d), 0);

  const cash = activeDebts
    .filter((d) => d.category === "cash")
    .reduce((s, d) => s + getAmount(d), 0);

  return {
    activeDebts,
    total,
    transfer,
    cash,
  };
}

// ==========================================================================
// Блок расчёта тренда
// ==========================================================================

function calculateTrend() {
  let diff = 0;
  let label = "";

  try {
    const history =
      JSON.parse(
        localStorage.getItem(window.DB?.HISTORY_KEY || "debt_history_v1"),
      ) || [];

    const today = new Date().toISOString().slice(0, 10);

    history.forEach((item) => {
      const date = (item.date || "").slice(0, 10);
      const amount = Number(item.amount) || 0;

      if (date === today) {
        if (item.type === "add") diff += amount;
        if (item.type === "pay") diff -= amount;
      }
    });

    if (diff !== 0) {
      label = "Сегодня";
    } else if (history.length) {
      const last = history[0];
      label = new Date(last.date).toLocaleDateString("ru-RU");
    }
  } catch (e) {
    console.warn("Trend error:", e);
  }

  return { diff, label };
}

// ==========================================================================
// MAIN LAYOUT
// ==========================================================================

function renderLayout() {
  let userName = "Гость";
  let debts = [];

  try {
    if (window.DB?.getRaw) {
      debts = DB.getRaw();
      userName = DB.currentUser || "Демо-пользователь";
    }
  } catch (e) {
    console.error("UI load error:", e);
  }

  const stats = calculateStats(debts);
  const trend = calculateTrend();

  const format = (n) => n.toLocaleString("ru-RU") + " ₽";

  renderHeader(userName);

  renderLeftBlock(userName, format(stats.total), trend.diff, trend.label);

  renderStats(
    debts,
    stats.activeDebts,
    format(stats.transfer),
    format(stats.cash),
  );

  renderChartSection();

  renderRightSection(debts);

  renderFeed();

  const tipsContainer = document.getElementById("tipsContainer");

  if (tipsContainer && typeof generateSmartTips === "function") {
    tipsContainer.innerHTML = generateSmartTips(debts);
  }

  setTimeout(() => {
    if (typeof initCharts === "function") initCharts();
  }, 50);
}

// ==========================================================================
// HEADER
// ==========================================================================

function renderHeader(userName) {
  const header = document.getElementById("app-header");
  if (!header) return;

  header.className = "app-header glass";

  header.innerHTML = `
    <div class="header-content">

      <div class="logo">
        ${iconWallet(24)}
        <span>Учёт Долгов</span>
      </div>

      <div class="user-profile" onclick="switchToDemoUser()">
        <div class="user-info">
          <span class="user-role">Кабинет</span>
          <span id="headerUserName">${esc(userName)}</span>
        </div>

        <div class="user-avatar">
          ${iconUser(20)}
        </div>
      </div>

    </div>`;
}

// ==========================================================================
// LEFT BLOCK
// ==========================================================================

function renderLeftBlock(userName, totalStr, diff, label) {
  const left = document.getElementById("left-section");
  if (!left) return;

  let trendHTML = '<div class="debt-trend trend-neutral">Без изменений</div>';

  if (diff > 0) {
    trendHTML = `
      <div class="debt-trend trend-up">
        ▲ ${label} +${diff.toLocaleString("ru-RU")} ₽
      </div>
    `;
  }

  if (diff < 0) {
    trendHTML = `
      <div class="debt-trend trend-down">
        ▼ ${label} ${diff.toLocaleString("ru-RU")} ₽
      </div>
    `;
  }

  left.innerHTML = `
  <div class="main-block glass">

    <div class="welcome-section">
      <div class="welcome-text">С возвращением,</div>
      <div class="user-name">${esc(userName)}</div>
    </div>

    <div class="debt-section">

      <div class="welcome-text">Вам должны</div>

      <div class="total-amount"
        style="font-size:${getAmountFontSize(totalStr, "main")}">
        0 ₽
      </div>

      ${trendHTML}

    </div>

  </div>`;
  const totalEl = left.querySelector(".total-amount");

  const numericValue = parseInt(totalStr.replace(/[^\d]/g, ""));

  if (totalEl) {
    animateNumber(totalEl, numericValue);
  }
}

// ==========================================================================
// STATS
// ==========================================================================

function renderStats(debts, activeDebts, transferStr, cashStr) {
  const row = document.getElementById("stats-row");
  if (!row) return;

  row.innerHTML = `
    <div class="stat-card glass" data-type="all">
      ${iconList(26)}
      <div class="value">${debts.length}</div>
      <div class="stat-card-label">Всего</div>
    </div>

    <div class="stat-card glass" data-type="active">
      ${iconClock(26)}
      <div class="value">${activeDebts.length}</div>
      <div class="stat-card-label">Активных</div>
    </div>

    <div class="stat-card glass" data-type="transfer">
      ${iconCreditCard(26)}
      <div class="value">${transferStr}</div>
      <div class="stat-card-label">Переводы</div>
    </div>

    <div class="stat-card glass" data-type="cash">
      ${iconCash(26)}
      <div class="value">${cashStr}</div>
      <div class="stat-card-label">Наличные</div>
    </div>

    <div class="action-card glass action-add">
      <div class="btn-tile btn-success-tile">
        ${iconPlus(28)}
        <span class="action-title">Добавить долг</span>
      </div>
    </div>

    <div class="action-card glass action-writeoff">
      <div class="btn-tile btn-outline-tile">
        ${iconMinus(28)}
        <span class="action-title">Списать долг</span>
      </div>
    </div>
  `;

  enableStatsClicks();
}

function enableStatsClicks() {
  const statsRow = document.getElementById("stats-row");

  if (!statsRow) return;

  statsRow.onclick = (e) => {
    const card = e.target.closest(".stat-card");

    if (!card) return;

    const type = card.dataset.type;

    if (!type) return;

    openStatsList(type);
  };
}

function openStatsList(type) {
  const debts = DB.getRaw();

  let filtered = [];

  if (type === "all") {
    filtered = debts;
  }

  if (type === "active") {
    filtered = debts.filter((d) => Number(d.amount) > 0);
  }

  if (type === "transfer") {
    filtered = debts.filter(
      (d) => d.category === "transfer" && Number(d.amount) > 0,
    );
  }

  if (type === "cash") {
    filtered = debts.filter(
      (d) => d.category === "cash" && Number(d.amount) > 0,
    );
  }

  renderStatsModal(filtered, type);
}

function renderStatsModal(list, type) {
  list = list.filter((d) => Number(d.amount) > 0);
  const modal = document.getElementById("statsModal");
  const container = document.getElementById("statsModalList");
  const title = document.getElementById("statsModalTitle");

  const titles = {
    all: "Все долги",
    active: "Активные долги",
    transfer: "Переводы",
    cash: "Наличные",
  };

  title.textContent = titles[type] || "Долги";

  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML = `
      <div class="stats-empty">
        Нет данных
      </div>
    `;

    modal.classList.add("active");
    return;
  }

  list.forEach((debt) => {
    const amount = Number(debt.amount) || 0;
    if (amount <= 0) return;

    const row = document.createElement("div");
    row.className = "stats-item";

    const date = new Date(debt.date).toLocaleDateString("ru-RU");

    row.innerHTML = `
      <div class="stats-left">
        <div class="stats-name">${esc(debt.name)}</div>
        <div class="stats-meta">
          ${debt.category === "transfer" ? "Перевод" : "Наличные"} • ${date}
        </div>
      </div>

      <div class="stats-amount">
        ${amount.toLocaleString("ru-RU")} ₽
      </div>
    `;

    row.addEventListener("click", () => {
      openDebtCard(debt);
    });

    container.appendChild(row);
  });

  modal.classList.add("active");
}

function closeStatsModal() {
  document.getElementById("statsModal")?.classList.remove("active");
}

// ==========================================================================
// CHART BLOCK
// ==========================================================================

function renderChartSection() {
  const mid = document.getElementById("middle-section");
  if (!mid) return;

  mid.innerHTML = `
  <div class="chart-section glass">

    <div class="chart-header">
      ${iconChart(20)}
      <h3>
        Топ должников
      </h3>
    </div>

    <div class="chart-wrapper">

      <canvas id="debtorsChart"></canvas>

      <div id="chartCenterInfo">
        <div class="welcome-text" style="font-size:10px;opacity:.5;">
          рейтинг
        </div>

        <div style="
          font-size:24px;
          font-weight:900;
          color:#fff;
        ">
          ТОП 3
        </div>
      </div>

    </div>

    <div id="debtorsLegend" class="legend-row"></div>

  </div>`;
}

// ==========================================================================
// RIGHT BLOCK
// ==========================================================================

function renderRightSection(debts) {
  const right = document.getElementById("right-section");
  if (!right) return;

  right.innerHTML = `
  <div class="feed-section glass" style="flex:1;display:flex;flex-direction:column;min-height:0;">

    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-shrink:0;">
      <span style="display:flex;align-items:center;">
        ${iconActivity(20)}
      </span>
      <h3 style="margin:0;font-size:18px;font-weight:700;">
        Активность
      </h3>
    </div>

    <div id="feedList" class="feed-scroll"></div>

  </div>

  <div class="tips-section glass" style="flex:1;display:flex;flex-direction:column;min-height:0;">

    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-shrink:0;">
      <span style="display:flex;align-items:center;">
        ${iconLightbulb(20)}
      </span>
      <h3 style="margin:0;font-size:18px;font-weight:700;">
        Умные советы
      </h3>
    </div>

    <div id="tipsContainer" class="tips-scroll"></div>

  </div>`;
}

// ==========================================================================
// UPDATE STATS
// ==========================================================================

function updateStatsUI(data) {
  const map = {
    totalDebts: data.count,
    activeDebts: data.active,
    transferTotal: (data.transfer || 0).toLocaleString("ru-RU") + " ₽",
    cashTotal: (data.cash || 0).toLocaleString("ru-RU") + " ₽",
  };

  Object.keys(map).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerText = map[id];
  });
}

// ==========================================================================
// MODALS
// ==========================================================================

function renderModal() {
  // Модалки теперь находятся в index.html
  // Эта функция оставлена как заглушка,
  // чтобы не ломать вызовы в renderLayout().
}

// ==========================================================================
// JS генерация списка
// ==========================================================================

function updateDebtorSuggestions() {
  const debts = window.DB?.getActive?.() || [];
  const names = [...new Set(debts.map((d) => d.name))];

  const list = document.getElementById("debtorSuggestions");

  if (!list) return;

  list.innerHTML = names.map((n) => `<option value="${esc(n)}">`).join("");
}

// ==========================================================================
// Автоформат суммы
// ==========================================================================

document.addEventListener("input", (e) => {
  if (e.target.id === "amountInput") {
    let value = e.target.value.replace(/\D/g, "");

    if (!value) {
      e.target.value = "";
      return;
    }

    e.target.value = Number(value).toLocaleString("ru-RU");
  }
});

// ==========================================================================
// Форматирование телефона
// ==========================================================================

document.addEventListener("input", (e) => {
  if (e.target.id === "debtorPhoneInput") {
    let digits = e.target.value.replace(/\D/g, "");

    if (digits.startsWith("8")) digits = "7" + digits.slice(1);
    if (!digits.startsWith("7")) digits = "7" + digits;

    digits = digits.substring(0, 11);

    let formatted = "+7";

    if (digits.length > 1) formatted += " " + digits.substring(1, 4);
    if (digits.length >= 4) formatted += " " + digits.substring(4, 7);
    if (digits.length >= 7) formatted += " " + digits.substring(7, 9);
    if (digits.length >= 9) formatted += " " + digits.substring(9, 11);

    e.target.value = formatted;
  }
});

// ==========================================================================
// Подсказки для комментария (динамические)
// ==========================================================================

const commentTips = [
  "Взял в долг на продукты",
  "Вернет через неделю",
  "Не хватило на кассе",
  "Одолжил на бензин",
  "Временные трудности",
  "Займ до зарплаты",
  "Вернет после аванса",
];

function randomCommentPlaceholder() {
  const commentInput = document.getElementById("debtCommentInput");
  if (!commentInput) return;

  const tip = commentTips[Math.floor(Math.random() * commentTips.length)];

  commentInput.placeholder = "Комментарий: " + tip + "...";
}

// ==========================================================================
// переключение цвета
// ==========================================================================

document.addEventListener("change", (e) => {
  if (e.target.id !== "writeOffModeAll") return;

  const box = document.getElementById("writeOffBox");
  const confirmBtn = document.getElementById("confirmWriteOffBtn");
  const nameInput = document.getElementById("writeOffNameInput");
  const amountInput = document.getElementById("writeOffAmountInput");

  if (!box) return;

  const isAllMode = e.target.checked;

  // сброс выбранных значений
  selectedDebtId = null;
  window.selectedDebtor = null;

  // очистка полей
  if (nameInput) nameInput.value = "";
  if (amountInput) amountInput.value = "";

  // отключаем кнопку списания
  if (confirmBtn) confirmBtn.disabled = true;

  // визуальное состояние блока
  box.classList.toggle("active", isAllMode);

  // рендер нужного списка
  if (isAllMode) {
    renderDebtorTotals(); // список должников
  } else {
    renderDebtorTags(); // список отдельных долгов
  }
});

// ==========================================================================
// RENDER DEBTS LIST (WRITE OFF MODAL)
// ==========================================================================

function renderDebtorTags(filter = "") {
  const debts = window.DB?.getActive?.() || [];
  const container = document.getElementById("debtsList");

  if (!container) return;

  const filtered = debts
    .filter(
      (d) => d.name && d.name.toLowerCase().includes(filter.toLowerCase()),
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-tip">
        Долги не найдены
      </div>`;

    return;
  }

  container.innerHTML = filtered
    .map((d) => {
      const date = new Date(d.date).toLocaleDateString("ru-RU");

      return `
      <div class="debt-card"
        onclick="handleSelectSpecificDebt(${d.id}, ${d.amount}, this)">

        <div class="debt-row-top">

          <div class="debt-name">
            ${esc(d.name)}
          </div>

          <div class="debt-amount">
            ${Number(d.amount).toLocaleString("ru-RU")} ₽
          </div>

        </div>

        <div class="debt-row-bottom">

          <div class="debt-date">
            ${date}
          </div>

          <div class="debt-label">
            Сумма долга
          </div>

        </div>

      </div>
      `;
    })
    .join("");
}

document.addEventListener("input", (e) => {
  if (e.target.id === "writeOffNameInput") {
    renderDebtorTags(e.target.value);
  }
});

// ==========================================================================
// MODAL HELPERS
// ==========================================================================

window.closeAllModals = () => {
  selectedDebtId = null;
  window.selectedDebtor = null;

  document.querySelectorAll(".modal").forEach((m) => {
    m.classList.remove("active");
  });

  const checkbox = document.getElementById("writeOffModeAll");
  const box = document.getElementById("writeOffBox");

  if (checkbox) checkbox.checked = false;
  if (box) box.classList.remove("active");

  const amount = document.getElementById("writeOffAmountInput");
  if (amount) amount.value = "";

  window.selectedDebtor = null;
  selectedDebtId = null;
};

window.openAddModal = () => {
  const m = document.getElementById("addModal");
  if (!m) return;

  m.classList.add("active");

  document.getElementById("amountInput").value = "";
  document.getElementById("debtorPhoneInput").value = "";

  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("debtDateInput");
  if (dateInput) dateInput.value = today;

  randomCommentPlaceholder();
  updateDebtorSuggestions();

  setTimeout(() => {
    const nameInput = document.getElementById("debtorNameInput");
    if (nameInput) nameInput.focus();
  }, 100);
};

window.openWriteOffModal = () => {
  const modal = document.getElementById("writeOffModal");
  if (!modal) return;

  modal.classList.add("active");

  window.selectedDebtor = null;
  selectedDebtId = null;

  const btn = document.getElementById("confirmWriteOffBtn");
  if (btn) btn.disabled = true;

  const name = document.getElementById("writeOffNameInput");
  const amount = document.getElementById("writeOffAmountInput");

  if (name) name.value = "";
  if (amount) amount.value = "";

  renderDebtorTags();
};

// ==========================================================================
// SVG ICONS
// ==========================================================================

function svg(s, c) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round">${c}</svg>`;
}

function iconWallet(s) {
  return svg(
    s,
    `<path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/><path d="M16 12h5"/>`,
  );
}
function iconUser(s) {
  return svg(
    s,
    `<circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/>`,
  );
}
function iconPlus(s) {
  return svg(
    s,
    `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
  );
}
function iconMinus(s) {
  return svg(s, `<line x1="5" y1="12" x2="19" y2="12"/>`);
}
function iconList(s) {
  return svg(
    s,
    `<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>`,
  );
}
function iconClock(s) {
  return svg(
    s,
    `<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>`,
  );
}
function iconCreditCard(s) {
  return svg(
    s,
    `<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>`,
  );
}
function iconCash(s) {
  return svg(
    s,
    `<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>`,
  );
}
function iconChart(s) {
  return svg(
    s,
    `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
  );
}
function iconActivity(s) {
  return svg(s, `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`);
}
function iconCheck(s) {
  return svg(s, `<polyline points="20 6 9 17 4 12"/>`);
}
function iconLightbulb(s) {
  return svg(
    s,
    `<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 13c1 1 1 2 1 3h6c0-1 0-2 1-3a7 7 0 0 0-4-13z"/>`,
  );
}

// ==========================================================================
// SMART TIPS
// ==========================================================================

function generateSmartTips(debts) {
  const active = debts.filter((d) => !d.paid && Number(d.amount) > 0);

  if (!active.length) {
    return `<div class="empty-tip">Долгов нет. Отличная работа ☕</div>`;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tips = [];

  // -------- возраст долгов --------

  const withAge = active.map((d) => {
    const dDate = new Date(d.date);
    dDate.setHours(0, 0, 0, 0);

    const days = Math.floor((today - dDate) / (1000 * 60 * 60 * 24));

    return { ...d, days };
  });

  // -------- кому писать первым --------

  const oldest = [...withAge].sort((a, b) => b.days - a.days)[0];

  tips.push({
    priority: 10,
    html: `
      <div class="tip-item" style="border-left:4px solid var(--accent-warning)">
        <div class="tip-title">Кому написать первым</div>
        <div class="feed-description">
          <b>${esc(oldest.name)}</b> должен уже ${oldest.days} дней
        </div>
      </div>
    `,
  });

  // -------- самый большой долг --------

  const biggest = [...active].sort((a, b) => b.amount - a.amount)[0];

  tips.push({
    priority: 9,
    html: `
      <div class="tip-item" style="border-left:4px solid var(--accent-info)">
        <div class="tip-title">Самый крупный долг</div>
        <div class="feed-description">
          ${esc(biggest.name)} должен
          <b>${biggest.amount.toLocaleString("ru-RU")} ₽</b>
        </div>
      </div>
    `,
  });

  // -------- группировка должников --------

  const grouped = {};

  active.forEach((d) => {
    grouped[d.name] = (grouped[d.name] || 0) + Number(d.amount);
  });

  const topDebtor = Object.entries(grouped).sort((a, b) => b[1] - a[1])[0];

  tips.push({
    priority: 8,
    html: `
      <div class="tip-item" style="border-left:4px solid var(--accent-success)">
        <div class="tip-title">Главный должник</div>
        <div class="feed-description">
          <b>${esc(topDebtor[0])}</b> должен больше всех
        </div>
        <div class="tip-tactica">
          ${topDebtor[1].toLocaleString("ru-RU")} ₽ суммарно
        </div>
      </div>
    `,
  });

  // -------- риск должника --------

  const risk = Object.entries(grouped)
    .map(([name, sum]) => ({
      name,
      sum,
      count: active.filter((d) => d.name === name).length,
    }))
    .filter((d) => d.count >= 2)
    .sort((a, b) => b.count - a.count)[0];

  if (risk) {
    tips.push({
      priority: 7,
      html: `
        <div class="tip-item" style="border-left:4px solid var(--accent-error)">
          <div class="tip-title">Риск должника</div>
          <div class="feed-description">
            <b>${esc(risk.name)}</b> имеет ${risk.count} долгов
          </div>
        </div>
      `,
    });
  }

  // -------- средний возраст долгов --------

  const avgAge = Math.round(
    withAge.reduce((s, d) => s + d.days, 0) / withAge.length,
  );

  tips.push({
    priority: 6,
    html: `
      <div class="tip-item" style="border-left:4px solid var(--accent-info)">
        <div class="tip-title">Средний возраст долгов</div>
        <div class="feed-description">
          Сейчас примерно ${avgAge} дней
        </div>
      </div>
    `,
  });

  // -------- общая сумма долгов --------

  const total = active.reduce((s, d) => s + Number(d.amount), 0);

  tips.push({
    priority: 5,
    html: `
      <div class="tip-item" style="border-left:4px solid var(--accent-success)">
        <div class="tip-title">Общий долг</div>
        <div class="feed-description">
          Сейчас вам должны
          <b>${total.toLocaleString("ru-RU")} ₽</b>
        </div>
      </div>
    `,
  });

  // -------- новый долг --------

  const newest = [...withAge].sort((a, b) => a.days - b.days)[0];

  tips.push({
    priority: 4,
    html: `
      <div class="tip-item" style="border-left:4px solid var(--accent-info)">
        <div class="tip-title">Новый долг</div>
        <div class="feed-description">
          ${esc(newest.name)} занял недавно
        </div>
      </div>
    `,
  });

  // -------- сортировка по важности --------

  return tips
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4)
    .map((t) => t.html)
    .join("");
}

// ==========================================================================
// MODAL BACKDROP CLICK
// ==========================================================================

window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    closeAllModals();
  }
});

// закрытие по ESC
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAllModals();
  }
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".category-btn");
  if (!btn) return;

  document
    .querySelectorAll(".category-btn")
    .forEach((b) => b.classList.remove("active"));

  btn.classList.add("active");
});

// ==========================================================================
// Функция списка должников
// ==========================================================================

function renderDebtorTotals() {
  const debts = window.DB?.getActive?.() || [];
  const container = document.getElementById("debtsList");

  if (!container) return;

  const grouped = {};

  debts.forEach((d) => {
    if (!grouped[d.name]) {
      grouped[d.name] = {
        total: 0,
        firstDate: d.date,
      };
    }

    grouped[d.name].total += Number(d.amount);

    if (new Date(d.date) < new Date(grouped[d.name].firstDate)) {
      grouped[d.name].firstDate = d.date;
    }
  });

  const list = Object.entries(grouped).sort((a, b) => b[1].total - a[1].total);

  container.innerHTML = list
    .map(([name, data]) => {
      const date = new Date(data.firstDate).toLocaleDateString("ru-RU");

      return `

      <div class="debt-card"
        onclick="selectFullDebtor('${name}', this)">

        <div class="debt-row-top">

          <div class="debt-label">
            Должен с ${date}
          </div>

          <div class="debt-label">
            Общая сумма долга
          </div>

        </div>

        <div class="debt-row-bottom">

          <div class="debt-name">
            ${esc(name)}
          </div>

          <div class="debt-amount">
            ${data.total.toLocaleString("ru-RU")} ₽
          </div>

        </div>

      </div>

    `;
    })
    .join("");
}

// ==========================================================================
// ANIMATE NUMBER (DEBT COUNTER)
// ==========================================================================

function animateNumber(element, targetValue, duration = 2600) {
  const startTime = performance.now();
  const startValue = 0;

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    let progress = Math.min(elapsed / duration, 1);

    // растягиваем конец
    if (progress > 0.9) {
      const p = (progress - 0.9) / 0.1;
      progress = 0.9 + Math.pow(p, 3) * 0.1;
    }

    const eased = easeOutExpo(progress);

    const currentValue = Math.floor(
      startValue + (targetValue - startValue) * eased,
    );

    element.textContent = currentValue.toLocaleString("ru-RU") + " ₽";

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-close")) {
    closeAllModals();
  }
});

document.addEventListener("click", (e) => {
  const addBtn = e.target.closest(".action-add");
  if (addBtn) {
    openAddModal();
    return;
  }

  const writeBtn = e.target.closest(".action-writeoff");
  if (writeBtn) {
    openWriteOffModal();
    return;
  }
});
