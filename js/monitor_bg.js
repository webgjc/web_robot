let TAB_INFO = {};

let CONFIG = {
    notify: true,
    key: "my_robot_monitor"
}

let EVENT_TYPE_ENUM = {
    CLICK: "CLICK", 
    INPUT: "INPUT",  
    NEWPAGE: "NEWPAGE",  
    CHANGEURL: "CHANGEURL", 
    CLOSEPAGE: "CLOSEPAGE", 
    SCROLL: "SCROLL" 
};

let EVENT_TYPE_TITLE = {
    CLICK: "点击事件",
    INPUT: "设值事件", 
    NEWPAGE: "新开页面", 
    CHANGEURL: "修改链接",
    CLOSEPAGE: "关闭页面", 
    SCROLL: "滚动事件" 
};

// 发送通知
function notify(data) {
    let sb = "";
    if(data.type === EVENT_TYPE_ENUM.CLICK) {
        sb = "点击" + " " + data.context;
    }else if(data.type === EVENT_TYPE_ENUM.INPUT) {
        sb = "设值" + " " + data.context;
    }else if(data.type in [EVENT_TYPE_ENUM.NEWPAGE, EVENT_TYPE_ENUM.CHANGEURL, EVENT_TYPE_ENUM.CLOSEPAGE]) {
        sb = EVENT_TYPE_TITLE[data.type] + " " + data.url;
    }
    chrome.notifications.create(null, {
        type: "basic",
        iconUrl: "/images/robot.png",
        title: EVENT_TYPE_TITLE[data.type],
        message: sb
    });
}

// 获取数据存储
function get_my_monitor(callback) {
    chrome.storage.local.get([CONFIG.key], function (res) {
        if (callback) callback(res[CONFIG.key]);
    });
}

// 设置数据存储
function set_my_monitor(new_monitor, cb) {
    chrome.storage.local.set({
        [CONFIG.key]: new_monitor
    }, function () {
        cb && cb();
    });
}

// 增加事件
function add_event(data) {
    get_my_monitor(monitor => {
        monitor.push(data);
        console.log(monitor);
        set_my_monitor(monitor, () => {
            CONFIG.notify && notify(data);
        });
    });
}


// tab状态监控
function tab_monitor() {
    setInterval(() => {
        console.log(1)
        let now_tab = {};
        chrome.tabs.query({
            currentWindow: true
        }, function(tabs) {
            if(tabs.length == 0) return;
            for(let i = 0; i < tabs.length; i++) {
                now_tab[tabs[i].id] = tabs[i].url;
                if(!TAB_INFO[tabs[i].id]) {
                    add_event({
                        type: EVENT_TYPE_ENUM.OPENPAGE,
                        url: tabs[i].url
                    });
                }else if(TAB_INFO[tabs[i].id] != tabs[i].url) {
                    add_event({
                        type: EVENT_TYPE_ENUM.CHANGEURL,
                        url: tabs[i].url
                    });
                }
            }
            let old_tab_ids = Object.keys(TAB_INFO);
            console.log(old_tab_ids, now_tab)
            for(let i = 0; i < old_tab_ids.length; i++) {
                if(!now_tab[parseInt(old_tab_ids[i])]) {
                    add_event({
                        type: EVENT_TYPE_ENUM.CLOSEPAGE,
                        url: TAB_INFO[i]
                    });
                }
            }
            TAB_INFO = now_tab;
        });
    }, 3000);
}

// 初始化
function init() {
    get_my_monitor(monitor => {
        if(!monitor) {
            set_my_monitor([]);
        }
    });
    chrome.tabs.query({
        currentWindow: true
    }, function(tabs) {
        for(let i = 0; i < tabs.length; i++) {
            TAB_INFO[tabs[i].id] = tabs[i].url;
        }
        console.log(TAB_INFO)
    });
}

// 监听来自monitor_cs的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.type === "SEND_MSG") {
        notify(request.data);
        sendResponse("");
    } else if(request.type === "ADD_EVENT") {
        add_event(request.data)
    }
});


init();
tab_monitor();

