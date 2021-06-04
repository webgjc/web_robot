/**
 * {
 *      "type": "事件类型",
 *      "selecter": "事件元素",
 *      "context": "包含内容",
 *      "url": "事件新url"
 * }
 */

let EVENTS = [];

// 事件类型枚举
let EVENT_TYPE_ENUM = {
    CLICK: "CLICK",  // 点击
    INPUT: "INPUT",  // 设值
    NEWPAGE: "NEWPAGE",  // 新开页面
    CLOSEPAGE: "CLOSEPAGE", // 关闭页面
    SCROLL: "SCROLL" // 滚动
}

// 根据节点获取选择器
function dom_to_selector(dom) {
    let names = [];
    let dombak = dom;
    do {
        if (!dom || !dom.parentElement) break;
        if (dom.id && isNaN(Number(dom.id[0]))) {
            names.unshift(`${dom.tagName}#${dom.id}`);
            break;
        } else {
            let tmp;
            let classNames = [];
            for (let i = 0; i < dom.classList.length; i++) {
                classNames.push(dom.classList[i]);
            }
            if (classNames.length > 0) {
                tmp = `${dom.tagName}.${classNames.join(".")}`;
            } else {
                tmp = `${dom.tagName}`;
            }
            names.unshift(tmp);
        }
        dom = dom.parentElement;
    } while (dom !== null);
    let selector = names.join(" > ");
    let nodes = document.querySelectorAll(selector);
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i] === dombak) {
            return [selector, i];
        }
    }
}

// 发送通知
function notify(data, cb) {
    chrome.runtime.sendMessage({
        type: "SEND_MSG", 
        data: data
    }, function(resp) {
        cb && cb(resp);
    });
}

// 添加事件
function add_event(data, cb) {
    chrome.runtime.sendMessage({
        type: "ADD_EVENT", 
        data: data
    }, function(resp) {
        cb && cb(resp);
    });
}

// 监控点击事件
function click_monitor() {
    document.addEventListener("click", function (e) {
        add_event({
            type: EVENT_TYPE_ENUM.CLICK,
            selector: dom_to_selector(e.target),
            context: e.target.innerText.slice(0 ,100)
        });
    }, false);
}


// 监控input textarea设值事件
function input_monitor() {
    let inputs = document.getElementsByTagName("input");
    let textareas = document.getElementsByTagName("textarea");
    let doms = [];
    for(let i = 0; i < inputs.length; i++) {
        doms.push(inputs[i]);
    }
    for(let i = 0; i < textareas.length; i++) {
        doms.push(textareas[i]);
    }
    for(let i = 0; i < doms.length; i++) {
        doms[i].addEventListener("change", function(e) {
            add_event({
                type: EVENT_TYPE_ENUM.INPUT,
                selector: dom_to_selector(e.target),
                context: e.target.value
            });
        });
    }
}

// 监控主入口
function monitor() {
    click_monitor();
    input_monitor();
}

monitor();