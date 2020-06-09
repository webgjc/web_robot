var tag_types = ["自由选择器", "a", "body", "button", "div", "i", "img", "input", "li", "p", "span", "td", "textarea", "tr", "ul", "h1", "h2", "h3", "h4", "h5"];


// 拼接执行的js
function jscode(process) {
    let exec_code = "(function(){ \n";
    if(process["opera"] === "click" || process["opera"] === "value") {
        if(tag_types.indexOf(process.tag) === -1) {
            exec_code += `var robot_node = document.querySelectorAll('${process.tag}')[${process.n}];`
        }else{
            exec_code += `var robot_node = document.getElementsByTagName('${process.tag}')[${process.n}];`
        }
        exec_code += 'window.scrollTo(robot_node.offsetLeft, robot_node.offsetTop - window.innerHeight / 2);';
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
    }
    exec_code += "\n})();";
    return exec_code;
}

// 运行
function execute(the_case, tab_id) {
    var process_wait = 0;
    for (let i = 0; i < the_case.length; i++) {
        process_wait = process_wait + the_case[i]["wait"] * 1000;
        setTimeout(function() {
            chrome.tabs.executeScript(tab_id, { code: jscode(the_case[i]) });
        }, process_wait);
    }
}

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
    return new Promise(function(resolve, reject) {
        setTimeout(resolve,s * 1000);
    })
}

// 运行流程事务
async function exec_run(process, tab_id) {
    for(let i = 0;i < process.length; i++) {
        await sleep(process[i].wait);
        chrome.tabs.executeScript(tab_id, {code: jscode(process[i])});
    }
}

function get_my_robot(callback) {
    chrome.storage.local.get(["my_robot"], function (res) {
      if (callback) callback(res.my_robot);
    });
}

function set_my_robot(new_robot, cb) {
    chrome.storage.local.set({ my_robot: new_robot }, function () {
      cb && cb();
    });
  }

// 受控运行流程事务
async function con_run(process, tabs) {
    let port = chrome.tabs.connect(tabs[0].id, { name: "robot" });
    let event;
    let process_wait = 0;
    port.onMessage.addListener(function(msg) {
        if (msg.type === "get_position") {
            let postdata = {
                x: msg.x,
                y: msg.y,
                opera: event["opera"],
                value: event["value"]
            };
            fetch("http://127.0.0.1:12580/webexec/", {
                method: "POST",
                body: JSON.stringify(postdata)
            })
        }
    });
    for(let i = 0; i < process.length; i++) {
        await sleep(process[i].wait);
        event = process[i];
        port.postMessage({
            type: "get_position",
            tag: process[i].tag,
            n: process[i].n,
        });
    }
}

function simexecute(case_process) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        con_run(case_process, tabs);
    })
}

function calc_minute(time) {
    return ((new Date()).getTime() - time) / (1000 * 60);
}

function compare_time(time) {
    let t = time.split(":")
    return parseInt(t[0]) * 60 + parseInt(t[1]) <= new Date().getHours() * 60 + new Date().getMinutes()
}

async function async_run(myrobot, i) {
    await chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
        await exec_run(myrobot[i].case_process, tabs[0].id);
        myrobot[i].last_runtime = new Date().getTime();
        set_my_robot(myrobot);
    })
}

async function timer_run_robot(myrobot) {
    for(let i in myrobot) {
        if(myrobot[i].runtime) {
            if(myrobot[i].runtime.endsWith("m")) {
                let minute = parseInt(myrobot[i].runtime.slice(0, -1));
                if (calc_minute(myrobot[i].last_runtime) >= minute) {
                   await async_run(myrobot, i);
                }
            }else if(myrobot[i].runtime.indexOf(":") != -1) {
                if(compare_time(myrobot[i].runtime)) {
                    if(new Date(myrobot[i].last_runtime).getDate() != new Date().getDate()) {
                        await async_run(myrobot, i);
                    }
                }
            }
        }
    }
}

async function timer_runing() {
    while(true) {
        await sleep(60);
        console.log(new Date());
        await get_my_robot(async my_robot => {
            await timer_run_robot(my_robot)
        })
    }
}

timer_runing();