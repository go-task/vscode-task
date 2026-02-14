// TODO: Taking inspiration from:
// - https://code.visualstudio.com/api/extension-guides/task-provider
// - https://github.com/microsoft/vscode-extension-samples/blob/main/task-provider-sample/src/customTaskProvider.ts

import * as vscode from 'vscode';
import { Namespace } from '../models/models.js';
import { settings } from '../utils/settings.js';

export interface TaskDefinition extends vscode.TaskDefinition {
    task: string;
    file?: string;
    workspace?: string;
    args?: string[];
}

export class TaskProvider implements vscode.TaskProvider<vscode.Task> {
    private _taskfiles: Namespace[] = [];

    public setTaskfiles(taskfiles: Namespace[]) {
        this._taskfiles = taskfiles;
    }

	public async provideTasks(): Promise<vscode.Task[]> {
		return this.getTasksFromTaskfiles(this._taskfiles);
    }

	public resolveTask(_task: vscode.Task): vscode.Task | undefined {
        const task = _task.definition.task;
        if (task) {
            const definition: TaskDefinition = <any>_task.definition;
            return new vscode.Task(
                definition,
                _task.scope ?? vscode.TaskScope.Workspace,
                definition.task,
                'taskfile',
                new vscode.ShellExecution(`task ${definition.task}`)
            );
        }
        return undefined;
    }

	private getTasksFromTaskfiles(taskfiles: Namespace[]): vscode.Task[] {
        let tasks: vscode.Task[] = [];
        taskfiles.forEach(namespace => {
            tasks = tasks.concat(this.getTasksFromNamespace(namespace, namespace.workspace));
        });
        return tasks;
	}

    // We have an additional workspace parameter to so that we can always pass
    // in the root workspace as the current workspace being passed may not be
    // populated.
    private getTasksFromNamespace(namespace: Namespace, workspace: string): vscode.Task[] {
        let tasks: vscode.Task[] = [];

        // Add the tasks in this namespace
        if (namespace.tasks) {
            namespace.tasks.forEach(task => {
                const definition: TaskDefinition = {
                    type: 'taskfile',
                    task: task.name,
                    workspace: workspace
                }
                const uri = vscode.Uri.file(workspace);
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
                if (!workspaceFolder) {
                    return;
                }
                const vscodeTask = new vscode.Task(
                    definition,
                    workspaceFolder,
                    task.name,
                    'taskfile',
                    new vscode.ShellExecution(`${settings.path} ${task.name}`, { cwd: workspace })
                );
                vscodeTask.detail = task.desc || '';
                tasks.push(vscodeTask);
            });
        }

        // Recursively handle nested namespaces
        if (namespace.namespaces) {
            for (const [_, childNamespace] of Object.entries(namespace.namespaces)) {
                tasks = tasks.concat(this.getTasksFromNamespace(childNamespace, workspace));
            }
        }

        return tasks;
    }
}
