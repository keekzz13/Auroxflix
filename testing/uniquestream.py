import requests

title = "Horimiya"
season_num = 1
episode_num = 1

params = {"page": "1", "query": title, "t": "all"}
r = requests.get("https://anime.uniquestream.net/api/v1/search", params=params)

for anime in r.json()['series']:
    if anime['title'].lower() == title.lower(): id = anime['content_id']; break

r = requests.get(f"https://anime.uniquestream.net/api/v1/series/{id}")

for season in r.json()['seasons']:
    if season['title'] == title and season['season_number'] == season_num: season_id = season['content_id']

page = 1
while True:
    r = requests.get(f"https://anime.uniquestream.net/api/v1/season/{season_id}/episodes", params={"limit": 20, "order_by": "asc", "page": page})
    
    episodes = r.json()
    if not episodes: raise Exception(f"Episode {episode_num} not found")
        
    for episode in episodes:
        if int(float(episode['episode'])) == episode_num: episode_id = episode['content_id']; break
        else: page += 1; continue
    break

print(episode_id)
