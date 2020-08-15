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
const local_client_host = "http://127.0.0.1:12580/";

const RECORD_CASE = "RECORD_CASE";
const SETTING_DATA = "SETTING_DATA";
const WEB_ADD_CASE = "WEB_ADD_CASE";
const WEB_ADD_EVENT = "WEB_ADD_EVENT";

// 获取数据存储
function get_my_robot(callback) {
    chrome.storage.local.get(["my_robot"], function (res) {
        if (callback) callback(res.my_robot);
    });
}

/**
 数据存储格式
 storage key: my_robot
 {
    事务名: {
        case_name(事务名): "case",
        case_process(事务流程): [
            {
                n(选择器第n个): 0,
                opera(操作): "click",
                tag(标签/class/id): "html",
                value(设值): "",
                wait(前置等待时间): 1,
            }
        ],
        case_sourcecode(源码事务的js源码): "",
        sourcecode_url(源码主入正则匹配地址): "",
        start_inject(开启注入): false,
        control_url(受控地址): "",
        case_type(事务类型): "prcess(流程事务)/sourcecode(源码事务)",
        last_runtime(上次运行时间): 1591616590387,
        runtime(定时时间): null / 10(分钟);
    },
    SETTING_DATA: {
        KEYS: [],
        RECORD_CASE: "录制事务名",
        WEB_ADD_CASE: "页面添加事务名",
        WEB_ADD_EVENT: {
            tag: "标签",
            n: "1"
        }
    }
}
 */

// 设置数据存储
function set_my_robot(new_robot, cb) {
    chrome.storage.local.set({
        my_robot: new_robot
    }, function () {
        cb && cb();
    });
}

// 连接
function connect(callback) {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        var port = chrome.tabs.connect(tabs[0].id, {
            name: "robot"
        });
        callback(port);
    });
}

// 当前tab执行
function exectab(callback) {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        callback(tabs[0].id, tabs[0]);
    });
}

// 连接测试本地客户端
function connect_client(callback) {
    fetch(local_client_host)
        .then(() => {
            callback();
        })
        .catch(() => {
            alert("本地WEB客户端连接失败，请开启pythonWeb服务");
        });
}

// 拼接要执行的js代码
function jscode(process) {
    let exec_code = "(function(){ \n";
    if (process["opera"] === "click" || process["opera"] === "value" || process["opera"] === "mouseover") {
        if (tag_types.indexOf(process.tag) === -1) {
            exec_code += `var robot_node = document.querySelectorAll('${process.tag}')[${process.n}];`;
        } else {
            exec_code += `var robot_node = document.getElementsByTagName('${process.tag}')[${process.n}];`;
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

// 根据存储数据更新主页
function refresh_cases() {
    get_my_robot((my_robot) => {
        if (my_robot === undefined) {
            set_my_robot({});
        } else {
            let cases = "";
            for (let n = 0; n < my_robot[SETTING_DATA]["KEYS"].length; n++) {
                let i = my_robot[SETTING_DATA]["KEYS"][n];
                if (my_robot.hasOwnProperty(i)) {
                    if(i === SETTING_DATA) continue;
                    let tr = "<tr id=" + i + '><td><a href="#" class="case_name">' + i + "</a></td><td>";
                    if (
                        my_robot[i]["case_type"] === "process" ||
                        my_robot[i]["case_type"] === "sourcecode"
                    ) {
                        tr += '<a href="#" class="run_case">运行</a> ';
                        tr += '<a href="#" class="timer_run">定时运行</a> ';
                    }
                    if (my_robot[i]["case_type"] === "sourcecode") {
                        tr += `<a href="#" class="start_inject">${my_robot[i].start_inject ? "关闭" : "开启"}注入</a> `;
                    }
                    if (
                        my_robot[i]["case_type"] === "process" ||
                        my_robot[i]["case_type"] === "control"
                    ) {
                        tr += '<a href="#" class="sim_run">受控运行</a> ';
                    }
                    if (my_robot[i]["case_type"] === "process") {
                        tr += '<a href="#" class="lun_case">轮播</a> ';
                    }
                    tr += '<br />';
                    tr += '<a href="#" class="rename_case">重命名</a> ';
                    tr += '<a href="#" class="moveup_case">上移</a> ';
                    tr += '<a href="#" class="del_case">删除</a> ';
                    if (my_robot[i]["case_type"] !== "control") {
                        tr += '<a href="#" class="export_case">导出</a></td></tr>';
                    }
                    cases = cases + tr;
                }
            }
            $("#cases").html(cases);
        }
    });
}

// 更新单个事务的流程
function refresh_process(case_name) {
    get_my_robot((my_robot) => {
        var data = my_robot[case_name]["case_process"];
        var process_li = "";
        for (let i = 0; i < data.length; i++) {
            let lili =
                '<li class="collection-item" id="process-' +
                i +
                '"> \
                                    <div class="row "> \
                                        <div class="col s6 ">标签：' +
                data[i]["tag"] +
                '</div> \
                                        <div class="col s6 ">#：' +
                data[i]["n"] +
                '</div> \
                                    </div> \
                                    <div class="row "> \
                                        <div class="col s6 ">操作：' +
                data[i]["opera"] +
                '</div> \
                                        <div class="col s6 ">等待：' +
                data[i]["wait"] +
                '秒</div> \
                                    </div> \
                                    <div class="row "> \
                                        <div class="col s12 ">赋值：' +
                data[i]["value"] +
                '</div> \
                                    </div> \
                                    <div class="row "> \
                                        <a href="# "> \
                                            <div class="col pc" id="process_test_run" >test</div> \
                                        </a> \
                                        <a href="#"> \
                                            <div class="col pc" id="process_edit">编辑</div> \
                                        </a> \
                                        <a href="#"> \
                                            <div class="col pc" id="process_move">上移</div> \
                                        </a> \
                                        <a href="#"> \
                                            <div class="col pc" id="process_copy">复制</div> \
                                        </a> \
                                        <a href="# "> \
                                            <div class="col pc" id="process_del">删除</div> \
                                        </a> \
                                    </div> \
                                </li> ';
            process_li = process_li + lili;
        }
        $("#process_list").html(process_li);
    });
}

// 加载标签和操作
function init_process_opera(tag_types, operas, operas_alias) {
    let tag_type_content =
        "<option value='选择标签类型' selected disabled>选择标签类型</option>";
    for (let i = 0; i < tag_types.length; i++) {
        tag_type_content =
            tag_type_content +
            "<option value=" +
            tag_types[i] +
            ">" +
            tag_types[i] +
            "</option>";
    }
    $(".sel_tag").html(tag_type_content);

    let sel_opera_content =
        "<option value='选择操作' selected disabled>选择操作</option>";
    for (let i = 0; i < operas.length; i++) {
        sel_opera_content +=
            `<option value="${operas[i]}">${operas[i]}(${operas_alias[i]})</option>`;
    }
    $("#sel_opera").html(sel_opera_content);
    $("select").material_select();
}

// 等待
function sleep(s) {
    return new Promise(function (resolve) {
        setTimeout(resolve, s * 1000);
    });
}

// 运行流程事务
async function exec_run(process, tab_id) {
    let args = {};
    for (let i = 0; i < process.length; i++) {
        await sleep(process[i]["wait"]);
        if (process[i].opera === "getvalue") {
            await chrome.tabs.sendMessage(tab_id, {
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
        } else {
            chrome.tabs.executeScript(tab_id, {
                code: jscode(process[i])
            });
        }
    }
}

// 轮播
async function lun_run(process, tab_id, that, save_run) {
    for (let i = 0; i < 100; i++) {
        let tmp = JSON.parse(JSON.stringify(process));
        await exec_run(tmp, tab_id);
    }
    that.html(save_run);
}

// 源码事务运行
function sourcecode_run(sourcecode, sourcecode_url, tab) {
    if (new RegExp(sourcecode_url).test(tab.url)) {
        chrome.tabs.executeScript(tab.id, {
            code: source_jscode(sourcecode)
        });
    }
}

// 获取自定义参数
function process_get_argv(process) {
    keys = [];
    for (let i = 0; i < process.length; i++) {
        let value = process[i].value;
        if (value.startsWith("${") && value.endsWith("}")) {
            let tmp = value.slice(2, -1);
            if (keys.indexOf(tmp) === -1) {
                keys.push(tmp);
            }
        }
    }
    return keys;
}

// 设置自定义参数
function process_set_argv(process, kv) {
    for (let i = 0; i < process.length; i++) {
        let value = process[i].value;
        if (value.startsWith("${") && value.endsWith("}")) {
            let tmp = value.slice(2, -1);
            process[i].value = kv[tmp];
        }
    }
    return process;
}

// 运行
function process_run(process, tab_id, that, save_run) {
    that.html("运行中");
    let bg = chrome.extension.getBackgroundPage();
    bg.exec_run(process, tab_id);
    setTimeout(() => {
        that.html(save_run)
    }, 1000 * process.map(p => p.wait).reduce((a, b) => parseFloat(a) + parseFloat(b)));
}

// 运行前参数设置
function process_argv(process, callback) {
    let argvs = process_get_argv(process);
    if (argvs.length > 0) {
        let tmp = "";
        for (let i = 0; i < argvs.length; i++) {
            tmp +=
                `<div class="input-field col s12">\n` +
                `<input id="argv_${argvs[i]}" type="text" >\n` +
                `<label for="argv_${argvs[i]}">${argvs[i]}</label>\n` +
                "</div>";
        }
        $("#argv_input").html(tmp);
        $("#model3").modal("open");
        $("#argv_submit").click(function () {
            let kv = {};
            for (let i = 0; i < argvs.length; i++) {
                kv[argvs[i]] = $("#argv_" + argvs[i]).val();
            }
            process_set_argv(process, kv);
            callback(process);
        });
    } else {
        callback(process);
    }
}

// 主要
$(document).ready(function () {
    // 操作
    const operas = ["click", "value", "mouseover", "refresh", "pagejump", "newpage", "getvalue"];
    const operas_alias = ["点击", "设值", "鼠标移入", "刷新", "本页跳转", "新开页面", "取值"];
    let case_name = "";
    let edit_prcess_n = -1;
    let init_select = 1;

    get_my_robot(data => {
        if(data[SETTING_DATA] === undefined) {
            data[SETTING_DATA] = {};
            set_my_robot(data)
        }
        if(data[SETTING_DATA]["KEYS"] === undefined) {
            let tmp = [];
            for(let key in data){
                if(data.hasOwnProperty(key) && key !== SETTING_DATA) {
                    tmp.push(key);
                }
            }
            data[SETTING_DATA]["KEYS"] = tmp;
            set_my_robot(data);
        }
        refresh_cases();
        if(data[SETTING_DATA][RECORD_CASE]) {
            case_name = data[SETTING_DATA][RECORD_CASE];
            $("#case_view").hide();
            $("#process_view").show();
            refresh_process(data[SETTING_DATA][RECORD_CASE]);
            $("#add_process_free").hide();
            $("#end_process_free").show();
        }else{
            $("#add_process_free").show();
            $("#end_process_free").hide();
        }
        if(data[SETTING_DATA][WEB_ADD_CASE]) {
            $("#case_view").hide();
            $("#process_view").hide();
            $("#new_process").show();
            $(".chose_tag").hide();
            $(".chose_opera").show();
            init_process_opera(tag_types, operas, operas_alias);
            case_name = data[SETTING_DATA][WEB_ADD_CASE];
            $("#tag_list")
                .css("margin-top", "0px")
                .html(
                    `<div id='seldn' class='collection-item' data="${data[SETTING_DATA][WEB_ADD_EVENT].tag}&${data[SETTING_DATA][WEB_ADD_EVENT].n}">
                        <a href='#' id='hasseled'>已选: ${data[SETTING_DATA][WEB_ADD_EVENT].tag}&${data[SETTING_DATA][WEB_ADD_EVENT].n}</a>
                    </div>`
                );
            data[SETTING_DATA][WEB_ADD_CASE] = undefined;
            set_my_robot(data);
        }
    });

    $(".modal").modal();
    $("#select_case_type").material_select();

    // 点击事务进入流程页
    $("#cases")
        .on("click", ".case_name", function () {
            case_name = $(this).text();
            get_my_robot((my_robot) => {
                if (my_robot[case_name]["case_type"] === "process") {
                    $("#case_view").hide();
                    $("#process_view").show();
                    refresh_process(case_name);
                } else if (my_robot[case_name]["case_type"] === "sourcecode") {
                    $("#case_view").hide();
                    $("#jssourcecode")
                        .val(my_robot[case_name]["case_sourcecode"])
                        .trigger("autoresize");
                    $("#sourcecode_view").show();
                    $("#sourcecode_url").val(my_robot[case_name].sourcecode_url);
                    Materialize.updateTextFields();
                } else {
                    $("#case_view").hide();
                    $("#control_url").val(my_robot[case_name].control_url);
                    $("#control_view").show();
                    Materialize.updateTextFields();
                }
            });
        })
        // 点击删除事务
        .on("click", ".del_case", function () {
            var case_name = $(this).parent().parent().attr("id");
            if (confirm(`确认删除 ${case_name}`)) {
                get_my_robot((my_robot) => {
                    delete my_robot[case_name];
                    my_robot[SETTING_DATA]["KEYS"].splice(my_robot[SETTING_DATA]["KEYS"].indexOf(case_name), 1);
                    set_my_robot(my_robot, refresh_cases);
                });
            }
        })
        // 导出事务
        .on("mousedown", ".export_case", function () {
            let case_name = $(this).parent().parent().attr("id");
            $(this).html("导出成功");
            let that = $(this);
            let clipcontent = "";
            get_my_robot((my_robot) => {
                clipcontent = JSON.stringify(my_robot[case_name]);
                new ClipboardJS(".export_case", {
                    text: function () {
                        return clipcontent;
                    },
                });
            });
            setTimeout(function () {
                that.html("导出");
            }, 1000);
        })
        // 定时运行
        .on("click", ".timer_run", function () {
            case_name = $(this).parent().parent().attr("id");
            $("#timer_run_model").modal("open");
            get_my_robot(my_robot => {
                $("#timer_run_input").val(my_robot[case_name].runtime);
                Materialize.updateTextFields();
            })
        })
        // 受控运行
        .on("click", ".sim_run", function () {
            let case_name = $(this).parent().parent().attr("id");
            get_my_robot((my_robot) => {
                if (my_robot[case_name]["case_type"] === "process") {
                    process_argv(my_robot[case_name]["case_process"], (process) => {
                        connect_client(() => {
                            let bg = chrome.extension.getBackgroundPage();
                            bg.simexecute(process);
                            window.close();
                        });
                    });
                } else {
                    if (!my_robot[case_name]["control_url"]) {
                        alert("受控地址不能为空");
                        return;
                    }
                    connect_client(() => {
                        fetch(local_client_host + "recover/?case_name=" + case_name).then(
                            () => {
                                chrome.tabs.create({
                                    url: my_robot[case_name]["control_url"]
                                });
                                window.close();
                            }
                        );
                    });
                }
            });
        })
        // 源码事务开关注入
        .on("click", ".start_inject", function () {
            let case_name = $(this).parent().parent().attr("id");
            get_my_robot(my_robot => {
                my_robot[case_name]["start_inject"] = !my_robot[case_name]["start_inject"];
                set_my_robot(my_robot);
                refresh_cases();
            })
        }).on("click", ".moveup_case", function () {
            let case_name = $(this).parent().parent().attr("id");
            get_my_robot((my_robot) => {
                let idx = my_robot[SETTING_DATA]["KEYS"].indexOf(case_name);
                if(idx !== -1 && idx > 0) {
                    let tmp = my_robot[SETTING_DATA]["KEYS"][idx-1];
                    my_robot[SETTING_DATA]["KEYS"][idx-1] = my_robot[SETTING_DATA]["KEYS"][idx];
                    my_robot[SETTING_DATA]["KEYS"][idx] = tmp;
                }
                set_my_robot(my_robot, refresh_cases);
            });
        }).on("click", ".rename_case", function () {
            case_name = $(this).parent().parent().attr("id");
            $("#rename-case-modal").modal("open");
    });

    $("#input_new_case_name").click(function () {
        get_my_robot(my_robot => {
            let tmp = $("#new_case_name").val();
            let idx = my_robot[SETTING_DATA]["KEYS"].indexOf(case_name);
            if(tmp && tmp !== case_name) {
                my_robot[tmp] = my_robot[case_name];
                my_robot[SETTING_DATA]["KEYS"][idx] = tmp;
                delete my_robot[case_name];
            }
            set_my_robot(my_robot, refresh_cases);
        })

    });

    // 点击删除一个事件
    $("#process_list").on("click", "#process_del", function () {
        let processs_n = parseInt(
            $(this).parent().parent().parent().attr("id").split("-")[1]
        );
        get_my_robot((my_robot) => {
            my_robot[case_name]["case_process"].splice(processs_n, 1);
            set_my_robot(my_robot, function () {
                refresh_process(case_name);
            });
        });
    });

    // 添加事务
    $("#add_case").click(function () {
        var new_case_name = $("#case_name_input").val();
        get_my_robot((my_robot) => {
            if (my_robot[new_case_name] != null) {
                alert("事务名已存在");
                return;
            }
            my_robot[new_case_name] = {
                case_name: new_case_name,
                case_type: $("#select_case_type").val(),
                case_process: [],
                case_sourcecode: "",
                control_url: "",
                sourcecode_url: ".*",
            };
            my_robot[SETTING_DATA]["KEYS"].push(new_case_name);
            set_my_robot(my_robot, refresh_cases);
        });
    });

    // 导入事务
    $("#inport_case").click(function () {
        try {
            let case_content = JSON.parse($("#inport_case_input").val());
            get_my_robot((my_robot) => {
                if (my_robot[case_content["case_name"]] != null) {
                    alert("事务名已存在");
                    return;
                }
                my_robot[case_content["case_name"]] = case_content;
                my_robot[SETTING_DATA]["KEYS"].push(case_content["case_name"]);
                set_my_robot(my_robot, refresh_cases);
            });
        } catch {
            alert("添加失败");
        }
    });

    // 返回主页
    $("#case_back,#process_back").click(function () {
        $("#case_view").show();
        $("#process_view").hide();
        $("#new_process").hide();
    });

    $(".source_back").click(function () {
        $("#case_view").show();
        $("#sourcecode_view").hide();
        $("#control_view").hide();
    });

    // 添加流程
    $("#add_process").click(function () {
        $("body").css("width", "150px");
        $("#process_view").hide();
        $("#new_process").show();
        $(".chose_tag").show();
        $(".chose_opera").hide();
        $(".tag_select").css("margin-top", "40px");
        $("#tag_list").css("margin-top", "-20px");
        if (init_select === 1) {
            init_process_opera(tag_types, operas, operas_alias);
            init_select = 0;
        }
    });

    // 设置定时运行
    $("#submit_timer_run").click(function () {
        get_my_robot(my_robot => {
            my_robot[case_name]["runtime"] = $("#timer_run_input").val();
            my_robot[case_name]["last_runtime"] = new Date().getTime() - 24 * 60 * 60 * 1000;
            set_my_robot(my_robot);
        })
    });

    // 筛选html标签
    $(".sel_tag").change(function () {
        var selected_tag = $(this).val();
        if (selected_tag === tag_types[0]) {
            $(".chose_class_id").show();
            $("#tag_list").html("");
            return;
        } else {
            $(".chose_class_id").hide();
        }
        connect((port) => {
            port.postMessage({
                type: "search_tag",
                tag: selected_tag,
            });
            port.onMessage.addListener(function (msg) {
                if (msg.type === "search_tag") {
                    let options = "";
                    for (let i = 0; i < msg.num.length; i++) {
                        let value = selected_tag + "&" + msg.num[i];
                        options += `<a href='#' class='collection-item tag_spec'>${value}</a>`;
                    }
                    $("#tag_list").html(options);
                    $(".tag_spec").mouseover(function () {
                        port.postMessage({
                            type: "select_tag",
                            tag: selected_tag,
                            n: parseInt($(this).text().split("&")[1]),
                        });
                    });
                }
            });
        });
    });

    // 筛选class和id
    $(".select_class_id").change(function () {
        let select_class_id = $(this).val();
        connect((port) => {
            port.postMessage({
                type: "search_class_id",
                content: select_class_id,
            });
            port.onMessage.addListener(function (msg) {
                if (msg.type === "search_class_id") {
                    let options = "";
                    for (let i = 0; i < msg.num.length; i++) {
                        let value = select_class_id + "&" + msg.num[i];
                        options =
                            options +
                            "<a href='#' class='collection-item tag_spec'>" +
                            value +
                            "</a>";
                    }
                    $("#tag_list").html(options);
                    $(".tag_spec").mouseover(function () {
                        port.postMessage({
                            type: "select_class_id",
                            content: $(this).text().split("&")[0],
                            n: parseInt($(this).text().split("&")[1]),
                        });
                    });
                }
            });
        });
    });

    // 自由筛选器
    $(".query_selecter").change(function () {
        let selecter = $(this).val();
        connect((port) => {
            port.postMessage({
                type: "search_query_selecter",
                content: selecter,
            });
            port.onMessage.addListener(function (msg) {
                if (msg.type === "search_query_selecter") {
                    let options = "";
                    for (let i = 0; i < msg.num.length; i++) {
                        let value = selecter + "&" + msg.num[i];
                        options =
                            options +
                            "<a href='#' class='collection-item tag_spec'>" +
                            value +
                            "</a>";
                    }
                    $("#tag_list").html(options);
                    $(".tag_spec").mouseover(function () {
                        port.postMessage({
                            type: "select_query_selecter",
                            content: $(this).text().split("&")[0],
                            n: parseInt($(this).text().split("&")[1]),
                        });
                    });
                }
            });
        });
    });

    // 选择一个筛选后的元素
    $("#tag_list")
        .on("click", ".tag_spec", function () {
            $("body").css("width", "250px");
            $(".tag_select").css("margin-top", "0px");
            $("#tag_list")
                .css("margin-top", "0px")
                .html(
                    `<div id='seldn' class='collection-item' data="${$(this).text()}">
                        <a href='#' id='hasseled'>已选: ${$(this).text()}</a>
                    </div>`
                );
            $(".chose_tag").hide();
            $(".chose_opera").show();
            $(".chose_class_id").hide();
        })
        // 返回到筛选器
        .on("click", "#hasseled", function () {
            $(".chose_tag").show();
            $(".chose_opera").hide();
            $("body").css("width", "150px");
            $(".tag_select").css("margin-top", "40px");
            $("#tag_list").css("margin-top", "-20px")
                .html(`<a href='#' class='collection-item tag_spec'>${$("#seldn").attr("data")}</a>`);
            $(".tag_spec").mouseover(function () {
                connect(port => {
                    port.postMessage({
                        type: "select_query_selecter",
                        content: $(this).text().split("&")[0],
                        n: parseInt($(this).text().split("&")[1]),
                    });
                })
            });
        });

    // 设置设值显隐
    $("#sel_opera").change(function () {
        if ($(this).val() === "value" || $(this).val() === "pagejump"
            || $(this).val() === "getvalue" || $(this).val() === "newpage") {
            $("#set_value").show();
        } else {
            $("#set_value").hide();
        }
    });

    // 添加 / 保存 流程
    $("#process_add").click(function () {
        let data = $("#seldn").attr("data").split("&");
        let process_data = {
            tag: data[0],
            n: data[1],
            opera: $("#sel_opera").val(),
            value: $("#ssv").val(),
            wait: $("#num_wait").val(),
        };
        get_my_robot((my_robot) => {
            if ($(this).text() === "保存") {
                my_robot[case_name]["case_process"][edit_prcess_n] = process_data;
                $(this).text("添加");
                edit_prcess_n = -1;
            } else {
                my_robot[case_name]["case_process"].push(process_data);
            }
            set_my_robot(my_robot);
            refresh_process(case_name);
            $("#new_process").hide();
            $("#process_view").show();
        });
    });

    // 修改源码事务
    $("#edit_source").click(function () {
        get_my_robot((my_robot) => {
            my_robot[case_name].case_sourcecode = $("#jssourcecode").val();
            my_robot[case_name].sourcecode_url = $("#sourcecode_url").val();
            set_my_robot(my_robot);
            $("#case_view").show();
            $("#sourcecode_view").hide();
        });
    });

    // 修改受控事务地址
    $("#edit_control_url").click(function () {
        get_my_robot((my_robot) => {
            my_robot[case_name]["control_url"] = $("#control_url").val();
            set_my_robot(my_robot);
            $("#case_view").show();
            $("#control_view").hide();
        });
    });

    // 受控事务录制事件
    $("#record_opera").click(function () {
        if (confirm("确认开始录制？按ESC结束录制")) {
            get_my_robot((my_robot) => {
                my_robot[case_name]["control_url"] = $("#control_url").val();
                set_my_robot(my_robot);
                connect_client(() => {
                    fetch(local_client_host + "record/?case_name=" + case_name).then(
                        function () {
                            chrome.tabs.create({
                                url: $("#control_url").val()
                            });
                            window.close();
                        }
                    );
                });
            });
        }
    });

    // $("#add_process_free").click(function () {
    //     connect((port) => {
    //         port.postMessage({
    //             type: "add_event",
    //             case_name: case_name,
    //         });
    //         window.close();
    //     });
    // });

    $("#add_process_free").click(function () {
        if(confirm("页面录制仅支持点击/英文设值事件，点击确认开始录制")){
            exectab(function (tab_id) {
                chrome.tabs.sendMessage(tab_id, {
                    type: "start_recording",
                    case_name: case_name,
                });
                get_my_robot(data => {
                    data[SETTING_DATA][RECORD_CASE] = case_name;
                    set_my_robot(data, () => window.close());
                })
            });
        }
    });

    $("#end_process_free").click(function () {
        exectab(function (tab_id) {
            chrome.tabs.sendMessage(tab_id, {
                type: "end_recording",
            });
            get_my_robot(data => {
                data[SETTING_DATA][RECORD_CASE] = undefined;
                set_my_robot(data);
            })
        })
    });

    $("#add_process_web").click(function () {
        exectab(tab_id => {
            chrome.tabs.sendMessage(tab_id, {
                type: "direct_add_event",
                case_name: case_name,
            });
            window.close();
        });
    });

    // 连接当前页面
    exectab((tab_id, tab) => {
        // 添加过程测试运行
        $("#test_run").click(function () {
            let data = $("#seldn").attr("data").split("&");
            process_data = {
                tag: data[0],
                n: data[1],
                opera: $("#sel_opera").val(),
                value: $("#ssv").val(),
            };
            chrome.tabs.executeScript(tab_id, {
                code: jscode(process_data)
            });
        });

        // 流程页测试运行
        $("#process_list")
            .on("click", "#process_test_run", function () {
                let processs_n = parseInt(
                    $(this).parent().parent().parent().attr("id").split("-")[1]
                );
                get_my_robot((my_robot) => {
                    chrome.tabs.executeScript(tab_id, {
                        code: jscode(my_robot[case_name]["case_process"][processs_n]),
                    });
                });
            })
            // 编辑单个流程事件
            .on("click", "#process_edit", function () {
                let processs_n = parseInt(
                    $(this).parent().parent().parent().attr("id").split("-")[1]
                );
                edit_prcess_n = processs_n;
                $("#process_view").hide();
                $("#new_process").show();
                $(".chose_opera").show();
                $(".chose_tag").hide();
                $(".chose_class_id").hide();
                if (init_select === 1) {
                    init_process_opera(tag_types, operas, operas_alias);
                    init_select = 0;
                }
                $(".tag_select").css("margin-top", "0px");
                get_my_robot((my_robot) => {
                    let the_process = my_robot[case_name]["case_process"][processs_n];
                    let select_tag = `${the_process.tag}&${the_process.n}`;
                    if (the_process.value) {
                        $("#set_value").show();
                    } else {
                        $("#set_value").hide();
                    }
                    $("#ssv").val(the_process.value);
                    $("#sel_opera").val(the_process.opera);
                    $("#sel_opera option").attr("selected", false);
                    $(`#sel_opera option[value='${the_process.opera}']`).attr(
                        "selected",
                        true
                    );
                    $("select").material_select();
                    $("#num_wait").val(the_process.wait);
                    $("#process_add").text("保存");
                    $("#tag_list").html(
                        `<div id='seldn' class='collection-item' data="${select_tag}"><a href='#' id='hasseled'>已选: ${select_tag}</a></div>`
                    );
                });
            })
            // 事件上移
            .on("click", "#process_move", function () {
                let processs_n = parseInt(
                    $(this).parent().parent().parent().attr("id").split("-")[1]
                );
                get_my_robot((my_robot) => {
                    if (processs_n > 0) {
                        let tmp = my_robot[case_name]["case_process"][processs_n - 1];
                        my_robot[case_name]["case_process"][processs_n - 1] =
                            my_robot[case_name]["case_process"][processs_n];
                        my_robot[case_name]["case_process"][processs_n] = tmp;
                    }
                    set_my_robot(my_robot);
                    refresh_process(case_name);
                });
            })
            // 事件拷贝
            .on("click", "#process_copy", function () {
                let processs_n = parseInt(
                    $(this).parent().parent().parent().attr("id").split("-")[1]
                );
                get_my_robot((my_robot) => {
                    let tmp = my_robot[case_name]["case_process"][processs_n];
                    my_robot[case_name]["case_process"].splice(processs_n, 0, tmp);
                    set_my_robot(my_robot);
                    refresh_process(case_name);
                });
            });

        // 运行事务，调用background
        $("#cases")
            .on("click", ".run_case", function () {
                var case_name = $(this).parent().parent().attr("id");
                var save_run = $(this).parent().html();
                var that = $(this).parent();
                get_my_robot((my_robot) => {
                    if (my_robot[case_name]["case_type"] === "process") {
                        process_argv(my_robot[case_name]["case_process"], (process) => {
                            process_run(process, tab_id, that, save_run);
                        });
                    } else if (my_robot[case_name]["case_type"] === "sourcecode") {
                        that.html("运行中");
                        sourcecode_run(my_robot[case_name].case_sourcecode, my_robot[case_name].sourcecode_url, tab);
                        setTimeout(function () {
                            that.html(save_run);
                        }, 1000);
                    }
                });
            })
            // 轮播事务
            .on("click", ".lun_case", function () {
                var case_name = $(this).parent().parent().attr("id");
                var save_run = $(this).parent().html();
                var that = $(this).parent();
                that.html("运行中");
                get_my_robot((my_robot) => {
                    if (my_robot[case_name]["case_type"] === "process") {
                        process_argv(my_robot[case_name]["case_process"], (process) => {
                            lun_run(process, tab_id, that, save_run);
                        });
                    } else {
                        that.html("源码模式不支持轮播");
                        setTimeout(function () {
                            that.html(save_run);
                        }, 1000);
                    }
                });
            });
    });
});


chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.type === "ADD_EVENT") {
        get_my_robot(data => {
            data[msg.case_name].case_process = data[msg.case_name].case_process.concat(msg.data);
            set_my_robot(data, () => refresh_process(msg.case_name));
        })
    }
});