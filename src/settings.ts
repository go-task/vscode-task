import * as vscode from 'vscode';

export class Settings {
    public updateOn!: string;
    public treeNesting!: boolean;

    constructor() {
        this.update();
    }

    // Fetches all the settings from the workspace configuration file
    public update() {
        // Get the workspace config
        let config = vscode.workspace.getConfiguration("task");

        // Set the properties
        this.updateOn = config.get("updateOn") ?? "change";
        this.treeNesting = config.get("tree.nesting") ?? true;
    }
}
