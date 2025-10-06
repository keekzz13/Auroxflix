from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import cloudscraper
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["https://auroxflix.netlify.app", "http://localhost:5173"]}})

# Regular requests session with retry strategy
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

# Existing generic proxy route
@app.route('/', methods=['POST'])
def proxy():
    try:
        data = request.get_json()
        url = data.get('url')
        method = data.get('method', '').upper()
        headers = data.get('headers', {})
        use_cloudscraper = data.get('cf', False)
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        if method not in ['GET', 'POST']:
            return jsonify({'error': 'Only GET and POST methods are allowed'}), 400

        timeout = data.get('timeout', 30)

        if use_cloudscraper:
            scraper = cloudscraper.CloudScraper()
            if method == 'GET':
                response = scraper.get(url, headers=headers, timeout=timeout, stream=True)
            else:
                form_data = data.get('form_data', {})
                response = scraper.post(url, headers=headers, data=form_data, timeout=timeout, stream=True)
        else:
            if method == 'GET':
                response = session.get(url, headers=headers, timeout=timeout, stream=True)
            else:
                form_data = data.get('form_data', {})
                response = session.post(url, headers=headers, data=form_data, timeout=timeout, stream=True)

        response.raise_for_status()
        return Response(response.content, status=response.status_code, headers=dict(response.headers))

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred.'}), 500

# New TMDB-specific route for GET requests
@app.route('/proxy/tmdb/<path:subpath>', methods=['GET'])
def proxy_tmdb(subpath):
    api_key = os.environ.get('TMDB_API_KEY', '6452370c23b5a8497b9a201cf46fba42')
    tmdb_url = f"https://api.themoviedb.org/3/{subpath}"
    params = {**request.args, 'api_key': api_key}
    try:
        response = session.get(tmdb_url, params=params, timeout=30)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except requests.RequestException as e:
        print(f"TMDB Proxy Error: {str(e)}")
        return jsonify({'error': str(e)}), 500
