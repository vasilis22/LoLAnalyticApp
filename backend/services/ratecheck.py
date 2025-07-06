import time

class ratecheck:
    def __init__(self, rate, window=120):
        self.rate = rate
        self.window = window
        self.requests = 0
        self.start_time = time.time()

    def check(self):
        current_time = time.time()
        elapsed_time = current_time - self.start_time
        
        if elapsed_time >= self.window:
            self.requests = 0
            self.start_time = current_time
            elapsed_time = 0
        
        if self.requests >= self.rate:
            sleep_time = self.window - elapsed_time
            if sleep_time > 0:
                #print(f"Rate limit reached ({self.requests}/{self.rate}). Sleeping for {sleep_time:.2f} seconds.")
                time.sleep(sleep_time)
                self.requests = 0
                self.start_time = time.time()
        
        self.requests += 1
        #print(f"Request {self.requests}/{self.rate} in current window")
