import * as vscode from 'vscode';
import { Location, Task } from './models.js';
import { settings } from '../utils/settings.js';
import { useDedicatedTerminal, buildTaskCommand } from '../utils/taskPresentation.js';

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
        const taskLabel = cliArgs.length > 0 ? `${this.name} ${cliArgs.join(' ')}` : this.name;
        const definition: vscode.TaskDefinition = {
            type: this.type,
            task: this.task,
            workspace: this.workspace,
            file: this.location.taskfile
        };
        if (cliArgs.length > 0) {
            definition.args = cliArgs;
        }
        const task = new vscode.Task(
            definition,
            workspaceFolder,
            taskLabel,
            this.type,
            new vscode.ShellExecution(
                buildTaskCommand(settings.path, this.task, cliArgs),
                {cwd: this.workspace}
            )
        );
        task.detail = this.description;
        return useDedicatedTerminal(task);
    }
}
