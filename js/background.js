chrome.contextMenus.create({
    title: "测试右键菜单",
    onclick: function() {
        console.log(123);
        alert('您点击了右键菜单！');
    }
});


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
    return exec_code;
}


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