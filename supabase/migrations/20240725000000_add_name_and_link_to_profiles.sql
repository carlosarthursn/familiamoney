-- Adiciona a coluna 'name' para armazenar o nome de exibição do usuário
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS name text;

-- Adiciona a coluna 'linked_user_id' para vincular contas (compartilhamento)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES auth.users(id);

-- Cria um índice para a coluna linked_user_id para buscas mais rápidas
CREATE INDEX IF NOT EXISTS profiles_linked_user_id_idx ON public.profiles (linked_user_id);

-- Habilita RLS (se ainda não estiver habilitado)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Allow authenticated users to view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;

-- RLS Policy: SELECT (Permite que usuários autenticados vejam todos os perfis, necessário para buscar o nome do parceiro)
CREATE POLICY "Allow authenticated users to view all profiles"
ON public.profiles
FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- RLS Policy: INSERT (Permite que usuários insiram seu próprio perfil)
CREATE POLICY "Allow authenticated users to insert their own profile"
ON public.profiles
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- RLS Policy: UPDATE (Permite que usuários atualizem seu próprio perfil)
CREATE POLICY "Allow authenticated users to update their own profile"
ON public.profiles
FOR UPDATE USING (
  auth.uid() = user_id
) WITH CHECK (
  auth.uid() = user_id
);