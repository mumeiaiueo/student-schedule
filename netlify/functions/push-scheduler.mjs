import webpush from "web-push";
import { getStore } from "@netlify/blobs";

function env(name) {
  return globalThis.Netlify?.env?.get?.(name) || process.env[name] || "";
}

function configureWebPush() {
  const publicKey = env("VAPID_PUBLIC_KEY");
  const privateKey = env("VAPID_PRIVATE_KEY");
  const subject = env("VAPID_SUBJECT") || "mailto:your-email@example.com";

  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

function isTask(item) {
  return item.type === "task";
}

function normalizeNotifyMode(mode) {
  if (mode === "strong") return "strong";
  if (mode === "none") return "none";
  return "on";
}

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

function typeLabel(type) {
  return ({ task: "課題", event: "予定", class: "授業", work: "バイト", other: "その他" })[type] || "予定";
}

function humanMinutes(min) {
  if (min >= 1440) return `${min / 1440}日`;
  if (min >= 60) return `${min / 60}時間`;
  return `${min}分`;
}

function dateTimeInTokyoMs(date, time) {
  const [y, m, d] = String(date).split("-").map(Number);
  const [hh, mm] = String(time || "00:00").split(":").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1, (hh || 0) - 9, mm || 0, 0);
}

function todayTokyoDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const v = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return { y: Number(v.year), m: Number(v.month), d: Number(v.day), date: `${v.year}-${v.month}-${v.day}` };
}

function sortItems(items) {
  return items.slice().sort((a, b) => dateTimeInTokyoMs(a.date, a.time) - dateTimeInTokyoMs(b.date, b.time));
}

async function send(subscription, title, body, tag) {
  await webpush.sendNotification(subscription, JSON.stringify({
    title,
    body,
    tag,
    data: { url: "/" }
  }));
}

function dueEntriesForItem(item) {
  const due = dateTimeInTokyoMs(item.date, item.time);
  const plan = getNotificationPlan(item);
  const entries = [];

  for (const min of plan.before) {
    entries.push({
      key: `${item.id}-before-${min}`,
      at: due - min * 60 * 1000,
      title: isTask(item) ? `課題：${item.title}` : `予定：${item.title}`,
      body: min === 0 ? `${typeLabel(item.type)}の時刻です。` : `あと${humanMinutes(min)}です。`
    });
  }

  for (const min of plan.after) {
    entries.push({
      key: `${item.id}-after-${min}`,
      at: due + min * 60 * 1000,
      title: `未完了：${item.title}`,
      body: "まだ完了になっていない課題です。"
    });
  }

  return entries;
}

function dailySummaryEntry(device, now) {
  const settings = device.settings || {};
  if (!settings.dailySummaryEnabled) return null;

  const { y, m, d, date } = todayTokyoDateParts(now);
  const [hh, mm] = String(settings.dailySummaryTime || "08:00").split(":").map(Number);
  const target = Date.UTC(y, m - 1, d, (hh || 8) - 9, mm || 0, 0);
  const nowMs = now.getTime();

  if (nowMs < target || nowMs > target + 60 * 60 * 1000) return null;

  const key = `daily-summary-${date}`;
  const items = (device.items || []).filter(item => !item.done);
  const todayItems = sortItems(items.filter(item => item.date === date));
  const upcomingTasks = sortItems(items.filter(item => isTask(item) && item.date >= date)).slice(0, 3);

  const lines = [];
  lines.push(`今日の予定：${todayItems.length}件`);
  if (todayItems.length) lines.push(todayItems.slice(0, 3).map(item => `・${item.title} ${item.time}`).join("\n"));
  lines.push(`近い課題：${upcomingTasks.length}件`);
  if (upcomingTasks.length) lines.push(upcomingTasks.map(item => `・${item.title} ${item.date}`).join("\n"));

  return { key, at: target, title: "今日のまとめ", body: lines.join("\n") };
}

async function processDevice(store, blobKey, device, now) {
  if (!device?.subscription) return { sent: 0, removed: false };

  const notified = device.notified || {};
  const entries = [];
  const summary = dailySummaryEntry(device, now);
  if (summary) entries.push(summary);

  for (const item of device.items || []) {
    if (item.done) continue;
    entries.push(...dueEntriesForItem(item));
  }

  let sent = 0;
  const nowMs = now.getTime();
  const graceMs = 8 * 60 * 1000;

  for (const entry of entries) {
    if (notified[entry.key]) continue;
    if (nowMs < entry.at || nowMs > entry.at + graceMs) continue;

    try {
      await send(device.subscription, entry.title, entry.body, entry.key);
      notified[entry.key] = new Date().toISOString();
      sent++;
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        device.subscription = null;
        device.disabledAt = new Date().toISOString();
        await store.setJSON(blobKey, { ...device, notified, updatedAt: new Date().toISOString() });
        return { sent, removed: true };
      }
      console.error("Push send failed", error);
    }
  }

  if (sent > 0) {
    await store.setJSON(blobKey, { ...device, notified, updatedAt: new Date().toISOString() });
  }

  return { sent, removed: false };
}

export default async () => {
  configureWebPush();

  const store = getStore({ name: "schedule-devices", consistency: "strong" });
  const now = new Date();
  let devices = 0;
  let sent = 0;
  let removed = 0;

  for await (const page of store.list({ prefix: "devices/", paginate: true })) {
    for (const blob of page.blobs) {
      const device = await store.get(blob.key, { type: "json", consistency: "strong" });
      if (!device) continue;
      devices++;
      const result = await processDevice(store, blob.key, device, now);
      sent += result.sent;
      if (result.removed) removed++;
    }
  }

  console.log(JSON.stringify({ devices, sent, removed, checkedAt: now.toISOString() }));
};

export const config = {
  schedule: "*/5 * * * *"
};
