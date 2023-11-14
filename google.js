const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const argparse = require('argparse');

class GoogleOSINTScraper {
    constructor(query, numPages) {
        this.query = query;
        this.numPages = numPages;
        this.baseUrl = 'https://www.google.com/search?q=';
        this.headers = {
            'User-Agent': '<YOUR USERAGENT>'
        };
        this.results = [];
    }

    _selectors(element) {
        const selectors = {
            'links': 'div.g',
            'next': 'a#pnnext'
        };
        return selectors[element];
    }

    _parsePage(html) {
        const $ = cheerio.load(html);
        const links = $(this._selectors('links'));
        links.each((index, element) => {
            const anchor = $(element).find('a');
            const titleElement = $(element).find('h3');
            if (anchor && titleElement) {
                const url = anchor.attr('href');
                const title = titleElement.text();
                this.results.push({ 'url': url, 'title': title });
            }
        });
    }

    _saveToFile() {
        const currentDate = new Date();
        const timestamp = currentDate.getTime();
        const outputFile = `output-${timestamp}.txt`;
        const fileContent = this.results.map(result => `Title: ${result.title}\nURL: ${result.url}\n\n`).join('');
        fs.writeFileSync(outputFile, fileContent, 'utf-8');
    }

    async scrape() {
        for (let page = 1; page <= this.numPages; page++) {
            const url = `${this.baseUrl}${this.query}&start=${(page - 1) * 10}&num=100&hl=en`;
            try {
                const response = await axios.get(url, { headers: this.headers });
                if (response.status === 200) {
                    this._parsePage(response.data);
                    this._saveToFile();

                    const $ = cheerio.load(response.data);
                    const nextPageLink = $(this._selectors('next')).attr('href');

                    if (nextPageLink) {
                        const nextPageUrl = `https://www.google.com${nextPageLink}`;
                        const nextPageResponse = await axios.get(nextPageUrl, { headers: this.headers });
                    } else {
                        break;
                    }
                } else {
                    console.log(`Failed to retrieve page ${page}. Status Code: ${response.status}`);
                    break;
                }
            } catch (error) {
                console.error(`Error: ${error.message}`);
                break;
            }
        }
    }
}

const parser = new argparse.ArgumentParser({ description: 'Contoh program dengan argparse' });
parser.add_argument('-s', '--search', { help: 'search dorking', required: true });
parser.add_argument('-p', '--pages', { help: 'pages next', type: 'int', required: true });
const args = parser.parse_args();

const query = args.search;
const numPages = args.pages;

const scraper = new GoogleOSINTScraper(query, numPages);
scraper.scrape();
