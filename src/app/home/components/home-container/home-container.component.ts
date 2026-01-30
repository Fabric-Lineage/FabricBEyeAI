/**
 * HomeContainerComponent - Main visualization component for PowerBEye
 * 
 * This component provides a 3D graph visualization of Microsoft Fabric workspaces,
 * their artifacts (Lakehouses, Warehouses, Reports, Datasets, etc.), and lineage connections.
 * 
 * Key Features:
 * - 3D force-directed graph using 3d-force-graph library
 * - Domain clustering for visual organization
 * - Advanced navigation: Focus Mode, Filters, Search
 * - Interactive controls: Pause, Fog, Curved Links
 * - Endorsement badges and sensitivity labels
 * - Support for 23+ Microsoft Fabric artifact types
 * 
 * @author PowerBEye Contributors
 * @version 2.0.0 - Microsoft Fabric Migration
 */

import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject, forkJoin } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

// 3D Graphics Libraries
import * as THREE from 'three';
import ForceGraph3D from '3d-force-graph';
import SpriteText from 'three-spritetext';

// Services
import { HomeProxy } from '../../services/home-proxy.service';
import { ScanService } from '../../services/scan.service';
import { AuthService } from 'src/app/services/auth.service';

// Models
import { Report, Dataset } from '../../models/dataModel';
import { Link, LinkType, Node, NodeType } from '../../models/graphModels';
import type { WorkspaceInfoResponse, Domain } from '../../models/scanner-api.types';

// Data
import { MOCK_SCANNER_RESPONSE, MOCK_DOMAINS } from '../../data/scanner-mock-data';

// Dialogs
import { ProgressBarDialogComponent } from 'src/app/components/progress-bar-dialog/progress-bar-dialog.component';
import { LoginDialogComponent } from 'src/app/components/login-dialog/login-dialog.component';
import { ErrorDialogComponent } from 'src/app/components/error-dialog/error-dialog.component';

// Constants
const WORKSPACE_LIMIT: number = 100;
const MAX_PARALLEL_API_CALLS: number = 16;
const DOMAIN_BOUNDARY_SETTLE_TIME: number = 3000; // ms to wait for layout before drawing boundaries

// Graph Configuration Constants
const NODE_SIZE_MULTIPLIER = 8;
const WORKSPACE_NODE_VAL = 15;
const ARTIFACT_NODE_VAL = 4;
const LINK_CURVATURE_STRAIGHT = 0;
const LINK_CURVATURE_CURVED = 0.25;
const LINK_OPACITY_DEFAULT = 0.5;
const CAMERA_ZOOM_DURATION_MS = 1000;
const CAMERA_FOCUS_DISTANCE = 200;

// Domain Clustering Constants
const DOMAIN_CLUSTER_STRENGTH = 0.3;
const DOMAIN_BOUNDARY_PADDING_MULTIPLIER = 1.5;
const DOMAIN_BOUNDARY_OPACITY = 0.08;
const DOMAIN_WIREFRAME_OPACITY = 0.3;
const DOMAIN_LABEL_HEIGHT = 8;
const DOMAIN_LABEL_OFFSET = 15;

// Microsoft Fabric Brand Colors
const COLOR_FABRIC_GREEN = '#107C10';
const COLOR_FABRIC_BLUE = '#0078D4';
const COLOR_CERTIFIED_GOLD = '#FFD700';
const COLOR_FOCUS_MODE_GREEN = '#10B981';

// Link Arrow Colors (improved visibility)
const COLOR_ARROW_CROSS_WS = '#00BCF2';     // Bright cyan for cross-workspace
const COLOR_ARROW_CONTAINS = '#A0A0A0';    // Gray for contains relationships
const COLOR_FOCUS_MODE = '#107C10';        // Clickable workspaces in focus mode  
const COLOR_ISOLATED = '#FFD700';          // Isolated domain highlight

@Component({
  selector: 'home-container',
  templateUrl: './home-container.component.html',
  styleUrls: ['./home-container.component.less']
})
export class HomeContainerComponent implements OnInit, OnDestroy {
  // =================================================================
  // CORE DATA PROPERTIES
  // =================================================================
  
  /** Graph nodes (workspaces and artifacts) */
  public nodes: Node[] = [];
  
  /** Graph links (relationships between nodes) */
  public links: Link[] = [];
  
  /** Legacy report data (for backward compatibility) */
  public reports: Report[] = [];
  
  /** Legacy dataset data (for backward compatibility) */
  public datasets: Dataset[] = [];
  
  /** Microsoft Fabric domains for organization */
  public domains: Domain[] = [];
  
  /** Additional workspace-level metadata storage */
  public workspaceMetadata: Map<string, any> = new Map();
  
  // =================================================================
  // UI STATE PROPERTIES
  // =================================================================
  
  /** Whether to show the 3D graph (vs landing page) */
  public shouldShowGraph = false;
  
  /** Whether a tenant scan is in progress */
  public isScanTenantInProgress: boolean = false;
  
  /** Search filter text */
  public searchTerm: string = '';
  
  /** Scan progress percentage (0-100) */
  public scanStatusPercent: number = 0;
  
  /** Whether user has permission to start scan */
  public canStartScan: boolean = false;
  
  // =================================================================
  // ADVANCED NAVIGATION FEATURES
  // =================================================================
  
  /** Whether simulation is paused (for screenshot/analysis) */
  public simulationPaused: boolean = false;
  
  /** Link curvature (0=straight, 0.25=curved) */
  public linkCurvature: number = 0;
  
  /** Whether depth fog is enabled for 3D effect */
  public fogEnabled: boolean = false;
  
  /** Focus mode: click workspaces to isolate domains */
  public isolateMode: boolean = false;
  
  /** Whether the filter panel is visible */
  public showFilterPanel: boolean = false;
  
  /** Set of hidden domain IDs */
  public hiddenDomains: Set<string> = new Set();
  
  /** Currently isolated domain ID (null = none) */
  public isolatedDomain: string | null = null;
  
  /** Show only unassigned workspaces (for domain assignment workflow) */
  public showUnassignedOnly: boolean = false;
  
  // =================================================================
  // FILTER PROPERTIES
  // =================================================================
  
  /** Show/hide artifact type filters */
  public showWorkspaces: boolean = true;
  public showLakehouses: boolean = true;
  public showWarehouses: boolean = true;
  public showReports: boolean = true;
  public showDatasets: boolean = true;
  
  /** Show/hide link type filters */
  public showCrossWorkspaceLinks: boolean = true;
  public showContainsLinks: boolean = true;
  
  /** Link opacity (0-100%) */
  public linkOpacity: number = 50;
  
  /** Legacy filter properties (kept for backward compatibility) */
  public selectedNodeTypes: Set<NodeType> = new Set();
  public selectedDomains: Set<string> = new Set();
  
  // =================================================================
  // PRIVATE PROPERTIES
  // =================================================================
  
  /** 3d-force-graph instance */
  private graphInstance: any = null;
  
  /** Set of nodes to highlight on hover */
  private highlightNodes = new Set();
  
  /** Set of links to highlight on hover */
  private highlightLinks = new Set();
  
  /** Currently hovered node */
  private hoverNode: any = null;
  
  /** Focused node that stays highlighted after click */
  private focusedNode: any = null;
  
  /** Workspace node currently being dragged for domain assignment */
  private draggedWorkspace: any = null;
  
  /** Map of domain IDs to their boundary THREE.js objects */
  private domainBoundaryObjects: Map<string, THREE.Object3D[]> = new Map();
  
  /** Dialog reference for progress bar */
  private progressBarDialogRef: MatDialogRef<ProgressBarDialogComponent>;
  
  /** Subject for component cleanup */
  private destroy$: Subject<void> = new Subject();
  
  /** File input element reference */
  @ViewChild('filesInput', { static: true }) filesInput: ElementRef;

  // =================================================================
  // LIFECYCLE METHODS
  // =================================================================
  
  constructor(
    private proxy: HomeProxy,
    private scanService: ScanService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    // Check if user has scan permissions
    this.authService.getToken().subscribe((token: string) => {
      this.canStartScan = token.length > 0;
    });
  }

  public ngOnInit(): void {
    // Subscribe to lineage data from scan service
    this.scanService.getLoadLineage()
      .pipe(takeUntil(this.destroy$))
      .subscribe(workspaces => {
        if (workspaces && workspaces.length > 0) {
          this.loadLineage(workspaces);
        }
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // =================================================================
  // SCANNING METHODS
  // =================================================================
  
  /**
   * Initiates a tenant-wide scan of Microsoft Fabric workspaces
   * 
   * This method triggers the Microsoft Fabric Scanner API to scan all workspaces
   * in the tenant. It requires tenant admin permissions and shows a progress dialog
   * while the scan is in progress. The scan fetches workspace metadata, artifacts,
   * and lineage information for visualization.
   * 
   * Error handling:
   * - 401: No tenant admin logged in - shows login dialog
   * - 403: Invalid or expired token - prompts to refresh credentials
   * 
   * @throws {Error} When scanner API request fails
   */
  public async startScan(): Promise<void> {
    if (!this.canStartScan) {
      this.dialog.open(LoginDialogComponent);
      return;
    }
    
    this.scanService.shouldStopScan = false;
    this.progressBarDialogRef = this.dialog.open(ProgressBarDialogComponent, { disableClose: true });
    this.isScanTenantInProgress = true;
    
    try {
      const resultObservable = await this.proxy.getModifedWorkspaces();
      const result = await resultObservable.toPromise();
      const workspaceIds = result.slice(0, MAX_PARALLEL_API_CALLS * 100).map(workspace => workspace.Id);

      this.getWorkspacesScanFilesParallel(workspaceIds);
      this.isScanTenantInProgress = false;
      
    } catch (e) {
      switch (e.status) {
        case 401:
          this.dialog.open(ErrorDialogComponent, { 
            data: { 
              title: 'Error 401', 
              errorMessage: 'No tenant admin is logged in, please login as a tenant admin' 
            } 
          });
          break;
          
        case 403:
          this.dialog.open(ErrorDialogComponent, { 
            data: { 
              title: 'Error 403', 
              errorMessage: 'The token is not correct, please change the environment or refresh the token' 
            } 
          });
          break;
      }
      this.progressBarDialogRef.close();
      this.isScanTenantInProgress = false;
    }
  }

  /**
   * Polls the Scanner API for workspace scan results
   * 
   * This method initiates a scan for the given workspaces and polls the status
   * every 2 seconds until the scan completes. Updates the scan service with
   * current status for progress tracking.
   * 
   * @param workspaceIds - Array of workspace GUIDs to scan
   */
  public async getWorkspacesScanFiles(workspaceIds: string[]): Promise<void> {
    let scanInfo = await this.proxy.getWorkspacesInfo(workspaceIds).toPromise();

    while (scanInfo.status !== 'Succeeded') {
      if (this.scanService.shouldStopScan) {
        break;
      }
      this.scanService.scanInfoStatusByScanId[scanInfo.id] = scanInfo.status;
      this.scanService.setScanInfoStatusChanged(this.scanService.scanInfoStatusByScanId);
      await this.sleep(2000);
      scanInfo = await this.proxy.getWorkspacesScanStatus(scanInfo.id).toPromise();
    }
    this.scanService.scanInfoStatusByScanId[scanInfo.id] = scanInfo.status;
    this.scanService.setScanInfoStatusChanged(this.scanService.scanInfoStatusByScanId);
  }

  /**
   * Utility method to pause execution for specified milliseconds
   * Used for polling delays in scan operations
   * 
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  public sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =================================================================
  // FILE HANDLING METHODS
  // =================================================================
  
  /**
   * Triggers the hidden file input for Scanner API JSON import
   * Disabled during active scans to prevent data conflicts
   */
  public onAddFile(): void {
    if (this.isScanTenantInProgress) {
      return;
    }

    (this.filesInput.nativeElement as HTMLInputElement).click();
  }

  /**
   * Processes uploaded Scanner API JSON files
   * 
   * Reads one or more JSON files containing workspace scan results and loads
   * them into the visualization. Files must match the WorkspaceInfoResponse format.
   * Multiple files are processed sequentially.
   */
  public onFileAdded(): void {
    const files = (this.filesInput.nativeElement as HTMLInputElement).files;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.addEventListener('load', (event) => {
        const workspaces = JSON.parse((event.target as FileReader).result as string).workspaces;
        this.loadLineage(workspaces);
      });

      reader.readAsText(file);
    }
  }

  // =================================================================
  // DEMO MODE METHODS
  // =================================================================
  
  /**
   * Loads pre-configured demo data for testing and demonstration
   * 
   * Initializes the graph with mock Scanner API data including 50+ workspaces
   * across 15 domains, demonstrating all 23 supported Fabric artifact types.
   * Useful for testing features without tenant admin access.
   */
  public loadDemoMode(): void {
    this.domains = MOCK_DOMAINS;
    this.loadLineage(MOCK_SCANNER_RESPONSE.workspaces);
  }

  // =================================================================
  // NODE STYLING METHODS - Colors and Icons
  // =================================================================
  
  /**
   * Maps Fabric artifact types to official color scheme
   * 
   * Returns colors based on Microsoft Fabric design system:
   * - Workspace: Green (#107C10)
   * - Data Storage (Lakehouse, Warehouse): Blues
   * - Analytics (KQL, Eventstream): Purples/Magentas  
   * - BI (Reports, Dashboards): Yellows/Oranges/Cyans
   * - ML (Models, Experiments): Teals
   * 
   * @param nodeType - The Fabric artifact type
   * @returns Hex color string
   */
  private getNodeColor(nodeType: NodeType): string {
    // Microsoft Fabric color scheme
    switch (nodeType) {
      case NodeType.Workspace: {
        return '#107C10';  // Fabric Green
      }
      case NodeType.Dashboard: {
        return '#06B6D4';  // Cyan
      }
      case NodeType.Report: {
        return '#FFB900';  // Fabric Yellow/Gold for Reports
      }
      case NodeType.PaginatedReport: {
        return '#FFA500';  // Orange for Paginated Reports
      }
      case NodeType.SemanticModel: {
        return '#EF4444';  // Red
      }
      case NodeType.Dataflow:
      case NodeType.DataflowGen2: {
        return '#10B981';  // Green
      }
      case NodeType.Lakehouse: {
        return '#00BCF2';  // Cyan for Lakehouse
      }
      case NodeType.DataWarehouse: {
        return '#0078D4';  // Fabric Blue
      }
      case NodeType.SQLAnalyticsEndpoint: {
        return '#50E6FF';  // Light Blue
      }
      case NodeType.Notebook: {
        return '#F59E0B';  // Amber
      }
      case NodeType.SparkJobDefinition: {
        return '#FF6B35';  // Orange-Red
      }
      case NodeType.Pipeline: {
        return '#6366F1';  // Indigo
      }
      case NodeType.Eventstream: {
        return '#F97316';  // Orange
      }
      case NodeType.Eventhouse: {
        return '#E74856';  // Red
      }
      case NodeType.KQLDatabase: {
        return '#C239B3';  // Magenta
      }
      case NodeType.KQLQueryset: {
        return '#9F79EE';  // Purple
      }
      case NodeType.Datamart: {
        return '#8764B8';  // Purple
      }
      case NodeType.MLModel: {
        return '#00D4AA';  // Teal
      }
      case NodeType.MLExperiment: {
        return '#00B294';  // Dark Teal
      }
      case NodeType.App: {
        return '#737373';  // Gray
      }
      default: {
        return '#107C10';  // Fabric green
      }
    }
  }

  private getNodeTypeImage (nodeType: NodeType): THREE.Mesh {
    let texture = null;
    const loader = new THREE.TextureLoader();

    switch (nodeType) {
      case NodeType.Dashboard: {
        texture = loader.load('assets/dashboard.png');
        break;
      }
      case NodeType.Report: {
        texture = loader.load('assets/report.png');
        break;
      }
      case NodeType.PaginatedReport: {
        texture = loader.load('assets/paginated-report.svg');
        break;
      }
      case NodeType.SemanticModel: {
        texture = loader.load('assets/dataset.png');
        break;
      }
      case NodeType.Dataflow:
      case NodeType.DataflowGen2: {
        texture = loader.load('assets/dataflow.png');
        break;
      }
      case NodeType.Lakehouse: {
        texture = loader.load('assets/lakehouse.svg');
        break;
      }
      case NodeType.DataWarehouse: {
        texture = loader.load('assets/datawarehouse.svg');
        break;
      }
      case NodeType.Notebook: {
        texture = loader.load('assets/notebook.svg');
        break;
      }
      case NodeType.Pipeline: {
        texture = loader.load('assets/pipeline.svg');
        break;
      }
      case NodeType.Eventstream: {
        texture = loader.load('assets/eventstream.svg');
        break;
      }
      case NodeType.MLModel: {
        texture = loader.load('assets/mlmodel.svg');
        break;
      }
      case NodeType.KQLDatabase: {
        texture = loader.load('assets/kqldatabase.svg');
        break;
      }
      case NodeType.Datamart: {
        texture = loader.load('assets/datamart.svg');
        break;
      }
      default: {
        texture = loader.load('assets/data source.png');
        break;
      }
    }

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(4, 4, 4),
      new THREE.MeshBasicMaterial({
        map: texture
      })
    );

    return cube;
  }

  // =================================================================
  // GRAPH VISUALIZATION - Main Data Loading and Processing
  // =================================================================
  
  /**
   * Processes workspace scan results and builds the graph structure
   * 
   * This is the CORE method that transforms Scanner API data into the 3D graph.
   * It performs three passes:
   * 
   * PASS 1: Create workspace and artifact nodes (datasets, dataflows, reports, etc.)
   * PASS 2: Build relationships and lineage between artifacts
   * PASS 3: Apply domain clustering force for spatial organization
   * 
   * Supports 23 Microsoft Fabric artifact types including:
   * - Traditional BI: Reports, Dashboards, Semantic Models
   * - Data Integration: Dataflows, Pipelines
   * - Data Engineering: Lakehouses, Warehouses, Notebooks, Spark Jobs
   * - Real-Time Analytics: Eventstreams, Eventhouses, KQL Databases
   * - Machine Learning: ML Models and Experiments
   * 
   * @param workspaces - Array of WorkspaceInfo objects from Scanner API
   */
  private loadLineage(workspaces): void {
    this.nodes = [];
    this.links = [];
    this.reports = [];
    this.datasets = [];
    this.workspaceMetadata.clear();
    
    let numberOfWorkspaces = 0;
    
    // PASS 1: Create all workspace and artifact nodes
    for (const workspace of workspaces) {
      if (workspace.state === 'Deleted') {
        continue;
      }

      // Store workspace metadata including domain assignment
      this.workspaceMetadata.set(workspace.id, {
        domainId: workspace.domainId,
        capacityId: workspace.capacityId,
        isOnDedicatedCapacity: workspace.isOnDedicatedCapacity,
        description: workspace.description
      });

      // Create workspace node - assign UNASSIGNED domain for null domainId
      const effectiveDomainId = workspace.domainId || 'UNASSIGNED';
      const workspaceNode: Node = {
        id: workspace.id,
        name: workspace.name,
        type: NodeType.Workspace,
        crossDownstreamWSIds: [],
        crossUpstreamWSIds: [],
        workspaceId: workspace.id,
        metadata: {
          domainId: effectiveDomainId,
          domainName: this.domains.find(d => d.id === effectiveDomainId)?.name || 'Unassigned',
          isUnassigned: !workspace.domainId  // Flag for special handling
        }
      };
      
      this.nodes.push(workspaceNode);
      numberOfWorkspaces++;

      // Process Semantic Models (Datasets)
      for (const dataset of workspace.datasets ?? []) {
        dataset.workspaceId = workspace.id;
        this.datasets.push(dataset);

        const datasetNode: Node = {
          id: dataset.id,
          name: dataset.name,
          type: NodeType.SemanticModel,
          workspaceId: workspace.id,
          // Store metadata for tooltips
          metadata: {
            endorsement: dataset.endorsementDetails?.endorsement || 'None',
            certifiedBy: dataset.endorsementDetails?.certifiedBy,
            sensitivityLabel: dataset.sensitivityLabel?.labelId,
            description: dataset.description,
            configuredBy: dataset.configuredBy,
            targetStorageMode: dataset.targetStorageMode
          }
        };
        this.nodes.push(datasetNode);
        this.links.push({
          source: workspaceNode.id,
          target: datasetNode.id,
          type: LinkType.Contains
        });
      }

      // Process Dataflows
      for (const dataflow of workspace.dataflows ?? []) {
        dataflow.workspaceId = workspace.id;
        const dataflowNode: Node = {
          id: dataflow.objectId,
          name: dataflow.name,
          type: NodeType.DataflowGen2, // Assume Gen2 for Fabric
          workspaceId: workspace.id,
          metadata: {
            endorsement: dataflow.endorsementDetails?.endorsement || 'None',
            certifiedBy: dataflow.endorsementDetails?.certifiedBy,
            sensitivityLabel: dataflow.sensitivityLabel?.labelId,
            description: dataflow.description,
            configuredBy: dataflow.configuredBy
          }
        };
        this.nodes.push(dataflowNode);
        this.links.push({
          source: workspaceNode.id,
          target: dataflowNode.id,
          type: LinkType.Contains
        });
      }

      // Process Datamarts - CRITICAL: Detect Lakehouse/Warehouse
      for (const datamart of workspace.datamarts ?? []) {
        let nodeType: NodeType;
        
        // KEY DETECTION LOGIC based on Scanner API
        switch (datamart.type) {
          case 'Lakehouse':
            nodeType = NodeType.Lakehouse;
            // TODO: Create SQL Analytics Endpoint node
            break;
          case 'Datawarehouse':
            nodeType = NodeType.DataWarehouse;
            break;
          case 'Sql':
            nodeType = NodeType.Datamart;
            break;
          default:
            nodeType = NodeType.Datamart;
        }

        const datamartNode: Node = {
          id: datamart.id,
          name: datamart.name,
          type: nodeType,
          workspaceId: workspace.id,
          metadata: {
            endorsement: datamart.endorsementDetails?.endorsement || 'None',
            certifiedBy: datamart.endorsementDetails?.certifiedBy,
            sensitivityLabel: datamart.sensitivityLabel?.labelId,
            description: datamart.description,
            datamartType: datamart.type
          }
        };
        this.nodes.push(datamartNode);
        this.links.push({
          source: workspaceNode.id,
          target: datamartNode.id,
          type: LinkType.Contains
        });

        // Create SQL Analytics Endpoint for Lakehouses
        if (nodeType === NodeType.Lakehouse) {
          const sqlEndpointNode: Node = {
            id: `${datamart.id}-sql-endpoint`,
            name: `${datamart.name} (SQL Endpoint)`,
            type: NodeType.SQLAnalyticsEndpoint,
            workspaceId: workspace.id,
            metadata: {
              parentLakehouseId: datamart.id,
              description: 'SQL Analytics Endpoint for Lakehouse'
            }
          };
          this.nodes.push(sqlEndpointNode);
          this.links.push({
            source: datamartNode.id,
            target: sqlEndpointNode.id,
            type: LinkType.Contains
          });
        }
      }

      // Process Reports - DETECT Paginated Reports
      for (const report of workspace.reports ?? []) {
        report.workspaceId = workspace.id;
        this.reports.push(report);

        // Detect report type
        const reportType = report.reportType === 'PaginatedReport' 
          ? NodeType.PaginatedReport 
          : NodeType.Report;

        const reportNode: Node = {
          id: report.id,
          name: report.name,
          type: reportType,
          workspaceId: workspace.id,
          metadata: {
            endorsement: report.endorsementDetails?.endorsement || 'None',
            certifiedBy: report.endorsementDetails?.certifiedBy,
            sensitivityLabel: report.sensitivityLabel?.labelId,
            description: report.description,
            createdBy: report.createdBy,
            modifiedBy: report.modifiedBy,
            modifiedDateTime: report.modifiedDateTime
          }
        };
        this.nodes.push(reportNode);
        this.links.push({
          source: workspaceNode.id,
          target: reportNode.id,
          type: LinkType.Contains
        });

        // Link report to dataset
        if (report.datasetId) {
          const dataset = this.datasets.find(ds => ds.id === report.datasetId);
          if (dataset) {
            this.links.push({
              source: report.datasetId,
              target: reportNode.id,
              type: LinkType.Contains
            });

            // Cross-workspace link if dataset is in different workspace
            if (dataset.workspaceId !== workspace.id) {
              this.links.push({
                source: dataset.workspaceId,
                target: workspace.id,
                type: LinkType.CrossWorkspace
              });
            }
          }
        }
      }

      // Process Dashboards
      for (const dashboard of workspace.dashboards ?? []) {
        dashboard.workspaceId = workspace.id;
        const dashboardNode: Node = {
          id: dashboard.id,
          name: dashboard.displayName,
          type: NodeType.Dashboard,
          workspaceId: workspace.id,
          metadata: {
            endorsement: dashboard.endorsementDetails?.endorsement || 'None',
            certifiedBy: dashboard.endorsementDetails?.certifiedBy,
            sensitivityLabel: dashboard.sensitivityLabel?.labelId,
            tileCount: dashboard.tiles?.length || 0
          }
        };
        this.nodes.push(dashboardNode);
        this.links.push({
          source: workspaceNode.id,
          target: dashboardNode.id,
          type: LinkType.Contains
        });

        // Link dashboard to reports/datasets via tiles
        for (const tile of dashboard.tiles ?? []) {
          if (tile.reportId) {
            const report = this.reports.find(r => r.id === tile.reportId);
            if (report) {
              this.links.push({
                source: tile.reportId,
                target: dashboardNode.id,
                type: LinkType.Contains
              });
            }
          }
        }
      }
    }

    // PASS 2: Create upstream/downstream lineage links
    for (const workspace of workspaces) {
      // Dataset upstream links
      for (const dataset of workspace.datasets ?? []) {
        // Dataflow dependencies
        if (dataset.upstreamDataflows) {
          for (const upstreamDataflow of dataset.upstreamDataflows) {
            if (upstreamDataflow.groupId !== dataset.workspaceId) {
              // Cross-workspace lineage
              this.links.push({
                source: upstreamDataflow.groupId,
                target: dataset.workspaceId,
                type: LinkType.CrossWorkspace
              });
            }
            // Direct artifact link
            this.links.push({
              source: upstreamDataflow.targetDataflowId,
              target: dataset.id,
              type: LinkType.Contains
            });
          }
        }

        // Datamart dependencies
        if (dataset.upstreamDatamarts) {
          for (const upstreamDatamart of dataset.upstreamDatamarts) {
            if (upstreamDatamart.groupId !== dataset.workspaceId) {
              this.links.push({
                source: upstreamDatamart.groupId,
                target: dataset.workspaceId,
                type: LinkType.CrossWorkspace
              });
            }
            this.links.push({
              source: upstreamDatamart.targetDatamartId,
              target: dataset.id,
              type: LinkType.Contains
            });
          }
        }

        // Dataset dependencies
        if (dataset.upstreamDatasets) {
          for (const upstreamDataset of dataset.upstreamDatasets) {
            if (upstreamDataset.groupId !== dataset.workspaceId) {
              this.links.push({
                source: upstreamDataset.groupId,
                target: dataset.workspaceId,
                type: LinkType.CrossWorkspace
              });
            }
            this.links.push({
              source: upstreamDataset.targetDatasetId,
              target: dataset.id,
              type: LinkType.Contains
            });
          }
        }
      }

      // Dataflow upstream links
      for (const dataflow of workspace.dataflows ?? []) {
        if (dataflow.upstreamDataflows) {
          for (const upstreamDataflow of dataflow.upstreamDataflows) {
            if (upstreamDataflow.groupId !== dataflow.workspaceId) {
              this.links.push({
                source: upstreamDataflow.groupId,
                target: dataflow.workspaceId,
                type: LinkType.CrossWorkspace
              });
            }
            this.links.push({
              source: upstreamDataflow.targetDataflowId,
              target: dataflow.objectId,
              type: LinkType.Contains
            });
          }
        }
      }

      // Datamart upstream links
      for (const datamart of workspace.datamarts ?? []) {
        if (datamart.upstreamDataflows) {
          for (const upstreamDataflow of datamart.upstreamDataflows) {
            if (upstreamDataflow.groupId !== workspace.id) {
              this.links.push({
                source: upstreamDataflow.groupId,
                target: workspace.id,
                type: LinkType.CrossWorkspace
              });
            }
            this.links.push({
              source: upstreamDataflow.targetDataflowId,
              target: datamart.id,
              type: LinkType.Contains
            });
          }
        }
      }
    }

    // PASS 3: Calculate cross-workspace relationships for node metadata
    let validLinks: Link[] = this.links.filter(link => workspaces.find(ws => ws.id === link.source));
    const crossWorkspaceLinks = validLinks.filter(link => link.type === LinkType.CrossWorkspace);
    
    for (const crossWSLink of crossWorkspaceLinks) {
      const downNode = this.nodes.find(node => node.id === crossWSLink.source);
      if (downNode) {
        downNode.crossDownstreamWSIds.push(crossWSLink.target);
      }

      const upNode = this.nodes.find(node => node.id === crossWSLink.target);
      if (upNode) {
        upNode.crossUpstreamWSIds.push(crossWSLink.source);
      }
    }

    // PASS 4: Limit workspaces if needed
    if (numberOfWorkspaces > WORKSPACE_LIMIT) {
      const workspaceNodes = this.nodes.filter(node => node.type === NodeType.Workspace);
      const limitedWorkspaceInfo = workspaceNodes
        .sort((a, b) => {
          const aCount = (a.crossDownstreamWSIds?.length || 0) + (a.crossUpstreamWSIds?.length || 0);
          const bCount = (b.crossDownstreamWSIds?.length || 0) + (b.crossUpstreamWSIds?.length || 0);
          return bCount - aCount;
        })
        .slice(0, WORKSPACE_LIMIT)
        .map(node => ({
          id: node.id,
          crossDownstreamWSIds: node.crossDownstreamWSIds || [],
          crossUpstreamWSIds: node.crossUpstreamWSIds || []
        }));

      let limitedWorkspaceNodes = [];
      for (const info of limitedWorkspaceInfo) {
        limitedWorkspaceNodes.push(info.id);
        limitedWorkspaceNodes = [...new Set([
          ...limitedWorkspaceNodes,
          ...(info.crossDownstreamWSIds || []),
          ...(info.crossUpstreamWSIds || [])
        ])];
      }

      this.nodes = this.nodes.filter(node => limitedWorkspaceNodes.includes(node.workspaceId));
      const nodeIds = this.nodes.map(node => node.id);
      validLinks = validLinks.filter(link => nodeIds.includes(link.source) && nodeIds.includes(link.target));
    }

    // RENDER THE GRAPH
    const gData = {
      nodes: this.nodes,
      links: validLinks
    };

    const graph = new ForceGraph3D(document.getElementById('3d-graph'), {
      controlType: 'orbit'
    });

    this.graphInstance = graph;

    graph.graphData(gData)
      .width(window.innerWidth)
      .height(window.innerHeight)
      .backgroundColor('#0a0e27')
      .enableNodeDrag(true)  // Enable drag for domain assignment
      .onNodeDrag((node: any) => {
        // Track dragging for visual feedback
        if (node.type === NodeType.Workspace) {
          // First drag? Disable clustering and clear previous highlights
          if (!this.draggedWorkspace) {
            this.clearDomainHighlights();
            if (this.graphInstance) {
              this.graphInstance.d3Force('domainCluster', null);
            }
          }
          
          this.draggedWorkspace = node;
          this.highlightNearestDomain(node);
          
          // Update node appearance during drag
          if (this.graphInstance) {
            this.graphInstance.nodeColor(this.graphInstance.nodeColor());
          }
        }
      })
      .onNodeDragEnd((node: any) => {
        // Handle domain assignment on drop
        if (node.type === NodeType.Workspace) {
          // RE-ENABLE domain clustering
          if (this.graphInstance) {
            this.graphInstance.d3Force('domainCluster', this.createDomainClusterForce());
          }
          
          this.handleWorkspaceDrop(node);
          this.draggedWorkspace = null;
          this.clearDomainHighlights();
        }
      })
      .nodeRelSize(8)
      .nodeVal((node: any) => {
        if (node.type === NodeType.Workspace && node.metadata?.isUnassigned) {
          return 45;  // 3x larger for unassigned workspaces
        }
        return node.type === NodeType.Workspace ? 15 : 4;
      })
      .linkWidth((link: any) => link.type === LinkType.CrossWorkspace ? 2 : 1)
      .d3Force('domainCluster', this.createDomainClusterForce())
      .linkOpacity(0.5)
      // Directional arrows with elegant styling
      .linkDirectionalArrowLength((link: any) => {
        // CrossWorkspace: 8px arrows (data dependencies) - more prominent
        // Contains: 5px arrows (workspace → artifact, artifact → artifact)
        return link.type === LinkType.CrossWorkspace ? 8 : 5;
      })
      .linkDirectionalArrowRelPos(1)
      .linkDirectionalArrowColor((link: any) => {
        // CrossWorkspace: bright cyan for data flow
        // Contains: solid white for clear visibility
        return link.type === LinkType.CrossWorkspace ? COLOR_ARROW_CROSS_WS : '#FFFFFF';
      })
      // Rich HTML tooltips
      .nodeLabel((node: any) => {
        const typeLabel = NodeType[node.type];
        const endorsement = node.metadata?.endorsement || 'None';
        const endorsementIcon = endorsement === 'Certified' ? '🏅 ' : endorsement === 'Promoted' ? '✓ ' : '';
        const endorsementColor = endorsement === 'Certified' ? '#0078D4' : endorsement === 'Promoted' ? '#0078D4' : '#666';
        const domainName = node.metadata?.domainName || 'No Domain';
        
        // Sensitivity label
        const sensitivityLabel = node.metadata?.sensitivityLabel;
        let sensitivityHTML = '';
        if (sensitivityLabel) {
          const labelColors = {
            'highly-confidential': { bg: '#C43E1C', icon: '🔒', text: 'Highly Confidential' },
            'confidential': { bg: '#D83B01', icon: '🔒', text: 'Confidential' },
            'internal': { bg: '#CA5010', icon: '🔓', text: 'Internal' },
            'public': { bg: '#8A8A8A', icon: '🌐', text: 'Public' }
          };
          const label = labelColors[sensitivityLabel.labelId] || labelColors['internal'];
          sensitivityHTML = `<div style="font-size: 12px; color: white; background: ${label.bg}; padding: 4px 8px; border-radius: 4px; margin-top: 6px; display: inline-block;">${label.icon} ${label.text}</div>`;
        }
        
        return `
          <div style="background: rgba(0,0,0,0.95); padding: 16px; border-radius: 10px; border: 2px solid ${this.getNodeColor(node.type)}; min-width: 240px;">
            <div style="font-size: 18px; font-weight: bold; color: ${this.getNodeColor(node.type)}; margin-bottom: 8px;">${node.name}</div>
            <div style="font-size: 13px; color: #10B981; margin-bottom: 6px;">📦 ${typeLabel}</div>
            ${node.type === NodeType.Workspace ? `<div style="font-size: 12px; color: #60A5FA;">🏢 Domain: ${domainName}</div>` : `<div style="font-size: 12px; color: #888;">Workspace: ${node.workspaceId}</div>`}
            ${endorsement !== 'None' ? `<div style="font-size: 13px; color: ${endorsementColor}; margin-top: 8px; padding: 4px 10px; background: rgba(0,120,212,0.15); border: 1px solid ${endorsementColor}; border-radius: 4px; display: inline-block; font-weight: 600;">${endorsementIcon}${endorsement}</div>` : ''}
            ${sensitivityHTML}
            ${node.metadata?.description ? `<div style="font-size: 11px; color: #aaa; margin-top: 8px; font-style: italic; border-top: 1px solid #333; padding-top: 6px;">${node.metadata.description}</div>` : ''}
            ${node.crossDownstreamWSIds?.length ? `<div style="font-size: 12px; color: #10B981; margin-top: 8px;">⬇ ${node.crossDownstreamWSIds.length} downstream workspaces</div>` : ''}
            ${node.crossUpstreamWSIds?.length ? `<div style="font-size: 12px; color: #EF4444;">⬆ ${node.crossUpstreamWSIds.length} upstream workspaces</div>` : ''}
          </div>
        `;
      })
      // Hover highlighting (or keep focused node highlighted)
      .onNodeHover((node: any) => {
        this.highlightNodes.clear();
        this.highlightLinks.clear();
        
        // Use focused node if no hover, otherwise use hover
        const activeNode = node || this.focusedNode;
        
        if (activeNode) {
          this.highlightNodes.add(activeNode);
          // Highlight connected nodes and links
          this.links.forEach(link => {
            if (link.source === activeNode.id || link.target === activeNode.id) {
              this.highlightLinks.add(link);
              const connectedNode = this.nodes.find(n => 
                n.id === (link.source === activeNode.id ? link.target : link.source)
              );
              if (connectedNode) this.highlightNodes.add(connectedNode);
            }
          });
        }
        
        this.hoverNode = node || null;
        this.updateHighlight();
      })
      // Click to focus with animation
      .onNodeClick((node: any) => {
        // In isolate mode, clicking workspace isolates its domain
        if (this.isolateMode && node.type === NodeType.Workspace && node.metadata?.domainId) {
          if (this.isolatedDomain === node.metadata.domainId) {
            // Toggle off isolation
            this.isolatedDomain = null;
          } else {
            // Isolate this domain
            this.isolatedDomain = node.metadata.domainId;
            this.zoomToDomain(node.metadata.domainId);
          }
          this.applyFilters();
          return;
        }
        
        // Toggle focus: click same node to clear, click different to focus
        if (this.focusedNode === node) {
          this.focusedNode = null;
          this.highlightNodes.clear();
          this.highlightLinks.clear();
          this.updateHighlight();
          return;
        }
        
        // Set focused node and keep highlight
        this.focusedNode = node;
        this.highlightNodes.clear();
        this.highlightLinks.clear();
        this.highlightNodes.add(node);
        
        // Highlight connected nodes and links
        this.links.forEach(link => {
          if (link.source === node.id || link.target === node.id) {
            this.highlightLinks.add(link);
            const connectedNode = this.nodes.find(n => 
              n.id === (link.source === node.id ? link.target : link.source)
            );
            if (connectedNode) this.highlightNodes.add(connectedNode);
          }
        });
        this.updateHighlight();
        
        if (node.type === NodeType.Workspace) {
          // Fly camera to focus on the workspace
          const distance = 200;
          const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
          
          graph.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
            node,
            1000
          );
          
          // Also open lineage URL
          const url: string = this.proxy.getEnvironment().url;
          window.open(`${url}/groups/${node.id}/lineage`, '_blank');
          return;
        }
        
        // For artifacts, zoom to node
        const distance = 150;
        const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
        graph.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          node,
          800
        );

        if (node.type === NodeType.SemanticModel) {
          const url: string = this.proxy.getEnvironment().url;
          window.open(`${url}/datahub/datasets/${node.id}`, '_blank');
        }
      })
      .linkDirectionalParticles((link: any) => {
        if (link.type === LinkType.CrossWorkspace) {
          return 8;
        }
      })
      .linkDirectionalParticleSpeed(0.006)
      .linkDirectionalParticleWidth(2)
      .linkDirectionalParticleColor('#107C10')
      .nodeThreeObject((node: any) => {
        if (node.type !== NodeType.Workspace) {
          // Create group to hold icon + label + endorsement badge
          const group = new THREE.Group();
          
          // Add artifact icon
          const iconMesh = this.getNodeTypeImage(node.type as NodeType);
          group.add(iconMesh);
          
          // Add artifact name label below icon
          const label = new SpriteText(node.name);
          label.color = '#FFFFFF';
          label.textHeight = 3;
          label.backgroundColor = 'rgba(0,0,0,0.85)';
          label.padding = 2;
          label.borderRadius = 3;
          (label as any).position.set(0, -8, 0);
          group.add(label as any);
          
          // Add OFFICIAL endorsement badge SVG icon
          if (node.metadata?.endorsement === 'Certified') {
            const badgeMesh = this.createBadgeMesh('assets/badge-certified.svg', 4);
            badgeMesh.position.set(5, 5, 0);
            group.add(badgeMesh);
          } else if (node.metadata?.endorsement === 'Promoted') {
            const badgeMesh = this.createBadgeMesh('assets/badge-promoted.svg', 4);
            badgeMesh.position.set(5, 5, 0);
            group.add(badgeMesh);
          }
          
          return group;
        }

        // Workspace: larger badge with domain info
        const group = new THREE.Group();
        
        const sprite = new SpriteText(node.name);
        sprite.color = '#FFFFFF';
        sprite.textHeight = 6;
        sprite.backgroundColor = 'rgba(16, 124, 16, 0.95)';
        sprite.padding = 4;
        sprite.borderRadius = 5;
        sprite.fontWeight = '700';
        group.add(sprite as any);
        
        // Add domain name below workspace name
        if (node.metadata?.domainName) {
          const domainLabel = new SpriteText(node.metadata.domainName);
          domainLabel.color = '#A0A0A0';
          domainLabel.textHeight = 2.5;
          domainLabel.backgroundColor = 'rgba(0,0,0,0.6)';
          domainLabel.padding = 2;
          domainLabel.borderRadius = 2;
          (domainLabel as any).position.set(0, -8, 0);
          group.add(domainLabel as any);
        }
        
        return group;
      })
      .nodeColor((node: any) => {
        // DRAGGING: Bright cyan
        if (this.draggedWorkspace && node.id === this.draggedWorkspace.id) {
          return '#00FFFF';
        }
        
        // UNASSIGNED WORKSPACES: Bright orange
        if (node.type === NodeType.Workspace && node.metadata?.isUnassigned) {
          return '#FF6600';
        }
        
        // ASSIGNED WORKSPACES: Color by domain
        if (node.type === NodeType.Workspace && node.metadata?.domainId) {
          const domainColor = this.getDomainColor(node.metadata.domainId);
          return '#' + domainColor.toString(16).padStart(6, '0');
        }
        
        // Focus mode
        if (this.isolateMode && node.type === NodeType.Workspace) {
          if (this.isolatedDomain && node.metadata?.domainId === this.isolatedDomain) {
            return '#FFD700';
          }
          return '#10B981';
        }
        
        // Dim non-highlighted
        if (this.highlightNodes.size > 0 && !this.highlightNodes.has(node)) {
          return 'rgba(100,100,100,0.3)';
        }
        
        return this.getNodeColor(node.type as NodeType);
      })
      .linkColor((link: any) => {
        // Highlight active links with bright colors
        if (this.highlightLinks.size > 0) {
          if (this.highlightLinks.has(link)) {
            // Bright colors for highlighted links
            if (link.type === LinkType.CrossWorkspace) return COLOR_ARROW_CROSS_WS;
            return 'rgba(200,200,200,0.8)';
          }
          // Dim non-highlighted links
          return 'rgba(100,100,100,0.1)';
        }
        // Default colors when nothing highlighted
        if (link.type === LinkType.CrossWorkspace) return 'rgba(0,188,242,0.4)';
        return 'rgba(150,150,150,0.2)';
      });

    this.shouldShowGraph = true;
    
    // Add domain boundary spheres after layout settles
    this.addDomainBoundaries();
  }

  private updateHighlight(): void {
    if (!this.graphInstance) return;
    this.graphInstance
      .nodeColor(this.graphInstance.nodeColor())
      .linkColor(this.graphInstance.linkColor());
  }

  public zoomToFit(): void {
    if (this.graphInstance) {
      this.graphInstance.zoomToFit(400, 20);
    }
  }

  private addDomainBoundaries(): void {
    if (!this.graphInstance) return;

    // Wait for nodes to settle into positions
    setTimeout(() => {
      const scene = this.graphInstance.scene();
      
      // Group workspace nodes by domain
      const domainNodes: Map<string, any[]> = new Map();
      this.nodes.forEach(node => {
        if (node.type === NodeType.Workspace && node.metadata?.domainId) {
          const domainId = node.metadata.domainId;
          if (!domainNodes.has(domainId)) {
            domainNodes.set(domainId, []);
          }
          domainNodes.get(domainId)!.push(node);
        }
      });

      // Create transparent boundary sphere for each domain
      domainNodes.forEach((nodes, domainId) => {
        if (nodes.length === 0) return;

        // Calculate center and radius
        const center = { x: 0, y: 0, z: 0 };
        nodes.forEach(node => {
          center.x += node.x || 0;
          center.y += node.y || 0;
          center.z += node.z || 0;
        });
        center.x /= nodes.length;
        center.y /= nodes.length;
        center.z /= nodes.length;

        // Find furthest node to determine radius
        let maxDistance = 0;
        nodes.forEach(node => {
          const dx = (node.x || 0) - center.x;
          const dy = (node.y || 0) - center.y;
          const dz = (node.z || 0) - center.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          maxDistance = Math.max(maxDistance, distance);
        });

        const radius = maxDistance * 1.5; // Add 50% padding

        // Create transparent sphere
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshBasicMaterial({
          color: this.getDomainColor(domainId),
          transparent: true,
          opacity: 0.08,
          side: THREE.BackSide,
          depthWrite: false
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(center.x, center.y, center.z);
        (sphere as any).userData = { domainId, type: 'domain-boundary' };
        sphere.name = `domain-sphere-${domainId}`;
        scene.add(sphere);

        // Add wireframe for better visibility
        const wireframe = new THREE.WireframeGeometry(geometry);
        const line = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({ 
          color: this.getDomainColor(domainId), 
          opacity: 0.3,
          transparent: true 
        }));
        line.position.set(center.x, center.y, center.z);
        (line as any).userData = { domainId, type: 'domain-boundary' };
        line.name = `domain-wireframe-${domainId}`;
        scene.add(line);
        
        // Store references for later show/hide
        if (!this.domainBoundaryObjects.has(domainId)) {
          this.domainBoundaryObjects.set(domainId, []);
        }
        this.domainBoundaryObjects.get(domainId)!.push(sphere, line);

        // Add clickable domain label
        const domain = this.domains.find(d => d.id === domainId);
        if (domain) {
          const labelGroup = new THREE.Group();
          const label = new SpriteText(domain.name);
          label.color = '#FFFFFF';
          label.textHeight = 8;
          label.backgroundColor = 'rgba(0,0,0,0.8)';
          label.padding = 6;
          label.borderRadius = 6;
          label.fontWeight = '700';
          labelGroup.add(label as any);
          labelGroup.position.set(center.x, center.y + radius + 15, center.z);
          (labelGroup as any).userData = { domainId, type: 'domain-label', clickable: true };
          (labelGroup as any).name = `domain-label-${domainId}`;
          scene.add(labelGroup);
          
          // Store label reference
          this.domainBoundaryObjects.get(domainId)!.push(labelGroup);
          
          // Add click handler for domain label
          if (this.isolateMode) {
            // Domain clicking is handled in isolate mode
          }
        }
      });
    }, 3000); // Wait 3 seconds for layout to settle
  }

  private getDomainColor(domainId: string): number {
    // Simple hash to generate consistent colors per domain
    let hash = 0;
    for (let i = 0; i < domainId.length; i++) {
      hash = domainId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return new THREE.Color(`hsl(${hue}, 70%, 50%)`).getHex();
  }

  public exportToPNG(): void {
    if (!this.graphInstance) return;
    
    const renderer = this.graphInstance.renderer();
    const imgData = renderer.domElement.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.download = `powerbeye-graph-${new Date().getTime()}.png`;
    link.href = imgData;
    link.click();
  }

  public exportToJSON(): void {
    const data = {
      nodes: this.nodes,
      links: this.links,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `powerbeye-graph-${new Date().getTime()}.json`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  public onSearchChange(): void {
    this.filterGraph();
  }

  private filterGraph(): void {
    if (!this.graphInstance) return;
    
    const searchLower = this.searchTerm.toLowerCase();
    
    this.graphInstance
      .nodeVisibility((node: any) => {
        if (!searchLower) return true;
        return node.name.toLowerCase().includes(searchLower) ||
               node.workspaceId.toLowerCase().includes(searchLower) ||
               NodeType[node.type].toLowerCase().includes(searchLower);
      })
      .linkVisibility((link: any) => {
        if (!searchLower) return true;
        const sourceNode = this.nodes.find(n => n.id === link.source);
        const targetNode = this.nodes.find(n => n.id === link.target);
        return (sourceNode?.name.toLowerCase().includes(searchLower) || false) ||
               (targetNode?.name.toLowerCase().includes(searchLower) || false);
      });
  }

  // ========== ADVANCED NAVIGATION FEATURES ==========

  public toggleSimulation(): void {
    if (!this.graphInstance) return;
    
    this.simulationPaused = !this.simulationPaused;
    
    if (this.simulationPaused) {
      this.graphInstance.pauseAnimation();
    } else {
      this.graphInstance.resumeAnimation();
    }
  }

  public toggleLinkCurvature(): void {
    if (!this.graphInstance) return;
    
    this.linkCurvature = this.linkCurvature > 0 ? 0 : 0.25;
    this.graphInstance.linkCurvature(this.linkCurvature);
  }

  public toggleFog(): void {
    if (!this.graphInstance) return;
    
    this.fogEnabled = !this.fogEnabled;
    const scene = this.graphInstance.scene();
    
    if (this.fogEnabled) {
      scene.fog = new THREE.FogExp2(0x0a0e27, 0.0015);
    } else {
      scene.fog = null;
    }
  }

  public toggleFilterPanel(): void {
    this.showFilterPanel = !this.showFilterPanel;
  }

  public toggleUnassignedOnly(): void {
    this.showUnassignedOnly = !this.showUnassignedOnly;
    this.applyFilters();
  }

  public toggleDomain(domainId: string): void {
    if (this.hiddenDomains.has(domainId)) {
      this.hiddenDomains.delete(domainId);
    } else {
      this.hiddenDomains.add(domainId);
    }
    this.applyFilters();
  }

  public updateIsolationMode(): void {
    if (!this.isolateMode) {
      this.isolatedDomain = null;
      this.applyFilters();
    }
  }

  public applyFilters(): void {
    if (!this.graphInstance) return;
    
    // Update domain boundary visibility
    this.domainBoundaryObjects.forEach((objects, domainId) => {
      // In unassigned-only mode, show ALL domain boundaries
      // Otherwise, apply normal domain filters
      const shouldShow = this.showUnassignedOnly 
        ? true 
        : (!this.hiddenDomains.has(domainId) && (!this.isolatedDomain || domainId === this.isolatedDomain));
      objects.forEach(obj => obj.visible = shouldShow);
    });
    
    this.graphInstance
      .nodeVisibility((node: any) => {
        // PRIORITY 1: Unassigned-only mode - show ONLY unassigned workspaces
        if (this.showUnassignedOnly) {
          if (node.type === NodeType.Workspace) {
            // Show ONLY workspaces in UNASSIGNED domain
            return node.metadata?.isUnassigned === true;
          }
          // Hide all artifacts
          return false;
        }
        
        // PRIORITY 2: Domain filter
        if (node.type === NodeType.Workspace && node.metadata?.domainId) {
          if (this.hiddenDomains.has(node.metadata.domainId)) return false;
          if (this.isolatedDomain && node.metadata.domainId !== this.isolatedDomain) return false;
        }
        
        // For non-workspace artifacts, check their parent workspace's domain
        if (node.type !== NodeType.Workspace && node.workspaceId) {
          const workspace = this.nodes.find(n => n.id === node.workspaceId && n.type === NodeType.Workspace);
          if (workspace?.metadata?.domainId) {
            if (this.hiddenDomains.has(workspace.metadata.domainId)) return false;
            if (this.isolatedDomain && workspace.metadata.domainId !== this.isolatedDomain) return false;
          }
        }
        
        // Artifact type filters
        if (node.type === NodeType.Workspace && !this.showWorkspaces) return false;
        if (node.type === NodeType.Lakehouse && !this.showLakehouses) return false;
        if (node.type === NodeType.DataWarehouse && !this.showWarehouses) return false;
        if (node.type === NodeType.Report && !this.showReports) return false;
        if (node.type === NodeType.SemanticModel && !this.showDatasets) return false;
        
        // Search filter
        if (this.searchTerm) {
          const searchLower = this.searchTerm.toLowerCase();
          return node.name.toLowerCase().includes(searchLower) ||
                 node.workspaceId?.toLowerCase().includes(searchLower) ||
                 NodeType[node.type].toLowerCase().includes(searchLower);
        }
        
        return true;
      })
      .linkVisibility((link: any) => {
        // In unassigned-only mode, hide ALL links
        if (this.showUnassignedOnly) {
          return false;
        }
        
        // Link type filters
        if (link.type === LinkType.CrossWorkspace && !this.showCrossWorkspaceLinks) return false;
        if (link.type === LinkType.Contains && !this.showContainsLinks) return false;
        
        // Get actual node objects (force-graph uses node references)
        const sourceNode = typeof link.source === 'object' ? link.source : this.nodes.find(n => n.id === link.source);
        const targetNode = typeof link.target === 'object' ? link.target : this.nodes.find(n => n.id === link.target);
        
        if (!sourceNode || !targetNode) return false;
        
        // Check if either endpoint is in a hidden/non-isolated domain
        const checkDomain = (node: any) => {
          if (node.type === NodeType.Workspace && node.metadata?.domainId) {
            if (this.hiddenDomains.has(node.metadata.domainId)) return false;
            if (this.isolatedDomain && node.metadata.domainId !== this.isolatedDomain) return false;
          } else if (node.workspaceId) {
            // For artifacts, check their workspace's domain
            const workspace = this.nodes.find(n => n.id === node.workspaceId && n.type === NodeType.Workspace);
            if (workspace?.metadata?.domainId) {
              if (this.hiddenDomains.has(workspace.metadata.domainId)) return false;
              if (this.isolatedDomain && workspace.metadata.domainId !== this.isolatedDomain) return false;
            }
          }
          return true;
        };
        
        return checkDomain(sourceNode) && checkDomain(targetNode);
      });
  }

  public updateLinkOpacity(): void {
    if (!this.graphInstance) return;
    this.graphInstance.linkOpacity(this.linkOpacity / 100);
  }

  public resetFilters(): void {
    this.hiddenDomains.clear();
    this.isolatedDomain = null;
    this.isolateMode = false;
    this.showUnassignedOnly = false;
    this.focusedNode = null;
    this.highlightNodes.clear();
    this.highlightLinks.clear();
    this.showWorkspaces = true;
    this.showLakehouses = true;
    this.showWarehouses = true;
    this.showReports = true;
    this.showDatasets = true;
    this.showCrossWorkspaceLinks = true;
    this.showContainsLinks = true;
    this.linkOpacity = 50;
    this.searchTerm = '';
    
    if (this.graphInstance) {
      this.graphInstance.linkOpacity(0.5);
      this.applyFilters();
    }
  }

  public zoomToDomain(domainId: string): void {
    if (!this.graphInstance) return;
    
    // Find all workspace nodes in this domain
    const domainNodes = this.nodes.filter(
      n => n.type === NodeType.Workspace && n.metadata?.domainId === domainId
    );
    
    if (domainNodes.length === 0) return;
    
    // Calculate center and bounding box
    const center = { x: 0, y: 0, z: 0 };
    domainNodes.forEach(node => {
      center.x += (node as any).x || 0;
      center.y += (node as any).y || 0;
      center.z += (node as any).z || 0;
    });
    center.x /= domainNodes.length;
    center.y /= domainNodes.length;
    center.z /= domainNodes.length;
    
    // Calculate distance
    let maxDist = 0;
    domainNodes.forEach(node => {
      const dx = ((node as any).x || 0) - center.x;
      const dy = ((node as any).y || 0) - center.y;
      const dz = ((node as any).z || 0) - center.z;
      maxDist = Math.max(maxDist, Math.sqrt(dx*dx + dy*dy + dz*dz));
    });
    
    const distance = maxDist * 3;
    const distRatio = 1 + distance/Math.hypot(center.x, center.y, center.z);
    
    this.graphInstance.cameraPosition(
      { x: center.x * distRatio, y: center.y * distRatio, z: center.z * distRatio },
      center,
      1500
    );
  }

  public getDomainColorHex(domainId: string): string {
    const color = this.getDomainColor(domainId);
    return `#${color.toString(16).padStart(6, '0')}`;
  }
  
  public getIsolatedDomainName(): string {
    if (!this.isolatedDomain) return '';
    const domain = this.domains.find(d => d.id === this.isolatedDomain);
    return domain ? domain.name : '';
  }

  // ========== END ADVANCED NAVIGATION FEATURES ==========

  private createDomainClusterForce(): any {
    // Custom force to cluster nodes by domain
    const strength = 0.3;
    
    return (alpha: number) => {
      const domainCenters = new Map<string, { x: number, y: number, z: number, count: number }>();
      
      // Calculate domain centers
      this.nodes.forEach((node: any) => {
        if (node.type === NodeType.Workspace && node.metadata?.domainId) {
          const domainId = node.metadata.domainId;
          if (!domainCenters.has(domainId)) {
            domainCenters.set(domainId, { x: 0, y: 0, z: 0, count: 0 });
          }
          const center = domainCenters.get(domainId)!;
          center.x += node.x || 0;
          center.y += node.y || 0;
          center.z += node.z || 0;
          center.count++;
        }
      });
      
      // Average the centers
      domainCenters.forEach(center => {
        if (center.count > 0) {
          center.x /= center.count;
          center.y /= center.count;
          center.z /= center.count;
        }
      });
      
      // Pull nodes toward their domain center
      this.nodes.forEach((node: any) => {
        if (node.type === NodeType.Workspace && node.metadata?.domainId) {
          const center = domainCenters.get(node.metadata.domainId);
          if (center) {
            node.vx += (center.x - (node.x || 0)) * strength * alpha;
            node.vy += (center.y - (node.y || 0)) * strength * alpha;
            node.vz += (center.z - (node.z || 0)) * strength * alpha;
          }
        }
      });
    };
  }

  private createBadgeMesh(svgPath: string, size: number): THREE.Mesh {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(svgPath);
    
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide
    });
    
    return new THREE.Mesh(geometry, material);
  }

  private async getWorkspacesScanFilesParallel (workspaceIds: string[]) {
    let index = 0;
    const observables = [];
    while (index < workspaceIds.length) {
      observables.push(this.getWorkspacesScanFiles(workspaceIds.slice(index, index + 100)));
      index += 100;
    }
    forkJoin(observables).pipe(take(1)).subscribe();
  }

  // =================================================================
  // DRAG-AND-DROP DOMAIN ASSIGNMENT
  // =================================================================

  /**
   * Highlights the nearest domain boundary when dragging a workspace
   * Provides visual feedback showing which domain the workspace will be assigned to
   */
  private highlightNearestDomain(node: any): void {
    if (!node || !node.x || !node.y || !node.z) {
      console.warn('Node missing coordinates during drag:', node);
      return;
    }

    let nearestDomain: Domain | null = null;
    let minDistance = Infinity;

    // Calculate current domain centers dynamically
    const domainCenters = new Map<string, { x: number; y: number; z: number; count: number }>();
    this.domains.forEach(domain => {
      domainCenters.set(domain.id, { x: 0, y: 0, z: 0, count: 0 });
    });

    this.nodes.forEach((n: any) => {
      if (n.type === NodeType.Workspace && n.metadata?.domainId && n.x && n.y && n.z) {
        const center = domainCenters.get(n.metadata.domainId);
        if (center) {
          center.x += n.x;
          center.y += n.y;
          center.z += n.z;
          center.count++;
        }
      }
    });

    // Average the centers
    domainCenters.forEach(center => {
      if (center.count > 0) {
        center.x /= center.count;
        center.y /= center.count;
        center.z /= center.count;
      }
    });

    // Find which domain the workspace is currently inside/nearest to
    for (const domain of this.domains) {
      const center = domainCenters.get(domain.id);
      if (!center || center.count === 0) continue;

      const dx = node.x - center.x;
      const dy = node.y - center.y;
      const dz = node.z - center.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Check if within domain boundary (use 150 as default radius)
      const domainRadius = 150;
      if (distance < domainRadius && distance < minDistance) {
        nearestDomain = domain;
        minDistance = distance;
      }
    }

    // Update domain boundary visual feedback
    this.domainBoundaryObjects.forEach((objects, domainId) => {
      const isTarget = nearestDomain && domainId === nearestDomain.id;
      objects.forEach(obj => {
        if (obj.type === 'LineSegments') {
          const material = (obj as THREE.LineSegments).material as THREE.LineBasicMaterial;
          material.color.setHex(isTarget ? 0x00FF00 : 0xFFFFFF);  // Green when target, white otherwise
          material.opacity = isTarget ? 1.0 : 0.3;
        }
      });
    });
  }

  /**
   * Clears all domain boundary highlights
   */
  private clearDomainHighlights(): void {
    this.domainBoundaryObjects.forEach((objects) => {
      objects.forEach(obj => {
        if (obj.type === 'LineSegments') {
          (obj as any).material.color.setHex(0x4a5568);
          (obj as any).material.opacity = 0.3;
        }
      });
    });
  }

  /**
   * Handles workspace drop - assigns to nearest domain if dropped inside boundary
   * Shows snackbar notification with assignment result
   */
  private handleWorkspaceDrop(node: any): void {
    if (!node.x || !node.y || !node.z) return;

    // Calculate current domain centers dynamically
    const domainCenters = new Map<string, { x: number; y: number; z: number; count: number }>();
    this.domains.forEach(domain => {
      domainCenters.set(domain.id, { x: 0, y: 0, z: 0, count: 0 });
    });

    this.nodes.forEach((n: any) => {
      if (n.type === NodeType.Workspace && n.metadata?.domainId && n.x && n.y && n.z && n.id !== node.id) {
        const center = domainCenters.get(n.metadata.domainId);
        if (center) {
          center.x += n.x;
          center.y += n.y;
          center.z += n.z;
          center.count++;
        }
      }
    });

    // Average the centers
    domainCenters.forEach(center => {
      if (center.count > 0) {
        center.x /= center.count;
        center.y /= center.count;
        center.z /= center.count;
      }
    });

    let targetDomain: Domain | null = null;
    let minDistance = Infinity;

    // Find if dropped inside any domain
    for (const domain of this.domains) {
      const center = domainCenters.get(domain.id);
      if (!center || center.count === 0) continue;

      const dx = node.x - center.x;
      const dy = node.y - center.y;
      const dz = node.z - center.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const domainRadius = 150;  // Default radius
      if (distance < domainRadius && distance < minDistance) {
        targetDomain = domain;
        minDistance = distance;
      }
    }

    const previousDomainId = node.metadata?.domainId;
    const previousDomainName = node.metadata?.domainName || 'Unassigned';

    if (targetDomain) {
      // Assign workspace to new domain
      node.metadata = node.metadata || {};
      
      // If dropped in UNASSIGNED domain, treat as unassign
      if (targetDomain.id === 'UNASSIGNED') {
        node.metadata.domainId = 'UNASSIGNED';
        node.metadata.domainName = '⚠️ Unassigned Workspaces';
        node.metadata.isUnassigned = true;
      } else {
        node.metadata.domainId = targetDomain.id;
        node.metadata.domainName = targetDomain.name;
        node.metadata.isUnassigned = false;
      }

      // Update workspace metadata
      const wsMetadata = this.workspaceMetadata.get(node.id);
      if (wsMetadata) {
        wsMetadata.domainId = targetDomain.id;
      }

      // Log assignment (silent for better UX)
      const message = previousDomainId
        ? `✓ "${node.name}" → ${targetDomain.name}`
        : `✓ "${node.name}" → ${targetDomain.name}`;
      console.log('[Domain Assignment]', message);

      // Re-apply clustering force to animate into new domain
      if (this.graphInstance) {
        this.graphInstance.d3Force('domainCluster', this.createDomainClusterForce());
        this.graphInstance.nodeColor(this.graphInstance.nodeColor());
        this.graphInstance.nodeVal(this.graphInstance.nodeVal());
      }

      // Callback for API integration
      this.onWorkspaceAssignedToDomain(node.id, targetDomain.id, previousDomainId);

    } else if (previousDomainId) {
      // Dropped outside all domains - unassign
      node.metadata.domainId = null;
      node.metadata.domainName = null;

      const wsMetadata = this.workspaceMetadata.get(node.id);
      if (wsMetadata) {
        wsMetadata.domainId = null;
      }

      console.log('[Domain Unassignment]', `✓ "${node.name}" removed from "${previousDomainName}"`);

      if (this.graphInstance) {
        this.graphInstance.d3Force('domainCluster', this.createDomainClusterForce());
        this.graphInstance.nodeColor(this.graphInstance.nodeColor());
        this.graphInstance.nodeVal(this.graphInstance.nodeVal());
      }
      
      // Callback for API integration
      this.onWorkspaceUnassignedFromDomain(node.id, previousDomainId);
    }
  }

  /**
   * Callback when workspace is assigned to a domain
   * Override this method to integrate with Microsoft Fabric API
   * 
   * @param workspaceId - The workspace that was assigned
   * @param domainId - The domain it was assigned to
   * @param previousDomainId - Previous domain (if any)
   */
  private onWorkspaceAssignedToDomain(workspaceId: string, domainId: string, previousDomainId: string | null): void {
    console.log(`[Domain Assignment] Workspace ${workspaceId} assigned to domain ${domainId}`, {
      workspaceId,
      domainId,
      previousDomainId
    });
    
    // TODO: Make API call to persist assignment in Microsoft Fabric
    // Example:
    // this.proxy.assignWorkspaceToDomain(workspaceId, domainId).subscribe(
    //   () => console.log('Assignment saved successfully'),
    //   (error) => console.error('Failed to save assignment', error)
    // );
  }

  /**
   * Callback when workspace is unassigned from a domain
   * Override this method to integrate with Microsoft Fabric API
   * 
   * @param workspaceId - The workspace that was unassigned
   * @param previousDomainId - The domain it was removed from
   */
  private onWorkspaceUnassignedFromDomain(workspaceId: string, previousDomainId: string): void {
    console.log(`[Domain Assignment] Workspace ${workspaceId} unassigned from domain ${previousDomainId}`, {
      workspaceId,
      previousDomainId
    });
    
    // TODO: Make API call to remove assignment in Microsoft Fabric
    // Example:
    // this.proxy.unassignWorkspaceFromDomain(workspaceId).subscribe(
    //   () => console.log('Unassignment saved successfully'),
    //   (error) => console.error('Failed to save unassignment', error)
    // );
  }
}
