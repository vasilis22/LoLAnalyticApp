from fastapi import APIRouter, BackgroundTasks
from services.fetch_tierlist_matches import fetch_tierlist_matches
from services.patchcheck import check_patch

router = APIRouter()

@router.get(path="/patch/check")
def manual_patch_check():
    new_patch, patch = check_patch()
    if new_patch:
        return {"message": f"New patch detected: {patch}. Match fetching started automatically."}
    else:
        return {"message": f"No new patch detected. Current patch: {patch}"}
    
@router.get("/fetchgames")
def fetch_games(background_tasks: BackgroundTasks):
    background_tasks.add_task(fetch_tierlist_matches, "15.13")