// ==========================================================================
// UI RENDERER (ui.js) - FIXED VERSION
// ==========================================================================

function getAmountFontSize(text, type = "main") {
  const len = text.toString().length;
  if (type === "main") {
    if (len > 12) return "48px";
    if (len > 10) return "58px";
    if (len > 8) return "72px";
    return "84px";
  } else {
    return len > 10 ? "18px" : len > 7 ? "22px" : "28px";
  }
}

function renderFeed() {
  const container = document.getElementById("feedList");
  if (!container) return;
  const history = JSON.parse(localStorage.getItem("debts_history")) || [];
  if (history.length === 0) {
    container.innerHTML = `<div class="feed-empty"><p>История операций пуста</p></div>`;
    return;
  }
  container.innerHTML = history
    .reverse()
    .slice(0, 20)
    .map((item) => {
      let icon, typeClass;
      switch (item.type) {
        case "add":
          icon = iconPlus(18);
          typeClass = "type-plus";
          break;
        case "pay":
          icon = iconCheck(18);
          typeClass = "type-minus";
          break;
        default:
          icon = iconActivity(18);
          typeClass = "type-info";
      }
      return `
      <div class="feed-item">
        <div class="feed-icon ${typeClass}">${icon}</div>
        <div class="feed-info">
          <div class="feed-text">${item.text}</div>
          <div class="feed-date">${item.date || "Сегодня"}</div>
        </div>
      </div>`;
    })
    .join("");
}

function renderLayout() {
  let userName = "Гость";
  let debts = [];
  try {
    if (typeof getUserData === "function")
      userName = getUserData().name || "Гость";
    if (typeof getDebts === "function") debts = getDebts();
  } catch (e) {
    console.error("Ошибка данных:", e);
  }

  const activeDebts = debts.filter((d) => !d.paid);
  const totalSum = activeDebts.reduce((s, d) => s + Number(d.amount), 0);
  const transferSum = activeDebts
    .filter((d) => d.category === "transfer")
    .reduce((s, d) => s + Number(d.amount), 0);
  const cashSum = activeDebts
    .filter((d) => d.category === "cash")
    .reduce((s, d) => s + Number(d.amount), 0);

  const totalStr = totalSum.toLocaleString("ru-RU") + " ₽";
  const transferStr = transferSum.toLocaleString("ru-RU") + " ₽";
  const cashStr = cashSum.toLocaleString("ru-RU") + " ₽";

  // РЕНДЕР ХЕДЕРА (Убрана лишняя обертка, мешающая стилям)
  const headerEl = document.getElementById("app-header");
  if (headerEl) {
    headerEl.className = "app-header glass"; // Классы теперь прямо на контейнере
    headerEl.innerHTML = `
        <div class="header-content">
          <div class="logo">${iconWallet(24)} <span>Учет Долгов</span></div>
          <div class="user-profile">
            <span id="headerUserName">${userName}</span> ${iconUser(18)}
          </div>
        </div>`;
  }

  // РЕНДЕР ГЛАВНОГО БЛОКА
  const leftSec = document.getElementById("left-section");
  if (leftSec) {
    const fontSize = getAmountFontSize(totalStr, "main");
    leftSec.innerHTML = `
      <div class="main-block glass">
        <div>
          <div class="welcome-text">С возвращением,</div>
          <div class="user-name">${userName}</div> 
        </div>
        <div class="debt-section">
          <div class="debt-label">Вам должны</div>
          <div class="total-amount" id="totalAmount" style="font-size: ${fontSize}">${totalStr}</div>
        </div>
      </div>`;
  }

  // РЕНДЕР СТАТИСТИКИ И КНОПОК (Очистка + 6 колонок)
  const statsRow = document.getElementById("stats-row");
  if (statsRow) {
    statsRow.innerHTML = `
      <div class="stat-card glass">${iconList(26)}<div class="value">${debts.length}</div><div class="stat-card-label">Всего</div></div>
      <div class="stat-card glass">${iconClock(26)}<div class="value">${activeDebts.length}</div><div class="stat-card-label">Активных</div></div>
      <div class="stat-card glass">${iconCreditCard(26)}<div class="value" style="font-size: ${getAmountFontSize(transferStr, "small")}">${transferStr}</div><div class="stat-card-label">Переводы</div></div>
      <div class="stat-card glass">${iconCash(26)}<div class="value" style="font-size: ${getAmountFontSize(cashStr, "small")}">${cashStr}</div><div class="stat-card-label">Наличные</div></div>
      <button class="action-card glass" onclick="openAddModal()">
        <div class="btn-tile btn-success-tile">${iconPlus(28)}<span class="action-title">Добавить</span></div>
      </button>
      <button class="action-card glass" onclick="openWriteOffModal()">
        <div class="btn-tile btn-outline-tile">${iconMinus(28)}<span class="action-title">Погасить</span></div>
      </button>`;
  }

  // СРЕДНЯЯ СЕКЦИЯ
  const midSec = document.getElementById("middle-section");
  if (midSec) {
    midSec.innerHTML = `<div class="chart-section glass"><h3>${iconChart(18)} Распределение</h3><canvas id="pieChart"></canvas></div>`;
  }

  // ПРАВАЯ СЕКЦИЯ
  const rightSec = document.getElementById("right-section");
  if (rightSec) {
    rightSec.innerHTML = `
      <div class="feed-section glass">
        <h3>${iconActivity(18)} Активность</h3>
        <div id="feedList"></div>
      </div>
      <div class="tips-section glass">
        <h3>${iconLightbulb(18)} Подсказки</h3>
        <div id="tipsContainer">
          <div class="tip-item">Напоминайте о долге через 7–10 дней после даты.</div>
          <div class="tip-item">Если долг старше 30 дней — обсудите возврат лично.</div>
        </div>
      </div>`;
  }

  renderModal();
  renderFeed();
}

/**
 * Плавное обновление статистики без полной перерисовки
 */
function updateStatsUI(data) {
  const totalEl = document.getElementById("totalAmount");
  if (totalEl) {
    const val = Number(data.total || 0).toLocaleString("ru-RU") + " ₽";
    totalEl.style.fontSize = getAmountFontSize(val, "main");
    totalEl.innerText = val;
  }

  const config = [
    { id: "transferTotal", val: data.transfer, isCurrency: true },
    { id: "cashTotal", val: data.cash, isCurrency: true },
    { id: "totalDebts", val: data.count, isCurrency: false },
    { id: "activeDebts", val: data.active, isCurrency: false },
  ];

  config.forEach((item) => {
    const el = document.getElementById(item.id);
    if (!el) return;
    const val = item.isCurrency
      ? Number(item.val || 0).toLocaleString("ru-RU") + " ₽"
      : (item.val || 0).toString();

    el.innerText = val;
    if (item.isCurrency) el.style.fontSize = getAmountFontSize(val, "small");
  });
}

/**
 * Генерация модальных окон
 */
function renderModal() {
  const today = new Date().toISOString().slice(0, 10);
  let modalRoot =
    document.getElementById("modal-root") || document.createElement("div");
  modalRoot.id = "modal-root";
  if (!document.getElementById("modal-root"))
    document.body.appendChild(modalRoot);

  modalRoot.innerHTML = `
    <div id="addModal" class="modal">
      <div class="modal-content glass">
        <h3>Новый долг</h3>
        <input id="debtorNameInput" placeholder="Имя должника" type="text">
        <input id="amountInput" type="number" placeholder="Сумма (₽)">
        <input id="debtorPhoneInput" type="tel" placeholder="Номер телефона">
        <div class="modal-field">
          <div class="modal-category-btns">
            <label class="category-btn"><input type="radio" name="debtCategory" value="transfer" checked><span>Перевод</span></label>
            <label class="category-btn"><input type="radio" name="debtCategory" value="cash"><span>Наличные</span></label>
          </div>
        </div>
        <input id="debtDateInput" type="date" value="${today}">
        <textarea id="debtCommentInput" placeholder="Комментарий" rows="3"></textarea>
        <div class="modal-actions">
          <button class="btn btn-success" onclick="addDebt()">Сохранить</button>
          <button class="btn btn-outline" onclick="closeModal()">Отмена</button>
        </div>
      </div>
    </div>
    <div id="writeOffModal" class="modal">
      <div class="modal-content glass">
        <h3>Списание долга</h3>
        <input id="writeOffNameInput" list="debtorNameList" placeholder="Имя должника" oninput="handleWriteOffDebtorChange()">
        <datalist id="debtorNameList"></datalist>
        <input id="writeOffPhoneInput" type="tel" placeholder="Телефон" readonly>
        <input id="writeOffTotalInput" type="text" placeholder="Текущий долг" readonly>
        <div class="modal-field">
          <div class="modal-category-btns">
            <label class="category-btn"><input type="radio" name="writeOffMode" id="writeOffModeAll" value="all" checked onchange="handleWriteOffModeChange()"><span>Весь долг</span></label>
            <label class="category-btn"><input type="radio" name="writeOffMode" id="writeOffModePart" value="part" onchange="handleWriteOffModeChange()"><span>Часть</span></label>
          </div>
        </div>
        <input id="writeOffAmountInput" type="number" placeholder="Сумма списания" disabled>
        <div class="modal-actions">
          <button class="btn btn-success" onclick="writeOffDebt()">Списать</button>
          <button class="btn btn-outline" onclick="closeWriteOffModal()">Отмена</button>
        </div>
      </div>
    </div>`;
}

// Управление модальными окнами
function openAddModal() {
  document.getElementById("addModal").classList.add("active");
}
function closeModal() {
  document.getElementById("addModal").classList.remove("active");
}
function openWriteOffModal() {
  if (typeof populateDebtorNameList === "function") populateDebtorNameList();
  document.getElementById("writeOffModal").classList.add("active");
}
function closeWriteOffModal() {
  document.getElementById("writeOffModal").classList.remove("active");
}
function handleWriteOffModeChange() {
  const amountInput = document.getElementById("writeOffAmountInput");
  const modeAll = document.getElementById("writeOffModeAll");
  if (amountInput && modeAll) amountInput.disabled = modeAll.checked;
}

// --- SVG ИКОНКИ (Lucide-like) ---
function svg(size, content) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">${content}</svg>`;
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
