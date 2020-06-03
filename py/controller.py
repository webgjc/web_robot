import sys
import time
import json
import random
import threading
import pynput


class MouseRecord(object):
    """
    记录键盘鼠标事件值json文件，
    包括鼠标移动，滚动，左右键
    键盘按下，放开
    """
    def __init__(self, file_name):
        self.start_time = 0
        self.mouse_list = []
        self.running = True
        self.save_file = "py/case/" + file_name + ".json"

    def get_time(self):
        return time.time() - self.start_time

    def on_click(self, x, y, button, pressed):
        """
        click事件
        """
        if not self.running:
            return False
        if not pressed:
            return True
        self.mouse_list.append({
            "opera": "click",
            "posix": x,
            "posiy": y,
            "button": str(button),
            "stime": self.get_time()
        })

    def on_move(self, x, y):
        """
        鼠标移动事件，加个随机减少存储
        """
        if random.randint(0, 2) == 1:
            self.mouse_list.append({
                "opera": "move",
                "posix": x,
                "posiy": y,
                "stime": self.get_time()
            })

    def on_scroll(self, x, y, dx, dy):
        """
        鼠标滚动事件
        """
        self.mouse_list.append({
            "opera": "scroll",
            "posix": x,
            "posiy": y,
            "scrollx": dx,
            "scrolly": dy,
            "stime": self.get_time()
        })

    def on_key_press(self, key):
        """
        键盘按下事件，正常建是直接展示字符，特殊键会返回Key.xxx
        按下esc的时候退出监听
        """
        if key == pynput.keyboard.Key.esc:
            self.running = False
            mouse = pynput.mouse.Controller()
            mouse.click(pynput.mouse.Button.left)
            return self.running
        if str(key) != "<0>":
            self.mouse_list.append({
                "opera": "press",
                "key": str(key).strip("'"),
                "stime": self.get_time()
            })

    def on_key_release(self, key):
        """
        键盘释放事件
        """
        if str(key) != "<0>":
            self.mouse_list.append({
                "opera": "release",
                "key": str(key).strip("'"),
                "stime": self.get_time()
            })

    def mouse_listen(self):
        """
        开启鼠标监听
        """
        with pynput.mouse.Listener(on_move=self.on_move, on_click=self.on_click, on_scroll=self.on_scroll) as listener:
            listener.join()

    def key_listen(self):
        """
        开启键盘监听
        """
        with pynput.keyboard.Listener(on_press=self.on_key_press, on_release=self.on_key_release) as listener:
            listener.join()

    def run(self):
        """
        运行监听，结束后保存为json文件
        """
        self.start_time = time.time()
        t1 = threading.Thread(target=self.mouse_listen)
        t2 = threading.Thread(target=self.key_listen)
        t1.start()
        t2.start()
        t1.join()
        t2.join()
        print(json.dumps(self.mouse_list), file=open(self.save_file, "w"))


class MouseRecover(object):
    """
    还原键盘鼠标事件
    """
    def __init__(self, file_name):
        self.start_time = 0
        self.mouse = pynput.mouse.Controller()
        self.keyboard = pynput.keyboard.Controller()
        self.buttons = {
            "Button.left": pynput.mouse.Button.left,
            "Button.right": pynput.mouse.Button.right
        }
        self.read_file = "py/case/" + file_name + ".json"

    def deal_click(self, record):
        """
        处理鼠标点击事件
        """
        self.mouse.position = (record.get("posix"), record.get("posiy"))
        time.sleep(0.1)
        self.mouse.click(self.buttons.get(record.get("button")))

    def deal_move(self, record):
        """
        处理鼠标移动事件
        """
        self.mouse.position = (record.get("posix"), record.get("posiy"))

    def deal_scroll(self, record):
        """
        处理鼠标滚动事件
        """
        self.mouse.position = (record.get("posix"), record.get("posiy"))
        self.mouse.scroll(record.get("scrollx"), record.get("scrolly"))

    def deal_key_press(self, record):
        """
        处理键盘按下事件
        """
        if record.get("key").startswith("Key"):
            self.keyboard.press(eval(record.get("key"), {}, {
                "Key": pynput.keyboard.Key
            }))
        else:
            self.keyboard.press(record.get("key"))

    def deal_key_release(self, record):
        """
        处理键盘释放事件
        """
        if record.get("key").startswith("Key"):
            self.keyboard.release(eval(record.get("key"), {}, {
                "Key": pynput.keyboard.Key
            }))
        else:
            self.keyboard.release(record.get("key"))

    def run(self):
        """
        读取json文件，执行事件
        """
        data = json.load(open(self.read_file, "r"))
        for item in data:
            if item.get("opera") == "click":
                self.deal_click(item)
            if item.get("opera") == "move":
                self.deal_move(item)
            if item.get("opera") == "scroll":
                self.deal_scroll(item)
            if item.get("opera") == "press":
                self.deal_key_press(item)
            if item.get("opera") == "release":
                self.deal_key_release(item)
            time.sleep(item.get("stime") - self.start_time)
            self.start_time = item.get("stime")


if __name__ == "__main__":
    if sys.argv[1] == "record":
        #记录事件
        t = MouseRecord(str(sys.argv[2]))
        t.run()
    elif sys.argv[1] == "recover":
        # 运行事件
        tt = MouseRecover(str(sys.argv[2]))
        tt.run()
    else:
        print("use argv record / recover case_name")
