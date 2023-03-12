import * as vscode from 'vscode';
import * as elements from './elements';
import * as services from './services';
import * as models from './models';
import { TaskTreeItem } from './providers/tasks';

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

        // Run task
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.runTask', (treeItem?: TaskTreeItem) => {
            if (treeItem?.task) {
                services.taskfile.runTask(treeItem.task.name);
            }
        }));

        // Run task picker
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.runTaskPicker', () => {
            if (!this._taskfile || this._taskfile.tasks.length === 0) {
                vscode.window.showInformationMessage('No tasks found');
                return;
            }
            vscode.window.showQuickPick(this._taskfile.tasks.map(t => t.name)).then((taskName) => {
                if (taskName) {
                    services.taskfile.runTask(taskName);
                }
            });
        }));

        // Refresh tasks
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.refresh', () => {
            this.update().then(() => {
                this.refresh();
            }).catch((err: string) => {
                console.error(err);
            });
        }));
    }
}
