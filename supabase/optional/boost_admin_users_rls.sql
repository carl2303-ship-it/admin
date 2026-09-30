-- =============================================================================
-- OPCIONAL — aplicar no projeto Supabase BOOST (não SportsEvents).
-- NÃO correr em produção sem aprovação explícita do Carlos.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Apenas service role gere a lista (ou owner via SQL editor).
DROP POLICY IF EXISTS "admin_users_select_self" ON public.admin_users;
CREATE POLICY "admin_users_select_self"
  ON public.admin_users FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_boost_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_boost_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_boost_admin() TO authenticated;

-- Exemplo: apertar escrita em products (ajusta nomes de policies existentes).
-- DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
-- CREATE POLICY "boost_admin_insert_products"
--   ON public.products FOR INSERT TO authenticated
--   WITH CHECK (public.is_boost_admin());
--
-- Repetir padrão UPDATE/DELETE para: products, orders, order_items,
-- discount_codes, categories, brands, blog_posts, organizations (source=boost),
-- newsletter_subscribers, ebook_*, stage_registrations.
--
-- Seed (substituir UUIDs reais):
-- INSERT INTO public.admin_users (user_id, email, note)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'admin@boostpadel.store', 'owner');
