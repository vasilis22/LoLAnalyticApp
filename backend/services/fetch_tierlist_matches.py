import json
import time
import requests
from psycopg2.extras import RealDictCursor
from services.database_con import get_db_connection
from config.settings import TIERS, DIVISIONS
from services.riot_api_services import rgapi_background_request
from services.validator import check_duration, get_match_patch_version, compare_patches
from services.patchtrack import update_patch_tracking
from services.getnextdivisiontier import get_next_division_tier
from services.processMatches import ChampionStatsProcessor
from services.createItemLists import create_item_lists

def fetch_tierlist_matches(patch_version):
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            start = time.perf_counter()
            cur.execute("""
                SELECT last_tier, last_division, last_page, games_tracked, games_to_track 
                FROM patch_tracking 
                WHERE patch = %s
            """, (patch_version,))
            result = cur.fetchone()
            print(f"[DB] patch_tracking SELECT for patch {patch_version} took {time.perf_counter() - start:.4f}s")

            start = time.perf_counter()
            cur.execute("""
                SELECT COUNT(patch) AS count
                FROM tierlist_matches
                WHERE patch = %s
            """, (patch_version,))
            existing_count_result = cur.fetchone()["count"]
            print(f"[DB] tierlist_matches COUNT for patch {patch_version} took {time.perf_counter() - start:.4f}s")
            
            if result:
                matches_to_track = result["games_to_track"]
                matches_tracked = existing_count_result
                page = result["last_page"]
                current_tier = result["last_tier"] or TIERS[0]
                current_division = result["last_division"] or DIVISIONS[0]

        print(f"Starting match collection for patch {patch_version}...")
        print(f"Starting from: {current_tier} {current_division}, page {page}, {matches_tracked} matches tracked")
        
        while matches_tracked < matches_to_track:
            while page <= 10:
                print(f"Processing {current_tier} {current_division}, page {page}")
                
                tier_url = f"https://eun1.api.riotgames.com/lol/league-exp/v4/entries/RANKED_SOLO_5x5/{current_tier}/{current_division}?page={page}"
                
                try:
                    response = rgapi_background_request(tier_url)
                    summoners = response.json()
                except requests.exceptions.Timeout as e:
                    print(f"Temporary error fetching {current_tier} {current_division} page {page}: {e}. Skipping to next page.")
                    page += 1
                    continue 

                if not summoners:
                    print(f"No more summoners in {current_tier} {current_division}, moving to next division")
                    break
                
                for summoner in summoners:
                    if matches_tracked >= matches_to_track:
                        break

                    puuid = summoner.get("puuid")
                    if not puuid:
                        continue
                    
                    matchlist_url = f"https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?queue=420&type=ranked&start=0&count=100"
                    
                    try:
                        matchlist_response = rgapi_background_request(matchlist_url)
                        match_ids = matchlist_response.json()
                    except requests.exceptions.Timeout as e:
                        print(f"Temporary error fetching match list for player {puuid}: {e}. Skipping player.")
                        continue
                    
                    if not match_ids:
                        continue

                    player_matches_processed = 0

                    for match_id in match_ids:
                        if matches_tracked >= matches_to_track:
                            break
                            
                        match_url = f"https://europe.api.riotgames.com/lol/match/v5/matches/{match_id}"
                        
                        try:
                            api_start = time.perf_counter()
                            match_response = rgapi_background_request(match_url)
                            match_data = match_response.json()
                            print(f"[API] match detail request {match_id} took {time.perf_counter() - api_start:.4f}s")
                        except requests.exceptions.Timeout as e:
                            print(f"Temporary error fetching match {match_id}: {e}. Skipping match.")
                            continue
                        
                        match_patch = get_match_patch_version(match_data)

                        try:
                            cmp = compare_patches(match_patch, patch_version)
                        except Exception as e:
                            print(f"Error comparing patch versions for match {match_id}: {e}. Skipping match.")
                            with open ("error_log.json", "w") as error_file:
                                json.dump(match_data, error_file)
                            continue

                        if not check_duration(match_data):
                            continue

                        if cmp < 0:
                            #print(f"Found older patch match ({match_patch} < {patch_version}) for player {puuid}, stopping after {player_matches_processed} matches")
                            break

                        if cmp > 0:
                            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                                db_start = time.perf_counter()
                                cur.execute("""
                                    INSERT INTO patch_tracking (patch)
                                    VALUES (%s)
                                    ON CONFLICT (patch) DO NOTHING"""
                                    , (match_patch,))
                                conn.commit()
                                print(f"[DB] patch_tracking INSERT for patch {match_patch} took {time.perf_counter() - db_start:.4f}s")
                        
                        with conn.cursor(cursor_factory=RealDictCursor) as cur:
                            db_start = time.perf_counter()
                            cur.execute("""
                                INSERT INTO tierlist_matches (match_id, patch, match_data)
                                VALUES (%s, %s, %s)
                                ON CONFLICT (match_id) DO NOTHING
                            """, (
                                match_data["metadata"]["matchId"],
                                match_patch,
                                json.dumps(match_data)
                            ))
                            
                            if cur.rowcount > 0 and cmp == 0:
                                cur.execute("""
                                    UPDATE patch_tracking 
                                    SET games_tracked = games_tracked + 1 
                                    WHERE patch = %s
                                """, (patch_version,))
                                matches_tracked += 1
                                player_matches_processed += 1
                                
                            conn.commit()
                            print(f"[DB] tierlist_matches INSERT/UPDATE for match {match_id} took {time.perf_counter() - db_start:.4f}s")
                    
                    #if player_matches_processed > 0:
                        #print(f"Processed {player_matches_processed} matches from current patch for player {puuid}")
                
                print(f"Saving progress: {current_tier} {current_division} page {page}")
                upd_start = time.perf_counter()
                update_patch_tracking(patch_version, current_tier, current_division, page, conn)
                print(f"[DB] update_patch_tracking for {patch_version} {current_tier} {current_division} page {page} took {time.perf_counter() - upd_start:.4f}s")
                
                if matches_tracked >= matches_to_track:
                    break
                    
                page += 1
                #print(f"Moving to next page: {page}")
                
            current_tier, current_division = get_next_division_tier(current_tier, current_division)
            page = 1
        
        print(f"Completed: {matches_tracked} matches collected for patch {patch_version}")

        starter, boots, completed_items = create_item_lists()
        processor = ChampionStatsProcessor(starter, boots, completed_items)

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT match_data
                FROM tierlist_matches
                WHERE patch = %s
            """, (patch_version,))

            matches = cur.fetchall()
            processor.process_matches(matches)
            processor.save_stats(patch_version)

    except Exception as e:
        print(f"Error in fetch_tierlist_matches: {str(e)}")
        return
        
    finally:
        conn.close()