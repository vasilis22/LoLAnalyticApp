import time
import requests
from config.settings import RIOT_API_KEY
from ratelimit import limits, sleep_and_retry
from config.settings import ROUTES_REQUESTS_PER_TWO_MINUTES, BACKGROUND_REQUESTS_PER_TWO_MINUTES, WINDOW_SECONDS

class ServiceUnavailable(Exception):
    pass 

@limits(calls=ROUTES_REQUESTS_PER_TWO_MINUTES, period=WINDOW_SECONDS)
def rgapi_route_request(url, retries = 3, timeout = 10):
    return rgapi_request(url, retries, timeout)

@sleep_and_retry
@limits(calls=BACKGROUND_REQUESTS_PER_TWO_MINUTES, period=WINDOW_SECONDS)
def rgapi_background_request(url, retries = 3, timeout = 10):
    return rgapi_request(url, retries, timeout)

def rgapi_request(url, retries, timeout):

    for attempt in range(retries):
        response = requests.get(url, headers=get_riot_headers(), timeout=timeout)
        if response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", "1"))
            print(f"Rate limit exceeded. Retrying after {retry_after} seconds.")
            time.sleep(retry_after)
            continue
        elif response.status_code in [500, 502, 504]:
            if attempt < retries - 1:
                print(f"Attempt {attempt + 1} for {url} failed with 500 Internal Server Error.")
                time.sleep(2 ** (attempt + 1))
                continue
            else:
                print(f"All {retries} attempts for {url} failed with 500 Internal Server Error.")
                raise requests.exceptions.Timeout()
        elif response.status_code == 503:
            print(f"Service is unavailable. Probably due to server maintenance.")
            raise ServiceUnavailable()
        elif response.status_code != 200:
            response.raise_for_status()
        return response
    raise ServiceUnavailable()

def get_current_patch():
    patch_url = "https://ddragon.leagueoflegends.com/api/versions.json"
    response = requests.get(patch_url)
    current_patch = ".".join(response.json()[0].split(".")[:2])
    return current_patch

def get_riot_headers():
    return {"X-Riot-Token": RIOT_API_KEY}