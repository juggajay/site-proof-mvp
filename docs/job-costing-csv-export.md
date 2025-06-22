# Civil-Q Job Cost Report - CSV Export Guide

## Overview
The Civil-Q Job Cost Report now includes comprehensive CSV export functionality that allows project managers to export detailed cost breakdowns for further analysis in spreadsheet applications.

## Accessing the CSV Export

1. Navigate to any project detail page
2. Click the "Job Costs" button in the header
3. Apply any desired filters (date range, lot, cost category)
4. Click the "Export to CSV" button

## CSV File Format

The exported CSV file follows this structure:

### File Naming Convention
`job-cost-report-[project-name]-[YYYYMMDD].csv`

Example: `job-cost-report-construction-site-alpha-20250622.csv`

### CSV Structure

#### Header Section
- Report title
- Project name
- Date range
- Generation timestamp

#### Summary Section
- Total Labour costs
- Total Plant costs  
- Total Materials costs
- Total project cost

#### Labour Costs Detail
Columns:
- Date
- Worker Name
- Company
- Trade/Profession
- Hours
- Hourly Rate
- Total Cost

#### Plant & Equipment Costs Detail
Columns:
- Date
- Equipment Name
- Equipment Type
- Equipment ID/Registration
- Hours Used
- Hourly Rate
- Fuel Consumed (Liters)
- Total Cost

#### Materials Costs Detail
Columns:
- Date
- Material Name
- Material Type
- Supplier
- Quantity
- Unit of Measure
- Unit Cost
- Total Cost

## Features

### Proper CSV Formatting
- Automatically escapes quotes in data
- Wraps fields containing commas in quotes
- Handles special characters correctly

### Comprehensive Data Export
- Includes all filtered data visible in the report
- Maintains date formatting (dd/MM/yyyy)
- Preserves currency formatting with $ symbols
- Shows N/A for missing optional fields

### Filter Persistence
- Export respects all applied filters:
  - Date range filter
  - Lot/area filter
  - Cost category filter
- Only exports data matching current filter criteria

## Use Cases

1. **Financial Analysis**
   - Import into Excel/Google Sheets
   - Create custom pivot tables
   - Generate additional charts and graphs

2. **Reporting**
   - Share with stakeholders
   - Archive for compliance
   - Budget reconciliation

3. **Integration**
   - Import into accounting software
   - Feed into project management tools
   - Use for payroll processing

## Example CSV Output

```csv
Civil-Q Job Cost Report
Project: Construction Site Alpha
Date Range: Last 30 Days
Generated: 22/06/2025 14:30

SUMMARY
Category,Amount
Total Labour,$12450.00
Total Plant,$8960.00
Total Materials,$15750.00
Total Cost,$37160.00

LABOUR COSTS
Date,Worker,Company,Trade,Hours,Rate,Total
20/06/2025,Mike Johnson,ABC Construction Services,Excavator Driver,8,$85.00,$680.00
20/06/2025,Sarah Williams,ABC Construction Services,Pipe Layer,8,$75.00,$600.00

PLANT & EQUIPMENT COSTS
Date,Equipment,Type,ID,Hours,Rate,Fuel (L),Total
20/06/2025,CAT 320 Excavator,excavator,EX-001,8,$180.00,120,$1440.00

MATERIALS COSTS
Date,Material,Type,Supplier,Quantity,Unit,Unit Cost,Total
20/06/2025,Concrete 32 MPa,concrete,Ready Mix Concrete Co,25,m³,$280.00,$7000.00
```

## Tips

1. **Pre-filter Data**: Apply filters before exporting to reduce file size
2. **Date Ranges**: Use appropriate date ranges for the analysis period
3. **Regular Exports**: Schedule regular exports for ongoing projects
4. **Version Control**: Include export date in filename for tracking

## Troubleshooting

**Issue**: Export button not working
- Solution: Ensure cost data has loaded completely
- Check browser console for errors

**Issue**: Missing data in export
- Solution: Verify filters aren't excluding expected data
- Check if data exists for the selected period

**Issue**: CSV formatting issues
- Solution: Open with a proper spreadsheet application
- Ensure UTF-8 encoding is selected when importing