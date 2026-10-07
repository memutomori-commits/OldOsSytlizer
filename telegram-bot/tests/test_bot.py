"""Тесты бота без сети: транспорт Telegram подменяется фейком."""
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import bot  # noqa: E402


class FakeTransport:
    """Записывает вызовы Bot API и возвращает заготовленные ответы."""

    def __init__(self, fail_cover: bool = False):
        self.calls = []
        self.fail_cover = fail_cover
        self.counter = 0

    def __call__(self, token, method, fields, files):
        self.calls.append((method, fields, files))
        self.counter += 1
        if method == "sendVideo" and self.fail_cover and fields.get("cover"):
            raise bot.TelegramError(method, "Bad Request: unsupported parameter cover", 400)
        if method == "sendMediaGroup":
            return [{"message_id": self.counter + i} for i in range(len(json.loads(fields["media"]) if isinstance(fields["media"], str) else fields["media"]))]
        return {"message_id": self.counter}


MANIFEST = {
    "footer_html": "🙂Top news: <a href=\"https://t.me/clubs\">@clubs</a>",
    "posts": [
        {"id": "1", "type": "transaction", "title": "tx", "caption": "Заголовок\n\nТекст & подробности",
         "media": [{"node": "1:1", "file": "tx.png"}]},
        {"id": "2", "type": "carousel", "title": "car", "caption": "Карусель",
         "media": [{"node": "2:0", "file": "cover.png"}, {"node": "2:1", "file": "s1.png"}, {"node": "2:2", "file": "s2.png"}]},
        {"id": "3", "type": "video", "title": "vid", "caption": "Видео",
         "media": [{"node": "3:0", "file": "cover.png"}], "video": {"file": "video.mp4", "url": None, "duration": "2:05"}},
        {"id": "4", "type": "dossier", "title": "long", "caption": "Длинный пост\n\n" + ("слово " * 300).strip(),
         "media": [{"node": "4:0", "file": "d.png"}]},
    ],
}


class ManifestTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.assets = Path(self.tmp.name)
        for post in MANIFEST["posts"]:
            for item in post["media"]:
                p = self.assets / post["id"] / item["file"]
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_bytes(b"\x89PNG fake " + item["file"].encode())

    def tearDown(self):
        self.tmp.cleanup()

    def test_strip_channel_footer(self):
        text = "Новость\n\nТело\n\n🙂Top news: @clubs\nClubs Сhat // Clubs Market"
        self.assertEqual(bot.strip_channel_footer(text), "Новость\n\nТело")
        self.assertEqual(bot.strip_channel_footer("A\n\nJoin clubs community chat"), "A")
        self.assertEqual(bot.strip_channel_footer("A\nJoin @clubs community\nEN Chat // RU Chat"), "A")
        self.assertEqual(bot.strip_channel_footer("Только текст"), "Только текст")

    def test_caption_fits(self):
        caption, overflow = bot.build_caption(MANIFEST["posts"][0], MANIFEST)
        self.assertIsNone(overflow)
        self.assertIn("Текст &amp; подробности", caption)  # HTML-экранирование
        self.assertTrue(caption.endswith(MANIFEST["footer_html"]))
        self.assertLessEqual(len(caption), bot.CAPTION_LIMIT)

    def test_caption_overflow(self):
        caption, overflow = bot.build_caption(MANIFEST["posts"][3], MANIFEST)
        self.assertEqual(caption, "<b>Длинный пост</b>")
        self.assertIsNotNone(overflow)
        self.assertGreater(len(overflow), bot.CAPTION_LIMIT)
        self.assertLessEqual(len(overflow), bot.TEXT_LIMIT)
        self.assertIn(MANIFEST["footer_html"], overflow)

    def test_video_caption_has_duration(self):
        caption, _ = bot.build_caption(MANIFEST["posts"][2], MANIFEST)
        self.assertIn("🎬 2:05", caption)

    def test_media_group(self):
        photos = [self.assets / "2" / f for f in ("cover.png", "s1.png", "s2.png")]
        media, files = bot.build_media_group(photos, "подпись")
        self.assertEqual([m["media"] for m in media], ["attach://file0", "attach://file1", "attach://file2"])
        self.assertEqual(media[0]["caption"], "подпись")
        self.assertNotIn("caption", media[1])
        self.assertEqual(files["file0"][0], "cover.png")
        with self.assertRaises(ValueError):
            bot.build_media_group(photos * 4, None)

    def test_multipart(self):
        body, ctype = bot.encode_multipart({"chat_id": -100, "media": [{"a": 1}], "flag": True},
                                           {"photo": ("x.png", b"\x00\x01")})
        boundary = ctype.split("boundary=")[1]
        self.assertIn(boundary.encode(), body)
        self.assertIn(b'name="chat_id"\r\n\r\n-100', body)
        self.assertIn(b'[{"a": 1}]', body)
        self.assertIn(b'name="flag"\r\n\r\ntrue', body)
        self.assertIn(b'filename="x.png"\r\nContent-Type: image/png\r\n\r\n\x00\x01\r\n', body)
        self.assertTrue(body.endswith(f"--{boundary}--\r\n".encode()))

    def test_load_manifest_validation(self):
        bad = {"posts": [{"id": "1", "type": "x", "media": [{"file": "a"}]}, {"id": "1", "type": "x", "media": [{"file": "b"}]}]}
        path = self.assets / "posts.json"
        path.write_text(json.dumps(bad), encoding="utf-8")
        with self.assertRaises(ValueError):
            bot.load_manifest(path)

    def test_missing_assets(self):
        (self.assets / "1" / "tx.png").unlink()
        self.assertEqual(len(bot.missing_assets(MANIFEST["posts"][0], self.assets)), 1)
        tg = bot.Telegram("t", FakeTransport())
        with self.assertRaises(FileNotFoundError):
            bot.publish(tg, -100, MANIFEST["posts"][0], MANIFEST, self.assets)

    def test_publish_photo(self):
        tr = FakeTransport()
        tg = bot.Telegram("t", tr)
        sent = bot.publish(tg, -100, MANIFEST["posts"][0], MANIFEST, self.assets)
        self.assertEqual(len(sent), 1)
        method, fields, files = tr.calls[0]
        self.assertEqual(method, "sendPhoto")
        self.assertEqual(fields["chat_id"], -100)
        self.assertEqual(fields["parse_mode"], "HTML")
        self.assertEqual(files["photo"][0], "tx.png")

    def test_publish_carousel(self):
        tr = FakeTransport()
        tg = bot.Telegram("t", tr)
        bot.publish(tg, -100, MANIFEST["posts"][1], MANIFEST, self.assets)
        method, fields, files = tr.calls[0]
        self.assertEqual(method, "sendMediaGroup")
        self.assertEqual(len(fields["media"]), 3)
        self.assertEqual(fields["media"][0]["media"], "attach://file0")
        self.assertIn("Карусель", fields["media"][0]["caption"])
        self.assertEqual(set(files), {"file0", "file1", "file2"})

    def test_publish_video_fallback_to_photo(self):
        tr = FakeTransport()
        tg = bot.Telegram("t", tr)
        bot.publish(tg, -100, MANIFEST["posts"][2], MANIFEST, self.assets)  # видео нет → фото-заглушка
        self.assertEqual(tr.calls[0][0], "sendPhoto")

    def test_publish_video_with_cover_and_thumbnail_fallback(self):
        (self.assets / "3" / "video.mp4").write_bytes(b"mp4")
        tr = FakeTransport()
        bot.publish(bot.Telegram("t", tr), -100, MANIFEST["posts"][2], MANIFEST, self.assets)
        method, fields, files = tr.calls[0]
        self.assertEqual(method, "sendVideo")
        self.assertEqual(fields["cover"], "attach://cover")
        self.assertEqual(set(files), {"video", "cover"})
        tr2 = FakeTransport(fail_cover=True)
        bot.publish(bot.Telegram("t", tr2), -100, MANIFEST["posts"][2], MANIFEST, self.assets)
        self.assertEqual([c[0] for c in tr2.calls], ["sendVideo", "sendVideo"])
        self.assertEqual(tr2.calls[1][1]["thumbnail"], "attach://thumbnail")

    def test_publish_long_caption_sends_reply(self):
        tr = FakeTransport()
        sent = bot.publish(bot.Telegram("t", tr), -100, MANIFEST["posts"][3], MANIFEST, self.assets)
        self.assertEqual([c[0] for c in tr.calls], ["sendPhoto", "sendMessage"])
        self.assertEqual(tr.calls[1][1]["reply_to_message_id"], sent[0]["message_id"])

    def test_dry_run_sends_nothing(self):
        tr = FakeTransport()
        bot.publish(bot.Telegram("t", tr), -100, MANIFEST["posts"][1], MANIFEST, self.assets, dry_run=True)
        self.assertEqual(tr.calls, [])

    def test_owner_restriction(self):
        cfg = bot.Config()
        cfg.owner_ids = {42}
        cfg.channel_id = "-100"
        cfg.assets_dir = self.assets
        tr = FakeTransport()
        tg = bot.Telegram("t", tr)
        bot.handle_command(tg, cfg, MANIFEST, {"chat": {"id": 7, "type": "private"}, "from": {"id": 1}, "text": "/post 1"})
        self.assertEqual(tr.calls[-1][0], "sendMessage")
        self.assertIn("Нет доступа", tr.calls[-1][1]["text"])
        bot.handle_command(tg, cfg, MANIFEST, {"chat": {"id": 7, "type": "private"}, "from": {"id": 42}, "text": "/post 1"})
        self.assertIn("sendPhoto", [c[0] for c in tr.calls])


if __name__ == "__main__":
    unittest.main()
