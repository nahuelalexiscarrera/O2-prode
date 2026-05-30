import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostDetail, getMyReactionsForPosts, getMyReactionsForComments } from "@/lib/social/queries";
import { timeAgo } from "@/lib/social/feed";
import { ScreenHeader } from "@/components/features/ScreenHeader";
import { PostCardFull } from "@/components/features/PostCardFull";
import { CommentThread } from "@/components/features/CommentThread";
import { cn } from "@/lib/utils/cn";
import type { AuthorRow, DbComment } from "@/lib/social/types";
import type { UserLevel } from "@/types/domain";

interface Props {
  params: Promise<{ postId: string }>;
}

export default async function PostDetailPage({ params }: Props) {
  const { postId } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");
  const user = data.user;

  const { post, comments: rawComments } = await getPostDetail(postId);

  const postRow = post as typeof post & { deleted_at?: string | null };
  if (!postRow || postRow.deleted_at) notFound();

  const commentIds = rawComments.map((c) => c.id);
  const [postReacted, commentReacted] = await Promise.all([
    getMyReactionsForPosts([postId]),
    getMyReactionsForComments(commentIds),
  ]);

  const now = new Date();
  const postAuthor = postRow.author as unknown as AuthorRow | null;

  const comments: DbComment[] = rawComments.map((c) => ({
    id: c.id,
    post_id: c.post_id,
    user_id: c.user_id,
    body: c.body ?? "",
    reaction_count: c.reaction_count ?? 0,
    created_at: c.created_at,
    author: (c.author as unknown as AuthorRow | null),
  }));

  return (
    <div
      className={cn(
        "min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))]",
        "flex flex-col"
      )}
    >
      <ScreenHeader title="Publicación" backHref="/app/muro" />

      <div className="flex flex-col gap-4 px-4 pt-2">
        <PostCardFull
          postId={postRow.id}
          authorId={postAuthor?.id ?? ""}
          authorName={postAuthor?.name ?? "Socio"}
          authorInitials={postAuthor?.initials ?? "S"}
          authorAvatarUrl={postAuthor?.avatar_url ?? null}
          authorLevel={Number(postAuthor?.level ?? 1) as UserLevel}
          body={(postRow.body as string | null) ?? ""}
          imageUrl={(postRow as { image_url?: string | null }).image_url ?? null}
          imageWidth={(postRow as { image_width?: number | null }).image_width ?? null}
          imageHeight={(postRow as { image_height?: number | null }).image_height ?? null}
          reactionCount={postRow.reaction_count ?? 0}
          commentCount={postRow.comment_count ?? 0}
          myReacted={postReacted.has(postId)}
          myUserId={user.id}
          timeAgo={timeAgo(postRow.created_at, now)}
          isDetailView
        />

        <CommentThread
          postId={postId}
          initialComments={comments}
          commentReactedIds={[...commentReacted]}
          myUserId={user.id}
        />
      </div>
    </div>
  );
}
