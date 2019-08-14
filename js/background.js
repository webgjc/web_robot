chrome.contextMenus.create({
    title: "测试右键菜单",
    onclick: function() {
        console.log(123);
        alert('您点击了右键菜单！');
    }
});