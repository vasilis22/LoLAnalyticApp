import json
import requests
from fastapi import APIRouter, HTTPException
from psycopg2.extras import RealDictCursor
from services.database_con import get_db_connection
from config.settings import REGION_MAPPING
from services.riot_api_services import rgapi_route_request, ServiceUnavailable
from ratelimit import RateLimitException

router = APIRouter()

@router.get("/timeline/{match_id}")
def get_match_timeline(match_id: str):
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT timeline FROM matches WHERE match_id = %s", (match_id,))
                result = cur.fetchone()
                
                if result and result["timeline"]:
                    return {"gameid": result["timeline"]["info"]["gameId"], "frames": result["timeline"]["info"]["frames"]}

                summoner_region = match_id.split("_")[0].lower()
                if summoner_region not in REGION_MAPPING:
                    raise HTTPException(status_code=400, detail="Invalid region specified")
                
                account_region = REGION_MAPPING[summoner_region]

                timeline_url = f"https://{account_region}.api.riotgames.com/lol/match/v5/matches/{match_id}/timeline"
                
                timeline_response = rgapi_route_request(timeline_url)
                timeline_data = timeline_response.json()
                
                cur.execute("""
                    UPDATE matches 
                    SET timeline = %s 
                    WHERE match_id = %s
                """, (json.dumps(timeline_data), match_id))
                
                conn.commit()
                return {"gameid": timeline_data["info"]["gameId"], "frames": timeline_data["info"]["frames"]}
            
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