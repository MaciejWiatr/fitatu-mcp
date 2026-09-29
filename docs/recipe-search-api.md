# Recipe Search — API design doc

## Verdict

**Feasible.** The recipe catalog search is backed by a public, unauthenticated JSON
endpoint that accepts rich query parameters. We can build MCP tools on top of it
without touching the existing authenticated session flow.

Recipe *detail* (ingredients, steps, full nutrition) is also feasible — it goes
through the **existing authenticated client** (see [Recipe detail](#recipe-detail)).

## Upstream endpoint

```
GET https://pl-pl.fitatu.com/api/search/catalog/recipes
```

- No auth required. Verified anonymously from the browser.
- Same host/base as the existing authenticated client (`src/session.ts` → `API`),
  but this path needs no bearer token. The mobile `API-Key`/`API-Secret` headers
  are harmless to send but not required.
- Response is a **bare JSON array** — no envelope, and **no pagination headers**
  (`x-total-count` etc. are absent). Pagination = "request pages until you get a
  short page".

### Query parameters

| Param | Type | Notes |
|---|---|---|
| `phrase` | string | Free-text search. Empty string allowed. |
| `page` | int | 1-based. |
| `limit` | int | Page size. Web UI uses 20. |
| `minEnergy` / `maxEnergy` | int | kcal range. |
| `minProtein` / `maxProtein` | int | grams. |
| `minFat` / `maxFat` | int | grams. |
| `minCarbohydrate` / `maxCarbohydrate` | int | grams. |
| `tags[]` | repeated string | Diet, cuisine **and** popular tags all share this one param. See [enums](#tag-enums). |
| `meals[]` | repeated string | `breakfast`, `second_breakfast`, `lunch`, `dinner`, `snack`, `supper`. |
| `source[]` | repeated int | `1` = community (Społeczność), `2` = Fitatu official. |

Example (captured from the live site):

```
?limit=20&page=1&phrase=kurczak%20grillowany
 &minEnergy=200&maxEnergy=600&minFat=5&maxFat=30
 &minProtein=10&maxProtein=40&minCarbohydrate=10&maxCarbohydrate=80
 &tags[]=tag.italian&tags[]=tag.diabetic&tags[]=tag.poultry
 &meals[]=dinner&source[]=2
```

### Response item shape

```jsonc
{
  "foodId": 115312548,
  "name": "Chicken burger with marinated oyster mushrooms",
  "brand": "",
  "type": "RECIPE",
  "energy": 565.68,
  "rating": 0,
  "ratingCount": 0,
  "reviewsCount": 0,
  "premiumInRecipesCatalog": true,
  "favorite": false,
  "accessType": 3,
  "preparationTime": 10,
  "cookingTime": 35,
  "measure": { "measureId": 39, "measureName": "portion", "measureQuantity": 1,
               "measureWeight": 497.5, "measureEnergy": 565.68, "measureCapacity": null },
  "photo": { "path": "...", "pathThumbnail": "...", "pathBigThumbnail": "...",
             "pathLargeThumbnail": "...", "alt": "...", "id": 30935203 },
  "containNutritions": true,
  "source": "...",
  "saturatedFat": 0, "sugars": 0, "salt": 0, "sodium": 0,
  "iron": 0, "fiber": 0, "liquid": false, "generic": false
}
```

## Filters that are NOT server-side

The web UI exposes three filters that produce **no query parameter** — they are
applied client-side against the response. Our MCP tool must do the same:

| UI filter | Why client-side | Tool handles via |
|---|---|---|
| Prep time ("Do 10 min" / "Do 30 min") | Chips emit no param; UI filters on `preparationTime` (+`cookingTime`). | `max_prep_time_minutes` |
| Min rating ("skip recipes below 4 stars") | No `minRating` param exists. | `min_rating` → keep `rating >= min_rating` |
| Has reviews ("skip recipes with no opinions") | No param exists. | `require_reviews` → keep `reviewsCount > 0` |

Caveat: client-side filters run **after** paging, so a page of 20 can shrink. The
tool should over-fetch (loop pages) until it has `limit` post-filtered results or
runs out, and report how many raw pages it consumed.

## Tag enums

All three groups go into `tags[]`. The MCP tool should accept **friendly names**
and map them to `tag.*` values, so callers never type raw API tokens.

**Diet (13):** `tag.diabetic`, `tag.gluten_free`, `tag.high_fibre`,
`tag.high_protein`, `tag.keto`, `tag.lactose_free`, `tag.less_sugar`,
`tag.low_cholesterol`, `tag.low_fat`, `tag.low_fodmap_ibs`, `tag.vegan`,
`tag.vegetarian`, `tag.without_milk`

**Cuisine (14):** `tag.american`, `tag.british`, `tag.chinese`, `tag.dutch`,
`tag.french`, `tag.german`, `tag.greek`, `tag.indian`, `tag.italian`,
`tag.japanese`, `tag.mexican`, `tag.polish`, `tag.spanish`, `tag.thai`

**Popular (26):** `tag.appetizers`, `tag.beverages_and_drinks`, `tag.breads`,
`tag.cakes_biscuits_desserts`, `tag.casseroles`, `tag.crepes_and_pancakes`,
`tag.detox`, `tag.dumplings`, `tag.fall_season`, `tag.fish`, `tag.flour_dishes`,
`tag.omelettes`, `tag.pasta`, `tag.poultry`, `tag.red_meats`,
`tag.rice_and_cereals`, `tag.salads`, `tag.sandwiches`, `tag.sauces_and_dips`,
`tag.seafood`, `tag.soups`, `tag.spring_season`, `tag.stews`, `tag.summer_season`,
`tag.winter_season`, `tag.without_wheat`

Multiple `tags[]` appear to be AND-combined (narrowing) based on result counts.

## Proposed MCP tools

### `search_recipes`

| Input | Type | Maps to |
|---|---|---|
| `query` | string (optional) | `phrase` |
| `page` | int (default 1) | `page` |
| `limit` | int (default 20) | `limit` (post-filter target) |
| `min_calories` / `max_calories` | int | `minEnergy` / `maxEnergy` |
| `min_protein` / `max_protein` | int | `minProtein` / `maxProtein` |
| `min_fat` / `max_fat` | int | `minFat` / `maxFat` |
| `min_carbs` / `max_carbs` | int | `minCarbohydrate` / `maxCarbohydrate` |
| `meals` | enum[] | `meals[]` |
| `diets` | friendly enum[] | `tags[]` |
| `cuisines` | friendly enum[] | `tags[]` |
| `tags` | friendly enum[] | `tags[]` (popular) |
| `authors` | enum[] (`fitatu` / `community`) | `source[]` (2 / 1) |
| `max_prep_time_minutes` | int | client-side post-filter |
| `min_rating` | number | client-side post-filter |
| `require_reviews` | bool | client-side post-filter |

Output: array of normalized recipe summaries (`foodId`, `name`, `energy`,
macros, `rating`, `reviewsCount`, `preparationTime`, `cookingTime`,
`premium`, `photo`) plus a small meta block (`page`, `returned`, `rawPagesFetched`).

### `list_recipe_filters`

Zero-arg tool returning the enum catalog (meals, diets, cuisines, popular tags,
authors) with friendly names. Lets the model discover valid filter values instead
of guessing.

### `get_recipe_details`

| Input | Type | Notes |
|---|---|---|
| `recipe_id` | int | The `foodId` / `id` from a search result. |

Fetches one recipe with full detail. Output: `name`, `recipeDescription` (prep
steps), `items` (ingredients with weight + energy), `measures`, full per-serving
nutrition (macros + all vitamins/minerals, glycemic index/load), `tags`,
`photos`, `rating`, `preparationTime`/`cookingTime`, `serving`, `weight`,
`mealSchema`.

## Recipe detail

```
GET https://pl-pl.fitatu.com/api/recipes/{id}
```

- **Requires auth** — goes through the existing `FitatuSession` /
  `FitatuClient` (bearer token + mobile `API-Key`/`API-Secret` headers, with
  automatic refresh on expiry). Verified 200 with a real refreshed token.
- Anonymous requests and the other path candidates (`/recipe/{id}`,
  `/dietetic/recipe/{id}`, `/search/catalog/recipes/{id}`) return 403/404 —
  `/api/recipes/{id}` is the one.

Response top-level fields of interest:

| Field | Notes |
|---|---|
| `id`, `name`, `recipeDescription` | Description doubles as the prep steps. |
| `items[]` | Ingredients: `itemId`, `name`, `energy`, `measureId/Name/Weight/Quantity`, `hint`. |
| `measures[]`, `simpleMeasures[]` | Portion/measure definitions. |
| `serving`, `weight` | Servings count and per-serving weight (g). |
| `energy`, `protein`, `fat`, `carbohydrate`, `fiber`, `sugars`, `saturatedFat`, … | Per-serving macros. |
| `calcium`, `iron`, `vitaminA…K`, `omega3/6`, `glycemicIndex`, `glycemicLoad`, … | Full micronutrient panel. |
| `tags[]` | `{ name: "tag.*", translation, category }`. |
| `photos[]` | `path`, `isMain`, `step`, `isIngredientsPhoto`. |
| `rating` | `{ rating, userVote }`. |
| `preparationTime`, `cookingTime`, `needsCooking`, `needsReheating` | |
| `mealSchema[]` | e.g. `["breakfast", …]`. |

Implementation: add `getRecipe(id)` to `src/client.ts` using `session.request`
(same pattern as `getMealPlan`), register `get_recipe_details` in `src/server.ts`.

## Implementation notes

- Add an unauthenticated `searchRecipes()` to `src/client.ts` — plain `fetch`,
  not `session.request` (no token needed). Or a tiny separate `catalog.ts`.
- Build query with repeated `tags[]` / `meals[]` / `source[]` keys
  (`URLSearchParams.append`).
- Keep the friendly-name → `tag.*` map in one place; `list_recipe_filters` and
  the `search_recipes` zod enums both read from it.
- Register both tools in `src/server.ts` next to the existing `get_*` tools.
- Over-fetch loop for client-side filters: cap raw pages (e.g. 5) to bound latency.

## Summary

| Tool | Endpoint | Auth |
|---|---|---|
| `search_recipes` | `GET /api/search/catalog/recipes` | none |
| `list_recipe_filters` | (static enum catalog) | none |
| `get_recipe_details` | `GET /api/recipes/{id}` | existing `FitatuSession` |
