const STORAGE_KEY = "clean-student-schedule-v1";
const NOTIFIED_KEY = "clean-student-schedule-notified-v3";
const SETTINGS_KEY = "clean-student-schedule-settings-v1";
const PUSH_DEVICE_KEY = "clean-student-schedule-device-id-v1";

const TIMETABLE = [
  { title: "経済学入門", day: 1, time: "13:00" },
  { title: "数学入門", day: 1, time: "14:40" },
  { title: "基礎英語Ⅰ", day: 1, time: "16:20" },
  { title: "コンピュータ概論", day: 2, time: "10:30" },
  { title: "基礎簿記論", day: 2, time: "13:00" },
  { title: "宮古情報概論", day: 3, time: "08:50" },
  { title: "情報ネットワーク", day: 3, time: "10:30" },
  { title: "岩手三陸学", day: 3, time: "14:40" },
  { title: "経営学入門", day: 4, time: "10:30" },
  { title: "心理学", day: 4, time: "13:00" },
  { title: "キャリア形成の基礎", day: 4, time: "14:40" },
  { title: "情報リテラシー", day: 5, time: "13:00" },
  { title: "法学", day: 5, time: "16:20" },
];

const $ = (id) => document.getElementById(id);
const tabs = document.querySelectorAll(".tab, .drawer-link");
const views = document.querySelectorAll(".view");
const form = $("scheduleForm");
const toast = $("toast");
const titleInput = $("title");
const typeInput = $("type");
const dateInput = $("date");
const timeInput = $("time");
const notifyModeInput = $("notifyMode");
const repeatModeInput = $("repeatMode");
const memoInput = $("memo");
const notifyHint = $("notifyHint");
const submitBtn = $("submitBtn");
const editingIdInput = $("editingId");
const cancelEditBtn = $("cancelEditBtn");
const formTitle = $("formTitle");
const installBtn = $("installBtn");
const syncPushBtn = $("syncPushBtn");
const pushStatusEl = $("pushStatus");
const searchInput = $("searchInput");
const searchCount = $("searchCount");
const menuBtn = $("menuBtn");
const closeDrawerBtn = $("closeDrawerBtn");
const drawer = $("drawer");
const drawerOverlay = $("drawerOverlay");
const dailySummaryEnabledInput = $("dailySummaryEnabled");
const dailySummaryTimeInput = $("dailySummaryTime");

let calendarCursor = startOfMonth(new Date());
let selectedDate = isoDate(new Date());
let deferredInstallPrompt = null;

function loadItems() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").map(normalizeItem);
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(normalizeItem)));
  syncToPushServerDebounced();
}

function normalizeItem(item) {
  return {
    id: item.id || makeId(),
    title: item.title || "無題",
    type: item.type || "event",
    date: item.date || isoDate(new Date()),
    time: item.time || "09:00",
    notifyMode: normalizeNotifyMode(item.notifyMode),
    repeatMode: normalizeRepeatMode(item.repeatMode || item.repeat),
    memo: item.memo || "",
    done: !!item.done,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || ""
  };
}

function normalizeNotifyMode(mode) {
  if (mode === "strong") return "strong";
  if (mode === "none") return "none";
  return "on";
}

function normalizeRepeatMode(mode) {
  if (mode === "weekly4") return "weekly4";
  if (mode === "weekly12") return "weekly12";
  if (mode === "monthly3") return "monthly3";
  return "none";
}

function repeatLabel(mode) {
  return {
    weekly4: "毎週4回",
    weekly12: "毎週12回",
    monthly3: "毎月3回"
  }[normalizeRepeatMode(mode)] || "";
}

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function formatDate(date, time) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(toDateTime(date, time));
}

function addDays(date, days) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

function formatDayHeader(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  const today = isoDate(new Date());
  const tomorrow = isoDate(addDays(new Date(), 1));
  const label = dateStr === today ? "今日" : dateStr === tomorrow ? "明日" : "";
  const formatted = new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  }).format(d);
  return label ? `${label}・${formatted}` : formatted;
}

function typeLabel(type) {
  return ({ task: "課題", event: "予定", class: "授業", work: "バイト", other: "その他" })[type] || "予定";
}

function isTask(item) {
  return item.type === "task";
}

function taskUrgencyLabel(item) {
  if (!isTask(item) || item.done) return "";
  const today = new Date();
  const due = new Date(`${item.date}T${item.time || "00:00"}:00`);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueStart - todayStart) / (24 * 60 * 60 * 1000));

  if (diffDays < 0) return `${Math.abs(diffDays)}日過ぎてる`;
  if (diffDays === 0) return "今日締切";
  if (diffDays === 1) return "明日締切";
  return `あと${diffDays}日`;
}

function getDangerTasks(items, limit = 5) {
  return sortItems(items
    .filter(item => isTask(item) && !item.done)
    .sort((a, b) => toDateTime(a.date, a.time) - toDateTime(b.date, b.time)))
    .slice(0, limit);
}

function isToday(item) {
  return item.date === isoDate(new Date());
}

function sortItems(items) {
  return items.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return toDateTime(a.date, a.time) - toDateTime(b.date, b.time);
  });
}

function switchTab(name) {
  tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.tab === name));
  views.forEach(view => view.classList.toggle("active", view.id === `view-${name}`));
  closeDrawer();
  render();
}


function openDrawer() {
  if (!drawer || !drawerOverlay) return;
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  drawerOverlay.hidden = false;
}

function closeDrawer() {
  if (!drawer || !drawerOverlay) return;
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  drawerOverlay.hidden = true;
}

if (menuBtn) menuBtn.addEventListener("click", openDrawer);
if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", closeDrawer);
if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeDrawer();
});

tabs.forEach(tab => tab.addEventListener("click", () => switchTab(tab.dataset.tab)));
document.querySelectorAll("[data-open-tab]").forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.openTab));
});

function empty(text) {
  const div = document.createElement("div");
  div.className = "empty";
  div.textContent = text;
  return div;
}

function renderItem(item) {
  const div = document.createElement("article");
  div.className = `item ${item.done ? "done" : ""}`;
  div.innerHTML = `
    <div>
      <div class="badges">
        <span class="badge ${item.type}">${typeLabel(item.type)}</span>
        ${repeatLabel(item.repeatMode) ? `<span class="badge repeat">${repeatLabel(item.repeatMode)}</span>` : ""}
        ${taskUrgencyLabel(item) ? `<span class="badge ${toDateTime(item.date, item.time).getTime() < Date.now() ? "overdue" : "soon"}">${taskUrgencyLabel(item)}</span>` : ""}
        ${item.done ? `<span class="badge other">完了</span>` : ""}
      </div>
      <p class="item-title">${escapeHtml(item.title)}</p>
      <p class="item-meta">${formatDate(item.date, item.time)} / 通知 ${notifyLabel(item)}</p>
      ${item.memo ? `<p class="item-memo">${escapeHtml(item.memo)}</p>` : ""}
    </div>
    <div class="actions">
      <button class="icon-btn" data-action="edit" data-id="${item.id}" type="button">編集</button>
      <button class="icon-btn done-btn" data-action="toggle" data-id="${item.id}" type="button">${item.done ? "戻す" : "完了"}</button>
      <button class="icon-btn delete-btn" data-action="delete" data-id="${item.id}" type="button">削除</button>
    </div>
  `;
  return div;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function renderList(el, items, emptyText) {
  el.innerHTML = "";
  if (!items.length) {
    el.appendChild(empty(emptyText));
    return;
  }
  items.forEach(item => el.appendChild(renderItem(item)));
}


function renderWeekList(items) {
  const el = $("weekList");
  if (!el) return;

  const today = new Date();
  const start = isoDate(today);
  const end = isoDate(addDays(today, 6));

  const weekItems = sortItems(items.filter(item => {
    return !item.done && item.date >= start && item.date <= end;
  }));

  el.innerHTML = "";
  if (!weekItems.length) {
    el.appendChild(empty("今後7日間の予定はまだないよ。"));
    return;
  }

  const grouped = new Map();
  weekItems.forEach(item => {
    if (!grouped.has(item.date)) grouped.set(item.date, []);
    grouped.get(item.date).push(item);
  });

  [...grouped.entries()].forEach(([date, dayItems]) => {
    const group = document.createElement("section");
    group.className = "week-group";
    group.innerHTML = `
      <div class="week-date">
        <strong>${formatDayHeader(date)}</strong>
        <span class="count">${dayItems.length}件</span>
      </div>
    `;
    dayItems.forEach(item => group.appendChild(renderItem(item)));
    el.appendChild(group);
  });
}


function renderTasksPage() {
  const items = sortItems(loadItems());
  const today = isoDate(new Date());
  const end = isoDate(addDays(new Date(), 6));
  const tasks = items.filter(item => isTask(item));

  const overdue = tasks
    .filter(item => !item.done && item.date < today)
    .sort((a, b) => toDateTime(a.date, a.time) - toDateTime(b.date, b.time));

  const week = tasks
    .filter(item => !item.done && item.date >= today && item.date <= end)
    .sort((a, b) => toDateTime(a.date, a.time) - toDateTime(b.date, b.time));

  const all = tasks
    .filter(item => !item.done)
    .sort((a, b) => toDateTime(a.date, a.time) - toDateTime(b.date, b.time));

  const done = tasks
    .filter(item => item.done)
    .sort((a, b) => toDateTime(b.date, b.time) - toDateTime(a.date, a.time))
    .slice(0, 10);

  renderList($("overdueTasksList"), overdue, "期限切れの課題はないよ。");
  renderList($("weekTasksList"), week, "今週締切の課題はないよ。");
  renderList($("allTasksList"), all, "未完了の課題はないよ。");
  renderList($("doneTasksList"), done, "完了済みの課題はまだないよ。");
}

function renderSearchPage() {
  const resultsEl = $("searchResults");
  if (!resultsEl) return;

  const q = (searchInput?.value || "").trim().toLowerCase();
  const items = sortItems(loadItems());
  const results = q
    ? items.filter(item => `${item.title} ${typeLabel(item.type)} ${item.memo} ${item.date} ${item.time}`.toLowerCase().includes(q))
    : [];

  if (searchCount) searchCount.textContent = `${results.length}件`;
  renderList(resultsEl, results, q ? "該当する予定はなかったよ。" : "キーワードを入れると検索できるよ。");
}

function renderHome() {
  const items = sortItems(loadItems());
  const today = items.filter(item => isToday(item) && !item.done);
  const now = Date.now();
  const upcomingTasks = items
    .filter(item => isTask(item) && !item.done)
    .filter(item => toDateTime(item.date, item.time).getTime() >= now - 24 * 60 * 60 * 1000)
    .slice(0, 6);

  $("todayLabel").textContent = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date());

  const taskCount = items.filter(item => isTask(item) && !item.done).length;
  const start = isoDate(new Date());
  const end = isoDate(addDays(new Date(), 6));
  const weekCount = items.filter(item => !item.done && item.date >= start && item.date <= end).length;
  $("homeSummary").textContent = `今日の予定 ${today.length}件・未完了課題 ${taskCount}件・今後7日 ${weekCount}件`;

  renderList($("todayList"), today, "今日の予定はまだないよ。");
  renderList($("dangerList"), getDangerTasks(items), "やばい課題はまだないよ。");
  renderList($("upcomingTasks"), upcomingTasks, "近い課題はまだないよ。えらい。");
  renderWeekList(items);
}

function renderCalendar() {
  const items = loadItems();
  const y = calendarCursor.getFullYear();
  const m = calendarCursor.getMonth();
  $("monthTitle").textContent = `${y}年 ${m + 1}月`;
  const grid = $("calendarGrid");
  grid.innerHTML = "";

  const first = new Date(y, m, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = isoDate(d);
    const dayItems = items.filter(item => item.date === dateStr && !item.done);
    const cell = document.createElement("div");
    cell.className = [
      "day",
      d.getMonth() !== m ? "other" : "",
      dateStr === isoDate(new Date()) ? "today" : "",
      dateStr === selectedDate ? "selected" : ""
    ].join(" ");
    cell.innerHTML = `
      <button type="button" data-date="${dateStr}">${d.getDate()}</button>
      <div class="dots">${dayItems.slice(0, 5).map(item => `<span class="dot ${item.type}"></span>`).join("")}</div>
    `;
    grid.appendChild(cell);
  }

  $("selectedDayTitle").textContent = `${selectedDate} の予定`;
  renderList($("selectedDayList"), sortItems(items.filter(item => item.date === selectedDate)), "この日の予定はないよ。");
}

$("calendarGrid").addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-date]");
  if (!btn) return;
  selectedDate = btn.dataset.date;
  renderCalendar();
});

$("prevMonth").addEventListener("click", () => {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
  renderCalendar();
});
$("nextMonth").addEventListener("click", () => {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
  renderCalendar();
});

function renderTimetable() {
  const grid = $("timetableGrid");
  const days = {1: "月曜", 2: "火曜", 3: "水曜", 4: "木曜", 5: "金曜"};
  grid.innerHTML = Object.entries(days).map(([day, label]) => {
    const classes = TIMETABLE.filter(c => String(c.day) === String(day));
    return `
      <article class="day-card">
        <h3>${label}</h3>
        ${classes.map(c => `
          <div class="class-chip">
            <strong>${c.title}</strong>
            <small>${c.time}</small>
          </div>
        `).join("")}
      </article>
    `;
  }).join("");
}

function render() {
  renderHome();
  renderTasksPage();
  renderSearchPage();
  renderCalendar();
  renderTimetable();
}

function updateNotifyHint() {
  const type = typeInput.value;
  const mode = notifyModeInput.value;
  if (mode === "none") {
    notifyHint.textContent = "通知なし。";
    return;
  }
  if (mode === "strong") {
    notifyHint.textContent = type === "task"
      ? "しつこめ：3日前・2日前・前日・12時間前・9時間前・6時間前・3時間前・1時間前・30分前・締切時刻。未完了なら締切後30分・1時間・3時間にも通知。"
      : "しつこめ：3日前・2日前・前日・12時間前・9時間前・6時間前・3時間前・1時間前・30分前・開始時刻に通知。";
    return;
  }
  notifyHint.textContent = type === "task"
    ? "通知あり：1時間前・30分前・10分前・締切時刻に通知。"
    : "通知あり：1時間前・30分前・10分前・開始時刻に通知。";
}

typeInput.addEventListener("change", updateNotifyHint);
notifyModeInput.addEventListener("change", updateNotifyHint);

function getNotificationPlan(item) {
  const mode = normalizeNotifyMode(item.notifyMode);
  if (mode === "none") return { before: [], after: [] };
  if (mode === "strong") {
    return {
      before: [4320, 2880, 1440, 720, 540, 360, 180, 60, 30, 0],
      after: isTask(item) ? [30, 60, 180] : []
    };
  }
  return { before: [60, 30, 10, 0], after: [] };
}

function notifyLabel(item) {
  return ({ on: "通知あり", none: "なし", strong: "しつこめ" })[normalizeNotifyMode(item.notifyMode)] || "通知あり";
}

function resetFormKeepUseful() {
  const keepType = typeInput.value;
  const keepDate = dateInput.value;
  const keepTime = timeInput.value;
  const keepNotify = notifyModeInput.value;
  const keepRepeat = repeatModeInput?.value || "none";

  form.reset();
  editingIdInput.value = "";
  formTitle.textContent = "追加";
  submitBtn.textContent = "追加する";
  cancelEditBtn.classList.add("hidden");

  typeInput.value = keepType;
  dateInput.value = keepDate || isoDate(new Date());
  timeInput.value = keepTime || "09:00";
  notifyModeInput.value = normalizeNotifyMode(keepNotify);
  if (repeatModeInput) repeatModeInput.value = keepRepeat;
  titleInput.value = "";
  memoInput.value = "";
  updateNotifyHint();
  setTimeout(() => titleInput.focus(), 80);
}

function showToast(title, detail = "") {
  toast.innerHTML = `<strong>${escapeHtml(title)}</strong>${detail ? `<br><span>${escapeHtml(detail)}</span>` : ""}`;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function animateSavedButton() {
  const old = submitBtn.textContent;
  submitBtn.classList.add("saved");
  submitBtn.textContent = "追加しました！";
  setTimeout(() => {
    submitBtn.classList.remove("saved");
    submitBtn.textContent = old;
  }, 1100);
}


function addMonths(date, months) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setMonth(d.getMonth() + months);
  return d;
}

function makeRepeatedItems(baseItem) {
  const mode = normalizeRepeatMode(baseItem.repeatMode);
  if (mode === "none") return [baseItem];

  const count = mode === "weekly4" ? 4 : mode === "weekly12" ? 12 : 3;
  const original = new Date(`${baseItem.date}T00:00:00`);
  const items = [];

  for (let i = 0; i < count; i++) {
    const d = mode === "monthly3" ? addMonths(original, i) : addDays(original, i * 7);
    items.push({
      ...baseItem,
      id: i === 0 ? baseItem.id : makeId(),
      date: isoDate(d),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return items;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const item = {
    id: editingIdInput.value || makeId(),
    title: titleInput.value.trim(),
    type: typeInput.value,
    date: dateInput.value,
    time: timeInput.value,
    notifyMode: notifyModeInput.value,
    repeatMode: normalizeRepeatMode(repeatModeInput?.value),
    memo: memoInput.value.trim(),
    done: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const items = loadItems();
  if (editingIdInput.value) {
    const old = items.find(x => x.id === editingIdInput.value);
    item.done = old?.done || false;
    item.createdAt = old?.createdAt || item.createdAt;
    saveItems(items.map(x => x.id === item.id ? item : x));
    showToast("編集しました", item.title);
    resetFormKeepUseful();
    switchTab("home");
    return;
  }

  const repeatedItems = makeRepeatedItems(item);
  items.push(...repeatedItems);
  saveItems(items);
  render();
  animateSavedButton();
  showToast("追加しました！", repeatedItems.length > 1 ? `「${item.title}」を${repeatedItems.length}件保存しました` : `「${item.title}」を保存しました`);
  resetFormKeepUseful();
  checkNotifications();
});

document.body.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;
  const items = loadItems();
  const item = items.find(x => x.id === id);
  if (!item) return;

  if (action === "toggle") {
    saveItems(items.map(x => x.id === id ? { ...x, done: !x.done, updatedAt: new Date().toISOString() } : x));
    showToast(item.done ? "未完了に戻しました" : "完了にしました", item.title);
  }

  if (action === "delete") {
    if (!confirm(`「${item.title}」を削除する？`)) return;
    saveItems(items.filter(x => x.id !== id));
    showToast("削除しました", item.title);
  }

  if (action === "edit") {
    editingIdInput.value = item.id;
    titleInput.value = item.title;
    typeInput.value = item.type;
    dateInput.value = item.date;
    timeInput.value = item.time;
    notifyModeInput.value = item.notifyMode;
    if (repeatModeInput) repeatModeInput.value = normalizeRepeatMode(item.repeatMode);
    memoInput.value = item.memo;
    formTitle.textContent = "編集";
    submitBtn.textContent = "保存する";
    cancelEditBtn.classList.remove("hidden");
    updateNotifyHint();
    switchTab("add");
  }

  render();
});

cancelEditBtn.addEventListener("click", () => {
  resetFormKeepUseful();
  showToast("編集をやめました");
});

function setDefaults() {
  if (!dateInput.value) dateInput.value = isoDate(new Date());
  if (!timeInput.value) timeInput.value = "09:00";
  if (repeatModeInput && !repeatModeInput.value) repeatModeInput.value = "none";
  updateNotifyHint();
}

async function askNotification() {
  if (!("Notification" in window)) {
    alert("この端末・ブラウザは通知に対応していないみたいです。");
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    await showNotification("通知をオンにしました", "完全Push通知の登録も試します。");
    await enableServerPush();
  } else {
    alert("通知が許可されませんでした。端末設定から許可してください。");
  }
}

$("notifyBtnHome").addEventListener("click", askNotification);
$("notifyBtnSettings").addEventListener("click", askNotification);
if (syncPushBtn) syncPushBtn.addEventListener("click", async () => { await syncToPushServer(true); });


function getDeviceId() {
  let id = localStorage.getItem(PUSH_DEVICE_KEY);
  if (!id) {
    id = makeId();
    localStorage.setItem(PUSH_DEVICE_KEY, id);
  }
  return id;
}

function setPushStatus(text) {
  if (pushStatusEl) pushStatusEl.textContent = text;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

async function enableServerPush() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("この端末は完全Push通知に未対応");
      showToast("完全通知に未対応", "通常のアプリ内通知は使えます");
      return;
    }

    const configRes = await fetch("/.netlify/functions/config");
    if (!configRes.ok) throw new Error("config");
    const config = await configRes.json();
    if (!config.vapidPublicKey) {
      setPushStatus("Netlify環境変数が未設定");
      showToast("VAPIDキー未設定", "Netlifyの環境変数を設定してね");
      return;
    }

    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey)
      });
    }

    await syncToPushServer(true, subscription);
    setPushStatus("登録済み");
  } catch (error) {
    console.error(error);
    setPushStatus("登録エラー");
    showToast("完全通知の登録に失敗", "Netlify設定を確認してね");
  }
}

let pushSyncTimer = null;
function syncToPushServerDebounced() {
  clearTimeout(pushSyncTimer);
  pushSyncTimer = setTimeout(() => syncToPushServer(false), 800);
}

async function syncToPushServer(showResult = false, forcedSubscription = null) {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const reg = await navigator.serviceWorker.ready;
    const subscription = forcedSubscription || await reg.pushManager.getSubscription();
    if (!subscription) {
      setPushStatus("未登録");
      if (showResult) showToast("まだ完全通知は未登録", "先に通知を許可してね");
      return;
    }

    const res = await fetch("/.netlify/functions/save-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: getDeviceId(),
        subscription,
        items: loadItems(),
        settings: loadSettings ? loadSettings() : {},
        timeZone: "Asia/Tokyo",
        updatedAt: new Date().toISOString()
      })
    });

    if (!res.ok) throw new Error(await res.text());
    setPushStatus("同期済み");
    if (showResult) showToast("同期しました", "完全通知サーバーに予定を保存しました");
  } catch (error) {
    console.error(error);
    setPushStatus("同期エラー");
    if (showResult) showToast("同期に失敗", "Netlify Functionsを確認してね");
  }
}

async function refreshPushStatus() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("未対応");
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setPushStatus(sub ? "登録済み" : "未登録");
  } catch {
    setPushStatus("未確認");
  }
}

async function showNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(title, {
      body,
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
      data: { url: location.href }
    });
    return;
  }
  new Notification(title, { body });
}

function loadNotified() {
  return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "{}");
}

function saveNotified(data) {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(data));
}

function loadSettings() {
  const defaults = { dailySummaryEnabled: true, dailySummaryTime: "08:00" };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return defaults;
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function syncSettingsControls() {
  const settings = loadSettings();
  if (dailySummaryEnabledInput) dailySummaryEnabledInput.checked = !!settings.dailySummaryEnabled;
  if (dailySummaryTimeInput) dailySummaryTimeInput.value = settings.dailySummaryTime || "08:00";
}

function updateDailySummarySettings() {
  saveSettings({
    dailySummaryEnabled: dailySummaryEnabledInput?.checked ?? true,
    dailySummaryTime: dailySummaryTimeInput?.value || "08:00"
  });
  showToast("朝のまとめ通知を保存しました", `${dailySummaryTimeInput?.value || "08:00"} に通知`);
}

async function checkNotifications() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  await checkDailySummaryNotification();

  const now = Date.now();
  const notified = loadNotified();
  const items = loadItems().filter(item => !item.done);

  for (const item of items) {
    const due = toDateTime(item.date, item.time).getTime();
    const plan = getNotificationPlan(item);
    const entries = [];

    plan.before.forEach(min => entries.push({
      key: `before-${min}`,
      at: due - min * 60 * 1000,
      title: isTask(item) ? `課題：${item.title}` : `予定：${item.title}`,
      body: min === 0 ? `${typeLabel(item.type)}の時刻です。` : `あと${humanMinutes(min)}です。`
    }));

    plan.after.forEach(min => entries.push({
      key: `after-${min}`,
      at: due + min * 60 * 1000,
      title: `未完了：${item.title}`,
      body: "まだ完了になっていない課題です。"
    }));

    for (const entry of entries) {
      const key = `${item.id}-${entry.key}`;
      if (!notified[key] && now >= entry.at && now <= entry.at + 10 * 60 * 1000) {
        notified[key] = true;
        await showNotification(entry.title, entry.body);
      }
    }
  }
  saveNotified(notified);
}

async function checkDailySummaryNotification() {
  const settings = loadSettings();
  if (!settings.dailySummaryEnabled) return;

  const [hour, minute] = (settings.dailySummaryTime || "08:00").split(":").map(Number);
  const nowDate = new Date();
  const today = isoDate(nowDate);
  const target = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), hour || 8, minute || 0, 0);
  const now = Date.now();

  if (now < target.getTime() || now > target.getTime() + 60 * 60 * 1000) return;

  const notified = loadNotified();
  const key = `daily-summary-${today}`;
  if (notified[key]) return;

  const items = loadItems().filter(item => !item.done);
  const todayItems = sortItems(items.filter(item => item.date === today));
  const upcomingTasks = sortItems(items.filter(item => isTask(item) && item.date >= today)).slice(0, 3);

  const title = "今日のまとめ";
  const lines = [];
  lines.push(`今日の予定：${todayItems.length}件`);
  if (todayItems.length) lines.push(todayItems.slice(0, 3).map(item => `・${item.title} ${item.time}`).join("\n"));
  lines.push(`近い課題：${upcomingTasks.length}件`);
  if (upcomingTasks.length) lines.push(upcomingTasks.map(item => `・${item.title} ${item.date}`).join("\n"));

  notified[key] = true;
  saveNotified(notified);
  await showNotification(title, lines.join("\n"));
}

function humanMinutes(min) {
  if (min >= 1440) return `${min / 1440}日`;
  if (min >= 60) return `${min / 60}時間`;
  return `${min}分`;
}

$("addTimetableBtn").addEventListener("click", () => {
  const ok = confirm("前期の時間割を今学期分としてまとめて追加する？");
  if (!ok) return;

  const items = loadItems();
  const end = new Date("2026-08-31T23:59:00");
  let count = 0;

  TIMETABLE.forEach(cls => {
    let d = nextWeekday(cls.day, new Date());
    while (d <= end) {
      const date = isoDate(d);
      const exists = items.some(item => item.title === cls.title && item.date === date && item.time === cls.time);
      if (!exists) {
        items.push({
          id: makeId(),
          title: cls.title,
          type: "class",
          date,
          time: cls.time,
          notifyMode: "on",
          memo: "時間割から追加",
          done: false,
          createdAt: new Date().toISOString(),
          updatedAt: ""
        });
        count++;
      }
      d.setDate(d.getDate() + 7);
    }
  });

  saveItems(items);
  render();
  showToast("時間割を追加しました", `${count}件追加`);
});

function nextWeekday(day, from) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const diff = (day - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

$("exportBtn").addEventListener("click", () => {
  const data = {
    app: "clean-student-schedule",
    version: 1,
    exportedAt: new Date().toISOString(),
    items: loadItems()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `schedule-backup-${isoDate(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("バックアップしました");
});

$("importFile").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const items = Array.isArray(data) ? data : data.items;
    if (!Array.isArray(items)) throw new Error("invalid");
    const ok = confirm(`${items.length}件を復元する？今の予定は置き換わるよ。`);
    if (!ok) return;
    saveItems(items.map(normalizeItem));
    render();
    showToast("復元しました", `${items.length}件`);
  } catch {
    alert("復元できませんでした。バックアップJSONを選んでね。");
  } finally {
    event.target.value = "";
  }
});

$("clearAllBtn").addEventListener("click", () => {
  const ok = confirm("予定を全部削除する？これは戻せないよ。");
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(NOTIFIED_KEY);
  render();
  showToast("全データを削除しました");
});

if (dailySummaryEnabledInput) dailySummaryEnabledInput.addEventListener("change", updateDailySummarySettings);
if (dailySummaryTimeInput) dailySummaryTimeInput.addEventListener("change", updateDailySummarySettings);

if (searchInput) searchInput.addEventListener("input", renderSearchPage);

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBtn.classList.add("hidden");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}

syncSettingsControls();
setDefaults();
render();
refreshPushStatus();
syncToPushServerDebounced();
checkNotifications();
setInterval(checkNotifications, 60 * 1000);
