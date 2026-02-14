import * as vscode from 'vscode';
import { Location, Task } from './models.js';
import { settings } from '../utils/settings.js';

export class TaskDefinition implements vscode.TaskDefinition {
    private _task: Task;
    workspace: string;
    readonly type: string = 'taskfile';

    constructor(task: Task, workspace: string) {
        this._task = task;
        this.workspace = workspace;
    }

    // Required to satisfy vscode.TaskDefinition
    public get task(): string {
        return this._task.task;
    }

    public get name(): string {
        return this._task.name;
    }

    public get description(): string {
        return this._task.desc || '';
    }

    public get upToDate(): boolean | undefined {
        return this._task.up_to_date;
    }

    public get location(): Location {
        return this._task.location;
    }

    public toTask(cliArgs?: string[]): vscode.Task {
        cliArgs = cliArgs?.filter(x => x !== "") || [];
        const uri = vscode.Uri.file(this.workspace);
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri) || vscode.TaskScope.Workspace;
        const task = new vscode.Task(
            this,
            workspaceFolder,
            this.name,
            this.type,
            new vscode.ShellExecution(
                `${settings.path} ${this.task}${cliArgs && cliArgs.length > 0 ? " -- " + cliArgs.join(' ') : ''}`,
                {cwd: this.workspace}
            )
        );
        task.detail = this.description;
        return task;
    }
}
