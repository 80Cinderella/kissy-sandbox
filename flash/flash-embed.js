/**
 * @module   将 swf 嵌入到页面中
 * @author   kingfo<oicuicu@gmail.com> , lifesinger@gmail.com
 * @depends  ks-core + json
 */
KISSY.add('flash-embed', function(S) {

    var UA = S.UA, DOM = S.DOM, Flash = S.Flash,

        SWF_SUCCESS = 1,
        FP_LOW = 0,
        FP_UNINSTALL = -1,
        TARGET_NOT_FOUND = -2,  // 指定 ID 的对象未找到
        SWF_SRC_UNDEFINED = -3, // swf 的地址未指定

        RE_FLASH_TAGS = /object|embed/i,
        CID = 'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000',
        TYPE = 'application/x-shockwave-flash',
        FLASHVARS = 'flashvars', EMPTY = '',
		OBJECT ='object',
        PREFIX = 'ks-flash-', ID_PRE = '#',
        encode = encodeURIComponent,

        // flash player 的参数范围
        PARAMS = {
            ////////////////////////// 高频率使用的参数
            //flashvars: EMPTY,     // swf 传入的第三方数据。支持复杂的 Object / XML 数据 / JSON 字符串
            wmode: EMPTY,
            allowscriptaccess: EMPTY,
            allownetworking: EMPTY,
            allowfullscreen: EMPTY,
            ///////////////////////// 显示 控制 删除 
            play: 'false',
            loop: EMPTY,
            menu: EMPTY,
            quality: EMPTY,
            scale: EMPTY,
            salign: EMPTY,
            bgcolor: EMPTY,
            devicefont: EMPTY,
            /////////////////////////	其他控制参数
            base: EMPTY,
            swliveconnect: EMPTY,
            seamlesstabbing: EMPTY
        },

        defaultConifg = {
            //src: '',       // swf 路径
            params: { },     // Flash Player 的配置参数
            attrs: {         // swf 对应 DOM 元素的属性
                width: 215,	 // 最小控制面板宽度,小于此数字将无法支持在线快速安装. 
                height: 138  //最小控制面板高度,小于此数字将无法支持在线快速安装. 
            },
            //xi: '',	     //	快速安装地址。全称 express install  // ? 默认路径
            version: 9       //	要求的 Flash Player 最低版本
        };


    S.mix(Flash, {

        fpv: UA.fpv,

        fpvGEQ: UA.fpvGEQ,

        len: function () {
            return Flash.swfs.length;
        },

        /**
         * 添加 SWF 对象
         * @param target {String|HTMLElement}  #id or element
         */
        add: function(target, config, callback) {
            var self = this, xi, id;

			//	标准化配置信息
			//config = Flash._normal(config);

            // 合并配置信息
            config = S.merge(defaultConifg, config);
            config.attrs = S.merge(defaultConifg.attrs, config.attrs);


            // 1. target 元素未找到
            if (!(target = S.get(target))) {
                self._callback(callback, TARGET_NOT_FOUND);
                return;
            }

            // 保存 id, 没有则自动生成
            if (!target.id) target.id = S.guid(PREFIX);
            id = config.attrs.id = ID_PRE + target.id;

            // 2. flash 插件没有安装
            if (!UA.fpv()) {
                self._callback(callback, FP_UNINSTALL, id, target);
                return;
            }

            // 3. 已安装，但当前客户端版本低于指定版本时
            if (!UA.fpvGEQ(config.version)) {
                self._callback(callback, FP_LOW, id, target);

                // 有 xi 时，将 src 替换为快速安装
                if (!((xi = config.xi) && S.isString(xi))) return;
                config.src = xi;
            }

            // 对已有 HTML 结构的 SWF 进行注册使用
            if (RE_FLASH_TAGS.test(target.nodeName)) {
                self._register(target, config, callback);
                return;
            }

            // src 未指定
            if (!config.src) {
                self._callback(callback, SWF_SRC_UNDEFINED, id, target);
                return;
            }
			
			
            // 替换 target 为 SWF 嵌入对象
            self._embed(target, config, callback);
        },

        /**
         * 获得已注册到 S.Flash 的 SWF
         * 注意，请不要混淆 DOM.get() 和 Flash.get()
         * 只有成功执行过 S.Flash.add() 的 SWF 才可以被获取
         * @return {HTMLElement}  返回 SWF 的 HTML 元素(object/embed). 未注册时，返回 undefined
         */
        get: function(id) {
            return Flash.swfs[id];
        },

        /**
         * 移除已注册到 S.Flash 的 SWF 和 DOM 中对应的 HTML 元素
         */
        remove: function(id) {
            var swf = Flash.get(id);
            if (swf) {
                DOM.remove(swf);
                delete Flash.swfs['#' + swf.id];
                Flash.swfs.length -= 1;
            }
        },

        /**
         * 检测是否存在已注册的 swf
         * 只有成功执行过 S.Flash.add() 的 SWF 才可以被获取到
         * @return {Boolean}
         */
        contains: function(target) {
            var swfs = Flash.swfs,
                id, ret = false;

            if (S.isString(target)) {
                ret = (target in swfs);
            } else {
                for (id in swfs)
                    if (swfs[id] === target) {
                        ret = true;
                        break;
                    }
            }
            return ret;
        },
		
		_normal:function(obj){
			//	将 对象的 Key 转为 全小写
			//	一般用于配置选项 key的 标准化 
			var key,value,prop;
			if (obj === null || obj === undefined)return obj;
			if((typeof obj) == OBJECT /*&& !obj.push*/){
				for (prop in obj){
					key = (prop+"").toLowerCase();  // fix: arguments  array .
					// 忽略自定义传参内容标准化
					value = obj[prop];
					if(key != FLASHVARS)value = Flash._normal(value);
					obj[prop] = null;
					delete obj[prop];
					obj[key] = value;
				}
			}
			return obj;
		},
        _register: function(swf, config, callback) {
            var id = config.attrs.id;
            Flash._addSWF(id, swf);
            Flash._callback(callback, SWF_SUCCESS, id, swf);
        },

        _embed: function (target, config, callback) {
            var o = Flash._createSWF(config.src, config.attrs, config.params);
			
            if (UA.ie) {
                // ie 下，通过纯 dom 操作插入的 object 会一直处于加载状态中
                // 只能通过 innerHTML/outerHTML 嵌入
                target.outerHTML = o.outerHTML;
            }
            else {
                target.parentNode.replaceChild(o, target);
            }

            Flash._register(target, config, callback);
        },

        _callback: function(callback, type, id, swf) {
            if (type && S.isFunction(callback)) {
                callback({
                    status: type,
                    id: id,
                    swf: swf
                });
            }
        },

        _addSWF: function(id, swf) {
            if (id && swf) {
                Flash.swfs[id] = swf;
                Flash.swfs.length += 1;
            }
        },

        _createSWF: function (src, attrs, params) {
            var o = DOM.create('<object>'), k;

            // 普通属性设置
            DOM.attr(o, attrs);

            // 特殊属性设置
            if (UA.ie) {
                DOM.attr(o, 'classid', CID);
                appendParam(o, 'movie', src);
            }
            else {
                DOM.attr(o, {
                    type: TYPE,
                    data: src,
                    name: attrs.id
                });
            }
			
            // 添加 params
            for (k in params) {
                if (k in PARAMS) appendParam(o, k, params[k]);
            }
            if (params[FLASHVARS]) {
                appendParam(o, FLASHVARS,  toFlashVars(params[FLASHVARS]));
            }
			
			
		
            return o;
        }
    });

    function appendParam(o, name, src) {
        var param = DOM.create('<param>');
        DOM.attr(param, { name: name, value: src });
        o.appendChild(param);
    }

    // 转换成 AS 能识别的 JSON 数据串
//    function stringify(o) {
//        //if (S.isString(o)) return encode(o);
//		
//        // stringify => {"a":{"x":1,"z":"c=z&d=3"},"b":"http://a.tbcdn.cn/?d=x&ff"}
//        // 接着还需要将字符串值 encodeURIComponent
//		
////        return S.JSON.stringify(o).replace(/:"([^"]+)/g, function(m, val) {
////            return ':"' + encode(val);
////        });
//    }
	
	
	function toFlashVars(obj){
		/*
		 * any in obj
		 * if type of obj key is Object try to JSON;
			example:
		 		1.	obj <=  {	s:"string",
		 						b:false,
		 						n:1,
		 						nul:null,
		 						und:undefined,
		 						url:"http://taobao.com/?x=1&z=2",
		 						o:{
		 							s:"string",
		 							b:false,
		 							n:1,
		 							url:"http://taobao.com/?x=1&z=2"
		 						}
		 					};
		 		2. toFlashVars => s="string"&b=false&n=1&nul=null&url="http%3A%2F%2Ftaobao.com%2F%3Fx%3D1%26z%3D2"&o="{"s":"string","b":false,"n":1,"url":"http%3A%2F%2Ftaobao.com%2F%3Fx%3D1%26z%3D2"}"
		*/
		var prop,data,a =[];
		if (obj === null || obj === undefined) { return null; }
		for(prop in obj){
			data = obj[prop];
			if (data === null || data === undefined){
				data = "";   //continue?
			}else if((typeof data) == OBJECT ){
				data = '"' + S.JSON.stringify(data).replace(/:"([^"]+)/g, function(m, val) {
            		return ':"' + encode(val);
       			}) +'"';
			}else{
				data = encode(data);
			}
			a.push(prop + "=" + data);
		}
//		return S.param(obj); // 不能直接使用， 因为 JSON的必要 “ 会被编码 。
		return a.join("&");
		
	}

});

/**
 * NOTES:
 * 2010/07/21   向 google code 提交了基础代码
 * 2010/07/22   修正了 embed 始终都有 callback 尝试性调用
 *              避免了未定义 el/id 或 swfurl 时无法获知错误
 * 2010/07/27   迁移至 github 做版本管理。向 kissy-sandbox 提交代码
 * 2010/07/28   合并了公开方法 Flash.register 和 Flash.embed 为 Flash.add()
 *              修改 Flash.length() 为 Flash.getLength(), 使其看上去更像方法而非属性方式获取
 * 2010/07/29   重构到 kissy 项目中 by yubo
 * 2010/07/30	增加了标准化配置项方法 _normal();	  修正  flashvars转String方式为  toFlashVars。
 */
