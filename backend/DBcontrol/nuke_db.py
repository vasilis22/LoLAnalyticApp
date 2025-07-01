import psycopg2

conn = psycopg2.connect(
    database="lolanalytics",
    user="postgres",
    password="Lol4troll1!",
    host="localhost",
    port="5432"
)
cur = conn.cursor()
cur.execute("DROP TABLE IF EXISTS tierlist_matches CASCADE;")
cur.execute("DROP TABLE IF EXISTS player_matches CASCADE;")
cur.execute("DROP TABLE IF EXISTS matches CASCADE;")
cur.execute("DROP TABLE IF EXISTS players CASCADE;")
cur.execute("DROP TABLE IF EXISTS patch_tracking CASCADE;")
cur.execute("DROP TABLE IF EXISTS tierlist CASCADE;")
conn.commit()
cur.close()
conn.close()
print("All tables dropped.")