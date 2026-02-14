import * as vscode from 'vscode';
import { TaskTreeDataProvider } from '../providers/taskTreeDataProvider.js';
import { Taskfile } from '../models/taskfile.js';

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

    public refresh(taskfiles?: Taskfile[], nesting?: boolean): void {
        this._provider.refresh(taskfiles, nesting);
    }
}
