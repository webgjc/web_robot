// 获取数据存储
function get_my_robot(callback) {
    chrome.storage.local.get(["my_robot"], function (res) {
        if (callback) callback(res.my_robot);
    });
}

// 设置数据存储
function set_my_robot(new_robot, callback) {
    chrome.storage.local.set(
        {
            my_robot: new_robot,
        },
        function () {
            if (callback) callback();
        }
    );
}

// 画背景
function robot_make_select_canvas(dom, posi, t) {
    posi == undefined && myrobot_scroll_position(dom);
    let canvas = document.createElement("div");
    canvas.id = "robot_select";
    canvas.style.backgroundColor = "red";
    canvas.style.width = dom.offsetWidth + 4 + "px";
    canvas.style.height = dom.offsetHeight + 4 + "px";
    canvas.style.position = "fixed";
    canvas.style.opacity = "0.5";
    canvas.style.zIndex = 999;
    canvas.style.left = parseInt(dom.getBoundingClientRect().left) - 2 + "px";
    canvas.style.top = parseInt(dom.getBoundingClientRect().top) - 2 + "px";
    document.body.appendChild(canvas);
    setTimeout(function () {
        document.getElementById("robot_select").remove();
    }, t == undefined ? 1000: t);
}

// 画背景
function robot_make_select_canvas_new(dom, mydoc) {
    myrobot_scroll_position(dom);
    let canvas = mydoc.createElement("div");
    canvas.id = "robot_select";
    canvas.style.backgroundColor = "red";
    canvas.style.width = dom.offsetWidth + 4 + "px";
    canvas.style.height = dom.offsetHeight + 4 + "px";
    canvas.style.position = "absolute";
    canvas.style.opacity = "0.5";
    canvas.style.zIndex = 999;
    let xy = myrobot_getAbsPoint(dom)
    canvas.style.left = parseInt(xy.x) - 2 + "px";
    canvas.style.top = parseInt(xy.y) - 2 + "px";
    mydoc.body.appendChild(canvas);
    setTimeout(function () {
        mydoc.getElementById("robot_select").remove();
    }, 1000);
}

// 获取绝对坐标
function myrobot_getAbsPoint(dom) {
    let x = dom.offsetLeft;
    let y = dom.offsetTop;
    while (dom.offsetParent) {
        dom = dom.offsetParent;
        x += dom.offsetLeft;
        y += dom.offsetTop;
    }
    return {
        x: x,
        y: y,
    };
}

// 根据节点自动定位
function myrobot_scroll_position(dom) {
    let domposi = myrobot_getAbsPoint(dom);
    if (
        domposi.y < window.scrollY ||
        domposi.y > window.scrollY + window.innerHeight * 0.8 ||
        domposi.x < window.scrollX ||
        domposi.x > window.scrollX + window.innerWidth * 0.8
    ) {
        window.scrollTo(
            domposi.x - window.innerWidth / 2,
            domposi.y - window.innerHeight / 2
        );
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

//     return names.join(" > ");
// }

// 初级根据节点获取选择器
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

// 根据节点获取选择器
function dom_to_selector(doc, dom) {
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
    let nodes = doc.querySelectorAll(selector);
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i] === dombak) {
            return [selector, i];
        }
    }
}


// 未使用（根据节点获取选择器）
function getCssSelectorShort(el) {
    let path = [],
        parent;
    while ((parent = el.parentNode)) {
        let tag = el.tagName,
            siblings;
        path.unshift(
            el.id
                ? `#${el.id}`
                : ((siblings = parent.children),
                    [].filter.call(siblings, (sibling) => sibling.tagName === tag)
                        .length === 1
                        ? tag
                        : `${tag}:nth-child(${1 + [].indexOf.call(siblings, el)
                        })`)
        );
        el = parent;
    }
    return `${path.join(" > ")}`.toLowerCase();
}

// 阻塞鼠标按下事件
function myrobot_set_body_event(case_name) {
    document.body.addEventListener(
        "mousedown",
        function (e) {
            e.stopPropagation();
            e.preventDefault();
            let selectorn = myrobot_get_selector(e.target);
            if (selectorn === null) {
                alert("未找到元素");
                return;
            }
            myrobot_create_event_input(selectorn, case_name);
            document.body.onmousedown = null;
            document
                .querySelectorAll(selectorn[0])
            [selectorn[1]].addEventListener(
                "click",
                function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                },
                true
            );
        },
        true
    );
}

// 创建事件定义
function myrobot_create_event_input(selectorn, case_name) {
    let operas = [
        "click",
        "value",
        "mouseover",
        "refresh",
        "pagejump",
        "getvalue",
    ];
    let thisid = "myrobot_event_input";
    if (!document.getElementById(thisid)) {
        let container = document.createElement("iframe");
        container.id = thisid;
        container.setAttribute(
            "style",
            "position: fixed;top: 0px;right: 0px;z-index: 999999;border: solid 1px #000;background: #fff;max-width: 180px; height: 180px"
        );
        let html = `<div id="myrobot_selected">已选元素: ${selectorn[0]} & ${selectorn[1]}</div>`;
        html += `<select style="margin-top:10px" id="myrobot_select_opera"><option disabled selected>选择事件</option>${operas
            .map((item) => `<option value=${item}>${item}</option>`)
            .join("")}</select>`;
        html += `<div style="margin-top:10px"><input type="text" placeholder="设值" id="myrobot_value" /></div>`;
        html += `<div style="margin-top:10px;margin-bottom: 10px"><input type="number" placeholder="延时" id="myrobot_wait" value="1" /></div>`;
        html += `<button id="myrobot_submit_event" style="margin-right:5px">提交</button>`;
        html += `<button id="myrobot_cancel">取消</button>`;
        container.srcdoc = html;
        document.body.appendChild(container);
    } else {
        let iframe = document.getElementById(thisid).contentWindow.document;
        iframe.getElementById(
            "myrobot_selected"
        ).innerHTML = `已选元素: ${selectorn[0]} & ${selectorn[1]}`;
        document.getElementById(thisid).style.display = "block";
    }
    let iframe = document.getElementById(thisid).contentWindow;
    iframe.addEventListener("click", function (e) {
        let node = e.target;
        if (node.id === "myrobot_submit_event") {
            get_my_robot((myrobot) => {
                myrobot[case_name]["case_process"].push({
                    tag: selectorn[0],
                    n: selectorn[1],
                    opera: iframe.document.getElementById(
                        "myrobot_select_opera"
                    ).value,
                    value: iframe.document.getElementById("myrobot_value")
                        .value,
                    wait: iframe.document.getElementById("myrobot_wait").value,
                });
                set_my_robot(myrobot);
            });
            document.getElementById(thisid).style.display = "none";
            myrobot_set_body_event(case_name);
        } else if (node.id === "myrobot_cancel") {
            document.getElementById(thisid).style.display = "none";
            myrobot_set_body_event(case_name);
        }
    });
}


// 创建popup窗口
function make_robot_window(x, y) {
    x = Math.min(window.innerWidth - 300, x);
    y = Math.min(window.innerHeight - 320, y);
    let ifr = document.createElement("iframe");
    ifr.src = chrome.extension.getURL("html/popup.html");
    ifr.style.cssText = `z-index: 9999; position: fixed; top: ${y}px; left: ${x}px; background: #fff; border: solid 1px #ccc; min-height: 320px; min-width: 300px;`;
    ifr.id = "robot_iframe";
    document.body.appendChild(ifr);
}

// 关闭popup窗口
function close_robot_window() {
    document.getElementById("robot_iframe").remove();
}


// 提示
let tipCount = 0;
function tip(info) {
    info = info || '';
    var ele = document.createElement('div');
    ele.className = 'chrome-plugin-simple-tip slideInLeft';
    ele.style.top = tipCount * 70 + 20 + 'px';
    ele.innerHTML = `<div>${info}</div>`;
    document.body.appendChild(ele);
    ele.classList.add('animated');
    tipCount++;
    setTimeout(() => {
        ele.style.top = '-100px';
        setTimeout(() => {
            ele.remove();
            tipCount--;
        }, 400);
    }, 4000);
}

// dom唯一展示
function dom_only_show(dom) {
    if (dom == document.body) {
        return;
    } else {
        for (let i = 0; i < dom.parentNode.children.length; i++) {
            if (dom.parentNode.children[i] != dom) {
                dom.parentNode.children[i].style.display = "None";
            }
        }
        dom_only_show(dom.parentNode);
    }
}

// 直接选择dom，圈选
function direct_select_dom(cb) {
    let last_dom; // 上个元素 
    let last_dom_border;  // 记录之前的一些css样式
    let last_dom_boxshadow;
    let last_dom_zindex;
    // 监听鼠标移入
    document.onmouseover = (e) => {
        // 阻止事件冒泡和阻止默认事件
        e.stopPropagation();
        e.preventDefault();
        if (e.target.id === "robot_frame" || e.target.id === "robot_select") return;
        // 存一下样式
        let tmp = e.target.style.border;
        let tmp1 = e.target.style.boxShadow;
        let tmp2 = e.target.style.zIndex;
        // 当前选中的元素设置为选中样式
        e.target.style.border = "solid 2px #ffa3a3";
        e.target.style.boxShadow = "0px 0px 8px 8px #ffa3a3";
        e.target.style.zIndex = 999;
        // 将老元素样式还原
        if (last_dom !== undefined) {
            last_dom.style.border = last_dom_border;
            last_dom.style.boxShadow = last_dom_boxshadow;
            last_dom.style.zIndex = last_dom_zindex;
        }
        // 当前元素设为老元素
        last_dom = e.target;
        last_dom_border = tmp;
        last_dom_boxshadow = tmp1;
        last_dom_zindex = tmp2;
    };
    // 重写点击事件
    document.addEventListener(
        "click",
        function (e) {
            if (document.getElementById("robot_iframe")) {
                document.getElementById("robot_iframe").remove();
            }
            // 阻止原事件和事件冒泡
            e.stopPropagation();
            e.preventDefault();
            // 这边为获取这个元素和他父元素的所有的选择器
            let dom = e.target;
            let selectors = [];
            while (dom.parentElement.parentElement) {
                if (dom.clientWidth > 0 && dom.clientHeight > 0) {
                    // 通过dom转选择器的转换函数
                    let selector = dom_to_selector(document, dom)
                    selectors.push(`${selector[0]}&${selector[1]}`);
                }
                // 遍历所有父节点
                dom = dom.parentElement;
            }
            // 回调
            cb && cb(selectors, e);
        },
        // 关键，在事件捕获阶段就执行，而不是冒泡阶段
        true
    );
}

function table_parser(dom) {
    let thead = dom.getElementsByTagName("thead")[0]
    if(!thead) {
        let data = []
        let tbody = dom.getElementsByTagName("tbody")[0];
        if(!tbody) {
            return "解析失败,无tbody";
        }
        let trs = tbody.getElementsByTagName("tr");
        for(let i=0;i<trs.length;i++) {
            let tds = trs[i].getElementsByTagName("td");
            let line = []
            for(let j=0;j<tds.length;j++) {
                line.push(tds[j].innerText);
            }
            data.push(line);
        }
        return data;
    } else {
        let ths = thead.getElementsByTagName("th");
        if(!ths) {
            return "解析失败,无th";
        }
        let keys = [];
        for(let i=0;i<ths.length;i++) {
            keys.push(ths[i].innerText)
        }
        let tbody = dom.getElementsByTagName("tbody")[0];
        if(!tbody) {
            return "解析失败,无tbody";
        }
        let trs = tbody.getElementsByTagName("tr");
        let data = [];
        for(let i=0;i<trs.length;i++) {
            let tds = trs[i].getElementsByTagName("td");
            let line = {}
            for(let j=0;j<tds.length;j++) {
                line[keys[j]] = tds[j].innerText;
            }
            data.push(line);
        }
        return JSON.stringify(data);
    }
}

function list_parser(dom) {
    /**
     * 检查是否存在list形，使用dom+class相等判断
     */
    function doms_check_list(doms) {
        if(doms.length < 3) {
            return [];
        }
        let ct = {};
        for(let i=0; i < doms.length; i++) {
            if(doms[i].tagName == "HR" || doms[i].tagName == "BR") {
                continue;
            }
            let tmp_key = `${doms[i].tagName}+${doms[i].classList.value}`;
            if(ct[tmp_key] == undefined) {
                ct[tmp_key] = [doms[i]];
            } else {
                ct[tmp_key].push(doms[i]);
            }
        }
        let c = 0;
        let max_key;
        for(let i in ct) {
            if(ct[i].length > c) {
                max_key = i;
                c = ct[i].length;
            }
        }
        if(c >= 3) {
            // console.log(ct)
            return ct[max_key];
        } else {
            return [];
        }
    }
    
    /**
     * 获取dom在兄弟中的位置
     */
    function get_node_posotion(dom) {
        let nodes = dom.parentNode.children;
        for(let i=0; i < nodes.length; i++) {
            if(nodes[i] === dom) {
                return i;
            }
        }
        return -1;
    }
    
    /**
     * dom递归发现list
     */
    function find_list_brother_nodes(dom) {
        let node = dom.parentNode;
        let node_position = [];
        node_position.push(get_node_posotion(dom));
        while(true) {
            let tmp_list = doms_check_list(node.children);
            // console.log(tmp_list)
            if(node == document.body) {
                break
            }
            if(tmp_list.length != 0) {
                // console.log(node_position)
                // console.log(tmp_list)
                node_position.pop();
                node_position.reverse();
                let res_nodes = [];
                for(let i=0; i < tmp_list.length; i++) {
                    let tmp_node = tmp_list[i];
                    let flag = true;
                    for(let j=0; j < node_position.length; j++) {
                        if(tmp_node == null) {
                            flag = false;
                            break;
                        }
                        tmp_node = tmp_node.children[node_position[j]];
                    }
                    flag && res_nodes.push(tmp_node.innerText);
                }
                return JSON.stringify(res_nodes);
            } else {
                node_position.push(get_node_posotion(node));
                node = node.parentNode;
            }
        }   
        return "解析失败";
    }

    return find_list_brother_nodes(dom);
}

// 处理取值解析
function deal_parser(dom, parser) {
    if(parser === "text_parser") {
        return dom.innerText.replaceAll("\n", "").replaceAll("\r", "");
    } else if(parser === "html_parser") {
        return dom.innerHTML;
    } else if(parser === "table_parser") {  
        return table_parser(dom);
    } else if(parser === "list_parser") {
        return list_parser(dom);
    } else {
        return dom.innerText;
    }
}

// make_robot_window();
// 处理长连接（尽量使用短消息）
chrome.runtime.onConnect.addListener(function (port) {
    if (port.name === "robot") {
        port.onMessage.addListener(function (msg) {
            if (msg.type === "search_tag") {
                let nums = Array();
                for (let i = 0; i < document.getElementsByTagName(msg.tag).length; i++) {
                    if (document.getElementsByTagName(msg.tag)[i].offsetHeight > 0) {
                        nums.push(i);
                    }
                }
                port.postMessage({
                    type: msg.type,
                    num: nums,
                });
            } else if (msg.type === "search_class_id") {
                let nums = Array();
                if (msg.content.startsWith(".")) {
                    let content = msg.content.substring(1);
                    for (let i = 0; i < document.getElementsByClassName(content).length; i++) {
                        if (document.getElementsByClassName(content)[i].offsetHeight > 0) {
                            nums.push(i);
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
                    num: nums,
                });
            } else if (msg.type === "select_class_id") {
                let dom;
                if (msg.content.startsWith(".")) {
                    dom = document.getElementsByClassName(
                        msg.content.substring(1)
                    )[msg.n];
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
                    posidom = document.getElementsByClassName(
                        msg.tag.substring(1)
                    )[msg.n];
                } else if (msg.tag.startsWith("#")) {
                    posidom = document.getElementById(msg.tag.substring(1));
                } else {
                    posidom = document.getElementsByTagName(msg.tag)[msg.n];
                }
                myrobot_scroll_position(posidom);
                port.postMessage({
                    type: msg.type,
                    x:
                        posidom.getBoundingClientRect().left +
                        posidom.getBoundingClientRect().width / 2 +
                        window.screenLeft,
                    y:
                        posidom.getBoundingClientRect().top +
                        posidom.getBoundingClientRect().height / 2 +
                        window.screenTop +
                        (window.outerHeight - window.innerHeight),
                });
            } else if (msg.type === "search_query_selecter") {
                let doms;
                if (
                    msg.content.indexOf("{") !== -1 &&
                    msg.content.indexOf("}") !== -1
                ) {
                    doms = document.querySelectorAll(
                        msg.content.substring(0, msg.content.indexOf("{"))
                    );
                    let value = msg.content.substring(
                        msg.content.indexOf("{") + 1,
                        msg.content.indexOf("}")
                    );
                    doms = Array.prototype.slice
                        .call(doms)
                        .filter(
                            (d) =>
                                d.textContent.trim() === value &&
                                d.children.length === 0
                        );
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
                    num: nums,
                });
            } else if (msg.type === "select_query_selecter") {
                let dom;
                if (
                    msg.content.indexOf("{") !== -1 &&
                    msg.content.indexOf("}") !== -1
                ) {
                    let doms = document.querySelectorAll(
                        msg.content.substring(0, msg.content.indexOf("{"))
                    );
                    let value = msg.content.substring(
                        msg.content.indexOf("{") + 1,
                        msg.content.indexOf("}")
                    );
                    dom = Array.prototype.slice
                        .call(doms)
                        .filter(
                            (d) =>
                                d.textContent.trim() === value &&
                                d.children.length === 0
                        )[msg.n];
                } else {
                    dom = document.querySelectorAll(msg.content)[msg.n];
                }
                robot_make_select_canvas(dom);
            } else if (msg.type === "add_event") {
                myrobot_set_body_event(msg.case_name);
            } else {
                console.log("what are you doing!");
            }
        });
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

// 处理消息
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log(msg)
    const tag_types = [
        "自由选择器",
        "a",
        "body",
        "button",
        "div",
        "i",
        "img",
        "input",
        "li",
        "p",
        "span",
        "td",
        "textarea",
        "tr",
        "ul",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
    ];
    let posidom;
    let myiframe;
    let mydoc = document;

    // 过滤子iframe接消息
    if(window.frames.length != parent.frames.length){
        // 兼容并发爬虫
        if(!(msg.name && window.name == msg.name)) {
            return
        }
    }

    if(msg.iframe != undefined && msg.iframe != "" && msg.iframe.startsWith("iframe")) {
        // 子iframe修改doc
        myiframe = mydoc.getElementsByTagName("iframe")[msg.iframe.split("&")[1]];

        if(myiframe == null) {
            return;
        }

        mydoc = mydoc.getElementsByTagName("iframe")[msg.iframe.split("&")[1]].contentWindow.document;
        
    }

    // 获取到真实dom元素    
    if (tag_types.indexOf(msg.tag) === -1 && msg.tag) {
        if (msg.tag.indexOf("{") !== -1 && msg.tag.indexOf("}") !== -1) {
            let doms = mydoc.querySelectorAll(
                msg.tag.substring(0, msg.tag.indexOf("{"))
            );
            let value = msg.tag.substring(
                msg.tag.indexOf("{") + 1,
                msg.tag.indexOf("}")
            );
            posidom = Array.prototype.slice
                .call(doms)
                .filter((d) => d.textContent.trim() === value 
                    && d.children.length === 0)[msg.n];
        } else {
            posidom = mydoc.querySelectorAll(msg.tag)[msg.n];
        }
    } else {
        posidom = mydoc.getElementsByTagName(msg.tag)[msg.n];
    }


    if (msg.type === "get_position") {
        // 获取位置信息
        myrobot_scroll_position(posidom);
        sendResponse({
            type: msg.type,
            x:
                posidom.getBoundingClientRect().left +
                posidom.getBoundingClientRect().width / 2 +
                window.screenLeft,
            y:
                posidom.getBoundingClientRect().top +
                posidom.getBoundingClientRect().height / 2 +
                window.screenTop +
                (window.outerHeight - window.innerHeight),
        });
    } else if (msg.type === "get_value") {
        // 获取值
        sendResponse({
            type: msg.type,
            data: deal_parser(posidom, msg.parser)
        });
    } else if (msg.type === "get_value_list") {
        let ds = document.querySelectorAll(msg.tag);
        let vs = [];
        for(let i = 0; i < ds.length; i++) {
            vs.push(ds[i].innerText);
        }
        sendResponse({
            type: msg.type,
            data: vs
        })
    } else if (msg.type === "get_custom_value") {
        // 获取自定义属性
        sendResponse({
            type: msg.type,
            data: new Function("return " + msg.value)(),
        });
    } else if (msg.type == "get_dom") {
        // 获取dom存不存在
        sendResponse({
            type: msg.type,
            dom: posidom !== undefined,
        });
    } else if (msg.type === "start_recording") {
        // 开始直接事件记录
        RDATA.recording = true;
        RDATA.time_wait = 0;
        RDATA.recording_data = [];
        RDATA.case_name = msg.case_name;
        RDATA.itv_timer = setInterval(() => {
            RDATA.time_wait += 0.5;
        }, 500);
        if (RDATA.first_recording) {
            document.addEventListener(
                "click",
                function (e) {
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
                },
                true
            );
            document.addEventListener(
                "keypress",
                function (e) {
                    if (RDATA.recording) {
                        if (RDATA.recording_data.length > 0) {
                            let last_event =
                                RDATA.recording_data[
                                RDATA.recording_data.length - 1
                                ];
                            if (
                                last_event.tag === RDATA.click_tag &&
                                last_event.opera === "value"
                            ) {
                                last_event.value += String.fromCharCode(
                                    e.keyCode
                                );
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
                },
                true
            );
            RDATA.first_recording = false;
        }
    } else if (msg.type === "end_recording") {
        // 结束事件记录
        chrome.runtime.sendMessage({
            type: "ADD_EVENT",
            case_name: RDATA.case_name,
            data: RDATA.recording_data,
        });
        RDATA.recording_data = [];
        clearInterval(RDATA.itv_timer);
        window.location.reload();
        RDATA.recording = false;
    } else if (msg.type === "direct_add_event") {
        // 浏览器直接添加事件
        direct_select_dom(function (selectors, e) {
            get_my_robot((data) => {
                data["SETTING_DATA"]["WEB_ADD_CASE"] = msg.case_name;
                data["SETTING_DATA"]["WEB_ADD_CRAWLER_KEY"] = msg.crawler_key;
                data["SETTING_DATA"]["WEB_ADD_EVENT"] = selectors;
                set_my_robot(data, () => {
                    make_robot_window(e.x, e.y);
                });
            });
        })
    } else if (msg.type === "show_msg") {
        // 展示信息
        tip(msg.msg);
    } else if (msg.type === "onlyshow" && window.name === msg.name) {
        // 唯一展示、看板功能
        let dom = posidom;
        dom.style.width = dom.clientWidth + "px";
        dom.style.height = dom.clientHeight + "px";
        dom_only_show(dom);
        dom.parentNode.style.position = "fixed";
        dom.parentNode.style.left = "0px";
        dom.parentNode.style.top = "0px";
        dom.parentNode.style.minHeight = "auto";
        dom.parentNode.style.minWidth = "auto";
        dom.parentNode.style.width = msg.width;
        dom.parentNode.style.height = msg.height;
        dom.parentNode.style.marginLeft = "0px";
        dom.parentNode.style.marginTop = "0px";
        dom.parentNode.style.paddingLeft = "0px";
        dom.parentNode.style.paddingTop = "0px";
        dom.parentNode.style.overflow = "scroll";
        dom.style.marginLeft = "0px";
        dom.style.marginTop = "0px";
        dom.style.paddingLeft = "0px";
        dom.style.paddingTop = "0px";
        sendResponse({
            type: msg.type,
            data: {
                h: dom.clientHeight,
                w: dom.clientWidth
            },
        });
    } else if (msg.type === "execute_frame" && window.name === msg.name) {
        // 运行frame（看板）
        // console.log(msg)
        new Function(msg.code)();
    } else if (msg.type === "get_dom_frame" && window.name === msg.name) {
        // 获取frame元素（看板）
        sendResponse({
            type: msg.type,
            dom: posidom !== undefined,
        });
    } else if (msg.type === "get_value_frame" && window.name === msg.name) {
        sendResponse({
            type: msg.type,
            data: deal_parser(posidom, msg.parser)
        });
    } else if (msg.type === "get_custom_value_frame" && window.name === msg.name) {
        sendResponse({
            type: msg.type,
            data: new Function("return " + msg.value)(),
        });
    } else if (msg.type === "direct_add_dashboard") {
        // 直接添加看板
        direct_select_dom(function (selectors, e) {
            get_my_robot((data) => {
                data["SETTING_DATA"]["WEB_ADD_DASHBOARD"] = true;
                data["SETTING_DATA"]["WEB_ADD_EVENT"] = selectors;
                set_my_robot(data, () => {
                    make_robot_window(e.x, e.y);
                });
            });
        })
    } else if (msg.type === "show_doms") {
        let doms = document.querySelectorAll(msg.selector);
        if(doms.length > 0) {
            robot_make_select_canvas(doms[0], undefined, 5000);
            for(let i = 1; i < doms.length; i++) {
                robot_make_select_canvas(doms[i], "1", 5000);
            }
        }
        sendResponse({
            type: msg.type,
            nums: doms.length,
        });
    } else if (msg.type === "close_robot_window") {
        // 关闭注入robot frame
        close_robot_window();
    } else if (msg.type === "search_tag") {
        let tmpdoms = mydoc.getElementsByTagName(msg.tag);
        let nums = Array();
        for (let i = 0; i < tmpdoms.length; i++) {
            // 排除自己建的iframe
            if(tmpdoms[i].id === "robot_iframe") {
                continue
            }
            if (tmpdoms[i].offsetHeight > 0) {
                nums.push(i);
            }
        }
        console.log(nums)
        sendResponse({
            type: msg.type,
            num: nums,
        });
    } else if (msg.type === "select_tag") {
        let dom = mydoc.getElementsByTagName(msg.tag)[msg.n];
        robot_make_select_canvas_new(dom, mydoc);
    } else if (msg.type === "search_query_selecter") {
        let doms;
        if (msg.content.indexOf("{") !== -1 && msg.content.indexOf("}") !== -1) {
            doms = mydoc.querySelectorAll(msg.content.substring(0, msg.content.indexOf("{")));
            let value = msg.content.substring(
                msg.content.indexOf("{") + 1,
                msg.content.indexOf("}"));
            doms = Array.prototype.slice.call(doms)
                .filter((d) =>
                    d.textContent.trim() === value &&
                    d.children.length === 0);
        } else {
            doms = mydoc.querySelectorAll(msg.content);
        }
        let nums = Array();
        for (let i = 0; i < doms.length; i++) {
            if (doms[i].offsetHeight > 0) {
                nums.push(i);
            }
        }
        sendResponse({
            type: msg.type,
            num: nums,
        });
    } else if (msg.type === "select_query_selecter") {
        let dom;
        if (msg.content.indexOf("{") !== -1 && msg.content.indexOf("}") !== -1) {
            let doms = mydoc.querySelectorAll(
                msg.content.substring(0, msg.content.indexOf("{"))
            );
            let value = msg.content.substring(
                msg.content.indexOf("{") + 1,
                msg.content.indexOf("}")
            );
            dom = Array.prototype.slice
                .call(doms)
                .filter((d) =>
                    d.textContent.trim() === value &&
                    d.children.length === 0)[msg.n];
        } else {
            dom = mydoc.querySelectorAll(msg.content)[msg.n];
        }
        robot_make_select_canvas_new(dom, mydoc);
    } else if (msg.type === "exec_judge_expr") {
        // 执行判断逻辑表达式
        let res
        try {
            res = new Function("return " + msg.expr)();
            console.log(res)
        } catch(e) {
            console.log(e)
            res = false
        }
        sendResponse({
            type: msg.type,
            data: res == true,
        });
    }
});

// 源码注入
window.onload = function () {
    get_my_robot((my_robot) => {
        for (let i in my_robot) {
            if (
                my_robot.hasOwnProperty(i) &&
                my_robot[i].case_type === "sourcecode" &&
                my_robot[i].start_inject
            ) {
                if (
                    new RegExp(my_robot[i].sourcecode_url).test(
                        window.location.href
                    )
                ) {
                    eval(my_robot[i].case_sourcecode);
                }
            }
        }
    });
};


/**
 * 按键触发
 */
(function keyboardMonitorTrigger(cb) {
    let down_keys = new Set()
    let down_keys_copy = null;

    get_my_robot(my_robot => {
        // 是否有开启快捷键的事务
        let flag = false
        let key_map = {}

        for(let case_name in my_robot) {
            if(my_robot[case_name]["short_key"] != undefined) {
                flag = true
                key_map[my_robot[case_name]["short_key"]] = case_name
            }
        }

        // 开启快捷键
        if(flag) {
            // 按键按下
            document.onkeydown = function(e) {
                down_keys.add(e.key)
                let v1 = Array.from(down_keys.values()).sort().join()
                if(key_map[v1] != undefined) {
                    // 双重判断防止过灵敏误触
                    setTimeout(() => {
                        let v2 = Array.from(down_keys.values()).sort().join()
                        if(key_map[v2] != undefined) {
                            chrome.runtime.sendMessage({
                                type: "KEYBOARD_TRIGGER",
                                case_name: key_map[v2],
                                select: window.getSelection().toString()
                            }, (res) => {
                                if(res == "success") {
                                    down_keys.clear()
                                }
                            })
                        }
                    }, 150);
                }
            }
            
            // 按键松开
            document.onkeyup = function(e) {
                down_keys.delete(e.key)
            }

            // 清空残留按键，防止重复触发
            setInterval(() => {
                if(down_keys.length == 0) {
                    down_keys_copy = null
                    return;
                }
                if(down_keys_copy == null) {
                    down_keys_copy = down_keys
                    return;
                } 
                let v1 = Array.from(down_keys.values()).sort().join()
                let v2 = Array.from(down_keys_copy.values()).sort().join()
                if(v1 == v2) {
                    down_keys.clear()
                } 
                down_keys_copy = null
            }, 1500);
        }
    })
})()

// 选中之后发消息给bg
document.onselectionchange = function() {
    chrome.runtime.sendMessage({
        type: "SELECTION_CHANGE",
        select: window.getSelection().toString()
    })
};