export type BenyuanShellCapability = "share" | "openExternal" | "pickImages";
export type BenyuanNativeImageSource = "library" | "camera";

export type BenyuanShellInfo = {
  platform?: string;
  version?: string;
  bridge?: string[];
};

export type BenyuanNativeSharePayload = {
  title?: string;
  text?: string;
  url?: string;
};

export type BenyuanNativePickImagesPayload = {
  maxCount?: number;
  questionId?: string;
  source?: BenyuanNativeImageSource;
};

export type BenyuanNativePickedAsset = {
  name: string;
  mimeType: string;
  dataUrl: string;
  size?: number;
  width?: number;
  height?: number;
};

export type BenyuanNativePickImagesResult = {
  cancelled?: boolean;
  assets?: BenyuanNativePickedAsset[];
};

type BenyuanNativeShellApi = {
  share?: (payload: BenyuanNativeSharePayload) => void;
  openExternal?: (url: string) => void;
  pickImages?: (payload: BenyuanNativePickImagesPayload) => Promise<BenyuanNativePickImagesResult>;
};

declare global {
  interface Window {
    __BENYUAN_SHELL_INFO__?: BenyuanShellInfo;
    BenyuanNativeShell?: BenyuanNativeShellApi;
  }
}

function isClient() {
  return typeof window !== "undefined";
}

export function getBenyuanShellInfo(): BenyuanShellInfo | null {
  if (!isClient()) return null;
  return window.__BENYUAN_SHELL_INFO__ ?? null;
}

export function hasBenyuanNativeCapability(capability: BenyuanShellCapability) {
  const info = getBenyuanShellInfo();
  return Boolean(info?.bridge?.includes(capability));
}

function buildShareFallbackText(payload: BenyuanNativeSharePayload) {
  return [payload.title, payload.text, payload.url].filter(Boolean).join("\n\n");
}

export async function shareWithBenyuanNativeShell(payload: BenyuanNativeSharePayload): Promise<"native" | "web" | "clipboard"> {
  if (!isClient()) throw new Error("client_only");

  if (hasBenyuanNativeCapability("share") && typeof window.BenyuanNativeShell?.share === "function") {
    window.BenyuanNativeShell.share(payload);
    return "native";
  }

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    await navigator.share(payload);
    return "web";
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(buildShareFallbackText(payload));
    return "clipboard";
  }

  throw new Error("share_unavailable");
}

export function resolveBenyuanHref(url: string) {
  if (!isClient()) return url;
  return new URL(url, window.location.origin).href;
}

export function openWithBenyuanNativeShell(url: string): "native" | "browser" {
  if (!isClient()) throw new Error("client_only");

  const resolvedUrl = resolveBenyuanHref(url);
  if (hasBenyuanNativeCapability("openExternal") && typeof window.BenyuanNativeShell?.openExternal === "function") {
    window.BenyuanNativeShell.openExternal(resolvedUrl);
    return "native";
  }

  window.open(resolvedUrl, "_blank", "noopener,noreferrer");
  return "browser";
}

function dataUrlToFile(asset: BenyuanNativePickedAsset) {
  const [meta, base64 = ""] = asset.dataUrl.split(",", 2);
  const mimeMatch = /^data:(.*?);base64$/.exec(meta);
  const mimeType = asset.mimeType || mimeMatch?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], asset.name, {
    type: mimeType,
    lastModified: Date.now(),
  });
}

export async function pickImagesWithBenyuanNativeShell(payload: BenyuanNativePickImagesPayload): Promise<File[]> {
  if (!isClient()) throw new Error("client_only");

  if (!hasBenyuanNativeCapability("pickImages") || typeof window.BenyuanNativeShell?.pickImages !== "function") {
    throw new Error("native_picker_unavailable");
  }

  const result = await window.BenyuanNativeShell.pickImages(payload);
  const assets = result.assets ?? [];
  if (result.cancelled || assets.length === 0) {
    return [];
  }

  return assets.map((asset) => dataUrlToFile(asset));
}
