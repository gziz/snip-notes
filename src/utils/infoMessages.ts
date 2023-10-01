class InfoMessages {
    static diffWorkspacePath(workspaceName: string): string {
        return `Snip Notes: Seems like you have worked on workspace: "${workspaceName}" but at a different path location. If it's a different workspace with the same name, be careful with notes conflicts!`;
    }
}

export default InfoMessages;
