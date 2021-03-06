import os
import json
from flask import Flask
from flask import request
from clientexec import WebClientExec
from crawler import CrawlerData


app = Flask(__name__)
PYTHON_ENV = "./venv/bin/python"


@app.route("/", methods=["GET"])
def health():
    return "success"


@app.route("/webexec/", methods=["POST"])
def web_simulation():
    client = WebClientExec()
    data = json.loads(request.get_data(as_text=True))
    client.run(data)
    return "success"


@app.route("/record/", methods=["GET"])
def controller_listen():
    case_name = request.args.get('case_name')
    os.system(PYTHON_ENV + " py/controller.py record " + case_name + " 2>&1 &")
    return "success"


@app.route("/recover/", methods=["GET"])
def controller_recover():
    case_name = request.args.get('case_name')
    os.system(PYTHON_ENV + " py/controller.py recover " + case_name + " 2>&1 &")
    return "success"


@app.route("/crawler/", methods=["POST"])
def controller_save():
    data = json.loads(request.get_data(as_text=True))
    cd = CrawlerData(data["case_name"])
    if data["opera"] == "clear":
        cd.clear()
    elif data["opera"] == "summary":
        cd.summary()
    elif data["opera"] == "save":
        cd.save(data["data"])
    else:
        return "fail"
    return "success"


urls = open("py/urls.txt", "r").readlines()
n = 0

# 外部爬虫url输入用例demo
@app.route("/crawler/url/", methods=["GET"])
def controller_crawler_url():
    import random
    global n
    n += 1
    if n >= 50:
        return ""
    return urls[random.randint(0, 10)].strip()


if __name__ == "__main__":
    app.run("127.0.0.1", "12580", debug=True)
