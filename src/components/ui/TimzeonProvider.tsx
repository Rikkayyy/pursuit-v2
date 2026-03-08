"use client";

import { useEffect } from "react";

export default function TimezoneProvider() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const current = document.cookie
      .split("; ")
      .find((c) => c.startsWith("user_timezone="));

    if (!current || !current.includes(tz)) {
      document.cookie = `user_timezone=${tz}; path=/; max-age=31536000`;
    }
  }, []);

  return null;
}