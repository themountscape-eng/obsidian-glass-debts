function formatTime(ts) {
  let diff = (Date.now() - new Date(ts)) / 60000;

  if (diff < 1) return "Только что";
  if (diff < 60) return Math.floor(diff) + " мин. назад";
  if (diff < 1440) return Math.floor(diff / 60) + " ч. назад";

  return new Date(ts).toLocaleString();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}
