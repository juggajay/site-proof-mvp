# Seeding ITP Templates

The ITP templates table needs to be populated with the standard Australian civil construction templates. 

## Quick Seed (5 basic templates)

Run this for a quick test with 5 basic templates:

```sql
-- Run script: 11-quick-seed-templates.sql
```

## Full Seed (27 comprehensive templates)

For the complete set of 27 Australian standard templates across 9 categories:

1. First, make templates globally available:
```sql
-- Run script: 09-make-itps-global.sql
```

2. Then seed all templates:
```sql
-- Run these in order:
-- 06-seed-itp-templates.sql (first 9 templates)
-- 07-seed-more-itp-templates.sql (next 10 templates)  
-- 08-seed-final-itp-templates.sql (final 8 templates)
```

OR use the consolidated script:
```sql
-- Run script: 10-reseed-global-templates.sql
```

## Verification

After seeding, verify templates exist:

```sql
SELECT 
    category,
    COUNT(*) as template_count,
    array_agg(name ORDER BY name) as templates
FROM itp_templates
WHERE is_active = true
GROUP BY category
ORDER BY category;
```

## Categories Included

1. **Site Establishment & Earthworks** (3 templates)
   - Site Establishment
   - Bulk Earthworks
   - Detailed Excavation

2. **Concrete Works** (3 templates)
   - Concrete Footings
   - Concrete Slabs
   - Precast Concrete Installation

3. **Asphalt & Bituminous Works** (3 templates)
   - Asphalt Base Course
   - Asphalt Wearing Course
   - Bituminous Seal

4. **Drainage & Stormwater** (3 templates)
   - Stormwater Drainage
   - Culvert Installation
   - Retention/Detention Basin

5. **Road Pavement & Subgrade** (3 templates)
   - Subgrade Preparation
   - Base/Subbase Course
   - Road Pavement

6. **Kerb & Concrete Edging** (3 templates)
   - Kerb and Gutter
   - Concrete Edging
   - Median and Islands

7. **Steel & Structural Works** (3 templates)
   - Structural Steel
   - Reinforcement Steel
   - Post-Tensioning

8. **Services & Utilities** (3 templates)
   - Underground Services
   - Electrical Installation
   - Communications

9. **Quality & Testing** (3 templates)
   - Material Testing
   - Survey Control
   - Environmental Monitoring

## Troubleshooting

If templates don't appear:

1. Check if RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('itp_templates', 'itp_template_items');
```

2. Check template count:
```sql
SELECT COUNT(*) FROM itp_templates;
```

3. Run the debug endpoint:
```
GET /api/debug/itp-templates
```