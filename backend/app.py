from flask import Flask, request, jsonify
from flask_cors import CORS

from langchain_community.document_loaders import WebBaseLoader

from src.chains import Chain
from src.portfolio import Portfolio
from utils import clean_text

app = Flask(__name__)
CORS(app)

chain = Chain()
portfolio = Portfolio()

@app.route('/generate-email', methods=['POST'])
def generate_email():
    url = request.json['url']
    try:
        loader = WebBaseLoader([url])
        data = clean_text(loader.load().pop().page_content)
        portfolio.load_portfolio()
        jobs = chain.extract_jobs(data)
        for job in jobs:
            skills = job.get('skills', [])
            links = portfolio.query_links(skills)
            email = chain.write_mail(job, links)
        return jsonify({'email': email})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)