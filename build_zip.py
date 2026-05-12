#!/usr/bin/env python3
"""
Build a ZIP-archived add-in for MyGeotab upload.

Usage: python build_zip.py
Output: releases/smas-mobility-fleet-report.zip

The releases/ folder is committed to git so partners can download the
ZIP directly from the GitHub repo.

Structure matches the working SampleAddins.zip pattern:
  configuration.json           <- note: "configuration.json", not "config.json"
  SMAS Mobility Fleet Report/
    index.html
    main.js
    main.css
    icon.svg
"""

import base64
import json
import zipfile
import re
from pathlib import Path

ROOT = Path(__file__).parent
RELEASES = ROOT / "releases"
ADDIN_FOLDER = "SMAS Mobility Fleet Report"

SOURCE_FILES = {
    "index.html": ROOT / "index.html",
    "main.js": ROOT / "scripts" / "main.js",
    "main.css": ROOT / "styles" / "main.css",
    "icon.svg": ROOT / "images" / "icon.svg",
}


def patch_html(html: str) -> str:
    """Rewrite paths in HTML to match the flat folder structure."""
    # Change styles/main.css -> main.css
    html = re.sub(r'href="styles/main\.css"', 'href="main.css"', html)
    # Change scripts/main.js -> main.js
    html = re.sub(r'src="scripts/main\.js"', 'src="main.js"', html)
    return html


def main():
    print("Building ZIP archive...")

    # Embed icon as base64 data URI (relative paths don't resolve for ZIP add-ins)
    icon_bytes = SOURCE_FILES["icon.svg"].read_bytes()
    icon_data_uri = f"data:image/svg+xml;base64,{base64.b64encode(icon_bytes).decode('ascii')}"

    # Configuration uses leading-slash paths to files in ZIP
    config = {
        "name": "SMAS Mobility Fleet Report",
        "supportEmail": "farinnugraha@geotab.com",
        "version": "1.0.0",
        "items": [
            {
                "version": "1.0.0",
                "url": f"/{ADDIN_FOLDER}/index.html",
                "category": "ReportsId",
                "menuName": {"en": "SMAS Mobility Fleet Report"},
                "icon": icon_data_uri,
            }
        ],
    }

    RELEASES.mkdir(parents=True, exist_ok=True)
    zip_path = RELEASES / "smas-mobility-fleet-report.zip"

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        # Write configuration.json at root
        zf.writestr("configuration.json", json.dumps(config, indent=2))

        # Write source files into the add-in folder
        for filename, source_path in SOURCE_FILES.items():
            archive_path = f"{ADDIN_FOLDER}/{filename}"
            if filename == "index.html":
                # Patch HTML paths
                content = patch_html(source_path.read_text(encoding="utf-8"))
                zf.writestr(archive_path, content)
            else:
                zf.write(source_path, archive_path)

    # Show results
    print(f"\nCreated: {zip_path}")
    print(f"Size: {zip_path.stat().st_size / 1024:.1f} KB")
    print("\nZIP contents:")
    with zipfile.ZipFile(zip_path) as zf:
        for info in zf.infolist():
            print(f"  {info.filename}")

    print("\nTo install:")
    print("  1. MyGeotab -> Administration -> System -> System Settings -> Add-Ins")
    print("  2. New Add-In -> upload the ZIP file")
    print("  3. OK -> Save -> Refresh page")
    print("  4. Look under Reports -> SMAS Mobility Fleet Report")


if __name__ == "__main__":
    main()
