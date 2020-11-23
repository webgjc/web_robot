import os
import time
import json
import shutil


class CrawlerData(object):
    def __init__(self, case_name):
        self.case_name = case_name
        self.path = "./py/crawler"
        self.case_path = "./py/crawler/{}".format(case_name)
        self.summary_file = "{}/{}.json".format(self.path, self.case_name)
        if not os.path.exists(self.case_path):
            os.mkdir(self.case_path)

    def clear(self):
        if os.path.exists(self.case_path):
            shutil.rmtree(self.case_path)
        if os.path.exists(self.summary_file):
            os.remove(self.summary_file)

    def save(self, data):
        with open("{}/{}".format(self.case_path, int(time.time()*1000)), "w") as f:
            f.write(json.dumps(data))

    def summary(self):
        fs = os.listdir(self.case_path)
        fs.sort()
        data = []
        for f in fs:
            data.extend(json.loads(open("{}/{}".format(self.case_path, f), "r").read()))
        json.dump(data, open("{}/{}.json".format(self.path, self.case_name), "w"))




