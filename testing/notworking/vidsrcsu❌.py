import requests, re, json
from bs4 import BeautifulSoup

r = requests.get("https://vidsrc.su/embed/tv/40075/1/1") # or https://vidsrc.su/embed/movie/123 for movies
soup = BeautifulSoup(r.text, 'html.parser')

script = soup.body.find('script')
script_content = script.string if script else ''

if script_content:
    url_matches = re.findall(r'url:\s*[\'"]((https?://[^/]+/[^/\'"]+)\.m3u8)[\'"]', script_content)
    if url_matches:
        for i, (full_url, _) in enumerate(url_matches):
            print(f"Server {i+1}: {full_url}")
