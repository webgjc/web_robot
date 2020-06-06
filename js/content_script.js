function robot_make_select_canvass(dom) {
    scroll_position(dom);
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
    }, 1000);
}

function getAbsPoint(dom) {
    let x = dom.offsetLeft;
    let y = dom.offsetTop;
    while(dom.offsetParent) {
        dom = dom.offsetParent;
        x += dom.offsetLeft;
        y += dom.offsetTop;
    }
    return {'x': x, 'y': y};
}

function scroll_position(dom) {
    let domposi = getAbsPoint(dom);
    if(domposi.y < window.scrollY || domposi.y > (window.scrollY + window.innerHeight * 0.8) ||
        domposi.x < window.scrollX || domposi.x > (window.scrollX + window.innerWidth * 0.8)) {
        window.scrollTo(domposi.x - window.innerWidth / 2, domposi.y - window.innerHeight / 2);
    }
}


chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "robot") {
        port.onMessage.addListener(function(msg) {
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
            } else if (msg.type === "select_class_id") {
                let dom;
                if(msg.content.startsWith(".")) {
                    dom = document.getElementsByClassName(msg.content.substring(1))[msg.n];
                }
                if(msg.content.startsWith("#")) {
                    dom = document.getElementById(msg.content.substring(1));
                }
                robot_make_select_canvass(dom);
            }else if (msg.type === "select_tag") {
                let dom = document.getElementsByTagName(msg.tag)[msg.n];
                robot_make_select_canvass(dom);
            } else if (msg.type === "get_position") {
                let posidom;
                if(msg.tag.startsWith(".")) {
                    posidom = document.getElementsByClassName(msg.tag.substring(1))[msg.n];
                } else if(msg.tag.startsWith("#")) {
                    posidom = document.getElementById(msg.tag.substring(1));
                } else {
                    posidom = document.getElementsByTagName(msg.tag)[msg.n];
                }
                scroll_position(posidom);
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
            } else {
                console.log("what are you doing!");
            }
        })
    }
});