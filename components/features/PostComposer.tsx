"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createPost } from "@/lib/social/actions";
import { AchievementModal, type UnlockedAchievement } from "@/components/features/AchievementModal";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { FeedPost } from "@/lib/social/types";
import type { UserLevel } from "@/types/domain";

interface PostComposerProps {
  myUserId: string;
  myName: string;
  myInitials: string;
  myAvatarUrl: string | null;
  myLevel: UserLevel;
  /** Solo el admin puede adjuntar imágenes (fotos de premios). */
  isAdmin?: boolean;
  onPost: (post: FeedPost) => void;
}

export function PostComposer({
  myUserId,
  myName,
  myInitials,
  myAvatarUrl,
  myLevel,
  isAdmin = false,
  onPost,
}: PostComposerProps) {
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [achievements, setAchievements] = useState<UnlockedAchievement[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "error", message: "La imagen no puede superar los 5 MB" });
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast({ variant: "error", message: "Solo se aceptan imágenes JPG, PNG o WebP" });
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed || loading) return;
    setLoading(true);

    try {
      let imageUrl: string | undefined;
      let imageWidth: number | undefined;
      let imageHeight: number | undefined;

      if (isAdmin && imageFile && imagePreview) {
        const supabase = createClient();
        const ext = imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${myUserId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, imageFile, { cacheControl: "3600", upsert: false });

        if (uploadError) throw uploadError;

        imageUrl = supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;

        // Read dimensions from preview
        const dims = await new Promise<{ w: number; h: number }>((resolve) => {
          const img = document.createElement("img");
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.src = imagePreview;
        });
        imageWidth = dims.w;
        imageHeight = dims.h;
      }

      const { post: saved, unlockedAchievements } = await createPost({
        body: trimmed,
        imageUrl,
        imageWidth,
        imageHeight,
      });

      onPost({
        id: saved.id,
        user_id: saved.user_id,
        body: saved.body ?? "",
        image_url: saved.image_url ?? null,
        image_width: saved.image_width ?? null,
        image_height: saved.image_height ?? null,
        reaction_count: saved.reaction_count ?? 0,
        comment_count: saved.comment_count ?? 0,
        created_at: saved.created_at,
        author: {
          id: myUserId,
          name: myName,
          initials: myInitials,
          avatar_url: myAvatarUrl,
          level: String(myLevel),
        },
      });

      if (unlockedAchievements.length > 0) {
        setAchievements(unlockedAchievements);
      }

      setBody("");
      removeImage();
    } catch {
      toast({ variant: "error", message: "No se pudo publicar. Intentá de nuevo." });
    } finally {
      setLoading(false);
    }
  }

  const charCount = body.length;
  const isValid = charCount > 0 && charCount <= 280;

  return (
    <>
    {achievements.length > 0 && (
      <AchievementModal
        achievements={achievements}
        userId={myUserId}
        onClose={() => setAchievements([])}
      />
    )}
    <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3">
      <div className="flex gap-3">
        <Avatar
          name={myName}
          initials={myInitials}
          avatarUrl={myAvatarUrl}
          size="sm"
          levelBadge={myLevel}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="¿Qué pensás del partido?"
          maxLength={280}
          rows={3}
          disabled={loading}
          className="flex-1 bg-transparent text-body-sm text-text placeholder:text-text-muted resize-none outline-none"
        />
      </div>

      {/* Image preview (solo admin) */}
      {isAdmin && imagePreview && (
        <div className="relative rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Vista previa"
            className="w-full max-h-48 object-cover"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5"
            aria-label="Quitar imagen"
          >
            <Icon name="close" size={12} className="text-white" />
          </button>
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div className="flex items-center gap-1">
          {isAdmin && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || imagePreview !== null}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors",
                  "text-text-muted hover:text-primary hover:bg-primary/5",
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
                aria-label="Adjuntar imagen"
              >
                <Icon name="download" size={14} />
                Foto
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-[11px]",
              charCount > 260 ? "text-warning" : "text-text-muted"
            )}
          >
            {charCount}/280
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!isValid}
            loading={loading}
          >
            Publicar
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
