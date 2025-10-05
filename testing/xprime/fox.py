import requests

# movies
params = {"name": "The Fantastic 4: First Steps", "year": "2025", "id": "617126", "imdb": "tt10676052"}
r = requests.get("https://backend.xprime.tv/fox", params=params) 

# tv
params = {"name": "The Amazing World of Gumball", "year": "2011", "id": "37606", "imdb": "tt1942683", "season": "1", "episode": "1"}
r = requests.get("https://backend.xprime.tv/fox", params=params) 

# response format:
{'url': 'https://website.com/index.m3u8', 'subtitles': [{'file': 'https://website.com/subtitle.vtt', 'label': 'English', 'kind': 'subtitles', 'default': False}]}
