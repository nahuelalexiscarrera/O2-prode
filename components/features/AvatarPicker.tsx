"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { BottomSheet } from "@/components/ui/Modal";
import { updateAvatar } from "@/lib/users/avatar-actions";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";

interface AvatarPickerProps {
  currentAvatarUrl?: string | null;
  open: boolean;
  onClose: () => void;
}

const AVATAR_URLS = [
  "/avatares_O2/screen.webp",
  "/avatares_O2/screen 2.webp",
  "/avatares_O2/screen 3.webp",
  "/avatares_O2/screen 4.webp",
  "/avatares_O2/screen 5.webp",
  "/avatares_O2/screen 6.webp",
  "/avatares_O2/screen 7.webp",
  "/avatares_O2/screen 8.webp",
  "/avatares_O2/screen 9.webp",
  "/avatares_O2/screen 10.webp",
  "/avatares_O2/screen 11.webp",
  "/avatares_O2/screen 12.webp",
  "/avatares_O2/screen 13.webp",
  "/avatares_O2/screen 14.webp",
  "/avatares_O2/screen 15.webp",
  "/avatares_O2/screen 16.webp",
  "/avatares_O2/screen 17.webp",
  "/avatares_O2/screen 18.webp",
  "/avatares_O2/screen 19.webp",
  "/avatares_O2/screen 20.webp",
  "/avatares_O2/screen 21.webp",
  "/avatares_O2/screen 22.webp"
];

export function AvatarPicker({ currentAvatarUrl, open, onClose }: AvatarPickerProps) {
  const initialSelection = currentAvatarUrl?.startsWith("/avatares_O2/") 
    ? currentAvatarUrl 
    : AVATAR_URLS[0];
    
  const [selectedUrl, setSelectedUrl] = useState(initialSelection);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  async function handleSave() {
    if (!selectedUrl) return;
    
    startTransition(async () => {
      const result = await updateAvatar(selectedUrl);
      if (result && "error" in result) {
        toast({ variant: "error", message: String(result.error) });
      } else {
        toast({ variant: "success", message: "Avatar guardado" });
        onClose();
      }
    });
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Elegí tu avatar">
      <div className="flex flex-col px-4 pb-6 pt-2">
        <div className="mb-6 max-h-[50vh] overflow-y-auto pr-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3 block">
            Personaje
          </span>
          <div className="grid grid-cols-4 gap-3">
            {AVATAR_URLS.map((url, i) => {
              const selected = selectedUrl === url;
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => setSelectedUrl(url)}
                  className={cn(
                    "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all",
                    selected ? "border-primary scale-[1.02] shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                  aria-label={`Avatar ${i + 1}`}
                >
                  <Image src={url} alt={`Avatar ${i + 1}`} fill className="object-cover" />
                </button>
              );
            })}
          </div>
        </div>

        <Button onClick={handleSave} disabled={isPending} className="w-full" size="lg">
          {isPending ? "Guardando..." : "Guardar avatar"}
        </Button>
      </div>
    </BottomSheet>
  );
}
