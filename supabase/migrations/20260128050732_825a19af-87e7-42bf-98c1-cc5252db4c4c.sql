-- Fix insecure RLS policy that references user_metadata
DROP POLICY IF EXISTS "Users can view own or linked transactions" ON public.transactions;