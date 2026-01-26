# Utilise une image Python légère et stable
FROM python:3.11-slim

# Définit le répertoire de travail dans le conteneur
WORKDIR /code

# Copie le fichier des dépendances
COPY ./requirements.txt /code/requirements.txt

# Installe les dépendances Python
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copie tout le code de l'application
COPY ./app /code/app
COPY ./.env /code/.env

# Commande par défaut 
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]