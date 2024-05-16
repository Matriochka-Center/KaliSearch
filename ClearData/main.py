import json
from bs4 import BeautifulSoup

class HTMLCleaner:
    def __init__(self, input_file, output_file):
        self.input_file = input_file
        self.output_file = output_file
        self.cleaned_data = {}
    
    def load_data(self):
        try:
            with open(self.input_file, 'r') as f:
                self.data = json.load(f)
        except Exception as e:
            print(f"Failed to load {self.input_file}: {e}")
            self.data = {}
    
    def clean_html(self, html):
        soup = BeautifulSoup(html, 'html.parser')
        
        # Prioritized tags
        tags_to_keep = ['h1', 'h2', 'h3', 'p', 'a', 'ul', 'ol', 'li', 'table', 'tr', 'th', 'td']

        # Remove unwanted tags but keep their content
        for tag in soup.find_all(True):
            if tag.name not in tags_to_keep:
                tag.unwrap()

        # Optionally, remove all attributes from the tags
        for tag in soup.find_all(True):
            tag.attrs = {}
        
        return str(soup)

    def clean_data(self):
        for url, content in self.data.items():
            clean_content = self.clean_html(content['content'])
            self.cleaned_data[url] = {
                'links': content['links'],
                'clean_content': clean_content
            }
    
    def save_clean_data(self):
        try:
            with open(self.output_file, 'w') as f:
                json.dump(self.cleaned_data, f, indent=4)
        except Exception as e:
            print(f"Failed to save {self.output_file}: {e}")
    
    def process(self):
        self.load_data()
        self.clean_data()
        self.save_clean_data()

if __name__ == "__main__":
    input_file = '1.json'
    output_file = 'cleaned_output.json'
    
    cleaner = HTMLCleaner(input_file, output_file)
    cleaner.process()
