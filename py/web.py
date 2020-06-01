import json
from flask import Flask
from flask import request
from clientexec import WebClientExec

app = Flask(__name__)


@app.route('/', methods=['POST', 'GET'])
def web_simulation():
    client = WebClientExec()
    data = json.loads(request.get_data(as_text=True))
    print(data)
    client.run(data)
    return "success"


if __name__ == "__main__":
    app.run("127.0.0.1", "12580", debug=True)
