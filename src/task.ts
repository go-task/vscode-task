import * as vscode from 'vscode';
import * as commands from './commands';
import * as elements from './elements';
import * as services from './services';
import * as models from './models';

export class TaskExtension {
    private _taskfile?: models.Taskfile;
    private _activityBar: elements.ActivityBar;

    constructor() {
        this._activityBar = new elements.ActivityBar();
    }

    public async update(): Promise<void> {
        await services.taskfile.read().then((taskfile: models.Taskfile) => {
            this._taskfile = taskfile;
        });
    }

    public refresh(): void {
        this._activityBar.refresh(this._taskfile);
    }

    public registerCommands(context: vscode.ExtensionContext): void {
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.runTask', () => {
            commands.runTask(this._taskfile);
        }));
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.refreshTasks', () => {
            this.update().then(() => {
                this.refresh();
            }).catch((err: string) => {
                console.error(err);
            });
        }));
    }
}
