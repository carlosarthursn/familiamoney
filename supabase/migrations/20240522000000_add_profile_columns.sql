-- Adiciona colunas para suporte a nome personalizado e compartilhamento de conta
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES auth.users(id);

-- Habilita o RLS para que usuários possam ver transações um do outro se estiverem vinculados
-- Nota: Isso assume que a tabela transactions existe e tem uma coluna user_id
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'transactions') THEN
        DROP POLICY IF EXISTS "Users can view own or linked transactions" ON public.transactions;
        
        CREATE POLICY "Users can view own or linked transactions" ON public.transactions
        FOR ALL USING (
            auth.uid() = user_id OR 
            user_id IN (
                SELECT linked_user_id FROM public.profiles WHERE user_id = auth.uid()
            ) OR
            user_id IN (
                SELECT user_id FROM public.profiles WHERE linked_user_id = auth.uid()
            )
        );
    END IF;
END $$;