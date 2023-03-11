import * as vscode from 'vscode';
import * as services from '../services';
import * as models from '../models';

// RunTask will show a quick pick with all the tasks and run the selected one
export function runTask(taskfile?: models.Taskfile) {
    if (!taskfile || taskfile.tasks.length === 0) {
        vscode.window.showInformationMessage('No tasks found');
        return;
    }
    vscode.window.showQuickPick(taskfile.tasks.map(t => t.name)).then((taskName) => {
        if (taskName) {
            services.taskfile.runTask(taskName);
        }
    });
}
