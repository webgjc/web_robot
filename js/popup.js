// 获取数据存储
function get_my_robot(callback) {
    chrome.storage.local.get(["my_robot"], function(res) {
        if (callback) callback(res.my_robot)
    })
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
        case_type(事务类型): "prcess(流程事务)/sourcecode(源码事务)"
    },
}
*/

// 设置数据存储
function set_my_robot(new_robot, callback) {
    chrome.storage.local.set({ "my_robot": new_robot }, function() {
        if (callback) callback()
    })
}

// 连接
function connect(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var port = chrome.tabs.connect(tabs[0].id, { name: "robot" });
        callback(port)
    })
}

// 当前tab执行
function exectab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        callback(tabs[0].id)
    })
}


// 拼接要执行的js代码
function jscode(process) {
    let exec_code = "(function(){ \n";
    if(process["tag"].startsWith(".")) {
        exec_code += 'var robot_node = document.getElementsByClassName("' + process["tag"].substring(1) + '")[' + process["n"] + '];'
    }else if(process["tag"].startsWith("#")) {
        exec_code += 'var robot_node = document.getElementById("' + process["tag"].substring(1) + '");'
    }else{
        exec_code += 'var robot_node = document.getElementsByTagName("' + process["tag"] + '")[' + process["n"] + '];'
    }
    if (process["opera"] == "click") {
        exec_code += "robot_node.click();"
    } else if (process["opera"] == "value") {
        /**
         * 为react兼容
         */
        exec_code += "let lastValue = robot_node.value;"
        exec_code += "robot_node.value=\"" + process["value"] + "\";";
        exec_code += "let event = new Event('input', { bubbles: true });";
        exec_code += "event.simulated = true;";
        exec_code += "let tracker = robot_node._valueTracker;";
        exec_code += "if (tracker) { tracker.setValue(lastValue); }\n";
        exec_code += "robot_node.dispatchEvent(event);";
    } else if (process["opera"] == "refresh") {
        exec_code += "window.location.reload();";
    } else if (process["opera"] == "pagejump") {
        exec_code += "window.location.href=\"" + process["value"] + "\";";
    }
    exec_code += "\n})();";
    return exec_code;
}

function source_jscode(sourcecode) {
    let exec_code = "(function(){ \n";
    exec_code += sourcecode;
    exec_code += "\n})();";
    return exec_code;
}

// 根据存储数据更新主页
function refresh_cases() {
    get_my_robot(my_robot => {
        if (my_robot == undefined) {
            set_my_robot({})
        } else {
            var cases = "";
            for (let i in my_robot) {
                let tr = '<tr id=' + i + '> \
                            <td> \
                                <a href="#" class="case_name">' + i + '</a> \
                            </td> \
                            <td> \
                                <a href="#" class="run_case">运行</a> \
                                <a href="#" class="sim_run">受控运行</a>\
                                <a href="#" class="del_case">删除</a> \
                                <a href="#" class="lun_case">轮播</a> \
                                <a href="#" class="export_case">导出</a> \
                            </td> \
                        </tr>';
                cases = cases + tr;
            }
            $("#cases").html(cases);
        }
    })
    // new ClipboardJS('.export_case');
}


// 更新单个事务的流程
function refresh_process(case_name) {
    get_my_robot(my_robot => {
        var data = my_robot[case_name]["case_process"];
        var process_li = "";
        for (let i = 0; i < data.length; i++) {
            let lili = '<li class="collection-item" id="process-' + i + '"> \
                            <div class="row "> \
                                <div class="col s6 ">标签：' + data[i]["tag"] + '</div> \
                                <div class="col s6 ">#：' + data[i]["n"] + '</div> \
                            </div> \
                            <div class="row "> \
                                <div class="col s6 ">操作：' + data[i]["opera"] + '</div> \
                                <div class="col s6 ">等待：' + data[i]["wait"] + '秒</div> \
                            </div> \
                            <div class="row "> \
                                <div class="col s12 ">赋值：' + data[i]["value"] + '</div> \
                            </div> \
                            <div class="row "> \
                                <a href="# "> \
                                    <div class="col s6" id="process_test_run" >test</div> \
                                </a> \
                                <a href="# "> \
                                    <div class="col s6 " id="process_del">删除</div> \
                                </a> \
                            </div> \
                        </li> ';
            process_li = process_li + lili;
        }
        $("#process_list").html(process_li);
    })
}

// 主要
$(document).ready(function() {

    // 筛选器
    var tag_types = ["class/id选择器", "a", "body", "button", "div", "i", "img", "input", "li", "p", "span", "td", "textarea", "tr", "ul", "h1", "h2", "h3", "h4", "h5"];
    // 操作
    var operas = ["click", "value", "refresh", "pagejump"];
    var case_name = "";
    var init_select = 1;

    refresh_cases();

    $('.modal').modal();
    $("#select_case_type").material_select();

    // 点击事务进入流程页
    $("#cases").on("click", ".case_name", function() {
        case_name = $(this).text();
        get_my_robot(my_robot => {
            if(my_robot[case_name]["case_type"] == "process") {
                $("#case_view").hide();
                $("#process_view").show();
                refresh_process(case_name);
            }else{
                $("#case_view").hide();
                $("#jssourcecode").val(my_robot[case_name]["case_sourcecode"]);
                $('#jssourcecode').trigger('autoresize');
                $("#sourcecode_view").show();
                Materialize.updateTextFields();
            }
        })
    })

    // 点击删除事务
    $("#cases").on("click", ".del_case", function() {
        var case_name = $(this).parent().parent().attr("id");
        get_my_robot(my_robot => {
            delete(my_robot[case_name]);
            set_my_robot(my_robot, refresh_cases);
        })
    })

    // 点击删除一个事件
    $("#process_list").on("click", "#process_del", function() {
        var processs_n = parseInt($(this).parent().parent().parent().attr("id").split("-")[1]);
        get_my_robot(my_robot => {
            my_robot[case_name]["case_process"].splice(processs_n, 1);
            set_my_robot(my_robot, function() {
                refresh_process(case_name);
            })
        })
    });

    // 添加事务
    $("#add_case").click(function() {
        var new_case_name = $("#case_name_input").val();
        get_my_robot(my_robot => {
            if(my_robot[new_case_name] != null) {
                alert("事务名已存在");
                return;
            }
            my_robot[new_case_name] = {
                "case_name": new_case_name,
                "case_type": $("#select_case_type").val(),
                "case_process": [],
                "case_sourcecode": ""
            };
            set_my_robot(my_robot, refresh_cases);
        });
    });

    // 导入事务
    $("#inport_case").click(function() {
        try{
            let case_content = JSON.parse($("#inport_case_input").val());
            get_my_robot(my_robot => {
                if(my_robot[case_content["case_name"]] != null) {
                    alert("事务名已存在");
                    return;
                }
                my_robot[case_content["case_name"]] = case_content;
                set_my_robot(my_robot, refresh_cases);
            })
        }catch{
            alert("添加失败");
        }
    });

    // 返回主页
    $("#case_back").click(function() {
        $("#case_view").show();
        $("#process_view").hide();
    });

    $("#source_back").click(function() {
        $("#case_view").show();
        $("#sourcecode_view").hide();
    });

    // 添加流程
    $("#add_process").click(function() {
        $("body").css("width", "150px");
        $("#process_view").hide();
        $("#new_process").show();
        $(".chose_tag").show();
        $(".chose_opera").hide();
        $("#tag_list").css("margin-top", "-20px");
        if (init_select == 1) {
            let tag_type_content = "<option value='选择标签类型' selected disabled>选择标签类型</option>";
            for (let i = 0; i < tag_types.length; i++) {
                tag_type_content = tag_type_content + "<option value=" + tag_types[i] + ">" + tag_types[i] + "</option>";
            }
            $(".sel_tag").html(tag_type_content);

            let sel_opera_content = "<option value='选择操作' selected disabled>选择操作</option>";
            for (let i = 0; i < operas.length; i++) {
                sel_opera_content = sel_opera_content + "<option value=" + operas[i] + ">" + operas[i] + "</option>";
            }
            $("#sel_opera").html(sel_opera_content);
            $("select").material_select();
            init_select = 0;
        }
    });

    // 筛选html标签
    $(".sel_tag").change(function() {
        var selected_tag = $(this).val();
        if(selected_tag == "class/id选择器") {
            $(".chose_class_id").show();
            $("#tag_list").html("");
            return;
        }else{
            $(".chose_class_id").hide();
        }
        connect(port => {
            port.postMessage({
                type: "search_tag",
                tag: selected_tag
            });
            port.onMessage.addListener(function(msg) {
                if (msg.type = "search_tag") {
                    let options = "";
                    for (let i = 0; i < msg.num.length; i++) {
                        let value = selected_tag + "&" + msg.num[i];
                        options = options + "<a href='#' class='collection-item tag_spec'>" + value + "</a>";
                    }
                    $("#tag_list").html(options);
                    $(".tag_spec").mouseover(function(e) {
                        port.postMessage({
                            type: "select_tag",
                            tag: selected_tag,
                            n: parseInt($(this).text().split("&")[1])
                        });
                    })
                }
            })
        })
    })

    // 筛选class和id
    $(".select_class_id").change(function() {
        var select_class_id = $(this).val();
        connect(port => {
            port.postMessage({
                type: "search_class_id",
                content: select_class_id
            });
            port.onMessage.addListener(function(msg) {
                if (msg.type == "search_class_id") {
                    let options = "";
                    for (let i = 0; i < msg.num.length; i++) {
                        let value = select_class_id + "&" + msg.num[i];
                        options = options + "<a href='#' class='collection-item tag_spec'>" + value + "</a>";
                    }
                    $("#tag_list").html(options);
                    $(".tag_spec").mouseover(function(e) {
                        port.postMessage({
                            type: "select_class_id",
                            content: $(this).text().split("&")[0],
                            n: parseInt($(this).text().split("&")[1])
                        });
                    })
                }
            })
        })
    })

    // 选择一个筛选后的元素
    $("#tag_list").on("click", ".tag_spec", function(e) {
        $("body").css("width", "250px");
        $("#tag_list").css("margin-top", "0px");
        $("#tag_list").html("<div id='seldn' class='collection-item' data=" + $(this).text() + "><a href='#' id='hasseled'>已选: " + $(this).text() + "</a></div>");
        $(".chose_tag").hide();
        $(".chose_opera").show();
        $(".chose_class_id").hide();
    })

    // 返回到筛选器
    $("#tag_list").on("click", "#hasseled", function(e) {
        $(".chose_tag").show();
        $(".chose_opera").hide();
        $("body").css("width", "150px");
        $("#tag_list").css("margin-top", "-20px");
    })

    $("#sel_opera").change(function() {
        if ($(this).val() == "value" || $(this).val() == "pagejump") {
            $("#set_value").show();
        } else {
            $("#set_value").hide();
        }
    })

    // 添加流程
    $("#process_add").click(function() {
        let data = $("#seldn").attr("data").split("&");
        process_data = {
            "tag": data[0],
            "n": data[1],
            "opera": $("#sel_opera").val(),
            "value": $("#ssv").val(),
            "wait": $("#num_wait").val()
        };
        get_my_robot(my_robot => {
            my_robot[case_name]["case_process"].push(process_data);
            set_my_robot(my_robot);
            refresh_process(case_name);
            $("#new_process").hide();
            $("#process_view").show();
        })
    })

    $("#edit_source").click(function() {
        get_my_robot(my_robot => {
            my_robot[case_name]["case_sourcecode"] = $("#jssourcecode").val();
            set_my_robot(my_robot);
            $("#case_view").show();
            $("#sourcecode_view").hide();
        })
    })

    // 导出事务
    $("#cases").on("mousedown", ".export_case", function() {
        var case_name = $(this).parent().parent().attr("id");
        $(this).html("导出成功");
        var that = $(this);
        var clipcontent = "";
        get_my_robot(my_robot => {
            clipcontent = JSON.stringify(my_robot[case_name]);
            new ClipboardJS('.export_case', {
                text: function(trigger) {
                    return clipcontent;
                }
            });  
        })
        setTimeout(function() {
            that.html("导出");
        }, 1000);
    })

    $("#cases").on("click", ".sim_run", function() {
        var case_name = $(this).parent().parent().attr("id");
        get_my_robot(my_robot => {
            var bg = chrome.extension.getBackgroundPage();
            bg.simexecute(my_robot[case_name]["case_process"]);
            window.close();
        })
    });

    // 连接当前页面
    exectab(tab_id => {
        
        // 添加过程测试运行
        $("#test_run").click(function() {
            let data = $("#seldn").attr("data").split("&");
            process_data = {
                "tag": data[0],
                "n": data[1],
                "opera": $("#sel_opera").val(),
                "value": $("#ssv").val()
            };
            chrome.tabs.executeScript(tab_id, { code: jscode(process_data) });
        })

        // 流程页测试运行
        $("#process_list").on("click", "#process_test_run", function() {
            var processs_n = parseInt($(this).parent().parent().parent().attr("id").split("-")[1]);
            get_my_robot(my_robot => {
                chrome.tabs.executeScript(tab_id, { code: jscode(my_robot[case_name]["case_process"][processs_n]) });
            })
        })

        // 运行事务，调用background
        $("#cases").on("click", ".run_case", function() {
            var case_name = $(this).parent().parent().attr("id");
            var save_run = $(this).parent().html();
            var that = $(this).parent();
            that.html("运行中");
            get_my_robot(my_robot => {
                if(my_robot[case_name]["case_type"] === "process") {
                    var bg = chrome.extension.getBackgroundPage();
                    bg.execute(my_robot[case_name]["case_process"], tab_id);
                    var process_wait = 0;
                    for (let i = 0; i < my_robot[case_name]["case_process"].length; i++) {
                        process_wait = process_wait + my_robot[case_name]["case_process"][i]["wait"] * 1000;
                    }
                    setTimeout(function() {
                        that.html(save_run);
                    }, process_wait)
                }else{
                    chrome.tabs.executeScript(tab_id, {code: source_jscode(my_robot[case_name]["case_sourcecode"])})
                    setTimeout(function() {
                        that.html(save_run);
                    }, 1000)
                }
            })
        })

        // 轮播事务
        $("#cases").on("click", ".lun_case", function() {
            var case_name = $(this).parent().parent().attr("id");
            var save_run = $(this).parent().html();
            var that = $(this).parent();
            that.html("运行中");
            get_my_robot(my_robot => {
                if(my_robot[case_name]["case_type"] === "process") {
                    var process_wait = 0;
                    for (let n = 0; n < 100; n++) {
                        for (let i = 0; i < my_robot[case_name]["case_process"].length; i++) {
                            process_wait = process_wait + my_robot[case_name]["case_process"][i]["wait"] * 1000;
                            setTimeout(function() {
                                chrome.tabs.executeScript(tab_id, { code: jscode(my_robot[case_name]["case_process"][i]) });
                            }, process_wait);
                        }
                    }
                    setTimeout(function() {
                        that.html(save_run);
                    }, process_wait);
                }else{
                    that.html("源码模式不支持轮播");
                    setTimeout(function() {
                        that.html(save_run);
                    }, 1000);
                }
            })
        })

    })
})