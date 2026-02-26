-- Migration to translate the dummy initial descriptions to Azerbaijani

UPDATE public.books SET description = 'Arrakis səhra planetində siyasət, din və ekologiyadan bəhs edən möhtəşəm bir dastan.' WHERE id = 'dunesaga';
UPDATE public.books SET description = 'Praktik strategiyalarla davamlı inkişaf üçün daha yaxşı vərdişlər və sistemlər qurun.' WHERE id = 'atomic';
UPDATE public.books SET description = 'Bilbo Baggins əjdahalar və cırtdanlarla dolu gözlənilməz bir səyahətə çıxır.' WHERE id = 'hobbit';
UPDATE public.books SET description = 'Marsda tənha qalan astronavt yaşamaq üçün ağıl və yumordan istifadə edərək mübarizə aparır.' WHERE id = 'martian';
UPDATE public.books SET description = 'ABŞ-ın keçmiş Birinci Xanımından səmimi, güclü bir memuar.' WHERE id = 'becoming';
UPDATE public.books SET description = 'Bəşəriyyətin keçmişi və dünyaya təsirimizin dərin tədqiqi.' WHERE id = 'sapiens';
