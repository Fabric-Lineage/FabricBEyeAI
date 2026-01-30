# PowerBEye Code Structure - Refactoring Guide

## Component Organization

### HomeContainerComponent Structure

```
├── IMPORTS (Lines 1-50)
├── CONSTANTS (Lines 51-54)
├── COMPONENT CLASS
│   ├── CORE DATA PROPERTIES (Lines 70-96)
│   ├── UI STATE PROPERTIES (Lines 98-112)
│   ├── ADVANCED NAVIGATION FEATURES (Lines 114-129)
│   ├── FILTER PROPERTIES (Lines 131-146)
│   ├── PRIVATE PROPERTIES (Lines 148-165)
│   ├── LIFECYCLE METHODS (Lines 170-198)
│   ├── SCANNING METHODS (Lines 200-250)
│   ├── FILE HANDLING METHODS (Lines 252-290)
│   ├── DEMO MODE METHODS (Lines 292-320)
│   ├── GRAPH VISUALIZATION METHODS (Lines 322-700)
│   ├── NODE STYLING METHODS (Lines 702-850)
│   ├── ADVANCED NAVIGATION METHODS (Lines 852-1050)
│   ├── FILTER & SEARCH METHODS (Lines 1052-1200)
│   ├── EXPORT METHODS (Lines 1202-1250)
│   └── UTILITY METHODS (Lines 1252-1525)
```

## Key Refactoring Actions

### ✅ Completed
1. Removed unused `MOCK_WORKSPACES` import
2. Reorganized imports by category (3D, Services, Models, Data, Dialogs)
3. Renamed constants to SCREAMING_SNAKE_CASE
4. Added comprehensive JSDoc comments for all properties
5. Organized properties into logical sections

### 📋 To Do
1. Add section headers for all method groups
2. Extract reusable functions to utility file
3. Add JSDoc for all public methods
4. Remove commented-out code
5. Simplify complex conditionals
6. Extract magic numbers to constants

## Method Documentation Template

```typescript
/**
 * Brief one-line description
 * 
 * Longer description if needed, explaining:
 * - What the method does
 * - When it's called
 * - Side effects
 * 
 * @param paramName - Description
 * @returns Description
 */
```

## Constants to Extract

```typescript
// Graph Configuration
const NODE_SIZE_MULTIPLIER = 8;
const WORKSPACE_NODE_SIZE = 15;
const ARTIFACT_NODE_SIZE = 4;
const LINK_CURVATURE_CURVED = 0.25;
const LINK_OPACITY_DEFAULT = 0.5;

// Domain Clustering
const DOMAIN_CLUSTER_STRENGTH = 0.3;
const DOMAIN_BOUNDARY_PADDING = 1.5;
const DOMAIN_BOUNDARY_OPACITY = 0.08;

// Colors (Microsoft Fabric)
const COLOR_FABRIC_GREEN = '#107C10';
const COLOR_FABRIC_BLUE = '#0078D4';
const COLOR_CERTIFIED_GOLD = '#FFD700';

// Timing
const CAMERA_ZOOM_DURATION = 1000; // ms
const GRAPH_SETTLE_DELAY = 3000; // ms
```

## Files to Review

1. ✅ `home-container.component.ts` - Main component
2. ⏳ `scanner-mock-data.ts` - Mock data
3. ⏳ `scanner-api.types.ts` - Type definitions
4. ⏳ `graphModels.ts` - Graph models
5. ⏳ `home-container.component.html` - Template
6. ⏳ `home-container.component.less` - Styles
7. ❌ `mock-data.ts` - UNUSED, can be deleted

## Dead Code to Remove

- Commented TODO statements (replaced with proper error handling)
- Old unused MOCK_WORKSPACES import
- Legacy selectedNodeTypes and selectedDomains (if not used elsewhere)

## Simplification Opportunities

1. **Complex if-else chains** → Extract to lookup maps/objects
2. **Repeated color calculations** → Cache or use lookup table
3. **Long parameter lists** → Use configuration objects
4. **Deeply nested callbacks** → Extract to named functions
