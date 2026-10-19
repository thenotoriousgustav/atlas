"""Run after loading docker/.env into the environment; creates and removes one test note."""
import json
import os
import uuid
from http.cookies import SimpleCookie
from urllib.error import HTTPError
from urllib.request import Request, urlopen

base = os.environ.get("API_URL", "http://localhost:4000").rstrip("/")
origin = os.environ.get("FRONTEND_URL", "http://localhost:3000")
cookie = ""


def request(method, path, data=None, expected=200):
    headers = {"Origin": origin, "Content-Type": "application/json", "Cookie": cookie}
    req = Request(base + path, data=json.dumps(data).encode() if data is not None else None, headers=headers, method=method)
    try:
        response = urlopen(req, timeout=15)
    except HTTPError as error:
        response = error
    assert response.status == expected, f"{method} {path}: HTTP {response.status}, expected {expected}"
    body = json.loads(response.read())
    return body.get("data", body), response.headers


assert request("GET", "/v1/health")[0]["status"] == "ok"
request("GET", "/v1/bookmarks", expected=401)
_, headers = request("POST", "/v1/auth/sign-in/email", {
    "email": os.environ["ADMIN_EMAIL"], "password": os.environ["ADMIN_PASSWORD"],
})
parts = SimpleCookie()
for value in headers.get_all("Set-Cookie", []):
    parts.load(value)
cookie = "; ".join(f"{name}={value.value}" for name, value in parts.items())
assert cookie, "Login must issue a session cookie"
assert request("GET", "/v1/auth/get-session")[0]["user"]["email"] == os.environ["ADMIN_EMAIL"]
request("GET", "/v1/bookmarks?limit=20")
request("GET", "/v1/folders")
request("GET", "/v1/tags")

note_id = str(uuid.uuid4())
created = False
try:
    note, _ = request("PUT", f"/v1/bookmarks/{note_id}/note", {
        "title": "Deployment smoke check", "notes": "Temporary deployment check",
        "noteDocument": {"type": "doc", "content": [{"type": "paragraph"}]},
    })
    created = True
    assert note["id"] == note_id and note["type"] == "NOTE"
    request("GET", f"/v1/bookmarks/{note_id}")
finally:
    if created:
        request("DELETE", f"/v1/bookmarks/{note_id}/permanent")
    request("POST", "/v1/auth/sign-out", {})
print("PASS: health, session login, protected routes, bookmark/folder/tag queries, note save/read/delete, logout")
