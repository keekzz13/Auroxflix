from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import cloudscraper
import re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:5174", "https://quickwatch.co", "http://192.168.1.8:5173"]}})

session = requests.Session()
retry_strategy = Retry(
    total=3,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["HEAD", "GET", "OPTIONS", "POST"],
    backoff_factor=1
)
adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=10, pool_maxsize=20)
session.mount("http://", adapter)
session.mount("https://", adapter)

@app.route('/', methods=['POST'])
def proxy():
    try:
        data = request.get_json()
        url = data.get('url')
        method = data.get('method', '').upper()
        headers = data.get('headers', {})
        use_cloudscraper = data.get('cf', False)
        
        if not url: return jsonify({'error': 'URL is required'})
        if method not in ['GET', 'POST']: return jsonify({'error': 'Only GET and POST methods are allowed'})

        # Set default timeout
        timeout = data.get('timeout', 30)
        
        # Choose session based on cf parameter
        if use_cloudscraper:
            scraper = cloudscraper.CloudScraper()
            if method == 'GET': 
                response = scraper.get(url, headers=headers, timeout=timeout, stream=True)
                response.raise_for_status()
                return response.content
            else: 
                form_data = data.get('form_data', {})
                response = scraper.post(url, data=form_data, headers=headers, timeout=timeout, stream=True)
                response.raise_for_status()
                return response.content
        else:
            # Use regular session for connection pooling
            if method == 'GET': 
                response = session.get(url, headers=headers, timeout=timeout, stream=True)
                response.raise_for_status()
                return response.content
            else: 
                form_data = data.get('form_data', {})
                response = session.post(url, data=form_data, headers=headers, timeout=timeout, stream=True)
                response.raise_for_status()
                return response.content
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred.'}), 500

if __name__ == '__main__':
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    app.run(debug=False, port=5001, host='0.0.0.0', threaded=True)
