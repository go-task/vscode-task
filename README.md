<div align="center">
  <a href="https://taskfile.dev">
    <img src="./res/task.png" />
  </a>
  <a href="https://taskfile.dev">
    <img src="./res/vscode.png"/>
  </a>

  <h1>Task for Visual Studio Code</h1>

  <p>
    <a href="https://taskfile.dev">Task</a> is a task runner / build tool that aims to be simpler and easier to use than, for example, <a href="https://www.gnu.org/software/make/">GNU Make<a>.
  </p>

  <p>
    <a href="https://taskfile.dev/installation/">Installation</a> | <a href="https://taskfile.dev/usage/">Documentation</a> | <a href="https://twitter.com/taskfiledev">Twitter</a> | <a href="https://fosstodon.org/@task">Mastodon</a> | <a href="https://discord.gg/6TY36E39UK">Discord</a>
  </p>
</div>

## Features

- View tasks in the sidebar.
- Run tasks from the sidebar and command palette.
- Go to definition from the sidebar and command palette.
- Run last task command.
- Multi-root workspace support.
- Initialize a Taskfile in the current workspace.

---

![Task for Visual Studio Code Preview](./res/preview.png)

## Configuration

| Setting        | Type      | Allowed Values       | Default  | Description                                      |
| -------------- | --------- | -------------------- | -------- | ------------------------------------------------ |
| `updateOn`     | `string`  | `"manual"`, `"save"` | `"save"` | When should the task list be updated.            |
| `tree.nesting` | `boolean` |                      | `true`   | Should the task list be nested or not by default |
