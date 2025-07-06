from fastapi import APIRouter, HTTPException
from psycopg2.extras import RealDictCursor
from services.database_con import get_db_connection
from services.summoner_stats_processor import process_summoner_champion_stats

router = APIRouter()

@router.get("/summoner/champstats/{puuid}")
async def get_summoner_champ_stats(puuid: str, update: bool = False):
    try:
        if not update:
            with get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT season, champion_stats
                        FROM summoner_stats
                        WHERE puuid = %s
                    """, (puuid,))
                    result = cur.fetchall()
                    if result:
                        return result
        process_summoner_champion_stats(puuid)
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT season, champion_stats
                    FROM summoner_stats
                    WHERE puuid = %s
                """, (puuid,))
                result = cur.fetchall()
                if result:
                    return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))