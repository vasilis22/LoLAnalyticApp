import requests
import json
from fastapi import APIRouter, HTTPException
from services.database_con import get_db_connection
from psycopg2.extras import RealDictCursor
from config.settings import REGION_MAPPING, CHAMPION_NAME_MAPPING
from services.riot_api_services import get_riot_headers

router = APIRouter()

@router.get("/match/{summoner_region}/{puuid}")
def get_match_history(summoner_region: str, puuid: str, update: bool = False):
    try:
        # Check database first if not updating
        if not update:
            with get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT m.*, pm.player_index
                        FROM matches m
                        JOIN player_matches pm ON m.match_id = pm.match_id
                        WHERE pm.puuid = %s
                        ORDER BY m.created_at DESC
                        LIMIT 10
                    """, (puuid,))
                    matches = cur.fetchall()
                    return matches if matches else []

        if summoner_region not in REGION_MAPPING:
            raise HTTPException(status_code=400, detail="Invalid region specified")
        
        account_region = REGION_MAPPING[summoner_region]
        headers = get_riot_headers()

        # Get match IDs from Riot API
        matchlist_url = f"https://{account_region}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?start=0&count=20"
        matchlist_response = requests.get(matchlist_url, headers=headers)

        if matchlist_response.status_code != 200:
            raise HTTPException(status_code=matchlist_response.status_code, detail="Error fetching match history")
        
        match_ids = matchlist_response.json()

        # Get latest match from database
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

        matches_to_process.reverse()  # Process from oldest to newest

        for match_id in matches_to_process:
            match_url = f"https://{account_region}.api.riotgames.com/lol/match/v5/matches/{match_id}"
            match_response = requests.get(match_url, headers=headers)

            if match_response.status_code != 200:
                raise HTTPException(status_code=match_response.status_code, detail="Error fetching match data")
            
            match_data = match_response.json()            # Map champion names if needed
            for participant in match_data["info"]["participants"]:
                if participant["championName"] in CHAMPION_NAME_MAPPING:
                    participant["championName"] = CHAMPION_NAME_MAPPING[participant["championName"]]

            # Extract patch version from game version
            patch_version = ".".join(match_data["info"]["gameVersion"].split(".")[:2])
            player_index = match_data["metadata"]["participants"].index(puuid)
            
            # Insert or update match data in database
            with get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Insert/update match data
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

                    # Insert/update player_matches entry only for the current player
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
                cur.execute("""
                    SELECT m.*, pm.player_index
                    FROM matches m
                    JOIN player_matches pm ON m.match_id = pm.match_id
                    WHERE pm.puuid = %s
                    ORDER BY m.created_at DESC
                    LIMIT 10
                """, (puuid,))
                matches = cur.fetchall()
                return matches
                    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))