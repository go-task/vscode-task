import * as vscode from 'vscode';
import { Namespace, Task } from '../models/models.js';

export type TreeItem = WorkspaceTreeItem | NamespaceTreeItem | TaskTreeItem;

export class WorkspaceTreeItem extends vscode.TreeItem {
    constructor(
        readonly label: string,
        readonly workspace: string,
        readonly namespace: Namespace,
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
        readonly namespace: Namespace,
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
        switch (this.task.up_to_date) {
            case true:
                this.iconPath = new vscode.ThemeIcon('debug-breakpoint-data-unverified', new vscode.ThemeColor('vscodetask.upToDateIcon'));
                break;
            case false:
                this.iconPath = new vscode.ThemeIcon('debug-breakpoint-data-unverified', new vscode.ThemeColor('vscodetask.outOfDateIcon'));
                break;
            default:
                this.iconPath = new vscode.ThemeIcon('debug-breakpoint-data-unverified', new vscode.ThemeColor('vscodetask.primaryColor'));
        }
        this.contextValue = `taskTreeItem`;
    }
}
