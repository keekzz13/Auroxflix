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

# Generic proxy route (POST)
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
        print(f"POST /proxy: url={url}, method={method}, cf={use_cloudscraper}")

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
        content_type = response.headers.get('content-type', '')
        print(f"POST /proxy Response: status={response.status_code}, content-type={content_type}")
        return Response(response.content, status=response.status_code, headers=dict(response.headers))

    except Exception as e:
        print(f"Error in /proxy: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred.'}), 500

# TMDB-specific route (GET)
@app.route('/proxy/tmdb/<path:subpath>', methods=['GET'])
def proxy_tmdb(subpath):
    print(f"Received TMDB request: /proxy/tmdb/{subpath}")
    api_key = os.environ.get('TMDB_API_KEY', '6452370c23b5a8497b9a201cf46fba42')
    tmdb_url = f"https://api.themoviedb.org/3/{subpath}"
    params = {**request.args, 'api_key': api_key}
    print(f"Forwarding to TMDB: {tmdb_url} with params: {params}")
    try:
        response = session.get(tmdb_url, params=params, timeout=30)
        response.raise_for_status()
        content_type = response.headers.get('content-type', '')
        print(f"TMDB Response: status={response.status_code}, content-type={content_type}")
        if 'application/json' in content_type:
            return jsonify(response.json()), response.status_code
        else:
            print(f"Unexpected TMDB Response: {response.text[:100]}")
            return jsonify({'error': 'Unexpected non-JSON response from TMDB', 'content': response.text[:100]}), 500
    except requests.RequestException as e:
        print(f"TMDB Proxy Error: {str(e)}, Response: {e.response.text[:100] if e.response else 'No response'}")
        return jsonify({'error': str(e), 'response': e.response.text[:100] if e.response else 'No response'}), 500

# Health check route
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    port = int(os.environ.get('PORT', 10000))
    print(f"Starting Flask on port {port}")
    app.run(debug=False, host='0.0.0.0', port=port, threaded=True)
