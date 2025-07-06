from config.settings import TIERS, DIVISIONS

def get_next_division_tier(current_tier, current_division):
    tier_index = TIERS.index(current_tier)
    division_index = DIVISIONS.index(current_division)

    if division_index < len(DIVISIONS) - 1:
        division_index += 1
    elif tier_index < len(TIERS) - 1:
        tier_index += 1
        division_index = 0
    elif tier_index == len(TIERS) - 1:
        tier_index = 0
        division_index = 0

    return TIERS[tier_index], DIVISIONS[division_index]
