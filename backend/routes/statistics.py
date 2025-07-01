import json
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/champions/statistics")
def get_champion_statistics():
    try:
        with open("D:/LoLAnalyticApp/backend/tierlist.json", 'r', encoding='utf-8') as f:
            tierlist_data = json.load(f)

            print("tierlist_data:", tierlist_data)

        return tierlist_data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Tierlist data not found. Please process match data first.")