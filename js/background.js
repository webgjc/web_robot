const tag_types = ["自由选择器", "a", "body", "button", "div", "i", "img", "input", "li", "p", "span", "td", "textarea", "tr", "ul", "h1", "h2", "h3", "h4", "h5"];

// 拼接执行的js
function jscode(process) {
    let exec_code = "(function(){ \n";
    if (process["opera"] === "click" || process["opera"] === "value" || process["opera"] === "mouseover") {
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
            exec_code += `robot_node = document.getElementsByTagName('${process.tag}')[${process.n}];\n`
        }
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
        exec_code += "robot_node.click();"
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
        exec_code += `robot_node.dispatchEvent(mouseoverevent);`
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
            code: source_jscode(sourcecode)
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
    })
}

// 运行流程事务
async function exec_run(process, tab_id) {
    let args = {};
    for (let i = 0; i < process.length; i++) {
        await sleep(process[i].wait);
        if (process[i].opera === "getvalue") {
            chrome.tabs.sendMessage(tab_id, {
                type: "get_value",
                tag: process[i].tag,
                n: process[i].n,
            }, function (msg) {
                if (msg.type === "get_value") {
                    args[process[i].value] = msg.data;
                }
                chrome.tabs.executeScript(tab_id, {
                    code: jscode(process[i])
                });
            });
        } else if (process[i].opera === "value") {
            if (args[process[i].value] !== undefined) {
                process[i].value = args[process[i].value];
            }
            chrome.tabs.executeScript(tab_id, {
                code: jscode(process[i])
            });
        } else if (process[i].opera === "newpage") {
            chrome.tabs.create({
                url: process[i].value
            });
            await chrome.tabs.query({
                active: true,
                currentWindow: true
            }, async function (tabs) {
                tab_id = tabs[0].id
            });
        } else {
            chrome.tabs.executeScript(tab_id, {
                code: jscode(process[i])
            });
        }
    }
}

function get_my_robot(callback) {
    chrome.storage.local.get(["my_robot"], function (res) {
        if (callback) callback(res.my_robot);
    });
}

function set_my_robot(new_robot, cb) {
    chrome.storage.local.set({
        my_robot: new_robot
    }, function () {
        cb && cb();
    });
}

function post_client_run(msg, process) {
    let postdata = {
        x: msg.x,
        y: msg.y,
        opera: process.opera,
        value: process.value
    };
    fetch("http://127.0.0.1:12580/webexec/", {
        method: "POST",
        body: JSON.stringify(postdata)
    })
}

// 受控运行流程事务
async function simexecute(process, tabs) {
    await chrome.tabs.query({
        active: true,
        currentWindow: true
    }, async function (tabs) {
        let args = {};
        for (let i = 0; i < process.length; i++) {
            await sleep(process[i].wait);
            if (process[i].opera === "click" || process[i].opera === "value" || process[i].opera === "mouseover" || process[i].opera === "getvalue") {
                await chrome.tabs.sendMessage(tabs[0].id, {
                    type: "get_position",
                    tag: process[i].tag,
                    n: process[i].n,
                }, function (msg) {
                    if (msg.type === "get_position") {
                        if (process[i].opera === "getvalue") {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                type: "get_value",
                                tag: process[i].tag,
                                n: process[i].n,
                            }, function (msg) {
                                if (msg.type === "get_value") {
                                    args[process[i].value] = msg.data;
                                }
                                post_client_run(msg, process[i]);
                            });
                        } else if (process[i].opera === "value") {
                            if (args[process[i].value] !== undefined) {
                                process[i].value = args[process[i].value];
                            }
                            post_client_run(msg, process[i]);
                        } else {
                            post_client_run(msg, process[i]);
                        }
                    }
                });
            } else {
                chrome.tabs.executeScript(tabs[0].id, {
                    code: jscode(process[i])
                });
            }
        }
    })
}

// function simexecute(case_process) {
//     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//         con_run(case_process, tabs);
//     })
// }

function calc_minute(time) {
    return ((new Date()).getTime() - time) / (1000 * 60);
}

function compare_time(time) {
    let t = time.split(":");
    return parseInt(t[0]) * 60 + parseInt(t[1]) <= new Date().getHours() * 60 + new Date().getMinutes()
}

async function async_run(myrobot, i) {
    await chrome.tabs.query({
        active: true,
        currentWindow: true
    }, async function (tabs) {
        if (myrobot[i].case_type === "process") {
            await exec_run(myrobot[i].case_process, tabs[0].id);
            myrobot[i].last_runtime = new Date().getTime();
            set_my_robot(myrobot);
        }
        if (myrobot[i].case_type === "sourcecode") {
            sourcecode_run(myrobot[i].case_sourcecode, myrobot[i].sourcecode_url, tabs[0]);
            myrobot[i].last_runtime = new Date().getTime();
            set_my_robot(myrobot);
        }
    })
}

async function timer_run_robot(myrobot) {
    for (let i in myrobot) {
        if (myrobot[i].runtime && myrobot.hasOwnProperty(i)) {
            if (myrobot[i].runtime.endsWith("m")) {
                let minute = parseInt(myrobot[i].runtime.slice(0, -1));
                if (calc_minute(myrobot[i].last_runtime) >= minute) {
                    await async_run(myrobot, i);
                }
            } else if (myrobot[i].runtime.indexOf(":") !== -1) {
                if (compare_time(myrobot[i].runtime)) {
                    if (new Date(myrobot[i].last_runtime).getDate() !== new Date().getDate()) {
                        await async_run(myrobot, i);
                    }
                }
            }
        }
    }
}

async function timer_runing() {
    while (true) {
        await sleep(20);
        // console.log(new Date());
        await get_my_robot(async my_robot => {
            await timer_run_robot(my_robot)
        })
    }
}

timer_runing();