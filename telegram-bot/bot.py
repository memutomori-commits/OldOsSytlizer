#!/usr/bin/env python3
"""Clubs News — бот для публикации оформленных постов (Figma → Telegram).

Без внешних зависимостей: только стандартная библиотека Python 3.9+.

Карусели (и слишком длинные посты) уходят как Rich Messages (Bot API 10.1+): листаемая галерея
+ заголовок + текст + подвал в одном сообщении. Режим задаётся в posts.json: "rich_mode":
"auto" (карусели и длинные тексты), "carousel", "all" или "none" (только классические сообщения).

Режимы:
  python bot.py import <папка>        разложить PNG, экспортированные из Figma, по assets/<id>/
  python bot.py check                 проверить posts.json и наличие PNG в assets/
  python bot.py list                  список постов из posts.json
  python bot.py post <id|all> [--dry-run] [--delay 3]
                                      опубликовать пост(ы) в канал CHANNEL_ID
  python bot.py discover              показать chat_id каналов/чатов, которые видит бот
  python bot.py serve                 long polling: команды в личке с ботом
                                      (/list, /post <id>, /post all, /chatid, /check)

Настройки — переменные окружения или файл .env рядом с ботом (см. .env.example).
"""
from __future__ import annotations

import argparse
import html
import json
import logging
import mimetypes
import os
import re
import shutil
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

API_URL = "https://api.telegram.org/bot{token}/{method}"
CAPTION_LIMIT = 1024          # лимит подписи к медиа в Bot API
TEXT_LIMIT = 4096             # лимит обычного сообщения
MEDIA_GROUP_LIMIT = 10        # максимум элементов в альбоме
RICH_MEDIA_LIMIT = 50         # максимум медиа в rich message
RICH_MODES = ("none", "carousel", "auto", "all")

BASE_DIR = Path(__file__).resolve().parent
log = logging.getLogger("clubs-bot")


# ---------------------------------------------------------------------------
# Конфигурация
# ---------------------------------------------------------------------------
def parse_env_value(raw: str) -> str:
    """Значение из .env: кавычки снимаются, комментарий после « #» и пробелы по краям отбрасываются."""
    value = raw.strip()
    if len(value) >= 2 and value[0] in "\"'" and value[0] in value[1:]:
        quote = value[0]
        return value[1:value.index(quote, 1)]
    return re.split(r"\s+#", value, 1)[0].strip()


def load_dotenv(path: Path) -> None:
    """Минимальный парсер .env: KEY=VALUE, строки с # игнорируются, комментарии после
    значения (« # …») отрезаются. Уже заданные переменные окружения не перезаписываются."""
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        if key.startswith("export "):
            key = key[7:].strip()
        os.environ.setdefault(key, parse_env_value(value))


TOKEN_RE = re.compile(r"^\d{6,}:[A-Za-z0-9_-]{30,}$")
CHAT_ID_RE = re.compile(r"^(-?\d+|@[A-Za-z0-9_]{5,})$")


class Config:
    def __init__(self) -> None:
        load_dotenv(BASE_DIR / ".env")
        self.bot_token = os.environ.get("BOT_TOKEN", "")
        self.channel_id = os.environ.get("CHANNEL_ID", "")
        owners = os.environ.get("OWNER_ID", "")
        self.owner_ids = {int(x) for x in owners.replace(";", ",").split(",") if x.strip().lstrip("-").isdigit()}
        self.assets_dir = Path(os.environ.get("ASSETS_DIR", str(BASE_DIR / "assets")))
        self.posts_file = Path(os.environ.get("POSTS_FILE", str(BASE_DIR / "posts.json")))
        self.figma_token = os.environ.get("FIGMA_TOKEN", "")
        self.figma_file_key = os.environ.get("FIGMA_FILE_KEY", "")

    def require_token(self) -> str:
        if not self.bot_token:
            sys.exit("BOT_TOKEN не задан: добавьте его в .env (строка BOT_TOKEN=...) или в переменные окружения")
        if not TOKEN_RE.match(self.bot_token):
            sys.exit(f"BOT_TOKEN выглядит неверно: {self.bot_token[:14]!r}… В .env должен быть настоящий токен "
                     "из @BotFather вида 123456789:AAH0abc…, без пробелов, кавычек и комментариев.")
        return self.bot_token

    def require_channel(self) -> str:
        if not self.channel_id:
            sys.exit("CHANNEL_ID не задан. Узнать id канала: python bot.py discover (после любого нового поста в канале).")
        if not CHAT_ID_RE.match(self.channel_id):
            sys.exit(f"CHANNEL_ID выглядит неверно: {self.channel_id!r}. Нужен числовой id вида -1001234567890 или @username.")
        return self.channel_id


# ---------------------------------------------------------------------------
# HTTP: multipart/form-data без сторонних библиотек
# ---------------------------------------------------------------------------
def encode_multipart(fields: Dict[str, Any], files: Dict[str, Tuple[str, bytes]]) -> Tuple[bytes, str]:
    """fields: имя → строка/число/bool/dict (dict сериализуется в JSON);
    files: имя поля → (имя файла, байты). Возвращает (тело, Content-Type)."""
    boundary = "clubs" + uuid.uuid4().hex
    out = bytearray()
    for name, value in fields.items():
        if value is None:
            continue
        if isinstance(value, bool):
            value = "true" if value else "false"
        elif isinstance(value, (dict, list)):
            value = json.dumps(value, ensure_ascii=False)
        out += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n".encode()
        out += str(value).encode("utf-8") + b"\r\n"
    for name, (filename, data) in files.items():
        ctype = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        out += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"; "
                f"filename=\"{filename}\"\r\nContent-Type: {ctype}\r\n\r\n").encode()
        out += data + b"\r\n"
    out += f"--{boundary}--\r\n".encode()
    return bytes(out), f"multipart/form-data; boundary={boundary}"


class TelegramError(RuntimeError):
    def __init__(self, method: str, description: str, code: int = 0):
        super().__init__(f"{method}: [{code}] {description}")
        self.method = method
        self.description = description
        self.code = code


def http_transport(token: str, method: str, fields: Dict[str, Any], files: Dict[str, Tuple[str, bytes]],
                   timeout: int = 180) -> Dict[str, Any]:
    url = API_URL.format(token=token, method=method)
    if files:
        body, ctype = encode_multipart(fields, files)
    else:
        body = urllib.parse.urlencode({k: (json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list))
                                           else ("true" if v is True else "false" if v is False else v))
                                       for k, v in fields.items() if v is not None}).encode()
        ctype = "application/x-www-form-urlencoded"
    req = urllib.request.Request(url, data=body, headers={"Content-Type": ctype})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read().decode("utf-8"))
        except Exception:
            raise TelegramError(method, f"HTTP {e.code}", e.code) from e
    if not payload.get("ok"):
        raise TelegramError(method, payload.get("description", "unknown error"), payload.get("error_code", 0))
    return payload["result"]


class Telegram:
    """Тонкая обёртка над Bot API. transport можно подменить в тестах."""

    def __init__(self, token: str, transport: Optional[Callable[..., Any]] = None):
        self.token = token
        self.transport = transport or http_transport

    def call(self, method: str, files: Optional[Dict[str, Tuple[str, bytes]]] = None, **fields: Any) -> Any:
        return self.transport(self.token, method, fields, files or {})

    def get_me(self) -> Dict[str, Any]:
        return self.call("getMe")

    def get_updates(self, offset: Optional[int] = None, timeout: int = 25) -> List[Dict[str, Any]]:
        return self.call("getUpdates", offset=offset, timeout=timeout,
                         allowed_updates=["message", "channel_post", "my_chat_member"])

    def send_message(self, chat_id: Any, text: str, reply_to: Optional[int] = None) -> Dict[str, Any]:
        return self.call("sendMessage", chat_id=chat_id, text=text, parse_mode="HTML",
                         reply_to_message_id=reply_to, disable_web_page_preview=True)

    def send_photo(self, chat_id: Any, photo: Path, caption: Optional[str]) -> Dict[str, Any]:
        return self.call("sendPhoto", files={"photo": (photo.name, photo.read_bytes())},
                         chat_id=chat_id, caption=caption, parse_mode="HTML" if caption else None)

    def send_media_group(self, chat_id: Any, photos: List[Path], caption: Optional[str]) -> List[Dict[str, Any]]:
        media, files = build_media_group(photos, caption)
        return self.call("sendMediaGroup", files=files, chat_id=chat_id, media=media)

    def send_video(self, chat_id: Any, video: Path, cover: Path, caption: Optional[str]) -> Dict[str, Any]:
        files = {"video": (video.name, video.read_bytes()), "cover": (cover.name, cover.read_bytes())}
        try:
            return self.call("sendVideo", files=files, chat_id=chat_id, caption=caption,
                             parse_mode="HTML" if caption else None, cover="attach://cover",
                             supports_streaming=True)
        except TelegramError as e:
            if "cover" not in e.description.lower():
                raise
            log.warning("sendVideo: сервер не принял параметр cover (%s), отправляю как thumbnail", e.description)
            files = {"video": files["video"], "thumbnail": (cover.name, cover.read_bytes())}
            return self.call("sendVideo", files=files, chat_id=chat_id, caption=caption,
                             parse_mode="HTML" if caption else None, thumbnail="attach://thumbnail",
                             supports_streaming=True)


    def send_rich(self, chat_id: Any, blocks: List[Dict[str, Any]], files: Dict[str, Tuple[str, bytes]]) -> Dict[str, Any]:
        """sendRichMessage: блоки slideshow / photo / video / heading / paragraph / footer (Bot API 10.1+)."""
        return self.call("sendRichMessage", files=files, chat_id=chat_id, rich_message={"blocks": blocks})


def build_media_group(photos: List[Path], caption: Optional[str]) -> Tuple[List[Dict[str, Any]], Dict[str, Tuple[str, bytes]]]:
    """Собирает InputMediaPhoto[] и словарь файлов для multipart. Подпись — у первого элемента."""
    if not photos:
        raise ValueError("пустой альбом")
    if len(photos) > MEDIA_GROUP_LIMIT:
        raise ValueError(f"в альбоме максимум {MEDIA_GROUP_LIMIT} элементов, получено {len(photos)}")
    media: List[Dict[str, Any]] = []
    files: Dict[str, Tuple[str, bytes]] = {}
    for i, p in enumerate(photos):
        key = f"file{i}"
        files[key] = (p.name, p.read_bytes())
        item: Dict[str, Any] = {"type": "photo", "media": f"attach://{key}"}
        if i == 0 and caption:
            item["caption"] = caption
            item["parse_mode"] = "HTML"
        media.append(item)
    return media, files


# ---------------------------------------------------------------------------
# Манифест постов
# ---------------------------------------------------------------------------
FOOTER_MARKERS = ("top news:", "🙂top news", "join clubs community", "join @clubs community",
                  "clubs library //", "clubs сhat //", "clubs chat //", "en chat // ru chat")


def strip_channel_footer(text: str) -> str:
    """Убирает служебный «подвал» канала (Top news / Join chat …) из текста поста."""
    lines = text.rstrip().split("\n")
    while lines:
        tail = lines[-1].strip().lower()
        if not tail or any(tail.startswith(m) or tail == m for m in FOOTER_MARKERS):
            lines.pop()
            continue
        break
    return "\n".join(lines).rstrip()


def load_manifest(path: Path) -> Dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if "posts" not in data or not isinstance(data["posts"], list):
        raise ValueError("posts.json: нет массива posts")
    mode = str(data.get("rich_mode", "auto")).lower()
    if mode not in RICH_MODES:
        raise ValueError(f"posts.json: rich_mode {mode!r} не поддерживается, допустимо: {', '.join(RICH_MODES)}")
    seen = set()
    for post in data["posts"]:
        for key in ("id", "type", "media"):
            if key not in post:
                raise ValueError(f"posts.json: у поста нет поля {key!r}: {post}")
        if post["id"] in seen:
            raise ValueError(f"posts.json: дублируется id {post['id']}")
        seen.add(post["id"])
        if not post["media"]:
            raise ValueError(f"posts.json: у поста {post['id']} пустой media")
    return data


def find_post(manifest: Dict[str, Any], post_id: str) -> Dict[str, Any]:
    for post in manifest["posts"]:
        if str(post["id"]) == str(post_id):
            return post
    raise KeyError(f"пост {post_id} не найден в posts.json")


def media_path(post: Dict[str, Any], item: Dict[str, Any], assets_dir: Path) -> Path:
    return assets_dir / str(post["id"]) / item["file"]


def missing_assets(post: Dict[str, Any], assets_dir: Path) -> List[Path]:
    return [p for p in (media_path(post, m, assets_dir) for m in post["media"]) if not p.exists()]


def build_caption(post: Dict[str, Any], manifest: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
    """Возвращает (подпись к медиа, текст отдельного сообщения).

    Если полный текст с подвалом помещается в CAPTION_LIMIT — он идёт подписью, второго
    сообщения нет. Иначе подписью становится только заголовок (первая строка), а полный
    текст уходит отдельным сообщением-ответом на медиа."""
    raw = post.get("caption", "") or ""
    text = html.escape(raw, quote=False)
    footer = manifest.get("footer_html", "") if post.get("append_footer", True) else ""
    full = text + ("\n\n" + footer if footer else "")
    if post.get("type") == "video" and post.get("video", {}).get("duration"):
        full += f"\n🎬 {post['video']['duration']}"
    if len(full) <= CAPTION_LIMIT:
        return full, None
    headline = text.split("\n", 1)[0].strip()
    short = f"<b>{headline}</b>" if headline else None
    if short and len(short) > CAPTION_LIMIT:
        short = short[: CAPTION_LIMIT - 5] + "…</b>"
    if len(full) > TEXT_LIMIT:
        full = full[: TEXT_LIMIT - 1] + "…"
    return short, full


def ensure_video_file(post: Dict[str, Any], assets_dir: Path) -> Optional[Path]:
    """Локальный файл видео (assets/<id>/<file>); если его нет, но есть url — скачивает."""
    video = post.get("video") or {}
    if not video:
        return None
    target = assets_dir / str(post["id"]) / video.get("file", "video.mp4")
    if target.exists():
        return target
    url = video.get("url")
    if not url:
        return None
    target.parent.mkdir(parents=True, exist_ok=True)
    log.info("скачиваю видео для #%s …", post["id"])
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=300) as resp, open(target, "wb") as f:
            while True:
                chunk = resp.read(1 << 20)
                if not chunk:
                    break
                f.write(chunk)
    except Exception as e:  # noqa: BLE001
        log.warning("не удалось скачать видео #%s: %s", post["id"], e)
        if target.exists():
            target.unlink()
        return None
    return target


# ---------------------------------------------------------------------------
# Rich Messages (Bot API 10.1+): листаемая галерея + текст одним сообщением
# ---------------------------------------------------------------------------
MD_TOKEN_RE = re.compile(r"\*\*(.+?)\*\*|\[([^\]]+)\]\(((?:https?|tg)://[^\s)]+)\)", re.S)


def rich_text(text: str) -> Any:
    """Мини-разметка → RichText: **жирный** и [текст](url). Остальное — обычная строка."""
    out: List[Any] = []
    pos = 0
    for m in MD_TOKEN_RE.finditer(text):
        if m.start() > pos:
            out.append(text[pos:m.start()])
        if m.group(1) is not None:
            out.append({"type": "bold", "text": rich_text(m.group(1))})
        else:
            out.append({"type": "url", "text": m.group(2), "url": m.group(3)})
        pos = m.end()
    if pos < len(text):
        out.append(text[pos:])
    if not out:
        return ""
    if len(out) == 1 and isinstance(out[0], str):
        return out[0]
    return out


def split_title(caption: str) -> Tuple[str, str]:
    """Первая строка — заголовок (если есть ещё текст и она короче 140 символов), остальное — тело."""
    text = (caption or "").strip()
    if "\n" not in text:
        return "", text
    first, rest = text.split("\n", 1)
    first, rest = first.strip(), rest.strip()
    if first and rest and len(first) <= 140 and not first.endswith((".", ":", ";", ",")):
        return first, rest
    return "", text


def paragraphs(text: str) -> List[str]:
    return [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]


def rich_blocks(post: Dict[str, Any], manifest: Dict[str, Any], photos: List[Path],
                video_file: Optional[Path] = None) -> Tuple[List[Dict[str, Any]], Dict[str, Tuple[str, bytes]]]:
    """Собирает блоки rich message: медиа (слайдшоу / фото / видео), заголовок, абзацы, подвал."""
    if len(photos) > RICH_MEDIA_LIMIT:
        raise ValueError(f"в rich message максимум {RICH_MEDIA_LIMIT} медиа, получено {len(photos)}")
    blocks: List[Dict[str, Any]] = []
    files: Dict[str, Tuple[str, bytes]] = {}

    def photo_block(i: int, p: Path) -> Dict[str, Any]:
        key = f"file{i}"
        files[key] = (p.name, p.read_bytes())
        return {"type": "photo", "photo": {"type": "photo", "media": f"attach://{key}"}}

    if video_file is not None:
        files["video"] = (video_file.name, video_file.read_bytes())
        files["cover"] = (photos[0].name, photos[0].read_bytes())
        blocks.append({"type": "video", "video": {"type": "video", "media": "attach://video",
                                                   "cover": "attach://cover", "supports_streaming": True}})
    elif len(photos) > 1:
        blocks.append({"type": "slideshow", "blocks": [photo_block(i, p) for i, p in enumerate(photos)]})
    else:
        blocks.append(photo_block(0, photos[0]))

    title, body = split_title(post.get("caption", ""))
    if title:
        blocks.append({"type": "heading", "text": rich_text(title), "size": int(manifest.get("rich_heading_size", 4))})
    for para in paragraphs(body):
        blocks.append({"type": "paragraph", "text": rich_text(para)})
    if post.get("type") == "video" and video_file is None and post.get("video", {}).get("duration"):
        blocks.append({"type": "paragraph", "text": f"🎬 {post['video']['duration']}"})
    footer = manifest.get("footer_md", "") if post.get("append_footer", True) else ""
    if footer:
        blocks.append({"type": "footer", "text": rich_text(footer)})
    return blocks, files


def wants_rich(post: Dict[str, Any], manifest: Dict[str, Any], caption_overflows: bool) -> bool:
    mode = str(post.get("mode") or manifest.get("rich_mode") or "auto").lower()
    if mode not in RICH_MODES:
        raise ValueError(f"неизвестный rich_mode {mode!r}, допустимо: {', '.join(RICH_MODES)}")
    if mode == "none":
        return False
    if mode == "all":
        return True
    is_carousel = post.get("type") == "carousel" or len(post.get("media", [])) > 1
    return is_carousel or (mode == "auto" and caption_overflows)


# ---------------------------------------------------------------------------
# Публикация
# ---------------------------------------------------------------------------
def publish(tg: Telegram, chat_id: Any, post: Dict[str, Any], manifest: Dict[str, Any], assets_dir: Path,
            dry_run: bool = False) -> List[Dict[str, Any]]:
    """Публикует один пост. Возвращает список отправленных сообщений (dry_run → пустой)."""
    missing = missing_assets(post, assets_dir)
    if missing:
        raise FileNotFoundError("нет файлов: " + ", ".join(str(p) for p in missing)
                                + " — экспортируйте фреймы из Figma (export_figma.py или вручную)")
    files = [media_path(post, m, assets_dir) for m in post["media"]]
    caption, overflow = build_caption(post, manifest)
    kind = post["type"]
    sent: List[Dict[str, Any]] = []
    if wants_rich(post, manifest, overflow is not None):
        video_file = ensure_video_file(post, assets_dir) if kind == "video" and not dry_run else None
        blocks, attach = rich_blocks(post, manifest, files, video_file)
        plan = f"#{post['id']} [{kind}] rich message: {len(blocks)} блок(ов), {len(attach)} файл(ов)"
        if dry_run:
            log.info("DRY RUN %s → %s", plan, chat_id)
            return []
        log.info("отправляю %s → %s", plan, chat_id)
        try:
            sent.append(tg.send_rich(chat_id, blocks, attach))
            return sent
        except TelegramError as e:
            if e.code != 404 and "rich" not in e.description.lower():
                raise
            log.warning("sendRichMessage не прошёл (%s), отправляю классическим способом", e.description)
    plan = f"#{post['id']} [{kind}] {len(files)} файл(ов), подпись {len(caption or '')} симв." + (
        f", + отдельное сообщение {len(overflow)} симв." if overflow else "")
    if dry_run:
        log.info("DRY RUN %s → %s", plan, chat_id)
        return []
    log.info("отправляю %s → %s", plan, chat_id)
    if kind == "video":
        video_file = ensure_video_file(post, assets_dir)
        if video_file:
            sent.append(tg.send_video(chat_id, video_file, files[0], caption))
        else:
            log.warning("#%s: видео недоступно, публикую заглушку как фото", post["id"])
            sent.append(tg.send_photo(chat_id, files[0], caption))
    elif len(files) > 1:
        sent.extend(tg.send_media_group(chat_id, files, caption))
    else:
        sent.append(tg.send_photo(chat_id, files[0], caption))
    if overflow:
        first_id = sent[0].get("message_id") if sent else None
        sent.append(tg.send_message(chat_id, overflow, reply_to=first_id))
    return sent


def describe_post(post: Dict[str, Any], assets_dir: Optional[Path] = None,
                  manifest: Optional[Dict[str, Any]] = None) -> str:
    status = ""
    if assets_dir is not None:
        miss = missing_assets(post, assets_dir)
        status = " ✅" if not miss else f" ⛔ нет {len(miss)} файл(ов)"
    mode = ""
    if manifest is not None:
        _, overflow = build_caption(post, manifest)
        mode = " · rich" if wants_rich(post, manifest, overflow is not None) else " · classic"
    return f"#{post['id']} [{post['type']}] {post.get('title', '')}{mode}{status}"


# ---------------------------------------------------------------------------
# Импорт PNG, экспортированных из Figma
# ---------------------------------------------------------------------------
POST_ID_RE = re.compile(r"#(\d+)")
SLIDE_RE = re.compile(r"[—–-]\s*0*(\d+)\s*$")
SCALE_RE = re.compile(r"@\d+x$")


def match_export(path: Path, manifest: Dict[str, Any]) -> Optional[Tuple[Dict[str, Any], str]]:
    """По имени экспортированного файла находит пост и целевое имя из posts.json.

    Figma называет файлы по имени фрейма («Carousel Post / #152 Explorer — 02.png»,
    при экспорте слэши становятся папками). Номер поста берётся из «#152»,
    номер слайда — из «— 02», обложка — по слову Cover."""
    stem = SCALE_RE.sub("", path.stem).strip()
    m = POST_ID_RE.search(stem) or POST_ID_RE.search(str(path.parent))
    if not m:
        return None
    try:
        post = find_post(manifest, m.group(1))
    except KeyError:
        return None
    media = post["media"]
    if len(media) == 1:
        return post, media[0]["file"]
    full = (str(path.parent) + " " + stem).lower()
    slide = SLIDE_RE.search(stem)
    if "cover" in full and not slide:
        return post, media[0]["file"]
    if slide:
        k = int(slide.group(1))
        if 1 <= k < len(media):
            return post, media[k]["file"]
    return None


def cmd_import(cfg: Config, manifest: Dict[str, Any], folder: Path) -> int:
    if not folder.is_dir():
        sys.exit(f"папка не найдена: {folder}")
    files = sorted(p for p in folder.rglob("*") if p.suffix.lower() in (".png", ".jpg", ".jpeg"))
    if not files:
        sys.exit(f"в {folder} нет PNG/JPG")
    copied, skipped = 0, []
    for src in files:
        hit = match_export(src, manifest)
        if not hit:
            skipped.append(src.name)
            continue
        post, filename = hit
        dst = cfg.assets_dir / str(post["id"]) / filename
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        copied += 1
        print(f"✅ {src.name}  →  {dst.relative_to(cfg.assets_dir)}")
    for name in skipped:
        print(f"⚠ пропущен (не нашёл #id или номер слайда): {name}")
    print(f"\nСкопировано: {copied}, пропущено: {len(skipped)}. Теперь: python bot.py check")
    return 0 if copied else 1


# ---------------------------------------------------------------------------
# CLI-команды
# ---------------------------------------------------------------------------
def cmd_check(cfg: Config, manifest: Dict[str, Any]) -> int:
    bad = 0
    for post in manifest["posts"]:
        miss = missing_assets(post, cfg.assets_dir)
        if miss:
            bad += 1
            print(f"⛔ #{post['id']}: нет " + ", ".join(p.name for p in miss))
        else:
            print(describe_post(post, cfg.assets_dir, manifest))
    print(f"\n{len(manifest['posts'])} постов, без файлов: {bad}. Папка: {cfg.assets_dir}")
    return 1 if bad else 0


def cmd_list(cfg: Config, manifest: Dict[str, Any]) -> int:
    for post in manifest["posts"]:
        print(describe_post(post, cfg.assets_dir, manifest))
    return 0


def cmd_post(cfg: Config, manifest: Dict[str, Any], target: str, dry_run: bool, delay: float,
             chat: Optional[str]) -> int:
    chat_id = chat or (cfg.channel_id if dry_run else cfg.require_channel())
    tg = Telegram(cfg.require_token() if not dry_run else cfg.bot_token or "dry")
    posts = manifest["posts"] if target == "all" else [find_post(manifest, target)]
    failed = 0
    for i, post in enumerate(posts):
        try:
            publish(tg, chat_id, post, manifest, cfg.assets_dir, dry_run=dry_run)
        except (TelegramError, FileNotFoundError, ValueError) as e:
            failed += 1
            log.error("#%s: %s", post["id"], e)
        if i < len(posts) - 1 and not dry_run:
            time.sleep(delay)
    return 1 if failed else 0


def chat_label(chat: Dict[str, Any]) -> str:
    name = chat.get("title") or chat.get("username") or " ".join(
        x for x in (chat.get("first_name"), chat.get("last_name")) if x)
    return f"{chat.get('id')}  [{chat.get('type')}]  {name}"


def whoami(tg: Telegram) -> Dict[str, Any]:
    """getMe с понятными сообщениями вместо трейсбека."""
    try:
        return tg.get_me()
    except TelegramError as e:
        if e.code == 401:
            sys.exit("Telegram ответил 401 Unauthorized: токен неверный или отозван. Проверьте BOT_TOKEN в .env.")
        sys.exit(f"Telegram: {e}")
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        sys.exit(f"Нет связи с api.telegram.org: {e}. Проверьте интернет/VPN и повторите.")


def cmd_discover(cfg: Config) -> int:
    tg = Telegram(cfg.require_token())
    me = whoami(tg)
    print(f"Бот: @{me.get('username')} (id {me.get('id')})")
    print("Добавьте бота администратором в тестовый канал и опубликуйте там любое сообщение,\n"
          "либо перешлите сообщение из канала боту в личку. Затем запустите discover ещё раз.\n")
    seen: Dict[Any, str] = {}
    for upd in tg.get_updates(timeout=0):
        for key in ("channel_post", "message", "my_chat_member"):
            obj = upd.get(key)
            if not obj:
                continue
            chat = obj.get("chat", {})
            seen[chat.get("id")] = chat_label(chat)
            origin = obj.get("forward_origin") or {}
            if origin.get("type") == "channel":
                seen[origin["chat"]["id"]] = chat_label(origin["chat"]) + "  (переслано)"
    if not seen:
        print("Пока ничего не видно. Проверьте, что бот — админ канала с правом публикации.")
    for cid, label in seen.items():
        print(label)
    print("\nСкопируйте нужный id в CHANNEL_ID в .env")
    return 0


HELP_TEXT = (
    "Команды:\n"
    "/list — посты из posts.json\n"
    "/post <id> — опубликовать пост в канал\n"
    "/post all — опубликовать все\n"
    "/check — проверить файлы\n"
    "/chatid — ответьте этой командой на пересланное из канала сообщение, чтобы узнать его id\n"
    "/ping — проверка"
)


def handle_command(tg: Telegram, cfg: Config, manifest: Dict[str, Any], msg: Dict[str, Any]) -> None:
    chat_id = msg["chat"]["id"]
    text = (msg.get("text") or "").strip()
    sender = (msg.get("from") or {}).get("id")
    if cfg.owner_ids and sender not in cfg.owner_ids:
        tg.send_message(chat_id, "⛔ Нет доступа.")
        return
    cmd, _, arg = text.partition(" ")
    cmd = cmd.split("@", 1)[0].lower()
    arg = arg.strip()
    if cmd in ("/start", "/help"):
        tg.send_message(chat_id, "Clubs News — публикация оформленных постов.\n\n" + HELP_TEXT)
    elif cmd == "/ping":
        tg.send_message(chat_id, "pong")
    elif cmd == "/list":
        tg.send_message(chat_id, html.escape("\n".join(describe_post(p, cfg.assets_dir, manifest) for p in manifest["posts"])))
    elif cmd == "/check":
        lines = []
        for p in manifest["posts"]:
            miss = missing_assets(p, cfg.assets_dir)
            lines.append(("⛔ " if miss else "✅ ") + f"#{p['id']}" + (": нет " + ", ".join(m.name for m in miss) if miss else ""))
        tg.send_message(chat_id, html.escape("\n".join(lines)))
    elif cmd == "/chatid":
        origin = (msg.get("reply_to_message") or {}).get("forward_origin") or msg.get("forward_origin") or {}
        if origin.get("chat"):
            tg.send_message(chat_id, f"chat_id: <code>{origin['chat']['id']}</code> — {html.escape(chat_label(origin['chat']))}")
        else:
            tg.send_message(chat_id, f"Этот чат: <code>{chat_id}</code>. Чтобы узнать id канала, перешлите сюда "
                                     "сообщение из него и ответьте на него командой /chatid.")
    elif cmd == "/post":
        if not arg:
            tg.send_message(chat_id, "Укажите id поста: /post 253 или /post all")
            return
        if not cfg.channel_id:
            tg.send_message(chat_id, "CHANNEL_ID не задан в .env")
            return
        posts = manifest["posts"] if arg == "all" else None
        if posts is None:
            try:
                posts = [find_post(manifest, arg)]
            except KeyError as e:
                tg.send_message(chat_id, html.escape(str(e)))
                return
        ok, failed = 0, []
        for p in posts:
            try:
                publish(tg, cfg.channel_id, p, manifest, cfg.assets_dir)
                ok += 1
            except (TelegramError, FileNotFoundError, ValueError) as e:
                failed.append(f"#{p['id']}: {e}")
            if len(posts) > 1:
                time.sleep(2)
        report = f"Опубликовано: {ok}"
        if failed:
            report += "\nОшибки:\n" + "\n".join(failed)
        tg.send_message(chat_id, html.escape(report))
    else:
        tg.send_message(chat_id, "Не понял. " + HELP_TEXT)


def cmd_serve(cfg: Config, manifest: Dict[str, Any]) -> int:
    tg = Telegram(cfg.require_token())
    if cfg.channel_id and not CHAT_ID_RE.match(cfg.channel_id):
        sys.exit(f"CHANNEL_ID выглядит неверно: {cfg.channel_id!r}. Нужен числовой id вида -1001234567890 или @username.")
    me = whoami(tg)
    log.info("бот @%s запущен; канал: %s; владельцы: %s", me.get("username"), cfg.channel_id or "(не задан)",
             sorted(cfg.owner_ids) or "любой")
    offset: Optional[int] = None
    while True:
        try:
            updates = tg.get_updates(offset=offset)
        except (TelegramError, urllib.error.URLError, TimeoutError) as e:
            log.warning("getUpdates: %s", e)
            time.sleep(5)
            continue
        for upd in updates:
            offset = upd["update_id"] + 1
            if upd.get("my_chat_member"):
                chat = upd["my_chat_member"].get("chat", {})
                status = upd["my_chat_member"].get("new_chat_member", {}).get("status")
                log.info("статус бота в «%s» (%s): %s", chat.get("title"), chat.get("id"), status)
            elif upd.get("channel_post"):
                chat = upd["channel_post"].get("chat", {})
                log.info("пост в канале %s (id %s)", chat.get("title"), chat.get("id"))
            elif upd.get("message") and upd["message"].get("chat", {}).get("type") == "private":
                try:
                    handle_command(tg, cfg, manifest, upd["message"])
                except TelegramError as e:
                    log.error("команда: %s", e)


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Clubs News — публикация оформленных постов в Telegram")
    sub = parser.add_subparsers(dest="cmd", required=True)
    p_imp = sub.add_parser("import", help="разложить PNG из Figma по assets/<id>/")
    p_imp.add_argument("folder", help="папка с экспортом из Figma (ищется рекурсивно)")
    sub.add_parser("check")
    sub.add_parser("list")
    p_post = sub.add_parser("post")
    p_post.add_argument("target", help="id поста из posts.json или all")
    p_post.add_argument("--dry-run", action="store_true", help="ничего не отправлять, только показать план")
    p_post.add_argument("--delay", type=float, default=3.0, help="пауза между постами, сек (по умолчанию 3)")
    p_post.add_argument("--chat", help="chat_id вместо CHANNEL_ID")
    sub.add_parser("discover")
    sub.add_parser("serve")
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    cfg = Config()
    if args.cmd == "discover":
        return cmd_discover(cfg)
    manifest = load_manifest(cfg.posts_file)
    if args.cmd == "import":
        return cmd_import(cfg, manifest, Path(args.folder))
    if args.cmd == "check":
        return cmd_check(cfg, manifest)
    if args.cmd == "list":
        return cmd_list(cfg, manifest)
    if args.cmd == "post":
        return cmd_post(cfg, manifest, args.target, args.dry_run, args.delay, args.chat)
    if args.cmd == "serve":
        return cmd_serve(cfg, manifest)
    return 2


if __name__ == "__main__":
    sys.exit(main())
