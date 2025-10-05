import requests

params = {
    "name": "The Amazing World of Gumball",
    "year": "2011",
    "fallback_year": "2011", 
    "season": "3",
    "episode": "20"
}
r = requests.get("https://backend.xprime.tv/primebox", params=params) # no proxy is needed for this request

# response format:
'''
{
  "available_qualities": [
    "1080P",
    "720P",
    "480P",
    "360P"
  ],
  "has_subtitles": true,
  "series_info": {
    "episode": 20,
    "season": 3,
    "title": "The Amazing World of Gumball",
    "type": "series",
    "year": "2019"
  },
  "status": "ok",
  "streams": {
    "1080P": "https://oca.flutch09.workers.dev/?v=p9oAIxt%2F9IHW%2FlyTlcBqnydsQfsZXkS98OyEJ5nVfK4Iu0nLncajBMZ6Pgu9h%2BT1QTV9FKymkcWzbQNQO%2Ft26wXB7WClm%2FStGcCco8t43tzQ4ZZ2abY7BxpoOdTqfHHUUEdbB%2BaUX51t2WiWBShnXhofgpgq1YZtvQQlONGZtdNTH4fIeGXm5n6proyIidfSvwQjs2QEi7BhaOpIBtg38txA&headers=%7B%22origin%22%3A%22https%3A%2F%2Fmoviebox.ng%22%2C%22referer%22%3A%22https%3A%2F%2Fmoviebox.ng%22%7D&safe",
    "360P": "https://oca.flutch09.workers.dev/?v=dfwy73dvWEZOmeGuIThvzmyaIjr3cwE3P9Y01H58WDYqILFX0HEwqVl1ALxNdUVjUF4cuAuOyCzcwDjGPQiOBnsS2CZJI%2BwMCwg5cS5PH2L4RnRdBvGUoeXUG2T9MJUZqiatkOW8MUuG4F6WS7QydkFdKAF01UrWDXu2F8LBU%2FA7WdskD5fA7gr1R8YMOPwswVp7%2BZEB7xJjVrc%2F&headers=%7B%22origin%22%3A%22https%3A%2F%2Fmoviebox.ng%22%2C%22referer%22%3A%22https%3A%2F%2Fmoviebox.ng%22%7D&safe",
    "480P": "https://oca.flutch09.workers.dev/?v=Pn8Yce3cuKbKVfRFcLUNWV2M5CcKdOvO5eqqKbPqVX31gtWKP293RkS%2FcpPE82dod2cQgLUAulNC0146xQ9XJd9FiHhhmFw47IjPs6Rpa1uFFB1rpjyBWPnBnVnQh9clClWkhTTc5TLtSuTVNS9EBlNHHt5tLia2wrfrXRF%2FkrJW%2FgkCDZXSKKIyQc4UyODbzH9p4oKvP3GI25Kl4QXM9Tvc&headers=%7B%22origin%22%3A%22https%3A%2F%2Fmoviebox.ng%22%2C%22referer%22%3A%22https%3A%2F%2Fmoviebox.ng%22%7D&safe",
    "720P": "https://oca.flutch09.workers.dev/?v=EtdD2NgtI8lM3WA44BUjQ272fQpUELQtvP8HdtGwLdto0O4oArklXpCEim%2Bwxvy9CMhtXhWZ7X7RzSXdRQ1ScccN9QlKjWw0Np5xBe11CXRpn08D%2BKfAghxvbInbONx680K6JNgh7A8zPqbBAksnrvvcY6syaM4j%2FLOoFS3G6U%2BL17TxGnNjMOb%2FKmF9TwEKTd3n%2FRu4h7ZI7lpUvooO2kIW&headers=%7B%22origin%22%3A%22https%3A%2F%2Fmoviebox.ng%22%2C%22referer%22%3A%22https%3A%2F%2Fmoviebox.ng%22%7D&safe"
  },
  "subtitles": [
    {
      "file": "https://forwarder.kendrickl-3amar.site/?url=2hDENB5M%2F5tbyPt6M5sOkYgu7hNfWdw6H9ojmMd27gx0wRlD%2BWiDGXGqPVdM2RoXI6ftH%2FVU%2B7vuMT%2FB8rTCryvP%2FhEpG2xnBWYbqdrC6E4iuqbrAhgkZLls%2BlR3SSjapFJcYjNn4ankCZynCsglqOLMwO3G1%2FMxFZgCs8GeXcwfcd%2BJm8uLK1y6QJgmgrS54STJyfYP4kJTu2zmYi1UlTdT3qyFpkuIIDWsDqcbjSd37v5J0sXFT6ab5kZgqtPOMXiSZBUyNZT4%2FD6h%2FRjQzdfeY8%2BBBeJr6ce%2FyFWJbr0yQ1m7pXP2dtHcd5qCXKKRYLU5OXcMKot8Wbo6H15zVF45pBJAexC7CWqcUFPh7T8SVgqGDlWVoBVuVsbAC1Cqs8ogjjJ4krnqP7cHnrxdk1hAdkme%2FlxaGx3PWdYyA8N3y1oLrV3q%2B333vKr1wu6v5x9jM24shTWvJhg9pDwFYiCVYIIp0ilbFucAxh4m2zA0uOu4%2B%2BFiT0mIk3KZovF67FML2iPFF7MfHC2sT7EAe%2BcWbckXqTqUbXZEJSJcbmn0DQGJtKtjp9b5jqBp1pqySFj3H5916K8rHKZ%2FtwK%2F4octZvf4DQXUXgsd3yyN0Wbnkx%2FwkHj2yR%2F7eZ4JWsWn%2BWrZoeiHxPLph5BeFmbAIW1bVJtmlp%2FVD0uLNSN2t284%2B18AExmKE3MdDR4e2ci4v1h%2FbB6sJTZHNjEC2OxxSZWbGnCelQAqeDzUb7Hlq5zoaj3NW5Gwy%2FX3h8kt3dOWkDRCW4zMZHN9%2BNHN4CD25ydqEghPB1d62z7fvnTLQ1iPUfGpxeL439004S8hlzbATsWGbCcLamSF0j%2BrJnoBXX3W4WTRX8H500w2JWEt5ZCIpUFWwc3aRogr01YmOw%3D%3D&headers=%7B%22origin%22%3A%22https%3A%2F%2Fmoviebox.ng%22%2C%22referer%22%3A%22https%3A%2F%2Fmoviebox.ng%22%7D&safe&normal=",
      "label": "اَلْعَرَبِيَّةُ"
    }, ...
  ],
  "title": "The Amazing World of Gumball"
}
'''

# the m3u8 proxy must be used for the streams with the referer being https://pstream.mov

print(r.text)
