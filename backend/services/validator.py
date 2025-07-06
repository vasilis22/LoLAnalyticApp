def check_duration(match_data):
    game_duration = match_data["info"]["gameDuration"]
    
    if game_duration < 600:
        return False
    
    return True

def get_match_patch_version(match_data):
    return ".".join(match_data["info"]["gameVersion"].split(".")[:2])

def is_patch_older(patch1, patch2):
    p1_parts = [int(x) for x in patch1.split('.')]
    p2_parts = [int(x) for x in patch2.split('.')]
    return p1_parts < p2_parts