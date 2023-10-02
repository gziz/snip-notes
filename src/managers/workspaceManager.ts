import * as vscode from 'vscode';
import infoMessages from '../utils/infoMessages';
import dbService from '../db/databaseService';
import { Workspace } from '../types';

class WorkspaceManager {
  private workspace: Partial<Workspace> = {};

  getWorkspacePath(): string | undefined {
    return this.workspace.path;
  }

  getWorkspaceName(): string | undefined {
    return this.workspace.name;
  }

  getWorkspaceId(): number | undefined {
    return this.workspace.id;
  }

  updateWorkspace(workspace: Partial<Workspace>): void {
    this.workspace = {
      ...this.workspace,
      ...workspace
    };
  }

  async loadWorkspace(): Promise<void> {
    if (!this.isInWorkspace()) return;

    const workspacePath = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const workspaceName = vscode.workspace.name!;
    let workspaceId = dbService.getWorkspaceIdByName(workspaceName);
    let workspacePathFromDb = dbService.getWorkspacePathByName(workspaceName);
    if (workspacePathFromDb && workspacePathFromDb !== workspacePath) {
      vscode.window.showInformationMessage(infoMessages.diffWorkspacePath(workspaceName));
    }
    
    if (!workspaceId) {
      dbService.insertWorkspace(workspaceName, workspacePath);
      workspaceId = dbService.getWorkspaceIdByName(workspaceName);
    }
    this.updateWorkspace({
      id: workspaceId,
      name: workspaceName,
      path: workspacePath
    });
  }

  isWorkspaceRegistered(): boolean {
    if (!this.isInWorkspace()) return false;

    const workspaceName = vscode.workspace.name!;
    const workspaceId = dbService.getWorkspaceIdByName(workspaceName);
    
    return workspaceId != null;
  }

  isInWorkspace(warning: boolean = false): boolean {
    if (vscode.workspace.workspaceFolders !== undefined) return true;
    
    if (warning) {
      vscode.window.showInformationMessage('Snip Notes: You must be in a workspace for Snip Notes to be active!');
    }
    return false;
  }
}

export default new WorkspaceManager();
