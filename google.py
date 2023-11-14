import os
import random
import requests
from bs4 import BeautifulSoup
import argparse

class GoogleOSINTScraper:
    def __init__(self, query, num_pages):
        self.query = query
        self.num_pages = num_pages
        self.base_url = 'https://www.google.com/search?q='
        self.headers = {
            'User-Agent': '<YOUR USERAGENT>'
        }
        self.results = []

    def _selectors(self, element):
        '''Returns the appropriate CSS selector.'''
        selectors = {
            'links': 'div.g',
            'next': 'a#pnnext'
        }
        return selectors[element]

    def _parse_page(self, html):
        soup = BeautifulSoup(html, 'html.parser')
        links = soup.select(self._selectors('links'))
        for link in links:
            anchor = link.select_one('a')
            title_element = link.select_one('h3')
            if anchor and title_element:
                url = anchor.get('href')
                title = title_element.get_text()
                self.results.append({'url': url, 'title': title})


    def _save_to_file(self):
        output_file = f'output-{random.randint(1, 100000)}.txt'
        with open(output_file, 'w', encoding='utf-8') as file:
            for result in self.results:
                file.write(f"Title: {result['title']}\nURL: {result['url']}\n\n")

    def scrape(self):
        for page in range(1, self.num_pages + 1):
            url = f'{self.base_url}{self.query}&start={(page-1)*10}&num=100&hl=en'
            response = requests.get(url, headers=self.headers)

            if response.status_code == 200:
                self._parse_page(response.text)
                self._save_to_file()

                next_page_link = BeautifulSoup(response.text, 'html.parser').select_one(self._selectors('next'))

                if next_page_link:
                    next_page_url = f'https://www.google.com{next_page_link.get("href")}'
                    response = requests.get(next_page_url, headers=self.headers)
                else:
                    break
            else:
                print(f"Failed to retrieve page {page}. Status Code: {response.status_code}")
                break

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Contoh program dengan argparse')
    parser.add_argument('-s', '--search', help='search dorking', required=True)
    parser.add_argument('-p', '--pages', help='pages next', type=int, required=True)
    args = parser.parse_args()

    query = args.search
    num_pages = args.pages
    
    scraper = GoogleOSINTScraper(query, num_pages)
    scraper.scrape()
