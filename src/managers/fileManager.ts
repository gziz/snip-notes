import * as path from 'path';
import * as vscode from 'vscode';
import workspace from './workspaceManager';
import dbService from '../db/databaseService';
import * as fs from 'fs';
import { File, Note } from '../types';


class FileManager {
  private file: Partial<File> = {};
  private currFileNotes: Note[] | null = null;

  public updateFileRelativePath(relativePath: string): void {
    this.file.relativePath = relativePath;
  }

  public getFileRelativePath(): string {
    return this.file.relativePath || '';
  }

  public updateFileID(id: number): void {
    this.file.id = id;
  }

  public getFileId(): number | undefined {
    return this.file.id;
  }

  public updateCurrFileNotes(newFileNotes: Note[]): void {
    this.currFileNotes = newFileNotes;
  }

  public async loadCurrFileNotes(): Promise<void> {
    if (!this.getFileId()) return;
    const fileId = this.getFileId() as number;  // We've checked it's non-null.
    const newFileNotes = await dbService.getNotesFromFileId(fileId);
    this.updateCurrFileNotes(newFileNotes);
  }

  public getCurrFileNotes(): Note[] {
    return this.currFileNotes ? this.currFileNotes : [];
  }

  public isFileInDb(relativeFilePath: string): boolean {
    const workspacePath = workspace.getWorkspacePath();
    if (!workspacePath) return false;

    const absolutePath = path.join(workspacePath, relativeFilePath);
    return fs.existsSync(absolutePath);
  }

  public async loadCurrFile(insertIfNotExists = false): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const workspaceId = workspace.getWorkspaceId();
      if (!workspaceId) return;
      const relativeFilePath = vscode.workspace.asRelativePath(editor.document.uri);
      const fileId = dbService.getFileIdByPath(relativeFilePath, workspaceId, insertIfNotExists);
      this.updateFileID(fileId);
      this.updateFileRelativePath(relativeFilePath);

      if (fileId) {
        const newFileNotes = await dbService.getNotesFromFileId(fileId);
        this.updateCurrFileNotes(newFileNotes);
      } else {
        this.updateCurrFileNotes([]);
      }
    }
  }
}

export default new FileManager();
