// Taking inspiration from:
// - https://code.visualstudio.com/api/extension-guides/task-provider
// - https://github.com/microsoft/vscode-extension-samples/blob/main/task-provider-sample/src/customTaskProvider.ts

import * as vscode from 'vscode';
import { Taskfile } from '../models/taskfile.js';
import { TaskDefinition } from '../models/taskDefinition.js';

export class TaskProvider implements vscode.TaskProvider<vscode.Task> {
    private _taskfiles: Taskfile[] = [];

    public setTaskfiles(taskfiles: Taskfile[]) {
        this._taskfiles = taskfiles;
    }

	public async provideTasks(): Promise<vscode.Task[]> {
        let tasks: vscode.Task[] = [];
        this._taskfiles.forEach(taskfile => {
            tasks = tasks.concat(taskfile.getTaskDefinitions().map(def => def.toTask()));
        });
        return Promise.resolve(tasks);
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
}
