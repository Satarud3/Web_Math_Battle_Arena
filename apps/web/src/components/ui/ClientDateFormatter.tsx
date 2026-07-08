"use client";

import React, { useState, useEffect } from "react";

interface ClientDateFormatterProps {
  dateString: string | Date;
  options?: Intl.DateTimeFormatOptions;
}

export default function ClientDateFormatter({
  dateString,
  options = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
}: ClientDateFormatterProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return empty fallback placeholder to match initial SSR string perfectly
    return <span className="opacity-0">...</span>;
  }

  try {
    const formatted = new Date(dateString).toLocaleDateString("id-ID", options);
    return <span>{formatted}</span>;
  } catch (e) {
    return <span>{String(dateString)}</span>;
  }
}
