window.DB = {
  currentUser: localStorage.getItem("current_session_user") || "user",
  get KEY() {
    return `debts_data_${this.currentUser}`;
  },
  get HISTORY_KEY() {
    return `history_${this.currentUser}`;
  },

  getRaw() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw && raw !== "undefined" ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  getActive() {
    return this.getRaw().filter(
      (d) => !d.paid && d.name && Number(d.amount) > 0,
    );
  },

  login(username) {
    if (!username) return;
    localStorage.setItem("current_session_user", username.trim());
    location.reload();
  },

  add(
    name,
    amount,
    category,
    phone = "",
    comment = "",
    date = "",
    returnDate = "",
  ) {
    const all = this.getRaw();
    const numAmount = Number(amount) || 0;
    const finalDate = date || new Date().toISOString().split("T")[0];
    if (returnDate && returnDate < finalDate) {
      returnDate = finalDate;
    }

    const newEntry = {
      id: Date.now(),
      name: name.trim(),
      amount: numAmount,
      category: category || "transfer",
      phone: phone || "",
      comment: comment || "",
      date: finalDate,
      returnDate: returnDate || "",
      paid: false,
    };

    all.unshift(newEntry);
    this.save(all);
    this.addHistory(
      `Добавлен долг: ${newEntry.name} (${numAmount} ₽)`,
      "add",
      numAmount,
      newEntry.category,
    );
    return newEntry;
  },

  writeOffById(id, amount, isFull) {
    let all = this.getRaw();
    const index = all.findIndex((d) => d.id === id);

    if (index !== -1) {
      const debt = all[index];
      const offVal = isFull ? debt.amount : Number(amount);
      const actualOff = Math.min(offVal, debt.amount);

      if (isFull || offVal >= debt.amount) {
        debt.paid = true;
        debt.amount = 0;

        this.addHistory(
          `Погашен долг: ${debt.name} (${actualOff} ₽)`,
          "pay",
          actualOff,
          debt.category,
        );
      } else {
        debt.amount -= offVal;

        this.addHistory(
          `Частично погашен долг: ${debt.name} (${actualOff} ₽)`,
          "pay",
          actualOff,
          debt.category,
        );
      }

      this.save(all);
      return true;
    }

    return false;
  },

  addHistory(text, type, amount = 0, category = "transfer") {
    let history = [];
    try {
      history = JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || [];
    } catch (e) {}

    history.unshift({
      type,
      text,
      amount: Number(amount),
      category,
      date: new Date().toISOString(),
      timestamp: Date.now(),
    });

    localStorage.setItem(
      this.HISTORY_KEY,
      JSON.stringify(history.slice(0, 50)),
    );

    if (typeof renderFeed === "function") {
      renderFeed();
    }
  },
};
