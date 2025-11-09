import psycopg2
from psycopg2 import Error
from dotenv import load_dotenv
import os
from services.database_con import get_db_connection

load_dotenv()

def init_database():
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(
            database="postgres",
            user="postgres",
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'lolanalytics'")
        exists = cursor.fetchone()
        if not exists:
            cursor.execute("CREATE DATABASE lolanalytics")
            print("Database 'lolanalytics' created successfully")
            
        cursor.close()
        conn.close()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('players', 'matches', 'player_matches', 'tierlist', 'patch_tracking', 'tierlist_matches', 'summoner_stats')
        """)
        existing_tables = {row[0] for row in cursor.fetchall()}
        
        if 'players' not in existing_tables:
            cursor.execute("""
                CREATE TABLE players (
                    puuid VARCHAR(78) PRIMARY KEY,
                    game_name VARCHAR(50) NOT NULL,
                    tagline VARCHAR(10) NOT NULL,
                    profile_icon_id INTEGER,
                    summoner_level INTEGER,
                    ranked_solo JSONB,
                    ranked_flex JSONB,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("Table 'players' created successfully")
            
        if 'matches' not in existing_tables:
            cursor.execute("""
                CREATE TABLE matches (
                    match_id VARCHAR(50) PRIMARY KEY,
                    patch VARCHAR(10) NOT NULL,
                    game_duration INTEGER,
                    game_mode VARCHAR(20),
                    queue_id INTEGER,
                    timeline JSONB,
                    match_data JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            cursor.execute("CREATE INDEX idx_matches_patch ON matches(patch)")
            print("Table 'matches' created successfully")

        if 'player_matches' not in existing_tables:
            cursor.execute("""
                CREATE TABLE player_matches (
                    puuid VARCHAR(78),
                    match_id VARCHAR(50),
                    player_index INTEGER,
                    champion_name VARCHAR(50),
                    PRIMARY KEY (puuid, match_id),
                    FOREIGN KEY (puuid) REFERENCES players(puuid),
                    FOREIGN KEY (match_id) REFERENCES matches(match_id)
                )
            """)

            cursor.execute("CREATE INDEX idx_player_matches_puuid ON player_matches(puuid)")
            cursor.execute("CREATE INDEX idx_player_matches_champion ON player_matches(champion_name)")
            print("Table 'player_matches' created successfully")

        if 'tierlist' not in existing_tables:
            cursor.execute("""
                CREATE TABLE tierlist (
                    patch VARCHAR(10),
                    tierlist_data JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (patch)
                )
            """)
            print("Table 'tierlist' created successfully")

        if 'patch_tracking' not in existing_tables:
            cursor.execute("""
                CREATE TABLE patch_tracking (
                    patch VARCHAR(10) PRIMARY KEY,
                    games_tracked INTEGER DEFAULT 0,
                    games_to_track INTEGER DEFAULT 40000,
                    tierlist_generated BOOLEAN DEFAULT FALSE,
                    last_tier VARCHAR(10) DEFAULT NULL,
                    last_division VARCHAR(10) DEFAULT NULL,
                    last_page integer DEFAULT 1
                )
            """)
            print("Table 'patch_tracking' created successfully")

        if 'tierlist_matches' not in existing_tables:
            cursor.execute("""
                CREATE TABLE tierlist_matches (
                    match_id VARCHAR(50) PRIMARY KEY,
                    patch VARCHAR(10),
                    match_data JSONB,
                    FOREIGN KEY (patch) REFERENCES patch_tracking(patch)
                )
            """)
            print("Table 'tierlist_matches' created successfully")

        if 'summoner_stats' not in existing_tables:
            cursor.execute("""
                CREATE TABLE summoner_stats (
                    puuid VARCHAR(78),
                    season VARCHAR(10),
                    champion_stats JSONB,
                    unique (puuid, season)
                )
            """)
            print("Table 'summoner_stats' created successfully")

        conn.commit()
        if existing_tables:
            print(f"Found existing tables: {', '.join(existing_tables)}")
        
    except (Exception, Error) as error:
        print("Error while connecting to PostgreSQL:", error)
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    init_database()