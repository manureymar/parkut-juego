"""Restore the exact uploaded GLBs from the lossless GitHub archives."""
from pathlib import Path
import gzip
import hashlib
import json
import shutil

root = Path(__file__).resolve().parents[2]
folder = root / "assets-originales"
manifest = json.loads((folder / "manifest.json").read_text())
for item in manifest:
    target = folder / item["filename"]
    if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() == item["sha256"]:
        print("Verified:", item["filename"])
        continue
    tmp = target.with_suffix(".glb.restoring")
    with gzip.open(folder / item["archive"], "rb") as source, tmp.open("wb") as dest:
        shutil.copyfileobj(source, dest)
    if hashlib.sha256(tmp.read_bytes()).hexdigest() != item["sha256"]:
        tmp.unlink()
        raise RuntimeError("Checksum mismatch: " + item["filename"])
    tmp.replace(target)
    print("Restored:", item["filename"])
