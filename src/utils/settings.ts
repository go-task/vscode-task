import * as vscode from 'vscode';
import { log } from './';

class Settings {
    private static _instance: Settings;
    public updateOn!: string;
    public path!: string;
    public checkForUpdates!: boolean;
    public treeNesting!: boolean;

    constructor() {
        this.update();
    }

    public static get instance() {
        return this._instance ?? (this._instance = new this());
    }

    // Fetches all the settings from the workspace configuration file
    public update() {
        log.info("Updating settings");

        // Get the workspace config
        let config = vscode.workspace.getConfiguration("task");

        // Set the properties
        this.updateOn = config.get("updateOn") ?? "change";
        this.path = config.get("path") ?? "task";
        this.checkForUpdates = config.get("checkForUpdates") ?? true;
        this.treeNesting = config.get("tree.nesting") ?? true;
    }
}

export const settings = Settings.instance;
