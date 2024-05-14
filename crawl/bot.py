import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from collections import deque
import time

class SimpleWebCrawler:
    def __init__(self, base_url):
        self.base_url = base_url
        self.visited_urls = set()
        self.url_queue = deque([base_url])
    
    def fetch_page(self, url):
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            print(f"Failed to fetch {url}: {e}")
            return None
    
    def parse_links(self, html, base_url):
        soup = BeautifulSoup(html, 'html.parser')
        links = set()
        for a_tag in soup.find_all('a', href=True):
            full_url = urljoin(base_url, a_tag['href'])
            if self.base_url in full_url:  # Ensure we stay within the base domain
                links.add(full_url)
        return links
    
    def crawl(self):
        while self.url_queue:
            current_url = self.url_queue.popleft()
            if current_url not in self.visited_urls:
                print(f"Visiting: {current_url}")
                html = self.fetch_page(current_url)
                if html:
                    self.visited_urls.add(current_url)
                    links = self.parse_links(html, current_url)
                    for link in links:
                        if link not in self.visited_urls:
                            self.url_queue.append(link)
                time.sleep(1)  # Be polite and avoid overwhelming the server
                
if __name__ == "__main__":
    base_url = "https://example.com"
    crawler = SimpleWebCrawler(base_url)
    crawler.crawl()
