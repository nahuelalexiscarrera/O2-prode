"use client";

import { useState } from "react";
import Image from "next/image";
import { BottomSheet } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { shareToWall } from "@/lib/share/actions";
import { cn } from "@/lib/utils/cn";
import type { ShareTemplateId, ShareFormat } from "@/lib/share/templates";

const WALL_BODY: Record<ShareTemplateId, string> = {
  position: "Mi posición en el PRODE MUNDIAL O2",
  match: "Mi predicción para el Mundial",
  achievement: "Desbloqueé un logro en el prode",
  summary: "Mi resumen del Mundial",
};

interface ShareButtonProps {
  template: ShareTemplateId;
  userId: string;
  contextId?: string;
  label?: string;
  className?: string;
}

export function ShareButton({
  template,
  userId,
  contextId,
  label = "Compartir",
  className,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ShareFormat>("story");
  const [downloading, setDownloading] = useState(false);
  const [posting, setPosting] = useState(false);
  const { toast } = useToast();

  async function handlePostToWall() {
    setPosting(true);
    const res = await shareToWall({ template, contextId, body: WALL_BODY[template] });
    setPosting(false);
    if (res.ok) {
      toast({ variant: "success", message: "¡Publicado en el muro!" });
      setOpen(false);
    } else {
      toast({ variant: "error", message: res.error });
    }
  }

  const params = new URLSearchParams({ format });
  if (contextId) params.set("contextId", contextId);
  const imageUrl = `/api/share/${template}/${userId}?${params.toString()}`;

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error("Error al generar imagen");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `o2-prode-${template}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ variant: "success", message: "¡Imagen guardada!" });
    } catch {
      toast({ variant: "error", message: "No se pudo descargar la imagen" });
    } finally {
      setDownloading(false);
    }
  }

  async function handleNativeShare() {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], `o2-prode-${template}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Mi prode del Mundial 2026",
          text: "#PRODEMUNDIALO2",
        });
      } else {
        // Fallback: download
        await handleDownload();
      }
    } catch (e) {
      if ((e as DOMException).name !== "AbortError") {
        toast({ variant: "error", message: "No se pudo compartir" });
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 px-4 h-10 rounded-full",
          "bg-primary/10 text-primary text-body-sm font-semibold",
          "hover:bg-primary/20 transition-colors",
          className
        )}
      >
        <Icon name="share" size={16} />
        {label}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Compartir mi prode">
        <div className="flex flex-col gap-6 px-4 pt-2 pb-8">
          {/* Format toggle */}
          <div className="flex gap-2">
            {(["story", "square"] as ShareFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={cn(
                  "flex-1 h-9 rounded-xl text-body-sm font-semibold transition-colors",
                  format === f
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:text-text"
                )}
              >
                {f === "story" ? "Historia (9:16)" : "Cuadrado (1:1)"}
              </button>
            ))}
          </div>

          {/* Image preview */}
          <div
            className={cn(
              "relative bg-elevated rounded-xl overflow-hidden self-center",
              format === "story" ? "w-48 aspect-[9/16]" : "w-48 aspect-square"
            )}
          >
            <Image
              src={imageUrl}
              alt="Vista previa de la imagen a compartir"
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button fullWidth onClick={handleNativeShare} leftIcon="share">
              Compartir
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={handleDownload}
              loading={downloading}
              leftIcon="download"
            >
              Descargar imagen
            </Button>
            <Button
              fullWidth
              variant="ghost"
              onClick={handlePostToWall}
              loading={posting}
              leftIcon="comment"
            >
              Publicar en el muro
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
