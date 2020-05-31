var ROBOT_DATA = {
    "url": window.location.href,
    "inputs": get_robot_inputs()
}


function get_robot_inputs() {
    let robot_inputs = document.getElementsByTagName("input");
    let res_inputs = [];
    for (let i = 0; i < robot_inputs.length; i++) {
        if (robot_inputs[i].type == "text" || robot_inputs[i].type == "password" ||
            robot_inputs[i].type == "number" || robot_inputs[i].type == "email") {
            res_inputs.push({
                "n": i,
                "name": robot_inputs[i].name,
                "placeholder": robot_inputs[i].placeholder,
            });
        }
    }
    return res_inputs
}


function robot_make_select_canvass(dom) {
    // window.scrollTo(0, parseInt(dom.offsetTop / window.screen.height) * window.screen.height);
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
    setTimeout(function() {
        document.getElementById("robot_select").remove();
    }, 1000)
}


chrome.runtime.onConnect.addListener(function(port) {
    if (port.name == "robot") {
        port.onMessage.addListener(function(msg) {
            if (msg.type == "search_tag") {
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
            } else if (msg.type == "search_class_id") {
                let nums = Array();
                if(msg.content.startsWith(".")) {
                    let content = msg.content.substring(1);
                    for (let i = 0; i < document.getElementsByClassName(content).length; i++) {
                        if (document.getElementsByClassName(content)[i].offsetHeight > 0) {
                            nums.push(i)
                        }
                    }
                }
                if(msg.content.startsWith("#")) {
                    let content = msg.content.substring(1);
                    if(document.getElementById(content) != null){
                        nums.push(0);
                    }
                }
                port.postMessage({
                    type: msg.type,
                    num: nums
                });
            } else if (msg.type == "select_class_id") {
                let dom;
                if(msg.content.startsWith(".")) {
                    dom = document.getElementsByClassName(msg.content.substring(1))[msg.n];
                }
                if(msg.content.startsWith("#")) {
                    dom = document.getElementById(msg.content.substring(1));
                }
                robot_make_select_canvass(dom);
            }else if (msg.type == "select_tag") {
                let dom = document.getElementsByTagName(msg.tag)[msg.n];
                robot_make_select_canvass(dom);
            } else if (msg.type == "get_position") {
                let posidom;
                if(msg.tag.startsWith(".")) {
                    posidom = document.getElementsByClassName(msg.tag.substring(1))[msg.n];
                } else if(msg.tag.startsWith("#")) {
                    posidom = document.getElementById(msg.tag.substring(1));
                } else {
                    posidom = document.getElementsByTagName(msg.tag)[msg.n];
                }
                port.postMessage({
                    type: msg.type,
                    x: posidom.getBoundingClientRect().left + posidom.getBoundingClientRect().width / 2 + window.screenLeft,
                    y: posidom.getBoundingClientRect().top + posidom.getBoundingClientRect().height / 2 + window.screenTop + (window.screen.height - window.screen.availHeight)
                })
            } else if (msg.type == "set_value") {
                let dom = document.getElementsByTagName(msg.tag)[msg.n];
                dom.value = msg.value;
            } else {
                console.log("what are you doing!")
            }
        })
    }
})