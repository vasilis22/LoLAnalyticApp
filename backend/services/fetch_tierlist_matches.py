import json
from psycopg2.extras import RealDictCursor
from services.database_con import get_db_connection
from config.settings import TIERS, DIVISIONS
from services.riot_api_services import get_retry, get_riot_headers
from services.ratecheck import ratecheck
from services.validator import check_duration, get_match_patch_version, is_patch_older
from services.patchtrack import update_patch_tracking
from services.getnextdivisiontier import get_next_division_tier
from services.processMatches import ChampionStatsProcessor
from services.createItemLists import create_item_lists

def fetch_tierlist_matches(patch_version):
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT last_tier, last_division, last_page, games_tracked, games_to_track FROM patch_tracking 
                WHERE patch = %s
            """, (patch_version,))
            result = cur.fetchone()

            if result:
                matches_to_track = result["games_to_track"]
                matches_tracked = result["games_tracked"]
                page = result["last_page"]
                current_tier = result["last_tier"] or TIERS[0]
                current_division = result["last_division"] or DIVISIONS[0]

        print(f"Starting match collection for patch {patch_version}...")
        print(f"Starting from: {current_tier} {current_division}, page {page}, {matches_tracked} matches tracked")

        headers = get_riot_headers()
        rate_checker = ratecheck(rate=85, window=120)
        
        while matches_tracked < matches_to_track:
            while page <= 10:
                print(f"Processing {current_tier} {current_division}, page {page}")
                tier_url = f"https://eun1.api.riotgames.com/lol/league-exp/v4/entries/RANKED_SOLO_5x5/{current_tier}/{current_division}?page={page}"
                response = get_retry(tier_url, headers=headers, retries=3, timeout=10, rate_checker=rate_checker)
                
                if not response or response.status_code != 200:
                    print(f"Failed to fetch data for {current_tier} {current_division} page {page}: {response.status_code if response else 'No response'}")
 
                summoners = response.json()
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
                    matchlist_response = get_retry(matchlist_url, headers=headers, retries=3, timeout=10, rate_checker=rate_checker)

                    if not matchlist_response or matchlist_response.status_code != 200:
                        continue

                    match_ids = matchlist_response.json()
                    player_matches_processed = 0
                    
                    for match_id in match_ids:
                        if matches_tracked >= matches_to_track:
                            break
                            
                        match_url = f"https://europe.api.riotgames.com/lol/match/v5/matches/{match_id}"
                        match_response = get_retry(match_url, headers=headers, retries=3, timeout=10, rate_checker=rate_checker)

                        if not match_response or match_response.status_code != 200:
                            continue
                        
                        match_data = match_response.json()
                        
                        match_patch = get_match_patch_version(match_data)
                        if is_patch_older(match_patch, patch_version):
                            #print(f"Found older patch match ({match_patch} < {patch_version}) for player {puuid}, stopping after {player_matches_processed} matches")
                            break
                        
                        if not check_duration(match_data):
                            continue
                        
                        with conn.cursor(cursor_factory=RealDictCursor) as cur:
                            cur.execute("""
                                INSERT INTO tierlist_matches (match_id, patch, match_data)
                                VALUES (%s, %s, %s)
                                ON CONFLICT (match_id) DO NOTHING
                            """, (
                                match_data["metadata"]["matchId"],
                                patch_version,
                                json.dumps(match_data)
                            ))
                            
                            if cur.rowcount > 0:
                                cur.execute("""
                                    UPDATE patch_tracking 
                                    SET games_tracked = games_tracked + 1 
                                    WHERE patch = %s
                                """, (patch_version,))
                                matches_tracked += 1
                                player_matches_processed += 1
                                
                            #else:
                                #print(f"DUPLICATE: {match_data['metadata']['matchId']} - Already in database")
                            
                            conn.commit()
                    
                    #if player_matches_processed > 0:
                        #print(f"Processed {player_matches_processed} matches from current patch for player {puuid}")
                
                print(f"Saving progress: {current_tier} {current_division} page {page}")
                update_patch_tracking(patch_version, current_tier, current_division, page, conn)
                
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
        
    finally:
        conn.close()