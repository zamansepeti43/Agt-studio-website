self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}

  const title = data.title || "AGT Studio";
  const options = {
    body: data.body || "Yeni AGT Studio bildirimi.",
    icon: "/pwa-192.png",
    badge: "/pwa-192.png",
    tag: data.tag || "agt-studio",
    data: data.data || { url: "/admin/pinterest" },
    actions: data.actions || [],
    requireInteraction: Boolean(data.actions?.length),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const target = event.action === "approve"
    ? event.notification.data?.url
    : (event.notification.data?.url || "/admin/pinterest");

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
      return undefined;
    })
  );
});
