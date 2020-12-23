import sys
import json


def close_dashboard():
    filename = "./manifest.json"
    data = json.loads(open(filename, "r").read())
    data["chrome_url_overrides"] = {}
    json.dump(data, open(filename, "w"))


def open_dashboard():
    filename = "./manifest.json"
    data = json.loads(open(filename, "r").read())
    data["chrome_url_overrides"] = {"newtab": "html/newtab.html"}
    json.dump(data, open(filename, "w"))


if __name__ == "__main__":
    if sys.argv[1] == "close_dashboard":
        close_dashboard()
    elif sys.argv[1] == "open_dashboard":
        open_dashboard()
