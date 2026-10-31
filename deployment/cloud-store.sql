-- Server-only bridge. The SHA-256 of a random capability is provisioned separately,
-- never committed. Browser publishable keys alone cannot access any game state.
create schema if not exists tred_private;
revoke all on schema tred_private from public, anon, authenticated;
create table if not exists tred_private.store (
 id integer primary key check(id=1), revision bigint not null default 0,
 state jsonb, capability_hash text not null
);
create table if not exists tred_private.presence (
 user_id text primary key, data jsonb not null, touched_at timestamptz not null default now()
);
create table if not exists tred_private.login_limits (
 key text primary key, window_at timestamptz not null default now(), attempts integer not null default 0
);
alter table tred_private.store enable row level security;
alter table tred_private.presence enable row level security;
alter table tred_private.login_limits enable row level security;
revoke all on all tables in schema tred_private from public, anon, authenticated;
create or replace function tred_private.tred_cloud_bridge(capability text, operation text, payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; changed integer; tries integer;
begin
 if capability is null or length(capability)<40 or not exists (
  select 1 from tred_private.store where id=1 and capability_hash=encode(sha256(convert_to(capability,'UTF8')),'hex')
 ) then raise exception 'Unauthorized' using errcode='42501'; end if;
 if operation='read' then
  select jsonb_build_object('revision',revision,'state',state) into result from tred_private.store where id=1;
 elsif operation='commit' then
  if jsonb_typeof(payload->'state') <> 'object' then raise exception 'Invalid state'; end if;
  update tred_private.store set state=payload->'state',revision=revision+1 where id=1 and revision=(payload->>'revision')::bigint;
  get diagnostics changed=row_count; result=jsonb_build_object('committed',changed=1);
 elsif operation='presence' then
  insert into tred_private.presence(user_id,data,touched_at) values(payload->>'id',payload,now())
  on conflict(user_id) do update set data=excluded.data,touched_at=excluded.touched_at;
  result='{"ok":true}'::jsonb;
 elsif operation='offline' then
  delete from tred_private.presence where user_id=payload->>'id'; result='{"ok":true}'::jsonb;
 elsif operation='world' then
  select coalesce(jsonb_agg(data),'[]'::jsonb) into result from tred_private.presence where touched_at>now()-interval '15 seconds';
 elsif operation='login_limit' then
  insert into tred_private.login_limits(key,attempts) values(payload->>'key',1)
  on conflict(key) do update set attempts=case when tred_private.login_limits.window_at<now()-interval '1 minute' then 1 else tred_private.login_limits.attempts+1 end,
  window_at=case when tred_private.login_limits.window_at<now()-interval '1 minute' then now() else tred_private.login_limits.window_at end
  returning attempts into tries;
  result=jsonb_build_object('allowed',tries<=20);
 else raise exception 'Unknown operation'; end if;
 return result;
end;
$$;
revoke all on function tred_private.tred_cloud_bridge(text,text,jsonb) from public, anon, authenticated;
grant execute on function tred_private.tred_cloud_bridge(text,text,jsonb) to anon;
-- SECURITY DEFINER is intentional: this scoped server capability is checked before
-- all access. User-level auth/RBAC is handled by the game server, not Supabase Auth.

grant usage on schema tred_private to anon;
create or replace function public.tred_cloud_bridge(capability text, operation text, payload jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path=''
as $$ select tred_private.tred_cloud_bridge(capability,operation,payload); $$;
revoke all on function public.tred_cloud_bridge(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.tred_cloud_bridge(text,text,jsonb) to anon;
create policy deny_direct_access on tred_private.store for all to anon,authenticated using(false) with check(false);
create policy deny_direct_access on tred_private.presence for all to anon,authenticated using(false) with check(false);
create policy deny_direct_access on tred_private.login_limits for all to anon,authenticated using(false) with check(false);
