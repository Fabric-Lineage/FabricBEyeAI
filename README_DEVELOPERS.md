# PowerBEye Developer Guide

## Overview

PowerBEye is a **3D interactive visualization tool** for Microsoft Fabric workspaces, providing comprehensive lineage tracking and relationship mapping across the entire Fabric ecosystem.

### Key Features
- **23 Artifact Types Supported** - Complete Fabric catalog coverage
- **Domain-Based Clustering** - Visual organization by Microsoft Fabric domains
- **Advanced Navigation** - Focus Mode, filtering, search, and fog effects
- **Official Microsoft Design** - Authentic badges, colors, and icons
- **Scanner API Integration** - Direct tenant scanning or JSON file import
- **Interactive 3D Graph** - Powered by 3d-force-graph and Three.js

## Architecture

### Technology Stack
- **Framework**: Angular 14+
- **3D Rendering**: Three.js + 3d-force-graph
- **Language**: TypeScript 4.5+
- **UI Components**: Angular Material
- **HTTP**: RxJS Observables
- **Build**: Angular CLI

### Core Components

```
src/app/home/
├── components/
│   └── home-container/           # Main 3D visualization component (1600+ lines)
├── services/
│   ├── home-proxy.service.ts     # Scanner API HTTP client
│   └── scan.service.ts           # Scan state management
├── models/
│   ├── scanner-api.types.ts      # TypeScript interfaces for Fabric Scanner API
│   └── graphModels.ts            # Graph node and link models
├── data/
│   └── scanner-mock-data.ts      # Demo data (50+ workspaces, 15 domains)
└── utils/
    └── graph-utils.ts            # Reusable graph utilities
```

### Data Flow

```
Scanner API → home-proxy.service → scan.service → home-container → 3D Graph
                                                        ↓
                                                  Domain Clustering
                                                        ↓
                                                  Focus/Filter UI
```

## Microsoft Fabric Integration

### Scanner API v1.0
PowerBEye integrates with the **Microsoft Fabric Admin API** to scan tenant workspaces:

```typescript
GET /v1.0/myorg/admin/workspaces/scanResult/{scanId}

Response: {
  workspaces: WorkspaceInfo[];
  datasourceInstances: DatasourceInstance[];
}
```

### Supported Artifact Types (23 Total)

**Traditional Power BI:**
- Workspace, Report, Paginated Report, Dashboard, Semantic Model (Dataset)

**Data Integration:**
- Dataflow, Dataflow Gen2, Pipeline

**Data Engineering:**
- Lakehouse, Data Warehouse, SQL Analytics Endpoint, Notebook, Spark Job Definition

**Real-Time Analytics:**
- Eventstream, Eventhouse, KQL Database, KQL Queryset

**AI/ML:**
- ML Model, ML Experiment

**Other:**
- Datamart, App

### Domain Architecture
Domains are **metadata containers**, NOT graph nodes:
- Workspaces belong to domains via `workspace.domainId`
- Domains apply custom THREE.js force for spatial clustering
- Visual boundaries use transparent spheres with wireframe

### Endorsement System
Official Microsoft endorsement badges:
- **Certified** - Gold medal with ribbon (badge-certified.svg)
- **Promoted** - Green checkmark in circle (badge-promoted.svg)
- **None** - No badge displayed

## Key Constants

### Graph Configuration
```typescript
const WORKSPACE_LIMIT = 100;              // Max workspaces to load
const MAX_PARALLEL_API_CALLS = 16;        // Concurrent API requests
const NODE_SIZE_MULTIPLIER = 8;           // Base node sizing
const WORKSPACE_NODE_VAL = 15;            // Workspace node size
const ARTIFACT_NODE_VAL = 4;              // Artifact node size
```

### Domain Clustering
```typescript
const DOMAIN_CLUSTER_STRENGTH = 0.3;                 // Force strength
const DOMAIN_BOUNDARY_PADDING_MULTIPLIER = 1.5;      // Sphere padding
const DOMAIN_BOUNDARY_SEGMENTS = 32;                 // Sphere detail
const DOMAIN_BOUNDARY_OPACITY = 0.15;                // Transparency
```

### Animation & Camera
```typescript
const CAMERA_ZOOM_DURATION_MS = 1000;     // Focus mode zoom time
const AUTO_ROTATE_SPEED = 0.3;            // Background rotation
```

### Colors (Microsoft Fabric Design)
```typescript
const COLOR_FABRIC_GREEN = '#107C10';     // Primary brand color
const COLOR_FABRIC_BLUE = '#0078D4';      // Secondary brand
const COLOR_CERTIFIED_GOLD = '#FFD700';   // Endorsement badge
const COLOR_FOCUS_MODE = '#107C10';       // Clickable workspaces
const COLOR_ISOLATED = '#FFD700';         // Isolated domain
```

## Navigation Features

### Focus Mode
**Purpose**: Isolate and explore individual domains

**Workflow:**
1. Click any workspace node (turns GREEN)
2. Domain isolates with gold highlight
3. Camera auto-zooms to domain center
4. Click workspace again or "Clear Focus" to exit

**Implementation:** Lines ~1120-1200 in home-container.component.ts

### Filter Panel
**Controls:**
- **Domains**: Show/hide specific domains
- **Artifact Types**: Toggle visibility per type
- **Link Types**: Show Contains, Uses, CrossWorkspace
- **Opacity**: Adjust non-filtered node transparency

**Note:** Filters hide domain boundaries and links properly using `nodeVisibility()` and `linkVisibility()`

### Search
Real-time search across workspace and artifact names with instant graph filtering.

### Fog Effect
Optional THREE.FogExp2 for depth perception in large graphs.

### Pause/Resume
Freeze physics simulation to inspect static layouts or improve performance.

## Development Guide

### Prerequisites
```bash
node --version  # v14+ required
npm --version   # v6+ required
```

### Installation
```bash
npm install
```

### Development Server
```bash
ng serve
# Navigate to http://localhost:4200
```

### Build
```bash
ng build --prod
# Output: docs/ folder (GitHub Pages ready)
```

### Testing
```bash
ng test          # Karma unit tests
ng e2e           # Protractor e2e tests
```

## Code Organization

### home-container.component.ts Structure

**Property Sections** (Lines 90-190):
- Core Data (nodes, links, domains, workspaces)
- UI State (scanning, loading, errors)
- Navigation Features (focus mode, filters, search)
- Filter Controls (checkboxes, opacity)
- Private/Internal (THREE.js references, caches)

**Method Groups**:
- **Lifecycle** (ngOnInit, ngOnDestroy)
- **Scanning** (startScan, polling, progress)
- **File Handling** (JSON import)
- **Demo Mode** (mock data loading)
- **Node Styling** (colors, icons, badges)
- **Graph Visualization** (loadLineage - CORE METHOD)
- **Advanced Navigation** (Focus Mode, filters, search)
- **Export** (JSON, CSV)
- **Utilities** (sleep, color helpers)

### Adding New Artifact Types

**Step 1:** Add to `NodeType` enum (scanner-api.types.ts)
```typescript
export enum NodeType {
  // ... existing types
  NewArtifactType = 'NewArtifactType'
}
```

**Step 2:** Add color mapping (home-container.component.ts)
```typescript
private getNodeColor(nodeType: NodeType): string {
  switch (nodeType) {
    case NodeType.NewArtifactType:
      return '#HEX_COLOR';  // Choose from Fabric palette
```

**Step 3:** Add icon loading (getNodeTypeImage method)
```typescript
case NodeType.NewArtifactType:
  texture = loader.load('assets/new-artifact.svg');
  break;
```

**Step 4:** Add to loadLineage processing
```typescript
// In loadLineage method, add artifact parsing
for (const newArtifact of workspace.newArtifacts ?? []) {
  const node: Node = {
    id: newArtifact.id,
    name: newArtifact.name,
    type: NodeType.NewArtifactType,
    workspaceId: workspace.id,
    metadata: { /* ... */ }
  };
  this.nodes.push(node);
  this.links.push({ source: workspaceNode.id, target: node.id, type: LinkType.Contains });
}
```

**Step 5:** Add SVG icon to `/src/assets/`

**Step 6:** Update SUPPORTED_ARTIFACTS.md documentation

### Domain Management

Domains are created from workspace metadata:
```typescript
// Workspace domain assignment
const workspaceNode: Node = {
  // ...
  metadata: {
    domainId: workspace.domainId,
    domainName: this.domains.find(d => d.id === workspace.domainId)?.name
  }
};
```

Custom clustering force:
```typescript
this.Graph.d3Force('domain', (alpha) => {
  for (const node of this.nodes) {
    if (node.type !== NodeType.Workspace) continue;
    const domain = this.domains.find(d => d.id === node.metadata?.domainId);
    if (domain?.center) {
      node.vx += (domain.center.x - node.x) * DOMAIN_CLUSTER_STRENGTH * alpha;
      node.vy += (domain.center.y - node.y) * DOMAIN_CLUSTER_STRENGTH * alpha;
      node.vz += (domain.center.z - node.z) * DOMAIN_CLUSTER_STRENGTH * alpha;
    }
  }
});
```

## Common Tasks

### Load Demo Data
```typescript
// In component
public loadDemoMode(): void {
  this.domains = MOCK_DOMAINS;
  this.loadLineage(MOCK_SCANNER_RESPONSE.workspaces);
}
```

### Import JSON File
User clicks "Load JSON" → file input → `onFileAdded()` → `loadLineage()`

### Tenant Scan
Requires tenant admin + valid token:
```typescript
public async startScan(): Promise<void> {
  // Shows progress dialog
  // Polls Scanner API every 2 seconds
  // Loads results into graph
}
```

## Troubleshooting

### Graph Not Rendering
- Check browser console for Three.js errors
- Verify `#3d-graph` element exists in DOM
- Ensure data loaded: `console.log(this.nodes.length)`

### Focus Mode Not Working
- Workspaces should turn GREEN when hovering in focus mode
- Click workspace to isolate domain
- Check `isolateMode` property is true

### Filters Not Hiding Boundaries
- Verify `domainBoundaryObjects` Map is populated
- Check `updateDomainBoundaries()` called after filtering
- Domain boundaries should set `.visible = false`

### Performance Issues
- Limit workspaces with `WORKSPACE_LIMIT`
- Use Pause feature during inspection
- Enable fog to reduce far-distance rendering
- Consider increasing `MAX_PARALLEL_API_CALLS` for faster scanning

## Contributing

### Code Style
- **TypeScript**: Strict mode, explicit types
- **Methods**: JSDoc comments with @param/@returns
- **Constants**: SCREAMING_SNAKE_CASE
- **Properties**: camelCase with JSDoc descriptions
- **Imports**: Organized by category (3D, Services, Models, Data)

### Before Committing
1. Run `ng lint` - no errors
2. Run `ng test` - all tests pass
3. Build succeeds: `ng build --prod`
4. Test demo mode works
5. Update documentation if adding features

### Pull Request Checklist
- [ ] Feature branch from `main`
- [ ] Descriptive commit messages
- [ ] JSDoc added to new methods
- [ ] Constants extracted (no magic numbers)
- [ ] SUPPORTED_ARTIFACTS.md updated if needed
- [ ] README updated if architecture changed
- [ ] Screenshots for UI changes

## Resources

### Official Documentation
- [Microsoft Fabric Scanner API](https://learn.microsoft.com/en-us/rest/api/fabric/admin/workspaces)
- [Microsoft Fabric Domains](https://learn.microsoft.com/en-us/fabric/governance/domains)
- [3d-force-graph Library](https://github.com/vasturiano/3d-force-graph)
- [Three.js Documentation](https://threejs.org/docs/)

### Project Documentation
- `SUPPORTED_ARTIFACTS.md` - Complete artifact type reference
- `VISUALIZATION_IMPROVEMENTS.md` - Navigation features guide
- `REFACTORING_GUIDE.md` - Code structure reference

## License

See `LICENSE` file for details.

## Credits

Original PowerBEye created by Assaf Shemesh and contributors.
Microsoft Fabric migration and advanced features added in 2024.
