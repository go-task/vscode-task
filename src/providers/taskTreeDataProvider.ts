import * as path from 'path';
import * as vscode from 'vscode';
import { TreeItem, TaskTreeItem, NamespaceTreeItem, WorkspaceTreeItem } from '../elements/treeItem.js';
import { Namespace, Task } from '../models/models.js';

const namespaceSeparator = ':';

export class TaskTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | undefined> = new vscode.EventEmitter<TaskTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | undefined> = this._onDidChangeTreeData.event;
    private _namespaces?: Namespace[];
    private _nesting: boolean = false;

    refresh(namespaces?: Namespace[], nesting?: boolean): void {
        if (namespaces) {
            this._namespaces = namespaces;
        }
        this._nesting = nesting ?? this._nesting;
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(parent?: TreeItem): Thenable<TreeItem[]> {
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

        // If there are no namespaces, return an empty array
        if (!this._namespaces || this._namespaces.length === 0) {
            return Promise.resolve([]);
        }

        // If there is no parent and exactly one workspace folder or if the parent is a workspace
        if (!parent && vscode.workspace.workspaceFolders.length === 1) {
            return Promise.resolve(this.createTreeItems(
                this._namespaces[0].workspace ?? "",
                this._namespaces[0].namespaces,
                this._namespaces[0].tasks
            ));
        }

        // If there is a parent and it is a workspace or namespace
        if (parent instanceof WorkspaceTreeItem || parent instanceof NamespaceTreeItem) {
            return Promise.resolve(this.createTreeItems(
                parent.workspace,
                parent.namespace.namespaces,
                parent.namespace.tasks
            ));
        }

        return Promise.resolve([]);
    }

    createTreeItems(
        workspace: string,
        namespaces: Map<string, Namespace>,
        tasks: Task[]
    ): TreeItem[] {
        var treeItems: TreeItem[] = [];

        // Add each namespace to the tree
        if (namespaces) {
            for (const [key, namespace] of Object.entries(namespaces)){
                treeItems = treeItems.concat(new NamespaceTreeItem(
                    key,
                    workspace,
                    namespace,
                    vscode.TreeItemCollapsibleState.Collapsed
                ));
            }
        }

        // Add each task to the tree
        if (tasks) {
            for (const task of tasks) {
                treeItems = treeItems.concat(new TaskTreeItem(
                    this._nesting ? task.name.split(namespaceSeparator).pop() ?? task.name : task.name,
                    workspace,
                    task,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'vscode-task.goToDefinition',
                        title: 'Go to Definition',
                        arguments: [task, true]
                    }
                ));
            }
        }

        return treeItems;
    }

    getWorkspaces(): WorkspaceTreeItem[] {
        let workspaceTreeItems: WorkspaceTreeItem[] = [];
        this._namespaces?.forEach(namespace => {
            let dir = path.dirname(namespace.location);
            let workspaceTreeItem = new WorkspaceTreeItem(
                path.basename(dir),
                dir,
                namespace,
                vscode.TreeItemCollapsibleState.Expanded
            );
            workspaceTreeItems = workspaceTreeItems.concat(workspaceTreeItem);
        });
        return workspaceTreeItems;
    }
}
