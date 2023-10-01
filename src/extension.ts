import * as vscode from 'vscode';
import databaseService from './db/databaseService';
import * as schemas from './db/schemas';
import workspace from './managers/workspaceManager';
import notes from './managers/noteManager';
import file from './managers/fileManager';
import NotesProvider from './providers/noteProvider';
import NoteTreeProvider from './providers/treeProvider';
import * as path from 'path';

export async function activate(context: vscode.ExtensionContext) {
    databaseService.setGlobalStoragePath(context.globalStorageUri);
    await databaseService.initializeSQLJs();
    await schemas.isDbExistent();

    const provider = new NotesProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(NotesProvider.viewType, provider)
    );

    const workspaceRoot = vscode.workspace.workspaceFolders 
        ? vscode.workspace.workspaceFolders[0].uri.fsPath 
        : undefined;
	if (!workspaceRoot) return;
    const treeDataProvider = new NoteTreeProvider(workspaceRoot);
    vscode.window.createTreeView('snipNotes.treeView', 
        { treeDataProvider: treeDataProvider, showCollapseAll: true }
    );

    context.subscriptions.push(vscode.commands.registerCommand('snip-notes.createNote', async () => {  
        await notes.prepareToCreateNote();
        const newNoteId = await notes.createNote();
		if (!newNoteId) return;
        await provider.focusWebview();
        await provider.refreshNotes();
        provider.focusOnNote(newNoteId);
        treeDataProvider.refresh();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('snip-notes.refreshNotes', async () => {  
        provider.refreshNotes();
        treeDataProvider.refresh();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('snip-notes.deleteNote', async () => {  
        notes.deleteNote();
        vscode.commands.executeCommand('snip-notes.refreshNotes');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('snip-notes.openFile', async (fileRelativePath: string) => {
        const workspacePath = workspace.getWorkspacePath();
        if (workspacePath) {
            const filePath = path.join(workspacePath, fileRelativePath);
            const fileUri = vscode.Uri.file(filePath);
            vscode.commands.executeCommand('vscode.open', fileUri);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('snip-notes.focusOnNote', async (fileRelativePath: string, noteId: number) => {  
        vscode.commands.executeCommand('snip-notes.openFile', fileRelativePath);
        provider.focusOnNote(noteId);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('snip-notes.updateNoteCategoryToNote', async (event: any) => {  
        notes.updateCategory('note');
        vscode.commands.executeCommand('snip-notes.refreshNotes');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('snip-notes.updateNoteCategoryToTodo', async (event: any) => {  
        notes.updateCategory('todo');
        vscode.commands.executeCommand('snip-notes.refreshNotes');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('snip-notes.updateNoteCategoryToFix', async (event: any) => {  
        notes.updateCategory('fix');
        vscode.commands.executeCommand('snip-notes.refreshNotes');
    }));

    vscode.window.onDidChangeActiveTextEditor(async () => {
        if (!workspace.isInWorkspace() || !workspace.getWorkspaceId()) return;
        await file.loadCurrFile();
        provider.refreshNotes();
    });

    if (!workspace.isInWorkspace()) return;

    if (!workspace.isWorkspaceRegistered()) return;

    await workspace.loadWorkspace();
    await file.loadCurrFile();

    context.subscriptions.push(
        vscode.languages.registerHoverProvider('*', notes.hoverProvider)
    );
}

export function deactivate(): void {}

