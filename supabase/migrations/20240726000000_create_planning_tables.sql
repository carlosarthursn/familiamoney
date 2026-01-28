-- Create Savings Goals table
CREATE TABLE public.savings_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    "targetAmount" numeric NOT NULL,
    "currentAmount" numeric DEFAULT 0 NOT NULL,
    "targetDate" date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.savings_goals OWNER TO postgres;

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX savings_goals_pkey ON public.savings_goals USING btree (id);

ALTER TABLE public.savings_goals ADD CONSTRAINT savings_goals_pkey PRIMARY KEY (id);

ALTER TABLE public.savings_goals ADD CONSTRAINT savings_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- RLS Policies for savings_goals
CREATE POLICY "Users can view their own goals" ON public.savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goals" ON public.savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.savings_goals FOR DELETE USING (auth.uid() = user_id);


-- Create Wishlist Items table
CREATE TABLE public.wishlist_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    price numeric NOT NULL,
    priority text NOT NULL,
    link text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.wishlist_items OWNER TO postgres;

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX wishlist_items_pkey ON public.wishlist_items USING btree (id);

ALTER TABLE public.wishlist_items ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (id);

ALTER TABLE public.wishlist_items ADD CONSTRAINT wishlist_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- RLS Policies for wishlist_items
CREATE POLICY "Users can view their own wishlist items" ON public.wishlist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wishlist items" ON public.wishlist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wishlist items" ON public.wishlist_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wishlist items" ON public.wishlist_items FOR DELETE USING (auth.uid() = user_id);