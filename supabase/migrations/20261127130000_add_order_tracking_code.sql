alter table public.orders
  add column tracking_code text not null default '' check (char_length(tracking_code) <= 60);
