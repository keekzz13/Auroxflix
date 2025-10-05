import requests, json
from bs4 import BeautifulSoup

def extract_episodes_list(id, v1_base_url="hianime.nz"):
    try:
        show_id = id.split("-")[-1]
        url = f"https://hianime.nz/ajax/v2/episode/list/{show_id}"
        headers = {
            "X-Requested-With": "XMLHttpRequest",
            "Referer": f"https://{v1_base_url}/watch/{id}",
        }

        response = requests.get(url, headers=headers)
        data = response.json()

        if "html" not in data or not data["html"]:
            return []

        soup = BeautifulSoup(data["html"], "html.parser")
        episode_links = soup.select(".detail-infor-content .ss-list a")

        res = {
            "totalEpisodes": len(episode_links),
            "episodes": [],
        }

        for el in episode_links:
            episode_no = int(el.get("data-number", 0))
            href = el.get("href", "")
            ep_id = href.split("/")[-1] if href else None
            title = el.get("title", "").strip() if el.get("title") else None
            japanese_title_tag = el.select_one(".ep-name")
            japanese_title = japanese_title_tag.get("data-jname") if japanese_title_tag else None
            filler = "ssl-item-filler" in el.get("class", [])

            res["episodes"].append({
                "episode_no": episode_no,
                "id": ep_id,
                "title": title,
                "japanese_title": japanese_title,
                "filler": filler,
            })

        return res

    except Exception as e:
        print(e)
        return []

episodes = extract_episodes_list("horimiya-15733")
with open("episodes.json", "w") as f:
    f.write(json.dumps(episodes, indent=2))
