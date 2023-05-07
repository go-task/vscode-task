# Changelog

## v0.2.0 - 2023-05-07

- Improve error handling in when Taskfiles contain errors (#25 by @pd93).
- Added a new command: `Task: Show Debug Panel` to show the Task debug panel
  (#25 by @pd93).
- Added the ability to sort tasks in the tree view (#20 by @pd93).
  - Configurable via `task.tree.sort` setting (values: `"default"` (default),
    `"alphanumeric"` or `"none"`).
- Added a cancel/timeout to file watcher to improve performance when making lots
  of file changes (#35 by @pd93).
  - For example, `git stash pop` of a lot of `.yml` files would cause a huge lag
    spike as multiple update calls were made.
- Allow commands to be run from last active terminal instead of the output panel
  (#12, #43 by @pd93).
  - Configurable via `task.outputTo` setting (values: `output` (default) or
    `terminal`).
- This extension is now also published on the
  [Open VSX Registry](https://open-vsx.org/extension/task/vscode-task) (#26, #46
  by @pd93).
  - This means you can now install it in [VSCodeium](https://vscodium.com/).

## v0.1.1 - 2023-03-27

- Fixed some installations (e.g. Brew) not detecting the Task version correctly
  (#13, #14 by @pd93).

## v0.1.0 - 2023-03-26

- View tasks in the sidebar.
- Run tasks from the sidebar and command palette.
- Go to definition from the sidebar and command palette.
- Run last task command.
- Multi-root workspace support.
- Open docs from the sidebar and command palette.
- Ability to initialize a Taskfile in the current workspace.
  - If no Taskfile is detected a button will appear in the sidebar.
- Refresh on save.
  - Configurable via `task.updateOn` setting (values: `"save"` (default) or
    `"manual"`).
- Toggle tree nesting on/off
  - Configurable via `task.tree.nesting` setting (values: `true` (default) or
    `false`).
- Change the path to the Task binary.
  - Can also be set to the name of a binary in your `$PATH`.
  - Configurable via `task.path` setting (defaults to `"task"`).
- Version checks on startup.
  - Configurable via `task.checkForUpdates` setting (values: `true` (default) or
    `false`).
- Sidebar icon provided by @drite93.
