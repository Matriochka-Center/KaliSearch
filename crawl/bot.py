import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from collections import deque
import time
import mimetypes
import os
from pymongo import MongoClient

class SimpleWebCrawler:
    def __init__(self, base_url):
        self.base_url = base_url
        self.visited_urls = set()
        self.url_queue = deque([base_url])
        self.data = {}  # Dictionnaire pour stocker les URLs, leurs liens et contenus

        # Configurer la connexion à MongoDB
        self.client = MongoClient("mongodb+srv://kalisearch:12RJKw75ElO8dTUd@cluster0.z8zdf0m.mongodb.net/")
        self.db = self.client['kali_search']  # Nom de la base de données
        self.collection = self.db['web_data']  # Nom de la collection

        # Test de connexion MongoDB
        self.collection.insert_one({'test': 'Connexion établie'})

    def fetch_page(self, url):
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.text, response.headers.get('Content-Type')
        except requests.RequestException as e:
            print(f"Échec de la récupération de {url}: {e}")
            return None, None

    def parse_links(self, html, base_url):
        soup = BeautifulSoup(html, 'html.parser')
        links = set()
        for a_tag in soup.find_all('a', href=True):
            full_url = urljoin(base_url, a_tag['href'])
            if self.base_url in full_url:  # S'assurer de rester dans le domaine de base
                links.add(full_url)
        return links

    def extract_text(self, html):
        soup = BeautifulSoup(html, 'html.parser')
        # Extraire tout le texte visible et le retourner sous forme de lignes
        texts = soup.stripped_strings
        return "\n".join(texts)

    def crawl(self):
        while self.url_queue:
            current_url = self.url_queue.popleft()
            if current_url not in self.visited_urls:
                print(f"Visite de : {current_url}")
                html, content_type = self.fetch_page(current_url)
                if html is not None:
                    self.visited_urls.add(current_url)
                    links = self.parse_links(html, current_url)
                    # Vérifier si l'URL pointe vers un fichier
                    if content_type:
                        mime_type, _ = mimetypes.guess_type(current_url)
                        if mime_type and (mime_type.startswith('image') or mime_type.startswith('text')):
                            file_name = os.path.basename(urlparse(current_url).path)
                            content = file_name
                        else:
                            content = self.extract_text(html)
                    else:
                        content = self.extract_text(html)

                    # Stocker les liens et le contenu de la page dans MongoDB
                    try:
                        self.collection.insert_one({
                            'url': current_url,
                            'links': list(links),
                            'content': content
                        })
                        print(f"Document inséré pour {current_url}")
                    except Exception as e:
                        print(f"Échec de l'insertion dans MongoDB pour {current_url}: {e}")
                    
                    for link in links:
                        if link not in self.visited_urls:
                            self.url_queue.append(link)
                time.sleep(1)  # Être poli et éviter de surcharger le serveur

if __name__ == "__main__":
    base_url = "https://caritasdegoma.org/"
    crawler = SimpleWebCrawler(base_url)
    crawler.crawl()
