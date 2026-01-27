-- Adiciona a coluna 'name' para armazenar o nome de exibição do usuário
ALTER TABLE public.profiles
ADD COLUMN name text;

-- Adiciona a coluna 'linked_user_id' para vincular contas (compartilhamento)
ALTER TABLE public.profiles
ADD COLUMN linked_user_id uuid REFERENCES auth.users(id);

-- Cria um índice para a coluna linked_user_id para buscas mais rápidas
CREATE INDEX profiles_linked_user_id_idx ON public.profiles (linked_user_id);

-- Atualiza a política RLS (Row Level Security) para permitir que usuários vejam o nome e o linked_user_id de outros usuários (necessário para buscar o nome do parceiro)
-- Assumindo que a política de SELECT já existe. Se não existir, ela deve ser criada.
-- Se a política de SELECT for restritiva, o fetchProfile pode falhar.
-- Vamos garantir que a política de SELECT permita a leitura básica de perfis.

-- Exemplo de política RLS (se necessário, você deve aplicá-la no seu ambiente Supabase):
/*
CREATE POLICY "Allow authenticated users to view all profiles"
ON public.profiles
FOR SELECT USING (
  auth.role() = 'authenticated'
);
*/