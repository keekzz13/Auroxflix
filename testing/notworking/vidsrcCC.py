from playwright.async_api import async_playwright
import asyncio, json, requests

async def test(type, id, season=0, episode=0):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page() 
        response_data = None
        
        async def handle_request(request):
            nonlocal response_data
            if "https://vidsrc.cc/api/" in request.url and "/servers?type=" in request.url:
                response = await request.response()
                if response: response_data = await response.json()
                
        page.on("request", handle_request)
        if type == 'movie': url = f"https://vidsrc.cc/v3/embed/movie/{id}?autoPlay=true"
        else: url = f"https://vidsrc.cc/v2/embed/tv/{id}/{season}/{episode}?autoPlay=true"
        await page.goto(url)
        while not response_data: await asyncio.sleep(1)
            
        await browser.close()
        return response_data

sources = asyncio.run(test('tv', 40075))
print(sources)

if sources and 'data' in sources:
    for source in sources['data']:
        if 'hash' in source:
            response = requests.get(
                f"https://vidsrc.cc/api/source/{source['hash']}?opensubtiles=true", 
                headers={
                    'Origin': 'https://vidsrc.cc',
                    'Referer': 'https://vidsrc.cc',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            )
            print(response.text)
