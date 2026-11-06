# HUB-64

Hub `saveProduct` writes `description`, `short_description`, `colors` (jsonb `{name,hex}`), `sizes` to `boost.products`.

Store reads those columns; colors/sizes now render on `/store/[id]`.
