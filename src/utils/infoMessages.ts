import * as vscode from 'vscode';
class InfoMessages {
    static diffWorkspacePath(workspaceName: string) {
        vscode.window.showInformationMessage(`Snip Notes: Seems like you have worked on workspace: "${workspaceName}" but at a different path location. If it's a different project/workspace with the same name, beware of note conflicts!`);
    }
    static noteHasMoved() {
        vscode.window.showInformationMessage("Snip Notes: Seems like the code for this note has been moved!");
    }
}

export default InfoMessages;
