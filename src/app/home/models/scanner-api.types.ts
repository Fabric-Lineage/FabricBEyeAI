/**
 * TypeScript interfaces matching Microsoft Fabric Scanner API response structure
 * Based on: https://learn.microsoft.com/en-us/rest/api/power-bi/admin/workspace-info-get-scan-result
 */

export interface WorkspaceInfoResponse {
  workspaces: WorkspaceInfo[];
  datasourceInstances: Datasource[];
  misconfiguredDatasourceInstances: Datasource[];
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  type: string;
  state: string;
  isOnDedicatedCapacity: boolean;
  capacityId?: string;
  defaultDatasetStorageFormat?: string;
  description?: string;

  // Domain assignment (added in Fabric)
  domainId?: string;

  // Artifact arrays
  reports: WorkspaceInfoReport[];
  dashboards: WorkspaceInfoDashboard[];
  datasets: WorkspaceInfoDataset[];
  dataflows: WorkspaceInfoDataflow[];
  datamarts: WorkspaceInfoDatamart[];

  // Users with access
  users: GroupUser[];
}

export interface WorkspaceInfoReport {
  id: string;
  name: string;
  datasetId?: string;
  datasetWorkspaceId?: string;
  createdDateTime?: string;
  modifiedDateTime?: string;
  modifiedBy?: string;
  createdBy?: string;
  createdById?: string;
  reportType?: 'PowerBIReport' | 'PaginatedReport';
  endorsementDetails?: EndorsementDetails;
  sensitivityLabel?: SensitivityLabel;
  users: ReportUser[];
  description?: string;
  tags?: string[];
}

export interface WorkspaceInfoDashboard {
  id: string;
  displayName: string;
  isReadOnly: boolean;
  tiles: WorkspaceInfoTile[];
  endorsementDetails?: EndorsementDetails;
  sensitivityLabel?: SensitivityLabel;
  users: DashboardUser[];
  tags?: string[];
}

export interface WorkspaceInfoTile {
  id: string;
  title: string;
  reportId?: string;
  datasetId?: string;
  datasetWorkspaceId?: string;
}

export interface WorkspaceInfoDataset {
  id: string;
  name: string;
  tables: Table[];
  relationships?: any[];
  configuredBy?: string;
  targetStorageMode?: string;
  createdDate?: string;
  endorsementDetails?: EndorsementDetails;
  sensitivityLabel?: SensitivityLabel;
  expressions?: Expression[];
  roles?: Role[];
  upstreamDataflows?: DependentDataflow[];
  upstreamDatamarts?: DependentDatamart[];
  upstreamDatasets?: DependentDataset[];
  datasourceUsages?: DatasourceUsage[];
  misconfiguredDatasourceUsages?: DatasourceUsage[];
  users: DatasetUser[];
  description?: string;
  tags?: string[];
}

export interface WorkspaceInfoDataflow {
  objectId: string;
  name: string;
  description?: string;
  configuredBy?: string;
  modifiedBy?: string;
  modifiedDateTime?: string;
  endorsementDetails?: EndorsementDetails;
  sensitivityLabel?: SensitivityLabel;
  datasourceUsages?: DatasourceUsage[];
  misconfiguredDatasourceUsages?: DatasourceUsage[];
  upstreamDataflows?: DependentDataflow[];
  users: DataflowUser[];
  tags?: string[];
}

export interface WorkspaceInfoDatamart {
  id: string;
  name: string;
  description?: string;
  type: 'Unset' | 'Ignore' | 'Sql' | 'Lakehouse' | 'Dataverse' | 'Datawarehouse';
  configuredBy?: string;
  configuredById?: string;
  modifiedBy?: string;
  modifiedDateTime?: string;
  endorsementDetails?: EndorsementDetails;
  sensitivityLabel?: SensitivityLabel;
  upstreamDataflows?: DependentDataflow[];
  datasourceUsages?: DatasourceUsage[];
  users: DatamartUser[];
  tags?: string[];
}

// Supporting types

export interface EndorsementDetails {
  endorsement: 'None' | 'Promoted' | 'Certified';
  certifiedBy?: string;
}

export interface SensitivityLabel {
  labelId: string;
}

export interface Table {
  name: string;
  columns: Column[];
  measures?: Measure[];
  isHidden?: boolean;
  description?: string;
  source?: ASMashupExpression[];
}

export interface Column {
  name: string;
  dataType: string;
  isHidden?: boolean;
  description?: string;
}

export interface Measure {
  name: string;
  expression: string;
  isHidden?: boolean;
  description?: string;
}

export interface ASMashupExpression {
  expression: string;
}

export interface Expression {
  name: string;
  description?: string;
  expression: string;
}

export interface Role {
  name: string;
  modelPermission: string;
  members: RoleMember[];
  tablePermissions?: RoleTablePermission[];
}

export interface RoleMember {
  memberName: string;
  memberId: string;
  memberType: string;
  identityProvider: string;
}

export interface RoleTablePermission {
  name: string;
  filterExpression: string;
}

export interface DependentDataflow {
  targetDataflowId: string;
  groupId: string;
}

export interface DependentDatamart {
  targetDatamartId: string;
  groupId: string;
}

export interface DependentDataset {
  targetDatasetId: string;
  groupId: string;
}

export interface DatasourceUsage {
  datasourceInstanceId: string;
}

export interface Datasource {
  datasourceType: string;
  connectionDetails: DatasourceConnectionDetails;
  datasourceId: string;
  gatewayId?: string;
}

export interface DatasourceConnectionDetails {
  server?: string;
  database?: string;
  url?: string;
  path?: string;
  account?: string;
  domain?: string;
}

// User access types

export interface GroupUser {
  displayName: string;
  emailAddress: string;
  identifier: string;
  graphId?: string;
  principalType: 'User' | 'Group' | 'App' | 'None';
  groupUserAccessRight: 'None' | 'Member' | 'Admin' | 'Contributor' | 'Viewer';
  userType?: string;
}

export interface ReportUser {
  displayName: string;
  emailAddress: string;
  identifier: string;
  graphId?: string;
  principalType: 'User' | 'Group' | 'App' | 'None';
  reportUserAccessRight: 'None' | 'Read' | 'ReadWrite' | 'ReadReshare' | 'ReadCopy' | 'Owner';
  userType?: string;
}

export interface DashboardUser {
  displayName: string;
  emailAddress: string;
  identifier: string;
  graphId?: string;
  principalType: 'User' | 'Group' | 'App' | 'None';
  dashboardUserAccessRight: 'None' | 'Read' | 'ReadWrite' | 'ReadReshare' | 'ReadCopy' | 'Owner';
  userType?: string;
}

export interface DatasetUser {
  displayName: string;
  emailAddress: string;
  identifier: string;
  graphId?: string;
  principalType: 'User' | 'Group' | 'App' | 'None';
  datasetUserAccessRight: 'None' | 'Read' | 'ReadWrite' | 'ReadReshare' | 'ReadWriteReshare' | 'ReadExplore' | 'ReadReshareExplore' | 'ReadWriteExplore' | 'ReadWriteReshareExplore';
  userType?: string;
}

export interface DataflowUser {
  displayName: string;
  emailAddress: string;
  identifier: string;
  graphId?: string;
  principalType: 'User' | 'Group' | 'App' | 'None';
  dataflowUserAccessRight: 'None' | 'Read' | 'ReadWrite' | 'ReadReshare' | 'Owner';
  userType?: string;
}

export interface DatamartUser {
  displayName: string;
  emailAddress: string;
  identifier: string;
  graphId?: string;
  principalType: 'User' | 'Group' | 'App' | 'None';
  datamartUserAccessRight: 'None' | 'Read' | 'Write' | 'Reshare' | 'Explore' | 'ReadWrite' | 'ReadReshare' | 'ReadWriteReshare' | 'ReadExplore' | 'ReadReshareExplore' | 'ReadWriteExplore' | 'ReadWriteReshareExplore';
  userType?: string;
}

// Domain types (for visualization layer)
export interface Domain {
  id: string;
  name: string;
  description?: string;
  parentDomainId?: string;
  workspaceIds: string[];
  // 3D visualization properties
  center?: { x: number; y: number; z: number };
  radius?: number;
}
