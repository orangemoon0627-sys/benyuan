"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GlassPanel, MetaPill, PrimaryButton, SecondaryButton, SectionTitle } from "@/components/framework-primitives";
import { getBenyuanShellInfo, hasBenyuanNativeCapability, pickImagesWithBenyuanNativeShell, type BenyuanNativeImageSource, type BenyuanShellInfo } from "@/lib/benyuan-native-shell";
import type { BenyuanUploadedAssetRef } from "@/lib/benyuan-v3-types";

async function uploadNativePickedFiles(files: File[], source: BenyuanNativeImageSource) {
  const formData = new FormData();
  formData.append("question_id", "A2_music_analysis");
  formData.append("upload_origin", source === "camera" ? "native-camera" : "native-library");
  files.forEach((file) => formData.append("files", file));

  const response = await fetch("/api/part1/upload", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as { assets?: BenyuanUploadedAssetRef[]; error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "native_smoke_upload_failed");
  }

  return payload.assets ?? [];
}

export function NativeHandoffSmoke() {
  const searchParams = useSearchParams();
  const [shellInfo] = useState<BenyuanShellInfo | null>(() => getBenyuanShellInfo());
  const [status, setStatus] = useState("等待触发 native smoke...");
  const [pickedFiles, setPickedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadedAssets, setUploadedAssets] = useState<BenyuanUploadedAssetRef[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autorunRef = useRef(false);

  const canPick = useMemo(() => hasBenyuanNativeCapability("pickImages"), []);

  useEffect(() => {
    const nextPreviewUrls = pickedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(nextPreviewUrls);
    return () => {
      nextPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pickedFiles]);

  async function runSmoke(source: BenyuanNativeImageSource) {
    setRunning(true);
    setError(null);
    setUploadedAssets([]);
    setPickedFiles([]);
    setStatus(source === "camera" ? "正在请求原生相机..." : "正在请求原生相册...");

    try {
      const files = await pickImagesWithBenyuanNativeShell({
        questionId: "A2_music_analysis",
        maxCount: source === "camera" ? 1 : 2,
        source,
      });

      if (files.length === 0) {
        setStatus("native picker 已取消，没有发生上传。");
        return;
      }

      setPickedFiles(files);
      setStatus(`原生侧返回 ${files.length} 个文件，正在走 /api/part1/upload ...`);
      const assets = await uploadNativePickedFiles(files, source);
      setUploadedAssets(assets);
      setStatus(`上传成功：${assets.length} 个资产已经写入 Benyuan store。`);
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : "native_smoke_failed";
      setError(message);
      setStatus("native smoke 失败");
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    const autorun = searchParams.get("autorun") === "1";
    const source = searchParams.get("source") === "camera" ? "camera" : "library";
    if (!autorun || autorunRef.current) return;
    autorunRef.current = true;
    void runSmoke(source);
  }, [searchParams]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10 md:px-10">
      <GlassPanel>
        <SectionTitle label="Native Handoff Smoke" title="模拟器 / 壳级原生上传验证" description="这个页面专门用来验证 iOS shell 的 native pick -> web upload -> /api/part1/upload 往返链路。" />
        <div className="flex flex-wrap gap-2">
          <MetaPill>{shellInfo?.platform ?? "web"}</MetaPill>
          <MetaPill>{shellInfo?.version ?? "no-version"}</MetaPill>
          <MetaPill>{canPick ? "pickImages enabled" : "pickImages missing"}</MetaPill>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <PrimaryButton type="button" onClick={() => void runSmoke("library")} disabled={running || !canPick} className="min-h-11 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50">
            相册 smoke
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => void runSmoke("camera")} disabled={running || !canPick} className="min-h-11 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50">
            拍照 smoke
          </SecondaryButton>
        </div>
        <p className="mt-5 text-sm leading-7 text-[var(--text-secondary)]">{status}</p>
        {error ? <p className="mt-3 text-sm leading-7 text-red-300">{error}</p> : null}
      </GlassPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <GlassPanel>
          <SectionTitle label="Picked Files" title="原生侧回传" description="这里展示 native bridge 直接返回给网页的文件。" />
          <div className="space-y-4">
            {pickedFiles.length > 0 ? (
              pickedFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="border border-[var(--border)] p-4">
                  <div className="flex items-start gap-4">
                    {previewUrls[index] ? <Image src={previewUrls[index]} alt={file.name} width={80} height={80} unoptimized className="h-20 w-20 border border-[var(--border)] object-cover" /> : <div className="flex h-20 w-20 items-center justify-center border border-[var(--border)] text-xs text-[var(--text-tertiary)]">PREVIEW</div>}
                    <div>
                      <p className="text-sm text-[var(--text-primary)]">{file.name}</p>
                      <p className="mt-2 text-xs text-[var(--text-tertiary)]">{file.type} · {Math.round(file.size / 1024)} KB</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="border border-[var(--border)] p-4 text-sm text-[var(--text-tertiary)]">还没有来自原生 bridge 的文件。</div>
            )}
          </div>
        </GlassPanel>

        <GlassPanel>
          <SectionTitle label="Uploaded Assets" title="服务端入库结果" description="这里展示 /api/part1/upload 返回的资产引用，说明链路已经真的回到 Benyuan store。" />
          <div className="space-y-4">
            {uploadedAssets.length > 0 ? (
              uploadedAssets.map((asset) => (
                <div key={asset.asset_id} className="border border-[var(--border)] p-4">
                  <div className="flex items-start gap-4">
                    <Image src={`/api/part1/uploaded/${asset.asset_id}`} alt={asset.name} width={80} height={80} unoptimized className="h-20 w-20 border border-[var(--border)] object-cover" />
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <MetaPill>{asset.upload_origin ?? "native"}</MetaPill>
                        <MetaPill>{asset.mime_type}</MetaPill>
                      </div>
                      <p className="mt-3 text-sm text-[var(--text-primary)]">{asset.name}</p>
                      <p className="mt-2 text-xs text-[var(--text-tertiary)]">{asset.asset_id}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="border border-[var(--border)] p-4 text-sm text-[var(--text-tertiary)]">还没有上传结果。</div>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
