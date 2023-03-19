import * as vscode from 'vscode';

class Settings {
    private static _instance: Settings;
    public updateOn!: string;
    public path!: string;
    public treeNesting!: boolean;

    constructor() {
        this.update();
    }

    public static get instance() {
        return this._instance ?? (this._instance = new this());
    }

    // Fetches all the settings from the workspace configuration file
    public update() {
        // Get the workspace config
        let config = vscode.workspace.getConfiguration("task");

        // Set the properties
        this.updateOn = config.get("updateOn") ?? "change";
        this.path = config.get("path") ?? "task";
        this.treeNesting = config.get("tree.nesting") ?? true;
    }
}

export const settings = Settings.instance;
