#!/usr/bin/env bash
set -euo pipefail

readonly MIRROR='https://steamdeck-packages.steamos.cloud/archlinux-mirror'
readonly HOST_ROOT="${HOST_ROOT:-/host}"
readonly KERNEL_RELEASE="${KERNEL_RELEASE:-$(uname -r)}"
readonly ARCHITECTURE="$(uname -m)"

if [[ -n "${STEAMOS_REPOSITORY:-}" ]]; then
    repo="${STEAMOS_REPOSITORY}"
elif [[ -r "${HOST_ROOT}/etc/pacman.conf" ]]; then
    repo="$(awk '/^\[jupiter-[^]]+\]$/ { gsub(/^\[|\]$/, ""); print; exit }' \
        "${HOST_ROOT}/etc/pacman.conf")"
else
    echo "Cannot determine the host SteamOS Jupiter repository." >&2
    exit 1
fi

if [[ ! "${repo}" =~ ^jupiter-[A-Za-z0-9][A-Za-z0-9._-]*$ ]]; then
    echo "Unknown Jupiter repository: ${repo:-<empty>}" >&2
    exit 1
fi

if [[ "${ARCHITECTURE}" != 'x86_64' ]]; then
    echo "Unsupported architecture: ${ARCHITECTURE}" >&2
    exit 1
fi

if [[ ! "${KERNEL_RELEASE}" =~ ^(.+)-([0-9]+(\.[0-9]+)?)-(neptune(-[0-9]+)?)(-g[0-9a-fA-F]+)?$ ]]; then
    echo "Cannot derive an exact headers archive from ${KERNEL_RELEASE}." >&2
    exit 1
fi

kernel_package="linux-${BASH_REMATCH[4]}"
package_version="${BASH_REMATCH[1]/-valve/.valve}"
package_release="${BASH_REMATCH[2]}"
headers_filename="${kernel_package}-headers-${package_version}-${package_release}-${ARCHITECTURE}.pkg.tar.zst"
repository_url="${MIRROR}/${repo}/os/${ARCHITECTURE}/"
repository_index='/tmp/jupiter-repository-index.html'

curl -fsSL --max-time 20 "${repository_url}" -o "${repository_index}"

if ! grep -Fq "href=\"${headers_filename}\"" "${repository_index}"; then
    xz_filename="${headers_filename%.zst}.xz"
    if grep -Fq "href=\"${xz_filename}\"" "${repository_index}"; then
        headers_filename="${xz_filename}"
    else
        echo "No exact headers archive exists for ${KERNEL_RELEASE}." >&2
        echo "Expected in ${repository_url}: ${headers_filename}" >&2
        exit 1
    fi
fi

headers_url="${repository_url}${headers_filename}"

host_repo_suffix="${repo#jupiter-}"
if [[ "${host_repo_suffix}" != "${STEAMOS_REPOSITORY_SUFFIX}" ]]; then
    echo "The image and host use different SteamOS repositories." >&2
    echo "Image: ${STEAMOS_REPOSITORY_SUFFIX} host: ${host_repo_suffix}" >&2
    exit 1
fi

echo "kernel: ${KERNEL_RELEASE}"
echo "repo: ${repo}"
echo "headers: ${headers_url}"

printf '%s\n' \
    '[options]' \
    'Architecture = auto' \
    'SigLevel = Required DatabaseOptional' \
    'LocalFileSigLevel = Optional' \
    'ParallelDownloads = 5' \
    '' \
    "[${repo}]" \
    "Server = ${MIRROR}/\$repo/os/\$arch" \
    '' \
    "[holo-${host_repo_suffix}]" \
    "Server = ${MIRROR}/\$repo/os/\$arch" \
    '' \
    "[core-${host_repo_suffix}]" \
    "Server = ${MIRROR}/\$repo/os/\$arch" \
    '' \
    "[extra-${host_repo_suffix}]" \
    "Server = ${MIRROR}/\$repo/os/\$arch" \
    > /etc/pacman.conf

pacman -U --needed --noconfirm "${headers_url}"

header_dir="/usr/lib/modules/${KERNEL_RELEASE}/build"
if [[ ! -e "${header_dir}" ]]; then
    echo "The installed headers do not match the host kernel." >&2
    echo "current: ${header_dir}" >&2
    exit 1
fi

export KERNEL_RELEASE
export KERNEL_HEADERS="${header_dir}"

exec "$@"
