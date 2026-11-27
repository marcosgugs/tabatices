alter table public.customers
  add column cpf text not null default '' check (cpf ~ '^([0-9]{11})?$');

alter table public.orders
  add column payment_method text check (payment_method in ('pix', 'card')),
  add column installment_count smallint check (installment_count between 1 and 12),
  add constraint orders_installment_count_matches_payment_method check (
    (payment_method = 'card' and installment_count is not null)
    or (payment_method is distinct from 'card' and installment_count is null)
  );
