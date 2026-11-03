# Carlos — `boost.products.display_order` (HUB-37)

**Projecto:** SportsEvents `tprbpeacicadsbmvxcqk`  
**SQL:** [`docs/migrations/20261103170000_boost_products_display_order.sql`](./migrations/20261103170000_boost_products_display_order.sql)

## O que faz
- Coluna `display_order` (integer, default 0)
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

## Como correr
1. https://supabase.com/dashboard/project/tprbpeacicadsbmvxcqk/sql/new
2. Colar o ficheiro SQL → **Run**
3. Confirmar:

```sql
SELECT id, name, is_featured, display_order, stock, is_digital
FROM boost.products
ORDER BY display_order
LIMIT 30;
```
