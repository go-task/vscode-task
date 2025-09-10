import * as vscode from 'vscode';
import { Namespace, Task } from '../models/models.js';

export class QuickPickTaskItem implements vscode.QuickPickItem {
    constructor(namespace: Namespace, task: Task) {
        this.namespace = namespace;
        this.task = task;
        this.label = task.name;
        this.description = task.desc;
        this.kind = vscode.QuickPickItemKind.Default;
    }
    namespace: Namespace;
    task: Task;
    label: string;
    description: string;
    kind: vscode.QuickPickItemKind;
}

export class QuickPickTaskSeparator implements vscode.QuickPickItem {
    constructor(namespace: Namespace) {
        this.label = namespace.location;
        this.kind = vscode.QuickPickItemKind.Separator;
    }
    label: string;
    kind: vscode.QuickPickItemKind;
}
