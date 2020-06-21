import time
import pynput
import pyperclip


class WebClientExec(object):
    """
    还原点击设值操作
    record: {
        "x": 0,
        "y": 0,
        "opera": "click",
        "value": "asd"
    }
    """
    def __init__(self):
        self.mouse = pynput.mouse.Controller()
        self.keyboard = pynput.keyboard.Controller()
        self.button = pynput.mouse.Button.left

    def deal_click(self, record):
        """
        处理鼠标点击事件
        """
        self.mouse.position = (record.get("x"), record.get("y"))
        time.sleep(0.1)
        self.mouse.click(self.button)

    def deal_set_value(self, record):
        """
        处理设值事件
        """
        self.deal_click(record)
        time.sleep(0.3)
        self.keyboard.press(eval("Key.cmd", {}, {
            "Key": pynput.keyboard.Key
        }))
        self.keyboard.press("a")
        self.keyboard.release("a")
        self.keyboard.release(eval("Key.cmd", {}, {
            "Key": pynput.keyboard.Key
        }))
        pyperclip.copy(record.get("value"))
        time.sleep(0.1)
        self.keyboard.press(eval("Key.cmd", {}, {
            "Key": pynput.keyboard.Key
        }))
        self.keyboard.press("v")
        self.keyboard.release("v")
        self.keyboard.release(eval("Key.cmd", {}, {
            "Key": pynput.keyboard.Key
        }))

    def deal_mouseover(self, record):
        self.mouse.position = (record.get("x"), record.get("y"))

    def run(self, record):
        """
        处理事件入口
        """
        if record.get("opera") == "click":
            self.deal_click(record)
        if record.get("opera") == "value":
            self.deal_set_value(record)
        if record.get("opera") == "mouseover":
            self.deal_mouseover(record)


if __name__ == '__main__':
    pass