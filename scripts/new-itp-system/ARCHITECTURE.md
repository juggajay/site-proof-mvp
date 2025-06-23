# ITP System Architecture

## Data Flow Diagram

```
┌─────────────────┐
│  ITP Templates  │ ← Reusable blueprints
└────────┬────────┘
         │ 1:N
         ↓
┌─────────────────┐
│ Template Items  │ ← Individual checklist items
└────────┬────────┘
         │
         │ When assigned to lot
         ↓
┌─────────────────┐     ┌─────────────────┐
│      Lots       │────→│ ITP Assignments │ ← Links template to lot
└─────────────────┘ 1:N └────────┬────────┘
                                 │ 1:N
                                 ↓
                        ┌─────────────────┐     ┌─────────────────┐
                        │   Inspection    │────→│  Attachments    │
                        │    Records      │ 1:N │ (Photos/Docs)   │
                        └────────┬────────┘     └─────────────────┘
                                 │ If failed            │
                                 ↓                      │ GPS coords
                        ┌─────────────────┐            ↓
                        │Non-Conformances │ ← Quality issues
                        └────────┬────────┘
                                 │ 1:N
                                 ↓
                        ┌─────────────────┐
                        │ NC Attachments  │ ← Evidence
                        └─────────────────┘
```

## Example Scenario

### 1. Template Setup (One-time)
```
ITP Template: "Concrete Pour Inspection" (CONC-001)
├── Item 1: Formwork inspection (boolean)
├── Item 2: Reinforcement placement (boolean)
├── Item 3: Concrete slump test (numeric: 80-120mm)
├── Item 4: Concrete temperature (numeric: 10-32°C)
└── Item 5: Surface finish (text)
```

### 2. Assignment to Lot
```
Lot: "Building A - Level 2"
├── Assignment 1: "Concrete Pour - Footings" (CONC-001)
├── Assignment 2: "Concrete Pour - Columns" (CONC-001)
└── Assignment 3: "Asphalt Paving - Driveway" (ASPH-001)
```

### 3. Inspection Process
```
Assignment: "Concrete Pour - Footings"
├── Record 1: Formwork → PASS ✓
│   └── 📷 2 photos attached (GPS: -27.4698, 153.0251)
├── Record 2: Reinforcement → PASS ✓
│   └── 📷 3 photos attached
├── Record 3: Slump test → FAIL ✗ (135mm)
│   ├── 📷 1 photo of slump cone
│   ├── 📄 Test certificate PDF
│   └── NC-2024-001: "Slump exceeds limit"
├── Record 4: Temperature → PASS ✓ (28°C)
└── Record 5: Surface finish → PASS ✓
    └── 📷 4 photos of finished surface
Progress: 80% (4/5 passed) | 10 attachments total
```

## Key Features by Table

### itp_templates
- Stores reusable inspection checklists
- Supports versioning
- Can be marked as custom (from ITP builder)
- Categorized for easy filtering

### itp_template_items
- Flexible inspection types
- Built-in validation rules
- Support for units and ranges
- Witness/hold point markers

### lot_itp_assignments
- Multiple ITPs per lot
- Execution sequence tracking
- Status progression (pending → in_progress → completed → approved)
- Assignment tracking

### itp_inspection_records
- One record per checklist item
- Stores actual inspection results
- Links to non-conformances
- Audit trail (who, when)

### non_conformances
- Auto-generated NC numbers
- Severity classification
- Full lifecycle tracking
- Can be created manually or from failed inspections

## Benefits for ITP Builder

The structure supports your future ITP builder:

1. **Template Creation**
   - Dynamic item types
   - Custom validation rules
   - Reusable across projects

2. **Flexible Inspections**
   - Boolean: Simple pass/fail
   - Numeric: Measurements with units
   - Text: Detailed observations
   - Multi-choice: Predefined options
   - Signature: Digital approvals

3. **Quality Control**
   - Automatic NC creation
   - Severity-based workflows
   - Progress tracking

4. **Scalability**
   - Unlimited templates
   - Unlimited items per template
   - Unlimited assignments per lot

## Mobile Features

### Photo Capture
- **Native camera integration**: Direct photo capture from inspection form
- **Multiple photos per item**: Up to 5 photos per inspection item
- **GPS tagging**: Automatic location capture with photos
- **Offline support**: Photos queued for upload when online

### File Attachments
- **Document upload**: PDFs, Word docs, Excel sheets
- **Test certificates**: Attach lab results and certificates
- **Video support**: Record short videos of issues
- **Automatic compression**: Optimize file sizes for mobile data

### Mobile-Optimized UI
- **Large touch targets**: Easy button taps on mobile
- **Swipe gestures**: Quick pass/fail actions
- **Progressive forms**: Step-by-step inspection flow
- **Auto-save**: Never lose inspection data

### Location Services
- **GPS coordinates**: Captured with each photo
- **Accuracy tracking**: Shows GPS accuracy in meters
- **Map view**: See inspection locations on map
- **Geofencing**: Verify inspector is on-site