# LoL analytics
## Requirements 
* Python 3.x
* Node.js
* Git
* PostgreSQL
## Local deployment for development powershell
* Backend  
  First clone the repo  
  ```
  git clone https://github.com/vasilis22/LoLAnalyticApp.git
  ```  
  Make your way to the backend from LoLAnalyticApp and create your python virtual enviroment  
  ```
  cd backend
  python -m venv env
  ```
  Afterwards you want to activate the virtual env and install the requirements
  ```
  env\Scripts\Activate.ps1
  pip install -r requirements.txt
  ```
  Sign in to riot developer portal https://developer.riotgames.com/ and get a api key. For the key to work past 24 hours you have to register it with riot.  
  Change the name of .env.example to .env and change RIOT_API_KEY to your key  
  Also change DB_NAME  
  DB_PASSWORD to your db users password  
  Finaly run the database initialization to create the database and required tables  
  ```
  python -m DBcontrol.init_db
  ```
  The backend can be started by running app.py
  ```
  python app.py
  ```
* Frontend  
  Navigate to the front end directory and install required node packages
  ```
  npm install
  ```
  And start development server with
  ```
  npm run dev
  ```
