from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from services.patchcheck import check_patch
from routes import patch, summoner, match, timeline, statistics

scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(check_patch, 'cron', hour=2, minute=0) # Check for patch updates daily at 2:00 AM
    scheduler.start()
    try:
        yield
    finally:
        print("Shutting down scheduler...")
        scheduler.shutdown(wait=True)
        print("Scheduler shutdown complete.")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patch.router)
app.include_router(summoner.router)
app.include_router(match.router)
app.include_router(timeline.router)
app.include_router(statistics.router)

@app.get("/")
def home():
    return {"message": "Welcome to the League Stats API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)