import json
from typing import Dict
from datetime import datetime
from dataclasses import dataclass
import requests
from tqdm import tqdm
from services.database_con import get_db_connection

@dataclass
class ChampionStats:
    runes: dict
    items: Dict  
    boots: Dict  
    starter_items: Dict  
    matchups: Dict
    games_played: int = 0
    wins: int = 0
    banned: int = 0

class ChampionStatsProcessor:
    def __init__(self,starter_items: dict = None, boot_items: dict = None, endgame_items: dict = None):
        self.champion_stats = {}
        self.total_matches = 0
        self.champion_name_mapping = {
            "FiddleSticks": "Fiddlesticks",
            "Wukong": "MonkeyKing",
        }
        self.champion_id_to_name = {}
        
        self.starter_items = starter_items
        self.boot_items = boot_items
        self.endgame_items = endgame_items

    def normalize_champion_name(self, name: str) -> str:
        return self.champion_name_mapping.get(name, name)

    def process_match(self, match_data: Dict) -> None:
        for participant in match_data["info"]["participants"]:
            self.champion_id_to_name[participant["championId"]] = self.normalize_champion_name(participant["championName"])
            champ_name = self.champion_id_to_name[participant["championId"]]
            if champ_name not in self.champion_stats:
                self.champion_stats[champ_name] = ChampionStats(
                    runes={},
                    items={},
                    boots={},
                    starter_items={},
                    matchups={}
                )
        
        self.total_matches += 1
        
        for team in match_data["info"]["teams"]:
            for ban in team["bans"]:
                if ban["championId"] > 0 and ban["championId"] in self.champion_id_to_name:
                    champion_name = self.champion_id_to_name[ban["championId"]]
                    self.champion_stats[champion_name].banned += 1

        participants = match_data["info"]["participants"]
        for participant in participants:
            champ_name = self.normalize_champion_name(participant["championName"])
            won = participant["win"]
            
            stats = self.champion_stats[champ_name]
            stats.games_played += 1
            
            if won:
                stats.wins += 1
                perks = participant["perks"]
                stat_perks_array = [
                    perks['statPerks']['defense'],
                    perks['statPerks']['flex'],
                    perks['statPerks']['offense']
                ]

                cleared_runes = {
                    'primary_style': perks['styles'][0]['style'],
                    'primary_selections': [selection['perk'] for selection in perks['styles'][0]['selections']],
                    'secondary_style': perks['styles'][1]['style'],
                    'secondary_selections': [selection['perk'] for selection in perks['styles'][1]['selections']],
                    'stat_perks': perks['statPerks']
                }

                rune_key = (
                    cleared_runes['primary_style'],
                    tuple(cleared_runes['primary_selections']),
                    cleared_runes['secondary_style'],
                    tuple(cleared_runes['secondary_selections']),
                    tuple(stat_perks_array)
                )

                if rune_key not in stats.runes:
                    stats.runes[rune_key] = {
                        "count": 1,

                        "perks": participant["perks"]

                        #"primary_style": cleared_runes['primary_style'],
                        #"primary_selections": cleared_runes['primary_selections'],
                        #"secondary_style": cleared_runes['secondary_style'],
                        #"secondary_selections": cleared_runes['secondary_selections'],
                        #"stat_perks": cleared_runes['stat_perks']
                    }
                else:
                    stats.runes[rune_key]["count"] += 1

                for i in range(0, 6):
                    item = participant[f"item{i}"]
                    if item > 0:
                        if item in self.boot_items:
                            if item not in stats.boots:
                                stats.boots[item] = 1
                            else:
                                stats.boots[item] += 1
                        elif item in self.starter_items:
                            if item not in stats.starter_items:
                                stats.starter_items[item] = 1
                            else:
                                stats.starter_items[item] += 1
                        elif item in self.endgame_items:
                            if item not in stats.items:
                                stats.items[item] = 1
                            else:
                                stats.items[item] += 1

            for enemy in participants:
                if enemy["teamId"] != participant["teamId"]:
                    if enemy["teamPosition"] == participant["teamPosition"]:
                        enemy_champ = self.normalize_champion_name(enemy["championName"])
                        if enemy_champ not in stats.matchups:
                            stats.matchups[enemy_champ] = {"wins": 0, "total": 0}
                        if won:
                            stats.matchups[enemy_champ]["wins"] += 1
                            stats.matchups[enemy_champ]["total"] += 1
                        else:
                            stats.matchups[enemy_champ]["total"] += 1

    def process_matches(self, matches: dict) -> None:
        for game in tqdm(matches, desc="Processing matches"):
            self.process_match(game["match_data"])

    def calculate_final_stats(self,current_version,champions_data) -> Dict:
        result = {}
        for champ_name, stats in self.champion_stats.items():
            if stats.games_played == 0:
                continue

            champion = champions_data[champ_name]

            win_rate = stats.wins / stats.games_played
            pick_rate = stats.games_played / self.total_matches
            ban_rate = stats.banned / self.total_matches

            top_runes = sorted(
                stats.runes.items(),
                key=lambda x: x[1]["count"],
                reverse=True
            )[:4]

            all_items = sorted(
                stats.items.items(),
                key=lambda x: x[1],
                reverse=True
            )
            
            core_items = all_items[:2]
            
            option_items = all_items[2:8]
            
            most_picked_boot = sorted(
                stats.boots.items(),
                key=lambda x: x[1],
                reverse=True
            )[:1]
            
            most_picked_starter = sorted(
                stats.starter_items.items(),
                key=lambda x: x[1],
                reverse=True
            )[:1]

            worst_matchups = {}
            for enemy_champ, matchup in stats.matchups.items():
                if matchup["total"] >= 10:
                    win_rate_vs = matchup["wins"] / matchup["total"]
                    worst_matchups[enemy_champ] = win_rate_vs
            
            worst_matchups = sorted(
                worst_matchups.items(),
                key=lambda x: x[1]
            )[:10]

            result[champ_name] = {
                "id": champ_name,
                "name": champion["name"],
                "title": champion["title"],
                "image": f"https://ddragon.leagueoflegends.com/cdn/{current_version}/img/champion/{champion['id']}.png",
                "roles": champion["tags"],
                "winRate": win_rate,
                "pickRate": pick_rate,
                "banRate": ban_rate,
                "gamesPlayed": stats.games_played,
                "mostUsedRunes": [{"id": key, "rune_trees": data} for key, data in top_runes],
                "mostPickedStarter": {"id": most_picked_starter[0][0], "count": most_picked_starter[0][1]} if most_picked_starter else None,
                "mostPickedBoot": {"id": most_picked_boot[0][0], "count": most_picked_boot[0][1]} if most_picked_boot else None,
                "coreItems": [{"id": id, "count": count} for id, count in core_items],
                "itemOptions": [{"id": id, "count": count} for id, count in option_items],
                "worstMatchups": [{"champion": champ, "win_rate": wr} for champ, wr in worst_matchups]
            }

        return result

    def save_stats(self, patch: str) -> None:

        version_url = "https://ddragon.leagueoflegends.com/api/versions.json"
        version_response = requests.get(version_url)
        if version_response.status_code != 200:
            raise Exception("Error fetching game version")
        current_version = version_response.json()[0]

        champions_url = f"https://ddragon.leagueoflegends.com/cdn/{current_version}/data/en_US/champion.json"
        champions_response = requests.get(champions_url)
        if champions_response.status_code != 200:
            raise Exception("Error fetching champion data")
        champions_data = champions_response.json()["data"]

        stats = {
            "patch_version": patch,
            "total_matches_analyzed": self.total_matches,
            "last_updated": datetime.now().strftime("%d-%m-%Y"),
            "champions": self.calculate_final_stats(current_version,champions_data)
        }

        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO tierlist (patch, tierlist_data)
                        VALUES (%s, %s)
                        ON CONFLICT (patch) DO UPDATE
                        SET tierlist_data = EXCLUDED.tierlist_data
                    """, (patch, json.dumps(stats)))
                
                with conn.cursor() as cursor:
                    cursor.execute("""
                        UPDATE patch_tracking
                        SET tierlist_generated = TRUE
                        WHERE patch = %s
                    """, (patch,))

                conn.commit()
            print(f"Champion stats for patch {patch} saved successfully.")
        except Exception as e:
            print(f"Error saving champion stats for patch {patch}: {str(e)}")
            raise