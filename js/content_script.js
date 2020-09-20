// 获取数据存储
function get_my_robot(callback) {
    chrome.storage.local.get(["my_robot"], function (res) {
        if (callback) callback(res.my_robot)
    })
}

// 设置数据存储
function set_my_robot(new_robot, callback) {
    chrome.storage.local.set({
        "my_robot": new_robot
    }, function () {
        if (callback) callback()
    })
}

function robot_make_select_canvas(dom) {
    myrobot_scroll_position(dom);
    let canvas = document.createElement("div");
    canvas.id = "robot_select";
    canvas.style.backgroundColor = "red";
    canvas.style.width = dom.offsetWidth + 4 + "px";
    canvas.style.height = dom.offsetHeight + 4 + "px";
    canvas.style.position = "fixed";
    canvas.style.opacity = "0.5";
    canvas.style.zIndex = 9999;
    canvas.style.left = parseInt(dom.getBoundingClientRect().left) - 2 + "px";
    canvas.style.top = parseInt(dom.getBoundingClientRect().top) - 2 + "px";
    document.body.appendChild(canvas);
    setTimeout(function () {
        document.getElementById("robot_select").remove();
    }, 1000);
}

function myrobot_getAbsPoint(dom) {
    let x = dom.offsetLeft;
    let y = dom.offsetTop;
    while (dom.offsetParent) {
        dom = dom.offsetParent;
        x += dom.offsetLeft;
        y += dom.offsetTop;
    }
    return {
        'x': x,
        'y': y
    };
}

function myrobot_scroll_position(dom) {
    let domposi = myrobot_getAbsPoint(dom);
    if (domposi.y < window.scrollY || domposi.y > (window.scrollY + window.innerHeight * 0.8) ||
        domposi.x < window.scrollX || domposi.x > (window.scrollX + window.innerWidth * 0.8)) {
        window.scrollTo(domposi.x - window.innerWidth / 2, domposi.y - window.innerHeight / 2);
    }
}

// function myrobot_get_selector(el) {
//     names = [];
//     do {
//         index = 0;
//         var cursorElement = el;
//         while (cursorElement !== null) {
//             ++index;
//             cursorElement = cursorElement.previousElementSibling;
//         }
//         names.unshift(el.tagName + ":nth-child(" + index + ")");
//         el = el.parentElement;
//     } while (el !== null);
//
//     return names.join(" > ");
// }

function myrobot_get_selector(dom) {
    let selector;
    if (dom.id) {
        selector = `${dom.nodeName}[id="${dom.id}"]`;
    } else if (dom.class) {
        selector = `${dom.nodeName}[class="${dom.className}"]`;
    } else {
        selector = `${dom.nodeName}`;
    }
    let nodelist = document.querySelectorAll(selector);
    for (i in nodelist) {
        if (nodelist[i] === dom) {
            return [selector, i];
        }
    }
    return null;
}

function dom_to_selector(doc, dom) {
    let names = [];
    let dombak = dom;
    do {
        if (!dom && !dom.parentElement) break;
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
    let nodes = doc.querySelectorAll(selector);
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i] === dombak) {
            return [selector, i];
        }
    }
}

function getCssSelectorShort(el) {
    let path = [], parent;
    while (parent = el.parentNode) {
        let tag = el.tagName, siblings;
        path.unshift(
            el.id ? `#${el.id}` : (
                siblings = parent.children,
                    [].filter.call(siblings, sibling => sibling.tagName === tag).length === 1 ? tag :
                        `${tag}:nth-child(${1 + [].indexOf.call(siblings, el)})`
            )
        );
        el = parent;
    }
    return `${path.join(' > ')}`.toLowerCase();
}

function myrobot_set_body_event(case_name) {
    document.body.addEventListener('mousedown', function (e) {
        e.stopPropagation();
        e.preventDefault();
        let selectorn = myrobot_get_selector(e.target);
        if (selectorn === null) {
            alert("未找到元素");
            return;
        }
        myrobot_create_event_input(selectorn, case_name);
        document.body.onmousedown = null;
        document.querySelectorAll(selectorn[0])[selectorn[1]].addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
        }, true);
    }, true);
}

function myrobot_create_event_input(selectorn, case_name) {
    let operas = ["click", "value", "mouseover", "refresh", "pagejump", "getvalue"];
    let thisid = "myrobot_event_input";
    if (!document.getElementById(thisid)) {
        let container = document.createElement("iframe");
        container.id = thisid;
        container.setAttribute("style", "position: fixed;top: 0px;right: 0px;z-index: 999999;border: solid 1px #000;background: #fff;max-width: 180px; height: 180px");
        let html = `<div id="myrobot_selected">已选元素: ${selectorn[0]} & ${selectorn[1]}</div>`;
        html += `<select style="margin-top:10px" id="myrobot_select_opera"><option disabled selected>选择事件</option>${operas.map(item => `<option value=${item}>${item}</option>`).join("")}</select>`;
        html += `<div style="margin-top:10px"><input type="text" placeholder="设值" id="myrobot_value" /></div>`;
        html += `<div style="margin-top:10px;margin-bottom: 10px"><input type="number" placeholder="延时" id="myrobot_wait" value="1" /></div>`;
        html += `<button id="myrobot_submit_event" style="margin-right:5px">提交</button>`;
        html += `<button id="myrobot_cancel">取消</button>`;
        container.srcdoc = html;
        document.body.appendChild(container);
    } else {
        let iframe = document.getElementById(thisid).contentWindow.document;
        iframe.getElementById("myrobot_selected").innerHTML = `已选元素: ${selectorn[0]} & ${selectorn[1]}`;
        document.getElementById(thisid).style.display = "block";
    }
    let iframe = document.getElementById(thisid).contentWindow;
    iframe.addEventListener("click", function (e) {
        let node = e.target;
        if (node.id === "myrobot_submit_event") {
            get_my_robot(myrobot => {
                myrobot[case_name]["case_process"].push({
                    "tag": selectorn[0],
                    "n": selectorn[1],
                    "opera": iframe.document.getElementById("myrobot_select_opera").value,
                    "value": iframe.document.getElementById("myrobot_value").value,
                    "wait": iframe.document.getElementById("myrobot_wait").value
                });
                set_my_robot(myrobot);
            });
            document.getElementById(thisid).style.display = "none";
            myrobot_set_body_event(case_name);
        } else if (node.id === "myrobot_cancel") {
            document.getElementById(thisid).style.display = "none";
            myrobot_set_body_event(case_name);
        }
    })
}


function make_robot_window(x, y) {
    x = Math.min(window.innerWidth - 300, x);
    y = Math.min(window.innerHeight - 320, y);
    let ifr = document.createElement("iframe");
    ifr.src = chrome.extension.getURL('html/popup.html');
    ifr.style.cssText = `z-index: 99999; position: fixed; top: ${y}px; left: ${x}px; background: #fff; border: solid 1px #ccc; min-height: 320px; min-width: 300px;`;
    ifr.id = "robot_iframe";
    document.body.appendChild(ifr);
}

// make_robot_window();


chrome.runtime.onConnect.addListener(function (port) {
    if (port.name === "robot") {
        port.onMessage.addListener(function (msg) {
            if (msg.type === "search_tag") {
                let nums = Array();
                for (let i = 0; i < document.getElementsByTagName(msg.tag).length; i++) {
                    if (document.getElementsByTagName(msg.tag)[i].offsetHeight > 0) {
                        nums.push(i)
                    }
                }
                port.postMessage({
                    type: msg.type,
                    num: nums
                });
            } else if (msg.type === "search_class_id") {
                let nums = Array();
                if (msg.content.startsWith(".")) {
                    let content = msg.content.substring(1);
                    for (let i = 0; i < document.getElementsByClassName(content).length; i++) {
                        if (document.getElementsByClassName(content)[i].offsetHeight > 0) {
                            nums.push(i)
                        }
                    }
                }
                if (msg.content.startsWith("#")) {
                    let content = msg.content.substring(1);
                    if (document.getElementById(content) != null) {
                        nums.push(0);
                    }
                }
                port.postMessage({
                    type: msg.type,
                    num: nums
                });
            } else if (msg.type === "select_class_id") {
                let dom;
                if (msg.content.startsWith(".")) {
                    dom = document.getElementsByClassName(msg.content.substring(1))[msg.n];
                }
                if (msg.content.startsWith("#")) {
                    dom = document.getElementById(msg.content.substring(1));
                }
                robot_make_select_canvas(dom);
            } else if (msg.type === "select_tag") {
                let dom = document.getElementsByTagName(msg.tag)[msg.n];
                robot_make_select_canvas(dom);
            } else if (msg.type === "get_position") {
                let posidom;
                if (msg.tag.startsWith(".")) {
                    posidom = document.getElementsByClassName(msg.tag.substring(1))[msg.n];
                } else if (msg.tag.startsWith("#")) {
                    posidom = document.getElementById(msg.tag.substring(1));
                } else {
                    posidom = document.getElementsByTagName(msg.tag)[msg.n];
                }
                myrobot_scroll_position(posidom);
                port.postMessage({
                    type: msg.type,
                    x: posidom.getBoundingClientRect().left + posidom.getBoundingClientRect().width / 2 + window.screenLeft,
                    y: posidom.getBoundingClientRect().top + posidom.getBoundingClientRect().height / 2 + window.screenTop + (window.outerHeight - window.innerHeight)
                })
            } else if (msg.type === "search_query_selecter") {
                let doms;
                if (msg.content.indexOf("{") !== -1 && msg.content.indexOf("}") !== -1) {
                    doms = document.querySelectorAll(msg.content.substring(0, msg.content.indexOf("{")));
                    let value = msg.content.substring(msg.content.indexOf("{") + 1, msg.content.indexOf("}"));
                    doms = Array.prototype.slice.call(doms).filter(d => d.textContent.trim() === value && d.children.length === 0);
                } else {
                    doms = document.querySelectorAll(msg.content);
                }
                let nums = Array();
                for (let i = 0; i < doms.length; i++) {
                    if (doms[i].offsetHeight > 0) {
                        nums.push(i);
                    }
                }
                port.postMessage({
                    type: msg.type,
                    num: nums
                })
            } else if (msg.type === "select_query_selecter") {
                let dom;
                if (msg.content.indexOf("{") !== -1 && msg.content.indexOf("}") !== -1) {
                    let doms = document.querySelectorAll(msg.content.substring(0, msg.content.indexOf("{")));
                    let value = msg.content.substring(msg.content.indexOf("{") + 1, msg.content.indexOf("}"));
                    dom = Array.prototype.slice.call(doms).filter(d => d.textContent.trim() === value && d.children.length === 0)[msg.n];
                } else {
                    dom = document.querySelectorAll(msg.content)[msg.n];
                }
                robot_make_select_canvas(dom);
            } else if (msg.type === "add_event") {
                myrobot_set_body_event(msg.case_name);
            } else {
                console.log("what are you doing!");
            }
        })
    }
});

let RDATA = {
    first_recording: true,
    recording: false,
    time_wait: 0,
    case_name: "",
    recording_data: [],
    click_tag: "",
    ivr_time: 0,
};


chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    const tag_types = ["自由选择器", "a", "body", "button", "div", "i", "img", "input", "li", "p", "span", "td", "textarea", "tr", "ul", "h1", "h2", "h3", "h4", "h5"];
    let posidom;

    if (tag_types.indexOf(msg.tag) === -1 && msg.tag) {
        if (msg.tag.indexOf("{") !== -1 && msg.tag.indexOf("}") !== -1) {
            let doms = document.querySelectorAll(msg.tag.substring(0, msg.tag.indexOf("{")));
            let value = msg.tag.substring(msg.tag.indexOf("{") + 1, msg.tag.indexOf("}"));
            posidom = Array.prototype.slice.call(doms).filter(d => d.textContent.trim() === value && d.children.length === 0)[msg.n];
        } else {
            posidom = document.querySelectorAll(msg.tag)[msg.n];
        }
    } else {
        posidom = document.getElementsByTagName(msg.tag)[msg.n];
    }
    if (msg.type === "get_position") {
        myrobot_scroll_position(posidom);
        sendResponse({
            type: msg.type,
            x: posidom.getBoundingClientRect().left + posidom.getBoundingClientRect().width / 2 + window.screenLeft,
            y: posidom.getBoundingClientRect().top + posidom.getBoundingClientRect().height / 2 + window.screenTop + (window.outerHeight - window.innerHeight)
        });
    } else if (msg.type === "get_value") {
        sendResponse({
            type: msg.type,
            data: posidom.innerText
        })
    } else if (msg.type === "start_recording") {
        RDATA.recording = true;
        RDATA.time_wait = 0;
        RDATA.recording_data = [];
        RDATA.case_name = msg.case_name;
        RDATA.itv_timer = setInterval(() => {
            RDATA.time_wait += 0.5;
        }, 500);
        if (RDATA.first_recording) {
            document.addEventListener("click", function (e) {
                if (RDATA.recording) {
                    let tmp_selector = dom_to_selector(document, e.target);
                    RDATA.click_tag = tmp_selector[0];
                    RDATA.recording_data.push({
                        tag: tmp_selector[0],
                        n: tmp_selector[1],
                        opera: "click",
                        value: "",
                        wait: RDATA.time_wait,
                    });
                    RDATA.time_wait = 0;
                }
            }, true);
            document.addEventListener("keypress", function (e) {
                if (RDATA.recording) {
                    if (RDATA.recording_data.length > 0) {
                        let last_event = RDATA.recording_data[RDATA.recording_data.length - 1];
                        if (last_event.tag === RDATA.click_tag && last_event.opera === "value") {
                            last_event.value += String.fromCharCode(e.keyCode);
                            RDATA.time_wait = 0;
                            return;
                        }
                    }
                    RDATA.recording_data.push({
                        tag: RDATA.click_tag,
                        n: 0,
                        opera: "value",
                        value: String.fromCharCode(e.keyCode),
                        wait: RDATA.time_wait,
                    });
                    RDATA.time_wait = 0;
                }
            }, true);
            RDATA.first_recording = false;
        }
    } else if (msg.type === "end_recording") {
        chrome.runtime.sendMessage({
            type: "ADD_EVENT",
            case_name: RDATA.case_name,
            data: RDATA.recording_data
        });
        RDATA.recording_data = [];
        clearInterval(RDATA.itv_timer);
        window.location.reload();
        RDATA.recording = false;
    } else if (msg.type === "direct_add_event") {
        console.log(123)
        let last_dom;
        let last_dom_border;
        let last_dom_boxshadow;
        let last_dom_zindex;
        document.onmouseover = (e) => {
            e.stopPropagation();
            e.preventDefault();
            let tmp = e.target.style.border;
            let tmp1 = e.target.style.boxShadow;
            let tmp2 = e.target.style.zIndex;
            e.target.style.border = "solid 2px #ffa3a3";
            e.target.style.boxShadow = "0px 0px 8px 8px #ffa3a3";
            e.target.style.zIndex = 999;
            if (last_dom !== undefined) {
                last_dom.style.border = last_dom_border;
                last_dom.style.boxShadow = last_dom_boxshadow;
                last_dom.style.zIndex = last_dom_zindex;
            }
            last_dom = e.target;
            last_dom_border = tmp;
            last_dom_boxshadow = tmp1;
            last_dom_zindex = tmp2;
        };
        document.addEventListener("click", function (e) {
            if (document.getElementById("robot_iframe")) {
                document.getElementById("robot_iframe").remove();
            }
            e.stopPropagation();
            e.preventDefault();
            let selector = dom_to_selector(document, e.target);
            get_my_robot(data => {
                data["SETTING_DATA"]["WEB_ADD_CASE"] = msg.case_name;
                data["SETTING_DATA"]["WEB_ADD_EVENT"] = {
                    tag: selector[0],
                    n: selector[1]
                };
                set_my_robot(data, () => {
                    make_robot_window(e.x, e.y);
                })
            });
        }, true);
    }
});

window.onload = function () {
    get_my_robot(my_robot => {
        for (let i in my_robot) {
            if (my_robot.hasOwnProperty(i) && my_robot[i].case_type === "sourcecode" && my_robot[i].start_inject) {
                if (new RegExp(my_robot[i].sourcecode_url).test(window.location.href)) {
                    eval(my_robot[i].case_sourcecode);
                }
            }
        }
    })
};