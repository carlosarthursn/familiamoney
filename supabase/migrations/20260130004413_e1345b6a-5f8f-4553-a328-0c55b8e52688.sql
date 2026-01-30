-- Permite que usuários busquem outros perfis pelo email para vinculação
CREATE POLICY "Users can search profiles by email for linking"
ON public.profiles
FOR SELECT
USING (true);

-- Remove a política antiga que era mais restritiva
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;