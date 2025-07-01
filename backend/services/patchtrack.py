def update_patch_tracking(patch_version, tier, division, page, conn):
    with conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE patch_tracking 
                SET last_tier = %s, last_division = %s, last_page = %s 
                WHERE patch = %s
            """, (tier, division, page, patch_version))
            conn.commit()