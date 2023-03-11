// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from 'child_process';

var outputChannel: vscode.OutputChannel;
var taskList: TaskList;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Create an output channel for the task output
	outputChannel = vscode.window.createOutputChannel('task');

	// Register commands
	let disposable = vscode.commands.registerCommand('vscode-task.runTask', runTask);

	// Initialise the task list
	refreshTaskList();

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }

function runTask() {
	refreshTaskList();

	// Show a quick pick with all the tasks
	vscode.window.showQuickPick(taskList.tasks.map(t => t.name)).then((taskName) => {

		// If the user selected a task, run it
		if (taskName) {
			cp.exec(`task ${taskName}`, (err: cp.ExecException | null, stdout: string, stderr: string) => {
				if (err) {
					console.log('error: ' + err);
					return;
				}
				outputChannel.append(stderr);
				outputChannel.append(stdout);
				outputChannel.show();
			});
		}
	});
}

async function refreshTaskList() {
	return await new Promise((resolve, reject) => {
		// Get a list of all tasks
		cp.exec('task --list-all --json', (err: cp.ExecException | null, stdout: string, stderr: string) => {
			if (err) {
				console.log('error: ' + err);
				return;
			}
			// Parse the JSON output
			taskList = JSON.parse(stdout);
			resolve(stdout);
		});
	});
}

interface Task {
	name: string;
	desc: string;
	summary: string;
	up_to_date: boolean;
}

interface TaskList {
	tasks: Task[];
}
