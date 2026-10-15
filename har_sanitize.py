#!/usr/bin/env python3
"""Очистка HAR перед отправкой в LLM.

- оставляет запросы, важные для сценария: document, xhr/fetch, редиректы, ответы с Set-Cookie;
- выкидывает статику, трекеры и CORS-preflight;
- заменяет секреты (cookie, токены, пароли, CSRF, email) на СОГЛАСОВАННЫЕ плейсхолдеры:
  одно и то же значение везде становится одним и тем же <SECRET_N:имя>, поэтому LLM
  может проследить, из какого ответа токен попал в какой запрос;
- обрезает большие тела ответов.

Использование:
    python3 har_sanitize.py input.har clean.har [--max-body 20000] [--keep-domain example.com]
"""
import argparse
import base64
import json
import re
import sys
from urllib.parse import parse_qsl, urlsplit

STATIC_TYPES = {"image", "font", "stylesheet", "script", "media", "manifest", "texttrack", "ping", "websocket"}
STATIC_EXT = re.compile(r"\.(js|mjs|css|map|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|otf|mp4|webm|mp3)(\?|$)", re.I)
TRACKERS = re.compile(
    r"(google-analytics|googletagmanager|doubleclick|mc\.yandex|yandex\.ru/(metrika|clck)|sentry|hotjar|"
    r"facebook\.(com|net)|vk\.com/rtrg|top-fwz|mail\.ru/counter|clarity\.ms|newrelic|datadoghq|segment\.io)",
    re.I,
)
SECRET_KEY = re.compile(
    r"(token|passw|pwd|secret|session|sess|sid|csrf|xsrf|auth|otp|sms.?code|pin|signature|nonce|cookie|jwt|api.?key)",
    re.I,
)
PASSWORD_KEY = re.compile(r"(passw|pwd)", re.I)
HIDDEN_INPUT = re.compile(
    r"<input[^>]*name=[\"']([^\"']*(?:csrf|token|verification|nonce|state)[^\"']*)[\"'][^>]*value=[\"']([^\"']+)[\"']",
    re.I,
)
META_CSRF = re.compile(r"<meta[^>]*name=[\"']([^\"']*csrf[^\"']*)[\"'][^>]*content=[\"']([^\"']+)[\"']", re.I)
EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE = re.compile(r"(?<!\d)(?:\+7|8)[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}(?!\d)")
DROP_ENTRY_KEYS = ("cache", "timings", "_initiator", "_priority", "_fromCache", "connection", "serverIPAddress")
MIN_SECRET_LEN = 6


class Masker:
    def __init__(self):
        self.map = {}

    def add(self, value, name):
        if not isinstance(value, str):
            return
        value = value.strip()
        if value.lower().startswith("bearer "):
            value = value[7:].strip()
        if len(value) < MIN_SECRET_LEN or value in self.map:
            return
        if PASSWORD_KEY.search(name):
            self.map[value] = "<PASSWORD>"
        else:
            safe = re.sub(r"[^\w.-]", "_", name)[:40]
            self.map[value] = f"<SECRET_{len(self.map) + 1}:{safe}>"

    def apply(self, text):
        if not isinstance(text, str) or not text:
            return text
        for value in sorted(self.map, key=len, reverse=True):
            if value in text:
                text = text.replace(value, self.map[value])
        text = EMAIL.sub("<EMAIL>", text)
        text = PHONE.sub("<PHONE>", text)
        return text


def collect_json(obj, masker, key=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            collect_json(v, masker, k)
    elif isinstance(obj, list):
        for v in obj:
            collect_json(v, masker, key)
    elif isinstance(obj, str) and SECRET_KEY.search(key):
        masker.add(obj, key)


def collect_body(text, mime, masker):
    if not text:
        return
    mime = (mime or "").lower()
    stripped = text.lstrip()
    if "json" in mime or stripped[:1] in "{[":
        try:
            collect_json(json.loads(text), masker)
            return
        except ValueError:
            pass
    if "x-www-form-urlencoded" in mime:
        for k, v in parse_qsl(text, keep_blank_values=True):
            if SECRET_KEY.search(k):
                masker.add(v, k)
    if "html" in mime or stripped[:1] == "<":
        for name, value in HIDDEN_INPUT.findall(text) + META_CSRF.findall(text):
            masker.add(value, name)


def collect_cookies(header_value, masker):
    for part in header_value.split(";"):
        if "=" in part:
            name, value = part.split("=", 1)
            name = name.strip()
            if name.lower() not in {"path", "domain", "expires", "max-age", "samesite"}:
                masker.add(value, "cookie_" + name)


def decode_content(content):
    text = content.get("text")
    if text and content.get("encoding") == "base64":
        mime = (content.get("mimeType") or "").lower()
        if any(t in mime for t in ("json", "text", "html", "xml", "javascript")):
            try:
                content["text"] = base64.b64decode(text).decode("utf-8", "replace")
                content.pop("encoding")
            except ValueError:
                pass
        else:
            content["text"] = f"<binary {mime}, {len(text)} base64 chars dropped>"
            content.pop("encoding")


def keep(entry, keep_domains):
    req, resp = entry["request"], entry["response"]
    url = req["url"]
    host = urlsplit(url).hostname or ""
    if keep_domains and not any(host == d or host.endswith("." + d) for d in keep_domains):
        return False
    if req["method"] == "OPTIONS" or TRACKERS.search(url):
        return False
    status = resp.get("status", 0)
    sets_cookie = any(h["name"].lower() == "set-cookie" for h in resp.get("headers", []))
    if 300 <= status < 400 or sets_cookie:
        return True
    if entry.get("_resourceType") in STATIC_TYPES or STATIC_EXT.search(urlsplit(url).path):
        return False
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--max-body", type=int, default=20000, help="макс. длина тела ответа (символов)")
    ap.add_argument("--keep-domain", action="append", default=[], help="оставить только этот домен (можно несколько)")
    args = ap.parse_args()

    with open(args.src, encoding="utf-8-sig") as f:
        har = json.load(f)
    entries = har["log"]["entries"]
    kept = [e for e in entries if keep(e, args.keep_domain)]

    masker = Masker()
    for e in kept:
        req, resp = e["request"], e["response"]
        decode_content(resp.get("content", {}))
        for h in req.get("headers", []) + resp.get("headers", []):
            n = h["name"].lower()
            if n in ("cookie", "set-cookie"):
                collect_cookies(h["value"], masker)
            elif SECRET_KEY.search(n):
                masker.add(h["value"], h["name"])
        for c in req.get("cookies", []) + resp.get("cookies", []):
            masker.add(c.get("value"), "cookie_" + c.get("name", ""))
        for q in req.get("queryString", []):
            if SECRET_KEY.search(q["name"]):
                masker.add(q["value"], q["name"])
        post = req.get("postData") or {}
        for p in post.get("params", []) or []:
            if SECRET_KEY.search(p.get("name", "")):
                masker.add(p.get("value"), p["name"])
        collect_body(post.get("text"), post.get("mimeType"), masker)
        content = resp.get("content", {})
        collect_body(content.get("text"), content.get("mimeType"), masker)

    out = []
    for i, e in enumerate(kept, 1):
        for k in DROP_ENTRY_KEYS:
            e.pop(k, None)
        content = e["response"].get("content", {})
        text = content.get("text")
        if isinstance(text, str) and len(text) > args.max_body:
            content["text"] = text[: args.max_body] + f"\n...<truncated, total {len(text)} chars>"
        e = mask_tree(e, masker)
        e["_seq"] = i
        out.append(e)

    har["log"]["entries"] = out
    har["log"].pop("pages", None)
    with open(args.dst, "w", encoding="utf-8") as f:
        json.dump(har, f, ensure_ascii=False, indent=1)
    print(f"entries: {len(entries)} -> {len(out)}; masked values: {len(masker.map)}", file=sys.stderr)


def mask_tree(obj, masker):
    if isinstance(obj, dict):
        return {k: mask_tree(v, masker) for k, v in obj.items()}
    if isinstance(obj, list):
        return [mask_tree(v, masker) for v in obj]
    if isinstance(obj, str):
        return masker.apply(obj)
    return obj


if __name__ == "__main__":
    main()
