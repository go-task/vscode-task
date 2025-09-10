# Changelog

## Unreleased

- Disabled double-click to run by default (by @pd93).
  - This was done to prevent running Tasks accidentally and because double-click
    conflicts with the default VSCode action of opening a Task definition with
    preview disabled.
  - It can be re-enabled by setting `task.doubleClickTimeout` to a value greater
    than `0` (e.g. `500`) (by @pd93).

## v0.4.0 - 2025-08-21

- Added `terminal.per` setting to allow a new terminal per task (#125, #126 by
  @yoiang).
- Added `terminal.close` setting to control if the existing terminal should
  close before running another task (by @pd93).
- General improvements to how terminals are handled (by @pd93).
- Updated extension to use ESM and pnpm (#205 by @pd93).
- Fixed task discovery when installed in a project using asdf (#181 by
  @joerocklin).
- Run last command now remembers `.CLI_ARGS` and works when output is set to the
  terminal (#168 by @kema-dev and @pd93).
- Added support for double-clicking tasks from the tree view to run them (#127,
  #129 by @pd93).
  - Configurable via `task.doubleClickTimeout` setting measured in milliseconds.
    - Defaults to `500`.
    - `0` will disable double-click.

## v0.3.2 - 2023-11-20

- Fixed another small bug with the new argument passing (#94 by @MaxCheetham).
- Bumped the minimum required version of `task` to v3.24.0.

## v0.3.1 - 2023-09-02

- Fixed a small bug with the new argument passing (#93 by @MaxCheetham).

## v0.3.0 - 2023-09-02

- Added support for passing arguments in to tasks (#89 by @MaxCheetham).
- Fixed some bugs with the tree view not displaying tasks correctly (#59, #79,
  #90 by @MaxCheetham).

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
