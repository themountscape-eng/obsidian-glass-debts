// ==========================================================================
// MAIN APPLICATION ENTRY POINT (app.js)
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("App initializing...");

  // 1. Инициализация данных (Синхронно)
  // Мы должны убедиться, что данные из localStorage доступны до рендеринга
  if (typeof initStorage === "function") {
    initStorage();
  } else {
    console.warn("Storage engine (storage.js) not found. Using defaults.");
  }

  // 2. СТРОИМ И НАПОЛНЯЕМ ИНТЕРФЕЙС (Мгновенно)
  // В новой версии ui.js функция renderLayout сама берет данные из storage
  // и вставляет их прямо в HTML. Никаких пустых блоков и "0 ₽"!
  if (typeof renderLayout === "function") {
    renderLayout();
  } else {
    console.error("UI Renderer (ui.js) not found!");
    return; // Останавливаем, если нет основы
  }

  // 3. ИНИЦИАЛИЗАЦИЯ ДИНАМИЧЕСКИХ КОМПОНЕНТОВ
  // Эти функции работают с уже созданными в renderLayout элементами (ID)

  // Обновление цифр (если нужно запустить анимацию счетчиков)
  // Мы передаем текущие данные, чтобы функции не дергали DOM зря
  refreshAppState();

  // Инициализация графиков (Chart.js)
  // Графики рисуются в <canvas>, который уже создан в renderLayout
  if (typeof initCharts === "function") {
    initCharts();
  } else if (typeof renderChart === "function") {
    renderChart();
  }

  // Инициализация ленты событий
  if (typeof renderFeed === "function") {
    renderFeed();
  }

  console.log("App ready.");
});

/**
 * Глобальная функция обновления состояния приложения.
 * Вызывается при старте и после каждого добавления/удаления долга.
 */
function refreshAppState() {
  try {
    // Получаем свежие данные из хранилища
    const debts = typeof getDebts === "function" ? getDebts() : [];
    const activeDebts = debts.filter((d) => !d.paid);

    const stats = {
      total: activeDebts.reduce((s, d) => s + Number(d.amount), 0),
      count: debts.length,
      active: activeDebts.length,
      transfer: activeDebts
        .filter((d) => d.category === "transfer")
        .reduce((s, d) => s + Number(d.amount), 0),
      cash: activeDebts
        .filter((d) => d.category === "cash")
        .reduce((s, d) => s + Number(d.amount), 0),
    };

    // Обновляем только текстовые значения в UI
    if (typeof updateStatsUI === "function") {
      updateStatsUI(stats);
    }

    // Обновляем список должников в модалке списания
    if (typeof populateDebtorNameList === "function") {
      populateDebtorNameList();
    }
  } catch (e) {
    console.error("Error refreshing app state:", e);
  }
}

/**
 * Глобальные обработчики для кнопок (связка с logic.js)
 * Эти функции вызываются из модалок, прописанных в ui.js
 */
window.addDebt = function () {
  // Вызываем логику сохранения (обычно в logic.js или main.js)
  if (typeof handleAddDebt === "function") {
    handleAddDebt(); // Внутри должна быть refreshAppState()
  } else {
    console.error("handleAddDebt function not found!");
  }
};

window.writeOffDebt = function () {
  if (typeof handleWriteOff === "function") {
    handleWriteOff(); // Внутри должна быть refreshAppState()
  }
};
