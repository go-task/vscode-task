import * as vscode from 'vscode';
import * as elements from './elements';
import * as services from './services';
import * as models from './models';
import { log, settings } from './utils';

export class TaskExtension {
    private _taskfiles: models.Taskfile[] = [];
    private _activityBar: elements.ActivityBar;
    private _watcher: vscode.FileSystemWatcher;

    constructor() {
        this._activityBar = new elements.ActivityBar();
        this._watcher = vscode.workspace.createFileSystemWatcher("**/*.{yml,yaml}");
        this.setTreeNesting(settings.treeNesting);
    }

    public async update(): Promise<void> {
        // Do version checks
        await services.taskfile.checkInstallation().then((status): Promise<PromiseSettledResult<models.Taskfile>[]> => {

            // Set the status
            vscode.commands.executeCommand('setContext', 'vscode-task:status', status);

            // If the status is not "ready", reject the promise
            if (status !== "ready") {
                return Promise.reject();
            }

            // Read taskfiles
            let p: Promise<models.Taskfile>[] = [];
            vscode.workspace.workspaceFolders?.forEach((folder) => {
                p.push(services.taskfile.read(folder.uri.fsPath));
            });
            return Promise.allSettled(p);

        // If there are no valid taskfiles, set the status to "noTaskfile"
        }).then(results => {
            this._taskfiles = results.filter(result => result.status === "fulfilled").map(result => <PromiseFulfilledResult<any>>result).map(result => result.value);
            if (this._taskfiles.length === 0) {
                vscode.commands.executeCommand('setContext', 'vscode-task:status', "noTaskfile");
            }
        });
    }

    public refresh(): void {
        this._activityBar.refresh(this._taskfiles);
    }

    public async updateAndRefresh(): Promise<void> {
        await this.update().then(() => {
            this.refresh();
        }).catch((err: string) => {
            log.error(err);
        });
    }

    public setTreeNesting(enabled: boolean): void {
        this._activityBar.setTreeNesting(enabled);
        vscode.commands.executeCommand('setContext', 'vscode-task:treeNesting', enabled);
    }

    public registerCommands(context: vscode.ExtensionContext): void {

        // Initialise Taskfile
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.init', () => {
            log.info("Command: vscode-task.init");
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
            log.info("Command: vscode-task.refresh");
            this.updateAndRefresh();
        }));

        // View tasks as list
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.viewAsList', () => {
            log.info("Command: vscode-task.viewAsList");
            this.setTreeNesting(false);
        }));

        // View tasks as tree
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.viewAsTree', () => {
            log.info("Command: vscode-task.viewAsTree");
            this.setTreeNesting(true);
        }));

        // Run task
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.runTask', (treeItem?: elements.TaskTreeItem) => {
            log.info("Command: vscode-task.runTask");
            if (treeItem?.task) {
                services.taskfile.runTask(treeItem.task.name, treeItem.workspace);
            }
        }));

        // Run task picker
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.runTaskPicker', () => {
            log.info("Command: vscode-task.runTaskPicker");
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
            log.info("Command: vscode-task.runLastTask");
            services.taskfile.runLastTask();
        }));

        // Go to definition
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.goToDefinition', (task: elements.TaskTreeItem | models.Task, preview: boolean = false) => {
            log.info("Command: vscode-task.goToDefinition");
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
            log.info("Command: vscode-task.goToDefinitionPicker");
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

        // Open installation
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.openInstallation', () => {
            log.info("Command: vscode-task.openInstallation");
            vscode.env.openExternal(vscode.Uri.parse('https://taskfile.dev/installation'));
        }));

        // Open usage
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.openUsage', () => {
            log.info("Command: vscode-task.openUsage");
            vscode.env.openExternal(vscode.Uri.parse('https://taskfile.dev/usage'));
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
        log.info("Detected changes to taskfile");
        // If manual updating is turned off (update on save)
        if (settings.updateOn !== "manual") {
            await this.updateAndRefresh();
        }
    }

    private _onDidChangeConfiguration(event: vscode.ConfigurationChangeEvent) {
        log.info("Detected changes to configuration");
        if (event.affectsConfiguration("task")) {
            settings.update();
        }
    }
}
