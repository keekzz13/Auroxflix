# app.py
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import cloudscraper
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": [
    "https://auroxflix.netlify.app"
]}})

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

        # Choose session based on cf parameter
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

if __name__ == '__main__':
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port, threaded=True)
