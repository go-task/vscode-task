import * as vscode from 'vscode';
import { TaskTreeDataProvider } from '../providers/taskTreeDataProvider.js';
import { Namespace } from '../models/models.js';

export class ActivityBar {
    private _provider: TaskTreeDataProvider;

    constructor() {
        // Create the data provider
        this._provider = new TaskTreeDataProvider();

        // Register the tree view with its data provider
        vscode.window.createTreeView('vscode-task.tasks', {
            treeDataProvider: this._provider,
            showCollapseAll: true
        });
    }

    public refresh(taskfiles?: Namespace[], nesting?: boolean): void {
        this._provider.refresh(taskfiles, nesting);
    }
}
