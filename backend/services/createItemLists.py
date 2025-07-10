import requests
import json

def create_item_lists():
    url = "https://ddragon.leagueoflegends.com/api/versions.json"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception("Failed to fetch patch version from DDragon API")
    patch = response.json()[0]

    url = f"https://ddragon.leagueoflegends.com/cdn/{patch}/data/en_US/item.json"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception("Failed to fetch item data from DDragon API")
    item_data = response.json()["data"]

    boots = {}
    starter = {}
    completed_items = {}

    for item_id, item_info in item_data.items():
        if "Boots" in item_info["tags"]:
            boots[int(item_id)] = item_info
        elif ("Lane" in item_info["tags"] or "Jungle" in item_info["tags"]) and "Consumable" not in item_info["tags"]:
            starter[int(item_id)] = item_info
        elif "into" not in item_info or not item_info["into"]:
            completed_items[int(item_id)] = item_info

    return starter, boots, completed_items