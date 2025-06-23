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
                        ┌─────────────────┐
                        │   Inspection    │ ← Actual inspection data
                        │    Records      │
                        └────────┬────────┘
                                 │ If failed
                                 ↓
                        ┌─────────────────┐
                        │Non-Conformances │ ← Quality issues
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
├── Record 2: Reinforcement → PASS ✓
├── Record 3: Slump test → FAIL ✗ (135mm)
│   └── NC-2024-001: "Slump exceeds limit"
├── Record 4: Temperature → PASS ✓ (28°C)
└── Record 5: Surface finish → PASS ✓
Progress: 80% (4/5 passed)
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