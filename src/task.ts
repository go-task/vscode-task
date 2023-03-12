import * as vscode from 'vscode';
import * as elements from './elements';
import * as services from './services';
import * as models from './models';
import { TaskTreeItem } from './providers/tasks';
import { Settings } from './settings';

export class TaskExtension {
    private _taskfile?: models.Taskfile;
    private _settings: Settings;
    private _activityBar: elements.ActivityBar;
    private _watcher: vscode.FileSystemWatcher;

    constructor() {
        this._settings = new Settings();
        this._activityBar = new elements.ActivityBar();
        this._watcher = vscode.workspace.createFileSystemWatcher("**/*.{yml,yaml}");
    }

    public async update(): Promise<void> {
        await services.taskfile.read().then((taskfile: models.Taskfile) => {
            this._taskfile = taskfile;
        });
    }

    public refresh(): void {
        this._activityBar.refresh(this._taskfile);
    }

    public async updateAndRefresh(): Promise<void> {
        await this.update().then(() => {
            this.refresh();
        }).catch((err: string) => {
            console.error(err);
        });
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
            this.updateAndRefresh();
        }));
    }

    public registerListeners(context: vscode.ExtensionContext): void {
        // When a file on the system is changed, created or deleted
        this._watcher.onDidChange(async _ => { await this._onDidTaskfileChange(); });
        this._watcher.onDidCreate(async _ => { await this._onDidTaskfileChange(); });
        this._watcher.onDidDelete(async _ => { await this._onDidTaskfileChange(); });

        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(event => { this._onDidChangeConfiguration(event); });
    }

    private async _onDidTaskfileChange() {
        // If manual updating is turned off (update on save)
        if (this._settings.updateOn !== "manual") {
            await this.updateAndRefresh();
        }
    }

    private _onDidChangeConfiguration(event: vscode.ConfigurationChangeEvent) {
        if (event.affectsConfiguration("task")) {
            this._settings.update();
        }
    }
}
