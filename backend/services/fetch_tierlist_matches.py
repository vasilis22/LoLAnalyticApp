import json
from psycopg2.extras import RealDictCursor
from services.database_con import get_db_connection
from config.settings import TIERS, DIVISIONS
from services.riot_api_services import get_retry, get_riot_headers
from services.ratecheck import ratecheck
from services.validator import valid_match_data
from services.patchtrack import update_patch_tracking

def fetch_tierlist_matches(patch_version):
    conn = get_db_connection()
    
    try:
        # Get current progress from database
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT last_tier, last_division, last_page, games_tracked FROM patch_tracking 
                WHERE patch = %s
            """, (patch_version,))
            result = cur.fetchone()
            
            if result and result["last_tier"] and result["last_division"]:
                tier = result["last_tier"]
                division = result["last_division"]
                page = result["last_page"] or 1
                matches_tracked = result["games_tracked"] or 0
                print(f"Resuming from: {tier} {division}, page {page}, {matches_tracked} matches tracked")
            else:
                tier = TIERS[0]
                division = DIVISIONS[0]
                page = 1
                matches_tracked = 0
                print(f"Starting fresh collection for patch {patch_version}")

        headers = get_riot_headers()
        rate_checker = ratecheck.ratecheck(rate=85, window=120)
        
        # Find starting indices
        tier_index = TIERS.index(tier) if tier in TIERS else 0
        division_index = DIVISIONS.index(division) if division in DIVISIONS else 0
        
        while matches_tracked < 40000:
            for t_index in range(tier_index, len(TIERS)):
                for d_index in range(division_index, len(DIVISIONS)):
                    current_tier = TIERS[t_index]
                    current_division = DIVISIONS[d_index]
                    
                    print(f"Processing {current_tier} {current_division}, page {page}")
                    
                    tier_url = f"https://eun1.api.riotgames.com/lol/league-exp/v4/entries/RANKED_SOLO_5x5/{current_tier}/{current_division}?page={page}"
                    response = get_retry(tier_url, headers=headers, retries=3, timeout=10, rate_checker=rate_checker)

                    if not response or response.status_code != 200:
                        print(f"Failed to fetch data for {current_tier} {current_division}: {response.status_code if response else 'No response'}")
                        # Move to next page or next division if no more pages
                        page += 1
                        if page > 10:  # Assume max 10 pages per division
                            page = 1
                            break
                        continue
                    
                    summoners = response.json()
                    if not summoners:  # No more summoners in this division
                        page = 1
                        break
                    
                    for summoner in summoners:
                        puuid = summoner.get("puuid")
                        if not puuid:
                            continue
                        
                        matchlist_url = f"https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?queue=420&type=ranked&start=0&count=5"
                        matchlist_response = get_retry(matchlist_url, headers=headers, retries=3, timeout=10, rate_checker=rate_checker)

                        if not matchlist_response or matchlist_response.status_code != 200:
                            continue

                        for match_id in matchlist_response.json():
                            if matches_tracked >= 40000:
                                break
                                
                            match_url = f"https://europe.api.riotgames.com/lol/match/v5/matches/{match_id}"
                            match_response = get_retry(match_url, headers=headers, retries=3, timeout=10, rate_checker=rate_checker)

                            if not match_response or match_response.status_code != 200:
                                continue
                            
                            match_data = match_response.json()
                            
                            if valid_match_data(match_data, patch_version):
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
                                    
                                    if cur.rowcount > 0:  # New match was inserted
                                        cur.execute("""
                                            UPDATE patch_tracking 
                                            SET games_tracked = games_tracked + 1 
                                            WHERE patch = %s
                                        """, (patch_version,))
                                        matches_tracked += 1
                                        
                                        if matches_tracked % 100 == 0:
                                            print(f"Progress: {matches_tracked} matches collected")
                                    else:
                                        print(f"DUPLICATE: {match_data['metadata']['matchId']} - Already in database")
                                    
                                    conn.commit()
                        
                        if matches_tracked >= 40000:
                            break
                    
                    # Update progress after each page
                    update_patch_tracking(patch_version, current_tier, current_division, page, conn)
                    page += 1
                    
                    if matches_tracked >= 40000:
                        break
                
                # Reset division index for next tier
                division_index = 0
                page = 1
                
                if matches_tracked >= 40000:
                    break
            
            # Reset tier index for next iteration (shouldn't happen with 40k limit)
            tier_index = 0
            
            if matches_tracked >= 40000:
                break
                
        print(f"Completed: {matches_tracked} matches collected for patch {patch_version}")
        
    except Exception as e:
        print(f"Error in fetch_tierlist_matches: {str(e)}")
        
    finally:
        conn.close()