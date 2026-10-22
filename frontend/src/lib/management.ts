import { getToken, publicApiAsset } from "./api";
import type { CardProfile } from "./templates";
export type Folder = {
  userId?: string;
  id: string;
  name: string;
  count: number;
  createdAt: string;
  updatedAt: string;
};
export type Management = {
  cards: CardProfile[];
  folders: Folder[];
  total: number;
  month: number;
};
export const dateLabel = (value?: string) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
export async function cardAsset(id: string, extension = "png") {
  const response = await fetch(
    publicApiAsset(`/api/cards/${id}/qr.${extension}`),
    {
      headers: { Authorization: `Bearer ${getToken()}` },
      credentials: "include",
    },
  );
  if (!response.ok) throw new Error("Unable to load QR code");
  return response.blob();
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
