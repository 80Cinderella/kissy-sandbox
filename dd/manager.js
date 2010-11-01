/**
 * dd support for kissy ,manager for dd
 * @author:yiminghe@gmail.com
 */
KISSY.add("dd-manager", function() {
    var S = KISSY,
        Event = S.Event,
        UA = S.UA,
        DD_PG_ZINDEX = 999999,
        DOM = S.DOM,
        Node = S.Node;


    /**
     * Throttles a call to a method based on the time between calls. from YUI
     * @method throttle
     * @for KISSY
     * @param fn {function} The function call to throttle.
     * @param ms {int} The number of milliseconds to throttle the method call. Defaults to 150
     * @return {function} Returns a wrapped function that calls fn throttled.
     */

    /*! Based on work by Simon Willison: http://gist.github.com/292562 */

    function throttle(fn, scope, ms) {
        ms = ms || 150;

        if (ms === -1) {
            return (function() {
                fn.apply(scope, arguments);
            });
        }

        var last = (new Date()).getTime();

        return (function() {
            var now = (new Date()).getTime();
            if (now - last > ms) {
                last = now;
                fn.apply(scope, arguments);
            }
        });
    }


    S.DD = {};

    function Manager() {
        var self = this;
        Manager.superclass.constructor.apply(self, arguments);
        self._init();
    }

    Manager.ATTRS = {
        /**
         * mousedown 后 buffer 触发时间,100毫秒
         */
        timeThred:{value:200},
        /**
         * 当前激活的拖对象，在同一时间只有一个值，所以不是数组
         */
        activeDrag:{},
        /**
         * 所有注册对象
         */
        drags:{value:{}}
    };

    /*
     负责拖动涉及的全局事件：
     1.全局统一的鼠标移动监控
     2.全局统一的鼠标弹起监控，用来通知当前拖动对象停止
     3.为了跨越iframe而统一在底下的遮罩层
     */
    S.extend(Manager, S.Base, {
        _init:function() {
            var self = this;
            self._showPgMove = throttle(self._move, self, 30);
        },
        /*
         注册所有可拖动对象
         */
        /*
         reg:function(node) {
         var drags = this.get("drags");
         if (!node[0].id) {
         node[0].id = S.guid("drag-");
         }
         drags[node[0].id] = node;
         },*/
        /*
         全局鼠标移动事件通知当前拖动对象正在移动
         注意：chrome8 :click 时 mousedown-mousemove-mouseup-click 也会触发 mousemove
         */
        _move:function(ev) {
            var activeDrag = this.get("activeDrag");
            //S.log("move");
            //防止ie选择到字
            ev.preventDefault();
            if (!activeDrag) return;
            activeDrag._move(ev);
        },
        /**
         * 当前拖动对象通知全局：我要开始啦
         * 全局设置当前拖动对象，
         * 还要根据配置进行buffer处理
         * @param drag
         */
        _start:function(drag) {
            var self = this,
                timeThred = self.get("timeThred") || 0;

            //事件先要注册好，防止点击，导致 mouseup 时还没注册事件
            self._registerEvent();

            //是否中央管理，强制限制拖放延迟
            if (timeThred) {
                self._timeThredTimer = setTimeout(function() {
                    self._bufferStart(drag);
                }, timeThred);
            } else {
                self._bufferStart(drag);
            }
        },
        _bufferStart:function(drag) {
            //S.log("_bufferStart");
            var self = this;
            self.set("activeDrag", drag);
            //真正开始移动了才激活垫片
            self._activePg();
            drag._start();
        },
        /**
         * 全局通知当前拖动对象：你结束拖动了！
         * @param ev
         */
        _end:function(ev) {
            var self = this,
                activeDrag = self.get("activeDrag");
            //self._unregisterEvent();
            if (self._timeThredTimer) {
                clearTimeout(self._timeThredTimer);
                self._timeThredTimer = null;
            }
            self._pg && self._pg.css({
                display:"none"
            });
            if (!activeDrag) return;
            activeDrag._end(ev);
            self.set("activeDrag", null);
        },
        /**
         * 垫片只需创建一次
         */
        _activePg:function() {
            var self = this,doc = document;
            //创造垫片，防止进入iframe，外面document监听不到 mousedown/up/move
            self._pg = new Node("<div " +
                "style='" +
                //red for debug
                "background-color:red;" +
                "position:absolute;" +
                "left:0;" +
                "width:100%;" +
                "top:0;" +
                "z-index:" +
                //覆盖iframe上面即可
                DD_PG_ZINDEX
                + ";" +
                "'></div>").appendTo(doc.body);
            //0.5 for debug
            self._pg.css("opacity", 0);
            self._activePg = self._showPg;
        },

        _showPg:function() {
            var self = this;
            self._pg.css({
                display: "",
                height: DOM.docHeight()
            });

            //清除由于浏览器导致的选择文字
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }
            //防止 ie 莫名选择文字
            else if (document.selection) {
                document.selection.clear();
            }
        },

        /**
         * 开始时注册全局监听事件
         */
        _registerEvent:function() {
            var self = this,doc = document;
            //S.log("_registerEvent");
            Event.on(doc, "mouseup", self._end, self);
            Event.on(doc, "mousemove", self._showPgMove, self);
        },

        /**
         * 结束时需要取消掉，防止平时无谓的监听
         */
        _unregisterEvent:function() {
            var self = this,doc = document;
            //S.log("_unregisterEvent");
            Event.remove(doc, "mousemove", self._showPgMove, self);
            Event.remove(doc, "mouseup", self._end, self);
        }


    });

    S.DD.DDM = new Manager();
});