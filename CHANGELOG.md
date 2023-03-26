# Changelog

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
  - Configurable via `task.updateOn` setting (values: `"save"` (default) or `"manual"`).
- Toggle tree nesting on/off
  - Configurable via `task.nesting` setting (values: `true` (default) or `false`).
- Change the path to the Task binary.
  - Can also be set to the name of a binary in your `$PATH`.
  - Configurable via `task.path` setting (defaults to `"task"`).
- Version checks on startup.
  - Configurable via `task.checkForUpdates` setting (values: `true` (default) or `false`).
- Sidebar icon provided by @drite93.
