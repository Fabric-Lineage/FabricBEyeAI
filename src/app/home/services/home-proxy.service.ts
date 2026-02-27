import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';
import { ActivatedRoute } from '@angular/router';
declare let saveAs: any;

@Injectable({ providedIn: 'root' })
export class HomeProxy {
  private token: string;

  constructor (private httpService: HttpClient,
    private authService: AuthService,
    private route: ActivatedRoute) {
    this.authService.getToken().subscribe((token: string) => {
      this.token = token.replace(/Bearer /g, '');
    });
  }

  public async getModifedWorkspaces (): Promise<Observable<any>> {
    const apiUrl: string = this.getEnvironment().apiUrl;

    const req = {
      method: 'GET',
      url: `https://${apiUrl}/v1.0/myorg/admin/workspaces/modified?excludePersonalWorkspaces=false`,
      headers: {
        'Content-Type': 'application/json',
        authorization: 'Bearer ' + this.token,
        'X-POWERBI-ADMIN-CLIENT-NAME': 'FabricBEye'
      }
    };

    return this.httpService.get(req.url, req);
  }

  public getWorkspacesInfo (workspaceArray: string[]): Observable<any> {
    const apiUrl: string = this.getEnvironment().apiUrl;
    const req = {
      method: 'POST',
      url: `https://${apiUrl}/v1.0/myorg/admin/workspaces/getInfo?lineage=true`,
      headers: {
        authorization: 'Bearer ' + this.token,
        'X-POWERBI-ADMIN-CLIENT-NAME': 'FabricBEye'
      }
    };

    return this.httpService.post(req.url, { workspaces: workspaceArray }, req);
  }

  public getWorkspacesScanStatus (scanId: string): Observable<any> {
    const apiUrl: string = this.getEnvironment().apiUrl;
    const req = {
      method: 'GET',
      url: `https://${apiUrl}/v1.0/myorg/admin/workspaces/scanStatus/${scanId}`,
      headers: {
        'Content-Type': 'application/json',
        authorization: 'Bearer ' + this.token
      }
    };

    return this.httpService.get(req.url, req);
  }

  public getWorkspacesScanResult (scanId: string): Observable<any> {
    const apiUrl: string = this.getEnvironment().apiUrl;
    const req = {
      method: 'GET',
      url: `https://${apiUrl}/v1.0/myorg/admin/workspaces/scanResult/${scanId}`,
      headers: {
        'Content-Type': 'application/json',
        authorization: 'Bearer ' + this.token
      }
    };

    return this.httpService.get(req.url, req);
  }

  /**
   * Batch assign workspaces to domains (Fabric Admin API)
   * More efficient than individual calls for bulk operations
   */
  public batchAssignWorkspacesToDomains (assignments: Array<{workspaceId: string, domainId: string}>): Observable<any> {
    const apiUrl: string = this.getEnvironment().apiUrl;

    // Note: If Fabric doesn't support batch, we'll need to use forkJoin for parallel calls
    // For now, implementing as sequential with Observable.concat for reliability
    const observables = assignments.map(assignment =>
      this.httpService.post(
        `https://${apiUrl}/v1.0/myorg/admin/workspaces/${assignment.workspaceId}/assignToDomain`,
        { domainId: assignment.domainId },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: 'Bearer ' + this.token,
            'X-POWERBI-ADMIN-CLIENT-NAME': 'FabricBEye'
          }
        }
      )
    );

    return forkJoin(observables.length > 0 ? observables : [of(null)]);
  }

  /**
   * Get all domains from Fabric Admin API
   * Based on: https://learn.microsoft.com/en-us/rest/api/fabric/admin/domains/list-domains
   */
  public getDomains (): Observable<any> {
    const apiUrl: string = this.getEnvironment().apiUrl;
    return this.httpService.get(
      `https://${apiUrl}/v1/admin/domains`,
      {
        headers: {
          'Content-Type': 'application/json',
          authorization: 'Bearer ' + this.token,
          'X-POWERBI-ADMIN-CLIENT-NAME': 'FabricBEye'
        }
      }
    );
  }

  /**
   * Get Fabric-native items (Notebooks, Pipelines, Lakehouses, etc.)
   * Based on: https://learn.microsoft.com/en-us/rest/api/fabric/admin/items/list-items
   */
  public getItems (workspaceId?: string): Observable<any> {
    const apiUrl: string = this.getEnvironment().apiUrl;
    const url = workspaceId
      ? `https://${apiUrl}/v1/admin/workspaces/${workspaceId}/items`
      : `https://${apiUrl}/v1/admin/items`;
    return this.httpService.get(url, {
      headers: {
        'Content-Type': 'application/json',
        authorization: 'Bearer ' + this.token,
        'X-POWERBI-ADMIN-CLIENT-NAME': 'FabricBEye'
      }
    });
  }

  public getEnvironment (): { apiUrl: string, url: string } {
    const env: string = this.route.snapshot.queryParams.env;
    const envLowerCase: string = env ? env.toLocaleLowerCase() : env;
    switch (envLowerCase) {
      case 'edog':
      case 'idog': {
        return {
          apiUrl: 'biazure-int-edog-redirect.analysis-df.windows.net',
          url: 'https://powerbi-idog.analysis.windows-int.net/'
        };
      }
      case 'dxt': {
        return {
          apiUrl: 'wabi-staging-us-east-redirect.analysis.windows.net',
          url: 'https://dxt.powerbi.com/'
        };
      }
      case 'msit': {
        return {
          apiUrl: 'df-msit-scus-redirect.analysis.windows.net',
          url: 'https://msit.powerbi.com'
        };
      }
      case 'prod': {
        return {
          apiUrl: 'api.powerbi.com',
          url: 'https://app.powerbi.com/'
        };
      }
      default:
        return {
          apiUrl: 'api.powerbi.com',
          url: 'https://app.powerbi.com/'
        };
    }
  }
}
