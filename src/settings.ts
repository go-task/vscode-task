import * as vscode from 'vscode';


export class Settings {

    constructor() {
        this.update();
    }

    // Variables
    public updateOn!: string;

    // Fetches all the settings from the workspace configuration file
    public update() {
        // Get the workspace config
        let config = vscode.workspace.getConfiguration("task");

        // Get the configs
        let updateOn: string | undefined = config.get("updateOn");

        // Set the configs
        this.updateOn = updateOn !== undefined ? updateOn : "change";
    }
}
