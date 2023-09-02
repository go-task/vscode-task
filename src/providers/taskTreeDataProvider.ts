import * as path from 'path';
import * as vscode from 'vscode';
import * as elements from '../elements';
import * as models from '../models';

const namespaceSeparator = ':';

export class TaskTreeDataProvider implements vscode.TreeDataProvider<elements.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<elements.TaskTreeItem | undefined> = new vscode.EventEmitter<elements.TaskTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<elements.TaskTreeItem | undefined> = this._onDidChangeTreeData.event;
    private _taskfiles?: models.Taskfile[];
    private _treeViewMap: models.TaskMapping = {};

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

        var tasks: models.Task[] | undefined;
        var parentNamespace = "";
        var namespaceMap = this._treeViewMap;
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
            parentNamespace = parent.label;
            namespaceMap = parent.namespaceMap;
            workspace = parent.workspace;
        }


        if (tasks === undefined) {
            return Promise.resolve([]);
        }

        let namespaceTreeItems = new Map<string, elements.NamespaceTreeItem>();
        let taskTreeItems: elements.TaskTreeItem[] = [];
        tasks.forEach(task => {
            let taskName = task.name.split(":").pop() ?? task.name;
            let namespacePath = trimParentNamespace(task.name, parentNamespace);
            let namespaceName = getNamespaceName(namespacePath);

            if (taskName in namespaceMap) {
                let item = new elements.TaskTreeItem(
                    task.name.split(namespaceSeparator).pop() ?? task.name,
                    workspace,
                    task,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'vscode-task.goToDefinition',
                        title: 'Go to Definition',
                        arguments: [task, true]
                    }
                );
                taskTreeItems = taskTreeItems.concat(item);
            }

            if (namespaceName in namespaceMap && namespaceMap[namespaceName] !== null) {
                let namespaceTreeItem = namespaceTreeItems.get(namespaceName);

                if (namespaceTreeItem === undefined) {
                    namespaceTreeItem = new elements.NamespaceTreeItem(
                        namespaceName,
                        workspace,
                        namespaceMap[namespaceName],
                        [],
                        vscode.TreeItemCollapsibleState.Collapsed
                    );
                }
                namespaceTreeItem.tasks.push(task);
                namespaceTreeItems.set(namespaceName, namespaceTreeItem);
            }

        });

        // Add the namespace and tasks to the tree
        namespaceTreeItems.forEach(namespace => {
            treeItems = treeItems.concat(namespace);
        });
        treeItems = treeItems.concat(taskTreeItems);

        return Promise.resolve(treeItems);
    }

    getWorkspaces(): elements.WorkspaceTreeItem[] {
        let workspaceTreeItems: elements.WorkspaceTreeItem[] = [];
        this._taskfiles?.forEach(taskfile => {
            let dir = path.dirname(taskfile.location);
            let workspaceTreeItem = new elements.WorkspaceTreeItem(
                path.basename(dir),
                dir,
                taskfile.tasks,
                vscode.TreeItemCollapsibleState.Expanded
            );
            workspaceTreeItems = workspaceTreeItems.concat(workspaceTreeItem);
        });
        return workspaceTreeItems;
    }

    refresh(taskfiles?: models.Taskfile[]): void {
        if (taskfiles) {
            this._taskfiles = taskfiles;
            this._treeViewMap = {};

            // loop over all of the tasks in all of the task files and map their names into a set
            const taskNames = Array.from(new Set(
                taskfiles.flatMap(taskfile =>
                    taskfile.tasks.flatMap(task => task.name)
                )
                // and sort desc so we know that the namespace reduction sets child objects correctly.
            )).sort((a, b) => (a > b ? -1 : 1));

            taskNames.reduce((acc: any, key: string) => {
                const parts = key.split(':');
                let currentLevel = acc;

                parts.forEach((part, index) => {
                    if (part === "") {
                        return;
                    };

                    if (!(part in currentLevel)) {
                        currentLevel[part] = {};
                        if (index === parts.length - 1) {
                            currentLevel[part] = null;
                        }
                    }

                    currentLevel = currentLevel[part] as models.TaskMapping;
                });

                return acc;
            }, this._treeViewMap);
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
    if (parentNamespace === "") {
        return namespace;
    }

    const index = namespace.indexOf(parentNamespace + namespaceSeparator);

    if (index === -1) {
        return namespace;
    }

    return namespace.substring(index + parentNamespace.length + 1);
}

function getNamespaceName(namespacePath: string): string {
    // If the namespace has no separator, return the namespace
    if (!namespacePath.includes(namespaceSeparator)) {
        return namespacePath;
    }
    // Return the first element of the namespace
    return namespacePath.substring(0, namespacePath.indexOf(namespaceSeparator));
}
