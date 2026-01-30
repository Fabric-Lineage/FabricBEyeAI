// Helper to generate IDs
const id = (prefix: string, suffix: string | number) => `${prefix}-${suffix}`;

export const MOCK_WORKSPACES = [
    // 1. RAW DATA LAYER (Data Engineering)
    {
        id: 'ws-raw',
        name: 'DE - Raw Data Lake',
        state: 'Active',
        datasets: [],
        reports: [],
        dashboards: [],
        dataflows: [
            { objectId: 'df-raw-logs', name: 'Raw Server Logs', workspaceId: 'ws-raw', upstreamDataflows: [] },
            { objectId: 'df-raw-sales', name: 'Raw Sales Transactions', workspaceId: 'ws-raw', upstreamDataflows: [] },
            { objectId: 'df-raw-iot', name: 'IoT Telemetry (Raw)', workspaceId: 'ws-raw', upstreamDataflows: [] }
        ]
    },
    // 2. ENRICHED DATA LAYER (Shared Semantic Models)
    {
        id: 'ws-bi-core',
        name: 'BI - Core Models',
        state: 'Active',
        datasets: [
            { 
                id: 'ds-gold-customer', 
                name: 'Golden Customer Record', 
                workspaceId: 'ws-bi-core', 
                upstreamDataflows: [{ targetDataflowId: 'df-raw-sales', groupId: 'ws-raw' }] 
            },
            { 
                id: 'ds-gold-product', 
                name: 'Product Master', 
                workspaceId: 'ws-bi-core', 
                upstreamDataflows: [] 
            },
            {
                id: 'ds-gold-transactions',
                name: 'Transaction History',
                workspaceId: 'ws-bi-core',
                upstreamDataflows: [{ targetDataflowId: 'df-raw-sales', groupId: 'ws-raw' }]
            }
        ],
        reports: [
            { id: 'rep-data-dictionary', name: 'Data Dictionary', workspaceId: 'ws-bi-core', datasetId: 'ds-gold-customer' },
            { id: 'rep-data-quality', name: 'Data Quality Dashboard', workspaceId: 'ws-bi-core', datasetId: 'ds-gold-customer' },
            { id: 'rep-lineage-docs', name: 'Lineage Documentation', workspaceId: 'ws-bi-core', datasetId: 'ds-gold-product' }
        ],
        dashboards: [
            { id: 'db-bi-health', displayName: 'BI Health Monitor', workspaceId: 'ws-bi-core', tiles: [] }
        ],
        dataflows: [
             { 
                 objectId: 'df-dim-date', 
                 name: 'Date Dimension', 
                 workspaceId: 'ws-bi-core', 
                 upstreamDataflows: [] 
             },
             {
                 objectId: 'df-dim-geo',
                 name: 'Geography Dimension',
                 workspaceId: 'ws-bi-core',
                 upstreamDataflows: []
             }
        ]
    },
    // 3. DEPARTMENT: SALES (Heavy Consumer)
    {
        id: 'ws-sales',
        name: 'Sales Dept',
        state: 'Active',
        datasets: [
            { 
                id: 'ds-sales-regional', 
                name: 'Regional Sales Performance', 
                workspaceId: 'ws-sales', 
                upstreamDataflows: [
                    { targetDataflowId: 'df-dim-date', groupId: 'ws-bi-core' }
                ] 
            },
            {
                id: 'ds-sales-forecasting',
                name: 'Sales Forecasting Model',
                workspaceId: 'ws-sales',
                upstreamDataflows: []
            },
            {
                id: 'ds-territory-analysis',
                name: 'Territory Performance',
                workspaceId: 'ws-sales',
                upstreamDataflows: []
            }
        ],
        reports: [
            { id: 'rep-sales-q1', name: 'Q1 Sales Deep Dive', workspaceId: 'ws-sales', datasetId: 'ds-sales-regional' },
            { id: 'rep-sales-reps', name: 'Sales Rep Targets', workspaceId: 'ws-sales', datasetId: 'ds-sales-regional' },
            { id: 'rep-cust-churn', name: 'Customer Churn Analysis', workspaceId: 'ws-sales', datasetId: 'ds-gold-customer' },
            { id: 'rep-sales-forecast', name: 'Quarterly Forecast', workspaceId: 'ws-sales', datasetId: 'ds-sales-forecasting' },
            { id: 'rep-territory', name: 'Territory Overview', workspaceId: 'ws-sales', datasetId: 'ds-territory-analysis' },
            { id: 'rep-pipeline', name: 'Sales Pipeline', workspaceId: 'ws-sales', datasetId: 'ds-sales-regional' }
        ],
        dashboards: [
            { id: 'db-sales-leaderboard', displayName: 'Sales Leaderboard', workspaceId: 'ws-sales', tiles: [] },
            { id: 'db-sales-exec', displayName: 'Sales Executive Dashboard', workspaceId: 'ws-sales', tiles: [] }
        ],
        dataflows: [
            { objectId: 'df-sales-staging', name: 'Sales Staging', workspaceId: 'ws-sales', upstreamDataflows: [] }
        ]
    },
    // 4. DEPARTMENT: FINANCE (High Compliance)
    {
        id: 'ws-finance',
        name: 'Finance & Compliance',
        state: 'Active',
        datasets: [
            { id: 'ds-revenue', name: 'Certified Revenue', workspaceId: 'ws-finance', upstreamDataflows: [] }
        ],
        reports: [
            { id: 'rep-pnl', name: 'P&L Statement', workspaceId: 'ws-finance', datasetId: 'ds-revenue' },
            { id: 'rep-audit', name: 'Audit Logs', workspaceId: 'ws-finance', datasetId: 'ds-revenue' }
        ],
        dashboards: [
             { id: 'db-cfo', displayName: 'CFO Daily Brief', workspaceId: 'ws-finance', tiles: [] }
        ],
        dataflows: [
             // Finance producing curated forex data for others
             { objectId: 'df-forex', name: 'Official Forex Rates', workspaceId: 'ws-finance', upstreamDataflows: [] }
        ]
    },
    // 5. DEPARTMENT: SUPPLY CHAIN (Complex Operations)
    {
        id: 'ws-ops',
        name: 'Supply Chain Operations',
        state: 'Active',
        datasets: [
            { 
                 id: 'ds-logistics', 
                 name: 'Logistics Optimization', 
                 workspaceId: 'ws-ops',
                 upstreamDataflows: [
                     { targetDataflowId: 'df-forex', groupId: 'ws-finance' }, // Needs money
                     { targetDataflowId: 'df-raw-iot', groupId: 'ws-raw' }    // Needs raw sensor data
                 ]
            }
        ],
        reports: [
            { id: 'rep-fleet', name: 'Fleet Maintenance', workspaceId: 'ws-ops', datasetId: 'ds-logistics' },
            { id: 'rep-delivery', name: 'On-Time Delivery', workspaceId: 'ws-ops', datasetId: 'ds-logistics' }
        ],
        dashboards: [],
        dataflows: []
    },
    // 6. EXECUTIVE SUMMARY (The Aggregate View)
    {
        id: 'ws-exec',
        name: 'Executive Board',
        state: 'Active',
        datasets: [], // Executives just view reports usually
        reports: [],
        dashboards: [
            { id: 'db-ceo', displayName: 'CEO Overview', workspaceId: 'ws-exec', tiles: [] }
        ],
        dataflows: []
    },

    // ===== ISOLATED CLUSTER 2: HR & EMPLOYEE ANALYTICS (No connection to Sales/Finance) =====
    {
        id: 'ws-hr-core',
        name: 'HR - Employee Data',
        state: 'Active',
        datasets: [
            { id: 'ds-hr-employees', name: 'Employee Master Data', workspaceId: 'ws-hr-core', upstreamDataflows: [] }
        ],
        reports: [],
        dashboards: [],
        dataflows: [
            { objectId: 'df-hr-payroll', name: 'Payroll Data', workspaceId: 'ws-hr-core', upstreamDataflows: [] }
        ]
    },
    {
        id: 'ws-hr-analytics',
        name: 'HR Analytics',
        state: 'Active',
        datasets: [
            { 
                id: 'ds-hr-performance', 
                name: 'Performance Reviews', 
                workspaceId: 'ws-hr-analytics',
                upstreamDataflows: [
                    { targetDataflowId: 'df-hr-payroll', groupId: 'ws-hr-core' }
                ]
            }
        ],
        reports: [
            { id: 'rep-hr-retention', name: 'Retention Analysis', workspaceId: 'ws-hr-analytics', datasetId: 'ds-hr-performance' },
            { id: 'rep-hr-diversity', name: 'Diversity Report', workspaceId: 'ws-hr-analytics', datasetId: 'ds-hr-employees' }
        ],
        dashboards: [
            { id: 'db-hr-chro', displayName: 'CHRO Dashboard', workspaceId: 'ws-hr-analytics', tiles: [] }
        ],
        dataflows: []
    },

    // ===== ISOLATED CLUSTER 3: DATA SCIENCE (Standalone) =====
    {
        id: 'ws-datascience',
        name: 'Data Science Lab',
        state: 'Active',
        datasets: [
            { id: 'ds-ml-training', name: 'ML Training Dataset', workspaceId: 'ws-datascience', upstreamDataflows: [] }
        ],
        reports: [
            { id: 'rep-model-metrics', name: 'Model Performance', workspaceId: 'ws-datascience', datasetId: 'ds-ml-training' }
        ],
        dashboards: [],
        dataflows: []
    },

    // ===== ISOLATED CLUSTER 4: MARKETING (Separate from Sales) =====
    {
        id: 'ws-marketing-raw',
        name: 'Marketing - Raw Data',
        state: 'Active',
        datasets: [],
        reports: [],
        dashboards: [],
        dataflows: [
            { objectId: 'df-marketing-campaigns', name: 'Campaign Data', workspaceId: 'ws-marketing-raw', upstreamDataflows: [] },
            { objectId: 'df-marketing-social', name: 'Social Media Metrics', workspaceId: 'ws-marketing-raw', upstreamDataflows: [] }
        ]
    },
    {
        id: 'ws-marketing-analytics',
        name: 'Marketing Analytics',
        state: 'Active',
        datasets: [
            {
                id: 'ds-marketing-roi',
                name: 'Campaign ROI',
                workspaceId: 'ws-marketing-analytics',
                upstreamDataflows: [
                    { targetDataflowId: 'df-marketing-campaigns', groupId: 'ws-marketing-raw' },
                    { targetDataflowId: 'df-marketing-social', groupId: 'ws-marketing-raw' }
                ]
            }
        ],
        reports: [
            { id: 'rep-marketing-performance', name: 'Marketing Performance', workspaceId: 'ws-marketing-analytics', datasetId: 'ds-marketing-roi' }
        ],
        dashboards: [
            { id: 'db-marketing-cmo', displayName: 'CMO Dashboard', workspaceId: 'ws-marketing-analytics', tiles: [] }
        ],
        dataflows: []
    },

    // ===== ISOLATED CLUSTER 5: IoT Manufacturing (Standalone) =====
    {
        id: 'ws-iot-platform',
        name: 'IoT Platform',
        state: 'Active',
        datasets: [],
        reports: [],
        dashboards: [],
        dataflows: [
            { objectId: 'df-iot-sensors', name: 'Sensor Telemetry', workspaceId: 'ws-iot-platform', upstreamDataflows: [] }
        ]
    },
    {
        id: 'ws-manufacturing',
        name: 'Manufacturing Analytics',
        state: 'Active',
        datasets: [
            {
                id: 'ds-manufacturing-oee',
                name: 'Overall Equipment Effectiveness',
                workspaceId: 'ws-manufacturing',
                upstreamDataflows: [
                    { targetDataflowId: 'df-iot-sensors', groupId: 'ws-iot-platform' }
                ]
            }
        ],
        reports: [
            { id: 'rep-manufacturing-downtime', name: 'Downtime Analysis', workspaceId: 'ws-manufacturing', datasetId: 'ds-manufacturing-oee' }
        ],
        dashboards: [],
        dataflows: []
    },

    // ===== ISOLATED NODE: Customer Support (Single workspace, no connections) =====
    {
        id: 'ws-support',
        name: 'Customer Support',
        state: 'Active',
        datasets: [
            { id: 'ds-support-tickets', name: 'Support Tickets', workspaceId: 'ws-support', upstreamDataflows: [] }
        ],
        reports: [
            { id: 'rep-support-sla', name: 'SLA Compliance', workspaceId: 'ws-support', datasetId: 'ds-support-tickets' }
        ],
        dashboards: [],
        dataflows: []
    }
];

// Add cross-workspace connections via Dashboard tiles (Visual representation often links dash to reports)
const dashboard = MOCK_WORKSPACES.find(w => w.id === 'ws-exec')!.dashboards[0];
// CEO Dashboard pulls from Sales and Finance
dashboard['tiles'] = [
    { id: 'tile-1', title: 'Revenue Trend', reportId: 'rep-pnl' }, // From Finance
    { id: 'tile-2', title: 'Top Regions', reportId: 'rep-sales-q1' } // From Sales
];

// Add a few more reports to Exec that live in Exec workspace but connect to datasets elsewhere
MOCK_WORKSPACES.find(w => w.id === 'ws-exec')!.reports.push(
    { id: 'rep-exec-summary', name: 'Monthly Board Pack', workspaceId: 'ws-exec', datasetId: 'ds-revenue' } // connects to Finance dataset
);
