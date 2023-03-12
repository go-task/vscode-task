import * as vscode from 'vscode';
import * as models from '../models';

export class Tasks implements vscode.TreeDataProvider<TaskTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | undefined> = new vscode.EventEmitter<TaskTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | undefined> = this._onDidChangeTreeData.event;
    private _taskfile?: models.Taskfile;

    getTreeItem(element: TaskTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TaskTreeItem): Thenable<TaskTreeItem[]> {
        var taskTreeItems: TaskTreeItem[] = [];
        this._taskfile?.tasks.forEach(task => {
            taskTreeItems.push(new TaskTreeItem(task, vscode.TreeItemCollapsibleState.None));
        });
        return Promise.resolve(taskTreeItems);
    }

    refresh(taskfile?: models.Taskfile): void {
        this._taskfile = taskfile;
        this._onDidChangeTreeData.fire(undefined);
    }
}

class TaskTreeItem extends vscode.TreeItem {
    constructor(
        private task: models.Task,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(task.name, collapsibleState);
        this.tooltip = `${this.task.desc}`;
        this.description = this.task.desc;
        if (this.task.up_to_date) {
            this.iconPath = new vscode.ThemeIcon('debug-breakpoint-log-unverified', new vscode.ThemeColor('vscodetask.upToDate'));
        } else {
            this.iconPath = new vscode.ThemeIcon('debug-breakpoint-data-unverified', new vscode.ThemeColor('vscodetask.outOfDate'));
        }
    }
}
