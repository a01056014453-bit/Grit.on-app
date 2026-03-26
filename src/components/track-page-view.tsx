"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

/** 페이지 이동 시 자동으로 page_view + 첫 로드 시 app_open 트래킹 */
export function TrackPageView() {
  const pathname = usePathname();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // 첫 로드: app_open
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      trackEvent({ event: "app_open", properties: { path: pathname } });
    }

    // 모든 페이지 이동: page_view
    trackEvent({ event: "page_view", properties: { path: pathname } });
  }, [pathname]);

  return null;
}
