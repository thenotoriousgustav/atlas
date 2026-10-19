"""Create docker/.env once, without printing credentials or overwriting existing secrets."""
import os
import secrets
from pathlib import Path

path = Path(__file__).with_name(".env")
values = {
    "IMAGE_TAG": os.environ.get("IMAGE_TAG", "latest"),
    "POSTGRES_USER": "cabinet",
    "POSTGRES_DB": "cabinet",
    "POSTGRES_PASSWORD": secrets.token_hex(32),
    "BETTER_AUTH_SECRET": secrets.token_hex(48),
    "ADMIN_EMAIL": os.environ.get("ADMIN_EMAIL", "admin@example.com"),
    "ADMIN_PASSWORD": secrets.token_urlsafe(24),
    "ADMIN_NAME": os.environ.get("ADMIN_NAME", "Admin"),
    "FRONTEND_URL": "http://localhost:3000",
    "API_URL": "http://localhost:4000",
    "COOKIE_DOMAIN": "localhost",
}
for key, value in values.items():
    if any(character in value for character in "\n\r'"):
        raise ValueError(f"Invalid {key}: newlines and single quotes are not supported")
with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), "w") as file:
    for key, value in values.items():
        file.write(f"{key}='{value}'\n")
print(f"Created {path} (mode 600). Credentials were not displayed.")
