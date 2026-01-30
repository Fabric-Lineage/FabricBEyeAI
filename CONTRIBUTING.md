# Contributing to PowerBEye

Thank you for your interest in contributing to PowerBEye! This guide will help you understand our development workflow and coding standards.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)

## Getting Started

### Prerequisites
- Node.js 14+ and npm 6+
- Angular CLI: `npm install -g @angular/cli`
- Git
- Code editor (VS Code recommended)

### Setup
```bash
# Clone repository
git clone https://github.com/[org]/PowerBEye.git
cd PowerBEye

# Install dependencies
npm install

# Start development server
ng serve

# Navigate to http://localhost:4200
```

### Project Structure
Read `README_DEVELOPERS.md` for comprehensive architecture documentation.

## Development Workflow

### Branching Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features (e.g., `feature/kql-database-support`)
- `fix/*` - Bug fixes (e.g., `fix/domain-boundary-rendering`)
- `refactor/*` - Code improvements (e.g., `refactor/extract-graph-utils`)

### Creating a Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### Committing Changes
We follow **Conventional Commits** specification:

```bash
# Format: <type>(<scope>): <subject>

feat(graph): add KQL Database node type
fix(focus-mode): resolve camera zoom calculation
refactor(utils): extract color helpers to graph-utils
docs(readme): update installation instructions
style(lint): fix indentation in home-container
test(scan): add unit tests for scanner service
chore(deps): upgrade Angular to v15
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code restructuring without behavior change
- `docs` - Documentation only
- `style` - Formatting, linting
- `test` - Adding or updating tests
- `chore` - Maintenance (dependencies, build config)

### Before Committing
Run the pre-commit checklist:
```bash
# Lint code
ng lint

# Run tests
ng test

# Build for production
ng build --prod

# Test demo mode
# 1. Start ng serve
# 2. Click "Load Demo Data"
# 3. Verify graph renders with 50+ workspaces
```

## Coding Standards

### TypeScript

#### Type Safety
```typescript
// ✅ Good: Explicit types
public getNodeColor(nodeType: NodeType): string {
  return COLOR_FABRIC_GREEN;
}

// ❌ Bad: Implicit any
public getNodeColor(nodeType) {
  return '#107C10';
}
```

#### Constants
```typescript
// ✅ Good: Named constants with SCREAMING_SNAKE_CASE
const WORKSPACE_NODE_VAL = 15;
const CAMERA_ZOOM_DURATION_MS = 1000;

// ❌ Bad: Magic numbers
node.val = 15;
setTimeout(() => {}, 1000);
```

#### Naming Conventions
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Properties/Variables**: `camelCase`
- **Classes/Interfaces**: `PascalCase`
- **Private methods**: Prefix with `private`
- **Booleans**: Prefix with `is`, `has`, `can`, `should`

```typescript
// ✅ Good naming
private readonly MAX_PARALLEL_API_CALLS = 16;
public isScanInProgress: boolean;
private hasValidToken: boolean;
public canStartScan: boolean;

// ❌ Bad naming
private maxParallelBEcalls = 16;
public scanInProgress: boolean;
public token: boolean;
```

#### Documentation

Every public method MUST have JSDoc comments:

```typescript
/**
 * Initiates a tenant-wide scan of Microsoft Fabric workspaces
 * 
 * This method triggers the Scanner API to fetch workspace metadata,
 * artifacts, and lineage information. Requires tenant admin permissions.
 * Shows a progress dialog during scanning.
 * 
 * @throws {Error} 401 - Not logged in as tenant admin
 * @throws {Error} 403 - Invalid or expired token
 */
public async startScan(): Promise<void> {
  // Implementation
}
```

**JSDoc Template:**
```typescript
/**
 * Brief one-line description
 * 
 * Detailed explanation of what the method does, including:
 * - Key behaviors
 * - Side effects
 * - Special considerations
 * 
 * @param paramName - Description of parameter
 * @param optionalParam - Description (optional)
 * @returns Description of return value
 * @throws {ErrorType} Description of when thrown
 */
```

#### Property Documentation
```typescript
// ✅ Good: Descriptive comments for complex properties
/** 
 * Graph nodes (workspaces and artifacts)
 * Updated by loadLineage() on scan completion or file import
 */
public nodes: Node[] = [];

/** 
 * Map storing THREE.js boundary sphere objects for each domain
 * Used to show/hide domain boundaries based on filter state
 * Key: domainId, Value: Array of THREE.Object3D (sphere + label)
 */
private domainBoundaryObjects: Map<string, THREE.Object3D[]> = new Map();

// ❌ Bad: No context
public nodes = [];
private boundaryObjects = new Map();
```

### Angular Specific

#### Component Structure
Organize code in logical sections with clear separators:

```typescript
@Component({...})
export class HomeContainerComponent implements OnInit, OnDestroy {

  // =================================================================
  // CONSTANTS
  // =================================================================
  
  private readonly WORKSPACE_LIMIT = 100;
  
  // =================================================================
  // CORE DATA PROPERTIES
  // =================================================================
  
  public nodes: Node[] = [];
  public links: Link[] = [];
  
  // =================================================================
  // LIFECYCLE METHODS
  // =================================================================
  
  public ngOnInit(): void { }
  
  // =================================================================
  // PUBLIC API METHODS
  // =================================================================
  
  public startScan(): Promise<void> { }
  
  // =================================================================
  // PRIVATE HELPER METHODS
  // =================================================================
  
  private loadLineage(workspaces): void { }
}
```

#### Service Injection
```typescript
// ✅ Good: Descriptive parameter names
constructor(
  private readonly dialog: MatDialog,
  private readonly proxy: HomeProxyService,
  private readonly scanService: ScanService
) {}

// ❌ Bad: Generic names
constructor(
  private dialog: any,
  private http: any
) {}
```

### HTML Templates

```html
<!-- ✅ Good: Readable, semantic -->
<button
  mat-raised-button
  color="primary"
  [disabled]="!canStartScan"
  (click)="startScan()"
  class="scan-button">
  Start Tenant Scan
</button>

<!-- ❌ Bad: Inline styles, unclear purpose -->
<button
  style="color:red"
  [disabled]="!x"
  (click)="scan()">
  Scan
</button>
```

### CSS/LESS

```less
// ✅ Good: BEM-style naming, organized
.home-container {
  width: 100%;
  height: 100vh;
  
  &__graph {
    position: absolute;
    top: 0;
    left: 0;
  }
  
  &__toolbar {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
  }
}

// ❌ Bad: Generic names, magic values
.container {
  width: 1200px;  // Not responsive
}
.btn {
  margin: 10px 5px 3px 15px;  // Unclear spacing
}
```

## Testing Guidelines

### Unit Tests
- Test coverage target: **>70%** for core logic
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

```typescript
describe('HomeContainerComponent', () => {
  let component: HomeContainerComponent;
  let fixture: ComponentFixture<HomeContainerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HomeContainerComponent],
      imports: [MaterialModule, HttpClientTestingModule]
    });
    fixture = TestBed.createComponent(HomeContainerComponent);
    component = fixture.componentInstance;
  });

  it('should create workspace nodes from scanner data', () => {
    // Arrange
    const mockWorkspaces = [
      { id: 'ws-1', name: 'Test WS', state: 'Active', domainId: 'domain-1' }
    ];

    // Act
    component.loadLineage(mockWorkspaces);

    // Assert
    expect(component.nodes.length).toBe(1);
    expect(component.nodes[0].type).toBe(NodeType.Workspace);
  });

  it('should throw error when scanning without tenant admin', async () => {
    // Arrange
    component.canStartScan = false;

    // Act & Assert
    await expectAsync(component.startScan()).toBeRejected();
  });
});
```

### Integration Tests
- Test critical user workflows
- Use realistic mock data
- Verify UI interactions

```typescript
describe('Focus Mode Integration', () => {
  it('should isolate domain when workspace clicked in focus mode', fakeAsync(() => {
    // Arrange
    component.isolateMode = true;
    component.loadDemoMode();
    const workspaceNode = component.nodes.find(n => n.type === NodeType.Workspace);

    // Act
    component.onNodeClick(workspaceNode);
    tick(CAMERA_ZOOM_DURATION_MS);

    // Assert
    expect(component.focusedDomain).toBe(workspaceNode.metadata.domainId);
    expect(component.Graph.scene().fog).toBeDefined();
  }));
});
```

## Documentation

### Code Comments

**When to comment:**
- Complex algorithms or formulas
- Workarounds for known issues
- Critical business logic
- Non-obvious decisions

```typescript
// ✅ Good: Explains WHY
// Lakehouse nodes have TWO representations in Scanner API:
// 1. As a Datamart with type='Lakehouse'
// 2. As a SQL Analytics Endpoint (implicit)
// We detect the first and create both nodes for accurate lineage
if (datamart.type === 'Lakehouse') {
  nodeType = NodeType.Lakehouse;
  // TODO: Create SQL Analytics Endpoint node
}

// ❌ Bad: Explains WHAT (obvious from code)
// Loop through workspaces
for (const workspace of workspaces) {
  // ...
}
```

**When NOT to comment:**
- Self-explanatory code
- Restating the code
- Outdated information

### README Updates
When adding features, update relevant documentation:
- `README.md` - User-facing features
- `README_DEVELOPERS.md` - Architecture changes
- `SUPPORTED_ARTIFACTS.md` - New artifact types
- `VISUALIZATION_IMPROVEMENTS.md` - Navigation features

### JSDoc for APIs
Public APIs exposed to other components must have complete JSDoc:

```typescript
/**
 * Exports the current graph state as JSON
 * 
 * Creates a downloadable file containing:
 * - All nodes (workspaces + artifacts)
 * - All links (contains, uses, cross-workspace)
 * - Domain assignments
 * - Endorsement metadata
 * 
 * Format matches Scanner API WorkspaceInfoResponse for re-import compatibility.
 * 
 * @example
 * ```typescript
 * component.exportToJSON();
 * // Downloads: "powereye-export-2024-01-15.json"
 * ```
 */
public exportToJSON(): void {
  // Implementation
}
```

## Pull Request Process

### Before Creating PR

**Checklist:**
- [ ] Feature branch is up to date with `main`
- [ ] Code follows style guide
- [ ] All tests pass (`ng test`)
- [ ] Linting passes (`ng lint`)
- [ ] Production build succeeds (`ng build --prod`)
- [ ] Demo mode tested manually
- [ ] JSDoc added to new public methods
- [ ] README updated if needed
- [ ] No console.log() or commented code
- [ ] No TODOs unless documented in issue tracker

### PR Template

```markdown
## Description
Brief summary of changes (1-2 sentences)

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Related Issues
Closes #123
Relates to #456

## Changes Made
- Added support for KQL Database artifact type
- Created kql-database.svg icon asset
- Updated NodeType enum and color mappings
- Added test coverage for KQL parsing

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Demo mode verified
- [ ] Performance tested with 100+ workspaces

## Screenshots (if applicable)
[Attach before/after screenshots for UI changes]

## Checklist
- [ ] Code follows project style guidelines
- [ ] JSDoc comments added
- [ ] Tests pass locally
- [ ] Linting passes
- [ ] README updated (if needed)
```

### Review Process

1. **Automated Checks**: CI/CD runs tests and linting
2. **Code Review**: Maintainer reviews code quality and design
3. **Testing**: Reviewer tests feature manually
4. **Approval**: Two approvals required for merge
5. **Merge**: Squash and merge to `main`

### Review Criteria

Reviewers check for:
- **Correctness**: Does it work as intended?
- **Code Quality**: Follows standards, well-documented
- **Testing**: Adequate test coverage
- **Performance**: No obvious bottlenecks
- **Security**: No vulnerabilities introduced
- **Documentation**: README/JSDoc updated

## Common Pitfalls

### ❌ DON'T

```typescript
// Magic numbers
node.val = 15;
setTimeout(() => {}, 1000);

// No error handling
const data = JSON.parse(file);

// Mutable default parameters
function process(items = []) {
  items.push('new');  // Mutates default!
}

// Missing types
function calculate(a, b) {
  return a + b;
}

// No documentation
public complexMethod(x, y, z) {
  // 50 lines of undocumented logic
}
```

### ✅ DO

```typescript
// Named constants
const WORKSPACE_NODE_VAL = 15;
const POLLING_INTERVAL_MS = 1000;

// Proper error handling
try {
  const data = JSON.parse(file);
} catch (error) {
  this.dialog.open(ErrorDialogComponent, {
    data: { title: 'Parse Error', errorMessage: error.message }
  });
}

// Immutable defaults
function process(items: string[] = []): string[] {
  return [...items, 'new'];
}

// Explicit types
function calculate(a: number, b: number): number {
  return a + b;
}

// Comprehensive documentation
/**
 * Calculates bounding sphere radius for domain nodes
 * Uses maximum distance from center with padding multiplier
 * 
 * @param nodes - Domain workspace nodes
 * @param center - Domain center coordinates
 * @returns Radius in 3D units
 */
private calculateDomainRadius(nodes: Node[], center: Vector3): number {
  // Implementation with clear logic
}
```

## Getting Help

- **Issues**: Check [GitHub Issues](https://github.com/[org]/PowerBEye/issues)
- **Discussions**: Use [GitHub Discussions](https://github.com/[org]/PowerBEye/discussions)
- **Documentation**: Read `README_DEVELOPERS.md`
- **Code Examples**: Check existing components for patterns

## Code of Conduct

- Be respectful and constructive
- Focus on the code, not the person
- Help newcomers learn and contribute
- Follow project standards consistently

---

**Thank you for contributing to PowerBEye!** 🎉

Your contributions help make Microsoft Fabric visualization better for everyone.
