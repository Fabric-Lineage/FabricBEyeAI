/**
 * HomeContainerComponent - Main visualization component for FabricBEyeAI
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
 * @author FabricBEyeAI Contributors
 * @version 2.0.0 - Microsoft Fabric Migration
 */

import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject, forkJoin, of } from 'rxjs';
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
import { MOCK_SCANNER_RESPONSE, MOCK_DOMAINS, MOCK_FABRIC_ITEMS } from '../../data/scanner-mock-data';

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
const COLOR_ARROW_CROSS_WS = '#00BCF2'; // Bright cyan for cross-workspace
const COLOR_ARROW_CONTAINS = '#A0A0A0'; // Gray for contains relationships
const COLOR_FOCUS_MODE = '#107C10'; // Clickable workspaces in focus mode
const COLOR_ISOLATED = '#FFD700'; // Isolated domain highlight

@Component({
  selector: 'home-container',
  templateUrl: './home-container.component.html',
  styleUrls: ['./home-container.component.less']
})
export class HomeContainerComponent implements OnInit, OnDestroy {
  // Expose enum to template
  public NodeType = NodeType;

  // =================================================================
  // CORE DATA PROPERTIES
  // =================================================================

  /** Graph nodes (workspaces and artifacts) */
  public nodes: Node[] = [];

  /** Visible nodes after filtering (used by graph) */
  private visibleNodes: Node[] = [];

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

  /** Whether the legend panel is visible */
  public showLegendPanel: boolean = true;

  /** Set of hidden domain IDs */
  public hiddenDomains: Set<string> = new Set();

  /** Currently isolated domain ID (null = none) */
  public isolatedDomain: string | null = null;

  /** Show only unassigned workspaces (for domain assignment workflow) */
  public showUnassignedOnly: boolean = false;

  /** Show assignment panel for bulk domain assignment */
  public showAssignmentPanel: boolean = false;

  /** Show unassigned workspaces in graph (default: hidden) */
  public showUnassignedWorkspaces: boolean = false;

  /** Track if we're in demo mode (no API calls) */
  private isDemoMode: boolean = false;

  /** Draft assignments (not yet saved to API) */
  public draftAssignments: Map<string, string> = new Map(); // workspaceId -> domainId

  /** Selected workspaces in assignment panel */
  public selectedWorkspaces: Set<string> = new Set();

  /** Search term for assignment panel */
  public assignmentSearchTerm: string = '';

  /** Side panel for node detail view */
  public showSidePanel: boolean = false;
  public sidePanelNode: any = null;

  /** Impact analysis state */
  public impactNodes: Set<string> = new Set();
  public impactAnalysisActive: boolean = false;

  /** Get count of unassigned workspaces */
  public get unassignedCount (): number {
    return this.nodes.filter(n =>
      n.type === NodeType.Workspace && n.metadata?.isUnassigned === true
    ).length;
  }

  /** Get unassigned workspace nodes */
  public get unassignedWorkspaces (): any[] {
    return this.nodes.filter(n =>
      n.type === NodeType.Workspace && n.metadata?.isUnassigned === true
    );
  }

  /** Get filtered unassigned workspaces based on search */
  public get filteredUnassignedWorkspaces (): any[] {
    if (!this.assignmentSearchTerm) return this.unassignedWorkspaces;
    const term = this.assignmentSearchTerm.toLowerCase();
    return this.unassignedWorkspaces.filter(ws =>
      ws.name.toLowerCase().includes(term)
    );
  }

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

  constructor (
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

  public ngOnInit (): void {
    // Subscribe to lineage data from scan service
    this.scanService.getLoadLineage()
      .pipe(takeUntil(this.destroy$))
      .subscribe(workspaces => {
        if (workspaces && workspaces.length > 0) {
          this.loadLineage(workspaces);
        }
      });
  }

  public ngOnDestroy (): void {
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
  public async startScan (): Promise<void> {
    if (!this.canStartScan) {
      this.dialog.open(LoginDialogComponent);
      return;
    }

    this.scanService.shouldStopScan = false;
    this.progressBarDialogRef = this.dialog.open(ProgressBarDialogComponent, { disableClose: true });
    this.isScanTenantInProgress = true;

    try {
      // Fetch domains from Fabric Admin API (parallel with workspace scan)
      this.fetchDomains();

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
  public async getWorkspacesScanFiles (workspaceIds: string[]): Promise<void> {
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
  public sleep (ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =================================================================
  // FILE HANDLING METHODS
  // =================================================================

  /**
   * Triggers the hidden file input for Scanner API JSON import
   * Disabled during active scans to prevent data conflicts
   */
  public onAddFile (): void {
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
  public onFileAdded (): void {
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
  public loadDemoMode (): void {
    this.isDemoMode = true; // Enable demo mode - skip all API calls
    this.domains = MOCK_DOMAINS;
    this.loadLineage(MOCK_SCANNER_RESPONSE.workspaces);
  }

  /**
   * Fetches domains from the Fabric Admin API
   * In real mode: calls GET /v1/admin/domains and maps response to Domain[]
   * Silently falls back to empty domains on error (graph still works without domains)
   */
  private fetchDomains (): void {
    if (this.isDemoMode) return;
    this.proxy.getDomains().pipe(take(1)).subscribe({
      next: (response: any) => {
        const domainList = response?.domains || response?.value || (Array.isArray(response) ? response : []);
        this.domains = domainList.map((d: any) => ({
          id: d.id,
          name: d.displayName || d.name,
          description: d.description,
          parentDomainId: d.parentDomainId,
          workspaceIds: []
        }));
        console.log(`✓ Loaded ${this.domains.length} domains from Fabric API`);
      },
      error: (err: any) => {
        console.warn('Could not fetch domains from Fabric API:', err.status);
      }
    });
  }

  /**
   * Adds Fabric-native items (from Items API) as nodes in the graph.
   * Maps item types to NodeType enum and creates Contains links to parent workspace.
   */
  private addFabricItems (items: any[]): void {
    const typeMap: Record<string, NodeType> = {
      'Notebook': NodeType.Notebook,
      'Pipeline': NodeType.Pipeline,
      'Lakehouse': NodeType.Lakehouse,
      'Warehouse': NodeType.DataWarehouse,
      'DataWarehouse': NodeType.DataWarehouse,
      'Eventstream': NodeType.Eventstream,
      'KQLDatabase': NodeType.KQLDatabase,
      'KQLQueryset': NodeType.KQLQueryset,
      'MLModel': NodeType.MLModel,
      'MLExperiment': NodeType.MLExperiment,
      'SparkJobDefinition': NodeType.SparkJobDefinition,
      'DataflowGen2': NodeType.DataflowGen2,
    };

    let added = 0;
    for (const item of items) {
      const nodeType = typeMap[item.type];
      if (!nodeType) continue;

      // Skip if already added (e.g., from Scanner API datamarts)
      if (this.nodes.find(n => n.id === item.id)) continue;

      const node: Node = {
        id: item.id,
        name: item.displayName,
        type: nodeType,
        workspaceId: item.workspaceId,
        metadata: {
          description: item.description,
          source: 'fabric-items-api'
        }
      };
      this.nodes.push(node);

      // Link to parent workspace
      this.links.push({
        source: item.workspaceId,
        target: item.id,
        type: LinkType.Contains
      });
      added++;
    }
    if (added > 0) {
      console.log(`✓ Added ${added} Fabric-native items (Notebooks, Pipelines, etc.)`);
    }
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
  public getNodeColor (nodeType: NodeType): string {
    // Official Microsoft Fabric product icon colors
    switch (nodeType) {
      case NodeType.Workspace: {
        return '#107C10'; // Fabric Green
      }
      case NodeType.Dashboard: {
        return '#E8740C'; // Fabric Dashboard orange
      }
      case NodeType.Report: {
        return '#F2C811'; // Power BI Report gold
      }
      case NodeType.PaginatedReport: {
        return '#CA5010'; // Paginated Report burnt orange
      }
      case NodeType.SemanticModel: {
        return '#1A6DD4'; // Fabric Semantic Model blue
      }
      case NodeType.Dataflow:
      case NodeType.DataflowGen2: {
        return '#4CAF50'; // Dataflow green
      }
      case NodeType.Lakehouse: {
        return '#00B7C3'; // Fabric Data Engineering teal
      }
      case NodeType.DataWarehouse: {
        return '#005BA1'; // Data Warehouse deep blue
      }
      case NodeType.SQLAnalyticsEndpoint: {
        return '#005BA1'; // SQL Endpoint (same as warehouse)
      }
      case NodeType.Notebook: {
        return '#D83B01'; // Spark Notebook orange-red
      }
      case NodeType.SparkJobDefinition: {
        return '#D83B01'; // Spark family orange-red
      }
      case NodeType.Pipeline: {
        return '#8661C5'; // Fabric Data Factory purple
      }
      case NodeType.Eventstream: {
        return '#008575'; // Real-Time Intelligence teal-green
      }
      case NodeType.Eventhouse: {
        return '#008575'; // Real-Time Intelligence teal-green
      }
      case NodeType.KQLDatabase: {
        return '#0078D4'; // Kusto blue
      }
      case NodeType.KQLQueryset: {
        return '#0078D4'; // Kusto blue
      }
      case NodeType.Datamart: {
        return '#8661C5'; // Datamart purple
      }
      case NodeType.MLModel: {
        return '#742774'; // AI/ML purple
      }
      case NodeType.MLExperiment: {
        return '#742774'; // AI/ML purple
      }
      case NodeType.App: {
        return '#737373'; // App gray
      }
      default: {
        return '#107C10'; // Fabric green
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
  private loadLineage (workspaces): void {
    this.nodes = [];
    this.links = [];
    this.reports = [];
    this.datasets = [];
    this.workspaceMetadata.clear();

    // CRITICAL: Clear highlight sets to prevent dimming during initial render
    this.highlightNodes.clear();
    this.highlightLinks.clear();
    this.focusedNode = null;
    this.hoverNode = null;

    let numberOfWorkspaces = 0;
    let unassignedWorkspaces = 0;

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
      const isUnassigned = !workspace.domainId;
      if (isUnassigned) unassignedWorkspaces++;

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
          isUnassigned // Flag for special handling
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
            sensitivityLabel: dataset.sensitivityLabel,
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
            sensitivityLabel: dataflow.sensitivityLabel,
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
            // Detect Lakehouse type for SQL endpoint creation
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
            sensitivityLabel: datamart.sensitivityLabel,
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

          // Link from lakehouse to SQL endpoint
          this.links.push({
            source: datamartNode.id,
            target: sqlEndpointNode.id,
            type: LinkType.Contains
          });

          // ALSO link from workspace to SQL endpoint so it stays in the workspace cluster
          this.links.push({
            source: workspaceNode.id,
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
            sensitivityLabel: report.sensitivityLabel,
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
            sensitivityLabel: dashboard.sensitivityLabel,
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

    // PASS 1b: Add Fabric-native items (Notebooks, Pipelines, etc.) from Items API
    if (this.isDemoMode) {
      this.addFabricItems(MOCK_FABRIC_ITEMS);
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
    const allNodeIds = new Set(this.nodes.map(n => n.id));
    let validLinks: Link[] = this.links.filter(link => allNodeIds.has(link.source as string) && allNodeIds.has(link.target as string));
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

      // Filter nodes: keep workspaces in limited set AND their artifacts
      const limitedWorkspaceSet = new Set(limitedWorkspaceNodes);
      const beforeCount = this.nodes.length;

      this.nodes = this.nodes.filter(node => {
        // Keep workspace if in limited set
        if (node.type === NodeType.Workspace) {
          return limitedWorkspaceSet.has(node.id);
        }
        // Keep artifact ONLY if it has a workspaceId AND that workspace is in limited set
        if (!node.workspaceId) {
          console.warn('[ORPHAN] Removing artifact without workspaceId:', node.name, NodeType[node.type]);
          return false;
        }
        return limitedWorkspaceSet.has(node.workspaceId);
      });

      // Filter links: keep only links between remaining nodes
      const nodeIds = new Set(this.nodes.map(node => node.id));
      const beforeLinkCount = validLinks.length;
      validLinks = validLinks.filter(link =>
        nodeIds.has(link.source) && nodeIds.has(link.target)
      );
    }

    // PASS 5: Remove orphaned artifacts (artifacts without valid workspace in graph)
    const workspaceIds = new Set(this.nodes.filter(n => n.type === NodeType.Workspace).map(n => n.id));
    const beforeOrphanRemoval = this.nodes.length;

    console.log('[PASS 5] Checking for orphaned artifacts. Valid workspaces:', Array.from(workspaceIds));

    this.nodes = this.nodes.filter(node => {
      if (node.type === NodeType.Workspace) return true;
      if (!node.workspaceId) {
        console.error('[ORPHAN] Artifact without workspaceId:', node.name, NodeType[node.type], node.id);
        return false;
      }
      if (!workspaceIds.has(node.workspaceId)) {
        console.error('[ORPHAN] Artifact with non-existent workspace:', node.name, 'workspaceId:', node.workspaceId, 'artifactId:', node.id);
        return false;
      }
      return true;
    });

    if (beforeOrphanRemoval !== this.nodes.length) {
      console.log(`[Orphan Cleanup] Removed ${beforeOrphanRemoval - this.nodes.length} orphaned artifacts`);
      // Re-filter links after removing orphans
      const nodeIds = new Set(this.nodes.map(n => n.id));
      validLinks = validLinks.filter(link => nodeIds.has(link.source) && nodeIds.has(link.target));
    }

    // FINAL SUMMARY
    const finalWorkspaces = this.nodes.filter(n => n.type === NodeType.Workspace);
    const finalUnassigned = finalWorkspaces.filter(n => n.metadata?.isUnassigned);
    const finalArtifacts = this.nodes.filter(n => n.type !== NodeType.Workspace);

    // Log summary for debugging
    console.log(`✓ Loaded ${finalWorkspaces.length} workspaces (${finalUnassigned.length} unassigned), ${finalArtifacts.length} artifacts, ${validLinks.length} links`);

    // FILTER DATA before passing to graph - remove unassigned workspaces and their artifacts
    let visibleNodes = this.nodes;
    let visibleLinks = validLinks;

    if (!this.showUnassignedWorkspaces) {
      const unassignedWorkspaceIds = new Set(
        this.nodes
          .filter(n => n.type === NodeType.Workspace && n.metadata?.isUnassigned)
          .map(n => n.id)
      );

      // Remove unassigned workspaces and their artifacts
      visibleNodes = this.nodes.filter(node => {
        if (node.type === NodeType.Workspace && node.metadata?.isUnassigned) {
          return false;
        }
        if (node.type !== NodeType.Workspace && node.workspaceId && unassignedWorkspaceIds.has(node.workspaceId)) {
          return false;
        }
        return true;
      });

      // Remove links connected to removed nodes
      const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
      visibleLinks = validLinks.filter(link =>
        visibleNodeIds.has(link.source) && visibleNodeIds.has(link.target)
      );
    }

    // Store visible nodes for domain boundaries and forces
    this.visibleNodes = visibleNodes;

    // RENDER THE GRAPH with filtered data
    const gData = {
      nodes: visibleNodes,
      links: visibleLinks
    };

    const graph = new ForceGraph3D(document.getElementById('3d-graph'), {
      controlType: 'orbit'
    });

    this.graphInstance = graph;

    graph.graphData(gData)
      .width(window.innerWidth)
      .height(window.innerHeight)
      .backgroundColor('#0a0e27')
      .enableNodeDrag(false) // Disable drag - use dedicated assignment panel instead
      .nodeRelSize(8)
      .nodeVal((node: any) => {
        if (node.type === NodeType.Workspace && node.metadata?.isUnassigned) {
          return 45; // 3x larger for unassigned workspaces
        }
        return node.type === NodeType.Workspace ? 15 : 4;
      })
      .d3Force('domainCluster', this.createDomainClusterForce())
      .linkOpacity(1.0) // Full opacity - we control it in linkColor
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
        if (sensitivityLabel?.labelId) {
          const labelColors: Record<string, { bg: string; icon: string; text: string }> = {
            '00000000-0000-0000-0000-000000000004': { bg: '#C43E1C', icon: '🔒', text: 'Highly Confidential' },
            '00000000-0000-0000-0000-000000000003': { bg: '#D83B01', icon: '🔒', text: 'Confidential' },
            '00000000-0000-0000-0000-000000000002': { bg: '#CA5010', icon: '🔓', text: 'Internal' },
            '00000000-0000-0000-0000-000000000001': { bg: '#8A8A8A', icon: '🌐', text: 'Public' }
          };
          const label = labelColors[sensitivityLabel.labelId] || { bg: '#CA5010', icon: '🔓', text: 'Internal' };
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
          const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

          graph.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
            node,
            1000
          );

          this.openSidePanel(node);
          return;
        }

        // For artifacts, zoom to node
        const distance = 150;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
        graph.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          node,
          800
        );

        this.openSidePanel(node);
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
        const color = (() => {
          // Highlight active links with bright colors
          if (this.highlightLinks.size > 0) {
            if (this.highlightLinks.has(link)) {
              // Bright colors for highlighted links
              if (link.type === LinkType.CrossWorkspace) return COLOR_ARROW_CROSS_WS;
              if (link.type === LinkType.Contains) return '#FF6600'; // BRIGHT ORANGE
              return 'rgba(200,200,200,0.8)';
            }
            // Dim non-highlighted links
            return 'rgba(100,100,100,0.1)';
          }
          // Default colors - make Contains VERY visible
          if (link.type === LinkType.CrossWorkspace) return 'rgba(0,188,242,0.5)'; // Cyan
          if (link.type === LinkType.Contains) return 'rgba(255,102,0,0.8)'; // BRIGHT ORANGE - HIGH OPACITY
          return 'rgba(150,150,150,0.3)';
        })();

        if (link.type === LinkType.Contains && Math.random() < 0.01) {
          console.log('[LINK COLOR]', link.type, 'from', link.source, 'to', link.target, 'color:', color);
        }

        return color;
      })
      .linkWidth((link: any) => {
        // Make Contains links thicker for visibility
        if (link.type === LinkType.Contains) return 2; // Thick orange lines
        if (link.type === LinkType.CrossWorkspace) return 2;
        return 1;
      });

    this.shouldShowGraph = true;

    // Add domain boundary spheres after layout settles
    this.addDomainBoundaries();
  }

  private updateHighlight (): void {
    if (!this.graphInstance) return;
    this.graphInstance
      .nodeColor(this.graphInstance.nodeColor())
      .linkColor(this.graphInstance.linkColor());
  }

  public zoomToFit (): void {
    if (this.graphInstance) {
      this.graphInstance.zoomToFit(400, 20);
    }
  }

  private addDomainBoundaries (): void {
    if (!this.graphInstance) return;

    // Wait for nodes to settle into positions
    setTimeout(() => {
      const scene = this.graphInstance.scene();

      // Group workspace nodes by domain - USE VISIBLE NODES ONLY
      const domainNodes: Map<string, any[]> = new Map();
      this.visibleNodes.forEach(node => {
        if (node.type === NodeType.Workspace && node.metadata?.domainId) {
          const domainId = node.metadata.domainId;
          if (!domainNodes.has(domainId)) {
            domainNodes.set(domainId, []);
          }
          domainNodes.get(domainId)!.push(node);
        }
      });

      console.log(`[BOUNDARIES] Creating spheres for ${domainNodes.size} domains with visible workspaces`);

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

  private getDomainColor (domainId: string): number {
    // Simple hash to generate consistent colors per domain
    let hash = 0;
    for (let i = 0; i < domainId.length; i++) {
      hash = domainId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return new THREE.Color(`hsl(${hue}, 70%, 50%)`).getHex();
  }

  public exportToPNG (): void {
    if (!this.graphInstance) return;

    const renderer = this.graphInstance.renderer();
    const imgData = renderer.domElement.toDataURL('image/png');

    const link = document.createElement('a');
    link.download = `fabricbeyeai-graph-${new Date().getTime()}.png`;
    link.href = imgData;
    link.click();
  }

  public exportToJSON (): void {
    const data = {
      nodes: this.nodes,
      links: this.links,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `fabricbeyeai-graph-${new Date().getTime()}.json`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  }

  // =================================================================
  // DOMAIN ASSIGNMENT PANEL
  // =================================================================

  /**
   * Opens the assignment panel and filters graph to unassigned workspaces
   */
  public openAssignmentPanel (): void {
    this.showAssignmentPanel = true;
    this.showUnassignedOnly = true;
    this.applyFilters();
    this.draftAssignments.clear();
    this.selectedWorkspaces.clear();
  }

  /**
   * Closes assignment panel and resets view
   */
  public closeAssignmentPanel (): void {
    this.showAssignmentPanel = false;
    this.showUnassignedOnly = false;
    this.applyFilters();
    this.draftAssignments.clear();
    this.selectedWorkspaces.clear();
    this.assignmentSearchTerm = '';
  }

  /**
   * Opens side panel with details for the selected node
   */
  public openSidePanel (node: any): void {
    this.sidePanelNode = node;
    this.showSidePanel = true;
  }

  public closeSidePanel (): void {
    this.showSidePanel = false;
    this.sidePanelNode = null;
  }

  /** Toggle legend panel visibility */
  public toggleLegendPanel (): void {
    this.showLegendPanel = !this.showLegendPanel;
  }

  /** Get unique artifact types present in the current graph */
  public getActiveNodeTypes (): { type: NodeType; label: string; color: string; count: number }[] {
    const typeCounts = new Map<NodeType, number>();
    for (const node of this.nodes) {
      if (node.type === NodeType.Workspace) continue;
      typeCounts.set(node.type, (typeCounts.get(node.type) || 0) + 1);
    }
    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({
        type,
        label: NodeType[type],
        color: this.getNodeColor(type),
        count
      }))
      .sort((a, b) => b.count - a.count);
  }

  /** Get upstream nodes for the side panel node */
  public getSidePanelUpstream (): Node[] {
    if (!this.sidePanelNode) return [];
    return this.links
      .filter(l => (l as any).target === this.sidePanelNode.id || (l as any).target?.id === this.sidePanelNode.id)
      .map(l => {
        const sourceId = typeof (l as any).source === 'string' ? (l as any).source : (l as any).source?.id;
        return this.nodes.find(n => n.id === sourceId);
      })
      .filter((n): n is Node => !!n && n.type !== NodeType.Workspace);
  }

  /** Get downstream nodes for the side panel node */
  public getSidePanelDownstream (): Node[] {
    if (!this.sidePanelNode) return [];
    return this.links
      .filter(l => (l as any).source === this.sidePanelNode.id || (l as any).source?.id === this.sidePanelNode.id)
      .map(l => {
        const targetId = typeof (l as any).target === 'string' ? (l as any).target : (l as any).target?.id;
        return this.nodes.find(n => n.id === targetId);
      })
      .filter((n): n is Node => !!n && n.type !== NodeType.Workspace);
  }

  /** Get artifact count in a workspace for side panel */
  public getWorkspaceArtifactCount (): number {
    if (!this.sidePanelNode) return 0;
    return this.nodes.filter(n => n.workspaceId === this.sidePanelNode.id && n.type !== NodeType.Workspace).length;
  }

  /**
   * Impact Analysis: traces all downstream dependents from a node
   * Walks the lineage graph using BFS to find everything affected
   */
  public runImpactAnalysis (): void {
    if (!this.sidePanelNode) return;

    this.impactNodes.clear();
    this.impactAnalysisActive = true;

    // BFS from selected node through all downstream links
    const queue: string[] = [this.sidePanelNode.id];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      this.impactNodes.add(currentId);

      // Find all nodes that depend on current (current is their source/upstream)
      for (const link of this.links) {
        const sourceId = typeof (link as any).source === 'string' ? (link as any).source : (link as any).source?.id;
        const targetId = typeof (link as any).target === 'string' ? (link as any).target : (link as any).target?.id;

        if (sourceId === currentId && !visited.has(targetId)) {
          queue.push(targetId);
        }
      }
    }

    // Remove the source node itself from count
    this.impactNodes.delete(this.sidePanelNode.id);

    // Apply visual highlighting
    if (this.graphInstance) {
      this.graphInstance
        .nodeOpacity((node: any) => {
          return this.impactNodes.has(node.id) || node.id === this.sidePanelNode.id ? 1 : 0.1;
        })
        .linkOpacity((link: any) => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
          const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
          return (this.impactNodes.has(sourceId) || sourceId === this.sidePanelNode.id) &&
                 (this.impactNodes.has(targetId) || targetId === this.sidePanelNode.id) ? 1 : 0.03;
        });
    }
  }

  /** Clear impact analysis highlighting */
  public clearImpactAnalysis (): void {
    this.impactNodes.clear();
    this.impactAnalysisActive = false;
    if (this.graphInstance) {
      this.graphInstance
        .nodeOpacity(1)
        .linkOpacity(0.6);
    }
  }

  /**
   * Suggests domain for a workspace based on name, artifacts, etc.
   */
  public suggestDomain (workspace: any): Domain | null {
    const wsName = workspace.name.toLowerCase();

    // Try exact keyword matching first
    for (const domain of this.domains) {
      if (domain.id === 'UNASSIGNED') continue;

      const domainName = domain.name.toLowerCase();
      const domainKeywords = domainName.split(/[\s-_]+/);

      // Check if workspace name contains domain keywords
      for (const keyword of domainKeywords) {
        if (keyword.length > 3 && wsName.includes(keyword)) {
          return domain;
        }
      }
    }

    // Check for common patterns
    const patterns: {[key: string]: string[]} = {
      sales: ['sales', 'revenue', 'crm', 'customer'],
      finance: ['finance', 'accounting', 'budget', 'expense'],
      marketing: ['marketing', 'campaign', 'social', 'brand'],
      hr: ['hr', 'human', 'employee', 'talent', 'people'],
      it: ['it', 'tech', 'infrastructure', 'system'],
      operations: ['ops', 'operations', 'supply', 'logistics']
    };

    for (const [category, keywords] of Object.entries(patterns)) {
      for (const keyword of keywords) {
        if (wsName.includes(keyword)) {
          const matchedDomain = this.domains.find(d =>
            d.id !== 'UNASSIGNED' && d.name.toLowerCase().includes(category)
          );
          if (matchedDomain) return matchedDomain;
        }
      }
    }

    return null;
  }

  /**
   * Assigns workspace to domain (draft mode - visual only)
   */
  public assignWorkspace (workspaceId: string, domainId: string): void {
    this.draftAssignments.set(workspaceId, domainId);

    // Update visual immediately for preview
    const node = this.nodes.find(n => n.id === workspaceId);
    if (node) {
      const domain = this.domains.find(d => d.id === domainId);
      if (domain) {
        node.metadata = node.metadata || {};
        node.metadata.domainId = domainId;
        node.metadata.domainName = domain.name;
        node.metadata.isUnassigned = false;
        node.metadata.isDraft = true; // Mark as draft

        if (this.graphInstance) {
          this.graphInstance.nodeColor(this.graphInstance.nodeColor());
          this.graphInstance.nodeVal(this.graphInstance.nodeVal());
        }
      }
    }
  }

  /**
   * Quick assign using suggested domain
   */
  public quickAssign (workspaceId: string): void {
    const workspace = this.nodes.find(n => n.id === workspaceId);
    if (!workspace) return;

    const suggestedDomain = this.suggestDomain(workspace);
    if (suggestedDomain) {
      this.assignWorkspace(workspaceId, suggestedDomain.id);
    }
  }

  /**
   * Toggle workspace selection for bulk operations
   */
  public toggleWorkspaceSelection (workspaceId: string): void {
    if (this.selectedWorkspaces.has(workspaceId)) {
      this.selectedWorkspaces.delete(workspaceId);
    } else {
      this.selectedWorkspaces.add(workspaceId);
    }
  }

  /**
   * Select all filtered workspaces
   */
  public selectAllWorkspaces (): void {
    this.filteredUnassignedWorkspaces.forEach(ws => {
      this.selectedWorkspaces.add(ws.id);
    });
  }

  /**
   * Clear all selections
   */
  public clearSelections (): void {
    this.selectedWorkspaces.clear();
  }

  /**
   * Bulk assign selected workspaces to a domain
   */
  public bulkAssignSelected (domainId: string): void {
    this.selectedWorkspaces.forEach(wsId => {
      this.assignWorkspace(wsId, domainId);
    });
  }

  /**
   * Save all draft assignments (in demo mode: just visual, in real mode: API call)
   */
  public async saveAssignments (): Promise<void> {
    if (this.draftAssignments.size === 0) {
      alert('No assignments to save');
      return;
    }

    const assignments = Array.from(this.draftAssignments.entries()).map(([workspaceId, domainId]) => ({
      workspaceId,
      domainId
    }));

    // DEMO MODE: Just update visual state, no API calls
    if (this.isDemoMode) {
      console.log(`✓ Demo mode: Saved ${assignments.length} workspace assignments locally`);

      // Remove draft flag from all nodes
      this.nodes.forEach(node => {
        if (node.metadata?.isDraft) {
          delete node.metadata.isDraft;
        }
      });

      // Update graph colors
      if (this.graphInstance) {
        this.graphInstance.nodeColor(this.graphInstance.nodeColor());
      }

      // Clear draft state
      this.draftAssignments.clear();
      this.selectedWorkspaces.clear();

      // Show success message
      alert(`✓ Successfully assigned ${assignments.length} workspace${assignments.length > 1 ? 's' : ''} to domains!\n\n(Demo Mode - changes are visual only)`);

      // Close panel
      this.closeAssignmentPanel();
      return;
    }

    // REAL MODE: Call Fabric Admin API
    this.proxy.batchAssignWorkspacesToDomains(assignments).subscribe(
      (results) => {
        console.log(`✓ Assigned ${assignments.length} workspaces to domains`);

        // Remove draft flag from all nodes
        this.nodes.forEach(node => {
          if (node.metadata?.isDraft) {
            delete node.metadata.isDraft;
          }
        });

        // Clear draft state
        this.draftAssignments.clear();
        this.selectedWorkspaces.clear();

        // Show success message
        alert(`✓ Successfully assigned ${assignments.length} workspace${assignments.length > 1 ? 's' : ''} to domains!`);

        // Close panel
        this.closeAssignmentPanel();
      },
      (error) => {
        console.error('✗ Failed to save assignments:', error);

        let errorMessage = 'Failed to save domain assignments';
        if (error.status === 403) {
          errorMessage = 'You don\'t have permission to assign workspaces to domains';
        } else if (error.error?.error?.message) {
          errorMessage = error.error.error.message;
        }

        alert(`Assignment Error: ${errorMessage}\n\nYour visual changes will be reverted.`);

        // Revert all draft assignments
        this.cancelAssignments();
      }
    );
  }

  /**
   * Cancel all draft assignments and revert visual changes
   */
  public cancelAssignments (): void {
    // Revert visual changes
    this.draftAssignments.forEach((domainId, workspaceId) => {
      const node = this.nodes.find(n => n.id === workspaceId);
      if (node) {
        node.metadata.domainId = 'UNASSIGNED';
        node.metadata.domainName = '⚠️ Unassigned Workspaces';
        node.metadata.isUnassigned = true;
        delete node.metadata.isDraft;
      }
    });

    if (this.graphInstance) {
      this.graphInstance.nodeColor(this.graphInstance.nodeColor());
      this.graphInstance.nodeVal(this.graphInstance.nodeVal());
    }

    this.closeAssignmentPanel();
  }

  /**
   * Get assigned domain for workspace (including drafts)
   */
  public getAssignedDomain (workspaceId: string): Domain | null {
    const domainId = this.draftAssignments.get(workspaceId);
    if (domainId) {
      return this.domains.find(d => d.id === domainId) || null;
    }
    return null;
  }

  /**
   * Get workspace artifact summary for display
   */
  public getWorkspaceSummary (workspace: any): string {
    const artifacts = this.nodes.filter(n => n.workspaceId === workspace.id);
    const counts: {[key: string]: number} = {};

    artifacts.forEach(artifact => {
      const type = NodeType[artifact.type];
      counts[type] = (counts[type] || 0) + 1;
    });

    const summary = Object.entries(counts)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .slice(0, 3)
      .join(', ');

    return summary || 'No artifacts';
  }

  public onSearchChange (): void {
    this.filterGraph();
  }

  private filterGraph (): void {
    if (!this.graphInstance) return;

    const searchLower = this.searchTerm.toLowerCase();
    const matchIds = new Set<string>();

    if (searchLower) {
      // Find matching nodes
      for (const node of this.nodes) {
        if (node.name.toLowerCase().includes(searchLower) ||
            NodeType[node.type].toLowerCase().includes(searchLower) ||
            (node.metadata?.domainName || '').toLowerCase().includes(searchLower)) {
          matchIds.add(node.id);
        }
      }
    }

    // Use nodeColor to dim non-matching nodes instead of hiding them
    this.graphInstance
      .nodeOpacity((node: any) => {
        if (!searchLower) return 1;
        return matchIds.has(node.id) ? 1 : 0.08;
      })
      .linkOpacity((link: any) => {
        if (!searchLower) return 0.6;
        const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
        return (matchIds.has(sourceId) || matchIds.has(targetId)) ? 0.8 : 0.02;
      });
  }

  // ========== ADVANCED NAVIGATION FEATURES ==========

  public toggleSimulation (): void {
    if (!this.graphInstance) return;

    this.simulationPaused = !this.simulationPaused;

    if (this.simulationPaused) {
      this.graphInstance.pauseAnimation();
    } else {
      this.graphInstance.resumeAnimation();
    }
  }

  public toggleLinkCurvature (): void {
    if (!this.graphInstance) return;

    this.linkCurvature = this.linkCurvature > 0 ? 0 : 0.25;
    this.graphInstance.linkCurvature(this.linkCurvature);
  }

  public toggleFog (): void {
    if (!this.graphInstance) return;

    this.fogEnabled = !this.fogEnabled;
    const scene = this.graphInstance.scene();

    if (this.fogEnabled) {
      scene.fog = new THREE.FogExp2(0x0a0e27, 0.0015);
    } else {
      scene.fog = null;
    }
  }

  public toggleFilterPanel (): void {
    this.showFilterPanel = !this.showFilterPanel;
  }

  public toggleUnassignedOnly (): void {
    if (!this.showUnassignedOnly) {
      this.openAssignmentPanel();
    } else {
      this.closeAssignmentPanel();
    }
  }

  /**
   * Toggle showing unassigned workspaces in the graph
   */
  public toggleShowUnassignedWorkspaces (): void {
    this.showUnassignedWorkspaces = !this.showUnassignedWorkspaces;
    this.applyFilters();
    console.log(`[Unassigned] ${this.showUnassignedWorkspaces ? 'Showing' : 'Hiding'} ${this.unassignedCount} unassigned workspaces`);
  }

  public toggleDomain (domainId: string): void {
    if (this.hiddenDomains.has(domainId)) {
      this.hiddenDomains.delete(domainId);
    } else {
      this.hiddenDomains.add(domainId);
    }
    this.applyFilters();
  }

  public updateIsolationMode (): void {
    if (!this.isolateMode) {
      this.isolatedDomain = null;
      this.applyFilters();
    }
  }

  /**
   * Helper function to check if a workspace node would be visible
   * This centralizes the workspace visibility logic
   */
  private isWorkspaceVisible (workspace: any): boolean {
    if (!workspace || workspace.type !== NodeType.Workspace) return false;

    // Check unassigned filter
    if (!this.showUnassignedWorkspaces && workspace.metadata?.isUnassigned) {
      return false;
    }

    // Check unassigned-only mode
    if (this.showUnassignedOnly) {
      return workspace.metadata?.isUnassigned === true;
    }

    // Check domain filters
    if (workspace.metadata?.domainId) {
      if (this.hiddenDomains.has(workspace.metadata.domainId)) return false;
      if (this.isolatedDomain && workspace.metadata.domainId !== this.isolatedDomain) return false;
    }

    // Check workspace type filter
    if (!this.showWorkspaces) return false;

    return true;
  }

  public applyFilters (): void {
    if (!this.graphInstance) return;

    // Update domain boundary visibility
    this.domainBoundaryObjects.forEach((objects, domainId) => {
      // In unassigned-only mode, show ALL domain boundaries
      // Otherwise, apply normal domain filters
      let shouldShow = this.showUnassignedOnly
        ? true
        : (!this.hiddenDomains.has(domainId) && (!this.isolatedDomain || domainId === this.isolatedDomain));

      // Hide UNASSIGNED domain boundary if toggle is off
      if (domainId === 'UNASSIGNED' && !this.showUnassignedWorkspaces) {
        shouldShow = false;
      }

      objects.forEach(obj => obj.visible = shouldShow);
    });

    this.graphInstance
      .nodeVisibility((node: any) => {
        // Handle workspace nodes
        if (node.type === NodeType.Workspace) {
          return this.isWorkspaceVisible(node);
        }

        // Handle artifact nodes - CRITICAL: Check if parent workspace is visible
        if (node.workspaceId) {
          const workspace = this.nodes.find(n => n.id === node.workspaceId && n.type === NodeType.Workspace);

          if (!workspace) {
            console.error('[VISIBILITY ERROR] Artifact has no workspace in graph:', {
              artifactName: node.name,
              artifactType: NodeType[node.type],
              workspaceId: node.workspaceId,
              totalWorkspaces: this.nodes.filter(n => n.type === NodeType.Workspace).length
            });
            return false;
          }

          // KEY FIX: If parent workspace is not visible, hide the artifact
          const wsVisible = this.isWorkspaceVisible(workspace);
          if (!wsVisible) {
            console.log('[HIDE ARTIFACT] Hiding artifact because workspace hidden:', node.name, 'workspace:', workspace.name);
          }
          return wsVisible;
        }

        // Artifact type filters
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

        // Get actual node objects (force-graph uses node references after initial load)
        const sourceNode = typeof link.source === 'object' ? link.source : this.nodes.find(n => n.id === link.source);
        const targetNode = typeof link.target === 'object' ? link.target : this.nodes.find(n => n.id === link.target);

        if (!sourceNode || !targetNode) return false;

        // CRITICAL FIX: Check if BOTH endpoints would be visible according to node visibility rules
        // This prevents orphaned artifacts by hiding links when either endpoint is hidden

        // Check source node visibility
        if (sourceNode.type === NodeType.Workspace) {
          if (!this.isWorkspaceVisible(sourceNode)) return false;
        } else {
          // Source is an artifact - check its workspace visibility
          if (sourceNode.workspaceId) {
            const sourceWS = this.nodes.find(n => n.id === sourceNode.workspaceId && n.type === NodeType.Workspace);
            if (!sourceWS || !this.isWorkspaceVisible(sourceWS)) return false;
          }
        }

        // Check target node visibility
        if (targetNode.type === NodeType.Workspace) {
          if (!this.isWorkspaceVisible(targetNode)) return false;
        } else {
          // Target is an artifact - check its workspace visibility
          if (targetNode.workspaceId) {
            const targetWS = this.nodes.find(n => n.id === targetNode.workspaceId && n.type === NodeType.Workspace);
            if (!targetWS || !this.isWorkspaceVisible(targetWS)) return false;
          }
        }

        return true;
      });
  }

  public updateLinkOpacity (): void {
    if (!this.graphInstance) return;
    this.graphInstance.linkOpacity(this.linkOpacity / 100);
  }

  public resetFilters (): void {
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

  public zoomToDomain (domainId: string): void {
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
      maxDist = Math.max(maxDist, Math.sqrt(dx * dx + dy * dy + dz * dz));
    });

    const distance = maxDist * 3;
    const distRatio = 1 + distance / Math.hypot(center.x, center.y, center.z);

    this.graphInstance.cameraPosition(
      { x: center.x * distRatio, y: center.y * distRatio, z: center.z * distRatio },
      center,
      1500
    );
  }

  public getDomainColorHex (domainId: string): string {
    const color = this.getDomainColor(domainId);
    return `#${color.toString(16).padStart(6, '0')}`;
  }

  public getIsolatedDomainName (): string {
    if (!this.isolatedDomain) return '';
    const domain = this.domains.find(d => d.id === this.isolatedDomain);
    return domain ? domain.name : '';
  }

  // ========== END ADVANCED NAVIGATION FEATURES ==========

  private createDomainClusterForce (): any {
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

  private createBadgeMesh (svgPath: string, size: number): THREE.Mesh {
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
}
