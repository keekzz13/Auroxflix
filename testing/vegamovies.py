import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
import re

def extract_quality_tags(title):
    quality_tags = ['PREHD', 'PRE-HD', 'WEB-DL', 'HDTS', 'HDR', 'BDRip', 'Dual Audio', 'BluRay']
    found_tags = []
    cleaned_title = title
    
    hindi_combo_pattern = re.compile(r'\(Hindi\s*[-–]\s*([^)]+)\)', re.IGNORECASE)
    hindi_combo_match = hindi_combo_pattern.search(cleaned_title)
    if hindi_combo_match:
        found_tags.append(f'Hindi - {hindi_combo_match.group(1).strip()}')
        cleaned_title = hindi_combo_pattern.sub('', cleaned_title)
    elif re.search(r'\bHindi\b', cleaned_title, re.IGNORECASE):
        found_tags.append('Hindi')
        cleaned_title = re.sub(r'\bHindi\b', '', cleaned_title, flags=re.IGNORECASE)
    
    cleaned_title = re.sub(r'\(\s*[-–]\s*[^)]*\)', '', cleaned_title)
    cleaned_title = re.sub(r'\(\s*\)', '', cleaned_title)
    
    for tag in quality_tags:
        pattern = re.compile(re.escape(tag), re.IGNORECASE)
        if pattern.search(cleaned_title):
            found_tags.append(tag)
            cleaned_title = pattern.sub('', cleaned_title)
    
    cleaned_title = re.sub(r'(?:1080p|720p|480p)(?:\s*[-–]\s*(?:1080p|720p|480p))*', '', cleaned_title, flags=re.IGNORECASE)
    cleaned_title = re.sub(r'\s+', ' ', cleaned_title).strip()
    
    return cleaned_title, found_tags

def get_vega_downloads(tmdbid):
    tmdb_url = f"https://api.themoviedb.org/3/movie/{tmdbid}?api_key=8265bd1679663a7ea12ac168da84d2e8"
    tmdb_response = requests.get(tmdb_url)
    tmdb_data = tmdb_response.json()

    query = quote_plus(f"{tmdb_data['title']} {tmdb_data['release_date'][:4]}")
    r = requests.post("https://vegamovies.cd", headers={"content-type": "application/x-www-form-urlencoded"}, data={"do": "search", "subaction": "search", "story": query})

    soup = BeautifulSoup(r.text, 'html.parser')
    post_items = soup.find_all('article', class_='post-item site__col')
    if post_items:
        first_post_item = post_items[0]
        a_tag = first_post_item.find('a')
        if a_tag:
            href = a_tag.get('href')
    
    r = requests.get(href)

    soup = BeautifulSoup(r.text, 'html.parser')
    a_tags = soup.find_all('a', class_='btn', href=lambda href: href and 'fast-dl.lol' in href)
    title = soup.find('h1', class_='entry-title').text.strip()
    
    cleaned_title, quality_tags = extract_quality_tags(title)
    
    results = []
    
    for a_tag in a_tags:
        h3_container = a_tag.find_parent('div').find_parent('h3')
        if h3_container:
            previous_h3 = h3_container.find_previous_sibling('h3')
            if previous_h3:
                tags = [
                    previous_h3.get_text(strip=True),
                    re.search(r'\[([^\]]+)\]', a_tag.get_text(strip=True)).group(1).strip()
                ]
                tags.extend(quality_tags)
                
                results.append({
                    "source": "Vega",
                    "title": cleaned_title,
                    "url": a_tag.get('href'),
                    "tags": tags
                })
    
    return results
    
print(get_vega_downloads(911430))
