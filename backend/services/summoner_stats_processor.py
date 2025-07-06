from psycopg2.extras import RealDictCursor
from services.database_con import get_db_connection
import requests
import json

def process_summoner_champion_stats(puuid: str):
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT DISTINCT SUBSTRING(m.patch FROM '^[0-9]+') AS season
                    FROM matches m
                    JOIN player_matches pm ON m.match_id = pm.match_id
                    WHERE pm.puuid = %s
                """, (puuid,))
                seasons = {row["season"] for row in cur.fetchall()}

        for season in seasons:
            with get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT m.match_data, pm.player_index
                        FROM matches m
                        JOIN player_matches pm ON m.match_id = pm.match_id
                        WHERE pm.puuid = %s AND m.patch LIKE %s
                    """, (puuid, f"{season}.%"))
                    matches = cur.fetchall()

            stats = {}

            for game in matches:
                participant = game["match_data"]["info"]["participants"][game["player_index"]]
                queue_type = game["match_data"]["info"]["queueId"]

                if queue_type != 420 and queue_type != 400:
                    continue
                
                if participant["championName"] not in stats:
                    stats[participant["championName"]] = {
                        "normal": {
                            "total": 0,
                            "wins": 0,
                            "kills": 0,
                            "deaths": 0,
                            "assists": 0,
                        },
                        "420": {
                            "total": 0,
                            "wins": 0,
                            "kills": 0,
                            "deaths": 0,
                            "assists": 0,
                        }
                    }

                stats[participant["championName"]]["normal"]["total"] += 1
                stats[participant["championName"]]["normal"]["kills"] += participant["kills"]
                stats[participant["championName"]]["normal"]["deaths"] += participant["deaths"]
                stats[participant["championName"]]["normal"]["assists"] += participant["assists"]
                if participant["win"]:
                    stats[participant["championName"]]["normal"]["wins"] += 1

                if queue_type == 420:
                    stats[participant["championName"]]["420"]["total"] += 1
                    stats[participant["championName"]]["420"]["kills"] += participant["kills"]
                    stats[participant["championName"]]["420"]["deaths"] += participant["deaths"]
                    stats[participant["championName"]]["420"]["assists"] += participant["assists"]
                    if participant["win"]:
                        stats[participant["championName"]]["420"]["wins"] += 1

            final = {}
            response = requests.get("https://ddragon.leagueoflegends.com/api/versions.json")
            if response.status_code != 200:
                raise Exception("Failed to fetch patch version from DDragon API")
            patch = response.json()[0]

            for champion, data in stats.items():
                final[champion] = {
                    "image" : f"https://ddragon.leagueoflegends.com/cdn/{patch}/img/champion/{champion}.png",
                    "normal": {
                        "total": data["normal"]["total"],
                        "wins": data["normal"]["wins"],
                        "kills": data["normal"]["kills"],
                        "deaths": data["normal"]["deaths"],
                        "assists": data["normal"]["assists"],
                        "winrate": data["normal"]["wins"] / data["normal"]["total"],
                        "kda": (data["normal"]["kills"] + data["normal"]["assists"]) / data["normal"]["deaths"] if data["normal"]["deaths"] > 0 else 1
                    },
                    "420": {
                        "total": data["420"]["total"],
                        "wins": data["420"]["wins"],
                        "kills": data["420"]["kills"],
                        "deaths": data["420"]["deaths"],
                        "assists": data["420"]["assists"],
                        "winrate": data["420"]["wins"] / data["420"]["total"] if data["420"]["total"] > 0 else 0,
                        "kda": (data["420"]["kills"] + data["420"]["assists"]) / data["420"]["deaths"] if data["420"]["deaths"] > 0 else 1
                    }
                }

            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO summoner_stats (puuid, season, champion_stats)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (puuid, season) DO UPDATE SET champion_stats = EXCLUDED.champion_stats
                    """, (puuid, season, json.dumps(final)))

    except Exception as e:
        raise Exception(f"Error processing summoner champion stats: {str(e)}")
