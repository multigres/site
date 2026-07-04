#!/bin/bash
# naming_linter - Enforce consistent capitalization of the Multigres names
# Multigres, Multipooler, Multiorch, Multigateway, and Multiadmin.
#
# These are single words: only the leading "M" is capitalized (or the whole
# token is lower/upper case). The camel-cased forms "MultiPooler",
# "MultiGateway", "MultiAdmin", etc. (and their leading-lowercase variants
# "multiPooler", etc.) are forbidden.
#
# Allowed:   Multipooler  multipooler  MULTIPOOLER
# Forbidden: MultiPooler  multiPooler
#
# The check matches "[Mm]ulti(Pooler|Orch|Gateway|Gres|Admin)", which flags the
# PascalCase and camelCase forms while leaving the correct single-word forms
# and the SCREAMING_CASE constant form (e.g. ID_MULTIPOOLER) untouched.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# The offending internal-capitalization pattern.
PATTERN='[Mm]ulti(Pooler|Orch|Gateway|Gres|Admin)'

# Scan all tracked files. Exclude this script (it necessarily spells out the
# forbidden forms above). node_modules, build/, and .source are gitignored, so
# git grep skips them automatically.
if matches=$(git grep -nE "$PATTERN" -- ':!tools/naming_linter.sh'); then
  echo "ERROR: found camelCased Multigres names. The names are single words:" >&2
  echo "       use Multipooler / Multiorch / Multigateway / Multigres / Multiadmin" >&2
  echo "       (only the leading M is capital), not MultiPooler / MultiAdmin / etc." >&2
  echo >&2
  echo "$matches" >&2
  exit 1
fi

echo "naming_linter: OK — no camelCased Multigres names found."
