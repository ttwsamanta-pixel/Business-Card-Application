"use client";
import { useEffect, useState } from "react";
import { cardAsset } from "@/lib/management";
export function OwnerQr({
  id,
  updatedAt,
}: {
  id?: string;
  updatedAt?: string;
}) {
  const [src, setSrc] = useState(""),
    [error, setError] = useState(false);
  useEffect(() => {
    let active = true,
      url = "";
    setSrc("");
    setError(false);
    if (id)
      cardAsset(id, "svg")
        .then((blob) => {
          url = URL.createObjectURL(blob);
          if (active) setSrc(url);
          else URL.revokeObjectURL(url);
        })
        .catch(() => {
          if (active) setError(true);
        });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, updatedAt]);
  return src ? (
    <img className="qr-thumb" src={src} alt="Card QR code" />
  ) : (
    <span>{error ? "QR unavailable" : "Loading QR..."}</span>
  );
}
