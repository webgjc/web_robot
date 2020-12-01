# web_robot
自动化网页操作机器人

![图片](https://github.com/webgjc/web_robot/blob/master/images/robot_pic.jpg?raw=true)

## 详细说明

请见博客   
[看板教程](http://blog.ganjiacheng.cn/article/article_31_chrome%E6%8F%92%E4%BB%B6-WEB-ROBOT%E4%B9%8B%E6%88%91%E7%9A%84%E7%9C%8B%E6%9D%BF/)  
[使用教程V1.0版本](http://ganjiacheng.cn/article/article_18_chrome%E6%8F%92%E4%BB%B6-%E7%BD%91%E9%A1%B5%E8%87%AA%E5%8A%A8%E5%8C%96/)  
[持续更新教程](http://ganjiacheng.cn/article/article_21_chrome%E6%8F%92%E4%BB%B6-WEB-ROBOT/)


## 已有功能
1. 管理多个事务，每个事务有多个事件，每个事件对应一种操作   
2. 新增事件中方便的页面元素筛选器，querySelect自由筛选器
3. 可以测试运行一个事件，运行一整个事务。
4. 支持事务的导入导出
5. 支持源码事务，写js源码并注入运行
6. 支持流程事务的受控运行，本地鼠标和键盘还原事件。
7. 支持受控事务，实现键鼠录制和还原
8. 支持元素筛选和执行时的自动定位
9. 支持设值事件作为运行前自定义参数${value}
10. 支持页面直接添加事件
11. 支持定时运行
12. 支持源码事务的开启直接注入
13. 支持流程取值事件，取到的值对当次流程有效
14. 支持流程事件的直接录制
15. 页面添加事件中优秀的可视化圈选
16. 支持值选择器
17. 支持dom自旋检查
18. 自定义看板，看板简易模式


## 核心部分--事务和运行机制说明

新建事务分为三种事务，流程事务，源码事务，受控事务；  
(事务功能场景互相有重叠又互相有补充，详情见下面使用场景)  
运行分为运行，定时运行，受控运行，轮播，开启注入；

- 流程事务：通过dom定义事件。  
    - 运行 (运行一次，运行在浏览器后台，使用浏览器事件)
    - 受控运行 (运行一次，运行在本地客户端，控制鼠标键盘还原对应事件)
    - 定时运行 (定时运行，运行在浏览器后台，有两种定时模式每日和每隔，使用浏览器事件)
    - 轮播 (循环运行事件，运行在插件页，插件页关闭即停止，使用浏览器事件)

- 源码事务：通过源码定义事件，有正则地址匹配机制。
    - 运行 (运行一次，直接向目前页注入代码)
    - 定时运行 (定时运行，运行在浏览器后台，向当前页注入固定代码)
    - 开启注入 (打开页面时注入，直接匹配地址，进行注入)

- 受控事务：通过鼠标键盘录制定义事件，可以受控运行，  
    - 受控运行 (运行一次，运行于本地客户端，还原录制的鼠标键盘事件)

流程事务事件的定义包括 dom节点，事件，延时，设值： 

- 节点筛选器包含
  - 自定义节点筛选器
  - html标签筛选器

- 事件包含
  - click 点击
  - value 设值
  - refresh 刷新
  - pagejump 当页跳转
  - mouseover 鼠标移入
  - getvalue 取值
  - newpage 新页跳转

注：受控相关的都必须使用开启本地客户端。

## 使用方法
请认准这个为chrome插件，运行于chrome浏览器，或基于chromium的浏览器  
1. 浏览器设置（三个点）--> 更多工具 --> 扩展程序 ↓  
2. 打开右上角开发者模式 --> 加载已解压的扩展程序 --> 选择clone下来的该项目根目录 ↓  
3. 弄完可关掉开发者模式 --> 右键项目图标 --> 检查可读取和更改网站数据 --> 在所有网站上

## 版本更新

> git pull

在继续上面的1，2步骤

## 受控运行，需开启本地客户端web服务

0. 重要：**目前本地客户端只在mac系统上进行过测试**。
1. 首先准备一个python3虚拟环境，venv/ 放于项目根目录下，如有自己的python3，请修改py/web.py中的PYTHON_ENV
- PYTHON_ENV = "./venv/bin/python"
2. pip下载 py/requirements.txt 里的包
- pip install -r py/requirements.txt
3. 项目根目录下启动web服务 **python py/web.py**
4. 如果没反应，以mac举例，左上角的设置 -> 系统偏好设置 -> 安全性与隐私 -> 辅助功能 将开启web服务的应用(如iTerm)加入到里面

## 使用场景

- 流程事务可以定义复杂重复的页面操作进行自动化，直接运行适用比如重复填写负责的表单，设值也可以运行时自定义参数。
- 流程事务的定时运行可以适用每日签到，每日在网页处理某件同样的事。
- 流程事务受控运行适用于前端做了特殊处理无法触发事件的情况，使用键盘鼠标模拟事件，必然可以触发。
- 源码事务的的定时运行适用于如定时提醒喝水(alert)等
- 源码事务的开始注入适用于如百度去广告的场景等
- 受控事务的录制和受控运行适用于对一个复杂操作(无法用流程实现)的定义和复现。

## 演示用例

- 基本操作
```json
{"case_name":"基本操作","case_process":[{"n":"0","opera":"newpage","tag":"body","value":"https://www.baidu.com/s?ie=UTF-8&wd=test","wait":"1"},{"n":"0","opera":"value","tag":"INPUT#kw","value":"天气","wait":"2"},{"n":"0","opera":"click","tag":"INPUT#su","value":"","wait":"1"}],"case_sourcecode":"","case_type":"process","control_url":"","sourcecode_url":".*"}
```

- 取值事件
```json
{"case_name":"取值事件用例","case_process":[{"n":"0","opera":"newpage","tag":"body","value":"http://blog.ganjiacheng.cn/","wait":"1"},{"n":"0","opera":"getvalue","tag":"HTML.macos.desktop.landscape > BODY > NAV.navbar.navbar-default.navbar-custom.navbar-fixed-top > DIV.container-fluid > DIV.navbar-header.page-scroll > A.navbar-brand","value":"title","wait":"3"},{"n":"0","opera":"pagejump","tag":"body","value":"https://www.baidu.com/s?ie=UTF-8&wd=test","wait":"2"},{"n":"0","opera":"value","tag":"INPUT#kw","value":"title","wait":"1"},{"n":"0","opera":"click","tag":"INPUT#su","value":"","wait":"1"}],"case_sourcecode":"","case_type":"process","control_url":"","sourcecode_url":".*"}
```

- 百度去广告(源码事务)
```json
{"case_name":"百度去广告","case_process":[],"case_sourcecode":"Array.from(\n            document.querySelectorAll('#content_left>div'))\n            .forEach(el => \n                />广告</.test(el.innerHTML) && el.parentNode.removeChild(el)\n        );\nsetInterval(() => {\n    try{\n        Array.from(\n            document.querySelectorAll('#content_left>div'))\n            .forEach(el => \n                />广告</.test(el.innerHTML) && el.parentNode.removeChild(el)\n        )\n    } catch(e){}\n}, 1000)\n","case_type":"sourcecode","control_url":"","sourcecode_url":"baidu.com.*","start_inject":true}
```

- 定时喝水(源码事务)
```json
{"case_name":"定时喝水","case_process":[],"case_sourcecode":"alert(\"你该喝水咯\")","case_type":"sourcecode","control_url":"","last_runtime":1599706892179,"runtime":"60m","sourcecode_url":".*"}
```

- 值选择器用例
```json
{"case_name":"值选择器用例","case_process":[{"n":"0","opera":"newpage","tag":"body","value":"http://blog.ganjiacheng.cn/","wait":"1"},{"n":"0","opera":"click","tag":"a{About}","value":"","wait":"2"},{"n":"0","opera":"click","tag":"a{Archives}","value":"","wait":"2"},{"n":"0","opera":"click","tag":"a{Home}","value":"","wait":"2"}],"case_sourcecode":"","case_type":"process","control_url":"","sourcecode_url":".*"}
```

- dom检查自旋用例(可以实现在dom出现时立刻运行)
```json
{"case_name":"test","case_process":[{"check":true,"n":"0","opera":"newpage","tag":"body","value":"https://www.baidu.com/","wait":"0.1"},{"check":true,"n":"0","opera":"value","tag":"INPUT#kw","value":"天气","wait":"0.1"},{"check":true,"n":"0","opera":"click","tag":"INPUT#su","value":"","wait":"01"}],"case_sourcecode":"","case_type":"process","control_url":"","last_runtime":1603672211550,"runtime":"4:00","sourcecode_url":".*"}
```


- 演示1

![演示1](http://blog.ganjiacheng.cn/img/mypost/robot_demo1.gif)

- 演示2

![演示2](http://blog.ganjiacheng.cn/img/mypost/robot_demo2.gif)

- 演示3

![演示3](http://blog.ganjiacheng.cn/img/mypost/robot_demo3.gif)

## 版本迭代

v0.1 (2019.08.14)
1. 完成初始第一版，管理流程事务

v1.0 (2020.05.13)(重构更新)
1. 管理多个事务，每个事务有多个过程，每个过程对应一种操作   
2. 新增操作中方便的页面元素筛选器，css/id筛选器
3. 测试运行一个过程，运行一个事务，运行转为background后台   
4. 支持事务的导入导出

v1.1 (2020.05.28) (数据与上版本不兼容)
1. 支持源码事务

v1.2 (2020.06.01)
1. 新增事务受控运行模式，运行于background中
2. 新增本地web服务，用于鼠标键盘模拟流程的受控执行

v1.2.1 (2020.06.03)
1. 删除事务新增校验
2. 实现流程中事件的复制，移动，编辑

v1.3 (2020.06.05)
1. 新增受控事务
2. 本地客户端实现受控事务的键鼠事件录制，存储和还原

v1.3.1 (2020.06.06)
1. 优化元素筛选器进行自动定位
2. 优化流程事件运行和受控运行的自动定位

v1.4.0 (2020.06.07)
1. 改class/id筛选器为自由筛选器
2. 使用promise重构流程执行
3. 新增执行前自定义参数
4. 新增本地服务检查

v1.5.0 (2020.06.08)
1. 新增网页直接添加流程事件的方式

v1.6.0 (2020.06.09)
1. 新增定时运行, 仅支持流程事务

v1.6.1 (2020.06.10)
1. 修改源码事务，可进行路由匹配检查
2. 新增源码事务的定时运行

v1.6.2 (2020.06.13)
1. 优化运行元素的定位
2. 新增源码事务直接注入的开启与关闭

v1.6.3 (2020.06.22)
1. 新增鼠标移入事件操作

v1.7.0 (2020.06.29)
1. 修复部分bug
2. 流程事务新增取值事件，支持运行,受控运行与轮播

v1.7.1 (2020.07.05)
1. 新增流程事件页面直接录制
2. 关闭页面添加事件入口

V1.8.0 (2020.07.20)
1. 新增页面添加事件的可视化圈选
2. 重构页面事件定义的iframe嵌入页

V1.8.1 (2020.08.09)
1. 流程事务支持新页面跳转操作
2. 主页默认根据创建时间展示列表,支持移位

V1.8.2 (2020.08.15)
1. 新用户初始化数据修复
2. 新增重命名操作

V1.8.3（2020.09.18）
1. 支持值选择器

V1.9.0（2020.10.26）
1. 重构运行流程事务，增加dom检查自旋支持
2. 新增页面消息提醒

V1.9.1（2020.10.27）
1. 定时运行增加可配置的失败重试

V2.0.0 (2020.12.01)
1. 新增唯一展示事件
2. 新增简易看板模式
3. 增加看板，看板配置

## 感谢轮子
1. [materializecss](http://www.materializecss.cn/about.html)
3. [官方轮子](https://developer.chrome.com/extensions)
4. [插件教程](https://www.cnblogs.com/liuxianan/p/chrome-plugin-develop.html)


## 感谢Contributors，欢迎加入

- [webgjc](https://github.com/webgjc)
- [ILovePing](https://github.com/ILovePing)

## License

web_robot is [MIT licensed](./LICENSE).

## 赞赏

![赞赏](https://raw.githubusercontent.com/webgjc/web_robot/master/images/reward.png)