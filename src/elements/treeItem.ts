import * as vscode from 'vscode';
import { Task } from '../models/taskfile.js';

export type TreeItem = WorkspaceTreeItem | NamespaceTreeItem | TaskTreeItem;

export class WorkspaceTreeItem extends vscode.TreeItem {
    constructor(
        readonly label: string,
        readonly workspace: string,
        readonly tasks: Task[],
        readonly collapsibleState: vscode.TreeItemCollapsibleState,
        readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.description = this.workspace;
        this.iconPath = new vscode.ThemeIcon('folder', new vscode.ThemeColor('vscodetask.workspaceIcon'));
        this.contextValue = `workspaceTreeItem`;
    }
}

export class NamespaceTreeItem extends vscode.TreeItem {
    constructor(
        readonly label: string,
        readonly workspace: string,
        readonly namespaceMap: any,
        readonly tasks: Task[],
        readonly collapsibleState: vscode.TreeItemCollapsibleState,
        readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.iconPath = new vscode.ThemeIcon('symbol-namespace', new vscode.ThemeColor('vscodetask.namespaceIcon'));
        this.contextValue = `namespaceTreeItem`;
    }
}

export class TaskTreeItem extends vscode.TreeItem {
    constructor(
        readonly label: string,
        readonly workspace: string,
        readonly task: Task,
        readonly collapsibleState: vscode.TreeItemCollapsibleState,
        readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.description = this.task?.desc;
        if (this.task.up_to_date) {
            this.iconPath = new vscode.ThemeIcon('debug-breakpoint-log-unverified', new vscode.ThemeColor('vscodetask.upToDateIcon'));
        } else {
            this.iconPath = new vscode.ThemeIcon('debug-breakpoint-data-unverified', new vscode.ThemeColor('vscodetask.outOfDateIcon'));
        }
        this.contextValue = `taskTreeItem`;
    }
}
