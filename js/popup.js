function get_my_robot(callback) {
    chrome.storage.local.get(["my_robot"], function(res) {
        if (callback) callback(res.my_robot)
    })
}


function set_my_robot(new_robot, callback) {
    chrome.storage.local.set({ "my_robot": new_robot }, function() {
        if (callback) callback()
    })
}


function connect(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var port = chrome.tabs.connect(tabs[0].id, { name: "robot" });
        callback(port)
    })
}


function exectab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        callback(tabs[0].id)
    })
}


function jscode(process) {
    let exec_code;
    if(process["tag"].startsWith(".")) {
        exec_code = 'var robot_node = document.getElementsByClassName("' + process["tag"].substring(1) + '")[' + process["n"] + '];'
    }else if(process["tag"].startsWith("#")) {
        exec_code = 'var robot_node = document.getElementById("' + process["tag"].substring(1) + '")[' + process["n"] + '];'
    }else{
        exec_code = 'var robot_node = document.getElementsByTagName("' + process["tag"] + '")[' + process["n"] + '];'
    }
    if (process["opera"] == "click") {
        exec_code = exec_code + "robot_node.click();"
    } else if (process["opera"] == "value") {
        exec_code = exec_code + "robot_node.value=\"" + process["value"] + "\";";
    } else if (process["opera"] == "refresh") {
        exec_code = exec_code + "window.location.reload();";
    } else if (process["opera"] == "pagejump") {
        exec_code = exec_code + "window.location.href=\"" + process["value"] + "\";";
    }
    console.log(exec_code);
    return exec_code;
}


function refresh_cases() {
    get_my_robot(my_robot => {
        if (my_robot == undefined) {
            set_my_robot({})
        } else {
            var cases = "";
            for (let i in my_robot) {
                let one_case = {}
                one_case["case_name"] = i;
                one_case["content"] = my_robot[i];
                let tr = '<tr id=' + i + '> \
                            <td> \
                                <a href="#" class="case_name">' + i + '</a> \
                            </td> \
                            <td> \
                                <a href="#" class="run_case">运行</a> \
                                <a href="#" class="del_case">删除</a> \
                                <a href="#" class="lun_case">轮播</a> \
                                <a href="#" class="export_case" data-clipboard-text=' + JSON.stringify(one_case) + '>导出</a> \
                            </td> \
                        </tr>';
                cases = cases + tr;
            }
            $("#cases").html(cases);
        }
    })
    new ClipboardJS('.export_case');
}

function refresh_process(case_name) {
    get_my_robot(my_robot => {
        var data = my_robot[case_name];
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

$(document).ready(function() {

    var tag_types = ["class/id选择器", "a", "body", "button", "div", "i", "img", "input", "li", "p", "span", "td", "textarea", "tr", "ul", "h1", "h2", "h3", "h4", "h5"];
    var operas = ["click", "value", "refresh", "pagejump"];
    var case_name = "";
    var init_select = 1;

    refresh_cases();

    $('.modal').modal();

    $("#cases").on("click", ".case_name", function() {
        $("#case_view").hide();
        $("#process_view").show();
        case_name = $(this).text();
        refresh_process(case_name);
    })

    $("#cases").on("click", ".del_case", function() {
        var case_name = $(this).parent().parent().attr("id")
        get_my_robot(my_robot => {
            delete(my_robot[case_name]);
            set_my_robot(my_robot, refresh_cases);
        })
    })

    $("#process_list").on("click", "#process_del", function() {
        var processs_n = parseInt($(this).parent().parent().parent().attr("id").split("-")[1]);
        get_my_robot(my_robot => {
            my_robot[case_name].splice(processs_n, 1);
            set_my_robot(my_robot, function() {
                refresh_process(case_name);
            })
        })
    })

    $("#add_case").click(function() {
        var new_case_name = $("#case_name_input").val();
        get_my_robot(my_robot => {
            if(my_robot[new_case_name] != null) {
                alert("事务名已存在");
                return;
            }
            my_robot[new_case_name] = [];
            set_my_robot(my_robot, refresh_cases);
        });
    });

    $("#inport_case").click(function() {
        try{
            let case_content = JSON.parse($("#inport_case_input").val());
            get_my_robot(my_robot => {
                if(my_robot[case_content["case_name"]] != null) {
                    alert("事务名已存在");
                    return;
                }
                my_robot[case_content["case_name"]] = case_content["content"];
                console.log(my_robot);
                set_my_robot(my_robot, refresh_cases);
            })
        }catch{
            alert("添加失败");
        }
    })

    $("#case_back").click(function() {
        $("#case_view").show();
        $("#process_view").hide();
    })

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

    $("#tag_list").on("click", ".tag_spec", function(e) {
        $("body").css("width", "250px");
        $("#tag_list").css("margin-top", "0px");
        $("#tag_list").html("<div id='seldn' class='collection-item' data=" + $(this).text() + "><a href='#' id='hasseled'>已选: " + $(this).text() + "</a></div>");
        $(".chose_tag").hide();
        $(".chose_opera").show();
        $(".chose_class_id").hide();
    })

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

    exectab(tab_id => {

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
                my_robot[case_name].push(process_data);
                set_my_robot(my_robot);
                refresh_process(case_name);
                $("#new_process").hide();
                $("#process_view").show();
            })
        })

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

        $("#process_list").on("click", "#process_test_run", function() {
            var processs_n = parseInt($(this).parent().parent().parent().attr("id").split("-")[1]);
            get_my_robot(my_robot => {
                chrome.tabs.executeScript(tab_id, { code: jscode(my_robot[case_name][processs_n]) });
            })
        })

        $("#cases").on("click", ".run_case", function() {
            var case_name = $(this).parent().parent().attr("id");
            var save_run = $(this).parent().html();
            var that = $(this).parent();
            that.html("运行中");
            get_my_robot(my_robot => {
                var bg = chrome.extension.getBackgroundPage();
                bg.execute(my_robot[case_name], tab_id);
                var process_wait = 0;
                for (let i = 0; i < my_robot[case_name].length; i++) {
                    process_wait = process_wait + my_robot[case_name][i]["wait"] * 1000;
                }
                setTimeout(function() {
                    that.html(save_run);
                }, process_wait)
            })
        })

        $("#cases").on("click", ".lun_case", function() {
            var case_name = $(this).parent().parent().attr("id");
            var save_run = $(this).parent().html();
            var that = $(this).parent();
            that.html("运行中");
            get_my_robot(my_robot => {
                var process_wait = 0;
                for (let n = 0; n < 100; n++) {
                    for (let i = 0; i < my_robot[case_name].length; i++) {
                        process_wait = process_wait + my_robot[case_name][i]["wait"] * 1000;
                        setTimeout(function() {
                            chrome.tabs.executeScript(tab_id, { code: jscode(my_robot[case_name][i]) });
                        }, process_wait);
                    }
                }
                setTimeout(function() {
                    that.html(save_run);
                }, process_wait);
            })
        })

        $("#cases").on("click", ".export_case", function() {
            $(this).html("导出成功");
            var that = $(this);
            setTimeout(function() {
                that.html("导出");
            }, 1000);
        })

    })
})