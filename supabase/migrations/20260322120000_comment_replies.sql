-- Threaded comment replies (X-style): optional parent_comment_id on comments
alter table public.comments
  add column if not exists parent_comment_id uuid references public.comments (id) on delete cascade;

create index if not exists idx_comments_parent_comment_id on public.comments (parent_comment_id)
  where parent_comment_id is not null;

create index if not exists idx_comments_post_parent on public.comments (post_id, parent_comment_id);

-- Ensure reply targets a comment on the same post
create or replace function public.check_comment_parent_same_post()
returns trigger
language plpgsql
as $$
begin
  if new.parent_comment_id is null then
    return new;
  end if;
  if not exists (
    select 1 from public.comments p
    where p.id = new.parent_comment_id and p.post_id = new.post_id
  ) then
    raise exception 'parent_comment_id must reference a comment on the same post';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_comment_parent_same_post on public.comments;
create trigger trg_comment_parent_same_post
  before insert or update of parent_comment_id, post_id on public.comments
  for each row execute procedure public.check_comment_parent_same_post();

-- Replies: notify parent comment author; top-level comments: notify post owner
create or replace function public.handle_new_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_user_id uuid;
  v_actor_id uuid;
  v_type text;
  v_entity_id uuid;
begin
  if (tg_table_name = 'likes') then
    v_type := 'like';
    v_actor_id := new.user_id;
    v_entity_id := new.post_id;
    select user_id into v_target_user_id from public.posts where id = new.post_id;

  elsif (tg_table_name = 'comments') then
    v_type := 'comment';
    v_actor_id := new.user_id;
    v_entity_id := new.post_id;
    if new.parent_comment_id is not null then
      select user_id into v_target_user_id from public.comments where id = new.parent_comment_id;
    else
      select user_id into v_target_user_id from public.posts where id = new.post_id;
    end if;

  elsif (tg_table_name = 'follows') then
    v_type := 'follow';
    v_actor_id := new.follower_id;
    v_entity_id := null;
    v_target_user_id := new.following_id;
  end if;

  if v_target_user_id is not null and v_target_user_id != v_actor_id then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (v_target_user_id, v_actor_id, v_type, v_entity_id);
  end if;

  return new;
end;
$$;
