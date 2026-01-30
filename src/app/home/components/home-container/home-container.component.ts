import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { HomeProxy } from '../../services/home-proxy.service';
import { ScanService } from '../../services/scan.service';
import ForceGraph3D from '3d-force-graph';
import { Report, Dataset } from '../../models/dataModel';
import { Link, LinkType, Node, NodeType } from '../../models/graphModels';
import * as THREE from 'three';
import { AuthService } from 'src/app/services/auth.service';
import SpriteText from 'three-spritetext';
import { take, takeUntil } from 'rxjs/operators';
import { forkJoin, Subject } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProgressBarDialogComponent } from 'src/app/components/progress-bar-dialog/progress-bar-dialog.component';
import { LoginDialogComponent } from 'src/app/components/login-dialog/login-dialog.component';
import { ErrorDialogComponent } from 'src/app/components/error-dialog/error-dialog.component';

import { MOCK_WORKSPACES } from '../../data/mock-data';
import { MOCK_SCANNER_RESPONSE, MOCK_DOMAINS } from '../../data/scanner-mock-data';
import type { WorkspaceInfoResponse, Domain } from '../../models/scanner-api.types';

const WorkspaceLimit: number = 100;
const maxParallelBEcalls: number = 16;

@Component({
  selector: 'home-container',
  templateUrl: './home-container.component.html',
  styleUrls: ['./home-container.component.less']
})
export class HomeContainerComponent implements OnInit, OnDestroy {
  public isScanTenantInProgress: boolean = false;
  public shouldShowGraph = false;
  public nodes: Node[] = [];
  public links: Link[] = [];
  public reports: Report[] = [];
  public datasets: Dataset[] = [];
  public domains: Domain[] = [];
  public workspaceMetadata: Map<string, any> = new Map(); // Store workspace-level metadata
  public searchTerm: string = '';
  public selectedNodeTypes: Set<NodeType> = new Set();
  public selectedDomains: Set<string> = new Set();
  private graphInstance: any = null;
  private highlightNodes = new Set();
  private highlightLinks = new Set();
  private hoverNode: any = null;

  // Advanced navigation features
  public simulationPaused: boolean = false;
  public linkCurvature: number = 0;
  public fogEnabled: boolean = false;
  public isolateMode: boolean = false;
  public showFilterPanel: boolean = false;
  public hiddenDomains: Set<string> = new Set();
  public isolatedDomain: string | null = null;
  
  // Artifact type filters
  public showWorkspaces: boolean = true;
  public showLakehouses: boolean = true;
  public showWarehouses: boolean = true;
  public showReports: boolean = true;
  public showDatasets: boolean = true;
  
  // Link filters
  public showCrossWorkspaceLinks: boolean = true;
  public showContainsLinks: boolean = true;
  public linkOpacity: number = 50;
  
  // Domain boundary objects for show/hide
  private domainBoundaryObjects: Map<string, THREE.Object3D[]> = new Map();

  public canStartScan: boolean = false;
  public scanStatusPercent: number = 0;
  private progressBarDialogRef: MatDialogRef<ProgressBarDialogComponent>;
  private destroy$: Subject<void> = new Subject();

  @ViewChild('filesInput', { static: true }) filesInput: ElementRef;

  constructor (private proxy: HomeProxy,
    private scanService: ScanService,
    private authService: AuthService,
    private dialog: MatDialog) {
    this.authService.getToken().subscribe((token: string) => {
      this.canStartScan = token.length > 0;
    });
  }

  public ngOnInit (): void {
    this.scanService.getLoadLineage().pipe(
      takeUntil(this.destroy$)
    )
      .subscribe(workspaces => workspaces && workspaces.length > 0 ? this.loadLineage(workspaces) : null);
  }

  public ngOnDestroy (): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public async startScan (): Promise<void> {
    if (!this.canStartScan) {
      this.dialog.open(LoginDialogComponent);
      return;
    }
    this.scanService.shouldStopScan = false;
    this.progressBarDialogRef = this.dialog.open(ProgressBarDialogComponent, { disableClose: true });
    this.isScanTenantInProgress = true;
    try {
      const resultObserable = await this.proxy.getModifedWorkspaces();
      const result = await resultObserable.toPromise();
      const workspacesIds = result.slice(0, maxParallelBEcalls * 100).map(workspace => workspace.Id);

      this.getWorkspacesScanFilesParallel(workspacesIds);

      this.isScanTenantInProgress = false;
    } catch (e) {
      switch (e.status) {
        case 401: {
          // TODO: show error "No tenant admin is logged in".
          this.dialog.open(ErrorDialogComponent, { data: { title: 'Error 401', errorMessage: 'No tenant admin is logged in, please login as a tenant admin' } });
          // alert('401 - No tenant admin is logged in');
          break;
        }
        case 403: {
          this.dialog.open(ErrorDialogComponent, { data: { title: 'Error 403', errorMessage: 'The token is not correct, please change the environment or refresh the token' } });
          // TODO: show error "change the environment / refresh the token".
          // alert('403 - change the environment / refresh the token');
          break;
        }
      }
      this.progressBarDialogRef.close();
      this.isScanTenantInProgress = false;
    }
  }

  public async getWorkspacesScanFiles (workspaceIds: string[]) {
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

  public sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public onAddFile (): void {
    if (this.isScanTenantInProgress) {
      return;
    }

    (this.filesInput.nativeElement as HTMLInputElement).click();
  }

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

  public loadDemoMode(): void {
    // Load Scanner API format data
    this.domains = MOCK_DOMAINS;
    this.loadLineage(MOCK_SCANNER_RESPONSE.workspaces);
  }

  private getNodeColor (nodeType: NodeType): string {
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

  private loadLineage (workspaces): void {
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

      // Create workspace node with domain property for grouping
      const workspaceNode: Node = {
        id: workspace.id,
        name: workspace.name,
        type: NodeType.Workspace,
        crossDownstreamWSIds: [],
        crossUpstreamWSIds: [],
        workspaceId: workspace.id,
        metadata: {
          domainId: workspace.domainId,
          domainName: this.domains.find(d => d.id === workspace.domainId)?.name || 'Unassigned'
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
    if (numberOfWorkspaces > WorkspaceLimit) {
      const workspaceNodes = this.nodes.filter(node => node.type === NodeType.Workspace);
      const limitedWorkspaceInfo = workspaceNodes
        .sort((a, b) => {
          const aCount = (a.crossDownstreamWSIds?.length || 0) + (a.crossUpstreamWSIds?.length || 0);
          const bCount = (b.crossDownstreamWSIds?.length || 0) + (b.crossUpstreamWSIds?.length || 0);
          return bCount - aCount;
        })
        .slice(0, WorkspaceLimit)
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
      .enableNodeDrag(false)
      .nodeRelSize(8)
      .nodeVal((node: any) => node.type === NodeType.Workspace ? 15 : 4)
      // Auto-color workspaces by domain
      .nodeAutoColorBy((node: any) => {
        if (node.type === NodeType.Workspace && node.metadata?.domainId) {
          return node.metadata.domainId;
        }
        return undefined;
      })
      .linkWidth((link: any) => link.type === LinkType.CrossWorkspace ? 2 : 0.5)
      .d3Force('domainCluster', this.createDomainClusterForce())
      .linkOpacity(0.5)
      // Add directional arrows for cross-workspace links
      .linkDirectionalArrowLength(5)
      .linkDirectionalArrowRelPos(1)
      .linkDirectionalArrowColor((link: any) => link.type === LinkType.CrossWorkspace ? '#107C10' : '#888')
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
      // Hover highlighting
      .onNodeHover((node: any) => {
        this.highlightNodes.clear();
        this.highlightLinks.clear();
        
        if (node) {
          this.highlightNodes.add(node);
          // Highlight connected nodes
          this.links.forEach(link => {
            if (link.source === node.id || link.target === node.id) {
              this.highlightLinks.add(link);
              const connectedNode = this.nodes.find(n => 
                n.id === (link.source === node.id ? link.target : link.source)
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
        // In focus mode, highlight workspace nodes to show they're clickable
        if (this.isolateMode && node.type === NodeType.Workspace) {
          if (this.isolatedDomain && node.metadata?.domainId === this.isolatedDomain) {
            return '#FFD700'; // Gold for isolated domain
          }
          return '#10B981'; // Green to show clickable
        }
        
        // Dim non-highlighted nodes
        if (this.highlightNodes.size > 0 && !this.highlightNodes.has(node)) {
          return 'rgba(100,100,100,0.3)';
        }
        return this.getNodeColor(node.type as NodeType);
      })
      .linkColor((link: any) => {
        // Dim non-highlighted links
        if (this.highlightLinks.size > 0 && !this.highlightLinks.has(link)) {
          return 'rgba(100,100,100,0.2)';
        }
        // Fabric green for cross-workspace, subtle gray for contains
        return link.type === LinkType.CrossWorkspace ? '#107C10' : 'rgba(150,150,150,0.3)';
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
      const shouldShow = !this.hiddenDomains.has(domainId) && 
                        (!this.isolatedDomain || domainId === this.isolatedDomain);
      objects.forEach(obj => obj.visible = shouldShow);
    });
    
    this.graphInstance
      .nodeVisibility((node: any) => {
        // Domain filter
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
}
