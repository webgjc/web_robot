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
    "table",
    "th",
    "tr",
    "td",
    "ul",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
];
var timer_rerun_count = {};

// 拼接执行的js
function jscode(process, new_value) {
    if(new_value == undefined) {
        new_value = process.value
    }
    let exec_code = "(function(){ \n";
    if (
        process["opera"] === "click" ||
        process["opera"] === "value" ||
        process["opera"] === "mouseover"
    ) {
        if (tag_types.indexOf(process.tag) === -1) {
            exec_code += `var robot_node;\n`;
            exec_code += `
                let ptag = '${process.tag}';
                if (ptag.indexOf("{") !== -1 && ptag.indexOf("}") !== -1) {
                    let doms = document.querySelectorAll(ptag.substring(0, ptag.indexOf("{")));
                    let value = ptag.substring(ptag.indexOf("{") + 1, ptag.indexOf("}"));
                    robot_node = Array.prototype.slice.call(doms)
                    .filter(d => d.textContent.trim() === value && d.children.length === 0)[${process.n}];
                }else{
                    robot_node = document.querySelectorAll(ptag)[${process.n}];
                }\n`;
        } else {
            exec_code += `robot_node = document.getElementsByTagName('${process.tag}')[${process.n}];\n`;
        }
        exec_code += `console.log(robot_node);\n`;
        exec_code += `function myrobot_getAbsPoin(dom) {
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
        };\n`;
        exec_code += `let domposi = myrobot_getAbsPoint(robot_node);\n`;
        exec_code += `if (domposi.y < window.scrollY || domposi.y > (window.scrollY + window.innerHeight * 0.8) ||
                domposi.x < window.scrollX || domposi.x > (window.scrollX + window.innerWidth * 0.8)) {
                window.scrollTo(domposi.x - window.innerWidth / 2, domposi.y - window.innerHeight / 2);}\n`;
    }
    if (process["opera"] === "click") {
        exec_code += "robot_node.click();";
    } else if (process["opera"] === "value") {
        /**
         * 为react兼容
         */
        exec_code += "let lastValue = robot_node.value;";
        exec_code += `robot_node.value='${new_value}';`;
        exec_code += "let event = new Event('input', { bubbles: true });";
        exec_code += "event.simulated = true;";
        exec_code += "let tracker = robot_node._valueTracker;";
        exec_code += "if (tracker) { tracker.setValue(lastValue); }\n";
        exec_code += "robot_node.dispatchEvent(event);";
    } else if (process["opera"] === "refresh") {
        exec_code += "window.location.reload();";
    } else if (process["opera"] === "pagejump") {
        exec_code += `window.location.href='${new_value}';`;
    } else if (process["opera"] === "mouseover") {
        exec_code += `let mouseoverevent = new MouseEvent('mouseover', {bubbles: true, cancelable: true});`;
        exec_code += `robot_node.dispatchEvent(mouseoverevent);`;
    }
    exec_code += "\n})();";
    return exec_code;
}

// 运行源码
function source_jscode(sourcecode) {
    let exec_code = "(function(){ \n";
    exec_code += sourcecode;
    exec_code += "\n})();";
    return exec_code;
}

function sourcecode_run(sourcecode, sourcecode_url, tab) {
    if (new RegExp(sourcecode_url).test(tab.url)) {
        chrome.tabs.executeScript(tab.id, {
            code: source_jscode(sourcecode),
        });
    }
}

// 发送通知
function notify(title, msg) {
    chrome.notifications.create(null, {
        type: "basic",
        iconUrl: "/images/robot.png",
        title: title || "",
        message: msg || ""
    }, function(res) {
        console.log(res)
    });
}

// 发送通知
function send_tip(msg) {
    console.log(msg)
    // alert(msg)
    // notify("监控消息", msg)
    chrome.tabs.query(
        {
            active: true,
            currentWindow: true,
        },
        function (tabs) {
            if(tabs[0] != undefined) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: "show_msg",
                    msg: msg
                })
            }
        }
    )
}

// 运行
// function execute(the_case, tab_id) {
//     var process_wait = 0;
//     for (let i = 0; i < the_case.length; i++) {
//         process_wait = process_wait + the_case[i]["wait"] * 1000;
//         setTimeout(function() {
//             chrome.tabs.executeScript(tab_id, { code: jscode(the_case[i]) });
//         }, process_wait);
//     }
// }

// function execute_lunbo(the_case, tab_id) {
//     var process_wait = 0;
//     for (let n = 0; n < 100; n++) {
//         for (let i = 0; i < the_case.length; i++) {
//             process_wait = process_wait + the_case[i]["wait"] * 1000;
//             setTimeout(function() {
//                 chrome.tabs.executeScript(tab_id, { code: jscode(the_case[i]) });
//             }, process_wait);
//         }
//     }
// }

// 等待
function sleep(s) {
    return new Promise(function (resolve, reject) {
        setTimeout(resolve, s * 1000);
    });
}

// 参数替换
function replace_args(s, args) {
    let keys = Object.keys(args);
    for(let i = 0; i < keys.length; i++) {
        if(args[keys[i]] != undefined) {
            s = s.replace("{" + keys[i] + "}", args[keys[i]]);
        }
    }
    return s;
}

// 运行一个流程事务
async function exec_run_item(process_item, tab_id, args, cb) {
    // console.log(`start run ${JSON.stringify(process_item)}`);
    let new_value = replace_args(process_item.value, args)
    console.log(new_value)
    let test = process_item.test;
    if (process_item.opera === "getvalue") {
        await chrome.tabs.sendMessage(
            tab_id,
            {
                type: "get_value",
                tag: process_item.tag,
                n: process_item.n,
                parser: process_item.parser
            },
            function (msg) {
                if (msg.type === "get_value") {
                    args[new_value] = msg.data;
                    test && alert(msg.data);
                    cb && cb();
                }
            }
        );
    } else if (process_item.opera === "getcustomvalue") {
        chrome.tabs.sendMessage(
            tab_id,
            {
                type: "get_custom_value",
                value: process_item.expr
            },
            function (msg) {
                if (msg.type === "get_custom_value") {
                    args[new_value] = msg.data;
                    test && alert(msg.data);
                    cb && cb();
                }
            }
        );
    } else if (process_item.opera === "value") {
        chrome.tabs.executeScript(tab_id, {
            code: jscode(process_item, new_value),
        });
        cb && cb();
    } else if (process_item.opera === "newpage") {
        chrome.tabs.create({
            url: new_value
        }, (tab) => {
            cb && cb(tab.id);
        });
    } else if (process_item.opera === "closepage") {
        chrome.tabs.remove(tab_id, () => {
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, async function (tabs) {
                cb && cb(tabs[0].id);
            });
        });
    } else if (process_item.opera === "sendmessage") {
        let msg = replace_args(new_value, args);
        if(process_item.sysmsg) {
            notify("事件通知", msg);
        } else {
            alert(msg);
        }
        cb && cb();
    } else {
        chrome.tabs.executeScript(tab_id, {
            code: jscode(process_item, new_value)
        });
        cb && cb();
    }
}


// 运行流程事务
async function exec_run(process, tab_id) {
    let args = {};
    for (let i = 0; i < process.length; i++) {
        await sleep(process[i].wait);
        exec_run_item(process[i], tab_id, args);
    }
}

function get_my_robot(callback) {
    chrome.storage.local.get(["my_robot"], function (res) {
        if (callback) callback(res.my_robot);
    });
}

function set_my_robot(new_robot, cb) {
    chrome.storage.local.set(
        {
            my_robot: new_robot,
        },
        function () {
            cb && cb();
        }
    );
}

// 客户端发送数据
function post_client_run(msg, process) {
    let postdata = {
        x: msg.x,
        y: msg.y,
        opera: process.opera,
        value: process.value,
    };
    fetch("http://127.0.0.1:12580/webexec/", {
        method: "POST",
        body: JSON.stringify(postdata),
    });
}

// 受控运行流程事务
async function simexecute(process, tabs) {
    await chrome.tabs.query(
        {
            active: true,
            currentWindow: true,
        },
        async function (tabs) {
            let args = {};
            for (let i = 0; i < process.length; i++) {
                await sleep(process[i].wait);
                if (
                    process[i].opera === "click" ||
                    process[i].opera === "value" ||
                    process[i].opera === "mouseover" ||
                    process[i].opera === "getvalue"
                ) {
                    await chrome.tabs.sendMessage(
                        tabs[0].id,
                        {
                            type: "get_position",
                            tag: process[i].tag,
                            n: process[i].n,
                        },
                        function (msg) {
                            if (msg.type === "get_position") {
                                if (process[i].opera === "getvalue") {
                                    chrome.tabs.sendMessage(
                                        tabs[0].id,
                                        {
                                            type: "get_value",
                                            tag: process[i].tag,
                                            n: process[i].n,
                                        },
                                        function (msg) {
                                            if (msg.type === "get_value") {
                                                args[process[i].value] =
                                                    msg.data;
                                            }
                                            post_client_run(msg, process[i]);
                                        }
                                    );
                                } else if (process[i].opera === "value") {
                                    if (args[process[i].value] !== undefined) {
                                        process[i].value =
                                            args[process[i].value];
                                    }
                                    post_client_run(msg, process[i]);
                                } else {
                                    post_client_run(msg, process[i]);
                                }
                            }
                        }
                    );
                } else {
                    chrome.tabs.executeScript(tabs[0].id, {
                        code: jscode(process[i]),
                    });
                }
            }
        }
    );
}

// function simexecute(case_process) {
//     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//         con_run(case_process, tabs);
//     })
// }

function calc_minute(time) {
    return (new Date().getTime() - time) / (1000 * 60);
}

function compare_time(time) {
    let t = time.split(":");
    return (
        parseInt(t[0]) * 60 + parseInt(t[1]) <=
        new Date().getHours() * 60 + new Date().getMinutes()
    );
}

// dom检查自旋运行
function dom_check_run(process, tab_id, myrobot, index, timer, data, args, cb) {
    let run_status = 0; // 运行状态 0 - 正在检查，1 - 等待运行，2 - 正在运行
    let now_index = 0; // 当前运行process
    let count = 0;
    args = args == undefined ? {}: args;
    let dom_itvl = setInterval(function () {
        console.log(`status: ${run_status}`);
        if (run_status == 0 && !process[now_index].check) {
            run_status = 1;
        }
        if (run_status == 0) {
            count += 1;
            chrome.tabs.sendMessage(
                tab_id,
                {
                    type: "get_dom",
                    tag: process[now_index].tag,
                    n: process[now_index].n,
                },
                function (msg) {
                    if (msg.type == "get_dom" && msg.dom) {
                        run_status = 1;
                        count = 0;
                    }
                }
            );
        } else if (run_status == 1) {
            run_status = 2;
            setTimeout(function () {
                // exec_run_item(process[now_index], tab_id, args);
                if (process.length - 1 === now_index) {
                    data != null && data.push(args);
                    exec_run_item(process[now_index], tab_id, args, cb);
                } else {
                    exec_run_item(process[now_index], tab_id, args);
                }
                if (process[now_index].opera === "newpage" || process[now_index].opera === "closepage") {
                    chrome.tabs.query({
                        active: true,
                        currentWindow: true
                    }, async function (tabs) {
                        tab_id = tabs[0].id;
                    });
                } 
                now_index += 1;
                run_status = 0;
            }, process[now_index].wait * 1000);
            if (process.length - 1 == now_index) {
                clearInterval(dom_itvl);
            }
        }
        if (count == 50) {
            clearInterval(dom_itvl);
            chrome.notifications.create(null, {
                type: "basic",
                iconUrl: "/images/robot.png",
                title: "dom检查失败",
                message: `元素不存在，${process[now_index].tag}, ${process[now_index].n}`
            });
            if (myrobot[index].fail_rerun != null && myrobot[index].fail_rerun && timer) {
                setTimeout(function () {
                    if (timer_rerun_count[index] == null) {
                        myrobot[index].last_runtime = 0;
                        set_my_robot(myrobot);
                        timer_rerun_count[index] = 1;
                    }
                    if (timer_rerun_count[index] <= 9) {
                        timer_rerun_count[index] += 1;
                        myrobot[index].last_runtime = 0;
                        set_my_robot(myrobot);
                    } else {
                        delete timer_rerun_count[index];
                        chrome.tabs.sendMessage(tab_id, {
                            type: "show_msg",
                            msg: `定时运行失败 : ${myrobot[index].case_name}`
                        });
                    }
                }, 60000);
            }
            console.log(
                `dom not found: ${process[now_index].tag} , ${process[now_index].n}`
            );
        }
    }, 200);
}

// 发送数据
function crawler_send_data(case_name, crawler, opera, data, callback) {
    if (crawler.send) {
        data = {
            case_name: case_name,
            opera: opera,
            data: data != null ? data.slice(0, crawler.freq) : null
        }
        fetch(crawler.api, {
            method: "POST",
            body: JSON.stringify(data),
        }).then(() => {
            callback && callback();
        });
    }
}


// 爬虫运行
function crawler_run(case_name, tab_id) {
    console.log("crawler start");
    get_my_robot(my_robot => {
        // 并发爬虫在newtab.js中实现
        if (my_robot[case_name].case_type === "paral_crawler") {
            if (!my_robot[case_name].paral_crawler.bg_run) {
                chrome.tabs.create({
                    url: chrome.extension.getURL("html/newtab.html") + "?case=" + case_name
                });
            } else {
                chrome.windows.create({
                    url: chrome.extension.getURL("html/newtab.html") + "?case=" + case_name,
                    state: "minimized"
                })
            }
            return;
        }
        crawler_send_data(case_name, my_robot[case_name].serial_crawler, "clear");
        let lock = false; // 进入一个爬虫过程锁住
        let this_key = "init";  // 当前流程
        let data = [];
        let run_times = 0;
        let titles = my_robot[case_name].serial_crawler.fetch
            .filter(i => i.opera === "getvalue" || i.opera === "getcustomvalue")
            .map(i => i.value);
        if(titles.indexOf("key") === -1) {
            alert("请确认存在定义值为key的取值事件");
            return;
        }
        let timer = setInterval(function () {
            if (!lock) {
                // console.log(this_key)
                lock = true;
                console.log(this_key);
                dom_check_run(my_robot[case_name]["serial_crawler"][this_key], tab_id, my_robot, case_name, false,
                    this_key == "fetch" ? data : null, null, function (new_tab_id) {
                        if(new_tab_id != null) {
                            tab_id = new_tab_id;
                        }
                        if (data.length > 1
                            && data[data.length - 1]["key"] === data[data.length - 2]["key"]) {
                            console.log("重复取值");
                            data.pop();
                            this_key = "fetch";
                        } else {
                            if (this_key == "init") {
                                this_key = "fetch";
                            } else if (this_key == "fetch") {
                                // console.log(data);
                                run_times += 1;
                                if (run_times >= my_robot[case_name].serial_crawler.times) {
                                    console.log("================")
                                    console.log(JSON.stringify(data));
                                    clearInterval(timer);
                                    setTimeout(() => {
                                        my_robot[case_name].serial_crawler.data = data;
                                        set_my_robot(my_robot);
                                        crawler_send_data(case_name, my_robot[case_name].serial_crawler, "summary");
                                        notify("爬虫运行完毕", `单线程爬虫事务 ${case_name} 运行完毕`);
                                    }, 200);
                                }
                                if (data.length >= my_robot[case_name].serial_crawler.freq && my_robot[case_name].serial_crawler.send) {
                                    crawler_send_data(case_name, my_robot[case_name].serial_crawler, "save", data);
                                    data.splice(0, my_robot[case_name].serial_crawler.freq);
                                }
                                this_key = "next";
                            } else if (this_key == "next") {
                                this_key = "fetch";
                            }
                        }
                        lock = false;
                    }
                );
            }
        }, 200);
    })
}

// 运行一个事务
function async_run(myrobot, i, args) {
    if(myrobot[i].case_process.length > 0 && myrobot[i].case_process[0].bgopen && 
        (myrobot[i].case_type === "serial_crawler" || myrobot[i].case_type === "paral_crawler")) {
        chrome.windows.create({
            url: chrome.extension.getURL("html/newtab.html") + "?case=" + i,
            state: "minimized"
        });
        myrobot[i].last_runtime = new Date().getTime();
        set_my_robot(myrobot);
        return;
    }
    chrome.tabs.query(
        {
            active: true,
            currentWindow: true,
        },
        function (tabs) {
            if (tabs[0] == undefined) {
                console.log("页面连接失败");
                return;
            }
            if (myrobot[i].case_type === "process") {
                dom_check_run(myrobot[i].case_process, tabs[0].id, myrobot, i, true, null, args, null);
                myrobot[i].last_runtime = new Date().getTime();
                set_my_robot(myrobot);
            }
            if (myrobot[i].case_type === "sourcecode") {
                let new_source_code = replace_args(myrobot[i].case_sourcecode, args)
                sourcecode_run(
                    new_source_code,
                    myrobot[i].sourcecode_url,
                    tabs[0]
                );
                myrobot[i].last_runtime = new Date().getTime();
                set_my_robot(myrobot);
            }
        }
    );
}

// 运行每个定时事务，且更新运行时间
function timer_run_robot(myrobot) {
    for (let i in myrobot) {
        if (myrobot[i].runtime && myrobot.hasOwnProperty(i)) {
            if (myrobot[i].runtime.endsWith("m")) {
                let minute = parseInt(myrobot[i].runtime.slice(0, -1));
                if (calc_minute(myrobot[i].last_runtime) >= minute) {
                    async_run(myrobot, i, {});
                }
            } else if (myrobot[i].runtime.indexOf(":") !== -1) {
                if (compare_time(myrobot[i].runtime)) {
                    if (
                        new Date(myrobot[i].last_runtime).getDate() !==
                        new Date().getDate()
                    ) {
                        async_run(myrobot, i, {});
                    }
                }
            }
        }
    }
}


/**
 * 监控相关
 */
let monitor_info = {}
let monitor_timer = undefined;

// 开关监控
function switch_monitor(case_name, type) {
    get_my_robot(robot => {
        if(type === "run" && monitor_info[case_name] === undefined) {
            monitor_info[case_name] = {}
            chrome.windows.create({
                url: robot[case_name].monitor.url,
                state: "minimized"
            }, function(window) {
                monitor_info[case_name] = {}
                monitor_info[case_name].tab = window.tabs[0].id
                monitor_info[case_name].data = []
                if(monitor_timer == undefined) {
                    monitor_timer = monitor_run()
                }
            })
        }
        if(type === "stop" && monitor_info[case_name] !== undefined) {
            chrome.tabs.remove(monitor_info[case_name].tab, () => {
                delete monitor_info[case_name]
                if(Object.keys(monitor_info).length == 0) {
                    clearInterval(monitor_timer);
                    monitor_timer = undefined;
                }
            })
        }
        console.log(monitor_info)
    })
}

// 具体监控
function monitor_run() {
    return setInterval(() => {
        get_my_robot(robot => {
            let keys = Object.keys(monitor_info)
            console.log(monitor_info)
            for(let i in keys) {
                let mon = monitor_info[keys[i]]
                chrome.tabs.reload(mon.tab)
                chrome.tabs.sendMessage(mon.tab, {
                    type: "get_value_list",
                    tag: robot[keys[i]].monitor.selector
                }, function(msg) {
                    if(msg.data.length != 0) {
                        if(mon.data.length == 0) {
                            mon.data = msg.data
                        } else if(mon.data.length == 1) {
                            if(mon.data[0] != msg.data[0]) {
                                mon.data = msg.data
                                send_tip(mon.data[0])
                            }
                        } else {
                            let news = []
                            for(let i = 0; i < msg.data.length; i++) {
                                if(mon.data.indexOf(msg.data[i]) == -1) {
                                    news.push(msg.data[i])
                                    mon.data.push(msg.data[i])
                                }
                            }
                            if(news.length > 0) {
                                send_tip(news.join("<br />"))
                            }
                            if(mon.data.length >= 300) {
                                mon.data.splice(0, mon.data.length - 300)
                            }
                        }
                    } else {
                        console.log("未获取到数据")
                    }
                })
            }
        })
    }, 5000);
}


// 检查网络情况
async function check_network(callback) {
    let network_check_url = "https://www.baidu.com/";
    return fetch(network_check_url)
        .then(resp => {
            if (resp.status == 200) {
                callback && callback();
            } else {
                console.log("network not working");
            }
        })
}


// 定时任务
let runtime_interval = undefined;

function switch_runtime(type) {
    if(type == "run" && runtime_interval == undefined) {
        // 开启定时运行检查
        runtime_interval = setInterval(function () {
            check_network(() => {
                get_my_robot((my_robot) => {
                    timer_run_robot(my_robot);
                });
            })
        }, 10000);
    }
    if(type == "stop") {
        get_my_robot((my_robot) => {
            let flag = true
            for (let i in my_robot) {
                if(my_robot[i].runtime) {
                    flag = false
                    break
                }
            }
            if(flag) {
                clearInterval(runtime_interval)
                runtime_interval = undefined
            }
        });
    }
}


// 干掉请求中的frame限制
chrome.webRequest.onHeadersReceived.addListener(
    function (details) {
        // console.log(details.url)
        // console.log(details.responseHeaders);
        for (var i = 0; i < details.responseHeaders.length; i++) {
            // console.log(details.responseHeaders[i])
            if (details.responseHeaders[i].name.toLowerCase() === 'x-frame-options') {
                details.responseHeaders[i].value = "";
                // console.log('Removing "' + details.responseHeaders[i].name + '" header.');
                // details.responseHeaders.splice(i, 1);
                // i--;
            }
        }
        // details.responseHeaders.push({
        //     "name": "Cross-Origin-Embedder-Policy",
        //     "value": "require-corp"
        // });
        // details.responseHeaders.push({
        //     "name": "Cross-Origin-Opener-Policy",
        //     "value": "same-origin"
        // });
        return { responseHeaders: details.responseHeaders };
    },
    { urls: ["<all_urls>"] },
    ['blocking', 'responseHeaders', 'extraHeaders']
);



chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.type === "KEYBOARD_TRIGGER") {
        get_my_robot(my_robot => {
            let args = {"SELECT": msg.select}
            async_run(my_robot, msg.case_name, args)
            sendResponse("success")
        })
    }
});