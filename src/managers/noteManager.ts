import * as vscode from "vscode";
import workspace from "./workspaceManager";
import file from "./fileManager";
import { Note } from "../types"; // Assuming the Note interface is inside the 'types' module
import databaseService from "../db/databaseService";

class NoteManager {
  private rightClickedNoteId: number | null = null;

  async createNote(): Promise<number | void> {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const fileId = file.getFileId();
      if (!fileId) return;
      const languageId = this.formatLanguageId(editor.document.languageId);

      const selection = editor.selection;
      const noteText = await vscode.window.showInputBox({
        prompt: "Enter your note:",
      });

      if (noteText) {
        const startLine = selection.start.line;
        const endLine = selection.end.line;
        const codeRange = new vscode.Range(
          startLine,
          0,
          endLine,
          editor.document.lineAt(endLine).text.length
        );
        const codeText = editor.document.getText(codeRange);
        const title =
          noteText.substring(0, 40) + (noteText.length > 40 ? "..." : "");

        const note: Note = {
          id: 0,
          title,
          noteText,
          codeText,
          startLine,
          endLine,
          languageId,
          category: "",
          fileId,
          createdDate: new Date().toISOString(),
        };

        const noteId = await databaseService.insertNote(note);
        vscode.window.showInformationMessage(
          "Snip Notes: Note successfully created!"
        );
        return noteId;
      }
    }
  }

  async updateNote(updatedNote: Note): Promise<void> {
    if (updatedNote.noteText) {
      await databaseService.updateNote(updatedNote);
      vscode.window.showInformationMessage(
        "Snip Notes: Note successfully updated!"
      );
      vscode.commands.executeCommand("snip-notes.refreshNotes");
    }
  }

  async prepareToCreateNote(): Promise<void> {
    if (!workspace.isInWorkspace(true)) return;
    if (!workspace.isWorkspaceRegistered()) {
      await workspace.loadWorkspace();
    }
    await file.loadCurrFile(true);
  }

  hoverProvider = {
    provideHover(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
      const line = position.line;
      const fileId = file.getFileId();
      if (!fileId) return; // TODO
      const noteText = databaseService.getNoteTextFromLine(line, fileId);
      if (noteText) {
        return new vscode.Hover(noteText);
      }
    },
  };

  setRightClickNote(noteId: number): void {
    this.rightClickedNoteId = noteId;
  }

  deleteNote(): void {
    if (!this.rightClickedNoteId) return;
    databaseService.deleteNote(this.rightClickedNoteId);
    vscode.commands.executeCommand("snip-notes.refreshNotes");
  }

  updateCategory(category: string): void {
    if (!this.rightClickedNoteId) return;
    databaseService.updateNoteCategory(this.rightClickedNoteId, category);
    vscode.commands.executeCommand("snip-notes.refreshNotes");
  }

  formatLanguageId(vscodeLanguageId: string): string {
    const mapping: Record<string, string> = {
      typescriptreact: "tsx",
      javascriptreact: "jsx",
    };
    return mapping[vscodeLanguageId] || vscodeLanguageId;
  }
}

export default new NoteManager();
