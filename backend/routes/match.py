import requests
import json
from fastapi import APIRouter, HTTPException
from services.database_con import get_db_connection
from psycopg2.extras import RealDictCursor
from config.settings import REGION_MAPPING, CHAMPION_NAME_MAPPING
from services.riot_api_services import ServiceUnavailable, rgapi_route_request
from ratelimit import RateLimitException

router = APIRouter()

@router.get("/match/{summoner_region}/{puuid}/{count}")
def get_match_history(summoner_region: str, puuid: str, count: int, update: bool = False, queue_id: int = None):
    try:

        query = """
                SELECT m.*, pm.player_index
                FROM matches m
                JOIN player_matches pm ON m.match_id = pm.match_id
                WHERE pm.puuid = %s"""
        
        params = [puuid]

        if queue_id:
            query += " AND m.queue_id = %s"
            params.append(queue_id)

        query += " ORDER BY m.created_at DESC LIMIT %s"
        params.append(count)
        
        if update:

            if summoner_region not in REGION_MAPPING:
                raise HTTPException(status_code=400, detail="Invalid region specified")
            
            account_region = REGION_MAPPING[summoner_region]

            matchlist_url = f"https://{account_region}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?start=0&count=20"
            
            matchlist_response = rgapi_route_request(matchlist_url)
            match_ids = matchlist_response.json()

            with get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT m.match_id 
                        FROM matches m
                        JOIN player_matches pm ON m.match_id = pm.match_id
                        WHERE pm.puuid = %s
                        ORDER BY m.created_at DESC
                        LIMIT 1
                    """, (puuid,))
                    result = cur.fetchone()
                    latest_match_id = result['match_id'] if result else None

            matches_to_process = []

            for match_id in match_ids:
                if match_id == latest_match_id:
                    break
                matches_to_process.append(match_id)

            matches_to_process.reverse()

            for match_id in matches_to_process:
                match_url = f"https://{account_region}.api.riotgames.com/lol/match/v5/matches/{match_id}"
                
                match_response = rgapi_route_request(match_url)
                match_data = match_response.json()

                for participant in match_data["info"]["participants"]:
                    if participant["championName"] in CHAMPION_NAME_MAPPING:
                        participant["championName"] = CHAMPION_NAME_MAPPING[participant["championName"]]

                patch_version = ".".join(match_data["info"]["gameVersion"].split(".")[:2])
                player_index = match_data["metadata"]["participants"].index(puuid)
                
                with get_db_connection() as conn:
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        cur.execute("""
                            INSERT INTO matches (match_id, patch, game_duration, game_mode, queue_id, match_data)
                            VALUES (%s, %s, %s, %s, %s, %s)
                            ON CONFLICT (match_id) DO UPDATE 
                            SET patch = EXCLUDED.patch,
                                game_duration = EXCLUDED.game_duration,
                                game_mode = EXCLUDED.game_mode,
                                queue_id = EXCLUDED.queue_id,
                                match_data = EXCLUDED.match_data
                        """, (
                            match_data["metadata"]["matchId"],
                            patch_version,
                            match_data["info"]["gameDuration"],
                            match_data["info"]["gameMode"],
                            match_data["info"]["queueId"],
                            json.dumps(match_data)
                        ))

                        cur.execute("""
                            INSERT INTO player_matches (puuid, match_id, player_index, champion_name)
                            VALUES (%s, %s, %s, %s)
                            ON CONFLICT (puuid, match_id) DO UPDATE 
                            SET player_index = EXCLUDED.player_index,
                                champion_name = EXCLUDED.champion_name
                        """, (
                            puuid,
                            match_data["metadata"]["matchId"],
                            player_index,
                            match_data["info"]["participants"][player_index]["championName"]
                        ))
        
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                matches = cur.fetchall()
                return matches
            
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