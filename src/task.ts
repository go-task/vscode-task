import * as vscode from 'vscode';
import * as commands from './commands';
import * as services from './services';
import * as models from './models';

export class TaskExtension {
    private _taskfile?: models.Taskfile;

    public async update(): Promise<void> {
        await services.taskfile.read().then((taskfile: models.Taskfile) => {
            this._taskfile = taskfile;
        });
    }

    public registerCommands(context: vscode.ExtensionContext): void {
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.runTask', () => {
            commands.runTask(this._taskfile);
        }));
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.refreshTasks', () => {
            this.update().catch((err: string) => {
                console.error(err);
            });
        }));
    }
}
