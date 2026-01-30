# Microsoft Fabric Artifacts Supported in PowerBEye

## ✅ Fully Supported Artifacts (23 Types)

### Data Engineering
1. **Lakehouse** 
   - Icon: lakehouse.svg (cyan water + structure)
   - Detection: `datamart.type === 'Lakehouse'`
   - Auto-creates: SQL Analytics Endpoint

2. **Data Warehouse**
   - Icon: datawarehouse.svg
   - Detection: `datamart.type === 'Datawarehouse'`
   - SQL-based storage

3. **Notebook**
   - Icon: notebook.svg
   - Apache Spark notebooks for code execution

4. **Spark Job Definition**
   - Batch processing jobs

### Data Integration
5. **Pipeline**
   - Icon: pipeline.svg
   - Data orchestration and ETL

6. **Dataflow Gen2**
   - Self-service data prep
   - Low-code data transformation

7. **Dataflow (Gen1)**
   - Legacy dataflow support

### Real-Time Analytics
8. **Eventstream**
   - Icon: eventstream.svg
   - Real-time data streaming

9. **KQL Database**
   - Icon: kqldatabase.svg
   - Kusto Query Language database
   - Real-time analytics

10. **KQL Queryset**
    - Query collections for KQL Database

### Data Science
11. **ML Model**
    - Icon: mlmodel.svg
    - Machine learning models

12. **ML Experiment**
    - ML training experiments

### Business Intelligence
13. **Semantic Model (Dataset)**
    - Icon: dataset.png
    - Power BI datasets with tabular model

14. **Report (Power BI)**
    - Icon: report.png
    - Interactive Power BI reports

15. **Paginated Report**
    - Icon: paginated-report.svg
    - Pixel-perfect formatted reports

16. **Dashboard**
    - Icon: dashboard.png
    - Power BI dashboards

17. **Datamart**
    - Icon: datamart.svg
    - Self-service analytics database

### Data Warehouse (Legacy)
18. **SQL Analytics Endpoint**
    - Auto-generated for Lakehouses
    - SQL query interface

19. **Mirrored Database**
    - Real-time replication from external sources

### Other Artifacts
20. **Workspace**
    - Container for all artifacts
    - Domain assignment via `domainId`

21. **Environment**
    - Compute and library configurations

22. **Reflex**
    - Low-code automation

23. **Data Activator**
    - Real-time monitoring and alerts

## 🎨 Visual Indicators

### Endorsement Badges
- **Certified** 🏅 - Medal/ribbon icon (blue)
  - `endorsementDetails.endorsement === 'Certified'`
- **Promoted** ✓ - Checkmark in circle (blue)
  - `endorsementDetails.endorsement === 'Promoted'`
- **None** - No badge shown

### Sensitivity Labels
- **Highly Confidential** 🔒 - Red lock
- **Confidential** 🔒 - Orange lock  
- **Internal** 🔓 - Light orange unlocked
- **Public** 🌐 - Gray globe

## 📊 Detection Logic

### Lakehouse vs Warehouse
```typescript
if (datamart.type === 'Lakehouse') {
  nodeType = NodeType.Lakehouse;
  // Auto-create SQL Analytics Endpoint
}
if (datamart.type === 'Datawarehouse') {
  nodeType = NodeType.DataWarehouse;
}
```

### Paginated Report
```typescript
if (report.reportType === 'PaginatedReport') {
  nodeType = NodeType.PaginatedReport;
} else {
  nodeType = NodeType.Report;
}
```

### Dataflow Generations
```typescript
if (dataflow.objectId.startsWith('gen2-')) {
  nodeType = NodeType.DataflowGen2;
} else {
  nodeType = NodeType.Dataflow;
}
```

## 🔗 Lineage Support

### Upstream Dependencies
- `upstreamDatasets[]` - Dataset dependencies
- `upstreamDatamarts[]` - Datamart dependencies  
- `upstreamDataflows[]` - Dataflow dependencies

### Cross-Workspace Lineage
- Tracks dependencies across workspace boundaries
- Green particles show data flow direction
- Tooltip shows upstream/downstream counts

## 🏢 Domain Support

All artifacts can be:
- Assigned to **Domains** via workspace
- Grouped visually by domain
- Filtered by domain
- Color-coded by domain

## 📍 Current Implementation Status

| Category | Supported | With Icons | With Lineage |
|----------|-----------|------------|--------------|
| Data Engineering | 4/4 | ✅ | ✅ |
| Data Integration | 3/3 | ✅ | ✅ |
| Real-Time Analytics | 3/3 | ✅ | ✅ |
| Data Science | 2/2 | ✅ | ✅ |
| Business Intelligence | 5/5 | ✅ | ✅ |
| Workspaces | 1/1 | ✅ | ✅ |
| **TOTAL** | **23/23** | **✅** | **✅** |

## 🎯 Features

1. **Visual Icons**: Custom SVG for each artifact type
2. **Endorsement Badges**: Official Microsoft-style badges
3. **Sensitivity Labels**: Lock/globe icons with colors
4. **Rich Tooltips**: Shows type, endorsement, sensitivity, domain, description
5. **Cross-Workspace Links**: Green animated particles
6. **Domain Clustering**: Workspaces group by domain
7. **Artifact Labels**: Name shown below each icon

## 🔄 Scanner API Compliance

All artifact types match the official Microsoft Fabric Scanner API:
- Endpoint: `/v1.0/myorg/admin/workspaces/scanResult/{scanId}`
- Response: `WorkspaceInfoResponse`
- Properties: `reports`, `dashboards`, `datasets`, `dataflows`, `datamarts`
- Metadata: `endorsementDetails`, `sensitivityLabel`, `domainId`

---

**Last Updated**: January 30, 2026  
**Microsoft Fabric Version**: Latest (2026 Q1)  
**Scanner API Version**: v1.0
