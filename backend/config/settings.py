import os
from dotenv import load_dotenv

load_dotenv()

# API key
RIOT_API_KEY = os.getenv("RIOT_API_KEY")

# Database connection
DATABASE_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT")
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