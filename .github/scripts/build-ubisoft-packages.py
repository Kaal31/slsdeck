#!/usr/bin/env python3
"""Build the rolling, AppID-keyed Ubisoft care-package dependency."""

import argparse
import hashlib
import json
import shutil
import tempfile
import urllib.request
import zipfile
from pathlib import Path, PurePosixPath


ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "assets" / "ubisoft-packages" / "hostedgames.json"
SOURCE_URL = "https://files.luastools.xyz/carepackage/{care_package_id}.zip"


def safe_extract(archive: zipfile.ZipFile, destination: Path) -> None:
    for member in archive.infolist():
        path = PurePosixPath(member.filename)
        if path.is_absolute() or ".." in path.parts:
            raise RuntimeError(f"Unsafe archive path: {member.filename}")
    archive.extractall(destination)


def fetch_archive(game: dict, destination: Path, source_dir: Path | None) -> None:
    package_id = str(game["carePackageId"])
    if source_dir:
        shutil.copyfile(source_dir / f"{package_id}.zip", destination)
    else:
        request = urllib.request.Request(
            SOURCE_URL.format(care_package_id=package_id),
            headers={"User-Agent": "SLSDeck-Ubisoft-Packages/1.0"},
        )
        with urllib.request.urlopen(request, timeout=120) as response, destination.open("wb") as output:
            shutil.copyfileobj(response, output)
    digest = hashlib.sha256(destination.read_bytes()).hexdigest()
    if digest != game["sourceSha256"]:
        raise RuntimeError(f"SHA-256 mismatch for care package {package_id}: {digest}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=str(ROOT / "ubisoft-packages.zip"))
    parser.add_argument("--source-dir", type=Path)
    args = parser.parse_args()

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    output = Path(args.output).resolve()
    with tempfile.TemporaryDirectory(prefix="slsdeck-ubisoft-packages-") as temporary:
        temporary_path = Path(temporary)
        asset_root = temporary_path / "ubisoft-packages"
        asset_root.mkdir()
        shutil.copyfile(MANIFEST, asset_root / "hostedgames.json")

        for game in manifest["games"]:
            package_id = str(game["carePackageId"])
            steam_appid = str(game["steamAppId"])
            archive_path = temporary_path / f"{package_id}.zip"
            expanded_path = temporary_path / f"expanded-{package_id}"
            fetch_archive(game, archive_path, args.source_dir)
            with zipfile.ZipFile(archive_path) as archive:
                safe_extract(archive, expanded_path)
            source_root = expanded_path / package_id
            if not source_root.is_dir():
                raise RuntimeError(f"Care package {package_id} has no {package_id}/ root")
            shutil.copytree(source_root, asset_root / steam_appid)

        output.unlink(missing_ok=True)
        with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for path in sorted(asset_root.rglob("*")):
                if path.is_file():
                    archive.write(path, path.relative_to(temporary_path).as_posix())

    print(output)


if __name__ == "__main__":
    main()
