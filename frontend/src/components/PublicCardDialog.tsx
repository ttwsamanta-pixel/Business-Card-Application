"use client";

import { useEffect, useRef } from "react";

export function PublicCardDialog({ children, label, onClose, className = "" }: {
  children: React.ReactNode;
  label: string;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return <dialog ref={ref} aria-label={label} className={`public-card-dialog ${className}`} onCancel={(event) => {
    event.preventDefault();
    onClose();
  }}>{children}</dialog>;
}
