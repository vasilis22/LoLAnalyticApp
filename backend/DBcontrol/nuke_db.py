import psycopg2
from services.database_con import get_db_connection

conn = get_db_connection()
cur = conn.cursor()

#cur.execute("DROP TABLE IF EXISTS tierlist_matches CASCADE;")
#cur.execute("DROP TABLE IF EXISTS player_matches CASCADE;")
#cur.execute("DROP TABLE IF EXISTS matches CASCADE;")
#cur.execute("DROP TABLE IF EXISTS players CASCADE;")
#cur.execute("DROP TABLE IF EXISTS patch_tracking CASCADE;")
#cur.execute("DROP TABLE IF EXISTS tierlist CASCADE;")
#cur.execute("DROP TABLE IF EXISTS summoner_stats CASCADE;")
#conn.commit()
cur.close()
conn.close()
print("All tables dropped.")