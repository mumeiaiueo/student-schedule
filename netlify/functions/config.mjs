function env(name) {
  return globalThis.Netlify?.env?.get?.(name) || process.env[name] || "";
}

export default async () => {
  return Response.json({
    vapidPublicKey: env("VAPID_PUBLIC_KEY"),
    pushEnabled: Boolean(env("VAPID_PUBLIC_KEY") && env("VAPID_PRIVATE_KEY"))
  });
};
