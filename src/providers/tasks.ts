import * as vscode from 'vscode';
import * as models from '../models';

const namespaceSeparator = ':';

export class Tasks implements vscode.TreeDataProvider<TaskTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | undefined> = new vscode.EventEmitter<TaskTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | undefined> = this._onDidChangeTreeData.event;
    private _taskfile?: models.Taskfile;

    getTreeItem(element: TaskTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(parent?: TaskTreeItem): Thenable<TaskTreeItem[]> {
        var taskTreeItems: TaskTreeItem[] = [];
        var namespaceTreeItems: TaskTreeItem[] = [];

        // Loop over each task
        this._taskfile?.tasks.forEach(task => {

            // Split the task's name into a namespace and label
            var namespace = task.name.substring(0, task.name.lastIndexOf(namespaceSeparator));
            var taskLabel = task.name.substring(task.name.lastIndexOf(namespaceSeparator) + 1, task.name.length);

            // If the task's namespace is the same as the parent's namespace
            // add the task to the tree
            if ((parent && parent.namespace === namespace) || (!parent && namespace === "")) {
                taskTreeItems.push(new TaskTreeItem(taskLabel, namespace, task, vscode.TreeItemCollapsibleState.None));
                return;
            }

            // If the namespace is a direct child of the parent namespace
            // and the namespace doesn't already exist in the tree
            // add the namespace to the tree
            if (!namespaceExistsInTree(namespaceTreeItems, namespace) && namespaceIsDirectChild(namespace, parent?.namespace)) {
                let namespaceLabel = trimNamespacePrefix(namespace, parent?.namespace);
                namespaceTreeItems.push(new TaskTreeItem(namespaceLabel, namespace, undefined, vscode.TreeItemCollapsibleState.Collapsed));
                return;
            }
        });
        return Promise.resolve(namespaceTreeItems.concat(taskTreeItems));
    }

    refresh(taskfile?: models.Taskfile): void {
        this._taskfile = taskfile;
        this._onDidChangeTreeData.fire(undefined);
    }
}

function namespaceExistsInTree(tree: TaskTreeItem[], namespace: string) {
    return tree.find(item => item.namespace === namespace) !== undefined;
}

function namespaceIsDirectChild(namespace: string, parentNamespace: string = "") {
    return namespace.startsWith(parentNamespace) && !trimNamespacePrefix(namespace, parentNamespace).includes(namespaceSeparator);
}

function trimNamespacePrefix(str: string, prefix?: string) {
    if (!prefix) {
        return str;
    }
    if (str.startsWith(prefix)) {
        return str.substring(prefix.length + 1);
    }
    return str;
}

export class TaskTreeItem extends vscode.TreeItem {
    constructor(
        readonly label: string,
        readonly namespace: string,
        readonly task: models.Task | undefined,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.description = this.task?.desc;
        if (!this.task) {
            this.iconPath = new vscode.ThemeIcon('symbol-namespace', new vscode.ThemeColor('vscodetask.namespace'));
        } else if (this.task.up_to_date) {
            this.iconPath = new vscode.ThemeIcon('debug-breakpoint-log-unverified', new vscode.ThemeColor('vscodetask.upToDate'));
        } else {
            this.iconPath = new vscode.ThemeIcon('debug-breakpoint-data-unverified', new vscode.ThemeColor('vscodetask.outOfDate'));
        }
        this.contextValue = `${this.task ? 'task' : 'namespace'}TreeItem`;
    }
}
