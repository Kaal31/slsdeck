# this is an "updated" Dockerfile from my original provided from a user in Discord. I have looked and unfortunately am not longer sure which user provided it.

# 1. Define global ARGs before the first FROM so they are accessible across stages
ARG STEAMOS_REPOSITORY_SUFFIX

FROM archlinux:latest AS bootstrap

# Re-declare the global ARG inside this stage
ARG STEAMOS_REPOSITORY_SUFFIX
ENV LANG=C.UTF-8

# 2. Optimized validation and package initialization
RUN test -n "${STEAMOS_REPOSITORY_SUFFIX}" || \
        { echo 'STEAMOS_REPOSITORY_SUFFIX is required; use ./build.sh.' >&2; exit 1; } && \
    case "${STEAMOS_REPOSITORY_SUFFIX}" in \
        *[!A-Za-z0-9._-]*) \
            echo 'STEAMOS_REPOSITORY_SUFFIX contains invalid characters.' >&2; \
            exit 1 \
            ;; \
        *) true ;; \
    esac

# 3. Consolidate repository setup to leverage Docker's layer cache properly
RUN pacman -Syu --needed --noconfirm && \
    pacman-key --init && \
    pacman-key --populate archlinux && \
    printf '%s\n' \
        "[holo-${STEAMOS_REPOSITORY_SUFFIX}]" \
        'SigLevel = Required DatabaseOptional TrustAll' \
        "Server = https://steamdeck-packages.steamos.cloud/archlinux-mirror/holo-${STEAMOS_REPOSITORY_SUFFIX}/os/\$arch" \
        >> /etc/pacman.conf && \
    pacman -Syy --noconfirm && \
    pacman -S --needed --noconfirm holo-keyring && \
    pacman-key --populate holo

# 4. Create directory structure BEFORE running the massive root pacman install
# This allows us to pipe the printf configuration directly to its final destination,
# eliminating an unnecessary temporary file (/tmp/pacman-steamos.conf).
RUN mkdir -p \
        /steamos/etc/pacman.d \
        /steamos/var/cache/pacman/pkg \
        /steamos/var/lib/pacman \
        /steamos/work \
        /steamos/usr/share/pacman/keyrings && \
    printf '%s\n' \
        '[options]' \
        'Architecture = auto' \
        'SigLevel = Required DatabaseOptional' \
        'LocalFileSigLevel = Optional' \
        'ParallelDownloads = 5' \
        '' \
        "[jupiter-${STEAMOS_REPOSITORY_SUFFIX}]" \
        "Server = https://steamdeck-packages.steamos.cloud/archlinux-mirror/\$repo/os/\$arch" \
        '' \
        "[holo-${STEAMOS_REPOSITORY_SUFFIX}]" \
        "Server = https://steamdeck-packages.steamos.cloud/archlinux-mirror/\$repo/os/\$arch" \
        '' \
        "[core-${STEAMOS_REPOSITORY_SUFFIX}]" \
        "Server = https://steamdeck-packages.steamos.cloud/archlinux-mirror/\$repo/os/\$arch" \
        '' \
        "[extra-${STEAMOS_REPOSITORY_SUFFIX}]" \
        "Server = https://steamdeck-packages.steamos.cloud/archlinux-mirror/\$repo/os/\$arch" \
        > /steamos/etc/pacman.conf && \
    cp -a /etc/pacman.d/gnupg /steamos/etc/pacman.d/ && \
    pacman --root /steamos \
        --config /steamos/etc/pacman.conf \
        --gpgdir /steamos/etc/pacman.d/gnupg \
        -Syy --needed --noconfirm \
        base \
        base-devel \
        bc \
        bison \
        cpio \
        curl \
        dkms \
        elfutils \
        flex \
        git \
        jq \
        kmod \
        pahole \
        perl \
        rsync && \
    cp -a /usr/share/pacman/keyrings/holo.gpg \
        /usr/share/pacman/keyrings/holo-revoked \
        /usr/share/pacman/keyrings/holo-trusted \
        /steamos/usr/share/pacman/keyrings/ && \
    find /steamos/var/cache/pacman/pkg -type f -delete

# 5. Move COPY commands to the very end of the bootstrap stage.
# If 'entrypoint.sh' changes, Docker will only re-run this step instead of re-downloading gigabytes of packages.
COPY --chmod=0755 entrypoint.sh /steamos/usr/local/bin/entrypoint.sh

FROM scratch

ARG STEAMOS_REPOSITORY_SUFFIX

LABEL org.opencontainers.image.title="Steam Deck build environment" \
      org.opencontainers.image.description="SteamOS environment for building packages without needing to disable readonly mode"

ENV LANG=C.UTF-8 \
    STEAMOS_REPOSITORY_SUFFIX=${STEAMOS_REPOSITORY_SUFFIX}

COPY --from=bootstrap /steamos /

WORKDIR /work

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/bin/bash"]
