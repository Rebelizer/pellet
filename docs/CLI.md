## pellet CLI docs

### Flags

pellet has very few flags to know about. All other flags are for tasks to use if needed.

- `-v` or `--version` will display the pellet version
- `-c` or `--config` environment config file (override common config)
- `--configCommon <path>` path to common config file
- `--configDir <path>` path to config directory
- `--commandDir <path>` path to directory containing additional commands
- `--envWhitelist <string>` environment variable white list separated by ","
- `--scrubLogs <string>` RegExp used to scrub launchDetails and logs
- `--silent` will disable all pellet logging
- `--launchDetails` will print launch and env details

The CLI uses NODE_ENV and PELLET_CONF_DIR

### Tasks

### Compilers
