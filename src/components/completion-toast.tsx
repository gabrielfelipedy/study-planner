"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

type CompletionToastProps = {
  message: string;
  duration?: number;
  toastKey: string | null;
};

export function CompletionToast({
  message,
  duration = 2500,
  toastKey,
}: CompletionToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toastKey) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [toastKey, duration]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-all animate-in slide-in-from-right"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
