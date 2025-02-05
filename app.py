from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
from dotenv import load_dotenv
import requests

app = Flask(__name__)
CORS(app)

# Load environment variables from the .env file
load_dotenv()

try:
    API_KEY  = os.getenv("TOGETHER_AI_KEY")
    if not API_KEY:
        raise ValueError("API key is missing. Please set TOGETHER_AI_KEY in the environment.")
except Exception as e:
    print(f"Error: {e}")
    exit(1)

MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1"

def get_historical_summary(period, topics, word_range, regions):
    prompt = prompt = f"""
Generate a historical summary for the period from {period['start']} to {period['end']} in {regions}.
Dates are given in the **proleptic Gregorian calendar**, which extends backward before 1582.  
They may be formatted as **day month year**, **month year**, or **year** only.  

Focus on {topics}, keeping the response within {word_range} words.  
Mention key historical debates among historians, including famous myths, contested interpretations, and questionable beliefs about this period.  

Ensure the summary is **comprehensive yet concise**, well-structured, and fits within the word limit.
"""
    
    max_tokens = int(int(word_range.split('-')[1]) * 2)
    print(f'max tokens: {max_tokens}, word range: {word_range}')
    try:
        response = requests.post(
            "https://api.together.xyz/v1/completions",
            json={
                "model": MODEL,
                "prompt": prompt,
                "max_tokens": max_tokens,
                "temperature": 0.5
            },
            headers={"Authorization": f"Bearer {API_KEY}"},
            timeout=100
        )

        response.raise_for_status()
        
        data = response.json()
        
        if "choices" in data and data["choices"]:
            return data["choices"][0]["text"].strip()
        else:
            return "Error: Unexpected API response format."

    except requests.exceptions.Timeout:
        return "Error: The request timed out. Please try again."
    except requests.exceptions.ConnectionError:
        return "Error: Unable to connect. Check your internet connection."
    except requests.exceptions.HTTPError as http_err:
        return f"HTTP Error: {http_err}"
    except requests.exceptions.RequestException as req_err:
        return f"Request Error: {req_err}"
    except Exception as e:
        return f"Unexpected Error: {str(e)}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/getInfo', methods=['POST'])
def get_info():
    data = request.get_json()
    topics = data.get('topics', [])
    regions = data.get('regions', [])
    length = data.get('length', '0-200')
    period = data.get('period', {'start': '', 'end': ''})
    print(topics, regions, length, period)

    summary = get_historical_summary(period, topics, length, regions)
    return jsonify({'summary': summary})

if __name__ == '__main__':
    app.run(debug=True)
