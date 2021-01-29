#!/usr/bin/env bash


usage(){
    echo "usage:"
    echo 'bash main.sh 参数'
    echo '请确保存在python3命令'
    echo 'start              :  启动本地python web服务'
    echo 'open_dashboard     :  开启仪表盘'
    echo 'close_dashboard    :  关闭仪表盘'
    echo '示例 : bash main.sh start'
}


case $1 in
    start)
        python3 py/web.py
        ;;
    open_dashboard)
        python3 script.py open_dashboard
        echo '请重新加载插件生效'
        ;;
    close_dashboard)
        python3 script.py close_dashboard
        echo '请重新加载插件生效'
        ;;
    *)
        usage
        ;;
esac
