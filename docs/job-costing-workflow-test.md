# Civil-Q Job Costing - Complete Workflow Test Guide

## Overview
This guide walks through the complete workflow for using the new job costing features in Civil-Q, including the company-centric resource management and smart select functionality.

## Test Credentials
- Email: `test@example.com`
- Password: `password123`

## 1. Initial Setup - Resource Library

### Step 1.1: Access Resource Library
1. Log in to the application
2. Navigate to Dashboard
3. Click on "Resources" in the navigation

### Step 1.2: Add Labour Subcontractor Company
1. Go to the "Labour" tab
2. Click "Add Subcontractor"
3. Fill in the form:
   - Company Name: "ABC Construction Services"
   - Contact Person: "John Smith"
   - Phone: "0412 345 678"
   - Email: "john@abcconstruction.com"
   - ABN: "12 345 678 901"
   - Address: "123 Construction St, Sydney NSW 2000"
4. Click "Create Subcontractor"

### Step 1.3: Add Employees to Subcontractor
1. Find "ABC Construction Services" in the list
2. Click "Add Employee"
3. Add multiple employees:
   
   **Employee 1:**
   - Name: "Mike Johnson"
   - Profession/Trade: "Excavator Driver"
   - Hourly Rate: $85.00
   - Phone: "0423 456 789"
   
   **Employee 2:**
   - Name: "Sarah Williams"
   - Profession/Trade: "Pipe Layer"
   - Hourly Rate: $75.00
   - Phone: "0434 567 890"
   
   **Employee 3:**
   - Name: "Tom Brown"
   - Profession/Trade: "General Labourer"
   - Hourly Rate: $65.00
   - Phone: "0445 678 901"

### Step 1.4: Add Plant/Equipment Company
1. Go to the "Plant" tab
2. Click "Add Company"
3. Fill in the form:
   - Company Name: "XYZ Equipment Hire"
   - Contact Person: "Jane Davis"
   - Phone: "0456 789 012"
   - Email: "jane@xyzequipment.com"
   - ABN: "98 765 432 109"
   - Address: "456 Equipment Rd, Brisbane QLD 4000"
4. Click "Create Company"

### Step 1.5: Add Equipment to Company
1. Find "XYZ Equipment Hire" and click the expand arrow
2. Click "Add Equipment" and add multiple items:
   
   **Equipment 1:**
   - Machine Name: "CAT 320 Excavator"
   - Machine Type: "Excavator"
   - Model: "320D2L"
   - Registration: "EX-001"
   - Fuel Type: "Diesel"
   - Default Hourly Rate: $180.00
   - Default Idle Rate: $90.00
   
   **Equipment 2:**
   - Machine Name: "Komatsu WA380 Loader"
   - Machine Type: "Loader"
   - Model: "WA380-8"
   - Registration: "LD-002"
   - Fuel Type: "Diesel"
   - Default Hourly Rate: $150.00
   - Default Idle Rate: $75.00

### Step 1.6: Add Material Profiles
1. Go to the "Materials" tab
2. Add several material profiles:
   
   **Material 1:**
   - Material Name: "Concrete 32 MPa"
   - Category: "Concrete"
   - Supplier: "Ready Mix Concrete Co"
   - Default Unit: "m³"
   - Default Rate: $280.00
   - Specification: "AS 3600 compliant"
   
   **Material 2:**
   - Material Name: "DN200 PVC Pipe"
   - Category: "Pipes"
   - Supplier: "Pipeline Supplies"
   - Default Unit: "m"
   - Default Rate: $85.00
   - Specification: "AS/NZS 1477"

## 2. Site Diary - Smart Select Testing

### Step 2.1: Navigate to Site Diary
1. Go to Dashboard
2. Select any active project (e.g., "Construction Site Alpha")
3. Click on any lot with status "In Progress"
4. Click "Site Diary" button

### Step 2.2: Test Labour Smart Select
1. Click "Add Labour Docket"
2. In the "Select Employee" dropdown, you should see:
   - "Mike Johnson - ABC Construction Services (Excavator Driver) - $85/hr"
   - "Sarah Williams - ABC Construction Services (Pipe Layer) - $75/hr"
   - "Tom Brown - ABC Construction Services (General Labourer) - $65/hr"
3. Select "Mike Johnson"
4. Verify auto-populated fields:
   - Worker Name: "Mike Johnson"
   - Trade: "Excavator Driver"
   - Hourly Rate: "85"
5. Fill remaining fields:
   - Regular Hours: 8
   - Task Description: "Site excavation for foundation"
6. Click "Create Docket"

### Step 2.3: Test Plant Smart Select
1. Click "Add Plant Docket"
2. In the "Select Plant/Equipment" dropdown, you should see:
   - "CAT 320 Excavator - Excavator (EX-001) - $180/hr"
   - "Komatsu WA380 Loader - Loader (LD-002) - $150/hr"
3. Select "CAT 320 Excavator"
4. Verify auto-populated fields:
   - Equipment Type: "excavator"
   - Equipment ID: "EX-001"
   - Hourly Rate: "180"
5. Fill remaining fields:
   - Operator Name: "Mike Johnson"
   - Hours Used: 8
   - Fuel Consumed: 120
   - Task Description: "Foundation excavation"
6. Click "Create Docket"

### Step 2.4: Test Materials Smart Select
1. Click "Add Materials Docket"
2. In the "Select Material" dropdown, you should see:
   - "Concrete 32 MPa - Concrete (Ready Mix Concrete Co) - $280/m³"
   - "DN200 PVC Pipe - Pipes (Pipeline Supplies) - $85/m"
3. Select "Concrete 32 MPa"
4. Verify auto-populated fields:
   - Material Type: "concrete"
   - Supplier: "Ready Mix Concrete Co"
   - Unit of Measure: "m³"
   - Unit Cost: "280"
5. Fill remaining fields:
   - Quantity: 25
   - Delivery Docket: "DC-12345"
   - Received By: "Tom Brown"
6. Verify Total Cost auto-calculates to: $7,000.00
7. Click "Create Docket"

## 3. Verify Cost Tracking

### Step 3.1: Check Daily Summary
After adding dockets, verify the summary totals at the top of each section:
- Labour: Total Hours and Total Cost
- Plant: Total Hours, Total Cost, and Total Fuel
- Materials: Total Cost

### Step 3.2: Check Manual Entry Still Works
1. Add a new Labour docket but don't select from the dropdown
2. Manually enter worker details
3. Verify the form still accepts manual entry

## 4. Edge Cases to Test

### Test 4.1: Company with No Resources
1. Create a new company in Plant tab with no equipment
2. Go to Site Diary and verify the dropdown still works

### Test 4.2: Edit Existing Resources
1. Go back to Resources
2. Edit an employee's hourly rate
3. Return to Site Diary and verify the new rate appears

### Test 4.3: Multiple Companies
1. Add another plant company with similar equipment
2. Verify all equipment from both companies appears in Site Diary dropdown

## Expected Results

✅ **Resource Library**
- Companies can be created and managed separately
- Plant equipment is grouped by company
- Labour employees are grouped by subcontractor
- All forms save correctly

✅ **Smart Select in Site Diary**
- Dropdowns show all available resources
- Selection auto-populates relevant fields
- Manual entry still works when needed
- Costs are calculated correctly

✅ **Data Persistence**
- Resources remain available across sessions
- Selected resources link correctly to dockets
- Cost tracking captures the rate at time of entry

## Troubleshooting

**Issue: "User organization not found" error**
- Solution: Fixed by adding user_organizations to mock data

**Issue: Resources not appearing in dropdowns**
- Check: Ensure resources are marked as active
- Check: Verify you're logged in with correct user

**Issue: Auto-population not working**
- Check: Ensure you're selecting from dropdown, not typing
- Check: Verify resource has all required fields filled

## Next Steps

After successful testing:
1. Push changes to production
2. Run database migration scripts
3. Train users on new workflow
4. Monitor for any issues in production