import * as cheerio from "cheerio";
import config from '../../config.json';

// Cache for spotlight data to prevent duplicate requests
const spotlightCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (spotlights change less frequently)

export async function extractSpotlights() {
  try {
    const cacheKey = 'spotlights';
    
    // Check cache first
    if (spotlightCache.has(cacheKey)) {
      const cached = spotlightCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Returning cached spotlight data');
        return cached.data;
      } else {
        spotlightCache.delete(cacheKey);
      }
    }
    
    const resp = fetch(config.proxy, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: 'https://hianime.nz/home',
          method: 'GET'
        })
    });
    const response = await resp;
    const $ = cheerio.load(await response.text());
    const slideElements = $(
      "div.deslide-wrap > div.container > div#slider > div.swiper-wrapper > div.swiper-slide"
    );

    const promises = slideElements
      .map(async (ind, ele) => {
        const poster = $(ele)
          .find(
            "div.deslide-item > div.deslide-cover > div.deslide-cover-img > img.film-poster-img"
          )
          .attr("data-src");
        const title = $(ele)
          .find(
            "div.deslide-item > div.deslide-item-content > div.desi-head-title"
          )
          .text()
          .trim();
        const japanese_title = $(ele)
          .find(
            "div.deslide-item > div.deslide-item-content > div.desi-head-title"
          )
          .attr("data-jname")
          .trim();
        const description = $(ele)
          .find(
            "div.deslide-item > div.deslide-item-content > div.desi-description"
          )
          .text()
          .trim();
        const id = $(ele)
          .find(
            ".deslide-item > .deslide-item-content > .desi-buttons > a:eq(0)"
          )
          .attr("href")
          .split("/")
          .pop();
        const data_id = $(ele)
          .find(
            ".deslide-item > .deslide-item-content > .desi-buttons > a:eq(0)"
          )
          .attr("href")
          .split("/")
          .pop()
          .split("-")
          .pop();
        const tvInfoMapping = {
          0: "showType",
          1: "duration",
          2: "releaseDate",
          3: "quality",
          4: "episodeInfo",
        };

        const tvInfo = {};

        await Promise.all(
          $(ele)
            .find("div.sc-detail > div.scd-item")
            .map(async (index, element) => {
              const key = tvInfoMapping[index];
              let value = $(element).text().trim().replace(/\n/g, "");

              const tickContainer = $(element).find(".tick");

              if (tickContainer.length > 0) {
                value = {
                  sub: tickContainer.find(".tick-sub").text().trim(),
                  dub: tickContainer.find(".tick-dub").text().trim(),
                };
              }
              tvInfo[key] = value;
            })
        );
        return {
          id,
          data_id,
          poster,
          title,
          japanese_title,
          description,
          tvInfo,
        };
      })
      .get();

    const serverData = await Promise.all(promises);
    const resultData = JSON.parse(JSON.stringify(serverData, null, 2));
    
    // Cache the result
    spotlightCache.set(cacheKey, {
      data: resultData,
      timestamp: Date.now()
    });
    
    return resultData;
  } catch (error) {
    console.error("Error fetching spotlight data from hianime.nz:", error.message);
    throw error;
  }
}
