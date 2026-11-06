# Carlos — `boost.products.display_order` (HUB-37 / HUB-63)

**Projecto:** SportsEvents `tprbpeacicadsbmvxcqk` (não Padel1)  
**SQL:** [`docs/migrations/20261103170000_boost_products_display_order.sql`](./migrations/20261103170000_boost_products_display_order.sql)

## O que faz
- Coluna `display_order` em `boost.products` (integer, default 0)
- Backfill pela ordem actual (destaque → `created_at`)
- Índice para listagem da loja

## Ordem na loja (código)
1. Em stock primeiro
2. **Destaque** (`is_featured`)
3. **Ordem custom** (`display_order`, menor = mais cedo)
4. **Esgotados** (físico com `stock = 0`) sempre no fim

Digitais com `stock = 0` **não** contam como esgotados.

## Hub
Produtos Boost → arrastar ⋮⋮ na grelha (ou campo «Ordem na loja» no formulário).  
Sem esta coluna, criar/editar produto falhava com *schema cache*; o hub agora tenta guardar sem ordem, mas **tens de correr o SQL** para ordem + drag.

## Como correr (cliques exactos)
1. Abrir [Supabase → SportsEvents → SQL Editor](https://supabase.com/dashboard/project/tprbpeacicadsbmvxcqk/sql/new)
2. Confirmar projecto **SportsEvents** (`tprbpeacicadsbmvxcqk`) — **não** Padel1
3. **New query** → colar o SQL completo abaixo → **Run**
4. Se o PostgREST ainda queixar de schema cache: esperar ~10–30s, ou correr `NOTIFY pgrst, 'reload schema';` na mesma janela, ou Settings → API → Reload schema
5. Confirmar com o `SELECT` no fim

## SQL completo (colar tudo)

```sql
-- SportsEvents (tprbpeacicadsbmvxcqk) — boost.products.display_order
-- HUB-37 / HUB-63

ALTER TABLE boost.products
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (
      ORDER BY is_featured DESC NULLS LAST, created_at DESC NULLS LAST
    ) - 1)::integer AS ord
  FROM boost.products
)
UPDATE boost.products p
SET display_order = ranked.ord
FROM ranked
WHERE p.id = ranked.id;

CREATE INDEX IF NOT EXISTS products_store_order_idx
  ON boost.products (active, is_featured DESC, display_order ASC);

-- Recarregar cache PostgREST (opcional se o erro schema cache continuar)
NOTIFY pgrst, 'reload schema';

-- Confirmar
SELECT id, name, is_featured, display_order, stock, is_digital
FROM boost.products
ORDER BY display_order
LIMIT 30;
```
