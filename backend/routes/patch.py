from fastapi import APIRouter, BackgroundTasks, HTTPException
from services.fetch_tierlist_matches import fetch_tierlist_matches
from services.patchcheck import check_patch
from services.database_con import get_db_connection

router = APIRouter()

@router.get(path="/patch/check")
def manual_patch_check():
    new_patch, patch = check_patch()
    if new_patch:
        return {"message": f"New patch detected: {patch}. Match fetching started automatically."}
    else:
        return {"message": f"No new patch detected. Current patch: {patch}"}
    
@router.get("/fetchgames/{patch}")
def fetch_games(patch: str, background_tasks: BackgroundTasks):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT patch
                FROM patch_tracking
                WHERE patch = %s
            """, (patch,))
            if not cur.fetchone():
                raise HTTPException(
                    status_code = 400,
                    detail = f"Patch {patch} not initialized for fetching."
                )
    finally:
        conn.close()
    background_tasks.add_task(fetch_tierlist_matches, patch)
    return {"message": "Match fetching started in the background."}