var tag_types = ["自由选择器", "a", "body", "button", "div", "i", "img", "input", "li", "p", "span", "td", "textarea", "tr", "ul", "h1", "h2", "h3", "h4", "h5"];


// 拼接执行的js
function jscode(process) {
    let exec_code = "(function(){ \n";
    if(tag_types.indexOf(process.tag) === -1) {
        exec_code += `var robot_node = document.querySelectorAll('${process.tag}')[${process.n}];`
    }else{
        exec_code += `var robot_node = document.getElementsByTagName('${process.tag}')[${process.n}];`
    }
    exec_code += 'window.scrollTo(robot_node.offsetLeft, robot_node.offsetTop - window.innerHeight / 2);';
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

function simexecute(case_process) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var port = chrome.tabs.connect(tabs[0].id, { name: "robot" });
        var event;
        var process_wait = 0;
        port.onMessage.addListener(function(msg) {
            if (msg.type === "get_position") {
                let postdata = {
                    x: msg.x,
                    y: msg.y,
                    opera: event["opera"],
                    value: event["value"]
                };
                fetch("http://localhost:12580/", {
                    method: "POST",
                    body: JSON.stringify(postdata)
                });
            }
        });
        for(let i in case_process) {
            process_wait = process_wait + case_process[i]["wait"] * 1000;
            setTimeout(function() {
                event = case_process[i];
                port.postMessage({
                    type: "get_position",
                    tag: event["tag"],
                    n: event["n"],
                });
            }, process_wait);
        }
    })
}