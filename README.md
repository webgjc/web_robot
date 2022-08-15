# web_robot
自动化网页操作机器人

![图片](http://blog.ganjiacheng.cn/img/mypost/2021/1-1.jpg)

## 详细说明

请见博客   
[Web Robot使用教程(终极版)](http://ganjiacheng.cn/article/2021/article_3_WEB_ROBOT%E4%BD%BF%E7%94%A8%E6%96%87%E6%A1%A3(%E7%BB%88%E6%9E%81%E7%89%88)/)  
[看板教程](http://ganjiacheng.cn/article/article_31_chrome%E6%8F%92%E4%BB%B6-WEB-ROBOT%E4%B9%8B%E6%88%91%E7%9A%84%E7%9C%8B%E6%9D%BF/)  
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
19. 支持配置并发页面级爬虫
20. 支持爬虫与客户端数据交互
21. 支持消息通知事件
22. 支持流程事务在后台运行
23. 支持页面元素数据监控配置
24. 支持单节点监控与多节点监控
25. 支持快捷键
26. 支持流程事务的跳转

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
  - mouseover 鼠标移入
  - pagejump 当页跳转
  - newpage 新页打开
  - getvalue 取值
  - getcustomvalue 自定义获取数据
  - closepage 关闭页面
  - onlyshow 唯一展示（看板使用）
  - sendmessage 发送通知（目前不一定可靠）

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

## 常见问题

### 发消息事件无响应
1、在Chrome浏览器中访问地址：chrome://flags   
2、搜索栏中搜索：notifications，找到 Enable system notifications 选项，将其选项值改为 Disabled    
3、重启浏览器，问题解决。

## 演示用例，（直接复制，导入事务即可享用）

- 基本操作（打开百度，搜索天气，点击确定）
```json
{"case_name":"基本操作","case_process":[{"n":"0","opera":"newpage","tag":"body","value":"https://www.baidu.com/s?ie=UTF-8&wd=test","wait":"1"},{"n":"0","opera":"value","tag":"INPUT#kw","value":"天气","wait":"2"},{"n":"0","opera":"click","tag":"INPUT#su","value":"","wait":"1"}],"case_sourcecode":"","case_type":"process","control_url":"","sourcecode_url":".*"}
```

- 取值事件（打开个人博客页，获取内容赋值给title，打开百度，搜索刚刚获取到的title，点击搜索）
```json
{"case_name":"取值事件用例","case_process":[{"n":"0","opera":"newpage","tag":"body","value":"http://blog.ganjiacheng.cn/","wait":"1"},{"bgopen":false,"check":true,"expr":"","n":"0","opera":"getvalue","parser":"text_parser","sysmsg":false,"tag":"HTML.macos.desktop.landscape > BODY > NAV.navbar.navbar-default.navbar-custom.navbar-fixed-top > DIV.container-fluid > DIV.navbar-header.page-scroll > A.navbar-brand","value":"title","wait":"1"},{"bgopen":false,"check":false,"expr":"","n":"0","opera":"pagejump","parser":"text_parser","sysmsg":false,"tag":"body","value":"https://www.baidu.com/s?ie=UTF-8&wd=test","wait":"2"},{"bgopen":false,"check":true,"expr":"","n":"0","opera":"value","parser":"text_parser","sysmsg":false,"tag":"INPUT#kw","value":"{title}","wait":"1"},{"bgopen":false,"check":true,"expr":"","n":"0","opera":"click","parser":"text_parser","sysmsg":false,"tag":"INPUT#su","value":"","wait":"1"}],"case_sourcecode":"","case_type":"process","control_url":"","sourcecode_url":".*"}
```

- 百度去广告(源码事务)
```json
{"case_name":"百度去广告","case_process":[],"case_sourcecode":"Array.from(\n            document.querySelectorAll('#content_left>div'))\n            .forEach(el => \n                />广告</.test(el.innerHTML) && el.parentNode.removeChild(el)\n        );\nsetInterval(() => {\n    try{\n        Array.from(\n            document.querySelectorAll('#content_left>div'))\n            .forEach(el => \n                />广告</.test(el.innerHTML) && el.parentNode.removeChild(el)\n        )\n    } catch(e){}\n}, 1000)\n","case_type":"sourcecode","control_url":"","sourcecode_url":"baidu.com.*","start_inject":true}
```

- 定时喝水(源码事务)
```json
{"case_name":"定时喝水","case_process":[],"case_sourcecode":"alert(\"你该喝水咯\")","case_type":"sourcecode","control_url":"","last_runtime":1599706892179,"runtime":"60m","sourcecode_url":".*"}
```

- 值选择器用例（打开个人博客，使用a{About}选择器点击导航栏切换，使用a{Archives}点击导航栏切换）
```json
{"case_name":"值选择器用例","case_process":[{"n":"0","opera":"newpage","tag":"body","value":"http://blog.ganjiacheng.cn/","wait":"1"},{"n":"0","opera":"click","tag":"a{About}","value":"","wait":"2"},{"n":"0","opera":"click","tag":"a{Archives}","value":"","wait":"2"},{"n":"0","opera":"click","tag":"a{Home}","value":"","wait":"2"}],"case_sourcecode":"","case_type":"process","control_url":"","sourcecode_url":".*"}
```

- dom检查自旋用例(可以实现在dom出现时立刻运行，兼容某些资源加载延迟情况)
```json
{"case_name":"test","case_process":[{"check":true,"n":"0","opera":"newpage","tag":"body","value":"https://www.baidu.com/","wait":"0.1"},{"check":true,"n":"0","opera":"value","tag":"INPUT#kw","value":"天气","wait":"0.1"},{"check":true,"n":"0","opera":"click","tag":"INPUT#su","value":"","wait":"01"}],"case_sourcecode":"","case_type":"process","control_url":"","last_runtime":1603672211550,"runtime":"4:00","sourcecode_url":".*"}
```

- 并发爬虫事务用例(爬取百度搜索前10页的每页前三条结果，可配置在前后台运行)
```json
{"case_name":"爬虫用例","case_process":[],"case_sourcecode":"","case_type":"paral_crawler","control_url":"","paral_crawler":{"api":"http://127.0.0.1:12580/crawler/","apicb":false,"cc":5,"data":[],"fetch":[{"check":true,"expr":"new Date()","n":"0","opera":"getcustomvalue","tag":"body","value":"时间","wait":"0"},{"check":true,"expr":"","n":"0","opera":"getvalue","tag":"h3","value":"标题1","wait":"0"},{"check":true,"expr":"","n":"1","opera":"getvalue","tag":"h3","value":"标题2","wait":"0"},{"check":true,"expr":"","n":"2","opera":"getvalue","tag":"h3","value":"标题3","wait":"0"}],"freq":1,"send":false,"urlapi":"http://127.0.0.1:12580/crawler/url/","urls":["https://www.baidu.com/s?wd=test&pn={0-10}0"]},"sourcecode_url":".*"}
```

- 后台运行流程事务 + 消息通知用例（后台打开百度，设值天气，获取第一条天气的内容，发送系统消息）
```json
{"case_name":"后台运行+消息发送","case_process":[{"bgopen":true,"check":false,"expr":"","n":"0","opera":"newpage","sysmsg":false,"tag":"body","value":"https://www.baidu.com/s?ie=UTF-8&wd=test","wait":"0"},{"check":true,"expr":"","n":"0","opera":"value","tag":"INPUT#kw","value":"天气","wait":"0"},{"check":true,"expr":"","n":"0","opera":"click","tag":"INPUT#su","value":"","wait":"0"},{"bgopen":false,"check":true,"expr":"","n":"0","opera":"getvalue","tag":"DIV#content_left > DIV.result-op.c-container.xpath-log > DIV.op_weather4_twoicon_container_div > DIV.op_weather4_twoicon > A.op_weather4_twoicon_today.OP_LOG_LINK","value":"key","wait":"1"},{"bgopen":false,"check":true,"expr":"","n":"0","opera":"sendmessage","parser":"text_parser","sysmsg":true,"tag":"DIV#wrapper_wrapper","value":"天气：{key}","wait":"0"}],"case_sourcecode":"","case_type":"process","control_url":"","fail_rerun":false,"last_runtime":1611820796375,"runtime":"","sourcecode_url":".*"}
```

- 线性爬虫 + 列表数据解析（初始化 - 打开博客页面；取数据 - 获取列表第一条数据，且配置列表解析；下一步 - 点击下一页）
```json
{"add_dashboard":true,"case_name":"线性爬虫","case_process":[],"case_sourcecode":"","case_type":"serial_crawler","control_url":"","serial_crawler":{"api":"http://127.0.0.1:12580/crawler/","data":null,"fetch":[{"bgopen":false,"check":true,"expr":"new Date()","n":"0","opera":"getcustomvalue","parser":"text_parser","sysmsg":true,"tag":"body","value":"key","wait":"0.5"},{"bgopen":false,"check":true,"expr":"","n":"0","opera":"getvalue","parser":"list_parser","sysmsg":true,"tag":".post-title","value":"titles","wait":"0"}],"freq":10,"init":[{"bgopen":false,"check":false,"expr":"","n":"0","opera":"newpage","parser":"text_parser","sysmsg":true,"tag":"body","value":"https://coding-pages-bucket-3440936-7810273-13586-512516-1300444322.cos-website.ap-shanghai.myqcloud.com/","wait":"0"}],"next":[{"bgopen":false,"check":true,"expr":"","n":"0","opera":"click","parser":"text_parser","sysmsg":true,"tag":"li.next>a","value":"","wait":"0"}],"send":false,"times":5},"sourcecode_url":".*"}
```

- 单节点监控，监控单个元素变化（打开搜时间的百度页，配置监控展示时间的单个节点，变化时会有页面内消息通知）需打开某页面
```json
{"case_name":"单个监控-时间","case_process":[],"case_sourcecode":"","case_type":"monitor","control_url":"","monitor":{"run":false,"selector":".result-op.c-container:nth-child(1)","url":"https://www.baidu.com/s?wd=%E6%97%B6%E9%97%B4"},"sourcecode_url":".*"}
```

- 多节点监控，监控多个节点的增量变化（打开微博热搜列表页，配置监控前20条增量变化，增加新数据时会有页面内消息通知）需打开某页面
```json
{"case_name":"批量监控-热搜","case_process":[],"case_sourcecode":"","case_type":"monitor","control_url":"","monitor":{"run":false,"selector":"tr:nth-child(-n+22) td:nth-child(2) a","url":"https://s.weibo.com/top/summary?cate=realtimehot"},"sourcecode_url":".*"}
```

- 快捷键+选中传参跳转+流程事务（快捷键为lp，选中项默认为{SELECT}）
```json
{"case_name":"快捷键+选中传参跳转+流程事务","case_process":[{"bgopen":false,"check":false,"expr":"","n":"1","opera":"newpage","parser":"text_parser","sysmsg":true,"tag":"a","value":"https://www.baidu.com/s?ie=UTF-8&wd={SELECT}","wait":"0"}],"case_sourcecode":"","case_type":"process","control_url":"","last_runtime":1655450299124,"short_key":"l,p","sourcecode_url":".*"}
```

- 快捷键+复制传参跳转+源码事务（快捷键为qw，复制默认为{COPY}）
```json
{"case_name":"快捷键+复制传参跳转+源码事务","case_process":[],"case_sourcecode":"window.open(\"https://www.baidu.com/s?ie=UTF-8&wd={COPY}\")","case_type":"sourcecode","control_url":"","last_runtime":1657184059039,"short_key":"q,w","sourcecode_url":".*"}
```

- 页面有iframe的流程事件
```json
{"case_name":"页面有iframe的流程事件","case_process":[{"bgopen":false,"check":false,"expr":"","id":1,"iframe":"TopFrame","jumpto":"","opera":"newpage","parser":"text_parser","sysmsg":true,"tag":"空标签","value":"https://www.runoob.com/try/try.php?filename=tryhtml_intro","wait":"0"},{"bgopen":false,"check":true,"expr":"","id":2,"iframe":"iframe&0","jumpto":"","n":"0","opera":"getvalue","parser":"text_parser","sysmsg":true,"tag":"h1","value":"iframe内文本","wait":"0"},{"bgopen":false,"check":false,"expr":"","id":3,"iframe":"TopFrame","jumpto":"","n":"undefined","opera":"sendmessage","parser":"text_parser","sysmsg":true,"tag":"空标签","value":"内容：{iframe内文本}","wait":"0"},{"bgopen":false,"check":false,"expr":"","id":4,"iframe":"TopFrame","jumpto":"","n":"undefined","opera":"closepage","parser":"text_parser","sysmsg":true,"tag":"空标签","value":"","wait":"1"}],"case_sourcecode":"","case_type":"process","control_url":"","sourcecode_url":".*"}
```

- 流程事务跳转事件
```json
{"case_name":"跳转事件演示","case_process":[{"bgopen":false,"check":false,"expr":"new Date().getHours()","id":1,"iframe":null,"jumpto":"","opera":"getcustomvalue","parser":"text_parser","sysmsg":true,"tag":"空标签","value":"hour","wait":"0"},{"bgopen":false,"check":false,"expr":"{hour} >= 12","id":2,"iframe":null,"jumpto":"4","n":"undefined","opera":"processjump","parser":"text_parser","sysmsg":true,"tag":"空标签","value":"","wait":"0"},{"bgopen":false,"check":false,"expr":"","id":3,"iframe":null,"jumpto":"","opera":"sendmessage","parser":"text_parser","sysmsg":true,"tag":"空标签","value":"上午好","wait":"0"},{"bgopen":false,"check":false,"expr":"1==1","id":5,"iframe":null,"jumpto":"-1","opera":"processjump","parser":"text_parser","sysmsg":true,"tag":"空标签","value":"","wait":"0"},{"bgopen":false,"check":false,"expr":"","id":4,"iframe":null,"jumpto":"","opera":"sendmessage","parser":"text_parser","sysmsg":true,"tag":"空标签","value":"下午好","wait":"0"}],"case_sourcecode":"","case_type":"process","control_url":"","sourcecode_url":".*"}
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

V2.1.0 (2021.01.14)
1. 新增并发页面爬虫（使用新页iframe实现）
2. 支持爬虫与客户端数据交互

V2.2.0 (2021.01.20)
1. 页面爬虫支持后台运行，支持定时运行
2. 页面爬虫数据支持增加到看板

V2.3.0 (2021.01.29)
1. 流程事务支持后台运行(新开页面事件在后台)
2. 新增消息通知事件(增加系统通知与浏览器通知)
3. 优化看板元素不展示中间过程

V2.4.0 (2021.03.03)
1. 新增优化后的线性爬虫
2. 增加取值事件的数据解析

V2.5.0（2021.06.07）
1. 新增监控事务（单节点监控与多节点监控）

V2.6.0 (2022.06.30)
1. 新增快捷键触发事务，支持默认的选中传值：{SELECT}，复制传值：{COPY}
2. 修改中间运行参数为{}格式（注：运行前参数格式为${}，本次影响原取值事件的设值，消息发送中间参数）
3. 源码事务也支持自定义设值

V2.7.0 (2022.07.24)
1. 流程事件支持指定iframe

V2.8.0 (2022.08.15)
1. 流程事务支持跳转事件（只能往后跳转，跳转不存在的节点会结束流程）
2. 增加流程事件测至此操作
3. 增加爬虫事务数据下载
4. 其他各种优化


## 特别说明
本插件使用manifest V2版本，插件导入浏览器中会有错误报警，暂时可忽略。

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