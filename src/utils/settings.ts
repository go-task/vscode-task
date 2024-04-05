import * as vscode from 'vscode';
import { log } from './';

class Settings {
    private static _instance: Settings;
    public updateOn!: UpdateOn;
    public path!: string;
    public outputTo!: OutputTo;
    public checkForUpdates!: boolean;
    public tree!: TreeSettings;
    public terminal!: TerminalSettings;

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
        this.updateOn = config.get("updateOn") ?? UpdateOn.save;
        this.path = config.get("path") ?? "task";
        this.outputTo = config.get("outputTo") ?? OutputTo.output;
        this.checkForUpdates = config.get("checkForUpdates") ?? true;
        this.tree = new TreeSettings();
        this.terminal = new TerminalSettings();
    }
}

export enum OutputTo {
    output = "output",
    terminal = "terminal"
}

export enum UpdateOn {
    save = "save",
    manual = "manual"
}

class TreeSettings {
    private static _instance: TreeSettings;
    public nesting!: boolean;
    public sort!: TreeSort;

    constructor() {
        this.update();
    }

    public static get instance() {
        return this._instance ?? (this._instance = new this());
    }

    // Fetches all the settings from the workspace configuration file
    public update() {
        log.info("Updating tree settings");

        // Get the workspace config
        let config = vscode.workspace.getConfiguration("task");

        // Set the properties
        this.nesting = config.get("tree.nesting") ?? true;
        this.sort = config.get("tree.sort") ?? TreeSort.default;
    }
}

export enum TreeSort {
    default = "default",
    alphanumeric = "alphanumeric",
    none = "none"
}

class TerminalSettings {
    private static _instance: TerminalSettings;
    public per!: TerminalPer;
    public close!: TerminalClose;

    constructor() {
        this.update();
    }

    public static get instance() {
        return this._instance ?? (this._instance = new this());
    }

    // Fetches all the settings from the workspace configuration file
    public update() {
        log.info("Updating terminal settings");

        // Get the workspace config
        let config = vscode.workspace.getConfiguration("task");

        // Set the properties
        this.per = config.get("terminal.per") ?? TerminalPer.window;
        this.close = config.get("terminal.close") ?? TerminalClose.never;
    }
}

export enum TerminalPer {
    window = "window",
    task = "task"
}

export enum TerminalClose {
    never = "never",
    taskComplete = "taskComplete",
    onNextTask = "onNextTask"
}

export const settings = Settings.instance;
