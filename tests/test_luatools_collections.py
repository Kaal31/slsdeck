import unittest

from lt.luatools_collections import parse_collection_html, parse_collections_html


class LuaToolsCollectionsTests(unittest.TestCase):
    def test_catalog_cards(self):
        html = '<a class="glass-card" href="https://lua.tools/c/abc123-all-games"><div><img src="https://cdn/x.jpg"></div><span>All Games</span></a>'
        self.assertEqual(parse_collections_html(html), [{
            "slug": "abc123-all-games", "url": "https://lua.tools/c/abc123-all-games",
            "image": "https://cdn/x.jpg", "name": "All Games",
        }])

    def test_detail_deduplicates_games(self):
        html = '<a href="https://lua.tools/appid/10"><img src="/ten.jpg"><span>Counter-Strike</span></a>' * 2
        self.assertEqual(parse_collection_html(html), [{
            "appid": 10, "url": "https://lua.tools/appid/10",
            "image": "https://lua.tools/ten.jpg", "name": "Counter-Strike",
        }])


if __name__ == "__main__":
    unittest.main()
