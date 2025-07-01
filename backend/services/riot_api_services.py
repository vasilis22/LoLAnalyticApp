import time
import requests
from config.settings import RIOT_API_KEY

def get_retry(url, headers, retries, timeout, rate_checker=None):
    for attempt in range(retries):
        try:
            if rate_checker:
                rate_checker.check()
            response = requests.get(url, headers=headers, timeout=timeout)
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt < retries - 1:  # Don't sleep on the last attempt
                time.sleep(2 ** (attempt + 1))
    return None

def get_current_patch():
    patch_url = "https://ddragon.leagueoflegends.com/api/versions.json"
    response = requests.get(patch_url)
    current_patch = ".".join(response.json()[0].split(".")[:2])
    return current_patch

def get_riot_headers():
    return {"X-Riot-Token": RIOT_API_KEY}