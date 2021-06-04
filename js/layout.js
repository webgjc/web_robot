
var grid = GridStack.init({
    alwaysShowResizeHandle: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    ),
    resizable: {
        handles: 'e, se, s, sw, w'
    },
    minRow: 1,
    cellHeight: 'auto',
    // float: true,
    enableMove: true,
    enableResize: true,
    margin: 2
});
const serializedData = [
    {
        "x": 0,
        "y": 0,
        "w": 1,
        "h": 1,
        "content": "事件1"
    },
    {
        "x": 1,
        "y": 1,
        "w": 1,
        "h": 1,
        "content": "事件2"
    }
];
  
grid.load(serializedData);