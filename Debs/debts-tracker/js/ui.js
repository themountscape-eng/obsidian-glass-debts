// ==========================================================================
// STORAGE ENGINE (storage.js)
// ==========================================================================

/**
 * Инициализация хранилища при первом запуске
 */
function initStorage() {
  // Инициализация массива долгов
  if (!localStorage.getItem("debts_data_user")) {
    localStorage.setItem("debts_data_user", JSON.stringify([]));
  }

  // Инициализация ленты активности
  if (!localStorage.getItem("debts_feed_v1")) {
    localStorage.setItem("debts_feed_v1", JSON.stringify([]));
  }

  // Инициализация профиля пользователя (если пусто)
  if (!localStorage.getItem("debts_user_profile")) {
    localStorage.setItem(
      "debts_user_profile",
      JSON.stringify({
        name: "Пользователь",
        registeredAt: new Date().toISOString(),
      }),
    );
  }

  console.log("Storage initialized...");
}

// --- ФУНКЦИИ ПОЛЬЗОВАТЕЛЯ ---

/**
 * Получить данные профиля
 */
function getUserData() {
  try {
    const data = localStorage.getItem("debts_user_profile");
    return data ? JSON.parse(data) : { name: "Гость" };
  } catch (e) {
    return { name: "Гость" };
  }
}

/**
 * Сохранить имя пользователя
 */
function saveUserData(name) {
  const profile = { name: name, updatedAt: new Date().toISOString() };
  localStorage.setItem("debts_user_profile", JSON.stringify(profile));
}

// --- ФУНКЦИИ ДОЛГОВ ---

/**
 * Получить список всех долгов
 */
function getDebts() {
  try {
    return JSON.parse(localStorage.getItem("debts_data_user")) || [];
  } catch (e) {
    return [];
  }
}

/**
 * Сохранить массив долгов
 */
function saveDebts(data) {
  localStorage.setItem("debts_data_user", JSON.stringify(data));
}

// --- ФУНКЦИИ ЛЕНТЫ (FEED) ---

/**
 * Получить историю операций
 */
function getFeed() {
  try {
    return JSON.parse(localStorage.getItem("debts_feed_v1")) || [];
  } catch (e) {
    return [];
  }
}

/**
 * Добавить запись в ленту
 */
function addToFeed(message, type = "info") {
  const feed = getFeed();
  const newItem = {
    id: Date.now(),
    text: message,
    type: type, // 'plus', 'minus', 'info'
    date: new Date().toISOString(),
  };

  // Храним только последние 50 записей
  feed.unshift(newItem);
  saveFeed(feed.slice(0, 50));
}

function saveFeed(data) {
  localStorage.setItem("debts_feed_v1", JSON.stringify(data));
}

/**
 * Очистить всё (для отладки)
 */
function clearAllStorage() {
  localStorage.clear();
  location.reload();
}

/**
 * Добавить запись в историю (ленту)
 * @param {string} text - Сообщение (например, "Иван занял 500 ₽")
 * @param {string} type - 'plus' (взял в долг), 'minus' (отдал), 'info'
 */
function addToFeed(text, type = "info") {
  try {
    const feed = JSON.parse(localStorage.getItem("debts_feed_v1")) || [];

    const newItem = {
      id: Date.now(),
      text: text,
      type: type,
      date: new Date().toISOString(),
    };

    // Ограничиваем историю, например, 30-ю последними записями
    feed.unshift(newItem);
    localStorage.setItem("debts_feed_v1", JSON.stringify(feed.slice(0, 30)));
  } catch (e) {
    console.error("Ошибка записи в ленту:", e);
  }
}
