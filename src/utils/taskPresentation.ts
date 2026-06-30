import * as vscode from 'vscode';

const dedicatedTerminalDefaults: vscode.TaskPresentationOptions = {
    panel: vscode.TaskPanelKind.Dedicated,
    reveal: vscode.TaskRevealKind.Always,
    clear: false,
    showReuseMessage: false
};

// Applies our dedicated-terminal presentation defaults, while letting any
// user-supplied options (e.g. from tasks.json) take precedence.
export function useDedicatedTerminal(task: vscode.Task, overrides?: vscode.TaskPresentationOptions): vscode.Task {
    task.presentationOptions = { ...dedicatedTerminalDefaults, ...overrides };
    return task;
}

export function buildTaskCommand(taskBin: string, taskName: string, cliArgs: string[]): string {
    return `${taskBin} ${taskName}${cliArgs.length > 0 ? " -- " + cliArgs.join(' ') : ''}`;
}
