import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFeedRecientes, getFeedDestacados, getMyReactionsForPosts } from "@/lib/social/queries";
import { getMyProfile } from "@/lib/users/queries";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { WallFeed } from "@/components/features/WallFeed";
import type { AuthorRow, FeedPost } from "@/lib/social/types";
import type { UserLevel } from "@/types/domain";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function MuroPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { tab: tabParam } = await searchParams;
  const activeTab: "recientes" | "destacados" =
    tabParam === "destacados" ? "destacados" : "recientes";

  const [rawPosts, profile] = await Promise.all([
    activeTab === "destacados"
      ? getFeedDestacados(30)
      : getFeedRecientes({ limit: 30 }),
    getMyProfile(),
  ]);

  const postIds = rawPosts.map((p) => p.id);
  const reactedSet =
    postIds.length > 0 ? await getMyReactionsForPosts(postIds) : new Set<string>();

  const posts: FeedPost[] = rawPosts.map((p) => ({
    id: p.id,
    user_id: p.user_id,
    body: p.body ?? "",
    image_url: (p as { image_url?: string | null }).image_url ?? null,
    image_width: (p as { image_width?: number | null }).image_width ?? null,
    image_height: (p as { image_height?: number | null }).image_height ?? null,
    reaction_count: p.reaction_count ?? 0,
    comment_count: p.comment_count ?? 0,
    created_at: p.created_at,
    author: (p.author as unknown as AuthorRow | null),
  }));

  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] flex flex-col">
      <ScreenHeader title="Muro" />

      <WallFeed
        initialPosts={posts}
        myUserId={user.id}
        myReactedIds={[...reactedSet]}
        myName={profile?.name ?? "Socio"}
        myInitials={profile?.initials ?? "S"}
        myAvatarUrl={profile?.avatar_url ?? null}
        myLevel={Number(profile?.level ?? 1) as UserLevel}
        activeTab={activeTab}
      />
    </div>
  );
}
