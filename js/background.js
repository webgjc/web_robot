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
var timer_rerun_count = {};

// 拼接执行的js
function jscode(process) {
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
        exec_code += `robot_node.value='${process.value}';`;
        exec_code += "let event = new Event('input', { bubbles: true });";
        exec_code += "event.simulated = true;";
        exec_code += "let tracker = robot_node._valueTracker;";
        exec_code += "if (tracker) { tracker.setValue(lastValue); }\n";
        exec_code += "robot_node.dispatchEvent(event);";
    } else if (process["opera"] === "refresh") {
        exec_code += "window.location.reload();";
    } else if (process["opera"] === "pagejump") {
        exec_code += `window.location.href='${process.value}';`;
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

function exec_run_item(process_item, tab_id, args) {
    console.log(`start run ${JSON.stringify(process_item)}`);
    if (process_item.opera === "getvalue") {
        chrome.tabs.sendMessage(tab_id, {
            type: "get_value",
            tag: process_item.tag,
            n: process_item.n,
        }, function (msg) {
            if (msg.type === "get_value") {
                args[process_item.value] = msg.data;
            }
            chrome.tabs.executeScript(tab_id, {
                code: jscode(process_item)
            });
        });
    } else if (process_item.opera === "value") {
        if (args[process_item.value] !== undefined) {
            process_item.value = args[process_item.value];
        }
        chrome.tabs.executeScript(tab_id, {
            code: jscode(process_item)
        });
    } else if (process_item.opera === "newpage") {
        chrome.tabs.create({
            url: process_item.value
        });
    } else {
        chrome.tabs.executeScript(tab_id, {
            code: jscode(process_item)
        });
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
function dom_check_run(process, tab_id, myrobot, index, timer) {
    let run_status = 0; // 运行状态 0 - 正在检查，1 - 等待运行，2 - 正在运行
    let now_index = 0; // 当前运行process
    let args = {};
    let count = 0;
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
                exec_run_item(process[now_index], tab_id, args);
                if (process[now_index].opera === "newpage") {
                    chrome.tabs.query({
                        active: true,
                        currentWindow: true
                    }, async function (tabs) {
                        tab_id = tabs[0].id
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
            chrome.tabs.sendMessage(tab_id, {
                type: "show_msg",
                msg: `dom not found: ${process[now_index].tag} , ${process[now_index].n}`
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

function async_run(myrobot, i) {
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
                dom_check_run(myrobot[i].case_process, tabs[0].id, myrobot, i, true);
                myrobot[i].last_runtime = new Date().getTime();
                set_my_robot(myrobot);
            }
            if (myrobot[i].case_type === "sourcecode") {
                sourcecode_run(
                    myrobot[i].case_sourcecode,
                    myrobot[i].sourcecode_url,
                    tabs[0]
                );
                myrobot[i].last_runtime = new Date().getTime();
                set_my_robot(myrobot);
            }
        }
    );
}


function timer_run_robot(myrobot) {
    for (let i in myrobot) {
        if (myrobot[i].runtime && myrobot.hasOwnProperty(i)) {
            if (myrobot[i].runtime.endsWith("m")) {
                let minute = parseInt(myrobot[i].runtime.slice(0, -1));
                if (calc_minute(myrobot[i].last_runtime) >= minute) {
                    async_run(myrobot, i);
                }
            } else if (myrobot[i].runtime.indexOf(":") !== -1) {
                if (compare_time(myrobot[i].runtime)) {
                    if (
                        new Date(myrobot[i].last_runtime).getDate() !==
                        new Date().getDate()
                    ) {
                        async_run(myrobot, i);
                    }
                }
            }
        }
    }
}

// 开启定时运行检查
setInterval(function () {
    get_my_robot((my_robot) => {
        timer_run_robot(my_robot);
    });
}, 10000);


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
        return { responseHeaders: details.responseHeaders };
    },
    { urls: ["<all_urls>"] },
    ['blocking', 'responseHeaders', 'extraHeaders']
);