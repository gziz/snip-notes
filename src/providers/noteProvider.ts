import * as vscode from 'vscode';
import file from '../managers/fileManager';
import notes from '../managers/noteManager';
import { Note } from '../types';
import InfoMessages from '../utils/infoMessages';

export default class NotesProvider {

    static viewType: string = 'snipNotes.webView';
    private _extensionUri: vscode.Uri;
    private _view?: vscode.WebviewView;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }
    
    resolveWebviewView(webviewView: vscode.WebviewView): void {
        this.initializeWebview(webviewView);
        this.listenForWebviewMessages(webviewView);
    }

    initializeWebview(webviewView: vscode.WebviewView): void {
        this._view = webviewView;
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};
		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    listenForWebviewMessages(webviewView: vscode.WebviewView): void {
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.type) {
                case "noteClicked": 
                    this.handleNoteClicked(message.note);
                    break;
                case "refreshNotes":
                    this.refreshNotes();
                    break;
                case "noteUpdated":
                    notes.updateNote(message.updatedNote);
                    break;
                case "rightClickedNote":
                    notes.setRightClickNote(message.noteId);
                    break;
            }
        });
    }

    handleNoteClicked(note: Note): void {
        if (note != null) {
            let editor = vscode.window.activeTextEditor;
            if (editor) {
                const noteFirstLine = note.codeText.split("\n")[0]

                const positionStart = new vscode.Position(note.startLine, 0)
                const positionEnd = new vscode.Position(note.startLine, noteFirstLine.length)
                const codeRange = new vscode.Range(positionStart, positionEnd);
                const editorFirstLine = editor.document.getText(codeRange);
                if (noteFirstLine !== editorFirstLine) {
                    InfoMessages.noteHasMoved();
                } else {
                const selection = new vscode.Selection(positionEnd, positionEnd);
                vscode.window.showTextDocument(editor.document, { viewColumn: editor.viewColumn, selection: selection })
                }
            }
        }
    }

    async focusWebview(): Promise<void> {
        vscode.commands.executeCommand('snipNotes.webView.focus');
    }

	_getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
        const scriptPrismUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'prism.js'));
        const stylePrismUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'prism.css'));

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Snip Notes</title>
            <link href="${styleMainUri}" rel="stylesheet">
            <link href="${stylePrismUri}" rel="stylesheet">
        </head>
        <body>
            <input class="note-search-bar" type="text" placeholder="Search notes..." />
            <div class="notes-div"></div>
            <script src="${scriptUri}"></script>
            <script src="${scriptPrismUri}"></script>
        </body>
        </html>`;
	}

    async refreshNotes(newNoteId?: number): Promise<void> {
        if (this._view) {
            await file.loadCurrFileNotes();
            const currFileNotes = file.getCurrFileNotes();
            this._view.webview.postMessage({ type: 'refreshNotes', notes: currFileNotes, newNoteId: newNoteId });
        }
    }

    async focusOnNote(noteId: number): Promise<void> {
        if (this._view) {
            this._view.webview.postMessage({ type: 'focusOnNote', noteId: noteId });
        }
    }
}
