import * as vscode from 'vscode';
import { QuickPickTaskItem, QuickPickTaskSeparator } from './elements/quickPickItem.js';
import { TaskTreeItem } from './elements/treeItem.js';
import { ActivityBar } from './elements/activityBar.js';
import { Namespace, Task } from './models/models.js';
import { taskfileSvc } from './services/taskfile.js';
import { log } from './utils/log.js';
import { configKey, oldConfigKey, settings, UpdateOn } from './utils/settings.js';

export class TaskExtension {
    private _taskfiles: Namespace[] = [];
    private _activityBar: ActivityBar;
    private _watcher: vscode.FileSystemWatcher;
    private _changeTimeout: NodeJS.Timeout | null = null;
    private _nesting: boolean;
    private _status: boolean;

    constructor() {
        this._activityBar = new ActivityBar();
        this._watcher = vscode.workspace.createFileSystemWatcher("**/*.{yml,yaml}");
        this._nesting = settings.tree.nesting;
        this._status = settings.tree.status;
        vscode.commands.executeCommand('setContext', 'vscode-task:treeNesting', this._nesting);
    }

    public async update(checkForUpdates?: boolean): Promise<void> {
        // Do version checks
        await taskfileSvc.checkInstallation(checkForUpdates).then(
            (status): Promise<PromiseSettledResult<Namespace | undefined>[]> => {

                // Set the status
                vscode.commands.executeCommand('setContext', 'vscode-task:status', status);

                // If the status is not "ready", reject the promise
                if (status !== "ready") {
                    return Promise.reject();
                }

                // Read taskfiles
                let p: Promise<Namespace | undefined>[] = [];
                vscode.workspace.workspaceFolders?.forEach((folder) => {
                    p.push(taskfileSvc.read(folder.uri.fsPath, this._nesting, this._status));
                });

                return Promise.allSettled(p);

                // If there are no valid taskfiles, set the status to "noTaskfile"
            }).then(results => {
                this._taskfiles = results
                    .filter(result => result.status === "fulfilled")
                    .map(result => <PromiseFulfilledResult<any>>result)
                    .map(result => result.value)
                    .filter(value => value !== undefined);
                let rejected = results
                    .filter(result => result.status === "rejected")
                    .map(result => <PromiseRejectedResult>result)
                    .map(result => result.reason);
                if (rejected.length > 0) {
                    vscode.commands.executeCommand('setContext', 'vscode-task:status', "error");
                } else if (this._taskfiles.length === 0) {
                    vscode.commands.executeCommand('setContext', 'vscode-task:status', "noTaskfile");
                }
            });
    }

    public async refresh(checkForUpdates?: boolean): Promise<void> {
        await this.update(checkForUpdates).then(() => {
            this._activityBar.refresh(this._taskfiles, this._nesting);
        }).catch((err: string) => {
            log.error(err);
        });
    }

    public setTreeNesting(enabled: boolean): void {
        this._nesting = enabled;
        this.refresh();
        vscode.commands.executeCommand('setContext', 'vscode-task:treeNesting', enabled);
    }

    public registerCommands(context: vscode.ExtensionContext): void {
        const RUNTASKWITHARGS_PROMPT = "Enter Command Line Arguments:";
        const RUNTASKWITHARGS_PLACEHOLDER = "<arg1> <arg2> ...";

        // Initialise Taskfile
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.init', () => {
            log.info("Command: vscode-task.init");
            if (vscode.workspace.workspaceFolders?.length === 1) {
                taskfileSvc.init(vscode.workspace.workspaceFolders[0].uri.fsPath);
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
                    taskfileSvc.init(item.description || "");
                }
            });
        }));

        // Refresh tasks
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.refresh', () => {
            log.info("Command: vscode-task.refresh");
            this.refresh(false);
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
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.runTask', (treeItem?: TaskTreeItem) => {
            log.info("Command: vscode-task.runTask");
            if (treeItem?.task) {
                taskfileSvc.runTask(treeItem.task.name, treeItem.workspace);
            }
        }));

        // Run task with args
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.runTaskWithArgs', (treeItem?: TaskTreeItem) => {
            log.info("vscode-task.runTaskWithArgs");
            if (treeItem?.task) {
                vscode.window.showInputBox({
                    prompt: RUNTASKWITHARGS_PROMPT,
                    placeHolder: RUNTASKWITHARGS_PLACEHOLDER
                }).then((cliArgsInput) => {
                    if (cliArgsInput === undefined) {
                        vscode.window.showInformationMessage('No Args Supplied');
                        return;
                    }
                    taskfileSvc.runTask(treeItem.task.name, treeItem.workspace, cliArgsInput);
                });
            }
        }));

        // Run task picker
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.runTaskPicker', () => {
            log.info("Command: vscode-task.runTaskPicker");
            let items: vscode.QuickPickItem[] = this._loadTasksFromTaskfile();

            if (items.length === 0) {
                vscode.window.showInformationMessage('No tasks found');
                return;
            }

            vscode.window.showQuickPick(items).then((item) => {
                if (item && item instanceof QuickPickTaskItem) {
                    taskfileSvc.runTask(item.label, item.namespace.workspace);
                }
            });
        }));

        // Run task picker with args
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.runTaskPickerWithArgs', () => {
            log.info("Command: vscode-task.runTaskPickerWithArgs");
            let items: vscode.QuickPickItem[] = this._loadTasksFromTaskfile();

            if (items.length === 0) {
                vscode.window.showInformationMessage('No tasks found');
                return;
            }

            vscode.window.showQuickPick(items).then((item) => {
                vscode.window.showInputBox({
                    prompt: RUNTASKWITHARGS_PROMPT,
                    placeHolder: RUNTASKWITHARGS_PLACEHOLDER
                }).then((cliArgsInput) => {
                    if (cliArgsInput === undefined) {
                        vscode.window.showInformationMessage('No Args Supplied');
                        return;
                    }
                    if (item && item instanceof QuickPickTaskItem) {
                        taskfileSvc.runTask(item.label, item.namespace.workspace, cliArgsInput);
                    }
                });
            });
        }));

        // Run last task
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.runLastTask', () => {
            log.info("Command: vscode-task.runLastTask");
            taskfileSvc.runLastTask();
        }));

        // Go to definition
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.goToDefinition', (task: TaskTreeItem | Task, preview: boolean = false) => {
            log.info("Command: vscode-task.goToDefinition");
            if (task instanceof TaskTreeItem) {
                if (task.task === undefined) {
                    return;
                }
                task = task.task;
            }
            taskfileSvc.goToDefinition(task, preview);
        }));

        // Go to definition picker
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.goToDefinitionPicker', () => {
            log.info("Command: vscode-task.goToDefinitionPicker");
            let items: vscode.QuickPickItem[] = [];
            this._taskfiles.forEach(taskfile => {
                if (taskfile.tasks.length > 0) {
                    items = items.concat(new QuickPickTaskSeparator(taskfile));
                    taskfile.tasks.forEach(task => {
                        items = items.concat(new QuickPickTaskItem(taskfile, task));
                    });
                }
            });
            if (items.length === 0) {
                vscode.window.showInformationMessage('No tasks found');
                return;
            }
            vscode.window.showQuickPick(items).then((item) => {
                if (item && item instanceof QuickPickTaskItem) {
                    taskfileSvc.goToDefinition(item.task);
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

        // Show debug window
        context.subscriptions.push(vscode.commands.registerCommand('vscode-task.showDebugPanel', () => {
            log.channel.show();
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

    private _loadTasksFromTaskfile() {
        let items: vscode.QuickPickItem[] = [];
        this._taskfiles.forEach(taskfile => {
            if (taskfile.tasks.length > 0) {
                items = items.concat(new QuickPickTaskSeparator(taskfile));
                taskfile.tasks.forEach(task => {
                    items = items.concat(new QuickPickTaskItem(taskfile, task));
                });
            }
        });
        return items;
    }

    private async _onDidTaskfileChange() {
        log.info("Detected changes to taskfile");

        // If there's already a timeout scheduled, cancel it to debounce the changes
        if (this._changeTimeout) {
            clearTimeout(this._changeTimeout);
        }

        // Schedule a new timeout to refresh the task files after 500ms
        this._changeTimeout = setTimeout(async () => {
            // If manual updating is turned off (update on save)
            if (settings.updateOn !== UpdateOn.manual) {
                await this.refresh(false);
            }
        }, 200);
    }

    private _onDidChangeConfiguration(event: vscode.ConfigurationChangeEvent) {
        log.info("Detected changes to configuration");
        if (event.affectsConfiguration(configKey) || event.affectsConfiguration(oldConfigKey)) {
            settings.update();
            this._nesting = settings.tree.nesting;
            this._status = settings.tree.status;
            this.refresh(false);
            vscode.commands.executeCommand('setContext', 'vscode-task:treeNesting', this._nesting);
        }
    }
}
