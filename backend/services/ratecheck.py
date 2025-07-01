import time

class ratecheck:
    def __init__(self, rate, window=120):
        self.rate = rate
        self.window = window  # Time window in seconds (default 120 for 2 minutes)
        self.requests = 0
        self.start_time = time.time()

    def check(self):
        current_time = time.time()
        elapsed_time = current_time - self.start_time
        
        # Reset the counter if the time window has passed
        if elapsed_time >= self.window:
            self.requests = 0
            self.start_time = current_time
            elapsed_time = 0
        
        # Check if we're about to exceed the rate limit
        if self.requests >= self.rate:
            sleep_time = self.window - elapsed_time
            if sleep_time > 0:
                print(f"Rate limit reached ({self.requests}/{self.rate}). Sleeping for {sleep_time:.2f} seconds.")
                time.sleep(sleep_time)
                # Reset after sleeping
                self.requests = 0
                self.start_time = time.time()
        
        # Increment the request counter
        self.requests += 1
        print(f"Request {self.requests}/{self.rate} in current window")
