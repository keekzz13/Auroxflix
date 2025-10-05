from playwright.async_api import async_playwright
import asyncio, json, requests

async def get_data():
    sources = None
    starter = None
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'])
        context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36", extra_http_headers={'Accept-Language': 'en-US,en;q=0.9'})
        page = await context.new_page()

        await page.route("**/*", lambda route: route.abort() if route.request.resource_type in [
            "image", "stylesheet", "font", "media", "websocket", "eventsource", "manifest", "other"
        ] else route.continue_())
        
        try:
            data_received = asyncio.Event()
            
            async def handle_response(response):
                nonlocal sources, starter
                if 'YDGUTEY' in response.url and response.request.method == 'POST':
                    try:
                        sources = await response.text()
                        url_parts = response.url.split('YDGUTEY')
                        starter = f'{url_parts[0]}xo8XtbY-sVen/'
                        data_received.set()
                    except Exception as e:
                        print(f"Error processing response: {e}")

            page.on("response", handle_response)
            
            await page.goto(f"https://vidfast.pro/movie/123?autoPlay=false", wait_until='domcontentloaded')
            
            await asyncio.wait_for(data_received.wait(), timeout=5.0)
            
            if sources: return json.loads(sources), starter
            
        finally: await browser.close()

def get_source(sources, source_name, starter):
    for source in sources:
        if source['name'] == source_name:
            try:
                response = requests.post(f"{starter}{source['data']}", timeout=10)
                response.raise_for_status()
                return response.text
            except requests.RequestException as e:
                print(f"Error fetching source data: {e}")
                return None
    return None

if __name__ == "__main__":
    try:
        sources, starter = asyncio.run(get_data())
        print(sources, '\n')
        print(starter, '\n')
        
        source_data = get_source(sources, 'Alpha', starter)
        if source_data: print(source_data)
        else: print("Failed to retrieve source data")
        
    except Exception as e: print(f"Error: {e}")

# LOWEST TIME: 2.2s
