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

        if tierlist_data:
            return tierlist_data["tierlist_data"]

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Tierlist data not found. Please process match data first.")