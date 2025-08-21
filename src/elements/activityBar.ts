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

    public setTreeNesting(enabled: boolean) {
        this._provider.setTreeNesting(enabled);
        this._provider.refresh();
    }

    public refresh(taskfiles?: Taskfile[]) {
        this._provider.refresh(taskfiles);
    }
}
