function renderFeed() {
  const feed = getFeed();
  const container = document.getElementById("feedList");
  if (!container) return;

  container.innerHTML = "";

  feed.slice(0, 50).forEach((item) => {
    const div = document.createElement("div");
    div.className = "feed-item";
    const d = item.data || {};

    if (item.type === "writeoff") {
      const name = d.debtorName || "—";
      const amount = d.amount != null ? d.amount + " ₽" : "—";
      const methodText = d.method === "cash" ? "наличными" : "переводом";
      const dateStr = formatTime(item.timestamp);
      div.innerHTML = `
        <strong>✔ Списание долга</strong><br>
        ${name} — ${amount} (${methodText})<br>
        <small>${dateStr}</small>
      `;
    } else {
      const name = d.debtorName || "—";
      const amount = d.amount != null ? d.amount + " ₽" : "—";
      const cat = d.category === "cash" ? "Наличные" : "Перевод";
      const dateStr = d.dateDebt ? formatDate(d.dateDebt) : formatTime(item.timestamp);
      div.innerHTML = `
        <strong>➕ Новый долг</strong><br>
        ${name} — ${amount} (${cat})<br>
        <small>${dateStr}</small>
      `;
    }

    container.appendChild(div);
  });
}
