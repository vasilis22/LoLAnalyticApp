import os

# API key
RIOT_API_KEY = os.getenv("RIOT_API_KEY")

# Databvase conection
DATABASE_CONFIG = {
    "dbname": "lolanalytics",
    "user": "postgres",
    "password": "Lol4troll1!",
    "host": "localhost",
    "port": "5432"
}

# Rate limits
RATE_LIMIT = 85
REQUEST_WINDOW = 120

# Game fetch settings
TIERS = ["EMERALD", "DIAMOND"]
DIVISIONS = ["IV", "III", "II", "I"]

REGION_MAPPING = {
    # Americas
    "na1": "americas",
    "br1": "americas",
    "la1": "americas",
    "la2": "americas",
    
    # Europe
    "euw1": "europe",
    "eun1": "europe",
    "tr1": "europe",
    "ru": "europe",
    
    # Asia
    "kr": "asia",
    "jp1": "asia",
    "oc1": "asia",
    "tw2": "asia",
    "sg2": "asia",
    "vn2": "asia",
    "me1": "asia"
}

CHAMPION_NAME_MAPPING = {
    "FiddleSticks": "Fiddlesticks",
    "Wukong": "MonkeyKing",
}