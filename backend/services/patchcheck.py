import threading
from .database_con import get_db_connection
from .riot_api_services import get_current_patch
from .fetch_tierlist_matches import fetch_tierlist_matches


def check_patch():
    try:
        current_patch = get_current_patch()

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT patch FROM patch_tracking WHERE patch = %s", (current_patch,))
                if cur.fetchone():
                    print(f"Patch {current_patch} already exists. No action needed.")
                    return False, current_patch
                
                print(f"New patch detected: {current_patch}. Initializing patch tracking...")
                cur.execute("INSERT INTO patch_tracking (patch) VALUES (%s)", (current_patch,))
                conn.commit()
                
                print(f"Starting automatic match collection for patch {current_patch} in background...")
                thread = threading.Thread(target=fetch_tierlist_matches, args=(current_patch,), daemon=True)
                thread.start()
                
                return True, current_patch      
    except Exception as e:
        print(f"Error checking patch: {str(e)}")
        return False, None