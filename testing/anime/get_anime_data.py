import requests, json, re, time
from bs4 import BeautifulSoup
from terminology import on_yellow, on_red

def format_title(title, data_id):
    formatted_title = re.sub(r'[^\w\s]', '', title)
    formatted_title = formatted_title.lower().strip()
    formatted_title = re.sub(r'\s+', '-', formatted_title)
    return f"{formatted_title}-{data_id}"

def extract_recommended_data(soup):
    recommended_elements = soup.select(
        "#main-content .block_area_category .tab-content .block_area-content .film_list-wrap .flw-item"
    )
    results = []
    
    for element in recommended_elements:
        id = element.select_one(".film-detail .film-name a").get('href').split("/")[-1] if element.select_one(".film-detail .film-name a") else None
        data_id = element.select_one(".film-poster a").get('data-id')
        title = element.select_one(".film-detail .film-name a").text.strip() if element.select_one(".film-detail .film-name a") else ""
        japanese_title = element.select_one(".film-detail .film-name a").get('data-jname', "").strip()
        poster = element.select_one(".film-poster img").get('data-src')
        
        fdi_items = element.select(".film-detail .fd-infor .fdi-item")
        show_type = None
        for item in fdi_items:
            text = item.text.strip().lower()
            if any(type in text for type in ["tv", "ona", "movie", "ova", "special"]):
                show_type = item.text.strip()
                break
                
        tv_info = {
            "showType": show_type if show_type else "Unknown",
            "duration": element.select_one(".film-detail .fd-infor .fdi-duration").text.strip() if element.select_one(".film-detail .fd-infor .fdi-duration") else None
        }
        
        for property in ["sub", "dub", "eps"]:
            value = element.select_one(f".tick .tick-{property}")
            if value:
                tv_info[property] = value.text.strip()
                
        adult_content = False
        tick_rate = element.select_one(".film-poster>.tick-rate")
        if tick_rate and "18+" in tick_rate.text.strip():
            adult_content = True
            
        results.append({
            "data_id": data_id,
            "id": id,
            "title": title,
            "japanese_title": japanese_title,
            "poster": poster,
            "tvInfo": tv_info,
            "adultContent": adult_content
        })
        
    return results

def extract_related_data(soup):
    related_elements = soup.select(
        "#main-sidebar .block_area_sidebar .block_area-content .cbox-list .cbox-content .anif-block-ul .ulclear li"
    )
    results = []
    
    for element in related_elements:
        id = element.select_one(".film-detail .film-name a").get('href').split("/")[-1] if element.select_one(".film-detail .film-name a") else None
        data_id = element.select_one(".film-poster").get('data-id')
        title = element.select_one(".film-detail .film-name a").text.strip() if element.select_one(".film-detail .film-name a") else ""
        japanese_title = element.select_one(".film-detail .film-name a").get('data-jname', "").strip()
        poster = element.select_one(".film-poster img").get('data-src')
        
        fdi_items = element.select(".film-detail>.fd-infor>.tick")
        show_type = None
        for item in fdi_items:
            text = item.text.strip().lower()
            if any(type in text for type in ["tv", "ona", "movie", "ova", "special"]):
                show_type = next((word for word in text.split() if word.lower() in ["tv", "ona", "movie", "ova", "special"]), None)
                break
                
        tv_info = {
            "showType": show_type if show_type else "Unknown"
        }
        
        for property in ["sub", "dub", "eps"]:
            value = element.select_one(f".tick .tick-{property}")
            if value:
                tv_info[property] = value.text.strip()
                
        adult_content = False
        tick_rate = element.select_one(".film-poster>.tick-rate")
        if tick_rate and "18+" in tick_rate.text.strip():
            adult_content = True
            
        results.append({
            "data_id": data_id,
            "id": id,
            "title": title,
            "japanese_title": japanese_title,
            "poster": poster,
            "tvInfo": tv_info,
            "adultContent": adult_content
        })
        
    return results

def extract_anime_info(id):
    resp = requests.get(f"https://hianime.nz/{id}")

    try:
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Extract basic information
        data_id = id.split("-").pop()
        title_element = soup.select_one("#ani_detail .film-name")
        show_type = soup.select_one("#ani_detail .prebreadcrumb ol li:nth-child(2) a").text.strip() if soup.select_one("#ani_detail .prebreadcrumb ol li:nth-child(2) a") else ""
        poster_element = soup.select_one("#ani_detail .film-poster")
        tv_info_element = soup.select_one("#ani_detail .film-stats")
        
        # Extract TV info
        tv_info = {}
        if tv_info_element:
            for element in tv_info_element.select(".tick-item, span.item"):
                text = element.text.strip()
                if 'tick-quality' in element.get('class', []):
                    tv_info['quality'] = text
                elif 'tick-sub' in element.get('class', []):
                    tv_info['sub'] = text
                elif 'tick-dub' in element.get('class', []):
                    tv_info['dub'] = text
                elif 'tick-pg' in element.get('class', []):
                    tv_info['rating'] = text
                elif element.name == 'span' and 'item' in element.get('class', []):
                    if 'showType' not in tv_info:
                        tv_info['showType'] = text
                    elif 'duration' not in tv_info:
                        tv_info['duration'] = text
        
        # Extract main elements
        elements = soup.select("#ani_detail > .ani_detail-stage > .container > .anis-content > .anisc-info-wrap > .anisc-info > .item")
        overview_element = soup.select_one("#ani_detail .film-description .text")
        
        # Extract title information
        title = title_element.text.strip() if title_element else ""
        japanese_title = title_element.get('data-jname') if title_element else None
        synonyms = soup.select_one('.item.item-title:has(.item-head:-soup-contains("Synonyms")) .name')
        synonyms = synonyms.text.strip() if synonyms else ""
        poster = poster_element.select_one("img").get('src') if poster_element and poster_element.select_one("img") else None
        
        # Extract sync data
        sync_data_script = soup.select_one("#syncData")
        anilist_id = None
        mal_id = None
        
        if sync_data_script:
            try:
                sync_data = json.loads(sync_data_script.string)
                anilist_id = sync_data.get('anilist_id')
                mal_id = sync_data.get('mal_id')
            except (json.JSONDecodeError, AttributeError) as error:
                print(f"Error parsing syncData: {error}")

        # New AniList API integration
        backdrop_image = None
        if anilist_id:
            max_retries = 3
            retry_delay = 3  # seconds
            for attempt in range(max_retries):
                try:
                    anilist_query = '''
                    query ($id: Int) {
                        Media(id: $id, type: ANIME) {
                            bannerImage
                        }
                    }
                    '''
                    variables = {'id': int(anilist_id)}
                    response = requests.post(
                        'https://graphql.anilist.co',
                        json={'query': anilist_query, 'variables': variables}
                    )
                    response.raise_for_status()
                    media_data = response.json().get('data', {}).get('Media', {})
                    backdrop_image = media_data.get('bannerImage') or \
                                   media_data.get('coverImage', {}).get('extraLarge')
                    break
                except Exception as e:
                    if attempt < max_retries - 1:
                        delay = retry_delay
                        if response and 'Retry-After' in response.headers:
                            try: delay = int(response.headers['Retry-After'])
                            except ValueError: pass  # Use default delay if header is invalid
                        
                        print(on_yellow(f"⚠️  Retrying AniList request (attempt {attempt + 1}/{max_retries}) after {delay}s"))
                        time.sleep(delay)
                    else:
                        print(on_red(f"❌ Failed to fetch AniList data after {max_retries} attempts: {e}"))
                        backdrop_image = None

        # Extract anime info
        anime_info = {}
        for el in elements:
            key = el.select_one(".item-head").text.strip().replace(":", "") if el.select_one(".item-head") else ""
            if key in ["Genres", "Producers"]:
                value = [a.text.strip().replace(" ", "-") for a in el.select("a")]
            else:
                name_element = el.select_one(".name")
                value = name_element.text.strip().replace(" ", "-") if name_element else ""
            anime_info[key] = value
        
        # Add overview and TV info
        season_id = format_title(title, data_id)
        anime_info["Overview"] = overview_element.text.strip() if overview_element else ""
        anime_info["tvInfo"] = tv_info
        
        # Check for adult content
        adult_content = False
        if poster_element:
            tick_rate = poster_element.select_one(".tick-rate")
            if tick_rate and "18+" in tick_rate.text.strip():
                adult_content = True
        
        seasons = []
        season_elements = soup.select(".os-list a")
        for el in season_elements:
            route = el.get('href', "") if el else ""
            
            name_element = el.select_one(".title")
            name = name_element.text.strip() if name_element else ""
            
            background = ""
            poster_element = el.select_one(".season-poster")
            if poster_element and poster_element.get('style'):
                style = poster_element.get('style')
                bg_match = re.search(r'url\(([^)]+)\)', style)
                if bg_match:
                    background = bg_match.group(1)
            
            seasons.append({
                "name": name,
                "route": route,
                "background": background
            })
            
        # Extract recommended and related data
        recommended_data = extract_recommended_data(soup)
        related_data = extract_related_data(soup)
        
        # Return the final result
        result = {
            "adultContent": adult_content,
            "data_id": data_id,
            "id": season_id,
            "anilistId": anilist_id,
            "malId": mal_id,
            "title": title,
            "japanese_title": japanese_title,
            "synonyms": synonyms,
            "poster": poster,
            "backdrop_image": backdrop_image,
            "showType": show_type,
            "animeInfo": anime_info,
            "seasons": seasons,
            "recommended_data": recommended_data,
            "related_data": related_data
        }
        
        return result
    except Exception as e:
        print(f"Error extracting anime info: {e}")
        return None

def extract_mini_anime_info(id):
    resp = requests.get(f"https://hianime.nz/{id}")
    
    try:
        soup = BeautifulSoup(resp.text, 'html.parser')
        data_id = id.split("-").pop()
        
        # Extract core fields
        title_element = soup.select_one("#ani_detail .film-name")
        title = title_element.text.strip() if title_element else ""
        japanese_title = title_element.get('data-jname') if title_element else None
        show_type = soup.select_one("#ani_detail .prebreadcrumb ol li:nth-child(2) a").text.strip() if soup.select_one("#ani_detail .prebreadcrumb ol li:nth-child(2) a") else ""
        
        # Extract anime info
        anime_info = {}
        elements = soup.select("#ani_detail > .ani_detail-stage > .container > .anis-content > .anisc-info-wrap > .anisc-info > .item")
        for el in elements:
            key = el.select_one(".item-head").text.strip().replace(":", "") if el.select_one(".item-head") else ""
            if key in ["Genres", "Producers"]:
                value = [a.text.strip().replace(" ", "-") for a in el.select("a")]
            else:
                name_element = el.select_one(".name")
                value = name_element.text.strip().replace(" ", "-") if name_element else ""
            anime_info[key] = value

        # Extract sync IDs
        sync_data_script = soup.select_one("#syncData")
        anilist_id = None
        mal_id = None
        if sync_data_script:
            try:
                sync_data = json.loads(sync_data_script.string)
                anilist_id = sync_data.get('anilist_id')
                mal_id = sync_data.get('mal_id')
            except (json.JSONDecodeError, AttributeError):
                pass

        return {
            "data_id": data_id,
            "id": format_title(title, data_id),
            "anilistId": anilist_id,
            "malId": mal_id,
            "title": title,
            "japanese_title": japanese_title,
            "showType": show_type,
            "animeInfo": anime_info
        }
    except Exception as e:
        print(f"Error extracting mini anime info: {e}")
        return None

anime_info = extract_anime_info("my-hero-academia-season-6-18154")
with open("data.json", "w") as f:
    f.write(json.dumps(anime_info, indent=2))
