#!/usr/bin/env python3
"""Экспорт фреймов со страницы CLUBS / TELEGRAM READY через Figma REST API.

  python export_figma.py            — экспортировать все фреймы из posts.json в assets/<id>/
  python export_figma.py --ids 253,411 --scale 1 --force

Нужны FIGMA_TOKEN (personal access token, Figma → Settings → Security) и FIGMA_FILE_KEY
(ключ файла из URL figma.com/design/<key>/…; по умолчанию берётся из posts.json).

Важно: шрифты PP Mondwest / PP NeueBit локальные, облачный рендер Figma может подставить
другой шрифт. Если результат отличается от того, что видно в Figma Desktop — экспортируйте
фреймы вручную (Export PNG 1x) и положите файлы в assets/<id>/ под именами из posts.json.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Dict, List, Tuple

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
from bot import Config, load_manifest, media_path  # noqa: E402

BATCH = 40


def figma_get(url: str, token: str) -> dict:
    req = urllib.request.Request(url, headers={"X-Figma-Token": token})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def render_urls(file_key: str, node_ids: List[str], token: str, scale: float, fmt: str) -> Dict[str, str]:
    """Возвращает {node_id: url}. Figma рендерит асинхронно — при пустых url повторяем."""
    urls: Dict[str, str] = {}
    for i in range(0, len(node_ids), BATCH):
        chunk = node_ids[i:i + BATCH]
        query = urllib.parse.urlencode({"ids": ",".join(chunk), "format": fmt, "scale": scale})
        for attempt in range(6):
            data = figma_get(f"https://api.figma.com/v1/images/{file_key}?{query}", token)
            if data.get("err"):
                raise RuntimeError(f"Figma: {data['err']}")
            images = data.get("images", {})
            pending = [n for n in chunk if not images.get(n)]
            urls.update({n: u for n, u in images.items() if u})
            if not pending:
                break
            time.sleep(3 * (attempt + 1))
        else:
            missing = [n for n in chunk if n not in urls]
            if missing:
                print(f"⚠ Figma не отрендерила: {', '.join(missing)}")
    return urls


def download(url: str, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=300) as resp, open(target, "wb") as f:
        while True:
            chunk = resp.read(1 << 20)
            if not chunk:
                break
            f.write(chunk)


def main() -> int:
    parser = argparse.ArgumentParser(description="Экспорт PNG из Figma для бота Clubs News")
    parser.add_argument("--ids", help="только эти посты, через запятую (например 253,411)")
    parser.add_argument("--scale", type=float, default=1.0, help="масштаб экспорта (0.01–4)")
    parser.add_argument("--format", default="png", choices=["png", "jpg"])
    parser.add_argument("--force", action="store_true", help="перезаписывать существующие файлы")
    args = parser.parse_args()

    cfg = Config()
    token = cfg.figma_token
    if not token:
        sys.exit("FIGMA_TOKEN не задан (.env или переменная окружения)")
    manifest = load_manifest(cfg.posts_file)
    file_key = cfg.figma_file_key or manifest.get("figma_file_key", "")
    if not file_key:
        sys.exit("FIGMA_FILE_KEY не задан и в posts.json нет figma_file_key")

    wanted = set(args.ids.split(",")) if args.ids else None
    jobs: List[Tuple[str, Path]] = []
    for post in manifest["posts"]:
        if wanted and str(post["id"]) not in wanted:
            continue
        for item in post["media"]:
            node = item.get("node")
            if not node:
                continue
            target = media_path(post, item, cfg.assets_dir)
            if target.exists() and not args.force:
                continue
            jobs.append((node, target))
    if not jobs:
        print("Все файлы уже на месте (используйте --force для перезаписи).")
        return 0
    print(f"Рендерю {len(jobs)} фрейм(ов) из файла {file_key} …")
    urls = render_urls(file_key, [n for n, _ in jobs], token, args.scale, args.format)
    failed = 0
    for node, target in jobs:
        url = urls.get(node)
        if not url:
            failed += 1
            print(f"⛔ {node} → {target.relative_to(cfg.assets_dir)}: нет url")
            continue
        try:
            download(url, target)
            print(f"✅ {target.relative_to(cfg.assets_dir)}")
        except (urllib.error.URLError, OSError) as e:
            failed += 1
            print(f"⛔ {target.relative_to(cfg.assets_dir)}: {e}")
    print(f"\nГотово: {len(jobs) - failed} ок, {failed} с ошибками. Проверка: python bot.py check")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
