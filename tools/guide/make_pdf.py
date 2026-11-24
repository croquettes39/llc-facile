import asyncio
from playwright.async_api import async_playwright
FOOT='''<div style="width:100%;font-family:Inter,sans-serif;font-size:7.5pt;color:#6B7280;padding:0 16mm;display:flex;justify-content:space-between"><span><b style="color:#8A6514">LLC</b><b style="color:#0E1B2C">Facile</b> · Guide client</span><span>llcfacile.com · page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'''
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page()
        await pg.goto("file:///home/claude/guide/guide.html"); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(500)
        await pg.pdf(path="/tmp/g_all.pdf", format="A4", print_background=True, prefer_css_page_size=True,
                     display_header_footer=True, header_template="<span></span>", footer_template=FOOT)
        await pg.pdf(path="/tmp/g_cover.pdf", format="A4", print_background=True, prefer_css_page_size=True, page_ranges="1")
        await b.close()
asyncio.run(main())
