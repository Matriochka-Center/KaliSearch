import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from collections import deque
import time
import json
import mimetypes
import os

class SimpleWebCrawler:
    def __init__(self, base_url):
        self.base_url = base_url
        self.visited_urls = set()
        self.url_queue = deque([base_url])
        self.data = {}  # Dictionnaire pour stocker les URLs, leurs liens et contenus

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
                            content = html
                    else:
                        content = html
                    
                    # Stocker les liens et le contenu de la page
                    self.data[current_url] = {
                        'links': list(links),
                        'content': content
                    }
                    for link in links:
                        if link not in self.visited_urls:
                            self.url_queue.append(link)
                time.sleep(1)  # Être poli et éviter de surcharger le serveur

    def save_to_json(self, filename):
        with open(filename, 'w') as f:
            json.dump(self.data, f, indent=4)

if __name__ == "__main__":
    base_url = "https://asrasbl.org/"
    crawler = SimpleWebCrawler(base_url)
    crawler.crawl()
    crawler.save_to_json('1.json')
