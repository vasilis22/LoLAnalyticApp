from fastapi import APIRouter, HTTPException
from psycopg2.extras import RealDictCursor
from services.database_con import get_db_connection

router = APIRouter()

@router.get("/champions/statistics")
def get_champion_statistics():
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT tierlist_data
                FROM tierlist
                WHERE patch = (SELECT MAX(patch) FROM tierlist)
            """)
            tierlist_data = cur.fetchone()

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    if tierlist_data:
        return tierlist_data["tierlist_data"]
    else:
        raise HTTPException(status_code=404, detail="No tierlist data found. A patch needs to be processed first.")

    
        