import { getStore } from "@netlify/blobs";

function jsonResponse(data, status = 200) {
  return Response.json(data, { status });
}

export default async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const payload = await req.json().catch(() => null);
  if (!payload?.deviceId || !payload?.subscription) {
    return jsonResponse({ error: "deviceId and subscription are required" }, 400);
  }

  const store = getStore({ name: "schedule-devices", consistency: "strong" });
  const key = `devices/${payload.deviceId}`;

  const old = await store.get(key, { type: "json", consistency: "strong" });
  const data = {
    deviceId: payload.deviceId,
    subscription: payload.subscription,
    items: Array.isArray(payload.items) ? payload.items : [],
    settings: payload.settings || {},
    timeZone: payload.timeZone || "Asia/Tokyo",
    notified: old?.notified || {},
    createdAt: old?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await store.setJSON(key, data);
  return jsonResponse({ ok: true, saved: data.items.length });
};
