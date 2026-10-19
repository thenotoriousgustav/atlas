"""Run with: python3 docker/test-init-env.py"""
import os
import shlex
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as directory:
    script = Path(directory) / "init-env.py"
    shutil.copyfile(Path(__file__).with_name("init-env.py"), script)
    env = {**os.environ, "ADMIN_EMAIL": "admin@example.com", "ADMIN_NAME": "Test Admin"}
    subprocess.run([sys.executable, str(script)], env=env, check=True, capture_output=True)
    path = script.with_name(".env")
    original = path.read_bytes()
    values = {key: shlex.split(value)[0] for key, value in (line.split("=", 1) for line in path.read_text().splitlines())}
    assert path.stat().st_mode & 0o777 == 0o600
    assert len(values["BETTER_AUTH_SECRET"]) >= 32
    assert len(values["POSTGRES_PASSWORD"]) >= 32
    assert len(values["ADMIN_PASSWORD"]) >= 24
    assert values["ADMIN_NAME"] == "Test Admin"
    assert subprocess.run([sys.executable, str(script)], env=env, capture_output=True).returncode != 0
    assert path.read_bytes() == original
    path.unlink()
    env["ADMIN_NAME"] = "bad\nINJECTED=value"
    assert subprocess.run([sys.executable, str(script)], env=env, capture_output=True).returncode != 0
    assert not path.exists()
print("PASS: strong secrets, restrictive permissions, no overwrite, invalid input rejected")
