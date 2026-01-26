import os
# La ligne 'from dotenv import load_dotenv' n'est plus nécessaire

# Configuration de la DB
# os.getenv lit la variable injectée par Docker compose
DATABASE_URL = os.getenv("DATABASE_URL")

# Configuration de la sécurité 
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))