/**
 * Comprehensive Mock Data matching Microsoft Fabric Scanner API format
 * Simulates an enterprise tenant with 15 domains, 100 workspaces, 1000+ artifacts
 */

import { WorkspaceInfoResponse, Domain, WorkspaceInfo } from '../models/scanner-api.types';

// Domain definitions (Data Mesh architecture)
export const MOCK_DOMAINS: Domain[] = [
  // Special staging domain for unassigned workspaces
  { id: 'UNASSIGNED', name: '⚠️ Unassigned Workspaces', description: 'Workspaces awaiting domain assignment', workspaceIds: [] },
  
  // Top-level business domains
  { id: 'dom-sales', name: 'Sales & Revenue', description: 'Sales operations and revenue analytics', workspaceIds: [] },
  { id: 'dom-sales-na', name: 'Sales North America', description: 'North American sales division', parentDomainId: 'dom-sales', workspaceIds: [] },
  { id: 'dom-sales-emea', name: 'Sales EMEA', description: 'Europe, Middle East & Africa sales', parentDomainId: 'dom-sales', workspaceIds: [] },
  
  { id: 'dom-finance', name: 'Finance & Accounting', description: 'Financial reporting and analysis', workspaceIds: [] },
  { id: 'dom-finance-fp', name: 'Financial Planning', description: 'FP&A and budgeting', parentDomainId: 'dom-finance', workspaceIds: [] },
  
  { id: 'dom-hr', name: 'Human Resources', description: 'HR analytics and workforce management', workspaceIds: [] },
  
  { id: 'dom-marketing', name: 'Marketing & Customer', description: 'Marketing campaigns and customer analytics', workspaceIds: [] },
  { id: 'dom-marketing-digital', name: 'Digital Marketing', description: 'Online campaigns and social media', parentDomainId: 'dom-marketing', workspaceIds: [] },
  
  { id: 'dom-supply', name: 'Supply Chain', description: 'Supply chain and logistics', workspaceIds: [] },
  
  { id: 'dom-manufacturing', name: 'Manufacturing & Operations', description: 'Production and operational efficiency', workspaceIds: [] },
  
  { id: 'dom-it', name: 'IT & Infrastructure', description: 'IT services and infrastructure monitoring', workspaceIds: [] },
  
  { id: 'dom-datascience', name: 'Data Science & AI', description: 'ML models and AI experiments', workspaceIds: [] },
  
  { id: 'dom-executive', name: 'Executive Leadership', description: 'C-suite executive dashboards', workspaceIds: [] },
  
  { id: 'dom-compliance', name: 'Compliance & Risk', description: 'Regulatory compliance and risk management', workspaceIds: [] },
  
  { id: 'dom-customer', name: 'Customer Support', description: 'Customer service and support analytics', workspaceIds: [] }
];

// Sensitivity label definitions (Microsoft Purview)
const SENSITIVITY_LABELS = {
  PUBLIC: '00000000-0000-0000-0000-000000000001',
  INTERNAL: '00000000-0000-0000-0000-000000000002',
  CONFIDENTIAL: '00000000-0000-0000-0000-000000000003',
  HIGHLY_CONFIDENTIAL: '00000000-0000-0000-0000-000000000004'
};

// Helper to generate workspace IDs
let workspaceCounter = 1;
const generateWorkspaceId = () => `ws-${String(workspaceCounter++).padStart(4, '0')}`;

let artifactCounter = 1;
const generateArtifactId = () => `art-${String(artifactCounter++).padStart(6, '0')}`;

// Mock users
const MOCK_USERS = {
  admin: { displayName: 'Sarah Chen', emailAddress: 'sarah.chen@contoso.com', identifier: 'user-001' },
  analyst: { displayName: 'Michael Brown', emailAddress: 'michael.brown@contoso.com', identifier: 'user-002' },
  viewer: { displayName: 'Emma Wilson', emailAddress: 'emma.wilson@contoso.com', identifier: 'user-003' },
  contributor: { displayName: 'David Lee', emailAddress: 'david.lee@contoso.com', identifier: 'user-004' }
};

/**
 * Generate comprehensive mock workspace data
 * This creates realistic Fabric workspaces with all artifact types
 */
export const MOCK_SCANNER_RESPONSE: WorkspaceInfoResponse = {
  workspaces: [
    // ====== UNASSIGNED WORKSPACES (No Domain) ======
    {
      id: generateWorkspaceId(),
      name: 'Legacy Reports Workspace',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: false,
      capacityId: null,
      domainId: null,  // UNASSIGNED
      description: 'Old reports that need to be organized into a domain',
      reports: [],
      dashboards: [],
      datasets: [],
      dataflows: [],
      datamarts: [],
      users: []
    },
    {
      id: generateWorkspaceId(),
      name: 'Temporary Analysis',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: false,
      capacityId: null,
      domainId: null,  // UNASSIGNED
      description: 'Temporary workspace for ad-hoc analysis',
      reports: [],
      dashboards: [],
      datasets: [],
      dataflows: [],
      datamarts: [],
      users: []
    },
    {
      id: generateWorkspaceId(),
      name: 'Uncategorized Data',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: false,
      capacityId: null,
      domainId: null,  // UNASSIGNED
      description: 'Data sources awaiting classification',
      reports: [],
      dashboards: [],
      datasets: [],
      dataflows: [],
      datamarts: [],
      users: []
    },
    {
      id: generateWorkspaceId(),
      name: 'Test Environment',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: false,
      capacityId: null,
      domainId: null,  // UNASSIGNED
      description: 'Development and testing workspace',
      reports: [],
      dashboards: [],
      datasets: [],
      dataflows: [],
      datamarts: [],
      users: []
    },
    {
      id: generateWorkspaceId(),
      name: 'Archive Candidates',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: false,
      capacityId: null,
      domainId: null,  // UNASSIGNED
      description: 'Old workspaces to be archived or reassigned',
      reports: [],
      dashboards: [],
      datasets: [],
      dataflows: [],
      datamarts: [],
      users: []
    },
    // ====== SALES & REVENUE DOMAIN ======
    {
      id: generateWorkspaceId(),
      name: 'Sales - Raw Data Lake',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-sales-001',
      domainId: 'dom-sales-na',
      description: 'Raw sales data ingestion from CRM and ERP systems',
      reports: [],
      dashboards: [],
      datasets: [],
      dataflows: [
        {
          objectId: generateArtifactId(),
          name: 'Salesforce CRM Ingestion',
          description: 'Daily Salesforce data extract',
          configuredBy: MOCK_USERS.admin.emailAddress,
          modifiedDateTime: '2026-01-29T08:00:00Z',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          tags: ['crm', 'salesforce', 'ingestion']
        },
        {
          objectId: generateArtifactId(),
          name: 'SAP ERP Orders',
          description: 'Order data from SAP ERP',
          configuredBy: MOCK_USERS.admin.emailAddress,
          modifiedDateTime: '2026-01-28T14:30:00Z',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          tags: ['erp', 'sap', 'orders']
        }
      ],
      datamarts: [
        {
          id: generateArtifactId(),
          name: 'Sales Bronze Lakehouse',
          description: 'Bronze layer - raw sales data',
          type: 'Lakehouse',
          configuredBy: MOCK_USERS.admin.emailAddress,
          modifiedDateTime: '2026-01-29T12:00:00Z',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          upstreamDataflows: [
            { targetDataflowId: 'art-000001', groupId: 'ws-0001' },
            { targetDataflowId: 'art-000002', groupId: 'ws-0001' }
          ],
          users: [],
          tags: ['bronze', 'raw', 'lakehouse']
        }
      ],
      users: [
        { ...MOCK_USERS.admin, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-001' }
      ]
    },

    {
      id: generateWorkspaceId(),
      name: 'Sales - Data Transformation',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-sales-001',
      domainId: 'dom-sales-na',
      description: 'Silver layer transformations and data quality',
      reports: [],
      dashboards: [],
      datasets: [],
      dataflows: [
        {
          objectId: generateArtifactId(),
          name: 'Sales Data Cleansing',
          description: 'Clean and standardize sales data',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          modifiedDateTime: '2026-01-29T10:00:00Z',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          upstreamDatamarts: [{ targetDatamartId: 'art-000003', groupId: 'ws-0001' }],
          users: [],
          tags: ['silver', 'cleansing']
        }
      ],
      datamarts: [
        {
          id: generateArtifactId(),
          name: 'Sales Silver Lakehouse',
          description: 'Silver layer - cleaned sales data',
          type: 'Lakehouse',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          modifiedDateTime: '2026-01-29T15:00:00Z',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          upstreamDataflows: [{ targetDataflowId: 'art-000004', groupId: 'ws-0002' }],
          users: [],
          tags: ['silver', 'cleaned', 'lakehouse']
        }
      ],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-002' }
      ]
    },

    {
      id: generateWorkspaceId(),
      name: 'Sales - Analytics & Reporting',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-sales-001',
      domainId: 'dom-sales-na',
      description: 'Sales dashboards and analytical reports',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Sales Performance Dashboard',
          datasetId: 'art-000007',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-15T09:00:00Z',
          modifiedDateTime: '2026-01-29T11:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Real-time sales KPIs and trends',
          tags: ['sales', 'kpi', 'dashboard']
        },
        {
          id: generateArtifactId(),
          name: 'Territory Analysis',
          datasetId: 'art-000007',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-20T14:00:00Z',
          modifiedDateTime: '2026-01-28T16:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Geographic sales territory performance',
          tags: ['sales', 'territory', 'geo']
        },
        {
          id: generateArtifactId(),
          name: 'Sales Forecast Model',
          datasetId: 'art-000007',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-10T10:00:00Z',
          modifiedDateTime: '2026-01-27T13:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'ML-powered sales forecasting',
          tags: ['forecast', 'ml', 'prediction']
        }
      ],
      dashboards: [
        {
          id: generateArtifactId(),
          displayName: 'Executive Sales Dashboard',
          isReadOnly: false,
          tiles: [
            { id: 'tile-001', title: 'YTD Revenue', reportId: 'art-000006', datasetId: 'art-000007' },
            { id: 'tile-002', title: 'Top Products', reportId: 'art-000006', datasetId: 'art-000007' },
            { id: 'tile-003', title: 'Regional Performance', reportId: 'art-000007', datasetId: 'art-000007' }
          ],
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          tags: ['executive', 'sales', 'dashboard']
        }
      ],
      datasets: [
        {
          id: 'art-000007',
          name: 'Sales Analytics Model',
          description: 'Comprehensive sales semantic model',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-05T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          upstreamDatamarts: [{ targetDatamartId: 'art-000005', groupId: 'ws-0002' }],
          tables: [
            { name: 'FactSales', columns: [{ name: 'OrderID', dataType: 'Int64' }, { name: 'Revenue', dataType: 'Decimal' }] },
            { name: 'DimCustomer', columns: [{ name: 'CustomerID', dataType: 'Int64' }, { name: 'CustomerName', dataType: 'String' }] },
            { name: 'DimProduct', columns: [{ name: 'ProductID', dataType: 'Int64' }, { name: 'ProductName', dataType: 'String' }] }
          ],
          users: [],
          tags: ['semantic-model', 'sales', 'analytics']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-003' },
        { ...MOCK_USERS.viewer, principalType: 'User', groupUserAccessRight: 'Viewer', graphId: 'graph-004' }
      ]
    },

    // ====== FINANCE DOMAIN ======
    {
      id: generateWorkspaceId(),
      name: 'Finance - General Ledger',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-finance-001',
      domainId: 'dom-finance',
      description: 'Financial accounting and GL reporting',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Monthly Financial Statements',
          datasetId: 'art-000013',
          reportType: 'PaginatedReport',
          createdDateTime: '2026-01-10T08:00:00Z',
          modifiedDateTime: '2026-01-28T17:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          users: [],
          description: 'Regulatory financial statements (PDF export)',
          tags: ['finance', 'regulatory', 'statements']
        },
        {
          id: generateArtifactId(),
          name: 'Balance Sheet Analysis',
          datasetId: 'art-000013',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-12T09:00:00Z',
          modifiedDateTime: '2026-01-29T08:30:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'Interactive balance sheet drill-down',
          tags: ['balance-sheet', 'finance']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-000013',
          name: 'General Ledger Model',
          description: 'Core financial accounting model',
          configuredBy: MOCK_USERS.admin.emailAddress,
          createdDate: '2026-01-01T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          tables: [
            { name: 'FactTransactions', columns: [{ name: 'TransactionID', dataType: 'Int64' }, { name: 'Amount', dataType: 'Decimal' }] },
            { name: 'DimAccount', columns: [{ name: 'AccountID', dataType: 'String' }, { name: 'AccountName', dataType: 'String' }] }
          ],
          users: [],
          tags: ['gl', 'finance', 'accounting']
        }
      ],
      dataflows: [
        {
          objectId: generateArtifactId(),
          name: 'SAP Financial Data',
          description: 'Financial transactions from SAP',
          configuredBy: MOCK_USERS.admin.emailAddress,
          modifiedDateTime: '2026-01-29T06:00:00Z',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          users: [],
          tags: ['sap', 'finance', 'etl']
        }
      ],
      datamarts: [
        {
          id: generateArtifactId(),
          name: 'Finance Data Warehouse',
          description: 'Enterprise financial data warehouse',
          type: 'Datawarehouse',
          configuredBy: MOCK_USERS.admin.emailAddress,
          modifiedDateTime: '2026-01-29T07:00:00Z',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          upstreamDataflows: [{ targetDataflowId: 'art-000014', groupId: 'ws-0004' }],
          users: [],
          tags: ['warehouse', 'finance', 'dwh']
        }
      ],
      users: [
        { ...MOCK_USERS.admin, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-005' }
      ]
    },

    {
      id: generateWorkspaceId(),
      name: 'Finance - FP&A',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-finance-001',
      domainId: 'dom-finance-fp',
      description: 'Financial planning and analysis',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Budget vs Actuals',
          datasetId: 'art-000017',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-08T10:00:00Z',
          modifiedDateTime: '2026-01-29T09:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'Budget variance analysis',
          tags: ['budget', 'variance', 'fpa']
        },
        {
          id: generateArtifactId(),
          name: 'Annual Operating Plan',
          datasetId: 'art-000017',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-05T11:00:00Z',
          modifiedDateTime: '2026-01-25T15:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          users: [],
          description: 'Strategic planning dashboard',
          tags: ['aop', 'planning', 'strategy']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-000017',
          name: 'FP&A Planning Model',
          description: 'Financial planning semantic model',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-03T08:00:00Z',
          targetStorageMode: 'DirectQuery',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          upstreamDatamarts: [{ targetDatamartId: 'art-000015', groupId: 'ws-0004' }],
          tables: [
            { name: 'FactBudget', columns: [{ name: 'BudgetID', dataType: 'Int64' }, { name: 'Amount', dataType: 'Decimal' }] }
          ],
          users: [],
          tags: ['fpa', 'planning', 'budget']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-006' }
      ]
    },

    // ====== HR DOMAIN ======
    {
      id: generateWorkspaceId(),
      name: 'HR - Workforce Analytics',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-hr-001',
      domainId: 'dom-hr',
      description: 'Human resources analytics and reporting',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Headcount Dashboard',
          datasetId: 'art-000020',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-12T08:00:00Z',
          modifiedDateTime: '2026-01-28T14:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'Employee headcount trends',
          tags: ['hr', 'headcount', 'workforce']
        },
        {
          id: generateArtifactId(),
          name: 'Attrition Analysis',
          datasetId: 'art-000020',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-15T09:00:00Z',
          modifiedDateTime: '2026-01-29T10:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          users: [],
          description: 'Employee turnover and retention',
          tags: ['hr', 'attrition', 'retention']
        }
      ],
      dashboards: [
        {
          id: generateArtifactId(),
          displayName: 'HR Executive Dashboard',
          isReadOnly: false,
          tiles: [
            { id: 'tile-hr-001', title: 'Total Headcount', reportId: 'art-000019', datasetId: 'art-000020' },
            { id: 'tile-hr-002', title: 'Attrition Rate', reportId: 'art-000020', datasetId: 'art-000020' }
          ],
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          tags: ['hr', 'executive']
        }
      ],
      datasets: [
        {
          id: 'art-000020',
          name: 'HR Analytics Model',
          description: 'Workforce analytics semantic model',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-10T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          tables: [
            { name: 'FactEmployees', columns: [{ name: 'EmployeeID', dataType: 'Int64' }] },
            { name: 'DimDepartment', columns: [{ name: 'DepartmentID', dataType: 'Int64' }] }
          ],
          users: [],
          tags: ['hr', 'workforce', 'analytics']
        }
      ],
      dataflows: [
        {
          objectId: generateArtifactId(),
          name: 'Workday HR Data',
          description: 'Employee data from Workday',
          configuredBy: MOCK_USERS.admin.emailAddress,
          modifiedDateTime: '2026-01-29T07:00:00Z',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          users: [],
          tags: ['workday', 'hr', 'etl']
        }
      ],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-007' }
      ]
    },

    // ====== MARKETING DOMAIN ======
    {
      id: generateWorkspaceId(),
      name: 'Marketing - Campaign Analytics',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-marketing-001',
      domainId: 'dom-marketing',
      description: 'Marketing campaign performance',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Campaign ROI Dashboard',
          datasetId: 'art-000025',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-18T10:00:00Z',
          modifiedDateTime: '2026-01-29T11:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Marketing campaign ROI analysis',
          tags: ['marketing', 'roi', 'campaigns']
        },
        {
          id: generateArtifactId(),
          name: 'Customer Journey Analysis',
          datasetId: 'art-000025',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-20T09:00:00Z',
          modifiedDateTime: '2026-01-28T16:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'Customer touchpoint analysis',
          tags: ['marketing', 'journey', 'customer']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-000025',
          name: 'Marketing Analytics Model',
          description: 'Marketing campaign semantic model',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-15T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactCampaigns', columns: [{ name: 'CampaignID', dataType: 'Int64' }] }
          ],
          users: [],
          tags: ['marketing', 'campaigns']
        }
      ],
      dataflows: [
        {
          objectId: generateArtifactId(),
          name: 'Google Analytics Data',
          description: 'Web analytics from Google',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          modifiedDateTime: '2026-01-29T08:00:00Z',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          tags: ['google-analytics', 'web']
        }
      ],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-008' }
      ]
    },

    {
      id: generateWorkspaceId(),
      name: 'Marketing - Digital & Social',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-marketing-001',
      domainId: 'dom-marketing-digital',
      description: 'Digital marketing and social media analytics',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Social Media Performance',
          datasetId: 'art-000029',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-22T10:00:00Z',
          modifiedDateTime: '2026-01-29T12:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.PUBLIC },
          users: [],
          description: 'Social media engagement metrics',
          tags: ['social-media', 'engagement']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-000029',
          name: 'Social Media Model',
          description: 'Social media analytics',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-20T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.PUBLIC },
          tables: [
            { name: 'FactSocialPosts', columns: [{ name: 'PostID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['social', 'digital']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Contributor', graphId: 'graph-009' }
      ]
    },

    // ====== SUPPLY CHAIN DOMAIN ======
    {
      id: generateWorkspaceId(),
      name: 'Supply Chain - Logistics',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-supply-001',
      domainId: 'dom-supply',
      description: 'Supply chain and logistics operations',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Inventory Management',
          datasetId: 'art-000032',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-16T09:00:00Z',
          modifiedDateTime: '2026-01-28T15:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'Real-time inventory levels',
          tags: ['inventory', 'supply-chain']
        },
        {
          id: generateArtifactId(),
          name: 'Supplier Performance',
          datasetId: 'art-000032',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-19T10:00:00Z',
          modifiedDateTime: '2026-01-27T14:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'Supplier KPIs and scorecards',
          tags: ['supplier', 'performance']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-000032',
          name: 'Supply Chain Model',
          description: 'Supply chain analytics',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-14T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          tables: [
            { name: 'FactInventory', columns: [{ name: 'ItemID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['supply-chain', 'logistics']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-010' }
      ]
    },

    // ====== MANUFACTURING DOMAIN ======
    {
      id: generateWorkspaceId(),
      name: 'Manufacturing - IoT & Real-Time',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-manufacturing-001',
      domainId: 'dom-manufacturing',
      description: 'Real-time manufacturing and IoT data',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Equipment Monitoring',
          datasetId: 'art-000036',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-10T08:00:00Z',
          modifiedDateTime: '2026-01-29T09:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Real-time equipment status',
          tags: ['manufacturing', 'iot', 'equipment']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-000036',
          name: 'Manufacturing Operations Model',
          description: 'Manufacturing analytics',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-08T08:00:00Z',
          targetStorageMode: 'DirectQuery',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactProduction', columns: [{ name: 'BatchID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['manufacturing', 'operations']
        }
      ],
      dataflows: [],
      datamarts: [
        {
          id: generateArtifactId(),
          name: 'IoT Eventhouse',
          description: 'Real-time IoT sensor data',
          type: 'Lakehouse',
          configuredBy: MOCK_USERS.admin.emailAddress,
          modifiedDateTime: '2026-01-29T08:00:00Z',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          tags: ['iot', 'eventhouse', 'real-time']
        }
      ],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-011' }
      ]
    },

    // ====== DATA SCIENCE DOMAIN ======
    {
      id: generateWorkspaceId(),
      name: 'Data Science - ML Models',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-datascience-001',
      domainId: 'dom-datascience',
      description: 'Machine learning and AI models',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Model Performance Dashboard',
          datasetId: 'art-000040',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-25T10:00:00Z',
          modifiedDateTime: '2026-01-29T13:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'ML model accuracy and metrics',
          tags: ['ml', 'model-performance']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-000040',
          name: 'ML Experiment Tracking',
          description: 'ML experiment metrics',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-22T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactExperiments', columns: [{ name: 'ExperimentID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['ml', 'experiments']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-012' }
      ]
    },

    // ====== EXECUTIVE DOMAIN ======
    {
      id: generateWorkspaceId(),
      name: 'Executive - C-Suite Dashboards',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-executive-001',
      domainId: 'dom-executive',
      description: 'Executive leadership dashboards',
      reports: [
        {
          id: generateArtifactId(),
          name: 'CEO Dashboard',
          datasetId: 'art-000043',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-05T08:00:00Z',
          modifiedDateTime: '2026-01-29T07:00:00Z',
          modifiedBy: MOCK_USERS.admin.emailAddress,
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          users: [],
          description: 'Enterprise-wide KPIs for CEO',
          tags: ['executive', 'ceo', 'kpi']
        },
        {
          id: generateArtifactId(),
          name: 'CFO Financial Summary',
          datasetId: 'art-000043',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-06T08:00:00Z',
          modifiedDateTime: '2026-01-28T08:00:00Z',
          modifiedBy: MOCK_USERS.admin.emailAddress,
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          users: [],
          description: 'Financial summary for CFO',
          tags: ['executive', 'cfo', 'finance']
        }
      ],
      dashboards: [
        {
          id: generateArtifactId(),
          displayName: 'Executive Scorecard',
          isReadOnly: true,
          tiles: [
            { id: 'tile-exec-001', title: 'Revenue', reportId: 'art-000041', datasetId: 'art-000043' },
            { id: 'tile-exec-002', title: 'Operating Margin', reportId: 'art-000042', datasetId: 'art-000043' }
          ],
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          users: [],
          tags: ['executive', 'scorecard']
        }
      ],
      datasets: [
        {
          id: 'art-000043',
          name: 'Enterprise Performance Model',
          description: 'Company-wide KPIs',
          configuredBy: MOCK_USERS.admin.emailAddress,
          createdDate: '2026-01-01T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          upstreamDatasets: [
            { targetDatasetId: 'art-000007', groupId: 'ws-0003' },
            { targetDatasetId: 'art-000013', groupId: 'ws-0004' },
            { targetDatasetId: 'art-000032', groupId: 'ws-0009' }
          ],
          tables: [
            { name: 'FactKPI', columns: [{ name: 'KPIID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['executive', 'enterprise', 'kpi']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.admin, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-013' }
      ]
    },

    // ====== COMPLIANCE DOMAIN ======
    {
      id: generateWorkspaceId(),
      name: 'Compliance - Risk Management',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-compliance-001',
      domainId: 'dom-compliance',
      description: 'Regulatory compliance and risk reporting',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Audit Trail Report',
          datasetId: 'art-000047',
          reportType: 'PaginatedReport',
          createdDateTime: '2026-01-10T08:00:00Z',
          modifiedDateTime: '2026-01-25T10:00:00Z',
          modifiedBy: MOCK_USERS.admin.emailAddress,
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          users: [],
          description: 'Compliance audit trail',
          tags: ['compliance', 'audit', 'regulatory']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-000047',
          name: 'Compliance Model',
          description: 'Regulatory compliance tracking',
          configuredBy: MOCK_USERS.admin.emailAddress,
          createdDate: '2026-01-08T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          tables: [
            { name: 'FactAudit', columns: [{ name: 'AuditID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['compliance', 'risk']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.admin, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-014' }
      ]
    },

    // ====== IT INFRASTRUCTURE DOMAIN ======
    {
      id: generateWorkspaceId(),
      name: 'IT - Infrastructure Monitoring',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-it-001',
      domainId: 'dom-it',
      description: 'IT infrastructure and system monitoring',
      reports: [
        {
          id: generateArtifactId(),
          name: 'System Health Dashboard',
          datasetId: 'art-000050',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-20T08:00:00Z',
          modifiedDateTime: '2026-01-29T14:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Real-time IT system health',
          tags: ['it', 'infrastructure', 'monitoring']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-000050',
          name: 'IT Operations Model',
          description: 'IT infrastructure metrics',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-18T08:00:00Z',
          targetStorageMode: 'DirectQuery',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactSystemLogs', columns: [{ name: 'LogID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['it', 'operations']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-015' }
      ]
    },

    // ====== CUSTOMER SUPPORT DOMAIN ======
    {
      id: generateWorkspaceId(),
      name: 'Customer Support - Service Analytics',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: false,
      domainId: 'dom-customer',
      description: 'Customer support and service metrics',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Support Ticket Analysis',
          datasetId: 'art-000053',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-22T10:00:00Z',
          modifiedDateTime: '2026-01-28T12:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Support ticket trends',
          tags: ['support', 'customer-service']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-000053',
          name: 'Support Analytics Model',
          description: 'Customer support metrics',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-20T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactTickets', columns: [{ name: 'TicketID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['support', 'tickets']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Contributor', graphId: 'graph-016' }
      ]
    },

    // ====== SALES NORTH AMERICA - Additional Workspaces ======
    {
      id: generateWorkspaceId(),
      name: 'Sales NA - Field Sales Analytics',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-sales-001',
      domainId: 'dom-sales-na',
      description: 'Field sales team analytics',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Territory Performance',
          datasetId: 'art-sales-na-001',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-10T08:00:00Z',
          modifiedDateTime: '2026-02-01T09:30:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'Territory-based sales performance',
          tags: ['sales', 'territory', 'field']
        },
        {
          id: generateArtifactId(),
          name: 'Sales Rep Leaderboard',
          datasetId: 'art-sales-na-001',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-15T10:00:00Z',
          modifiedDateTime: '2026-02-02T11:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Sales representative rankings',
          tags: ['sales', 'leaderboard']
        }
      ],
      dashboards: [
        {
          id: generateArtifactId(),
          displayName: 'Field Sales Dashboard',
          isReadOnly: false,
          tiles: [],
          users: [],
          tags: ['sales', 'field']
        }
      ],
      datasets: [
        {
          id: 'art-sales-na-001',
          name: 'Field Sales Dataset',
          description: 'CRM and territory data',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-10T08:00:00Z',
          targetStorageMode: 'DirectQuery',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          tables: [
            { name: 'FactSales', columns: [{ name: 'SaleID', dataType: 'Int64' }] },
            { name: 'DimTerritory', columns: [{ name: 'TerritoryID', dataType: 'String' }] }
          ],
          upstreamDatasets: [{ targetDatasetId: 'art-000001', groupId: 'ws-sales-na' }],
          users: [],
          tags: ['sales', 'crm']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Member', graphId: 'graph-017' }
      ]
    },
    {
      id: generateWorkspaceId(),
      name: 'Sales NA - Customer Insights',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-sales-001',
      domainId: 'dom-sales-na',
      description: 'Customer behavior and segmentation',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Customer Segmentation',
          datasetId: 'art-sales-na-002',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-12T08:00:00Z',
          modifiedDateTime: '2026-02-03T10:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'Customer segments and RFM analysis',
          tags: ['customer', 'segmentation', 'rfm']
        },
        {
          id: generateArtifactId(),
          name: 'Churn Prediction',
          datasetId: 'art-sales-na-002',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-18T09:00:00Z',
          modifiedDateTime: '2026-02-04T08:30:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'ML-based customer churn predictions',
          tags: ['churn', 'ml', 'prediction']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-sales-na-002',
          name: 'Customer Intelligence Dataset',
          description: 'Customer data with ML scoring',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-12T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          tables: [
            { name: 'FactCustomerBehavior', columns: [{ name: 'CustomerID', dataType: 'String' }] },
            { name: 'DimSegment', columns: [{ name: 'SegmentID', dataType: 'Int64' }] }
          ],
          upstreamDatamarts: [{ targetDatamartId: 'art-000003', groupId: 'ws-sales-na' }],
          users: [],
          tags: ['customer', 'ml']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-018' }
      ]
    },
    {
      id: generateWorkspaceId(),
      name: 'Sales NA - Pipeline Management',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: false,
      domainId: 'dom-sales-na',
      description: 'Sales pipeline and opportunity tracking',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Sales Pipeline Report',
          datasetId: 'art-sales-na-003',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-20T07:00:00Z',
          modifiedDateTime: '2026-02-05T09:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Pipeline stage analysis',
          tags: ['pipeline', 'opportunities']
        }
      ],
      dashboards: [
        {
          id: generateArtifactId(),
          displayName: 'Pipeline Dashboard',
          isReadOnly: false,
          tiles: [],
          users: [],
          tags: ['pipeline']
        }
      ],
      datasets: [
        {
          id: 'art-sales-na-003',
          name: 'Pipeline Dataset',
          description: 'Opportunity pipeline data',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-20T07:00:00Z',
          targetStorageMode: 'DirectQuery',
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactOpportunities', columns: [{ name: 'OpportunityID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['pipeline', 'crm']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Member', graphId: 'graph-019' }
      ]
    },

    // ====== SALES EMEA - Additional Workspaces ======
    {
      id: generateWorkspaceId(),
      name: 'Sales EMEA - Regional Analytics',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-sales-002',
      domainId: 'dom-sales-emea',
      description: 'EMEA regional sales metrics',
      reports: [
        {
          id: generateArtifactId(),
          name: 'EMEA Sales Performance',
          datasetId: 'art-sales-emea-001',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-08T08:00:00Z',
          modifiedDateTime: '2026-02-01T10:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'Country-level sales in EMEA',
          tags: ['emea', 'regional', 'sales']
        },
        {
          id: generateArtifactId(),
          name: 'Currency Impact Analysis',
          datasetId: 'art-sales-emea-001',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-14T09:00:00Z',
          modifiedDateTime: '2026-02-02T11:30:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'FX impact on EMEA revenue',
          tags: ['currency', 'fx', 'emea']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-sales-emea-001',
          name: 'EMEA Sales Dataset',
          description: 'Multi-currency EMEA sales',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-08T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          tables: [
            { name: 'FactSalesEMEA', columns: [{ name: 'SaleID', dataType: 'Int64' }] },
            { name: 'DimCurrency', columns: [{ name: 'CurrencyCode', dataType: 'String' }] }
          ],
          upstreamDatasets: [{ targetDatasetId: 'art-000001', groupId: 'ws-sales-na' }],
          users: [],
          tags: ['emea', 'sales']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Member', graphId: 'graph-020' }
      ]
    },
    {
      id: generateWorkspaceId(),
      name: 'Sales EMEA - Partner Analytics',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: false,
      domainId: 'dom-sales-emea',
      description: 'Channel partner performance',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Partner Performance Scorecard',
          datasetId: 'art-sales-emea-002',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-16T08:00:00Z',
          modifiedDateTime: '2026-02-03T09:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Channel partner KPIs',
          tags: ['partner', 'channel', 'emea']
        }
      ],
      dashboards: [
        {
          id: generateArtifactId(),
          displayName: 'Partner Dashboard',
          isReadOnly: false,
          tiles: [],
          users: [],
          tags: ['partner']
        }
      ],
      datasets: [
        {
          id: 'art-sales-emea-002',
          name: 'Partner Dataset',
          description: 'Channel partner data',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-16T08:00:00Z',
          targetStorageMode: 'DirectQuery',
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactPartnerSales', columns: [{ name: 'PartnerID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['partner', 'channel']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Member', graphId: 'graph-021' }
      ]
    },

    // ====== FINANCE - Additional Workspaces ======
    {
      id: generateWorkspaceId(),
      name: 'Finance - General Ledger',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-finance-001',
      domainId: 'dom-finance',
      description: 'GL and accounting reports',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Trial Balance Report',
          datasetId: 'art-finance-001',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-07T08:00:00Z',
          modifiedDateTime: '2026-02-01T08:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          users: [],
          description: 'Monthly trial balance',
          tags: ['gl', 'accounting', 'trial-balance']
        },
        {
          id: generateArtifactId(),
          name: 'Account Reconciliation',
          datasetId: 'art-finance-001',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-10T09:00:00Z',
          modifiedDateTime: '2026-02-02T09:30:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'Account reconciliation status',
          tags: ['reconciliation', 'gl']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-finance-001',
          name: 'General Ledger Dataset',
          description: 'GL transactions and balances',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-07T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          tables: [
            { name: 'FactGLTransactions', columns: [{ name: 'TransactionID', dataType: 'Int64' }] },
            { name: 'DimAccount', columns: [{ name: 'AccountNumber', dataType: 'String' }] }
          ],
          users: [],
          tags: ['gl', 'finance']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Member', graphId: 'graph-022' }
      ]
    },
    {
      id: generateWorkspaceId(),
      name: 'Finance - Accounts Receivable',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-finance-001',
      domainId: 'dom-finance',
      description: 'AR and collections analytics',
      reports: [
        {
          id: generateArtifactId(),
          name: 'AR Aging Report',
          datasetId: 'art-finance-002',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-11T08:00:00Z',
          modifiedDateTime: '2026-02-04T10:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'Aging buckets for receivables',
          tags: ['ar', 'aging', 'collections']
        },
        {
          id: generateArtifactId(),
          name: 'Collections Dashboard Report',
          datasetId: 'art-finance-002',
          reportType: 'PaginatedReport',
          createdDateTime: '2026-01-15T09:00:00Z',
          modifiedDateTime: '2026-02-05T08:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Paginated collections report',
          tags: ['ar', 'collections', 'paginated']
        }
      ],
      dashboards: [
        {
          id: generateArtifactId(),
          displayName: 'AR Dashboard',
          isReadOnly: false,
          tiles: [],
          users: [],
          tags: ['ar']
        }
      ],
      datasets: [
        {
          id: 'art-finance-002',
          name: 'AR Dataset',
          description: 'Receivables and payment data',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-11T08:00:00Z',
          targetStorageMode: 'DirectQuery',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          tables: [
            { name: 'FactInvoices', columns: [{ name: 'InvoiceID', dataType: 'String' }] },
            { name: 'FactPayments', columns: [{ name: 'PaymentID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['ar', 'receivables']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Member', graphId: 'graph-023' }
      ]
    },
    {
      id: generateWorkspaceId(),
      name: 'Finance - Accounts Payable',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: false,
      domainId: 'dom-finance',
      description: 'AP and vendor analytics',
      reports: [
        {
          id: generateArtifactId(),
          name: 'AP Aging Report',
          datasetId: 'art-finance-003',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-13T08:00:00Z',
          modifiedDateTime: '2026-02-03T09:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Payables aging analysis',
          tags: ['ap', 'aging', 'vendor']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-finance-003',
          name: 'AP Dataset',
          description: 'Payables and vendor data',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-13T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactBills', columns: [{ name: 'BillID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['ap', 'payables']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Member', graphId: 'graph-024' }
      ]
    },
    {
      id: generateWorkspaceId(),
      name: 'Finance - Cash Management',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-finance-001',
      domainId: 'dom-finance',
      description: 'Cash flow and treasury analytics',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Cash Flow Forecast',
          datasetId: 'art-finance-004',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-17T08:00:00Z',
          modifiedDateTime: '2026-02-06T09:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          users: [],
          description: '13-week cash forecast',
          tags: ['cash', 'forecast', 'treasury']
        }
      ],
      dashboards: [
        {
          id: generateArtifactId(),
          displayName: 'Treasury Dashboard',
          isReadOnly: false,
          tiles: [],
          users: [],
          tags: ['treasury', 'cash']
        }
      ],
      datasets: [
        {
          id: 'art-finance-004',
          name: 'Cash Flow Dataset',
          description: 'Cash positions and forecasts',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-17T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          tables: [
            { name: 'FactCashTransactions', columns: [{ name: 'TransactionID', dataType: 'Int64' }] },
            { name: 'FactCashForecast', columns: [{ name: 'ForecastDate', dataType: 'DateTime' }] }
          ],
          users: [],
          tags: ['cash', 'treasury']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-025' }
      ]
    },

    // ====== FP&A - Additional Workspaces ======
    {
      id: generateWorkspaceId(),
      name: 'FP&A - Variance Analysis',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-finance-001',
      domainId: 'dom-fpa',
      description: 'Budget vs actuals analysis',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Budget Variance Report',
          datasetId: 'art-fpa-001',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-09T08:00:00Z',
          modifiedDateTime: '2026-02-02T10:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'Monthly variance analysis',
          tags: ['budget', 'variance', 'fpa']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-fpa-001',
          name: 'Variance Analysis Dataset',
          description: 'Budget vs actuals data',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-09T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          tables: [
            { name: 'FactActuals', columns: [{ name: 'AccountID', dataType: 'String' }] },
            { name: 'FactBudget', columns: [{ name: 'AccountID', dataType: 'String' }] }
          ],
          upstreamDatasets: [{ targetDatasetId: 'art-finance-001', groupId: 'ws-finance' }],
          users: [],
          tags: ['budget', 'variance']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-026' }
      ]
    },

    // ====== MARKETING - Additional Workspaces ======
    {
      id: generateWorkspaceId(),
      name: 'Marketing - Email Campaigns',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: false,
      domainId: 'dom-marketing',
      description: 'Email marketing analytics',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Email Performance Report',
          datasetId: 'art-marketing-001',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-14T08:00:00Z',
          modifiedDateTime: '2026-02-04T09:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Campaign open and click rates',
          tags: ['email', 'campaign', 'marketing']
        }
      ],
      dashboards: [
        {
          id: generateArtifactId(),
          displayName: 'Email Marketing Dashboard',
          isReadOnly: false,
          tiles: [],
          users: [],
          tags: ['email']
        }
      ],
      datasets: [
        {
          id: 'art-marketing-001',
          name: 'Email Campaign Dataset',
          description: 'Email marketing metrics',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-14T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactEmailCampaigns', columns: [{ name: 'CampaignID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['email', 'marketing']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Member', graphId: 'graph-027' }
      ]
    },
    {
      id: generateWorkspaceId(),
      name: 'Marketing - Social Media Analytics',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: false,
      domainId: 'dom-marketing',
      description: 'Social media engagement tracking',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Social Media Engagement',
          datasetId: 'art-marketing-002',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-18T08:00:00Z',
          modifiedDateTime: '2026-02-05T10:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Social media metrics',
          tags: ['social', 'engagement', 'marketing']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-marketing-002',
          name: 'Social Media Dataset',
          description: 'Social platform analytics',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-18T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactSocialPosts', columns: [{ name: 'PostID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['social', 'marketing']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Member', graphId: 'graph-028' }
      ]
    },
    {
      id: generateWorkspaceId(),
      name: 'Marketing - SEO & SEM',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: false,
      domainId: 'dom-marketing',
      description: 'Search engine marketing analytics',
      reports: [
        {
          id: generateArtifactId(),
          name: 'SEO Performance',
          datasetId: 'art-marketing-003',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-21T08:00:00Z',
          modifiedDateTime: '2026-02-06T09:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Organic search rankings',
          tags: ['seo', 'search', 'marketing']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-marketing-003',
          name: 'SEO Dataset',
          description: 'Search engine data',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-21T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactKeywordRankings', columns: [{ name: 'Keyword', dataType: 'String' }] }
          ],
          users: [],
          tags: ['seo', 'search']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Member', graphId: 'graph-029' }
      ]
    },
    {
      id: generateWorkspaceId(),
      name: 'Marketing - Attribution Modeling',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-marketing-001',
      domainId: 'dom-marketing',
      description: 'Marketing attribution and ROI',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Multi-Touch Attribution',
          datasetId: 'art-marketing-004',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-19T08:00:00Z',
          modifiedDateTime: '2026-02-05T11:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'Customer journey attribution',
          tags: ['attribution', 'roi', 'marketing']
        }
      ],
      dashboards: [
        {
          id: generateArtifactId(),
          displayName: 'Attribution Dashboard',
          isReadOnly: false,
          tiles: [],
          users: [],
          tags: ['attribution']
        }
      ],
      datasets: [
        {
          id: 'art-marketing-004',
          name: 'Attribution Dataset',
          description: 'Marketing touchpoint data',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-19T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          tables: [
            { name: 'FactTouchpoints', columns: [{ name: 'TouchpointID', dataType: 'String' }] },
            { name: 'FactConversions', columns: [{ name: 'ConversionID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['attribution', 'marketing']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-030' }
      ]
    },

    // ====== HR - Additional Workspaces ======
    {
      id: generateWorkspaceId(),
      name: 'HR - Talent Acquisition',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: false,
      domainId: 'dom-hr',
      description: 'Recruiting and hiring analytics',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Recruiting Funnel',
          datasetId: 'art-hr-001',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-12T08:00:00Z',
          modifiedDateTime: '2026-02-03T09:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'Hiring pipeline metrics',
          tags: ['recruiting', 'hiring', 'hr']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-hr-001',
          name: 'Recruiting Dataset',
          description: 'Candidate and hiring data',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-12T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          tables: [
            { name: 'FactCandidates', columns: [{ name: 'CandidateID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['recruiting', 'hr']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Member', graphId: 'graph-031' }
      ]
    },
    {
      id: generateWorkspaceId(),
      name: 'HR - Compensation Analytics',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-hr-001',
      domainId: 'dom-hr',
      description: 'Compensation and benefits analysis',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Compensation Benchmarking',
          datasetId: 'art-hr-002',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-16T08:00:00Z',
          modifiedDateTime: '2026-02-04T10:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          users: [],
          description: 'Salary benchmarking vs market',
          tags: ['compensation', 'benchmarking', 'hr']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-hr-002',
          name: 'Compensation Dataset',
          description: 'Salary and benefits data',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-16T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          tables: [
            { name: 'FactCompensation', columns: [{ name: 'EmployeeID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['compensation', 'hr']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-032' }
      ]
    },
    {
      id: generateWorkspaceId(),
      name: 'HR - Learning & Development',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: false,
      domainId: 'dom-hr',
      description: 'Training and development analytics',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Training Completion Report',
          datasetId: 'art-hr-003',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-20T08:00:00Z',
          modifiedDateTime: '2026-02-06T09:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Training program metrics',
          tags: ['training', 'learning', 'hr']
        }
      ],
      dashboards: [
        {
          id: generateArtifactId(),
          displayName: 'L&D Dashboard',
          isReadOnly: false,
          tiles: [],
          users: [],
          tags: ['training']
        }
      ],
      datasets: [
        {
          id: 'art-hr-003',
          name: 'Learning Dataset',
          description: 'Training and courses data',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-20T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactTrainingEnrollments', columns: [{ name: 'EnrollmentID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['training', 'hr']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Member', graphId: 'graph-033' }
      ]
    },

    // ====== MANUFACTURING - Additional Workspaces ======
    {
      id: generateWorkspaceId(),
      name: 'Manufacturing - Production Planning',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-manufacturing-001',
      domainId: 'dom-manufacturing',
      description: 'Production scheduling and capacity',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Production Schedule',
          datasetId: 'art-manufacturing-001',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-10T08:00:00Z',
          modifiedDateTime: '2026-02-02T10:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Weekly production plan',
          tags: ['production', 'planning', 'manufacturing']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-manufacturing-001',
          name: 'Production Planning Dataset',
          description: 'Production orders and capacity',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-10T08:00:00Z',
          targetStorageMode: 'DirectQuery',
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactProductionOrders', columns: [{ name: 'OrderID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['production', 'manufacturing']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Member', graphId: 'graph-034' }
      ]
    },
    {
      id: generateWorkspaceId(),
      name: 'Manufacturing - Quality Control',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-manufacturing-001',
      domainId: 'dom-manufacturing',
      description: 'Quality metrics and defect tracking',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Defect Analysis',
          datasetId: 'art-manufacturing-002',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-14T08:00:00Z',
          modifiedDateTime: '2026-02-04T09:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Defect rates and root causes',
          tags: ['quality', 'defects', 'manufacturing']
        }
      ],
      dashboards: [
        {
          id: generateArtifactId(),
          displayName: 'Quality Dashboard',
          isReadOnly: false,
          tiles: [],
          users: [],
          tags: ['quality']
        }
      ],
      datasets: [
        {
          id: 'art-manufacturing-002',
          name: 'Quality Dataset',
          description: 'Quality inspection data',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-14T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactQualityInspections', columns: [{ name: 'InspectionID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['quality', 'manufacturing']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-035' }
      ]
    },

    // ====== SUPPLY CHAIN - Additional Workspaces ======
    {
      id: generateWorkspaceId(),
      name: 'Supply Chain - Procurement',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: false,
      domainId: 'dom-supply',
      description: 'Procurement and vendor analytics',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Vendor Performance',
          datasetId: 'art-supply-001',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-11T08:00:00Z',
          modifiedDateTime: '2026-02-03T09:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Vendor scorecards',
          tags: ['procurement', 'vendor', 'supply']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-supply-001',
          name: 'Procurement Dataset',
          description: 'Purchase orders and vendors',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-11T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactPurchaseOrders', columns: [{ name: 'POID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['procurement', 'supply']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Member', graphId: 'graph-036' }
      ]
    },
    {
      id: generateWorkspaceId(),
      name: 'Supply Chain - Logistics',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-supply-001',
      domainId: 'dom-supply',
      description: 'Shipping and logistics analytics',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Shipping Performance',
          datasetId: 'art-supply-002',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-15T08:00:00Z',
          modifiedDateTime: '2026-02-05T10:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'On-time delivery metrics',
          tags: ['logistics', 'shipping', 'supply']
        }
      ],
      dashboards: [
        {
          id: generateArtifactId(),
          displayName: 'Logistics Dashboard',
          isReadOnly: false,
          tiles: [],
          users: [],
          tags: ['logistics']
        }
      ],
      datasets: [
        {
          id: 'art-supply-002',
          name: 'Logistics Dataset',
          description: 'Shipment tracking data',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-15T08:00:00Z',
          targetStorageMode: 'DirectQuery',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactShipments', columns: [{ name: 'ShipmentID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['logistics', 'supply']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Member', graphId: 'graph-037' }
      ]
    },

    // ====== IT - Additional Workspaces ======
    {
      id: generateWorkspaceId(),
      name: 'IT - Infrastructure Monitoring',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-it-001',
      domainId: 'dom-it',
      description: 'Infrastructure and server monitoring',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Server Health Report',
          datasetId: 'art-it-001',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-13T08:00:00Z',
          modifiedDateTime: '2026-02-04T09:00:00Z',
          modifiedBy: MOCK_USERS.contributor.emailAddress,
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Server performance metrics',
          tags: ['infrastructure', 'monitoring', 'it']
        }
      ],
      dashboards: [
        {
          id: generateArtifactId(),
          displayName: 'Infrastructure Dashboard',
          isReadOnly: false,
          tiles: [],
          users: [],
          tags: ['infrastructure']
        }
      ],
      datasets: [
        {
          id: 'art-it-001',
          name: 'Infrastructure Dataset',
          description: 'Server telemetry data',
          configuredBy: MOCK_USERS.contributor.emailAddress,
          createdDate: '2026-01-13T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'None' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactServerMetrics', columns: [{ name: 'ServerID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['infrastructure', 'it']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.contributor, principalType: 'User', groupUserAccessRight: 'Member', graphId: 'graph-038' }
      ]
    },
    {
      id: generateWorkspaceId(),
      name: 'IT - Application Performance',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-it-001',
      domainId: 'dom-it',
      description: 'Application monitoring and APM',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Application Health',
          datasetId: 'art-it-002',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-17T08:00:00Z',
          modifiedDateTime: '2026-02-06T10:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Application response times',
          tags: ['apm', 'application', 'it']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-it-002',
          name: 'APM Dataset',
          description: 'Application performance data',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-17T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactAPMMetrics', columns: [{ name: 'ApplicationID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['apm', 'it']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-039' }
      ]
    },

    // ====== DATA SCIENCE - Additional Workspaces ======
    {
      id: generateWorkspaceId(),
      name: 'Data Science - Customer Churn',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-datascience-001',
      domainId: 'dom-datascience',
      description: 'Customer churn prediction models',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Churn Risk Dashboard',
          datasetId: 'art-datascience-001',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-19T08:00:00Z',
          modifiedDateTime: '2026-02-05T11:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          description: 'ML churn predictions',
          tags: ['churn', 'ml', 'datascience']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-datascience-001',
          name: 'Churn Prediction Dataset',
          description: 'ML churn scores',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-19T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          tables: [
            { name: 'FactChurnPredictions', columns: [{ name: 'CustomerID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['churn', 'ml']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-040' }
      ]
    },

    // ====== EXECUTIVE - Additional Workspaces ======
    {
      id: generateWorkspaceId(),
      name: 'Executive - Board Reporting',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-executive-001',
      domainId: 'dom-executive',
      description: 'Board-level reports and KPIs',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Board Report - Q1 2026',
          datasetId: 'art-executive-001',
          reportType: 'PaginatedReport',
          createdDateTime: '2026-01-25T08:00:00Z',
          modifiedDateTime: '2026-02-07T09:00:00Z',
          modifiedBy: MOCK_USERS.admin.emailAddress,
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          users: [],
          description: 'Quarterly board report',
          tags: ['board', 'executive', 'paginated']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-executive-001',
          name: 'Board Metrics Dataset',
          description: 'Executive KPI data',
          configuredBy: MOCK_USERS.admin.emailAddress,
          createdDate: '2026-01-25T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          tables: [
            { name: 'FactExecutiveKPIs', columns: [{ name: 'KPIID', dataType: 'String' }] }
          ],
          upstreamDatasets: [
            { targetDatasetId: 'art-000001', groupId: 'ws-sales-na' },
            { targetDatasetId: 'art-finance-001', groupId: 'ws-finance' },
            { targetDatasetId: 'art-hr-workforce', groupId: 'ws-hr' }
          ],
          users: [],
          tags: ['board', 'executive']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.admin, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-041' }
      ]
    },

    // ====== COMPLIANCE - Additional Workspaces ======
    {
      id: generateWorkspaceId(),
      name: 'Compliance - Regulatory Reporting',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-compliance-001',
      domainId: 'dom-compliance',
      description: 'Regulatory compliance reports',
      reports: [
        {
          id: generateArtifactId(),
          name: 'SOX Compliance Report',
          datasetId: 'art-compliance-001',
          reportType: 'PaginatedReport',
          createdDateTime: '2026-01-23T08:00:00Z',
          modifiedDateTime: '2026-02-06T10:00:00Z',
          modifiedBy: MOCK_USERS.admin.emailAddress,
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          users: [],
          description: 'Sarbanes-Oxley compliance',
          tags: ['compliance', 'sox', 'regulatory']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-compliance-001',
          name: 'Compliance Dataset',
          description: 'Regulatory compliance data',
          configuredBy: MOCK_USERS.admin.emailAddress,
          createdDate: '2026-01-23T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.HIGHLY_CONFIDENTIAL },
          tables: [
            { name: 'FactComplianceMetrics', columns: [{ name: 'MetricID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['compliance', 'regulatory']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.admin, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-042' }
      ]
    },

    // ====== DATA ENGINEERING - Lakehouse & Data Warehouse ======
    {
      id: generateWorkspaceId(),
      name: 'Data Engineering - Enterprise Lakehouse',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-datascience-001',
      domainId: 'dom-datascience',
      description: 'Centralized enterprise data lakehouse',
      reports: [],
      dashboards: [],
      datasets: [],
      dataflows: [],
      datamarts: [
        {
          id: generateArtifactId(),
          name: 'Enterprise Bronze Lakehouse',
          description: 'Bronze layer - raw data landing zone',
          type: 'Lakehouse',
          configuredBy: MOCK_USERS.admin.emailAddress,
          modifiedDateTime: '2026-01-28T10:00:00Z',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          tags: ['bronze', 'raw', 'lakehouse', 'delta']
        },
        {
          id: generateArtifactId(),
          name: 'Enterprise Gold Lakehouse',
          description: 'Gold layer - curated analytics-ready data',
          type: 'Lakehouse',
          configuredBy: MOCK_USERS.admin.emailAddress,
          modifiedDateTime: '2026-01-29T14:00:00Z',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          tags: ['gold', 'curated', 'lakehouse', 'delta']
        },
        {
          id: generateArtifactId(),
          name: 'Enterprise Data Warehouse',
          description: 'SQL-based enterprise data warehouse',
          type: 'Datawarehouse',
          configuredBy: MOCK_USERS.admin.emailAddress,
          modifiedDateTime: '2026-01-27T16:00:00Z',
          endorsementDetails: { endorsement: 'Certified', certifiedBy: MOCK_USERS.admin.emailAddress },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.CONFIDENTIAL },
          users: [],
          tags: ['warehouse', 'sql', 'analytics']
        }
      ],
      users: [
        { ...MOCK_USERS.admin, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-043' }
      ]
    },

    // ====== DATA ENGINEERING - Notebooks & Pipelines ======
    {
      id: generateWorkspaceId(),
      name: 'Data Engineering - ETL Pipelines',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-datascience-001',
      domainId: 'dom-datascience',
      description: 'Data transformation pipelines and notebooks',
      reports: [],
      dashboards: [],
      datasets: [],
      dataflows: [
        {
          objectId: generateArtifactId(),
          name: 'Bronze to Silver Pipeline',
          description: 'Data quality and transformation',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          modifiedDateTime: '2026-01-29T09:00:00Z',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          tags: ['pipeline', 'etl', 'transformation']
        },
        {
          objectId: generateArtifactId(),
          name: 'Silver to Gold Pipeline',
          description: 'Business logic and aggregations',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          modifiedDateTime: '2026-01-28T15:00:00Z',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          tags: ['pipeline', 'etl', 'aggregation']
        }
      ],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-044' }
      ]
    },

    // ====== REAL-TIME ANALYTICS - Eventstream & KQL ======
    {
      id: generateWorkspaceId(),
      name: 'Real-Time - IoT Event Processing',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-manufacturing-001',
      domainId: 'dom-manufacturing',
      description: 'Real-time IoT sensor data processing',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Real-Time Sensor Dashboard',
          datasetId: 'art-realtime-001',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-25T08:00:00Z',
          modifiedDateTime: '2026-01-30T10:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'Live sensor telemetry',
          tags: ['realtime', 'iot', 'sensors']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-realtime-001',
          name: 'IoT Sensor Dataset',
          description: 'Real-time sensor data',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-25T08:00:00Z',
          targetStorageMode: 'DirectQuery',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactSensorReadings', columns: [{ name: 'SensorID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['realtime', 'iot']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-045' }
      ]
    },

    // ====== DATA SCIENCE - ML Models ======
    {
      id: generateWorkspaceId(),
      name: 'Data Science - Predictive Models',
      type: 'Workspace',
      state: 'Active',
      isOnDedicatedCapacity: true,
      capacityId: 'cap-datascience-001',
      domainId: 'dom-datascience',
      description: 'Machine learning and AI models',
      reports: [
        {
          id: generateArtifactId(),
          name: 'Model Performance Dashboard',
          datasetId: 'art-ml-001',
          reportType: 'PowerBIReport',
          createdDateTime: '2026-01-22T08:00:00Z',
          modifiedDateTime: '2026-01-29T14:00:00Z',
          modifiedBy: MOCK_USERS.analyst.emailAddress,
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          users: [],
          description: 'ML model metrics and tracking',
          tags: ['ml', 'models', 'metrics']
        }
      ],
      dashboards: [],
      datasets: [
        {
          id: 'art-ml-001',
          name: 'ML Metrics Dataset',
          description: 'Model performance metrics',
          configuredBy: MOCK_USERS.analyst.emailAddress,
          createdDate: '2026-01-22T08:00:00Z',
          targetStorageMode: 'Import',
          endorsementDetails: { endorsement: 'Promoted' },
          sensitivityLabel: { labelId: SENSITIVITY_LABELS.INTERNAL },
          tables: [
            { name: 'FactModelMetrics', columns: [{ name: 'ModelID', dataType: 'String' }] }
          ],
          users: [],
          tags: ['ml', 'metrics']
        }
      ],
      dataflows: [],
      datamarts: [],
      users: [
        { ...MOCK_USERS.analyst, principalType: 'User', groupUserAccessRight: 'Admin', graphId: 'graph-046' }
      ]
    }
  ],
  datasourceInstances: [
    {
      datasourceType: 'Sql',
      connectionDetails: {
        server: 'sql-salesforce.database.windows.net',
        database: 'SalesforceDB'
      },
      datasourceId: 'ds-001',
      gatewayId: 'gateway-001'
    },
    {
      datasourceType: 'Sql',
      connectionDetails: {
        server: 'sap-erp.contoso.com',
        database: 'SAPERP'
      },
      datasourceId: 'ds-002',
      gatewayId: 'gateway-001'
    },
    {
      datasourceType: 'Web',
      connectionDetails: {
        url: 'https://api.workday.com/v1'
      },
      datasourceId: 'ds-003'
    }
  ],
  misconfiguredDatasourceInstances: []
};

// Update domain workspace assignments
MOCK_DOMAINS.forEach(domain => {
  domain.workspaceIds = MOCK_SCANNER_RESPONSE.workspaces
    .filter(ws => ws.domainId === domain.id)
    .map(ws => ws.id);
});
