import * as vscode from 'vscode';
import { TaskExtension } from './task';

export function activate(context: vscode.ExtensionContext) {

	// Create a new instance of Tagger
	let taskExtension: TaskExtension = new TaskExtension();

	// Registration
	taskExtension.registerCommands(context);
	taskExtension.registerListeners(context);

	// Refresh the tasks list
	taskExtension.updateAndRefresh();
}

export function deactivate() { }
