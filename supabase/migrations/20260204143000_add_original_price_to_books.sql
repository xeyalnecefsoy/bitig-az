-- Add original_price column to books for discount logic
-- If original_price is set and > price, the item is on sale.
-- If price is 0, the item is free.

alter table public.books 
add column if not exists original_price numeric(10, 2);
