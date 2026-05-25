export type AuthorRow = {
  id: string;
  name: string;
  initials: string;
  avatar_url: string | null;
  level: string;
};

export type FeedPost = {
  id: string;
  user_id: string;
  body: string;
  image_url: string | null;
  image_width: number | null;
  image_height: number | null;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  author: AuthorRow | null;
};

export type DbComment = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  reaction_count: number;
  created_at: string;
  author: AuthorRow | null;
};
