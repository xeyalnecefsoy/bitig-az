DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.system_alerts'::regclass
      AND contype = 'c'
    LIMIT 1;
      
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.system_alerts DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

ALTER TABLE public.system_alerts ADD CONSTRAINT system_alerts_type_check CHECK (type IN ('info', 'warning', 'error', 'maintenance', 'brand'));
