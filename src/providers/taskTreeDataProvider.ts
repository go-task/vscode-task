import * as vscode from 'vscode';
import * as models from '../models';
import * as elements from '../elements';
import * as path from 'path';

const namespaceSeparator = ':';

export class TaskTreeDataProvider implements vscode.TreeDataProvider<elements.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<elements.TaskTreeItem | undefined> = new vscode.EventEmitter<elements.TaskTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<elements.TaskTreeItem | undefined> = this._onDidChangeTreeData.event;
    private _taskfiles?: models.Taskfile[];

    constructor(
        private nestingEnabled: boolean = false
    ) { }

    setTreeNesting(enabled: boolean) {
        this.nestingEnabled = enabled;
    }

    getTreeItem(element: elements.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(parent?: elements.TreeItem): Thenable<elements.TreeItem[]> {
        var treeItems: elements.TreeItem[] = [];

        // If there are no workspace folders, return an empty array
        if (vscode.workspace.workspaceFolders === undefined || vscode.workspace.workspaceFolders.length === 0) {
            return Promise.resolve([]);
        }

        // If there is no parent and more than one workspace folder
        // Add workspaces
        if (!parent && vscode.workspace.workspaceFolders.length > 1) {
            let workspaces = this.getWorkspaces();
            return Promise.resolve(workspaces);
        }

        // If there are no taskfiles, return an empty array
        if (!this._taskfiles || this._taskfiles.length === 0) {
            return Promise.resolve([]);
        }

        // Check if the workspace folder is the same as the taskfile location.
        // If there is no location available (Task v3.22 or older), compare against the workspace instead.
        // This has the downside the tasks from Taskfiles outside of the workspace folder might be shown.
        if (vscode.workspace.workspaceFolders[0].uri.fsPath !== (this._taskfiles[0].location ? path.dirname(this._taskfiles[0].location) : this._taskfiles[0].workspace)) {
            return Promise.resolve([]);
        }

        var tasks: models.Task[] | undefined;
        var parentNamespace = "";
        var workspace = "";

        // If there is no parent and exactly one workspace folder or if the parent is a workspace
        if (!parent && vscode.workspace.workspaceFolders.length === 1) {
            tasks = this._taskfiles[0].tasks;
            workspace = this._taskfiles[0].workspace ?? "";
        }

        // If there is a parent and it is a workspace
        if (parent instanceof elements.WorkspaceTreeItem) {
            tasks = parent.tasks;
            workspace = parent.workspace;
        }

        // If there is a parent and it is a namespace
        if (parent instanceof elements.NamespaceTreeItem) {
            tasks = parent.tasks;
            parentNamespace = parent.namespace;
            workspace = parent.workspace;
        }

        if (tasks) {
            let namespaceTreeItems = new Map<string, elements.NamespaceTreeItem>();
            let taskTreeItems: elements.TaskTreeItem[] = [];
            for (let task of tasks) {

                let fullNamespacePath = getFullNamespacePath(task);
                let namespacePath = trimParentNamespace(fullNamespacePath, parentNamespace);

                // Check if the task has a namespace
                // If it does, add it to the namespace/tasks map
                if (this.nestingEnabled && namespacePath !== "") {
                    let namespaceLabel = getNamespaceLabel(namespacePath);
                    let namespaceTreeItem = namespaceTreeItems.get(namespaceLabel) ?? new elements.NamespaceTreeItem(
                        namespaceLabel,
                        workspace,
                        fullNamespacePath,
                        [],
                        vscode.TreeItemCollapsibleState.Collapsed
                    );
                    namespaceTreeItem.tasks.push(task);
                    namespaceTreeItems.set(namespaceLabel, namespaceTreeItem);
                }

                // Otherwise, create a tree item for the task
                else {
                    let taskLabel = getTaskLabel(task, this.nestingEnabled);
                    let taskTreeItem = new elements.TaskTreeItem(
                        taskLabel,
                        workspace,
                        task,
                        vscode.TreeItemCollapsibleState.None,
                        {
                            command: 'vscode-task.goToDefinition',
                            title: 'Go to Definition',
                            arguments: [task, true]
                        }
                    );
                    taskTreeItems = taskTreeItems.concat(taskTreeItem);
                }
            }

            // Add the namespace and tasks to the tree
            namespaceTreeItems.forEach(namespace => {
                treeItems = treeItems.concat(namespace);
            });
            treeItems = treeItems.concat(taskTreeItems);

            return Promise.resolve(treeItems);
        }

        return Promise.resolve(treeItems);
    }

    getWorkspaces(): elements.WorkspaceTreeItem[] {
        let workspaceTreeItems: elements.WorkspaceTreeItem[] = [];
        this._taskfiles?.forEach(taskfile => {
            vscode.workspace.workspaceFolders?.forEach(workspace => {
                // Check if the workspace folder is the same as the taskfile location.
                // If there is no location available (Task v3.22 or older), compare against the workspace instead.
                // This has the downside the tasks from Taskfiles outside of the workspace folder might be shown.
                if (workspace.uri.fsPath === (taskfile.location ? path.dirname(taskfile.location) : taskfile.workspace)) {
                    let workspaceTreeItem = new elements.WorkspaceTreeItem(
                        workspace.name,
                        workspace.uri.fsPath,
                        taskfile.tasks,
                        vscode.TreeItemCollapsibleState.Expanded
                    );
                    workspaceTreeItems = workspaceTreeItems.concat(workspaceTreeItem);
                }
            });
        });
        return workspaceTreeItems;
    }

    refresh(taskfiles?: models.Taskfile[]): void {
        if (taskfiles) {
            this._taskfiles = taskfiles;
        }
        this._onDidChangeTreeData.fire(undefined);
    }
}

function getFullNamespacePath(task: models.Task): string {
    // If the task has no namespace, return undefined
    if (!task.name.includes(namespaceSeparator)) {
        return "";
    }
    // Return the task's namespace by removing the last element
    return task.name.substring(0, task.name.lastIndexOf(namespaceSeparator));
}

function trimParentNamespace(namespace: string, parentNamespace: string): string {
    if (namespace === parentNamespace) {
        return "";
    }
    parentNamespace += namespaceSeparator;
    // If the namespace is a direct child of the parent namespace, remove the parent namespace
    if (namespace.startsWith(parentNamespace)) {
        return namespace.substring(parentNamespace.length);
    }
    return namespace;
}

function getNamespaceLabel(namespacePath: string): string {
    // If the namespace has no separator, return the namespace
    if (!namespacePath.includes(namespaceSeparator)) {
        return namespacePath;
    }
    // Return the first element of the namespace
    return namespacePath.substring(0, namespacePath.indexOf(namespaceSeparator));
}

function getTaskLabel(task: models.Task, nestingEnabled: boolean): string {
    // If the task has no namespace, return the task's name
    if (!task.name.includes(namespaceSeparator) || !nestingEnabled) {
        return task.name;
    }
    // Return the task's name by removing the namespace
    return task.name.substring(task.name.lastIndexOf(namespaceSeparator) + 1);
}
