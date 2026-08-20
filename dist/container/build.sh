#!/usr/bin/env bash
set -euo pipefail

readonly PACMAN_CONF="${PACMAN_CONF:-/etc/pacman.conf}"
readonly IMAGE_NAME="${IMAGE_NAME:-deck-build-container}"

if [[ ! -r "${PACMAN_CONF}" ]]; then
    echo "Cannot read the SteamOS pacman configuration: ${PACMAN_CONF}" >&2
    exit 1
fi

jupiter_repo="$(awk '/^\[jupiter-[^]]+\]$/ { gsub(/^\[|\]$/, ""); print; exit }' \
    "${PACMAN_CONF}")"

if [[ ! "${jupiter_repo}" =~ ^jupiter-([A-Za-z0-9][A-Za-z0-9._-]*)$ ]]; then
    echo "Cannot determine a valid SteamOS repository suffix from ${PACMAN_CONF}." >&2
    exit 1
fi

repo_suffix="${BASH_REMATCH[1]}"

for repo in jupiter holo core extra; do
    if ! grep -Fqx "[${repo}-${repo_suffix}]" "${PACMAN_CONF}"; then
        echo "SteamOS repository configuration is inconsistent." >&2
        echo "Missing [${repo}-${repo_suffix}] in ${PACMAN_CONF}." >&2
        exit 1
    fi
done

if [[ -n "${CONTAINER_RUNTIME:-}" ]]; then
    runtime="${CONTAINER_RUNTIME}"
elif command -v podman >/dev/null 2>&1; then
    runtime='podman'
elif command -v docker >/dev/null 2>&1; then
    runtime='docker'
else
    echo "Neither Podman nor Docker is available." >&2
    exit 1
fi

echo "Building ${IMAGE_NAME} for SteamOS repositories: *-${repo_suffix}"

exec "${runtime}" build \
    --build-arg "STEAMOS_REPOSITORY_SUFFIX=${repo_suffix}" \
    -t "${IMAGE_NAME}" \
    "$@" \
    .
