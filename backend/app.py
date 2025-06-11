from fastapi import FastAPI, HTTPException
import requests
from fastapi.middleware.cors import CORSMiddleware
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RIOT_API_KEY = os.getenv("RIOT_API_KEY")

REGION_MAPPING = {
    # Americas
    "na1": "americas",
    "br1": "americas",
    "la1": "americas",
    "la2": "americas",
    
    # Europe
    "euw1": "europe",
    "eun1": "europe",
    "tr1": "europe",
    "ru": "europe",
    
    # Asia
    "kr": "asia",
    "jp1": "asia",
    "oc1": "asia",
    "tw2": "asia",
    "sg2": "asia",
    "vn2": "asia",
    "me1": "asia"
}

CHAMPION_NAME_MAPPING = {
    "FiddleSticks": "Fiddlesticks",
    "Wukong": "MonkeyKing",
}

@app.get("/")
def home():
    return {"message": "Welcome to the League Stats API"}

@app.get("/summoner/{summoner_region}/{game_name}/{tagline}")
def get_summoner_info(summoner_region: str, game_name: str, tagline: str):
    if summoner_region not in REGION_MAPPING:
        raise HTTPException(status_code=400, detail="Invalid region specified")
    
    account_region = REGION_MAPPING[summoner_region]
    
    headers = {"X-Riot-Token": RIOT_API_KEY}
    
    account_url = f"https://{account_region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{game_name}/{tagline}"
    account_response = requests.get(account_url, headers=headers)
    
    if account_response.status_code != 200:
        raise HTTPException(status_code=account_response.status_code, detail="Error fetching account data")
    
    account_data = account_response.json()
    puuid = account_data.get("puuid")
    correct_game_name = account_data.get("gameName", game_name)
    correct_tagline = account_data.get("tagLine", tagline)
    
    summoner_url = f"https://{summoner_region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{puuid}"
    summoner_response = requests.get(summoner_url, headers=headers)
    
    if summoner_response.status_code != 200:
        raise HTTPException(status_code=summoner_response.status_code, detail="Error fetching summoner data")
    
    summoner_data = summoner_response.json()
    profile_icon_id = summoner_data.get("profileIconId")
    summoner_level = summoner_data.get("summonerLevel")

    league_url = f"https://{summoner_region}.api.riotgames.com/lol/league/v4/entries/by-puuid/{puuid}"
    league_response = requests.get(league_url, headers=headers)

    if league_response.status_code != 200:
        raise HTTPException(status_code=league_response.status_code, detail="Error fetching league data")
    
    league_data = league_response.json()
    
    ranked_data = {
        "RANKED_SOLO_5x5": None,
        "RANKED_FLEX_SR": None,
    }

    for entry in league_data:
        queue_type = entry.get("queueType")
        if queue_type in ranked_data:
            ranked_data[queue_type] = {
                "tier": entry.get("tier"),
                "rank": entry.get("rank"),
                "leaguePoints": entry.get("leaguePoints"),
                "wins": entry.get("wins"),
                "losses": entry.get("losses"),
            }
    
    return {
        "game_name": correct_game_name,
        "tagline": correct_tagline,
        "profile_icon_id": profile_icon_id,
        "summoner_level": summoner_level,
        "ranked_solo": ranked_data["RANKED_SOLO_5x5"],
        "ranked_flex": ranked_data["RANKED_FLEX_SR"],
        "puuid": puuid
    }

@app.get("/match/{summoner_region}/{puuid}")
def get_match_history(summoner_region: str, puuid: str):
    if summoner_region not in REGION_MAPPING:
        raise HTTPException(status_code=400, detail="Invalid region specified")
    
    account_region = REGION_MAPPING[summoner_region]
    
    headers = {"X-Riot-Token": RIOT_API_KEY}

    matchlist_url = f"https://{account_region}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?start=0&count=10"
    matchlist_response = requests.get(matchlist_url, headers=headers)

    if matchlist_response.status_code != 200:
        raise HTTPException(status_code=matchlist_response.status_code, detail="Error fetching match history")
    
    match_ids = matchlist_response.json()

    matches = []

    for match_id in match_ids:
        match_url = f"https://{account_region}.api.riotgames.com/lol/match/v5/matches/{match_id}"
        match_response = requests.get(match_url, headers=headers)

        if match_response.status_code != 200:
            raise HTTPException(status_code=match_response.status_code, detail="Error fetching match data")
        
        match_data = match_response.json()

        for participant in match_data["info"]["participants"]:
            if participant["championName"] in CHAMPION_NAME_MAPPING:
                participant["championName"] = CHAMPION_NAME_MAPPING[participant["championName"]]

        match_info = {
            "gameId": match_data["metadata"]["matchId"],
            "gameDuration": match_data["info"]["gameDuration"],
            "gameMode": match_data["info"]["gameMode"],
            "queueId": match_data["info"]["queueId"],
            "participants": match_data["info"]["participants"],
            "playerIndex": match_data["metadata"]["participants"].index(puuid)
        }
        matches.append(match_info)

    return matches

@app.get("/timeline/{match_id}")
def get_match_timeline(match_id: str):

    summoner_region = match_id.split("_")[0].lower()

    if summoner_region not in REGION_MAPPING:
        raise HTTPException(status_code=400, detail="Invalid region specified")
    
    account_region = REGION_MAPPING[summoner_region]

    headers={"X-Riot-Token": RIOT_API_KEY}

    timeline_url = f"https://{account_region}.api.riotgames.com/lol/match/v5/matches/{match_id}/timeline"
    timeline_response = requests.get(timeline_url, headers=headers)

    if timeline_response.status_code != 200:
        raise HTTPException(status_code=timeline_response.status_code, detail="Error fetching match timeline data")
    
    timeline_data = timeline_response.json()

    return {
        "gameId": timeline_data["info"]["gameId"],
        "frames": timeline_data["info"]["frames"]
    }

@app.get("/champions/statistics")
def get_champion_statistics():
    try:
        with open("d:/test/tierlist.json", 'r', encoding='utf-8') as f:
            tierlist_data = json.load(f)

        return tierlist_data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Tierlist data not found. Please process match data first.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)