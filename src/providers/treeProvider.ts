import * as vscode from 'vscode';
import * as path from 'path';
import dbService from '../db/databaseService';
import workspace from '../managers/workspaceManager';
import fileManager from '../managers/fileManager';
import icons from '../utils/icons';

class NoteTreeItem extends vscode.TreeItem {
    children: NoteTreeItem[] = [];
    id?: string;

    constructor(
        label: string,
        uri: vscode.Uri | null,
        collapsibleState: vscode.TreeItemCollapsibleState,
        id?: string,
        contextValue?: string,
        command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.id = id;
        this.contextValue = contextValue;
        this.command = command ? command : undefined;
        this.resourceUri = uri ? uri : undefined;
    }
}

export  default class NoteTreeProvider implements vscode.TreeDataProvider<NoteTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<NoteTreeItem | undefined> = new vscode.EventEmitter<NoteTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<NoteTreeItem | undefined> = this._onDidChangeTreeData.event;
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: NoteTreeItem): vscode.TreeItem {
        if (element.contextValue === "file") {
            element.iconPath = vscode.ThemeIcon.File;
        }
        return element;
    }

    async getChildren(element?: NoteTreeItem): Promise<NoteTreeItem[]|null> {
        if (element) {
            return element.children;
        } else {
            return this.buildRoot();
        }
    }

    async buildRoot(): Promise<NoteTreeItem[]|null> {
        const workspaceId = workspace.getWorkspaceId();
        if (!workspaceId) {
            return null;
        }
        const files = await dbService.getFilesFromWorkspaceId(workspaceId);
        const root = await this.buildHierarchy(files);
        return this.compressPath(root);
    }

    async getFileChildren(fileObj: any): Promise<NoteTreeItem[]> { // You should replace 'any' with the correct type once defined.
        const notes = await dbService.getNotesFromFileId(fileObj.id);
        const notesChildren: NoteTreeItem[] = [];
        for (const note of notes) {
            const noteLabel = `${icons.getEmoji(note.category)} ${note.title.substring(0, 50)}${note.title.length > 50 ? "..." : ""}`;
            const noteItem = new NoteTreeItem(
                noteLabel,
                null,
                vscode.TreeItemCollapsibleState.None,
                `note-${note.id}`,
                "note",
                this.focusOnNoteCommand(fileObj, note)
            );
            notesChildren.push(noteItem);
        }
        return notesChildren;
    }

    async buildHierarchy(files: any[]): Promise<NoteTreeItem[]> { // Replace 'any' with the correct type once defined.
        const root: NoteTreeItem[] = [];
        for (const file of files) {
            const notesChildren = await this.getFileChildren(file);
            if (notesChildren.length === 0) continue;

            const parts = file.relative_path.split('/');
            let currentChildren = root;

            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                let directoryItem = currentChildren.find(item => item.label === part);

                if (!directoryItem) {
                    directoryItem = new NoteTreeItem(part, null, vscode.TreeItemCollapsibleState.Collapsed, undefined, 'directory');
                    currentChildren.push(directoryItem);
                }

                currentChildren = directoryItem.children;
            }

            const fileName = parts[parts.length - 1];
            const fileUri = vscode.Uri.file(path.join(this.workspaceRoot, file.relative_path));
            const fileItem = new NoteTreeItem(fileName, fileUri, vscode.TreeItemCollapsibleState.Expanded, `file-${file.id}`, 'file', this.openFileCommand(file))
            fileItem.children = notesChildren;
            currentChildren.push(fileItem);
        }
        return root;
    }

    compressPath(root: NoteTreeItem[]): NoteTreeItem[] {
        for (let i = 0; i < root.length; i++) {
            const node = root[i];
            while (node.contextValue === 'directory' && node.children.length === 1 && node.children[0].contextValue === 'directory') {
                const childNode = node.children[0];
                node.label += '/' + childNode.label;
                node.children = childNode.children;
            }

            if (node.children && node.children.length > 0) {
                this.compressPath(node.children);
            }
        }
        return root;
    }

    openFileCommand(fileObj: any): vscode.Command { // Replace 'any' with the correct type once defined.
        return {
            command: 'snip-notes.openFile',
            title: '',
            arguments: [fileObj.relative_path]
        };
    }

    focusOnNoteCommand(fileObj: any, noteObj: any): vscode.Command { // Replace 'any' with the correct type once defined.
        return {
            command: 'snip-notes.focusOnNote',
            title: '',
            arguments: [fileObj.relative_path, noteObj.id]
        };
    }
}
