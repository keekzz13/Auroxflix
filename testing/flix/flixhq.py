import requests
from bs4 import BeautifulSoup
import re

tmdbid = "40075"
type = "tv"
season = 1
episode = 3
source = "AKCloud"

tmdb_url = f"https://api.themoviedb.org/3/{type}/{tmdbid}?api_key=8265bd1679663a7ea12ac168da84d2e8"

tmdb_response = requests.get(tmdb_url)
tmdb_data = tmdb_response.json()

if type == "tv":
    title = tmdb_data.get("name", "")
    search_keyword = title.lower()
    season_count = tmdb_data.get("number_of_seasons", 0)
else:
    title = tmdb_data.get("title", "")
    search_keyword = title.lower()
    release_date = tmdb_data.get("release_date", "")
    release_year = release_date.split("-")[0] if release_date else ""

r = requests.post("https://flixhq.to/ajax/search", data={"keyword": search_keyword})
print("Search completed")

soup = BeautifulSoup(r.text, 'html.parser')
nav_items = soup.find_all('a', class_='nav-item')

id = None

for item in nav_items:
    if 'nav-bottom' in item.get('class', []): continue       
    href = item.get('href', '')
    
    film_name_elem = item.find('h3', class_='film-name')
    if not film_name_elem: continue
    film_name = film_name_elem.text.strip()
    
    film_info = item.find('div', class_='film-infor')
    if not film_info: continue
    spans = film_info.find_all('span')
    
    if type == "tv":
        is_tv = any("TV" in span.text for span in spans)
        if is_tv and title.lower() in film_name.lower(): id = href.split('-')[-1]; break
    else:
        is_movie = any("Movie" in span.text for span in spans)
        if is_movie and title.lower() in film_name.lower():
            year_found = None
            for span in spans:
                if span.text.isdigit() and len(span.text) == 4: year_found = span.text; break
            
            if year_found == release_year: id = href.split('-')[-1]; break

if type == "tv":
    seasons_url = f"https://flixhq.to/ajax/season/list/{id}"
    seasons_response = requests.get(seasons_url)
    print("Season data gotten")
    seasons_soup = BeautifulSoup(seasons_response.text, 'html.parser')
    
    season_links = seasons_soup.find_all('a', class_='dropdown-item ss-item')
    season_ids = []
    for link in season_links:
        season_id = link.get('data-id')
        season_text = link.text.strip()
        season_ids.append((season_id, season_text))
    
    if season_ids and season <= len(season_ids):
        target_season_id = season_ids[season - 1][0]
        episodes_url = f"https://flixhq.to/ajax/season/episodes/{target_season_id}"
        episodes_response = requests.get(episodes_url)
        print("Episode data gotten")
        episodes_soup = BeautifulSoup(episodes_response.text, 'html.parser')
        
        episode_links = episodes_soup.find_all('a', class_='nav-link btn btn-sm btn-secondary eps-item')
        episode_ids = []
        for link in episode_links:
            episode_id = link.get('data-id')
            episode_title = link.get('title', '')
            episode_ids.append((episode_id, episode_title))
        
        if episode_ids and episode <= len(episode_ids):
            target_episode_id = episode_ids[episode - 1][0]
            
            sources_url = f"https://flixhq.to/ajax/episode/servers/{target_episode_id}"
            sources_response = requests.get(sources_url)
            print("Server data gotten")
            sources_soup = BeautifulSoup(sources_response.text, 'html.parser')
            
            source_links = sources_soup.find_all('a', class_='nav-link btn btn-sm btn-secondary link-item')
            source_ids = []
            target_source_id = None
            
            for link in source_links:
                source_id = link.get('data-id')
                source_name = link.find('span').text.strip() if link.find('span') else ''
                source_ids.append((source_id, source_name))
                if source_name == source: target_source_id = source_id
            
            if target_source_id:
                final_url = f"https://flixhq.to/ajax/episode/sources/{target_source_id}"
                final_response = requests.get(final_url)
                print("Source data gotten")
                print(final_response.text)
else:
    movie_servers_url = f"https://flixhq.to/ajax/episode/list/{id}"
    movie_servers_response = requests.get(movie_servers_url)
    print("Movie data gotten")
    movie_servers_soup = BeautifulSoup(movie_servers_response.text, 'html.parser')
    
    source_links = movie_servers_soup.find_all('a', class_='nav-link btn btn-sm btn-secondary link-item')
    source_ids = []
    target_source_id = None
    
    for link in source_links:
        source_id = link.get('data-linkid')
        source_name = link.find('span').text.strip() if link.find('span') else ''
        source_ids.append((source_id, source_name))
        if source_name == source: target_source_id = source_id
    
    final_url = f"https://flixhq.to/ajax/episode/sources/{target_source_id}"
    final_response = requests.get(final_url)
    print(final_response.text)
