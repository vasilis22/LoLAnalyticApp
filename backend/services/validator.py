def valid_match_data(match_data, patch_version):
    match_id = match_data["metadata"]["matchId"]
    game_duration = match_data["info"]["gameDuration"]
    game_version = ".".join(match_data["info"]["gameVersion"].split(".")[:2])
    
    if game_duration < 600:
        print(f"REJECTED: {match_id} - Game too short ({game_duration}s < 600s)")
        return False
    
    if game_version != patch_version:
        print(f"REJECTED: {match_id} - Wrong patch version ({game_version} != {patch_version})")
        return False
    
    print(f"ACCEPTED: {match_id} - Duration: {game_duration}s, Patch: {game_version}")
    return True