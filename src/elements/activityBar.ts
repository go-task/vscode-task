import * as vscode from 'vscode';
import * as providers from '../providers';
import * as models from '../models';

export class ActivityBar {
    private _provider: providers.Tasks;

    constructor() {
        // Create the data provider
        this._provider = new providers.Tasks();

        // Register the tree view with its data provider
        vscode.window.createTreeView('vscode-task.tasks', {
            treeDataProvider: this._provider,
            showCollapseAll: true
        });
    }

    public refresh(taskfiles: models.Taskfile[]) {
        this._provider.refresh(taskfiles);
    }
}
