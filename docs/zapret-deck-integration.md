# zapret-deck integration

This development branch starts from experimental and adapts backend ideas from rosakodu/zapret-deck into SLSDeck's existing optional bol-van/zapret dependency.

## Implemented

- Dedicated headless nfqws backend with nftables table inet slsdeck_zapret and NFQUEUE 220.
- Three bounded profiles: TCP multisplit, TCP fake, and TCP plus QUIC.
- Removal of SLSDeck's previous iptables queue 210 during backend migration.
- Explicit conflict detection for zapret-deck's inet zapretunix table; SLSDeck never removes that table.
- Custom domain-only list RPC with validation, de-duplication, and preservation across reinstall/update of Zapret.
- Profile selection through the existing Decky Dependencies UI.
- Backend boot recovery through SLSDeck's existing resume_if_enabled() callback.
- Branch-specific release package, with build number embedded for updater tracking.
- Offline unit tests for own-table cleanup, nft command creation, validation and profile selection.

## Not yet implemented or verified

- Actual SteamOS device verification (needs root nftables and nfqws).
- Full upstream zapret-deck strategy collection and automated strategy testing.
- Independent systemd boot service: enabling a second boot owner would be unsafe until lifecycle and reinstall behavior are tested. Current boot recovery is via Decky.
- Cloudflare WARP: requires separate opt-in, route and DNS safeguards, and its own dependency lifecycle.
- An advanced hostlist editor in the UI (the backend RPC exists).

## Testing on Steam Deck

1. Install but do not enable; confirm no SLSDeck nftables table has been added.
2. Enable a TCP profile, then inspect: sudo nft list table inet slsdeck_zapret.
3. Verify that no legacy SLSDeck iptables queue 210 remains and that unrelated nftables rules are unchanged.
4. Change to TCP plus QUIC. Check connectivity before and after, and ensure the prior process has been stopped.
5. Disable; verify only the slsdeck_zapret table and SLSDeck process disappear.
6. Restart Decky / reboot and verify saved profile restoration.
7. Run with standalone zapret-deck enabled: SLSDeck must refuse to start rather than overwrite the other plugin's rules.
8. Perform updater-managed reinstall and verify custom list and profile state remain intact.

## Credits

Backend design informed by rosakodu/zapret-deck (Copyright 2026 rosakodu, BSD-3-Clause). The native engine continues to be installed from bol-van/zapret. No upstream UI or strategy catalog was copied.
