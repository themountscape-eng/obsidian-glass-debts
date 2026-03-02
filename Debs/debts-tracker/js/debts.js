// ==========================================================================
// CORE DEBTS LOGIC
// ==========================================================================

/**
 * Расчет основной статистики и обновление UI
 */
function renderStats() {
  const debts = getDebts();

  let total = 0;
  let active = 0;
  let transfer = 0;
  let cash = 0;

  debts.forEach((d) => {
    if (!d.paid) {
      total += d.amount;
      active++;
      if (d.category === "cash") cash += d.amount;
      else transfer += d.amount;
    }
  });

  // Вызываем обновление UI (плитки статистики)
  updateStatsUI({
    total,
    active,
    transfer,
    cash,
    count: debts.length,
  });

  // ВАЖНО: Принудительно вызываем обновление тренда процентов
  if (typeof updateTrend === "function") {
    updateTrend(total);
  }
}

/**
 * Добавление нового долга
 */
function addDebt() {
  const nameInput = document.getElementById("debtorNameInput");
  const amountInput = document.getElementById("amountInput");

  const name = nameInput.value.trim();
  const amount = Number(amountInput.value);

  const phone =
    document.getElementById("debtorPhoneInput")?.value?.trim() || "";
  const categoryInput = document.querySelector(
    ".modal-content input[name='debtCategory']:checked",
  );
  const category = categoryInput ? categoryInput.value : "transfer";
  const dateDebtEl = document.getElementById("debtDateInput");
  const dateDebt = dateDebtEl
    ? dateDebtEl.value
    : new Date().toISOString().slice(0, 10);
  const commentEl = document.getElementById("debtCommentInput");
  const comment = commentEl ? commentEl.value.trim() : "";

  if (!name || amount <= 0) {
    alert("Заполните имя и сумму");
    return;
  }

  const debts = getDebts();
  const feed = getFeed();

  const debt = {
    id: "DBT-" + Date.now(),
    debtorName: name,
    amount: amount,
    phone: phone,
    category: category,
    dateDebt: dateDebt,
    comment: comment,
    paid: false,
  };

  debts.push(debt);
  saveDebts(debts);

  // Добавляем в ленту активности
  feed.unshift({
    type: "added",
    data: {
      debtorName: name,
      amount: amount,
      category: category,
      dateDebt: dateDebt,
    },
    timestamp: new Date().toISOString(),
  });
  saveFeed(feed);

  // Закрываем и чистим
  closeModal();
  resetAddModal();

  // Полное обновление интерфейса
  renderStats();
  renderChart(); // Здесь внутри тоже вызовется updateTrend
  renderFeed();
}

/**
 * Списание (погашение) долга
 */
function writeOffDebt() {
  const nameInput = document.getElementById("writeOffNameInput");
  const amountInput = document.getElementById("writeOffAmountInput");
  const modeAll = document.getElementById("writeOffModeAll");
  const methodInput = document.querySelector(
    "input[name='writeOffMethod']:checked",
  );

  if (!nameInput) return;

  const rawName = nameInput.value.trim();
  if (!rawName) {
    alert("Выберите должника");
    return;
  }

  const debts = getDebts();
  const nameLower = rawName.toLowerCase();

  const indices = [];
  let totalAvailable = 0;

  // Ищем все активные долги этого человека
  debts.forEach((d, idx) => {
    if (
      !d.paid &&
      d.amount > 0 &&
      d.debtorName?.trim().toLowerCase() === nameLower
    ) {
      indices.push(idx);
      totalAvailable += d.amount;
    }
  });

  if (!indices.length) {
    alert("У выбранного должника нет активных долгов");
    return;
  }

  // Определяем сумму списания
  let writeAmount;
  if (modeAll && modeAll.checked) {
    writeAmount = totalAvailable;
  } else {
    const val = Number(amountInput ? amountInput.value : 0);
    if (!val || val <= 0) {
      alert("Укажите сумму списания");
      return;
    }
    writeAmount = val > totalAvailable ? totalAvailable : val;
  }

  const method = methodInput ? methodInput.value : "transfer";

  // Логика списания: гасим долги по очереди (FIFO)
  let remaining = writeAmount;
  for (const idx of indices) {
    if (remaining <= 0) break;
    const d = debts[idx];
    if (remaining >= d.amount) {
      remaining -= d.amount;
      d.paid = true;
    } else {
      d.amount = d.amount - remaining;
      remaining = 0;
    }
  }

  saveDebts(debts);

  // Добавляем в ленту активности
  const feed = getFeed();
  feed.unshift({
    type: "writeoff",
    data: { debtorName: rawName, amount: writeAmount, method: method },
    timestamp: new Date().toISOString(),
  });
  saveFeed(feed);

  closeWriteOffModal();

  // Полное обновление интерфейса
  renderStats();
  renderChart();
  renderFeed();
}
