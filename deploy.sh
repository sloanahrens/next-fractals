#!/bin/bash

# Deployment helper script for Next Fractals
# This script provides easy access to tf-devops commands from the project root

set -e

# Forward all commands to tf-devops.sh
exec "./tf-devops/tf-devops.sh" "$@"