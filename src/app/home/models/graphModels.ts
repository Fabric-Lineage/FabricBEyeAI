export enum NodeType {
  Workspace,
  Dashboard,
  Report,
  SemanticModel,  // Renamed from Dataset for Fabric
  Dataflow,
  // Fabric Data Engineering types
  Lakehouse,
  Notebook,
  SparkJobDefinition,
  // Fabric Data Factory types
  Pipeline,
  DataflowGen2,  // More specific Fabric Dataflow
  // Fabric Data Warehouse types
  DataWarehouse,
  SQLAnalyticsEndpoint,
  // Fabric Data Science types
  MLModel,
  MLExperiment,
  // Fabric Real-Time Intelligence types
  Eventstream,
  Eventhouse,
  KQLDatabase,
  KQLQueryset,
  // Other Fabric types
  Datamart,
  PaginatedReport,
  App
}

export enum LinkType {
  CrossWorkspace,
  Contains,
}

export interface Node {
  id: string;
  type: NodeType;
  name: string;
  workspaceId: string;
  crossDownstreamWSIds?: string[];
  crossUpstreamWSIds?: string[];
  metadata?: {
    endorsement?: string;
    certifiedBy?: string;
    sensitivityLabel?: string;
    description?: string;
    [key: string]: any;
  };
}

export interface Link {
  source: string;
  target: string;
  type: LinkType;
}
