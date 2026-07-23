# Quetzal Supabase

The production app uses Supabase Auth plus two row-level-secured tables:

- `profiles` stores a traveller's display name.
- `trips` stores complete planner snapshots: dates, route, activities and saved places.

Run `schema.sql` in the Supabase SQL Editor, then configure:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Add the production site URL and `http://localhost:3000/**` to Supabase Auth redirect URLs.
