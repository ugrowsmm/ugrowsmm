-- =====================================================================================
-- UGrowSMM database (Supabase / Postgres)
-- Run ONCE: Supabase dashboard > SQL Editor > New query > paste everything > Run.
-- Safe to run again: it only creates what is missing and replaces the functions.
--
-- Security model: the browser can NOT read or write any table directly (RLS on, no policies, grants revoked).
-- It can only call the functions at the bottom, and each one checks who is logged in (auth.uid()).
-- Money is only ever written by functions: the browser can never give itself balance.
-- =====================================================================================

-- ---------- one email = one account (Gmail dots and +tags are ignored) ----------
create table if not exists public.email_keys (
  canon   text primary key,
  user_id uuid not null
);

create or replace function public.canon_email(e text) returns text
language plpgsql immutable set search_path = public as $$
declare l text; d text;
begin
  e := lower(trim(coalesce(e, '')));
  l := split_part(e, '@', 1);
  d := split_part(e, '@', 2);
  if l = '' or d = '' then return e; end if;
  l := split_part(l, '+', 1);
  if d = 'googlemail.com' then d := 'gmail.com'; end if;
  if d = 'gmail.com' then l := replace(l, '.', ''); end if;
  return l || '@' || d;
end $$;

create or replace function public.guard_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.email_keys(canon, user_id) values (public.canon_email(new.email), new.id);
  return new;
exception when unique_violation then
  raise exception 'email_exists';
end $$;

create or replace function public.release_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.email_keys where user_id = old.id;
  return old;
end $$;

drop trigger if exists ug_guard_email on auth.users;
create trigger ug_guard_email before insert on auth.users
  for each row execute function public.guard_email();
drop trigger if exists ug_release_email on auth.users;
create trigger ug_release_email after delete on auth.users
  for each row execute function public.release_email();

-- ---------- tables ----------
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text not null,
  name             text not null default '',
  code             text not null unique,
  ref_by           text,
  is_admin         boolean not null default false,
  cashback_percent numeric,
  created_at       timestamptz not null default now()
);
-- Pro membership: active while pro_until is in the future. pro_plan: monthly | yearly | admin (free, given by an admin)
alter table public.profiles add column if not exists pro_until timestamptz;
alter table public.profiles add column if not exists pro_plan  text;

-- every rupee that moves. kind: paid (spendable), unpaid (admin demo credit), referral (withdrawable earnings)
create table if not exists public.ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  amount     numeric(12,2) not null,
  kind       text not null check (kind in ('paid','unpaid','referral')),
  type       text not null check (type in ('deposit','order','refund','referral','adjustment','subscription')),
  note       text not null default '',
  ref        text,
  created_at timestamptz not null default now()
);
create unique index if not exists ledger_ref_uq on public.ledger(ref) where ref is not null;
create index if not exists ledger_user_idx on public.ledger(user_id, created_at desc);

create table if not exists public.orders (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  provider_ref text,
  service_id   text not null default '',
  service_name text not null default '',
  platform     text not null default 'instagram',
  link         text not null default '',
  quantity     int  not null default 0,
  charge       numeric(12,2) not null default 0,
  status       text not null default 'Pending' check (status in ('Pending','In progress','Completed','Partial','Canceled')),
  start_count  int  not null default 0,
  remains      int,
  is_demo      boolean not null default false,
  is_bonus     boolean not null default false,
  refunded     boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id, created_at desc);

create table if not exists public.withdrawals (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  amount     numeric(12,2) not null check (amount > 0),
  method     text not null,
  details    text not null,
  status     text not null default 'Processing' check (status in ('Processing','Paid','Rejected')),
  created_at timestamptz not null default now()
);
create index if not exists withdrawals_user_idx on public.withdrawals(user_id, created_at desc);

create table if not exists public.tickets (
  id          text primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null default 'Query',
  order_ref   text not null default '',
  subject     text not null,
  message     text not null,
  status      text not null default 'Open' check (status in ('Open','Resolved')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists tickets_user_idx on public.tickets(user_id, created_at desc);

create table if not exists public.bonus (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  status     text not null default 'ready' check (status in ('ready','claimed')),
  created_at timestamptz not null default now()
);

-- ---------- lock the tables: no direct access from the browser at all ----------
alter table public.email_keys  enable row level security;
alter table public.profiles    enable row level security;
alter table public.ledger      enable row level security;
alter table public.orders      enable row level security;
alter table public.withdrawals enable row level security;
alter table public.tickets     enable row level security;
alter table public.bonus       enable row level security;
revoke all on public.email_keys, public.profiles, public.ledger, public.orders,
              public.withdrawals, public.tickets, public.bonus from anon, authenticated;

-- ---------- new signup => profile with a unique referral code ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare c text; r text;
begin
  loop
    c := 'UG' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.profiles where code = c);
  end loop;
  r := upper(coalesce(new.raw_user_meta_data->>'ref', ''));
  if r = '' or not exists (select 1 from public.profiles where code = r) then r := null; end if;
  insert into public.profiles(id, email, name, code, ref_by)
  values (new.id, public.canon_email(new.email), left(coalesce(new.raw_user_meta_data->>'name', ''), 60), c, r);
  return new;
end $$;

drop trigger if exists ug_new_user on auth.users;
create trigger ug_new_user after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- internal helpers (not callable from the browser) ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.wallet_of(uid uuid)
returns table(paid numeric, unpaid numeric, earned numeric)
language sql stable security definer set search_path = public as $$
  select coalesce(sum(amount) filter (where kind = 'paid'), 0),
         coalesce(sum(amount) filter (where kind = 'unpaid'), 0),
         coalesce(sum(amount) filter (where kind = 'referral'), 0)
  from public.ledger where user_id = uid
$$;

-- Called ONLY by the payment confirmation (server side, later) with the gateway's transaction id as ref_key.
-- Idempotent: the same ref_key can never credit twice. Also pays the referrer and unlocks the welcome bonus.
create or replace function public.credit_deposit(uid uuid, amt numeric, ref_key text) returns void
language plpgsql security definer set search_path = public as $$
declare ref_code text; referrer public.profiles; pct numeric; lid bigint; reward numeric;
begin
  if amt is null or amt <= 0 then raise exception 'bad_amount'; end if;
  insert into public.ledger(user_id, amount, kind, type, note, ref)
  values (uid, round(amt, 2), 'paid', 'deposit', 'Wallet top-up', ref_key)
  on conflict (ref) where ref is not null do nothing
  returning id into lid;
  if lid is null then return; end if;
  select ref_by into ref_code from public.profiles where id = uid;
  if ref_code is not null then
    select * into referrer from public.profiles where code = ref_code;
    if found and referrer.id <> uid then
      -- an admin-set percent wins; otherwise Pro members earn 30% and everyone else 10%
      pct := coalesce(referrer.cashback_percent, case when referrer.pro_until > now() then 30 else 10 end);
      reward := round(amt * pct / 100, 2);
      if reward > 0 then
        insert into public.ledger(user_id, amount, kind, type, note, ref)
        values (referrer.id, reward, 'referral', 'referral', 'Referral reward', 'refr:' || lid);
      end if;
    end if;
    -- the welcome bonus is promised for a top-up of Rs 100 or more (BONUS_MIN_TOPUP in src/lib/data.ts)
    if amt >= 100 then
      insert into public.bonus(user_id) values (uid) on conflict do nothing;
    end if;
  end if;
end $$;

-- ---------- functions the logged-in user can call ----------
create or replace function public.get_account() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); p public.profiles; w record; wd numeric; sp numeric;
begin
  if uid is null then raise exception 'auth'; end if;
  select * into p from public.profiles where id = uid;
  if not found then raise exception 'auth'; end if;
  select * into w from public.wallet_of(uid);
  select coalesce(sum(amount), 0) into wd from public.withdrawals where user_id = uid and status <> 'Rejected';
  -- referral funds already spent on orders (wallet_of().earned is net of these, so add them back for the gross figure)
  select coalesce(-sum(amount), 0) into sp from public.ledger where user_id = uid and kind = 'referral' and type = 'order';
  return jsonb_build_object(
    'profile', jsonb_build_object('email', p.email, 'name', p.name, 'code', p.code, 'refBy', coalesce(p.ref_by, ''), 'isAdmin', p.is_admin),
    'balance', w.paid,
    'unpaid', w.unpaid,
    'referral', jsonb_build_object('earned', w.earned + sp, 'withdrawn', wd, 'spent', sp),
    'percent', coalesce(p.cashback_percent, case when p.pro_until > now() then 30 else 10 end),
    'pro', jsonb_build_object('active', coalesce(p.pro_until > now(), false), 'until', coalesce(p.pro_until::text, ''), 'plan', coalesce(p.pro_plan, '')),
    'orders', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id::text, 'serviceId', o.service_id, 'serviceName', o.service_name, 'platform', o.platform,
        'link', regexp_replace(regexp_replace(o.link, '^https?://', ''), '/$', ''),
        'quantity', o.quantity, 'charge', o.charge, 'startCount', o.start_count, 'status', o.status,
        'progress', case o.status when 'Completed' then 100 when 'Pending' then 0 else
          greatest(case when o.status = 'In progress' then 3 else 0 end,
                   least(100, coalesce(round(((o.quantity - coalesce(o.remains, o.quantity))::numeric / nullif(o.quantity, 0)) * 100), 0)::int)) end,
        'createdAt', o.created_at, 'mock', o.is_demo, 'bonus', o.is_bonus) order by o.created_at desc)
      from (select * from public.orders where user_id = uid order by created_at desc limit 200) o), '[]'::jsonb),
    'transactions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', 'TX-' || l.id, 'type', case when l.type = 'subscription' then 'order' else l.type end, 'label', l.note, 'amount', abs(l.amount), 'createdAt', l.created_at,
        'method', case when l.type = 'deposit' then 'UPI' end) order by l.created_at desc)
      from (select * from public.ledger where user_id = uid and (kind <> 'referral' or type = 'order') order by created_at desc limit 100) l), '[]'::jsonb),
    'withdrawals', coalesce((
      select jsonb_agg(jsonb_build_object('id', 'WD-' || x.id, 'amount', x.amount, 'method', x.method, 'details', x.details,
        'status', x.status, 'createdAt', x.created_at) order by x.created_at desc)
      from (select * from public.withdrawals where user_id = uid order by created_at desc limit 100) x), '[]'::jsonb),
    'tickets', coalesce((
      select jsonb_agg(jsonb_build_object('id', t.id, 'type', t.type, 'orderId', t.order_ref, 'subject', t.subject,
        'message', t.message, 'status', t.status, 'createdAt', t.created_at, 'resolvedAt', t.resolved_at) order by t.created_at desc)
      from (select * from public.tickets where user_id = uid order by created_at desc limit 100) t), '[]'::jsonb),
    'bonus', coalesce((select case when b.status = 'claimed' then 'claimed' else 'ready' end from public.bonus b where b.user_id = uid), 'none')
  );
end $$;

create or replace function public.update_profile(p_name text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'auth'; end if;
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'invalid'; end if;
  update public.profiles set name = left(trim(p_name), 60) where id = uid;
end $$;

create or replace function public.request_withdrawal(p_amount numeric, p_method text, p_details text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); avail numeric;
begin
  if uid is null then raise exception 'auth'; end if;
  if p_amount is null or p_amount < 100 then raise exception 'min_amount'; end if;
  if p_method not in ('UPI','Bank') or length(coalesce(p_details, '')) < 3 or length(p_details) > 300 then raise exception 'invalid'; end if;
  perform pg_advisory_xact_lock(hashtext(uid::text));
  select (select earned from public.wallet_of(uid))
       - coalesce((select sum(amount) from public.withdrawals where user_id = uid and status <> 'Rejected'), 0)
    into avail;
  if p_amount > avail then raise exception 'exceeds_available'; end if;
  insert into public.withdrawals(user_id, amount, method, details) values (uid, round(p_amount, 2), p_method, trim(p_details));
end $$;

create or replace function public.create_ticket(p_type text, p_order_ref text, p_subject text, p_message text) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); tid text;
begin
  if uid is null then raise exception 'auth'; end if;
  if length(trim(coalesce(p_subject, ''))) < 3 or length(trim(coalesce(p_message, ''))) < 5 then raise exception 'invalid'; end if;
  if (select count(*) from public.tickets where user_id = uid and created_at > now() - interval '1 hour') >= 5 then raise exception 'rate_limited'; end if;
  loop
    tid := 'UG-' || (10000 + floor(random() * 90000))::int;
    exit when not exists (select 1 from public.tickets where id = tid);
  end loop;
  insert into public.tickets(id, user_id, type, order_ref, subject, message)
  values (tid, uid, left(coalesce(p_type, 'Query'), 30), left(coalesce(p_order_ref, ''), 40), left(trim(p_subject), 150), left(trim(p_message), 4000));
  return tid;
end $$;

-- ---------- admin functions (each one re-checks is_admin() on the server) ----------
create or replace function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'users', coalesce((
      select jsonb_agg(jsonb_build_object('email', p.email, 'name', p.name, 'code', p.code, 'refBy', coalesce(p.ref_by, ''),
        'percent', coalesce(p.cashback_percent, case when p.pro_until > now() then 30 else 10 end),
        'proActive', coalesce(p.pro_until > now(), false), 'proUntil', p.pro_until, 'balance', w.paid, 'unpaid', w.unpaid, 'earned', w.earned, 'joined', p.created_at)
        order by p.created_at desc)
      from (select p2.* from public.profiles p2 join auth.users u on u.id = p2.id
            where u.email_confirmed_at is not null order by p2.created_at desc limit 500) p
      cross join lateral public.wallet_of(p.id) w), '[]'::jsonb),
    'orders', coalesce((
      select jsonb_agg(jsonb_build_object('id', o.id, 'email', p.email, 'name', o.service_name, 'link', o.link, 'qty', o.quantity,
        'charge', o.charge, 'status', o.status, 'createdAt', o.created_at, 'demo', o.is_demo, 'bonus', o.is_bonus) order by o.created_at desc)
      from (select * from public.orders order by created_at desc limit 500) o join public.profiles p on p.id = o.user_id), '[]'::jsonb),
    'withdrawals', coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'email', p.email, 'amount', x.amount, 'method', x.method, 'details', x.details,
        'status', x.status, 'createdAt', x.created_at) order by x.created_at desc)
      from (select * from public.withdrawals order by created_at desc limit 300) x join public.profiles p on p.id = x.user_id), '[]'::jsonb),
    'tickets', coalesce((
      select jsonb_agg(jsonb_build_object('id', t.id, 'email', p.email, 'type', t.type, 'orderId', t.order_ref, 'subject', t.subject,
        'message', t.message, 'status', t.status, 'createdAt', t.created_at) order by t.created_at desc)
      from (select * from public.tickets order by created_at desc limit 300) t join public.profiles p on p.id = t.user_id), '[]'::jsonb)
  );
end $$;

create or replace function public.admin_credit(p_email text, p_amount numeric, p_kind text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_amount is null or p_amount <= 0 or p_kind not in ('paid','unpaid','referral') then raise exception 'invalid'; end if;
  select id into uid from public.profiles where email = public.canon_email(p_email);
  if uid is null then raise exception 'user_not_found'; end if;
  insert into public.ledger(user_id, amount, kind, type, note)
  values (uid, round(p_amount, 2), p_kind, case when p_kind = 'referral' then 'referral' else 'deposit' end,
          case when p_kind = 'referral' then 'Referral reward' else 'Wallet top-up' end);
end $$;

create or replace function public.admin_set_cashback(p_code text, p_percent numeric) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  -- null = back to the default (10%, or 30% while the member is Pro)
  if p_percent is not null and (p_percent < 0 or p_percent > 100) then raise exception 'invalid'; end if;
  update public.profiles set cashback_percent = p_percent where code = upper(p_code);
end $$;

create or replace function public.admin_set_order_status(p_id bigint, p_status text, p_refund boolean) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('Pending','In progress','Completed','Partial','Canceled') then raise exception 'invalid'; end if;
  select * into o from public.orders where id = p_id for update;
  if not found then raise exception 'not_found'; end if;
  if p_status = 'Canceled' and coalesce(p_refund, false) and not o.refunded and not o.is_demo and o.charge > 0 then
    insert into public.ledger(user_id, amount, kind, type, note, ref)
    values (o.user_id, o.charge, 'paid', 'refund', 'Refund · ' || o.service_name, 'refund:order:' || o.id)
    on conflict (ref) where ref is not null do nothing;
    update public.orders set refunded = true where id = o.id;
  end if;
  update public.orders set status = p_status where id = o.id;
end $$;

create or replace function public.admin_set_withdrawal_status(p_id bigint, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare w public.withdrawals; avail numeric;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('Processing','Paid','Rejected') then raise exception 'invalid'; end if;
  select * into w from public.withdrawals where id = p_id for update;
  if not found then raise exception 'not_found'; end if;
  -- re-opening a rejected payout must not let the user withdraw more than he has earned
  if w.status = 'Rejected' and p_status <> 'Rejected' then
    perform pg_advisory_xact_lock(hashtext(w.user_id::text));
    select (select earned from public.wallet_of(w.user_id))
         - coalesce((select sum(amount) from public.withdrawals where user_id = w.user_id and status <> 'Rejected'), 0)
      into avail;
    if w.amount > avail then raise exception 'exceeds_available'; end if;
  end if;
  update public.withdrawals set status = p_status where id = p_id;
end $$;

create or replace function public.admin_set_ticket_status(p_id text, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('Open','Resolved') then raise exception 'invalid'; end if;
  update public.tickets set status = p_status, resolved_at = case when p_status = 'Resolved' then now() end where id = p_id;
end $$;

create or replace function public.admin_delete_user(p_email text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select id into uid from public.profiles where email = public.canon_email(p_email) and not is_admin;
  if uid is null then raise exception 'user_not_found'; end if;
  delete from auth.users where id = uid;
end $$;

-- ---------- admin: cut (deduct) funds / referral earnings, and let a user delete their own account ----------
-- Existing databases: this block is safe to run again. It widens the ledger "type" list to allow admin deductions.
alter table public.ledger drop constraint if exists ledger_type_check;
alter table public.ledger add constraint ledger_type_check
  check (type in ('deposit','order','refund','referral','adjustment','subscription'));

-- p_kind: paid (spendable wallet), unpaid (demo credit) or referral (cashback / referral earnings).
-- A deduction can never take a balance below zero (referral: below what is still withdrawable).
create or replace function public.admin_debit(p_email text, p_amount numeric, p_kind text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid; w record; avail numeric; amt numeric;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_amount is null or p_amount <= 0 or p_kind not in ('paid','unpaid','referral') then raise exception 'invalid'; end if;
  amt := round(p_amount, 2);
  select id into uid from public.profiles where email = public.canon_email(p_email);
  if uid is null then raise exception 'user_not_found'; end if;
  perform pg_advisory_xact_lock(hashtext(uid::text));
  select * into w from public.wallet_of(uid);
  if p_kind = 'paid' then avail := w.paid;
  elsif p_kind = 'unpaid' then avail := w.unpaid;
  else avail := w.earned - coalesce((select sum(amount) from public.withdrawals where user_id = uid and status <> 'Rejected'), 0);
  end if;
  if amt > avail then raise exception 'insufficient'; end if;
  insert into public.ledger(user_id, amount, kind, type, note)
  values (uid, -amt, p_kind, 'adjustment',
          case p_kind when 'referral' then 'Referral adjustment' when 'unpaid' then 'Promo credit removed' else 'Wallet adjustment' end);
end $$;

-- The logged-in user deletes their OWN account. Blocked while an order is running or a payout is being processed.
-- Any wallet balance / referral earnings left are forgone (the app shows a clear warning before this is called).
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'auth'; end if;
  if exists (select 1 from public.profiles where id = uid and is_admin) then raise exception 'admin_account'; end if;
  if exists (select 1 from public.orders where user_id = uid and not is_demo and status in ('Pending','In progress')) then
    raise exception 'running_orders';
  end if;
  if exists (select 1 from public.withdrawals where user_id = uid and status = 'Processing') then
    raise exception 'pending_payout';
  end if;
  delete from auth.users where id = uid;
end $$;

-- ---------- Pro membership ----------
create or replace function public.pro_active(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select pro_until > now() from public.profiles where id = uid), false)
$$;

-- Pro paid from the wallet. Prices here must match PRO_PRICE_MONTH / PRO_PRICE_YEAR in src/lib/config.ts.
-- Buying while already Pro adds the days on top of the current end date.
create or replace function public.buy_pro(p_plan text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_price numeric; v_days int; v_paid numeric; v_cur timestamptz;
begin
  if uid is null then raise exception 'auth'; end if;
  if p_plan = 'monthly' then v_price := 1299; v_days := 30;
  elsif p_plan = 'yearly' then v_price := 10999; v_days := 365;
  else raise exception 'invalid'; end if;
  perform pg_advisory_xact_lock(hashtext(uid::text));
  select paid into v_paid from public.wallet_of(uid);
  if v_paid < v_price then raise exception 'insufficient'; end if;
  select pro_until into v_cur from public.profiles where id = uid;
  insert into public.ledger(user_id, amount, kind, type, note)
  values (uid, -v_price, 'paid', 'subscription', 'Pro membership · ' || initcap(p_plan));
  update public.profiles
     set pro_until = greatest(coalesce(v_cur, now()), now()) + make_interval(days => v_days), pro_plan = p_plan
   where id = uid;
end $$;

-- Admin: give Pro for free (p_days > 0 adds days) or remove it (p_days = 0). Does not touch cashback_percent.
create or replace function public.admin_set_pro(p_email text, p_days int) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid; v_cur timestamptz;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_days is null or p_days < 0 or p_days > 36500 then raise exception 'invalid'; end if;
  select id, pro_until into uid, v_cur from public.profiles where email = public.canon_email(p_email);
  if uid is null then raise exception 'user_not_found'; end if;
  if p_days = 0 then
    update public.profiles set pro_until = null, pro_plan = null where id = uid;
  else
    update public.profiles
       set pro_until = greatest(coalesce(v_cur, now()), now()) + make_interval(days => p_days), pro_plan = 'admin'
     where id = uid;
  end if;
end $$;

-- For the order step (server side, later): take money for an order from the wallet ('paid') or from referral funds ('referral').
-- Locked and checked, so a balance can never go below zero. The order function must also charge the Pro price when pro_active(uid):
-- rate * 0.70 (PRO_DISCOUNT_PERCENT in src/lib/config.ts).
create or replace function public.charge_funds(uid uuid, amt numeric, source text, note text, ref_key text) returns void
language plpgsql security definer set search_path = public as $$
declare w record; avail numeric;
begin
  if amt is null or amt <= 0 or source not in ('paid','referral') then raise exception 'invalid'; end if;
  perform pg_advisory_xact_lock(hashtext(uid::text));
  select * into w from public.wallet_of(uid);
  if source = 'paid' then avail := w.paid;
  else avail := w.earned - coalesce((select sum(amount) from public.withdrawals where user_id = uid and status <> 'Rejected'), 0);
  end if;
  if round(amt, 2) > avail then raise exception 'insufficient'; end if;
  insert into public.ledger(user_id, amount, kind, type, note, ref)
  values (uid, -round(amt, 2), source, 'order', note, ref_key);
end $$;

-- ---------- who may call what ----------
revoke all on function public.canon_email(text), public.guard_email(), public.release_email(), public.handle_new_user(),
  public.is_admin(), public.wallet_of(uuid), public.credit_deposit(uuid, numeric, text),
  public.pro_active(uuid), public.charge_funds(uuid, numeric, text, text, text) from public, anon, authenticated;
grant execute on function public.credit_deposit(uuid, numeric, text), public.charge_funds(uuid, numeric, text, text, text) to service_role;

revoke all on function public.get_account(), public.update_profile(text), public.request_withdrawal(numeric, text, text),
  public.create_ticket(text, text, text, text), public.admin_overview(), public.admin_credit(text, numeric, text),
  public.admin_set_cashback(text, numeric), public.admin_set_order_status(bigint, text, boolean),
  public.admin_set_withdrawal_status(bigint, text), public.admin_set_ticket_status(text, text),
  public.admin_delete_user(text), public.admin_debit(text, numeric, text), public.delete_my_account(),
  public.buy_pro(text), public.admin_set_pro(text, int) from public, anon;
grant execute on function public.get_account(), public.update_profile(text), public.request_withdrawal(numeric, text, text),
  public.create_ticket(text, text, text, text), public.admin_overview(), public.admin_credit(text, numeric, text),
  public.admin_set_cashback(text, numeric), public.admin_set_order_status(bigint, text, boolean),
  public.admin_set_withdrawal_status(bigint, text), public.admin_set_ticket_status(text, text),
  public.admin_delete_user(text), public.admin_debit(text, numeric, text), public.delete_my_account(),
  public.buy_pro(text), public.admin_set_pro(text, int) to authenticated;

-- ---------- after YOU have signed up and verified your email, make yourself admin (put your own email in) ----------
-- update public.profiles set is_admin = true where email = 'yourname@gmail.com';
