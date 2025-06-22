# Database ID Types Documentation

## Current Schema Mismatch

There is currently a mismatch between ID types in the database schema:

### Table ID Types
- `itp_templates.id`: **INTEGER** (SERIAL PRIMARY KEY) - generates numeric IDs like 1, 2, 3, etc.
- `lots.id`: **UUID** - generates UUID strings like "2924e1e1-9d03-4b34-8e25-24cbb4d51836"
- `auth.users.id`: **UUID** (from Supabase Auth)

### Junction Table Schema
The `lot_itp_templates` junction table needs to reference both:
- `lot_id`: UUID (references lots.id)
- `itp_template_id`: INTEGER (references itp_templates.id)

## Migration Scripts

Two versions of the migration script exist:

1. **create-lot-itp-templates-table.sql** - Original version that assumes all IDs are UUIDs
2. **create-lot-itp-templates-table-numeric.sql** - Updated version that correctly handles numeric ITP template IDs

## Code Handling

The `assignMultipleITPsToLotAction` function in `lib/actions.ts` handles this by:
- Converting lot IDs to strings (for UUID compatibility)
- Keeping ITP template IDs as-is (numeric values)

## Future Considerations

To maintain consistency, consider migrating all tables to use UUID primary keys. This would require:
1. Creating new UUID columns in tables with numeric IDs
2. Updating all foreign key references
3. Migrating existing data
4. Dropping old numeric ID columns

For now, the system handles the mixed ID types appropriately.