import * as vscode from 'vscode';

class Log {
    private static _instance: Log;

    constructor(
        public channel: vscode.OutputChannel = vscode.window.createOutputChannel("Task (Debug)")
    ) { }

    public static get instance() {
        return this._instance ?? (this._instance = new this());
    }

    info(v: any) {
        console.log(v);
        this.channel.appendLine(v);
    }

    error(err: any) {
        console.error(err);
        this.channel.appendLine(err);
    }
}

export const log = Log.instance;
