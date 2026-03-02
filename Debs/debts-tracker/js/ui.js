/**
 * Генерация модальных окон
 */
function renderModal() {
  const today = new Date().toISOString().slice(0, 10);
  let modalRoot = document.getElementById("modal-root") || document.createElement("div");
  modalRoot.id = "modal-root";
  if (!document.getElementById("modal-root")) document.body.appendChild(modalRoot);

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
function openAddModal() { document.getElementById("addModal").classList.add("active"); }
function closeModal() { document.getElementById("addModal").classList.remove("active"); }
function openWriteOffModal() { 
  if (typeof populateDebtorNameList === "function") populateDebtorNameList();
  document.getElementById("writeOffModal").classList.add("active"); 
}
function closeWriteOffModal() { document.getElementById("writeOffModal").classList.remove("active"); }
function handleWriteOffModeChange() {
  const amountInput = document.getElementById("writeOffAmountInput");
  const modeAll = document.getElementById("writeOffModeAll");
  if (amountInput && modeAll) amountInput.disabled = modeAll.checked;
}

// --- SVG ИКОНКИ ---
function svg(size, content) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">${content}</svg>`;
}
function iconWallet(s) { return svg(s, `<path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/><path d="M16 12h5"/>`); }
function iconUser(s) { return svg(s, `<circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/>`); }
function iconPlus(s) { return svg(s, `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`); }
function iconMinus(s) { return svg(s, `<line x1="5" y1="12" x2="19" y2="12"/>`); }
function iconList(s) { return svg(s, `<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>`); }
function iconClock(s) { return svg(s, `<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>`); }
function iconCreditCard(s) { return svg(s, `<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>`); }
function iconCash(s) { return svg(s, `<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>`); }
function iconChart(s) { return svg(s, `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`); }
function iconActivity(s) { return svg(s, `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`); }
function iconCheck(s) { return svg(s, `<polyline points="20 6 9 17 4 12"/>`); }
function iconLightbulb(s) { return svg(s, `<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 13c1 1 1 2 1 3h6c0-1 0-2 1-3a7 7 0 0 0-4-13z"/>`); }
