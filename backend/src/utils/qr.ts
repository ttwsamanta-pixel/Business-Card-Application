import QRCode from "qrcode";

export function qrPngDataUrl(value: string) {
  return QRCode.toDataURL(value, { margin: 1, width: 640, errorCorrectionLevel: "M" });
}

export function qrSvg(value: string) {
  return QRCode.toString(value, { type: "svg", margin: 1, width: 640, errorCorrectionLevel: "M" });
}
