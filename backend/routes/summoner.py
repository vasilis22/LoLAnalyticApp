import json
import requests
from fastapi import APIRouter, HTTPException
from psycopg2.extras import RealDictCursor
from services.database_con import get_db_connection
from config.settings import REGION_MAPPING
from services.riot_api_services import ServiceUnavailable, rgapi_route_request
from ratelimit import RateLimitException

router = APIRouter()

@router.get("/summoner/{summoner_region}/{game_name}/{tagline}")
async def get_summoner_info(summoner_region: str, game_name: str, tagline: str, update: bool = False):
    try:
        if not update:
            with get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT * FROM players 
                        WHERE LOWER(game_name) = LOWER(%s) 
                        AND LOWER(tagline) = LOWER(%s)
                    """, (game_name, tagline))
                    player = cur.fetchone()
                    if player:
                        return player

        if summoner_region not in REGION_MAPPING:
            raise HTTPException(status_code=400, detail="Invalid region specified")
        
        account_region = REGION_MAPPING[summoner_region]
        
        account_url = f"https://{account_region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{game_name}/{tagline}"
        
        
        account_response = rgapi_route_request(account_url)
        account_data = account_response.json()

        puuid = account_data.get("puuid")
        correct_game_name = account_data.get("gameName", game_name)
        correct_tagline = account_data.get("tagLine", tagline)
        
        summoner_url = f"https://{summoner_region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{puuid}"
        
        summoner_response = rgapi_route_request(summoner_url)    
        summoner_data = summoner_response.json()

        profile_icon_id = summoner_data.get("profileIconId")
        summoner_level = summoner_data.get("summonerLevel")

        league_url = f"https://{summoner_region}.api.riotgames.com/lol/league/v4/entries/by-puuid/{puuid}"
        
        league_response = rgapi_route_request(league_url)
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
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO players 
                    (puuid, game_name, tagline, profile_icon_id, summoner_level, ranked_solo, ranked_flex, last_updated)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (puuid) 
                    DO UPDATE SET 
                        game_name = EXCLUDED.game_name,
                        tagline = EXCLUDED.tagline,
                        profile_icon_id = EXCLUDED.profile_icon_id,
                        summoner_level = EXCLUDED.summoner_level,
                        ranked_solo = EXCLUDED.ranked_solo,
                        ranked_flex = EXCLUDED.ranked_flex,
                        last_updated = NOW()
                """, (
                    puuid, 
                    correct_game_name, 
                    correct_tagline, 
                    profile_icon_id, 
                    summoner_level,
                    json.dumps(ranked_data["RANKED_SOLO_5x5"]),
                    json.dumps(ranked_data["RANKED_FLEX_SR"])
                ))
                conn.commit()

        return {
            "game_name": correct_game_name,
            "tagline": correct_tagline,
            "profile_icon_id": profile_icon_id,
            "summoner_level": summoner_level,
            "ranked_solo": ranked_data["RANKED_SOLO_5x5"],
            "ranked_flex": ranked_data["RANKED_FLEX_SR"],
            "puuid": puuid
        }
    
    except ServiceUnavailable:
            raise HTTPException(status_code=503, detail="Riot API service is currently unavailable. Please try again later.")
    except RateLimitException:
        raise HTTPException(status_code=429, detail="Heavy traffic. Please try again later.")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Request timed out")
    except requests.HTTPError as e:
        status_code = e.response.status_code if e.response else 500
        raise HTTPException(status_code=status_code, detail=f"HTTP error: {str(e)}")
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=500, detail="Error fetching account data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))