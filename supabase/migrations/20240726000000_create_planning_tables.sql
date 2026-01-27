-- Tabela para Metas de Poupança
CREATE TABLE public.savings_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    "targetAmount" numeric NOT NULL,
    "currentAmount" numeric DEFAULT 0 NOT NULL,
    "targetDate" date NOT NULL
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies para savings_goals
CREATE POLICY "Allow users to view their own goals"
ON public.savings_goals
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own goals"
ON public.savings_goals
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own goals"
ON public.savings_goals
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own goals"
ON public.savings_goals
FOR DELETE USING (auth.uid() = user_id);


-- Tabela para Lista de Desejos
CREATE TABLE public.wishlist_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    price numeric NOT NULL,
    priority text NOT NULL, -- 'high', 'medium', 'low'
    link text
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies para wishlist_items
CREATE POLICY "Allow users to view their own wishlist items"
ON public.wishlist_items
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own wishlist items"
ON public.wishlist_items
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own wishlist items"
ON public.wishlist_items
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own wishlist items"
ON public.wishlist_items
FOR DELETE USING (auth.uid() = user_id);