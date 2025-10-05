import requests, json
from bs4 import BeautifulSoup

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "Accept-Encoding": "gzip, deflate, br"
}

def extract_search_results(search_term, page=1):
    try:
        url = f"https://hianime.nz/search?keyword={search_term}&page={page}"
        response = requests.get(url, headers=DEFAULT_HEADERS)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        elements = soup.select("#main-content .film_list-wrap .flw-item")
        
        # Extract total pages
        last_page = soup.select_one('.pre-pagination nav .pagination > .page-item a[title="Last"]')
        next_page = soup.select_one('.pre-pagination nav .pagination > .page-item a[title="Next"]')
        active_page = soup.select_one(".pre-pagination nav .pagination > .page-item.active a")
        
        total_page = 1
        if last_page and 'href' in last_page.attrs:
            total_page = int(last_page['href'].split('=')[-1])
        elif next_page and 'href' in next_page.attrs:
            total_page = int(next_page['href'].split('=')[-1])
        elif active_page:
            total_page = int(active_page.text.strip())
        
        # Extract search results
        results = []
        for element in elements:
            film_name = element.select_one(".film-detail .film-name .dynamic-name")
            
            # Get anime ID
            anime_id = None
            if film_name and 'href' in film_name.attrs:
                href = film_name['href']
                anime_id = href[1:].split("?ref=search")[0] if href else None
            
            # Get poster
            poster = element.select_one(".film-poster .film-poster-img")
            poster_url = poster['data-src'].strip() if poster and 'data-src' in poster.attrs else None
            
            # Get duration
            duration = element.select_one(".film-detail .fd-infor .fdi-item.fdi-duration")
            duration_text = duration.text.strip() if duration else None
            
            # Get show type
            show_type = element.select_one(".film-detail .fd-infor .fdi-item:nth-of-type(1)")
            show_type_text = show_type.text.strip() if show_type else "Unknown"
            
            # Get rating
            rating = element.select_one(".film-poster .tick-rate")
            rating_text = rating.text.strip() if rating else None
            
            # Get sub count
            sub_element = element.select_one(".film-poster .tick-sub")
            sub_count = None
            if sub_element and sub_element.text.strip():
                try:
                    sub_count = int(sub_element.text.strip().split()[-1])
                except (ValueError, IndexError):
                    sub_count = None
            
            # Get dub count
            dub_element = element.select_one(".film-poster .tick-dub")
            dub_count = None
            if dub_element and dub_element.text.strip():
                try:
                    dub_count = int(dub_element.text.strip().split()[-1])
                except (ValueError, IndexError):
                    dub_count = None
            
            # Get episode count
            eps_element = element.select_one(".film-poster .tick-eps")
            eps_count = None
            if eps_element and eps_element.text.strip():
                try:
                    eps_count = int(eps_element.text.strip().split()[-1])
                except (ValueError, IndexError):
                    eps_count = None
            
            # Get Japanese title
            japanese_title = None
            if film_name and 'data-jname' in film_name.attrs:
                japanese_title = film_name['data-jname'].strip()
            
            # Create result object
            result = {
                "id": anime_id,
                "title": film_name.text.strip() if film_name else None,
                "japanese_title": japanese_title,
                "poster": poster_url,
                "duration": duration_text,
                "tvInfo": {
                    "showType": show_type_text,
                    "rating": rating_text,
                    "sub": sub_count,
                    "dub": dub_count,
                    "eps": eps_count
                }
            }
            results.append(result)
        
        return int(total_page), results if results else []
    
    except Exception as e:
        print(f"Error fetching search results: {e}")
        return 0, []

query = "horimiya"
page = 1

total_pages, data = extract_search_results(query, page)
print(json.dumps(data, indent=2))
