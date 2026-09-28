# Brand tokens

One JSON file per brand, named after the site folder (`tokens/<brand>.json`). The `:root` block at the top of that site's `css/styles.css` mirrors this file: change a value here, then update the CSS to match (keys map to CSS custom properties, e.g. `color.amber` → `--amber`).

Rule source: Agency OS `02-RULES-AND-STANDARDS/HOUSE-WEB-STACK.md` (local checkout `~/Desktop/CGI`).

| File | Site |
| --- | --- |
| `patty.json` | `patty/` — dark only |
| `inerg.json` | `inerg/` — light and dark themes |
