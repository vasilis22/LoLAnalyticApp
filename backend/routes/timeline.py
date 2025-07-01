import json
import requests
from fastapi import APIRouter, HTTPException
from psycopg2.extras import RealDictCursor
from services.database_con import get_db_connection
from config.settings import REGION_MAPPING
from services.riot_api_services import get_riot_headers

router = APIRouter()

@router.get("/timeline/{match_id}")
def get_match_timeline(match_id: str):
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Check if we have the timeline in the database
                cur.execute("SELECT timeline FROM matches WHERE match_id = %s", (match_id,))
                result = cur.fetchone()
                
                # If we have timeline data, return it
                if result and result["timeline"]:
                    return {"gameid": result["timeline"]["info"]["gameId"], "frames": result["timeline"]["info"]["frames"]}

                # If we don't have the timeline, fetch it from Riot API
                summoner_region = match_id.split("_")[0].lower()
                if summoner_region not in REGION_MAPPING:
                    raise HTTPException(status_code=400, detail="Invalid region specified")
                
                account_region = REGION_MAPPING[summoner_region]
                headers = get_riot_headers()
                
                # Fetch timeline from Riot API
                timeline_url = f"https://{account_region}.api.riotgames.com/lol/match/v5/matches/{match_id}/timeline"
                timeline_response = requests.get(timeline_url, headers=headers)
                
                if timeline_response.status_code != 200:
                    raise HTTPException(status_code=timeline_response.status_code, detail="Error fetching match timeline data")
                
                timeline_data = timeline_response.json()
                
                # Update the match with the timeline data
                cur.execute("""
                    UPDATE matches 
                    SET timeline = %s 
                    WHERE match_id = %s
                """, (json.dumps(timeline_data), match_id))
                
                conn.commit()
                return {"gameid": timeline_data["info"]["gameId"], "frames": timeline_data["info"]["frames"]}
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))