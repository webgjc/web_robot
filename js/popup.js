// $("#new_tab").click(function(e) {
//     chrome.tabs.create({ url: 'https://www.baidu.com/' }, function(tab) {
//         chrome.storage.local.set({ "robot_tab": tab.id })
//     })
// })


// function load_process() {
//     chrome.storage.local.get(["robot_process"], function(res) {
//         if (res.robot_process == undefined) {
//             chrome.storage.local.set({ "robot_process": [] })
//             return
//         }
//         var process_list = "";
//         for (let i = res.robot_process.length - 1; i >= 0; i--) {
//             process_list = process_list + "<li>" +
//                 "node: " + res.robot_process[i]["tag"] + "#" + res.robot_process[i]["n"] +
//                 "<br />" + "opera: " + res.robot_process[i]["opera"];
//             if (res.robot_process[i]["value"] != "") {
//                 process_list = process_list + "<br />" + "value: " + res.robot_process[i]["value"]
//             }
//             process_list = process_list + "<br />" + "wait: " + res.robot_process[i]["wait"] +
//                 "<br /><br />" + "</li>"
//         }
//         $("#process_list").html(process_list);
//     })
// }
// load_process()


// function jscode(process) {
//     let exec_code = 'var robot_node = document.getElementsByTagName("' + process["tag"] + '")[' + process["n"] + '];'
//     if (process["opera"] == "click") {
//         exec_code = exec_code + "robot_node.click();"
//     } else if (process["opera"] == "value") {
//         exec_code = exec_code + "robot_node.value=\"" + process["value"] + "\"";
//     } else if (process["opera"] == "refresh") {
//         exec_code = exec_code + "window.location.reload();"
//     }
//     return exec_code
// }


// chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//     var tabId = tabs[0].id;
//     var port;
//     var selected_tag;
//     var tag_types = ["a", "body", "button", "div", "i", "img", "input", "li", "p", "span", "td", "textarea", "tr", "ul"]

//     $("#reload").click(function() {
//         $("#tagn").html("");
//         load();
//     })

//     // $("#tag_type").mouseover(function() {
//     let tag_type_content = "<option value='选择标签类型' selected disabled>选择标签类型</option>"
//     for (let i = 0; i < tag_types.length; i++) {
//         tag_type_content = tag_type_content + "<option value=" + tag_types[i] + ">" + tag_types[i] + "</option>"
//     }
//     $("#tag_type").html(tag_type_content);
//     // })

//     function load() {
//         port = chrome.tabs.connect(tabId, { name: 'robot' });
//         $("#tag_type").change(function(e) {
//             selected_tag = $(this).val();
//             port.postMessage({
//                 type: "search_tag",
//                 tag: $(this).val()
//             })
//         });
//         port.onMessage.addListener(function(msg) {
//             if (msg.type = "search_tag") {
//                 let options = ""
//                 for (let i = 0; i < msg.num; i++) {
//                     let value = selected_tag + "#" + i
//                     options = options + "<li value=" + i + " class='tag_spec'>" + value + "</li>"
//                 }
//                 $("#tagn").html(options);

//                 $(".tag_spec").mouseover(function(e) {
//                     port.postMessage({
//                         type: "select_tag",
//                         tag: selected_tag,
//                         n: parseInt($(this).val())
//                     })
//                 })

//                 $(".tag_spec").click(function(e) {
//                     $("#tagn").html("<div id='seldn' value=" + $(this).text() + ">已选: " + $(this).text() + "</div>")
//                 })
//             }
//         })
//     }
//     load();

//     $("#opera_sel").change(function(e) {
//         if ($(this).val() == "value") {
//             $("#set_value").show();
//         } else {
//             $("#set_value").hide();
//         }
//     })

//     function run_test() {
//         seled_data = $("#seldn").attr("value").split("#");
//         process_data = {
//             "tag": seled_data[0],
//             "n": seled_data[1],
//             "opera": $("#opera_sel").val(),
//             "value": $("#ssv").val()
//         }
//         chrome.tabs.executeScript(tabId, { code: jscode(process_data) });
//     }

//     $("#test_run").click(function() {
//         run_test()
//     })


//     $("#add_process").click(function() {
//         chrome.storage.local.get(["robot_process"], function(res) {
//             seled_data = $("#seldn").attr("value").split("#");
//             if (res.robot_process == undefined) {
//                 robot_process = []
//             } else {
//                 robot_process = res.robot_process
//             }
//             robot_process.push({
//                 "tag": seled_data[0],
//                 "n": seled_data[1],
//                 "opera": $("#opera_sel").val(),
//                 "value": $("#ssv").val(),
//                 "wait": parseInt($("#wait_time").val())
//             })
//             chrome.storage.local.set({ "robot_process": robot_process })
//             load_process();
//             run_test();
//         })
//     })

//     $("#del_process").click(function() {
//         chrome.storage.local.get(["robot_process"], function(res) {
//             res.robot_process.pop()
//             chrome.storage.local.set({ "robot_process": res.robot_process });
//             load_process();
//         })
//     })

//     $("#run").click(function() {
//         chrome.storage.local.get(["robot_process"], function(res) {
//             var robot_opera = res.robot_process;
//             var process_wait = 0;
//             for (let i = 0; i < robot_opera.length; i++) {
//                 process_wait = process_wait + robot_opera[i]["wait"] * 1000
//                 setTimeout(function() {
//                     chrome.tabs.executeScript(tabId, { code: jscode(robot_opera[i]) });
//                 }, process_wait)
//             }
//         })
//     })
// })


// for (let i = 0; i < 10; i++) {
//     console.log(i)
//     sleep(i*1000)
// }


// chorme.runtime.onMessage.addListener(function(request, sender, response) {

// $("#tagn").change(function() {
//     port.postMessage({
//         type: "select_tag",
//         tag: selected_tag,
//         n: parseInt($(this).val())
//     })
// })
// });

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
    let exec_code = 'var robot_node = document.getElementsByTagName("' + process["tag"] + '")[' + process["n"] + '];'
    if (process["opera"] == "click") {
        exec_code = exec_code + "robot_node.click();"
    } else if (process["opera"] == "value") {
        exec_code = exec_code + "robot_node.value=\"" + process["value"] + "\"";
    } else if (process["opera"] == "refresh") {
        exec_code = exec_code + "window.location.reload();"
    }
    return exec_code
}


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
                                <a href="#" class="del_case">删除</a> \
                                <a href="#" class="lun_case">轮播</a> \
                            </td> \
                        </tr>';
                cases = cases + tr;
            }
            $("#cases").html(cases);
        }
    })
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
                        </li> '
            process_li = process_li + lili
        }
        $("#process_list").html(process_li)
    })
}

$(document).ready(function() {

    var tag_types = ["a", "body", "button", "div", "i", "img", "input", "li", "p", "span", "td", "textarea", "tr", "ul", "h1", "h2", "h3", "h4", "h5"]
    var operas = ["click", "value", "refresh"]
    var case_name = ""
    var init_select = 1;

    refresh_cases()

    $('.modal').modal()

    $("#cases").on("click", ".case_name", function() {
        $("#case_view").hide()
        $("#process_view").show()
        case_name = $(this).text()
        refresh_process(case_name)
    })

    // $("#cases").on("click", ".run_case", function() {
    //     var case_name = $(this).parent().parent().attr("id")
    //     get_my_robot(my_robot => {
    //         run(my_robot[case_name])
    //     })
    // })

    $("#cases").on("click", ".del_case", function() {
        var case_name = $(this).parent().parent().attr("id")
        get_my_robot(my_robot => {
            delete(my_robot[case_name])
            set_my_robot(my_robot, refresh_cases)
        })
    })

    $("#process_list").on("click", "#process_del", function() {
        var processs_n = parseInt($(this).parent().parent().parent().attr("id").split("-")[1])
        get_my_robot(my_robot => {
            my_robot[case_name].splice(processs_n, 1)
            set_my_robot(my_robot, function() {
                refresh_process(case_name)
            })
        })
    })

    $("#add_case").click(function() {
        var new_case_name = $("#case_name_input").val()
        var my_robot
        get_my_robot(my_robot => {
            my_robot[new_case_name] = []
            set_my_robot(my_robot, refresh_cases)
        })
    });

    $("#case_back").click(function() {
        $("#case_view").show()
        $("#process_view").hide()
    })

    $("#add_process").click(function() {
        $("body").css("width", "150px")
        $("#process_view").hide()
        $("#new_process").show()
        $(".chose_tag").show()
        $(".chose_opera").hide()
        $("#tag_list").css("margin-top", "-20px")
        if (init_select == 1) {
            let tag_type_content = "<option value='选择标签类型' selected disabled>选择标签类型</option>"
            for (let i = 0; i < tag_types.length; i++) {
                tag_type_content = tag_type_content + "<option value=" + tag_types[i] + ">" + tag_types[i] + "</option>"
            }
            $(".sel_tag").html(tag_type_content)

            let sel_opera_content = "<option value='选择操作' selected disabled>选择操作</option>"
            for (let i = 0; i < operas.length; i++) {
                sel_opera_content = sel_opera_content + "<option value=" + operas[i] + ">" + operas[i] + "</option>"
            }
            $("#sel_opera").html(sel_opera_content)
            $("select").material_select()
            init_select = 0
        }
    });

    $(".sel_tag").change(function() {
        var selected_tag = $(this).val();
        connect(port => {
            port.postMessage({
                type: "search_tag",
                tag: selected_tag
            })
            port.onMessage.addListener(function(msg) {
                if (msg.type = "search_tag") {
                    let options = ""
                    for (let i = 0; i < msg.num.length; i++) {
                        let value = selected_tag + "#" + msg.num[i]
                        options = options + "<a href='#' class='collection-item tag_spec'>" + value + "</a>"
                    }
                    $("#tag_list").html(options);
                    $(".tag_spec").mouseover(function(e) {
                        port.postMessage({
                            type: "select_tag",
                            tag: selected_tag,
                            n: parseInt($(this).text().split("#")[1])
                        })
                    })
                }
            })
        })
    })

    $("#tag_list").on("click", ".tag_spec", function(e) {
        $("body").css("width", "250px");
        $("#tag_list").css("margin-top", "0px")
        $("#tag_list").html("<div id='seldn' class='collection-item' data=" + $(this).text() + "><a href='#' id='hasseled'>已选: " + $(this).text() + "</a></div>")
        $(".chose_tag").hide()
        $(".chose_opera").show()
    })

    $("#tag_list").on("click", "#hasseled", function(e) {
        $(".chose_tag").show()
        $(".chose_opera").hide()
        $("body").css("width", "150px");
        $("#tag_list").css("margin-top", "-20px")
    })

    $("#sel_opera").change(function() {
        if ($(this).val() == "value") {
            $("#set_value").show()
        } else {
            $("#set_value").hide()
        }
    })

    exectab(tab_id => {

        $("#process_add").click(function() {
            let data = $("#seldn").attr("data").split("#");
            process_data = {
                "tag": data[0],
                "n": data[1],
                "opera": $("#sel_opera").val(),
                "value": $("#ssv").val(),
                "wait": $("#num_wait").val()
            }
            get_my_robot(my_robot => {
                my_robot[case_name].push(process_data)
                set_my_robot(my_robot)
                refresh_process(case_name)
                $("#new_process").hide()
                $("#process_view").show()
            })
        })

        $("#test_run").click(function() {
            let data = $("#seldn").attr("data").split("#");
            process_data = {
                "tag": data[0],
                "n": data[1],
                "opera": $("#sel_opera").val(),
                "value": $("#ssv").val()
            }
            chrome.tabs.executeScript(tab_id, { code: jscode(process_data) });
        })

        $("#process_list").on("click", "#process_test_run", function() {
            var processs_n = parseInt($(this).parent().parent().parent().attr("id").split("-")[1]);
            get_my_robot(my_robot => {
                chrome.tabs.executeScript(tab_id, { code: jscode(my_robot[case_name][processs_n]) });
            })
        })

        $("#cases").on("click", ".run_case", function() {
            var case_name = $(this).parent().parent().attr("id")
            var save_run = $(this).parent().html()
            var that = $(this).parent()
            that.html("运行中")
            get_my_robot(my_robot => {
                var process_wait = 0;
                for (let i = 0; i < my_robot[case_name].length; i++) {
                    process_wait = process_wait + my_robot[case_name][i]["wait"] * 1000
                    setTimeout(function() {
                        chrome.tabs.executeScript(tab_id, { code: jscode(my_robot[case_name][i]) });
                    }, process_wait)
                }
                setTimeout(function() {
                    that.html(save_run)
                }, process_wait)
            })
        })

        $("#cases").on("click", ".lun_case", function() {
            var case_name = $(this).parent().parent().attr("id")
            var save_run = $(this).parent().html()
            var that = $(this).parent()
            that.html("运行中")
            get_my_robot(my_robot => {
                var process_wait = 0;
                for (let n = 0; n < 100; n++) {
                    for (let i = 0; i < my_robot[case_name].length; i++) {
                        process_wait = process_wait + my_robot[case_name][i]["wait"] * 1000
                        setTimeout(function() {
                            chrome.tabs.executeScript(tab_id, { code: jscode(my_robot[case_name][i]) });
                        }, process_wait)
                    }
                }
                setTimeout(function() {
                    that.html(save_run)
                }, process_wait)
            })
        })

    })
})