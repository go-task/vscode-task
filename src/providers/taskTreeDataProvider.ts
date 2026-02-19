import * as path from 'path';
import * as vscode from 'vscode';
import { TreeItem, TaskTreeItem, NamespaceTreeItem, WorkspaceTreeItem } from '../elements/treeItem.js';
import { Namespace, Task } from '../models/models.js';
import { Taskfile } from '../models/taskfile.js';
import { TaskDefinition } from '../models/taskDefinition.js';

const namespaceSeparator = ':';

export class TaskTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | undefined> = new vscode.EventEmitter<TaskTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | undefined> = this._onDidChangeTreeData.event;
    private _taskfiles?: Taskfile[];
    private _nesting: boolean = false;

    refresh(taskfiles?: Taskfile[], nesting?: boolean): void {
        if (taskfiles) {
            this._taskfiles = taskfiles;
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
        if (!this._taskfiles || this._taskfiles.length === 0) {
            return Promise.resolve([]);
        }

        // If there is no parent and exactly one workspace folder or if the parent is a workspace
        if (!parent && vscode.workspace.workspaceFolders.length === 1) {
            return Promise.resolve(this.createTreeItems(
                this._taskfiles[0].workspace ?? "",
                this._taskfiles[0].namespace.namespaces,
                this._taskfiles[0].namespace.tasks
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
                const definition = new TaskDefinition(task, workspace);
                treeItems = treeItems.concat(new TaskTreeItem(
                    this.getTaskName(task),
                    workspace,
                    definition,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'vscode-task.goToDefinition',
                        title: 'Go to Definition',
                        arguments: [definition, true]
                    }
                ));
            }
        }

        return treeItems;
    }

    getTaskName(task: Task): string {
        // If the task has a label that's not the task name, return it
        if (task.name != task.task) {
            return task.name;
        }

        // If nesting is enabled, we remove any namespaces from the task name
        if (this._nesting) {
            return task.task.split(namespaceSeparator).pop() ?? task.task;
        }

        return task.task;
    }

    getWorkspaces(): WorkspaceTreeItem[] {
        let workspaceTreeItems: WorkspaceTreeItem[] = [];
        this._taskfiles?.forEach(taskfile => {
            let dir = path.dirname(taskfile.location);
            let workspaceTreeItem = new WorkspaceTreeItem(
                path.basename(dir),
                dir,
                taskfile.namespace,
                vscode.TreeItemCollapsibleState.Expanded
            );
            workspaceTreeItems = workspaceTreeItems.concat(workspaceTreeItem);
        });
        return workspaceTreeItems;
    }
}
