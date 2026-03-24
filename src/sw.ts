import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// ─── 웹 푸시 알림 ───

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const { title, body, icon, url } = data;

    const options: NotificationOptions & { vibrate?: number[] } = {
      body: body || "",
      icon: icon || "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      data: { url: url || "/" },
    };

    event.waitUntil(
      self.registration.showNotification(title || "Sempre", options),
    );
  } catch {
    // JSON 파싱 실패 시 텍스트로 표시
    const text = event.data?.text() ?? "";
    event.waitUntil(
      self.registration.showNotification("Sempre", { body: text }),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // 없으면 새 탭 열기
      return self.clients.openWindow(url);
    }),
  );
});
