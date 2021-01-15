/**
 * 功能：
 * 1、浏览器默认主页覆盖，用作看板功能
 * 2、并发爬虫使用主页iframe实现
 */


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

// 获取数据存储
function get_my_robot(callback) {
    chrome.storage.local.get(["my_robot"], function (res) {
        if (callback) callback(res.my_robot);
    });
}

// 设置数据存储
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

// 等待
function sleep(s) {
    return new Promise(function (resolve, reject) {
        setTimeout(resolve, s * 1000);
    });
}

// chrome://newtab/?case=rwe
// function resetwh(w, h, name) {
//     let id = name.split("-")[1];
//     w = w + "px";
//     h = h + "px";
//     document.getElementById(`frame-${id}`).style.width = w;
//     document.getElementById(`frame-${id}`).style.height = h;
//     document.getElementById(`grid-${id}`).style.width = w;
//     document.getElementById(`grid-${id}`).style.height = h;
// }

function exec_run_item(process_item, tab_id, name, grid, node, args, cb) {
    if (process_item.opera === "onlyshow") {
        chrome.tabs.sendMessage(tab_id, {
            name: name,
            type: "onlyshow",
            tag: process_item.tag,
            n: process_item.n,
            grid: grid,
            width: document.getElementById(name).clientWidth + "px",
            height: document.getElementById(name).clientHeight + "px"
        }, (msg) => {
            // resetwh(msg.data.w, msg.data.h, name);
        })
    } else if (process_item.opera === "getvalue") {
        chrome.tabs.sendMessage(
            tab_id,
            {
                type: "get_value_frame",
                name: name,
                tag: process_item.tag,
                n: process_item.n,
            },
            function (msg) {
                args[process_item.value] = msg.data
                cb && cb(name, args, node);
            }
        );
    } else if (process_item.opera === "getcustomvalue") {
        chrome.tabs.sendMessage(
            tab_id,
            {
                type: "get_custom_value_frame",
                name: name,
                value: process_item.expr
            },
            function (msg) {
                args[process_item.value] = msg.data
                cb && cb(name, args, node);
            }
        );
    } else {
        chrome.tabs.sendMessage(tab_id, {
            name: name,
            type: "execute_frame",
            code: jscode(process_item)
        })
    }
}


// dom检查自旋运行
function dom_check_run(process, tab_id, name, grid, node, cb) {
    // console.log("dom check run")
    let run_status = 0; // 运行状态 0 - 正在检查，1 - 等待运行，2 - 正在运行
    let now_index = 0; // 当前运行process
    let args = {}; // 可取参数列表（包括取值导入）
    let count = 0;
    if (process.length === 0) {
        callback();
        return;
    }
    let dom_itvl = setInterval(function () {
        if (run_status == 0 && !process[now_index].check) {
            run_status = 1;
        }
        if (run_status == 0) {
            count += 1;
            chrome.tabs.sendMessage(
                tab_id,
                {
                    type: "get_dom_frame",
                    name: name,
                    tag: process[now_index].tag,
                    n: process[now_index].n,
                },
                function (msg) {
                    // console.log(msg)
                    if (msg.type == "get_dom_frame" && msg.dom) {
                        run_status = 1;
                        count = 0;
                    }
                }
            );
        } else if (run_status == 1) {
            if (process.length - 1 === now_index) {
                clearInterval(dom_itvl);
                exec_run_item(process[now_index], tab_id, name, grid, node, args, cb);
            } else {
                exec_run_item(process[now_index], tab_id, name, grid, node, args);
            }
            now_index += 1;
            run_status = 0;
        }
        if (count == 50) {
            clearInterval(dom_itvl);
            console.log(
                `dom not found: ${process[now_index].tag} , ${process[now_index].n}`
            );
        }
    }, 200);
}

// 运行流程事务
// async function exec_run(process, tab_id, name, grid) {
//     for (let i = 0; i < process.length; i++) {
//         await sleep(process[i].wait);
//         await exec_run_item(process[i], tab_id, name, grid);
//     }
// }

function fetch_html(url, cb) {
    fetch(url)
        .then(resp => resp.text())
        .then(data => cb && cb(data));
}

// 获取url地址参数
function get_query_variable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) { return pair[1]; }
    }
    return (false);
}

// 获取爬虫地址
function get_crawler_url(crawler, urls, index, cb) {
    if (crawler.apicb) {
        fetch(crawler.urlapi)
            .then(resp => resp.text())
            .then(url => cb && cb(url));
    } else {
        cb && cb(urls[index]);
    }
}

// 处理批量的url配置
function deal_batch_url(crawler) {
    let res_url = [];
    for (let i = 0; i < crawler.urls.length; i++) {
        let match_part = crawler.urls[i].match("\{(.*?)\}");
        if (match_part != null) {
            let start_end = match_part[1].split("-").map(j => parseInt(j));
            for (let k = start_end[0]; k <= start_end[1]; k++) {
                res_url.push(crawler.urls[i].replace(match_part[0], k));
            }
        } else {
            res_url.push(crawler.urls[i]);
        }
    }
    return res_url;
}

// 并发爬虫运行
function crawler_run(the_case, grid, crawler, tab, cb) {

    // 处理批量url
    let urls = deal_batch_url(crawler);

    // 并发数
    let size = crawler.apicb ?
        crawler.cc : Math.min(crawler.cc, urls.length);
    let arr = [];
    let index = 0;
    let queue = [];
    let result = [];
    let queue_status = {};
    let queue_url = {};
    let names = [];

    // 发送数据初始化
    crawler_send_data(the_case, crawler, "clear", result);

    // 运行容器iframe初始化
    for (let i = 0; i < size; i++) {
        get_crawler_url(crawler, urls, i, function (url) {
            arr.push({
                w: 25,
                h: 25,
                content: `<iframe src="${url}" name="crawler-${i}"></iframe>`,
                id: `crawler-${i}`,
                url: url
            });
            index++;
            queue.push(`crawler-${i}`);
            names.push(`crawler-${i}`);
            queue_url[`crawler-${i}`] = url;
            queue_status[`crawler-${i}`] = 0;
            if (i == size - 1) {
                grid.load(arr);
            }
        })
    }
    let nodes = grid.el.children;

    // 定时器检查队列中是否有空余容器准备运行
    let timer = setInterval(function () {
        while (queue.length > 0) {
            let name = queue.shift();
            queue_status[name] = 1;

            // 运行
            dom_check_run(crawler.fetch, tab.id, name, null, nodes[parseInt(name.split("-")[1])], (name, data, node) => {
                // 处理得到的数据，和为容器准备下一个url
                get_crawler_url(crawler, urls, index, function (url) {
                    queue_status[name] = 0;
                    let tmp = $.extend({
                        "primary_key": queue_url[name]
                    }, data);
                    if ((!crawler.apicb && index < urls.length) || (crawler.apicb && url != "")) {
                        result.push(tmp);
                        grid.update(node, {
                            content: `<iframe src="${url}" name="${name}"></iframe>`,
                            url: url
                        })
                        queue_url[name] = url
                        queue.push(name);
                        index++;
                        crawler_send_data(the_case, crawler, "save", result);
                    } else {
                        result.push(tmp);
                        for (let i = 0; i < names.length; i++) {
                            if (queue_status[names[i]] == 1) {
                                return;
                            }
                        }
                        crawler_send_data(the_case, crawler, "saveAll", result);
                        crawler_send_data(the_case, crawler, "summary", result, () => {
                            clearInterval(timer);
                            cb && cb(result);
                        });
                    }
                })
            });
        }
    }, 200)
    return;
}


// 发送数据到客户端/自定义云端
function crawler_send_data(case_name, crawler, opera, data, callback) {
    console.log(case_name, crawler, opera, data)
    if (crawler.send) {
        let pd = null;
        if (opera === "saveAll") {
            pd = data;
            opera = "save";
        } else {
            if (data.length >= crawler.freq) {
                pd = data.splice(0, crawler.freq);
            }
        }
        if ((opera == "save" && pd != null) || opera != "save") {
            let tmp = {
                case_name: case_name,
                opera: opera,
                data: pd
            }
            fetch(crawler.api, {
                method: "POST",
                body: JSON.stringify(tmp),
            }).then(() => {
                callback && callback();
            });
        }
    } else {
        callback && callback();
    }
}


$(document).ready(function () {

    let grid = GridStack.init({
        alwaysShowResizeHandle: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        ),
        resizable: {
            handles: 'e, se, s, sw, w'
        },
        column: 100,
        cellHeight: 'auto',
        // float: true,
        enableMove: true,
        enableResize: true,
        margin: 2
    });

    $("body").mousemove(e => {
        let sh = e.clientX / window.innerWidth;
        if (e.clientY < 10 && sh > 0.4 && sh < 0.6) {
            $("#opera").show();
        }
    });

    $("#opera").mouseleave(e => {
        if ($("#handgrid").text() === "排版") {
            $("#opera").hide();
        }
    });

    // 主要入口
    chrome.tabs.getCurrent(tab => {
        get_my_robot(my_robot => {
            let process = [];
            let names = [];
            let mygrid = my_robot.SETTING_DATA.DASHBOARD_GRID || [];
            let mygridmap = {};
            let the_case = get_query_variable("case");

            grid.enableMove(false);
            grid.enableResize(false);
            grid.load(mygrid);
            grid.commit();

            if (the_case) {
                let crawler = my_robot[the_case].paral_crawler;
                if (!crawler.apicb && crawler.urls.length == 0) {
                    crawler.data = [];
                    set_my_robot(my_robot, () => {
                        window.close();
                    })
                }
                crawler_run(the_case, grid, crawler, tab, (result) => {
                    crawler.data = result;
                    set_my_robot(my_robot, () => {
                        window.close();
                    })
                });
                return;
            }

            for (let i = 0; i < mygrid.length; i++) {
                mygridmap[mygrid[i].id] = mygrid[i];
            }

            for (let i = 0; i < my_robot.SETTING_DATA.KEYS.length; i++) {
                let key = my_robot.SETTING_DATA.KEYS[i];
                let tmpid = `frame-${key}`;
                if (mygridmap[tmpid]) {
                    process.push(my_robot[key].case_process.slice(1))
                    names.push(tmpid);
                } else {
                    if (my_robot[key].add_dashboard) {
                        let grid_contain = `<iframe src="${my_robot[key].case_process[0].value}" name="${tmpid}" id="${tmpid}"></iframe>`;
                        let newgrid = {
                            w: 20,
                            h: 20,
                            content: grid_contain,
                            id: tmpid,
                            url: my_robot[key].case_process[0].value
                        };
                        grid.addWidget(newgrid);
                        mygridmap[tmpid] = newgrid;
                        process.push(my_robot[key].case_process.slice(1))
                        names.push(tmpid);
                    }
                }
            }

            for (let i = 0; i < names.length; i++) {
                dom_check_run(process[i], tab.id, names[i], mygridmap[names[i]]);
            }

            // grid.on("dragstop resizestop", (e, el) => {
            //     my_robot.SETTING_DATA.DASHBOARD_GRID = grid.save();
            //     set_my_robot(my_robot);
            // });

            $("#handgrid").click(e => {
                if ($("#handgrid").text() == "排版") {
                    $("#handgrid").html("保存");
                    let editgrid = [];
                    let tmpgridmap = JSON.parse(JSON.stringify(mygridmap))
                    for (let i = 0; i < names.length; i++) {
                        tmpgridmap[names[i]].content = `<i class="fa fa-close close-panel" aria-hidden="true" id="panel-${i}"></i>`;
                        tmpgridmap[names[i]].content += `<div style="text-align: center">${names[i].slice(6)}</div>`
                        tmpgridmap[names[i]].id = `panel-${i}`;
                        editgrid.push(tmpgridmap[names[i]]);
                    }
                    grid.load(editgrid, true);
                    grid.enableMove(true);
                    grid.enableResize(true);
                } else {
                    $("#handgrid").html("排版");
                    let editgrid = grid.save();
                    let tmpkeys = [];
                    for (let i = 0; i < editgrid.length; i++) {
                        let idx = parseInt(editgrid[i].id.slice(6));
                        tmpkeys.push(names[idx]);
                        mygridmap[names[idx]].x = editgrid[i].x;
                        mygridmap[names[idx]].y = editgrid[i].y;
                        mygridmap[names[idx]].w = editgrid[i].w;
                        mygridmap[names[idx]].h = editgrid[i].h;
                    }
                    let tmpgrid = [];
                    for (let i = 0; i < tmpkeys.length; i++) {
                        tmpgrid.push(mygridmap[tmpkeys[i]]);
                    }
                    my_robot.SETTING_DATA.DASHBOARD_GRID = tmpgrid;
                    set_my_robot(my_robot, () => {
                        window.location.reload();
                    });
                }
            });

            $(".grid-stack").on("click", ".close-panel", e => {
                let thisgrid = grid.save();
                for (let i = 0; i < thisgrid.length; i++) {
                    if (thisgrid[i].id === e.target.id) {
                        thisgrid.splice(i, 1);
                        break;
                    }
                }
                grid.load(thisgrid, true);
                my_robot[names[parseInt(e.target.id.slice(6))].slice(6)].add_dashboard = false;
                // names.splice(parseInt(e.target.id.slice(6)), 1);
            });

            $("#reset").click(e => {
                my_robot.SETTING_DATA.DASHBOARD_GRID = [];
                set_my_robot(my_robot, () => {
                    window.location.reload();
                })
            })
        })
    })
})

// fetch html 也可以实现突破 x-frame-origin 限制，但会缺少js事件，目前使用backgroud修改response头实现
// for (let i = 0; i < mygrid.length; i++) {
// let frame = document.createElement("iframe");
// frame.onload = function () {
//     fetch_html("https://www.zhihu.com/hot", data => {
//         let ed = frame.contentWindow.document;
//         ed.open();
//         ed.write(data);
//         ed.close();
//         ed.contentEditable = true;
//         ed.designMode = 'on';
//         mygrid[i].content = frame.outerHTML;
//         if (i == mygrid.length - 1) {
//             grid.load(mygrid);
//             document.getElementById("reframe").style.display = "none";
//         }
//     })
// }
// document.getElementById("reframe").appendChild(frame);
// mygrid[i].content = `<iframe name="${mygrid[i].id}" id="${mygrid[i].id}"></iframe>`
// console.log(mygrid)
// }