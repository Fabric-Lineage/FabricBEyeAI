# PowerBEye: Microsoft Fabric Migration & Enhancement Plan

## Executive Summary
This document outlines the plan to evolve PowerBEye from a Power BI lineage tool to a comprehensive **Microsoft Fabric tenant governance and lineage platform**. The goal is to visualize and manage all Fabric artifacts across a tenant with proper lineage tracking.

---

## 1. Current State Analysis

### What We Have (As of January 2026)
- ✅ Angular 17 modern framework
- ✅ 3D Force-directed graph visualization (3d-force-graph v1.73)
- ✅ Forest structure for multiple workspace clusters
- ✅ Basic Power BI artifact support: Reports, Dashboards, Semantic Models, Dataflows
- ✅ Cross-workspace lineage tracking
- ✅ Search and filter capabilities
- ✅ Export to PNG/JSON
- ✅ Microsoft Fabric green branding (#107C10)

### What's Missing for Full Fabric Support
- ❌ Expanded artifact type coverage (only 4 Power BI types supported vs 20+ Fabric types)
- ❌ Scanner API integration (currently using mock data)
- ❌ Real-time or scheduled scanning
- ❌ Dataflow Gen2 distinction from legacy Dataflow Gen1
- ❌ Lakehouse → SQL Analytics Endpoint relationship
- ❌ ML Model lineage tracking
- ❌ KQL Database and Eventhouse support
- ❌ App packaging visualization
- ❌ Sensitivity labels and endorsement display
- ❌ User permissions and access rights visualization

---

## 2. Microsoft Fabric Artifact Types

### Current Scanner API Response Structure
Based on the [WorkspaceInfo GetScanResult API](https://learn.microsoft.com/en-us/rest/api/power-bi/admin/workspace-info-get-scan-result), the response includes:

```typescript
interface WorkspaceInfoResponse {
  workspaces: WorkspaceInfo[];
  datasourceInstances: Datasource[];
  misconfiguredDatasourceInstances: Datasource[];
}

interface WorkspaceInfo {
  id: string;
  name: string;
  type: string;
  state: string;
  isOnDedicatedCapacity: boolean;
  capacityId?: string;
  
  // Artifact arrays
  reports: WorkspaceInfoReport[];
  dashboards: WorkspaceInfoDashboard[];
  datasets: WorkspaceInfoDataset[];  // Now "Semantic Models" in Fabric
  dataflows: WorkspaceInfoDataflow[];
  datamarts: WorkspaceInfoDatamart[];
  
  users: GroupUser[];
}
```

### Artifact Types Mapping

| Scanner API Property | Fabric UI Name | NodeType Enum | Status |
|---------------------|----------------|---------------|---------|
| `reports` | Report | `Report` | ✅ Implemented |
| `reports` (paginated) | Paginated Report | `PaginatedReport` | ✅ Added |
| `dashboards` | Dashboard | `Dashboard` | ✅ Implemented |
| `datasets` | Semantic Model | `SemanticModel` | ✅ Implemented |
| `dataflows` | Dataflow Gen2 | `DataflowGen2` | ✅ Added |
| `datamarts` | Datamart | `Datamart` | ✅ Added |
| N/A (in datasets) | Lakehouse | `Lakehouse` | ⚠️ Partial |
| N/A | SQL Analytics Endpoint | `SQLAnalyticsEndpoint` | ⚠️ Needs Detection |
| N/A | Data Warehouse | `DataWarehouse` | ⚠️ Needs Detection |
| N/A | Notebook | `Notebook` | ⚠️ Not in Scanner API |
| N/A | Pipeline | `Pipeline` | ⚠️ Not in Scanner API |
| N/A | Eventstream | `Eventstream` | ⚠️ Not in Scanner API |
| N/A | Eventhouse | `Eventhouse` | ⚠️ Not in Scanner API |
| N/A | KQL Database | `KQLDatabase` | ⚠️ Not in Scanner API |
| N/A | KQL Queryset | `KQLQueryset` | ⚠️ Not in Scanner API |
| N/A | ML Model | `MLModel` | ⚠️ Not in Scanner API |
| N/A | ML Experiment | `MLExperiment` | ⚠️ Not in Scanner API |
| N/A | Spark Job Definition | `SparkJobDefinition` | ⚠️ Not in Scanner API |

### Critical Findings ⚠️

**The Scanner API has NOT been updated for full Fabric support!**

- Scanner API still uses "datasets" terminology (not "semantic models")
- No native support for Lakehouse, Warehouse, Notebooks, Pipelines, Eventstreams, KQL, ML artifacts
- Datamarts are available but rare in response
- New artifact types likely require **additional Fabric REST APIs**

---

## 3. Detection Strategy for Missing Artifact Types

### Option A: Infer from Datamart Type Field
```typescript
// From datamartType enum in Scanner API:
enum DatamartType {
  Unset = 0,
  Ignore = 1,
  Sql = 2,        // Traditional Datamart
  Lakehouse = 3,  // ← Lakehouse detected!
  Dataverse = 4,
  Datawarehouse = 5  // ← Warehouse detected!
}
```

**Implementation:**
```typescript
if (datamart.type === 'Lakehouse') {
  nodeType = NodeType.Lakehouse;
} else if (datamart.type === 'Datawarehouse') {
  nodeType = NodeType.DataWarehouse;
} else {
  nodeType = NodeType.Datamart;
}
```

### Option B: Use Dedicated Fabric REST APIs
Microsoft Fabric has separate REST API endpoints (outside Scanner API):

1. **Lakehouse API**: `GET /v1/workspaces/{workspaceId}/lakehouses`
2. **Warehouse API**: `GET /v1/workspaces/{workspaceId}/warehouses`
3. **Notebook API**: `GET /v1/workspaces/{workspaceId}/notebooks`
4. **Pipeline API**: Use Data Factory APIs
5. **Eventstream API**: Real-Time Intelligence APIs
6. **ML Model API**: `GET /v1/workspaces/{workspaceId}/mlModels`

**Trade-offs:**
- ✅ Complete artifact coverage
- ✅ Accurate lineage data
- ❌ Requires multiple API calls per workspace
- ❌ Potential rate limiting (500 requests/hour for Scanner API)
- ❌ More complex authentication

### Option C: Hybrid Approach (Recommended)
1. Use Scanner API for core Power BI artifacts (reports, dashboards, semantic models, dataflows)
2. Detect Lakehouse/Warehouse from `datamarts` array using `type` field
3. Make targeted Fabric API calls for Real-Time Intelligence and Data Science artifacts
4. Cache results to minimize API calls

---

## 4. Implementation Phases

### Phase 1: Complete Scanner API Integration ✅ (Priority: HIGH)
**Goal:** Replace mock data with live Scanner API calls

#### Tasks:
1. **Authentication Setup**
   - Service Principal registration in Azure AD
   - Required permissions: `Tenant.Read.All` or `Tenant.ReadWrite.All`
   - Store credentials securely (environment variables or Azure Key Vault)

2. **Scanner Flow Implementation**
   ```typescript
   async scanTenant(): Promise<void> {
     // 1. Get modified workspaces
     const modifiedWorkspaces = await this.getModifiedWorkspaces();
     
     // 2. Trigger scan for up to 100 workspaces at a time (16 concurrent)
     const scanId = await this.postWorkspaceInfo(modifiedWorkspaces.slice(0, 100));
     
     // 3. Poll scan status
     let status = await this.getScanStatus(scanId);
     while (status !== 'Succeeded') {
       await this.delay(5000);
       status = await this.getScanStatus(scanId);
     }
     
     // 4. Retrieve scan result
     const result = await this.getScanResult(scanId);
     this.loadLineage(result.workspaces);
   }
   ```

3. **Error Handling**
   - Handle 429 rate limiting (500 requests/hour max)
   - Retry logic with exponential backoff
   - Show user-friendly progress indicators

4. **Configuration**
   - Environment selector (Dev/Test/Prod tenant)
   - Partial scan vs full tenant scan
   - Scheduled refresh intervals

**Estimated Effort:** 3-5 days

---

### Phase 2: Enhanced Artifact Detection (Priority: MEDIUM)
**Goal:** Detect all Fabric artifact types

#### Tasks:
1. **Update Parser for Datamart Types**
   ```typescript
   // In loadLineage() function
   for (const datamart of workspace.datamarts || []) {
     let nodeType: NodeType;
     
     switch (datamart.type) {
       case 'Lakehouse':
         nodeType = NodeType.Lakehouse;
         // Also create SQL Analytics Endpoint node
         this.createSQLEndpoint(datamart, workspace);
         break;
       case 'Datawarehouse':
         nodeType = NodeType.DataWarehouse;
         break;
       default:
         nodeType = NodeType.Datamart;
     }
     
     this.nodes.push({
       id: datamart.id,
       name: datamart.name,
       type: nodeType,
       workspaceId: workspace.id
     });
   }
   ```

2. **Paginated Report Detection**
   ```typescript
   if (report.reportType === 'PaginatedReport') {
     nodeType = NodeType.PaginatedReport;
   }
   ```

3. **Dataflow Gen2 Detection**
   - Check `dataflow.modelUrl` presence (Gen2 has model.json)
   - Or add user preference to treat all as Gen2 (since Gen1 is deprecated)

**Estimated Effort:** 2-3 days

---

### Phase 3: Extended Fabric API Integration (Priority: LOW)
**Goal:** Full coverage of Data Science, Real-Time Intelligence artifacts

#### Tasks:
1. **Implement Fabric API Client**
   ```typescript
   class FabricApiClient {
     async getNotebooks(workspaceId: string): Promise<Notebook[]> {
       return this.get(`/v1/workspaces/${workspaceId}/notebooks`);
     }
     
     async getEventstreams(workspaceId: string): Promise<Eventstream[]> {
       return this.get(`/v1/workspaces/${workspaceId}/eventstreams`);
     }
     
     async getMLModels(workspaceId: string): Promise<MLModel[]> {
       return this.get(`/v1/workspaces/${workspaceId}/mlModels`);
     }
   }
   ```

2. **Parallel Fetching**
   - Fetch Scanner API + Fabric APIs concurrently
   - Merge results by workspace
   - Handle partial failures gracefully

3. **Rate Limit Management**
   - Token bucket algorithm
   - Request queuing
   - Workspace prioritization

**Estimated Effort:** 5-7 days

---

### Phase 4: Advanced Lineage Tracking (Priority: HIGH)
**Goal:** Show complete data flow across Fabric

#### Current Lineage Support (from Scanner API):
- ✅ `dataset.upstreamDataflows` - Datasets sourced from Dataflows
- ✅ `dataset.upstreamDatamarts` - Datasets sourced from Datamarts
- ✅ `dataset.upstreamDatasets` - Datasets sourced from other Datasets
- ✅ `dataflow.upstreamDataflows` - Dataflow dependencies
- ✅ `dataflow.upstreamDatamarts` - Dataflow sourced from Datamarts
- ✅ `datamart.UpstreamDataflows` - Datamart dependencies
- ✅ `report.datasetId` - Report → Semantic Model link
- ✅ `dashboard.tiles[].datasetId` - Dashboard → Semantic Model link
- ✅ `dashboard.tiles[].reportId` - Dashboard → Report link

#### Enhanced Lineage to Implement:
```typescript
interface EnhancedLineage {
  // Data Engineering lineage
  lakehouse_to_notebook: Link[];        // Notebooks reading Lakehouse data
  notebook_to_lakehouse: Link[];        // Notebooks writing to Lakehouse
  pipeline_to_lakehouse: Link[];        // Pipelines populating Lakehouse
  
  // Real-Time Intelligence lineage
  eventstream_to_eventhouse: Link[];    // Streaming data ingestion
  eventhouse_to_kqldatabase: Link[];    // Eventhouse contains KQL DBs
  kqldatabase_to_semanticmodel: Link[]; // KQL → Power BI integration
  
  // Data Science lineage
  notebook_to_mlexperiment: Link[];     // Training experiments
  mlexperiment_to_mlmodel: Link[];      // Model versioning
  mlmodel_to_notebook: Link[];          // Model inference
  
  // Cross-workspace references
  workspace_to_workspace: Link[];       // Any cross-workspace dependency
}
```

**Implementation:**
- Parse `upstreamDataflows`, `upstreamDatamarts`, `upstreamDatasets` arrays
- Create `LinkType.Contains` for parent-child (workspace → artifacts)
- Create `LinkType.CrossWorkspace` for dependencies between artifacts in different workspaces
- Add new `LinkType.DataFlow` for upstream/downstream data dependencies

**Estimated Effort:** 4-6 days

---

### Phase 5: UI/UX Enhancements (Priority: MEDIUM)
**Goal:** Make the visualization more informative and user-friendly

#### Tasks:
1. **Enhanced Tooltips**
   - Show artifact metadata (created by, modified date, endorsement)
   - Display sensitivity labels with icons
   - Show upstream/downstream counts

2. **Filtering & Search**
   - ✅ Already implemented: Search by name/type
   - Add: Filter by endorsement status (Certified, Promoted, None)
   - Add: Filter by workspace capacity
   - Add: Filter by sensitivity label
   - Add: Show only cross-workspace lineage

3. **Legend Panel**
   - Show color coding for all artifact types
   - Display node count by type
   - Show lineage statistics (total links, cross-workspace links)

4. **Mini-map**
   - Small overview of entire graph in corner
   - Highlight current viewport

5. **Timeline View**
   - Show how lineage evolved over time
   - Animate artifact creation/deletion

**Estimated Effort:** 6-8 days

---

## 5. Technical Architecture Changes

### Current Architecture
```
User → Angular App → Mock Data → 3D Graph Visualization
```

### Target Architecture
```
User → Angular App → API Service Layer → Multiple Fabric APIs
                                        ↓
                          Cache Layer (IndexedDB/LocalStorage)
                                        ↓
                          Data Parser & Lineage Builder
                                        ↓
                          3D Graph Visualization
```

### Key Components to Build

#### 1. `FabricScannerService` (New)
```typescript
@Injectable({ providedIn: 'root' })
export class FabricScannerService {
  async scanEntireTenant(): Promise<WorkspaceInfoResponse[]> {...}
  async scanWorkspaces(workspaceIds: string[]): Promise<WorkspaceInfoResponse> {...}
  async getModifiedWorkspaces(modifiedSince?: Date): Promise<string[]> {...}
  private async pollScanStatus(scanId: string): Promise<void> {...}
}
```

#### 2. `FabricApiService` (New)
```typescript
@Injectable({ providedIn: 'root' })
export class FabricApiService {
  // Lakehouse/Warehouse
  async getLakehouses(workspaceId: string): Promise<Lakehouse[]> {...}
  async getWarehouses(workspaceId: string): Promise<Warehouse[]> {...}
  
  // Real-Time Intelligence
  async getEventstreams(workspaceId: string): Promise<Eventstream[]> {...}
  async getKQLDatabases(workspaceId: string): Promise<KQLDatabase[]> {...}
  
  // Data Science
  async getMLModels(workspaceId: string): Promise<MLModel[]> {...}
  async getMLExperiments(workspaceId: string): Promise<MLExperiment[]> {...}
  
  // Data Factory
  async getPipelines(workspaceId: string): Promise<Pipeline[]> {...}
  async getNotebooks(workspaceId: string): Promise<Notebook[]> {...}
}
```

#### 3. `LineageBuilderService` (New)
```typescript
@Injectable({ providedIn: 'root' })
export class LineageBuilderService {
  buildGraph(scanResults: WorkspaceInfoResponse[]): GraphData {...}
  detectUpstreamLinks(artifact: any): Link[] {...}
  detectCrossWorkspaceReferences(): Link[] {...}
  buildForestClusters(): WorkspaceCluster[] {...}
}
```

#### 4. `CacheService` (New)
```typescript
@Injectable({ providedIn: 'root' })
export class CacheService {
  async storeScanResult(scanId: string, data: any): Promise<void> {...}
  async getScanResult(scanId: string): Promise<any> {...}
  async clearCache(): Promise<void> {...}
  isStale(timestamp: Date, maxAge: number): boolean {...}
}
```

---

## 6. Configuration & Deployment

### Environment Configuration
```typescript
// environment.fabric.ts
export const environment = {
  production: true,
  fabricTenantId: 'YOUR_TENANT_ID',
  fabricAuthority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
  fabricScopes: ['https://analysis.windows.net/powerbi/api/.default'],
  
  // API endpoints
  scannerApiUrl: 'https://api.powerbi.com/v1.0/myorg/admin',
  fabricApiUrl: 'https://api.fabric.microsoft.com/v1',
  
  // Feature flags
  enableExtendedFabricApis: true,
  enableRealTimeIntelligence: true,
  enableDataScience: true,
  enableAutoRefresh: false,
  refreshIntervalMinutes: 60,
  
  // Performance tuning
  maxWorkspacesPerScan: 100,
  maxConcurrentScans: 16,
  scanTimeoutSeconds: 300,
  cacheExpirationHours: 24
};
```

### Authentication Flow
1. User authenticates via Azure AD (MSAL)
2. Acquire token with required scopes
3. Store token securely in session
4. Auto-refresh before expiration
5. Handle 401/403 errors gracefully

---

## 7. Testing Strategy

### Unit Tests
- Service layer API calls (mock HTTP responses)
- Lineage builder logic (graph construction)
- Parser functions (artifact type detection)

### Integration Tests
- Scanner API end-to-end flow
- Fabric API batch fetching
- Cache invalidation

### E2E Tests
- Full tenant scan simulation
- Graph rendering with 1000+ nodes
- Cross-workspace filtering
- Export functionality

### Performance Tests
- Scan 500 workspaces (typical enterprise tenant)
- Render 5000 nodes + 10000 links
- Memory usage under load
- API rate limit handling

---

## 8. Success Metrics

### Functional KPIs
- ✅ Support for all 20+ Fabric artifact types
- ✅ Complete lineage tracking (upstream + downstream)
- ✅ <30 second scan time for 100 workspaces
- ✅ <60 second render time for 5000 nodes

### User Experience KPIs
- ✅ Search results in <100ms
- ✅ Smooth 60 FPS graph navigation
- ✅ Intuitive controls (no training needed)
- ✅ Accessible color scheme (WCAG AA compliant)

### Governance KPIs
- ✅ Identify orphaned artifacts (no upstream/downstream)
- ✅ Detect uncertified critical datasets
- ✅ Find cross-workspace dependencies
- ✅ Track lineage impact analysis

---

## 9. Risk Mitigation

### Risk 1: Scanner API Limitations
**Mitigation:** 
- Implement Fabric API fallback for missing artifact types
- Maintain feature flags to disable unsupported types
- Regular monitoring of API documentation

### Risk 2: Performance Degradation at Scale
**Mitigation:**
- Implement virtual scrolling for large node lists
- Use WebGL instancing for 10K+ nodes
- Add pagination for workspace scanning
- Lazy-load artifact details on demand

### Risk 3: Authentication Complexity
**Mitigation:**
- Provide clear setup guide with screenshots
- Offer Azure CLI script for service principal creation
- Implement "demo mode" with mock data for testing

### Risk 4: Breaking API Changes
**Mitigation:**
- Version lock dependencies
- Implement API version detection
- Graceful degradation for unsupported features
- Automated tests against Microsoft APIs

---

## 10. Roadmap Timeline

### Q1 2026
- ✅ Color scheme update to Fabric green
- ✅ NodeType enum expansion
- ✅ Arrow visibility improvements
- ⏳ Scanner API integration (Phase 1)

### Q2 2026
- Enhanced artifact detection (Phase 2)
- Advanced lineage tracking (Phase 4)
- Authentication setup

### Q3 2026
- Extended Fabric API integration (Phase 3)
- UI/UX enhancements (Phase 5)
- Performance optimization

### Q4 2026
- Public beta release
- Documentation completion
- Community feedback integration

---

## 11. Next Steps (Immediate Actions)

1. **Build & Verify Current Changes** ✅
   ```bash
   npm run build
   npm start
   ```

2. **Test Visual Appearance**
   - Verify Fabric green colors applied correctly
   - Check arrow visibility (length=5, green color)
   - Confirm Report color changed from purple to gold

3. **Begin Phase 1 (Scanner API)**
   - Set up Azure AD app registration
   - Create `FabricScannerService`
   - Implement authentication flow
   - Test with small workspace subset

4. **Create GitHub Issues**
   - One issue per phase
   - Link to this planning document
   - Assign priorities and milestones

---

## Appendix A: Fabric Color Palette

| Artifact Type | Color | Hex Code | Rationale |
|--------------|-------|----------|-----------|
| Workspace | Fabric Green | #107C10 | Primary brand color |
| Report | Gold | #FFB900 | High visibility |
| Paginated Report | Orange | #FFA500 | Variant of Report |
| Dashboard | Cyan | #06B6D4 | Distinct from Report |
| Semantic Model | Red | #EF4444 | Critical data layer |
| Dataflow/Gen2 | Green | #10B981 | Data transformation |
| Lakehouse | Cyan | #00BCF2 | Data lake storage |
| Data Warehouse | Blue | #0078D4 | Fabric blue |
| SQL Endpoint | Light Blue | #50E6FF | Related to Warehouse |
| Notebook | Amber | #F59E0B | Code/dev environment |
| Spark Job | Orange-Red | #FF6B35 | Compute-intensive |
| Pipeline | Indigo | #6366F1 | Orchestration |
| Eventstream | Orange | #F97316 | Real-time data |
| Eventhouse | Red | #E74856 | Event storage |
| KQL Database | Magenta | #C239B3 | Query layer |
| KQL Queryset | Purple | #9F79EE | Query definition |
| Datamart | Purple | #8764B8 | Self-service |
| ML Model | Teal | #00D4AA | AI/ML |
| ML Experiment | Dark Teal | #00B294 | Training |
| App | Gray | #737373 | Packaged solution |

---

## Appendix B: Scanner API Response Size Estimation

### Typical Enterprise Tenant (500 workspaces)
- Average artifacts per workspace: 25
- Total artifacts: 12,500
- JSON response size per workspace: ~50 KB
- **Total scan size: ~25 MB**
- Transfer time (10 Mbps): ~20 seconds
- Parse time: ~5 seconds
- **Total time: ~30 seconds** ✅

### Large Enterprise Tenant (2000 workspaces)
- Total artifacts: 50,000
- **Total scan size: ~100 MB**
- **Total time: ~2 minutes** ⚠️ (Requires optimization)

**Optimization Strategy:**
- Scan in batches of 100 workspaces
- Process results incrementally
- Show progress bar to user
- Cache results for 24 hours

---

**Document Version:** 1.0  
**Last Updated:** January 30, 2026  
**Author:** PowerBEye Development Team  
**Status:** Living Document - Update as requirements evolve
