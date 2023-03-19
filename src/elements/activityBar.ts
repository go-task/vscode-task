import * as vscode from 'vscode';
import * as providers from '../providers';
import * as models from '../models';

export class ActivityBar {
    private _provider: providers.TaskTreeDataProvider;

    constructor() {
        // Create the data provider
        this._provider = new providers.TaskTreeDataProvider();

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

    public refresh(taskfiles?: models.Taskfile[]) {
        this._provider.refresh(taskfiles);
    }
}
