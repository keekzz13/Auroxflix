from playwright.async_api import async_playwright
import asyncio, json

async def get_data(type, id):
    response_text = None
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36")
        await context.add_cookies([{"name": "_ym_d", "value": "1742860933", "domain": ".vidlink.pro", "path": "/"}])
        page = await context.new_page()
        try:
            async def handle_response(response):
                nonlocal response_text
                if '/api/b/tv' in response.url: response_text = await response.text()

            page.on("response", handle_response)
            
            await page.goto(f"https://vidlink.pro/{type}/{id}/1/1?autoplay=true")
            
            try: await asyncio.wait_for(page.wait_for_load_state('networkidle'), timeout=10.0 )
            except: return None
            
            return json.loads(response_text)
            
        finally: await browser.close()

source = asyncio.run(get_data('tv', 66573))
print(source)
