:root {
  --bg: #f5f7fb;
  --card: #ffffff;
  --text: #111827;
  --muted: #6b7280;
  --line: #e5e7eb;
  --blue: #0a84ff;
  --blue-soft: #e8f2ff;
  --red: #ff3b30;
  --orange: #ff9500;
  --green: #34c759;
  --shadow: 0 10px 32px rgba(15, 23, 42, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}
button, input, select, textarea { font: inherit; }
button { border: 0; cursor: pointer; }
.app {
  width: min(780px, 100%);
  margin: 0 auto;
  min-height: 100vh;
  padding: 18px 14px calc(84px + env(safe-area-inset-bottom));
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 4px 14px;
}
.eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--muted);
  font-weight: 700;
}
h1 { margin: 0; font-size: 34px; letter-spacing: -0.04em; }
h2 { margin: 0; font-size: 28px; letter-spacing: -0.03em; }
h3 { margin: 0; font-size: 17px; }
.view { display: none; animation: fadeIn .18s ease; }
.view.active { display: block; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 10px 4px 14px;
}
.card, .hero-card, .notice-card {
  background: var(--card);
  border: 1px solid rgba(229, 231, 235, 0.9);
  border-radius: 24px;
  box-shadow: var(--shadow);
  padding: 16px;
  margin-bottom: 14px;
}
.hero-card {
  background: linear-gradient(160deg, #0a84ff, #5e5ce6);
  color: white;
}
.hero-card .muted { color: rgba(255,255,255,.82); }
.summary { margin: 8px 0 0; line-height: 1.6; }
.muted { color: var(--muted); margin: 0 0 10px; }
.row-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.text-button {
  background: transparent;
  color: var(--blue);
  font-weight: 700;
  padding: 8px 4px;
}
.pill {
  background: var(--blue-soft);
  color: var(--blue);
  padding: 9px 14px;
  border-radius: 999px;
  font-weight: 800;
}
.hidden { display: none !important; }
.mini-label {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.list { display: grid; gap: 10px; }
.empty {
  color: var(--muted);
  background: #f9fafb;
  border-radius: 16px;
  padding: 14px;
  text-align: center;
}
.item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: start;
  background: #f9fafb;
  border: 1px solid #eef0f4;
  border-radius: 18px;
  padding: 12px;
  animation: itemIn .24s ease;
}
@keyframes itemIn { from { opacity: 0; transform: translateY(8px) scale(.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
.item.done { opacity: .55; }
.item.done .item-title { text-decoration: line-through; }
.item-title { margin: 0 0 4px; font-weight: 900; }
.item-meta { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.45; }
.item-memo { margin: 7px 0 0; color: #374151; white-space: pre-wrap; font-size: 14px; }
.badges { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.badge {
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 800;
}
.badge.task { background: #fff3d7; color: #9a5a00; }
.badge.event { background: var(--blue-soft); color: var(--blue); }
.badge.class { background: #e9fbeF; color: #11863a; }
.badge.work { background: #f3e8ff; color: #7c3aed; }
.badge.other { background: #eef0f4; color: #4b5563; }
.actions { display: flex; gap: 6px; }
.icon-btn {
  background: white;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 8px 9px;
  color: #374151;
  font-weight: 800;
}
.icon-btn.done-btn { color: var(--green); }
.icon-btn.delete-btn { color: var(--red); }

.form {
  display: grid;
  gap: 14px;
}
label {
  display: grid;
  gap: 7px;
  color: #374151;
  font-size: 13px;
  font-weight: 800;
}
input, select, textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #f9fafb;
  color: var(--text);
  padding: 13px 14px;
  outline: none;
}
input:focus, select:focus, textarea:focus {
  border-color: rgba(10, 132, 255, .6);
  box-shadow: 0 0 0 4px rgba(10, 132, 255, .12);
  background: white;
}
textarea { resize: vertical; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.hint {
  background: #f0f7ff;
  color: #1f4f82;
  border-radius: 16px;
  padding: 12px;
  line-height: 1.5;
  font-size: 14px;
}
.primary {
  background: var(--blue);
  color: white;
  border-radius: 16px;
  padding: 15px;
  font-weight: 900;
  box-shadow: 0 10px 22px rgba(10, 132, 255, .22);
  transition: transform .12s ease, background .12s ease;
}
.primary:active { transform: scale(.98); }
.primary.saved { background: var(--green); }

.month-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}
.circle {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  color: var(--blue);
  background: var(--blue-soft);
  font-size: 24px;
  line-height: 1;
}
.weekdays, .calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 7px;
}
.weekdays {
  margin-bottom: 8px;
  text-align: center;
  color: var(--muted);
  font-size: 12px;
  font-weight: 900;
}
.day {
  min-height: 62px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #f9fafb;
  padding: 7px;
}
.day.other { opacity: .38; }
.day.today { border-color: var(--blue); background: #f0f7ff; }
.day.selected { outline: 2px solid var(--blue); background: white; }
.day button {
  width: 100%;
  text-align: left;
  background: transparent;
  padding: 0;
  font-weight: 900;
  color: var(--text);
}
.dots { display: flex; gap: 4px; margin-top: 9px; flex-wrap: wrap; }
.dot { width: 7px; height: 7px; border-radius: 999px; background: var(--blue); }
.dot.task { background: var(--orange); }
.dot.event { background: var(--blue); }
.dot.class { background: var(--green); }
.dot.work { background: #af52de; }
.dot.other { background: #8e8e93; }

.timetable {
  display: grid;
  gap: 12px;
}
.day-card {
  border: 1px solid var(--line);
  border-radius: 20px;
  background: #f9fafb;
  padding: 12px;
}
.day-card h3 { margin-bottom: 10px; }
.class-chip {
  background: white;
  border: 1px solid var(--line);
  border-left: 5px solid var(--green);
  border-radius: 14px;
  padding: 10px;
  margin-bottom: 8px;
}
.class-chip strong { display: block; }
.class-chip small { display: block; color: var(--muted); margin-top: 2px; }

.settings-list { padding: 0; overflow: hidden; }
.setting-row {
  width: 100%;
  display: grid;
  gap: 3px;
  text-align: left;
  background: white;
  padding: 16px;
  border-bottom: 1px solid var(--line);
}
.setting-row span { font-weight: 900; }
.setting-row small { color: var(--muted); }
.setting-row.danger span { color: var(--red); }
.setting-row:last-child { border-bottom: 0; }
.import-row input { display: none; }
.notice-card p { margin: 8px 0 0; color: var(--muted); line-height: 1.6; }

.tabs {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: min(780px, 100%);
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
  padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
  background: rgba(255,255,255,.9);
  backdrop-filter: blur(18px);
  border-top: 1px solid rgba(229,231,235,.9);
}
.tab {
  background: transparent;
  color: var(--muted);
  border-radius: 14px;
  padding: 10px 4px;
  font-size: 12px;
  font-weight: 900;
}
.tab.active {
  background: var(--blue-soft);
  color: var(--blue);
}

.toast {
  position: fixed;
  left: 50%;
  top: calc(14px + env(safe-area-inset-top));
  transform: translate(-50%, -18px);
  background: rgba(17, 24, 39, .94);
  color: white;
  border-radius: 18px;
  padding: 12px 16px;
  width: min(360px, calc(100% - 28px));
  box-shadow: 0 16px 40px rgba(0,0,0,.22);
  opacity: 0;
  pointer-events: none;
  z-index: 50;
  transition: opacity .22s ease, transform .22s ease;
}
.toast.show {
  opacity: 1;
  transform: translate(-50%, 0);
}

@media (max-width: 560px) {
  .two-col { grid-template-columns: 1fr; }
  .item { grid-template-columns: 1fr; }
  .actions { justify-content: flex-end; }
  h1 { font-size: 32px; }
  h2 { font-size: 26px; }
}

.setting-control {
  gap: 10px;
}
.setting-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}
.switch-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-weight: 800;
  color: #374151;
}
.switch-label input {
  width: auto;
}
.setting-inline input[type="time"] {
  width: 130px;
  padding: 9px 10px;
}

.week-list {
  display: grid;
  gap: 12px;
}
.week-group {
  display: grid;
  gap: 8px;
}
.week-date {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 900;
  padding: 0 2px;
}
.week-date strong {
  color: var(--text);
}
.week-date .count {
  color: var(--blue);
  background: var(--blue-soft);
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
}

/* Side drawer menu */
.app {
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
}
.topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
}
.topbar-title {
  min-width: 0;
}
.menu-button {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  background: white;
  border: 1px solid var(--line);
  color: var(--text);
  font-size: 22px;
  font-weight: 900;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
}
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, .34);
  backdrop-filter: blur(2px);
  z-index: 70;
}
.drawer {
  position: fixed;
  top: 0;
  left: 0;
  width: min(320px, 86vw);
  height: 100vh;
  padding: calc(18px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom));
  background: rgba(255,255,255,.96);
  backdrop-filter: blur(18px);
  box-shadow: 24px 0 60px rgba(15, 23, 42, .22);
  border-right: 1px solid rgba(229, 231, 235, .9);
  transform: translateX(-105%);
  transition: transform .24s ease;
  z-index: 80;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.drawer.open {
  transform: translateX(0);
}
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}
.drawer-header h2 {
  font-size: 26px;
}
.drawer-nav {
  display: grid;
  gap: 8px;
}
.drawer-link {
  width: 100%;
  text-align: left;
  background: transparent;
  color: #374151;
  border-radius: 16px;
  padding: 14px 14px;
  font-size: 16px;
  font-weight: 900;
}
.drawer-link.active {
  background: var(--blue-soft);
  color: var(--blue);
}
.drawer-link:active {
  transform: scale(.99);
}
.tabs {
  display: none !important;
}

.badge.repeat {
  background: #e0f2fe;
  color: #0369a1;
}
.badge.overdue {
  background: #fee2e2;
  color: #b91c1c;
}
.badge.soon {
  background: #ffedd5;
  color: #c2410c;
}
