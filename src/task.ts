import * as vscode from 'vscode';
import * as elements from './elements';
import * as services from './services';
import * as models from './models';
import { Settings } from './settings';

export class TaskExtension {
    private _taskfiles: models.Taskfile[] = [];
    private _settings: Settings;
    private _activityBar: elements.ActivityBar;
    private _watcher: vscode.FileSystemWatcher;

    constructor() {
        this._settings = new Settings();
        this._activityBar = new elements.ActivityBar();
        this._watcher = vscode.workspace.createFileSystemWatcher("**/*.{yml,yaml}");
    }

    public async update(): Promise<void> {
        let p: Promise<models.Taskfile>[] = [];
        vscode.workspace.workspaceFolders?.forEach((folder) => {
            p.push(services.taskfile.read(folder.uri.fsPath));
        });
        await Promise.all(p).then((taskfiles: models.Taskfile[]) => {
            this._taskfiles = taskfiles;
        });
    }

    public refresh(): void {
        this._activityBar.refresh(this._taskfiles);
    }

    public async updateAndRefresh(): Promise<void> {
        await this.update().then(() => {
            this.refresh();
        }).catch((err: string) => {
            console.error(err);
        });
    }

    public registerCommands(context: vscode.ExtensionContext): void {

        // Initialise Taskfile
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.init', () => {
            if (vscode.workspace.workspaceFolders?.length === 1) {
                services.taskfile.init(vscode.workspace.workspaceFolders[0].uri.fsPath);
                return;
            }
            let items: vscode.QuickPickItem[] = [];
            vscode.workspace.workspaceFolders?.forEach((folder) => {
                items = items.concat({
                    label: folder.name,
                    description: folder.uri.fsPath
                });
            });
            vscode.window.showQuickPick(items).then((item) => {
                if (item) {
                    services.taskfile.init(item.description || "");
                }
            });
        }));

        // Refresh tasks
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.refresh', () => {
            this.updateAndRefresh();
        }));

        // Run task
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.runTask', (treeItem?: elements.TaskTreeItem) => {
            if (treeItem?.task) {
                services.taskfile.runTask(treeItem.task.name, treeItem.workspace);
            }
        }));

        // Run task picker
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.runTaskPicker', () => {
            let items: vscode.QuickPickItem[] = [];
            this._taskfiles.forEach(taskfile => {
                if (taskfile.tasks.length > 0) {
                    items = items.concat(new elements.QuickPickTaskSeparator(taskfile));
                    taskfile.tasks.forEach(task => {
                        items = items.concat(new elements.QuickPickTaskItem(taskfile, task));
                    });
                }
            });
            if (items.length === 0) {
                vscode.window.showInformationMessage('No tasks found');
                return;
            }
            vscode.window.showQuickPick(items).then((item) => {
                if (item && item instanceof elements.QuickPickTaskItem) {
                    services.taskfile.runTask(item.label, item.taskfile.workspace);
                }
            });
        }));

        // Run last task
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.runLastTask', () => {
            services.taskfile.runLastTask();
        }));

        // Go to definition
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.goToDefinition', (task: elements.TaskTreeItem | models.Task, preview: boolean = false) => {
            if (task instanceof elements.TaskTreeItem) {
                if (task.task === undefined) {
                    return;
                }
                task = task.task;
            }
            services.taskfile.goToDefinition(task, preview);
        }));

        // Go to definition picker
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.goToDefinitionPicker', () => {
            let items: vscode.QuickPickItem[] = [];
            this._taskfiles.forEach(taskfile => {
                if (taskfile.tasks.length > 0) {
                    items = items.concat(new elements.QuickPickTaskSeparator(taskfile));
                    taskfile.tasks.forEach(task => {
                        items = items.concat(new elements.QuickPickTaskItem(taskfile, task));
                    });
                }
            });
            if (items.length === 0) {
                vscode.window.showInformationMessage('No tasks found');
                return;
            }
            vscode.window.showQuickPick(items).then((item) => {
                if (item && item instanceof elements.QuickPickTaskItem) {
                    services.taskfile.goToDefinition(item.task);
                }
            });
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
