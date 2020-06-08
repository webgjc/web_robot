// 获取数据存储
function get_my_robot(callback) {
    chrome.storage.local.get(["my_robot"], function(res) {
        if (callback) callback(res.my_robot)
    })
}

// 设置数据存储
function set_my_robot(new_robot, callback) {
    chrome.storage.local.set({ "my_robot": new_robot }, function() {
        if (callback) callback()
    })
}

function robot_make_select_canvass(dom) {
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
    if(dom.id) {
        selector = `${dom.nodeName}[id="${dom.id}"]`;
    }else if(dom.class) {
        selector = `${dom.nodeName}[class="${dom.className}"]`;
    }else{
        selector = `${dom.nodeName}`;
    }
    let nodelist = document.querySelectorAll(selector);
    for(i in nodelist) {
        if(nodelist[i] === dom) {
            return [selector, i];
        }
    }
    return null;
}

function myrobot_set_body_event(case_name) {
    document.body.onmousedown = (e) => {
        e.preventDefault();
        let selectorn = myrobot_get_selector(e.target);
        if(selectorn === null) {
            alert("未找到元素");
            return;
        }
        myrobot_create_event_input(selectorn, case_name);
        document.body.onmousedown = null;
        document.querySelectorAll(selectorn[0])[selectorn[1]].onclick = function(e) {
            e.preventDefault();
        }
    }
}

function myrobot_create_event_input(selectorn, case_name) {
    let operas = ["click", "value", "refresh", "pagejump"];
    let thisid = "myrobot_event_input";
    if(!document.getElementById(thisid)) {
        let container = document.createElement("div");
        container.id = thisid;
        container.setAttribute("style", "position: fixed;top: 0px;right: 0px;z-index: 999999;border: solid 1px #000;background: #fff;max-width: 300px;");
        document.body.appendChild(container);
    }else{
        document.getElementById(thisid).style.display = "block";
    }
    let html = `<div>已选元素: ${selectorn[0]} & ${selectorn[1]}</div>`;
    html += `<select style="margin-top:10px" id="myrobot_select_opera"><option disabled selected>选择事件</option>${operas.map(item => `<option value=${item}>${item}</option>`).join("")}</select>`;
    html += `<div style="margin-top:10px"><input type="text" placeholder="设值" id="myrobot_value" /></div>`;
    html += `<div style="margin-top:10px"><input type="number" placeholder="延时" id="myrobot_wait" value="1" /></div>`;
    html += `<button id="myrobot_submit_event" style="margin-right:5px">提交</button>`;
    html += `<button id="myrobot_cancel">取消</button>`;
    document.getElementById(thisid).innerHTML = html;
    document.getElementById(thisid).addEventListener("click", function (e) {
        let node = e.target;
        if(node.id === "myrobot_submit_event") {
            get_my_robot(myrobot => {
                myrobot[case_name]["case_process"].push({
                    "tag": selectorn[0],
                    "n": selectorn[1],
                    "opera": document.getElementById("myrobot_select_opera").value,
                    "value": document.getElementById("myrobot_value").value,
                    "wait": document.getElementById("myrobot_wait").value
                });
                set_my_robot(myrobot);
            });
            document.getElementById(thisid).style.display = "none";
            myrobot_set_body_event(case_name);
        }else if(node.id === "myrobot_cancel") {
            document.getElementById(thisid).style.display = "none";
            myrobot_set_body_event(case_name);
        }
    })
}

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
                robot_make_select_canvass(dom);
            } else if (msg.type === "select_tag") {
                let dom = document.getElementsByTagName(msg.tag)[msg.n];
                robot_make_select_canvass(dom);
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
                let doms = document.querySelectorAll(msg.content);
                let nums = Array();
                for (let i = 0; i < doms.length; i++) {
                    if (doms[i].offsetHeight > 0) {
                        nums.push(i)
                    }
                }
                port.postMessage({
                    type: msg.type,
                    num: nums
                })
            } else if (msg.type === "select_query_selecter") {
                let dom = document.querySelectorAll(msg.content)[msg.n];
                robot_make_select_canvass(dom);
            } else if (msg.type === "add_event") {
                myrobot_set_body_event(msg.case_name);
            } else {
                console.log("what are you doing!");
            }
        })
    }
});