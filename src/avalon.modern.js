/*==================================================
 Copyright (c) 2013-2014 司徒正美 and other contributors
 http://www.cnblogs.com/rubylouvre/
 https://github.com/RubyLouvre
 http://weibo.com/jslouvre/
 
 Released under the MIT license
 avalon 1.3.7 2014.11.17 support IE10 and other latest browsers
 ==================================================*/
(function(DOC) {
    var expose = Date.now()
    var subscribers = "$" + expose
    //http://stackoverflow.com/questions/3277182/how-to-get-the-global-object-in-javascript
    var window = Function("return this")()
    var otherRequire = window.require
    var otherDefine = window.define
    var stopRepeatAssign = false
    var rword = /[^, ]+/g //切割字符串为一个个小块，以空格或豆号分开它们，结合replace实现字符串的forEach
    var rcomplexType = /^(?:object|array)$/
    var rsvg = /^\[object SVG\w*Element\]$/
    var rwindow = /^\[object (Window|DOMWindow|global)\]$/
    var oproto = Object.prototype
    var ohasOwn = oproto.hasOwnProperty
    var serialize = oproto.toString
    var ap = Array.prototype
    var aslice = ap.slice
    var Registry = {} //将函数曝光到此对象上，方便访问器收集依赖
    var head = DOC.head //HEAD元素
    var root = DOC.documentElement
    var hyperspace = DOC.createDocumentFragment()
    var cinerator = DOC.createElement("div")
    var class2type = {}
    "Boolean Number String Function Array Date RegExp Object Error".replace(rword, function(name) {
        class2type["[object " + name + "]"] = name.toLowerCase()
    })

    function noop() {
    }

    function log() {
        if (avalon.config.debug) {
// http://stackoverflow.com/questions/8785624/how-to-safely-wrap-console-log
            console.log.apply(console, arguments)
        }
    }
    function oneObject(array, val) {
        if (typeof array === "string") {
            array = array.match(rword) || []
        }
        var result = {},
                value = val !== void 0 ? val : 1
        for (var i = 0, n = array.length; i < n; i++) {
            result[array[i]] = value
        }
        return result
    }
    /*生成UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript*/
    function generateID() {
        return "avalon" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }
    /*********************************************************************
     *                  avalon的静态方法定义区                                   *
     **********************************************************************/
    window.avalon = function(el) { //创建jQuery式的无new 实例化结构
        return new avalon.init(el)
    }
    avalon.init = function(el) {
        this[0] = this.element = el
    }
    avalon.fn = avalon.prototype = avalon.init.prototype
    avalon.isFunction = isFunction
    function isFunction(fn) {
        return typeof fn === "function"
    }
    /*取得目标类型*/
    avalon.type = function(obj) {
        if (obj == null) {
            return String(obj)
        }
// 早期的webkit内核浏览器实现了已废弃的ecma262v4标准，可以将正则字面量当作函数使用，因此typeof在判定正则时会返回function
        return typeof obj === "object" || typeof obj === "function" ?
                class2type[serialize.call(obj)] || "object" :
                typeof obj
    }

    avalon.isWindow = function(obj) {
        return rwindow.test(serialize.call(obj))
    }

    /*判定是否是一个朴素的javascript对象（Object），不是DOM对象，不是BOM对象，不是自定义类的实例*/
    avalon.isPlainObject = function(obj) {
        return !!obj && typeof obj === "object" && Object.getPrototypeOf(obj) === oproto
    }

    avalon.mix = avalon.fn.mix = function() {
        var options, name, src, copy, copyIsArray, clone,
                target = arguments[0] || {},
                i = 1,
                length = arguments.length,
                deep = false

        // 如果第一个参数为布尔,判定是否深拷贝
        if (typeof target === "boolean") {
            deep = target
            target = arguments[1] || {}
            i++
        }

//确保接受方为一个复杂的数据类型
        if (typeof target !== "object" && avalon.type(target) !== "function") {
            target = {}
        }

//如果只有一个参数，那么新成员添加于mix所在的对象上
        if (i === length) {
            target = this
            i--
        }

        for (; i < length; i++) {
//只处理非空参数
            if ((options = arguments[i]) != null) {
                for (name in options) {
                    src = target[name]
                    copy = options[name]

                    // 防止环引用
                    if (target === copy) {
                        continue
                    }
                    if (deep && copy && (avalon.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false
                            clone = src && Array.isArray(src) ? src : []

                        } else {
                            clone = src && avalon.isPlainObject(src) ? src : {}
                        }

                        target[name] = avalon.mix(deep, clone, copy)
                    } else if (copy !== void 0) {
                        target[name] = copy
                    }
                }
            }
        }
        return target
    }

    avalon.mix({
        rword: rword,
        subscribers: subscribers,
        version: 1.36,
        ui: {},
        log: log,
        noop: noop,
        error: function(str, e) { //如果不用Error对象封装一下，str在控制台下可能会乱码
            throw new (e || Error)(str)
        },
        oneObject: oneObject,
        /* avalon.range(10)
         => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
         avalon.range(1, 11)
         => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
         avalon.range(0, 30, 5)
         => [0, 5, 10, 15, 20, 25]
         avalon.range(0, -10, -1)
         => [0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
         avalon.range(0)
         => []*/
        range: function(start, end, step) { // 用于生成整数数组
            step || (step = 1)
            if (end == null) {
                end = start || 0
                start = 0
            }
            var index = -1,
                    length = Math.max(0, Math.ceil((end - start) / step)),
                    result = Array(length)
            while (++index < length) {
                result[index] = start
                start += step
            }
            return result
        },
        slice: function(nodes, start, end) {
            return aslice.call(nodes, start, end)
        },
        eventHooks: {},
        bind: function(el, type, fn, phase) {
            var hooks = avalon.eventHooks
            var hook = hooks[type]
            if (typeof hook === "object") {
                type = hook.type
                if (hook.deel) {
                    fn = hook.deel(el, fn)
                }
            }
            el.addEventListener(type, fn, !!phase)
            return fn
        },
        unbind: function(el, type, fn, phase) {
            var hooks = avalon.eventHooks
            var hook = hooks[type]
            if (typeof hook === "object") {
                type = hook.type
            }
            el.removeEventListener(type, fn || noop, !!phase)
        },
        css: function(node, name, value) {
            if (node instanceof avalon) {
                node = node[0]
            }
            var prop = /[_-]/.test(name) ? camelize(name) : name
            name = avalon.cssName(prop) || prop
            if (value === void 0 || typeof value === "boolean") { //获取样式
                var fn = cssHooks[prop + ":get"] || cssHooks["@:get"]
                if (name === "background") {
                    name = "backgroundColor"
                }
                var val = fn(node, name)
                return value === true ? parseFloat(val) || 0 : val
            } else if (value === "") { //请除样式
                node.style[name] = ""
            } else { //设置样式
                if (value == null || value !== value) {
                    return
                }
                if (isFinite(value) && !avalon.cssNumber[prop]) {
                    value += "px"
                }
                fn = cssHooks[prop + ":set"] || cssHooks["@:set"]
                fn(node, name, value)
            }
        },
        each: function(obj, fn) {
            if (obj) { //排除null, undefined
                var i = 0
                if (isArrayLike(obj)) {
                    for (var n = obj.length; i < n; i++) {
                        fn(i, obj[i])
                    }
                } else {
                    for (i in obj) {
                        if (obj.hasOwnProperty(i)) {
                            fn(i, obj[i])
                        }
                    }
                }
            }
        },
        getWidgetData: function(elem, prefix) {
            var raw = avalon(elem).data()
            var result = {}
            for (var i in raw) {
                if (i.indexOf(prefix) === 0) {
                    result[i.replace(prefix, "").replace(/\w/, function(a) {
                        return a.toLowerCase()
                    })] = raw[i]
                }
            }
            return result
        },
        parseJSON: JSON.parse,
        Array: {
            /*只有当前数组不存在此元素时只添加它*/
            ensure: function(target, item) {
                if (target.indexOf(item) === -1) {
                    return target.push(item)
                }
            },
            /*移除数组中指定位置的元素，返回布尔表示成功与否*/
            removeAt: function(target, index) {
                return !!target.splice(index, 1).length
            },
            /*移除数组中第一个匹配传参的那个元素，返回布尔表示成功与否*/
            remove: function(target, item) {
                var index = target.indexOf(item)
                if (~index)
                    return avalon.Array.removeAt(target, index)
                return false
            }
        }
    })


    /*判定是否类数组，如节点集合，纯数组，arguments与拥有非负整数的length属性的纯JS对象*/
    function isArrayLike(obj) {
        if (obj && typeof obj === "object") {
            var n = obj.length,
                    str = serialize.call(obj)
            if (/(Array|List|Collection|Map|Arguments)\]$/.test(str)) {
                return true
            } else if (str === "[object Object]" && (+n === n && !(n % 1) && n >= 0)) {
                return true //由于ecma262v5能修改对象属性的enumerable，因此不能用propertyIsEnumerable来判定了
            }
        }
        return false
    }

    /*视浏览器情况采用最快的异步回调*/
    avalon.nextTick = window.setImmediate ? setImmediate.bind(window) : function(callback) {
        setTimeout(callback, 0)
    }
    /*********************************************************************
     *                           DOM 底层补丁                             *
     **********************************************************************/
    if (!root.contains) { //safari5+是把contains方法放在Element.prototype上而不是Node.prototype
        Node.prototype.contains = function(arg) {
            return !!(this.compareDocumentPosition(arg) & 16)
        }
    }
    avalon.contains = function(root, el) {
        try {
            while ((el = el.parentNode))
                if (el === root)
                    return true;
            return false
        } catch (e) {
            return false
        }
    }
    if (window.SVGElement) {
        var svgns = "http://www.w3.org/2000/svg"
        var svg = DOC.createElementNS(svgns, "svg")
        svg.innerHTML = '<circle cx="50" cy="50" r="40" fill="red" />'
        if (!rsvg.test(svg.firstChild)) {// #409
            function enumerateNode(node, targetNode) {
                if (node && node.childNodes) {
                    var nodes = node.childNodes
                    for (var i = 0, el; el = nodes[i++]; ) {
                        if (el.tagName) {
                            var svg = DOC.createElementNS(svgns,
                                    el.tagName.toLowerCase())
                            // copy attrs
                            ap.forEach.call(el.attributes, function(attr) {
                                svg.setAttribute(attr.name, attr.value)
                            })
                            // 递归处理子节点
                            enumerateNode(el, svg)
                            targetNode.appendChild(svg)
                        }
                    }
                }
            }
            Object.defineProperties(SVGElement.prototype, {
                "outerHTML": {//IE9-11,firefox不支持SVG元素的innerHTML,outerHTML属性
                    enumerable: true,
                    configurable: true,
                    get: function() {
                        return new XMLSerializer().serializeToString(this)
                    },
                    set: function(html) {
                        var tagName = this.tagName.toLowerCase(),
                                par = this.parentNode,
                                frag = avalon.parseHTML(html)
                        // 操作的svg，直接插入
                        if (tagName === "svg") {
                            par.insertBefore(frag, this)
                            // svg节点的子节点类似
                        } else {
                            var newFrag = DOC.createDocumentFragment()
                            enumerateNode(frag, newFrag)
                            par.insertBefore(newFrag, this)
                        }
                        par.removeChild(this)
                    }
                },
                "innerHTML": {
                    enumerable: true,
                    configurable: true,
                    get: function() {
                        var s = this.outerHTML
                        var ropen = new RegExp("<" + this.nodeName + '\\b(?:(["\'])[^"]*?(\\1)|[^>])*>', "i")
                        var rclose = new RegExp("<\/" + this.nodeName + ">$", "i")
                        return  s.replace(ropen, "").replace(rclose, "")
                    },
                    set: function(html) {
                        if (avalon.clearHTML) {
                            avalon.clearHTML(this)
                            var frag = avalon.parseHTML(html)
                            enumerateNode(frag, this)
                        }
                    }
                }
            })
        }
    }
    /*********************************************************************
     *                           modelFactory                              *
     **********************************************************************/
    //avalon最核心的方法的两个方法之一（另一个是avalon.scan），返回一个ViewModel(VM)
    var VMODELS = avalon.vmodels = {}
    avalon.define = function(id, factory) {
        var $id = id.$id || id
        if (!$id) {
            log("warning: 必须指定$id")
        }
        if (VMODELS[$id]) {
            log("warning: " + $id + " 已经存在于avalon.vmodels中")
        }
        if (typeof id === "object") {
            var model = modelFactory(id)
        } else {
            var scope = {
                $watch: noop
            }
            factory(scope) //得到所有定义
            model = modelFactory(scope) //偷天换日，将scope换为model
            stopRepeatAssign = true
            factory(model)
            stopRepeatAssign = false
        }
        model.$id = $id
        return VMODELS[$id] = model
    }


    //一些不需要被监听的属性
    var $$skipArray = String("$id,$watch,$unwatch,$fire,$events,$model,$skipArray").match(rword)
    function isObservable(name, value, $skipArray) {
        if (isFunction(value) || value && value.nodeType) {
            return false
        }
        if ($skipArray.indexOf(name) !== -1) {
            return false
        }
        if ($$skipArray.indexOf(name) !== -1) {
            return false
        }
        var $special = $skipArray.$special
        if (name && name.charAt(0) === "$" && !$special[name]) {
            return false
        }
        return true
    }

    function modelFactory($scope, $special, $model) {
        if (Array.isArray($scope)) {
            var arr = $scope.concat()
            $scope.length = 0
            var collection = Collection($scope)
            collection.pushArray(arr)
            return collection
        }
        if (typeof $scope.nodeType === "number") {
            return $scope
        }
        if ($scope.$id && $scope.$model && $scope.$events) {//fix IE6-8 createWithProxy $val: val引发的BUG
            return $scope
        }
        if (!Array.isArray($scope.$skipArray)) {
            $scope.$skipArray = []
        }
        $scope.$skipArray.$special = $special || {}//强制要监听的属性
        var $vmodel = {} //要返回的对象, 它在IE6-8下可能被偷龙转凤
        $model = $model || {}  //vmodels.$model属性
        var $events = {} //vmodel.$events属性
        var watchedProperties = {} //监控属性
        var computedProperties = []  //计算属性
        for (var i in $scope) {
            (function(name, val) {
                $model[name] = val
                if (!isObservable(name, val, $scope.$skipArray)) {
                    return  //过滤所有非监控属性
                }
                //总共产生三种accessor
                var accessor
                var valueType = avalon.type(val)
                $events[name] = []
                //总共产生三种accessor
                if (valueType === "object" && isFunction(val.get) && Object.keys(val).length <= 2) {
                    var setter = val.set
                    var getter = val.get
                    //第1种对应计算属性， 因变量，通过其他监控属性触发其改变
                    accessor = function(newValue) {
                        var $events = $vmodel.$events
                        var oldValue = $model[name]
                        if (arguments.length) {
                            if (stopRepeatAssign) {
                                return
                            }
                            if (isFunction(setter)) {
                                var backup = $events[name]
                                $events[name] = [] //清空回调，防止内部冒泡而触发多次$fire
                                setter.call($vmodel, newValue)
                                $events[name] = backup
                            }
                        } else {
                            if (avalon.openComputedCollect) { // 收集视图刷新函数
                                collectSubscribers($events[name])
                            }
                        }
                        newValue = $model[name] = getter.call($vmodel) //同步$model
                        if (!isEqual(oldValue, newValue)) {
                            withProxyCount && updateWithProxy($vmodel.$id, name, newValue) //同步循环绑定中的代理VM
                            notifySubscribers($events[name]) //同步视图
                            safeFire($vmodel, name, newValue, oldValue) //触发$watch回调
                        }
                        return newValue
                    }
                    computedProperties.push(function() {
                        Registry[expose] = {
                            evaluator: accessor,
                            element: head,
                            type: "computed::" + name,
                            handler: noop,
                            args: []
                        }
                        accessor()
                        collectSubscribers($events[name])
                        delete Registry[expose]
                    })
                } else if (rcomplexType.test(valueType)) {
                    //第2种对应子ViewModel或监控数组 
                    accessor = function(newValue) {
                        var childVmodel = accessor.child
                        var oldValue = $model[name]
                        if (arguments.length) {
                            if (stopRepeatAssign) {
                                return
                            }
                            if (!isEqual(oldValue, newValue)) {
                                childVmodel = accessor.child = updateChild($vmodel, name, newValue, valueType)
                                newValue = $model[name] = childVmodel.$model //同步$model
                                var fn = rebindings[childVmodel.$id]
                                fn && fn() //同步视图
                                safeFire($vmodel, name, newValue, oldValue)  //触发$watch回调
                            }
                        } else {
                            collectSubscribers($events[name]) //收集视图函数
                            return childVmodel
                        }
                    }
                    var childVmodel = accessor.child = modelFactory(val, 0, $model[name])
                    childVmodel.$events[subscribers] = $events[name]
                } else {
                    //第3种对应简单的数据类型，自变量，监控属性
                    accessor = function(newValue) {
                        var oldValue = $model[name]
                        if (arguments.length) {
                            if (!isEqual(oldValue, newValue)) {
                                $model[name] = newValue //同步$model
                                withProxyCount && updateWithProxy($vmodel.$id, name, newValue) //同步代理VM
                                notifySubscribers($events[name]) //同步视图
                                safeFire($vmodel, name, newValue, oldValue) //触发$watch回调
                            }
                        } else {
                            collectSubscribers($events[name])
                            return oldValue
                        }
                    }
                }
                watchedProperties[name] = accessor
            })(i, $scope[i])
        }
        $$skipArray.forEach(function(name) {
            delete $scope[name]
            delete $model[name]  //这些特殊属性不应该在$model中出现
        })

        Object.defineProperties($vmodel, descriptorFactory(watchedProperties)) //生成一个空的ViewModel
        for (var name in $scope) {
            if (!watchedProperties[name]) {
                $vmodel[name] = $scope[name]
            }
        }
        //添加$id, $model, $events, $watch, $unwatch, $fire
        $vmodel.$id = generateID()
        $vmodel.$model = $model
        $vmodel.$events = $events
        for (var i in EventManager) {
            var fn = EventManager [i]
            $vmodel[i] = fn
        }
        Object.defineProperty($vmodel, "hasOwnProperty", {
            value: function(name) {
                return name in $vmodel.$model
            },
            writable: false,
            enumerable: false,
            configurable: true
        })
        computedProperties.forEach(function(collect) {
            collect()//收集依赖
        })
        return $vmodel
    }


    var isEqual = Object.is || function(v1, v2) {
        if (v1 === 0 && v2 === 0) {
            return 1 / v1 === 1 / v2
        } else if (v1 !== v1) {
            return v2 !== v2
        } else {
            return v1 === v2;
        }
    }

    function safeFire(a, b, c, d) {
        if (a.$events) {
            EventManager.$fire.call(a, b, c, d)
        }
    }

    function descriptorFactory(obj) {
        var descriptors = {}
        for (var i in obj) {
            descriptors[i] = {
                get: obj[i],
                set: obj[i],
                enumerable: true,
                configurable: true
            }
        }
        return descriptors
    }

    //ms-with, ms-repeat绑定生成的代理对象储存池
    var withProxyPool = {}
    var withProxyCount = 0
    var rebindings = {}

    function updateWithProxy($id, name, val) {
        var pool = withProxyPool[$id]
        if (pool && pool[name]) {
            pool[name].$val = val
        }
    }

    //应用于第2种accessor
    function updateChild(parent, name, value, valueType) {
        //a为原来的VM， b为新数组或新对象
        var son = parent[name]
        if (valueType === "array") {
            if (!Array.isArray(value) || son === value) {
                return son //fix https://github.com/RubyLouvre/avalon/issues/261
            }
            son.clear()
            son.pushArray(value.concat())
            return son
        } else {
            var iterators = parent.$events[name]
            if (withProxyPool[son.$id]) {
                withProxyCount--
                delete withProxyPool[son.$id]
            }
            var ret = modelFactory(value)
            ret.$events[subscribers] = iterators
            rebindings[ret.$id] = function(data) {
                while (data = iterators.shift()) {
                    (function(el) {
                        if (el.type) { //重新绑定
                            avalon.nextTick(function() {
                                el.rollback && el.rollback() //还原 ms-with ms-on
                                bindingHandlers[el.type](el, el.vmodels)
                            })
                        }
                    })(data)
                }
                delete rebindings[ret.$id]
            }
            return ret
        }
    }

    /*********************************************************************
     *                       配置系统                                     *
     **********************************************************************/
    function kernel(settings) {
        for (var p in settings) {
            if (!ohasOwn.call(settings, p))
                continue
            var val = settings[p]
            if (typeof kernel.plugins[p] === "function") {
                kernel.plugins[p](val)
            } else if (typeof kernel[p] === "object") {
                avalon.mix(kernel[p], val)
            } else {
                kernel[p] = val
            }
        }
        return this
    }
    var openTag, closeTag, rexpr, rexprg, rbind, rregexp = /[-.*+?^${}()|[\]\/\\]/g
    /*将字符串安全格式化为正则表达式的源码 http://stevenlevithan.com/regex/xregexp/*/
    function escapeRegExp(target) {
        return (target + "").replace(rregexp, "\\$&")
    }
    var innerRequire = noop
    var plugins = {
        loader: function(builtin) {
            window.define = builtin ? innerRequire.define : otherDefine
            window.require = builtin ? innerRequire : otherRequire
        },
        interpolate: function(array) {
            openTag = array[0]
            closeTag = array[1]
            if (openTag === closeTag) {
                avalon.error("openTag!==closeTag", SyntaxError)
            } else if (array + "" === "<!--,-->") {
                kernel.commentInterpolate = true
            } else {
                var test = openTag + "test" + closeTag
                cinerator.innerHTML = test
                if (cinerator.innerHTML !== test && cinerator.innerHTML.indexOf("&lt;") >= 0) {
                    avalon.error("此定界符不合法", SyntaxError)
                }
                cinerator.innerHTML = ""
            }
            var o = escapeRegExp(openTag),
                    c = escapeRegExp(closeTag)
            rexpr = new RegExp(o + "(.*?)" + c)
            rexprg = new RegExp(o + "(.*?)" + c, "g")
            rbind = new RegExp(o + ".*?" + c + "|\\sms-")
        }
    }
    kernel.debug = true
    kernel.plugins = plugins
    kernel.plugins['interpolate'](["{{", "}}"])
    kernel.paths = {}
    kernel.shim = {}
    kernel.maxRepeatSize = 100
    avalon.config = kernel

    /*********************************************************************
     *                        avalon的原型方法定义区                        *
     **********************************************************************/


    function hyphen(target) {
        //转换为连字符线风格
        return target.replace(/([a-z\d])([A-Z]+)/g, "$1-$2").toLowerCase()
    }
    function camelize(target) {
        //转换为驼峰风格
        if (target.indexOf("-") < 0 && target.indexOf("_") < 0) {
            return target //提前判断，提高getStyle等的效率
        }
        return target.replace(/[-_][^-_]/g, function(match) {
            return match.charAt(1).toUpperCase()
        })
    }

    "add,remove".replace(rword, function(method) {
        avalon.fn[method + "Class"] = function(cls) {
            var el = this[0]
            //https://developer.mozilla.org/zh-CN/docs/Mozilla/Firefox/Releases/26
            if (cls && typeof cls === "string" && el && el.nodeType === 1) {
                cls.replace(/\S+/g, function(c) {
                    el.classList[method](c)
                })
            }
            return this
        }
    })

    avalon.fn.mix({
        hasClass: function(cls) {
            var el = this[0] || {} //IE10+, chrome8+, firefox3.6+, safari5.1+,opera11.5+支持classList,chrome24+,firefox26+支持classList2.0
            return el.nodeType === 1 && el.classList.contains(cls)
        },
        toggleClass: function(value, stateVal) {
            var className, i = 0
            var classNames = value.split(/\s+/)
            var isBool = typeof stateVal === "boolean"
            while ((className = classNames[i++])) {
                var state = isBool ? stateVal : !this.hasClass(className)
                this[state ? "addClass" : "removeClass"](className)
            }
            return this
        },
        attr: function(name, value) {
            if (arguments.length === 2) {
                this[0].setAttribute(name, value)
                return this
            } else {
                return this[0].getAttribute(name)
            }
        },
        data: function(name, value) {
            name = "data-" + hyphen(name || "")
            switch (arguments.length) {
                case 2:
                    this.attr(name, value)
                    return this
                case 1:
                    var val = this.attr(name)
                    return parseData(val)
                case 0:
                    var ret = {}
                    ap.forEach.call(this[0].attributes, function(attr) {
                        if (attr) {
                            name = attr.name
                            if (!name.indexOf("data-")) {
                                name = camelize(name.slice(5))
                                ret[name] = parseData(attr.value)
                            }
                        }
                    })
                    return ret
            }
        },
        removeData: function(name) {
            name = "data-" + hyphen(name)
            this[0].removeAttribute(name)
            return this
        },
        css: function(name, value) {
            if (avalon.isPlainObject(name)) {
                for (var i in name) {
                    avalon.css(this, i, name[i])
                }
            } else {
                var ret = avalon.css(this, name, value)
            }
            return ret !== void 0 ? ret : this
        },
        position: function() {
            var offsetParent, offset,
                    elem = this[0],
                    parentOffset = {
                        top: 0,
                        left: 0
                    };
            if (!elem) {
                return
            }
            if (this.css("position") === "fixed") {
                offset = elem.getBoundingClientRect()
            } else {
                offsetParent = this.offsetParent() //得到真正的offsetParent
                offset = this.offset() // 得到正确的offsetParent
                if (offsetParent[0].tagName !== "HTML") {
                    parentOffset = offsetParent.offset()
                }
                parentOffset.top += avalon.css(offsetParent[0], "borderTopWidth", true)
                parentOffset.left += avalon.css(offsetParent[0], "borderLeftWidth", true)
            }
            return {
                top: offset.top - parentOffset.top - avalon.css(elem, "marginTop", true),
                left: offset.left - parentOffset.left - avalon.css(elem, "marginLeft", true)
            }
        },
        offsetParent: function() {
            var offsetParent = this[0].offsetParent || root
            while (offsetParent && (offsetParent.tagName !== "HTML") && avalon.css(offsetParent, "position") === "static") {
                offsetParent = offsetParent.offsetParent
            }
            return avalon(offsetParent || root)
        },
        bind: function(type, fn, phase) {
            if (this[0]) { //此方法不会链
                return avalon.bind(this[0], type, fn, phase)
            }
        },
        unbind: function(type, fn, phase) {
            if (this[0]) {
                avalon.unbind(this[0], type, fn, phase)
            }
            return this
        },
        val: function(value) {
            var node = this[0]
            if (node && node.nodeType === 1) {
                var get = arguments.length === 0
                var access = get ? ":get" : ":set"
                var fn = valHooks[getValType(node) + access]
                if (fn) {
                    var val = fn(node, value)
                } else if (get) {
                    return (node.value || "").replace(/\r/g, "")
                } else {
                    node.value = value
                }
            }
            return get ? val : this
        }
    })



    if (root.dataset) {
        avalon.fn.data = function(name, val) {
            var dataset = this[0].dataset
            switch (arguments.length) {
                case 2:
                    dataset[name] = val
                    return this
                case 1:
                    val = dataset[name]
                    return parseData(val)
                case 0:
                    var ret = {}
                    for (var name in dataset) {
                        ret[name] = parseData(dataset[name])
                    }
                    return ret
            }
        }
    }
    var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/

    function parseData(data) {
        try {
            data = data === "true" ? true :
                    data === "false" ? false :
                    data === "null" ? null : +data + "" === data ? +data : rbrace.test(data) ? JSON.parse(data) : data
        } catch (e) {
        }
        return data
    }
    avalon.each({
        scrollLeft: "pageXOffset",
        scrollTop: "pageYOffset"
    }, function(method, prop) {
        avalon.fn[method] = function(val) {
            var node = this[0] || {}, win = getWindow(node),
                    top = method === "scrollTop"
            if (!arguments.length) {
                return win ? win[prop] : node[method]
            } else {
                if (win) {
                    win.scrollTo(!top ? val : avalon(win).scrollLeft(), top ? val : avalon(win).scrollTop())
                } else {
                    node[method] = val
                }
            }
        }
    })

    function getWindow(node) {
        return node.window && node.document ? node : node.nodeType === 9 ? node.defaultView : false
    }

    //=============================css相关==================================
    var cssHooks = avalon.cssHooks = {}
    var prefixes = ["", "-webkit-", "-moz-", "-ms-"]//去掉opera-15的支持
    var cssMap = {
        "float": "cssFloat"
    }
    avalon.cssNumber = oneObject("columnCount,order,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom")

    avalon.cssName = function(name, host, camelCase) {
        if (cssMap[name]) {
            return cssMap[name]
        }
        host = host || root.style
        for (var i = 0, n = prefixes.length; i < n; i++) {
            camelCase = camelize(prefixes[i] + name)
            if (camelCase in host) {
                return (cssMap[name] = camelCase)
            }
        }
        return null
    }
    cssHooks["@:set"] = function(node, name, value) {
        node.style[name] = value
    }

    cssHooks["@:get"] = function(node, name) {
        if (!node || !node.style) {
            throw new Error("getComputedStyle要求传入一个节点 " + node)
        }
        var ret, computed = getComputedStyle(node, null)
        if (computed) {
            ret = name === "filter" ? computed.getPropertyValue(name) : computed[name]
            if (ret === "") {
                ret = node.style[name] //其他浏览器需要我们手动取内联样式
            }
        }
        return ret
    }
    cssHooks["opacity:get"] = function(node) {
        var ret = cssHooks["@:get"](node, "opacity")
        return ret === "" ? "1" : ret
    }

    "top,left".replace(rword, function(name) {
        cssHooks[name + ":get"] = function(node) {
            var computed = cssHooks["@:get"](node, name)
            return /px$/.test(computed) ? computed :
                    avalon(node).position()[name] + "px"
        }
    })
    var cssShow = {
        position: "absolute",
        visibility: "hidden",
        display: "block"
    }
    var rdisplayswap = /^(none|table(?!-c[ea]).+)/

    function showHidden(node, array) {
        //http://www.cnblogs.com/rubylouvre/archive/2012/10/27/2742529.html
        if (node.offsetWidth <= 0) { //opera.offsetWidth可能小于0
            var styles = getComputedStyle(node, null)
            if (rdisplayswap.test(styles["display"])) {
                var obj = {
                    node: node
                }
                for (var name in cssShow) {
                    obj[name] = styles[name]
                    node.style[name] = cssShow[name]
                }
                array.push(obj)
            }
            var parent = node.parentNode
            if (parent && parent.nodeType === 1) {
                showHidden(parent, array)
            }
        }
    }

    "Width,Height".replace(rword, function(name) {//fix 481
        var method = name.toLowerCase(),
                clientProp = "client" + name,
                scrollProp = "scroll" + name,
                offsetProp = "offset" + name
        cssHooks[method + ":get"] = function(node, which, override) {
            var boxSizing = -4
            if (typeof override === "number") {
                boxSizing = override
            }
            which = name === "Width" ? ["Left", "Right"] : ["Top", "Bottom"]
            var ret = node[offsetProp]   // border-box 0
            if (boxSizing === 2) {       // margin-box 2
                return ret
                        + avalon.css(node, "margin" + which[0], true)
                        + avalon.css(node, "margin" + which[1], true)
            }
            if (boxSizing < 0) {        // padding-box  -2
                ret = ret
                        - avalon.css(node, "border" + which[0] + "Width", true)
                        - avalon.css(node, "border" + which[1] + "Width", true)
            }
            if (boxSizing === -4) {     // content-box -4
                ret = ret
                        - avalon.css(node, "padding" + which[0], true)
                        - avalon.css(node, "padding" + which[1], true)
            }
            return ret
        }
        cssHooks[method + "&get"] = function(node) {
            var hidden = [];
            showHidden(node, hidden);
            var val = cssHooks[method + ":get"](node)
            for (var i = 0, obj; obj = hidden[i++]; ) {
                node = obj.node
                for (var n in obj) {
                    if (typeof obj[n] === "string") {
                        node.style[n] = obj[n]
                    }
                }
            }
            return val;
        }
        avalon.fn[method] = function(value) { //会忽视其display
            var node = this[0]
            if (arguments.length === 0) {
                if (node.setTimeout) { //取得窗口尺寸,IE9后可以用node.innerWidth /innerHeight代替
                    return node["inner" + name] || node.document.documentElement[clientProp]
                }
                if (node.nodeType === 9) { //取得页面尺寸
                    var doc = node.documentElement
                    //FF chrome    html.scrollHeight< body.scrollHeight
                    //IE 标准模式 : html.scrollHeight> body.scrollHeight
                    //IE 怪异模式 : html.scrollHeight 最大等于可视窗口多一点？
                    return Math.max(node.body[scrollProp], doc[scrollProp], node.body[offsetProp], doc[offsetProp], doc[clientProp])
                }
                return cssHooks[method + "&get"](node)
            } else {
                return this.css(method, value)
            }
        }
        avalon.fn["inner" + name] = function() {
            return cssHooks[method + ":get"](this[0], void 0, -2)
        }
        avalon.fn["outer" + name] = function(includeMargin) {
            return cssHooks[method + ":get"](this[0], void 0, includeMargin === true ? 2 : 0)
        }
    })
    avalon.fn.offset = function() { //取得距离页面左右角的坐标
        var node = this[0], box = {
            left: 0,
            top: 0
        }
        if (!node || !node.tagName || !node.ownerDocument) {
            return box
        }
        var doc = node.ownerDocument,
                root = doc.documentElement,
                win = doc.defaultView
        if (!root.contains(node)) {
            return box
        }
        if (node.getBoundingClientRect !== void 0) {
            box = node.getBoundingClientRect()
        }
        return {
            top: box.top + win.pageYOffset - root.clientTop,
            left: box.left + win.pageXOffset - root.clientLeft
        }
    }
    //=============================val相关=======================

    function getValType(el) {
        var ret = el.tagName.toLowerCase()
        return ret === "input" && /checkbox|radio/.test(el.type) ? "checked" : ret
    }
    var valHooks = {
        "select:get": function(node, value) {
            var option, options = node.options,
                    index = node.selectedIndex,
                    one = node.type === "select-one" || index < 0,
                    values = one ? null : [],
                    max = one ? index + 1 : options.length,
                    i = index < 0 ? max : one ? index : 0
            for (; i < max; i++) {
                option = options[i]
                //旧式IE在reset后不会改变selected，需要改用i === index判定
                //我们过滤所有disabled的option元素，但在safari5下，如果设置select为disable，那么其所有孩子都disable
                //因此当一个元素为disable，需要检测其是否显式设置了disable及其父节点的disable情况
                if ((option.selected || i === index) && !option.disabled) {
                    value = option.value
                    if (one) {
                        return value
                    }
                    //收集所有selected值组成数组返回
                    values.push(value)
                }
            }
            return values
        },
        "select:set": function(node, values, optionSet) {
            values = [].concat(values) //强制转换为数组
            for (var i = 0, el; el = node.options[i++]; ) {
                if ((el.selected = values.indexOf(el.value) >= 0)) {
                    optionSet = true
                }
            }
            if (!optionSet) {
                node.selectedIndex = -1
            }
        }
    }

    /************************************************************************
     *              HTML处理(parseHTML, innerHTML, clearHTML)                 *
     **************************************************************************/

    //parseHTML的辅助变量
    var tagHooks = new function() {
        avalon.mix(this, {
            option: DOC.createElement("select"),
            thead: DOC.createElement("table"),
            td: DOC.createElement("tr"),
            area: DOC.createElement("map"),
            tr: DOC.createElement("tbody"),
            col: DOC.createElement("colgroup"),
            legend: DOC.createElement("fieldset"),
            _default: DOC.createElement("div"),
            "g": DOC.createElementNS("http://www.w3.org/2000/svg", "svg")
        })
        this.optgroup = this.option
        this.tbody = this.tfoot = this.colgroup = this.caption = this.thead
        this.th = this.td
    }

    tagHooks.optgroup = tagHooks.option
    tagHooks.tbody = tagHooks.tfoot = tagHooks.colgroup = tagHooks.caption = tagHooks.thead
    tagHooks.th = tagHooks.td

    String("circle,defs,ellipse,image,line,path,polygon,polyline,rect,symbol,text,use").replace(rword, function(tag) {
        tagHooks[tag] = tagHooks.g //处理SVG
    })
    var rtagName = /<([\w:]+)/
    var rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig
    var scriptTypes = oneObject(["", "text/javascript", "text/ecmascript", "application/ecmascript", "application/javascript"])
    var script = DOC.createElement("script")

    avalon.parseHTML = function(html) {
        if (typeof html !== "string") {
            html = html + ""
        }
        html = html.replace(rxhtml, "<$1></$2>").trim()
        var tag = (rtagName.exec(html) || ["", ""])[1].toLowerCase(),
                //取得其标签名
                wrapper = tagHooks[tag] || tagHooks._default,
                fragment = hyperspace.cloneNode(false),
                firstChild
        wrapper.innerHTML = html
        var els = wrapper.getElementsByTagName("script")
        if (els.length) { //使用innerHTML生成的script节点不会发出请求与执行text属性
            for (var i = 0, el; el = els[i++]; ) {
                if (scriptTypes[el.type]) {
                    var neo = script.cloneNode(false) //FF不能省略参数
                    ap.forEach.call(el.attributes, function(attr) {
                        neo.setAttribute(attr.name, attr.value)
                    })
                    neo.text = el.text
                    el.parentNode.replaceChild(neo, el)
                }
            }
        }

        while (firstChild = wrapper.firstChild) { // 将wrapper上的节点转移到文档碎片上！
            fragment.appendChild(firstChild)
        }
        return fragment
    }

    avalon.innerHTML = function(node, html) {
        var a = this.parseHTML(html)
        this.clearHTML(node).appendChild(a)
    }

    avalon.clearHTML = function(node) {
        node.textContent = ""
        while (node.firstChild) {
            node.removeChild(node.firstChild)
        }
        return node
    }
    /*********************************************************************
     *                        事件管理器                                *
     **********************************************************************/
    var EventManager = {
        $watch: function(type, callback) {
            if (typeof callback === "function") {
                var callbacks = this.$events[type]
                if (callbacks) {
                    callbacks.push(callback)
                } else {
                    this.$events[type] = [callback]
                }
            } else { //重新开始监听此VM的第一重简单属性的变动
                this.$events = this.$watch.backup
            }
            return this
        },
        $unwatch: function(type, callback) {
            var n = arguments.length
            if (n === 0) { //让此VM的所有$watch回调无效化
                this.$watch.backup = this.$events
                this.$events = {}
            } else if (n === 1) {
                this.$events[type] = []
            } else {
                var callbacks = this.$events[type] || []
                var i = callbacks.length
                while (~--i < 0) {
                    if (callbacks[i] === callback) {
                        return callbacks.splice(i, 1)
                    }
                }
            }
            return this
        },
        $fire: function(type) {
            var special
            if (/^(\w+)!(\S+)$/.test(type)) {
                special = RegExp.$1
                type = RegExp.$2
            }
            var events = this.$events
            var args = aslice.call(arguments, 1)
            var detail = [type].concat(args)
            if (special === "all") {
                for (var i in avalon.vmodels) {
                    var v = avalon.vmodels[i]
                    if (v !== this) {
                        v.$fire.apply(v, detail)
                    }
                }
            } else if (special === "up" || special === "down") {
                var element = events.expr && findNode(events.expr)
                if (!element)
                    return
                for (var i in avalon.vmodels) {
                    var v = avalon.vmodels[i]
                    if (v !== this) {
                        if (v.$events.expr) {
                            var node = findNode(v.$events.expr)
                            if (!node) {
                                continue
                            }
                            var ok = special === "down" ? element.contains(node) : //向下捕获
                                    node.contains(element) //向上冒泡
                            if (ok) {
                                node._avalon = v //符合条件的加一个标识
                            }
                        }
                    }
                }
                var nodes = DOC.getElementsByTagName("*") //实现节点排序
                var alls = []
                Array.prototype.forEach.call(nodes, function(el) {
                    if (el._avalon) {
                        alls.push(el._avalon)
                        el._avalon = ""
                        el.removeAttribute("_avalon")
                    }
                })
                if (special === "up") {
                    alls.reverse()
                }
                for (var i = 0, el; el = alls[i++]; ) {
                    if (el.$fire.apply(el, detail) === false) {
                        break
                    }
                }
            } else {
                var callbacks = events[type] || []
                var all = events.$all || []
                for (var i = 0, callback; callback = callbacks[i++]; ) {
                    if (isFunction(callback))
                        callback.apply(this, args)
                }
                for (var i = 0, callback; callback = all[i++]; ) {
                    if (isFunction(callback))
                        callback.apply(this, arguments)
                }
            }
        }
    }

    function findNode(str) {
        return  DOC.querySelector(str)
    }
    /*********************************************************************
     *                       依赖调度系统                                 *
     **********************************************************************/
    var ronduplex = /^(duplex|on)$/
    function registerSubscriber(data) {
        Registry[expose] = data //暴光此函数,方便collectSubscribers收集
        avalon.openComputedCollect = true
        var fn = data.evaluator
        if (fn) { //如果是求值函数
            try {
                var c = ronduplex.test(data.type) ? data : fn.apply(0, data.args)
                data.handler(c, data.element, data)
            } catch (e) {
                log("warning:exception throwed in [registerSubscriber] " + e)
                delete data.evaluator
                var node = data.element
                if (node.nodeType === 3) {
                    var parent = node.parentNode
                    if (kernel.commentInterpolate) {
                        parent.replaceChild(DOC.createComment(data.value), node)
                    } else {
                        node.data = openTag + data.value + closeTag
                    }
                }
            }
        }
        avalon.openComputedCollect = false
        delete Registry[expose]
    }

    function collectSubscribers(list) { //收集依赖于这个访问器的订阅者
        var data = Registry[expose]
        if (list && data && avalon.Array.ensure(list, data) && data.element) { //只有数组不存在此元素才push进去
            addSubscribers(data, list)
        }
    }
    function addSubscribers(data, list) {
        data.$uuid = data.$uuid || generateID()
        list.$uuid = list.$uuid || generateID()
        var obj = {
            data: data,
            list: list,
            toString: function() {
                return data.$uuid + " " + list.$uuid
            }
        }
        if (!$$subscribers[obj]) {
            $$subscribers[obj] = 1
            $$subscribers.push(obj)
        }
    }

    var $$subscribers = [], $startIndex = 0, $maxIndex = 200, beginTime = Date.now(), removeID
    function removeSubscribers() {
        for (var i = $startIndex, n = $startIndex + $maxIndex; i < n; i++) {
            var obj = $$subscribers[i]
            if (!obj) {
                break
            }
            var data = obj.data
            var el = data.element
            var remove = el === null ? 1 : !avalon.contains(root, el)
            if (remove) { //如果它没有在DOM树
                $$subscribers.splice(i, 1)
                delete $$subscribers[obj]
                avalon.Array.remove(obj.list, data)
                //log("debug: remove " + data.type)
                if (data.type === "if" && data.template && data.template.parentNode === ifGroup) {
                    ifGroup.removeChild(data.template)
                }
                for (var key in data) {
                    data[key] = null
                }
                obj.data = obj.list = null
                i--
                n--
            }
        }
        obj = $$subscribers[i]
        if (obj) {
            $startIndex = n
        } else {
            $startIndex = 0
        }
        beginTime = Date.now()
    }
    function notifySubscribers(list) { //通知依赖于这个访问器的订阅者更新自身
        clearTimeout(removeID)
        if (Date.now() - beginTime > 444) {
            removeSubscribers()
        } else {
            removeID = setTimeout(removeSubscribers, 444)
        }
        if (list && list.length) {
            var args = aslice.call(arguments, 1)
            for (var i = list.length, fn; fn = list[--i]; ) {
                var el = fn.element
                if (el && el.parentNode) {
                    if (fn.$repeat) {
                        fn.handler.apply(fn, args) //处理监控数组的方法
                    } else if (fn.type !== "on") {//事件绑定只能由用户触发,不能由程序触发
                        var fun = fn.evaluator || noop
                        fn.handler(fun.apply(0, fn.args || []), el, fn)
                    }
                }
            }
        }
    }

    /*********************************************************************
     *                            扫描系统                                *
     **********************************************************************/
    var scanObject = {}
    avalon.scanCallback = function(fn, group) {
        group = group || "$all"
        var array = scanObject[group] || (scanObject[group] = [])
        array.push(fn)
    }
    avalon.scan = function(elem, vmodel, group) {
        elem = elem || root
        group = group || "$all"
        var array = scanObject[group] || []
        var vmodels = vmodel ? [].concat(vmodel) : []
        var scanIndex = 0;
        var scanAll = false
        var fn
        var dirty = false
        function cb(i) {
            scanIndex += i
            dirty = true
            setTimeout(function() {
                if (scanIndex <= 0 && !scanAll) {
                    scanAll = true
                    while (fn = array.shift()) {
                        fn()
                    }
                }
            })
        }
        vmodels.cb = cb
        scanTag(elem, vmodels)
        //html, include, widget
        if (!dirty) {
            while (fn = array.shift()) {
                fn()
            }
        }
    }

    //http://www.w3.org/TR/html5/syntax.html#void-elements
    var stopScan = oneObject("area,base,basefont,br,col,command,embed,hr,img,input,link,meta,param,source,track,wbr,noscript,noscript,script,style,textarea".toUpperCase())

    function checkScan(elem, callback, innerHTML) {
        var id = setTimeout(function() {
            var currHTML = elem.innerHTML
            clearTimeout(id)
            if (currHTML === innerHTML) {
                callback()
            } else {
                checkScan(elem, callback, currHTML)
            }
        })
    }

    function scanTag(elem, vmodels, node) {
        //扫描顺序  ms-skip(0) --> ms-important(1) --> ms-controller(2) --> ms-if(10) --> ms-repeat(100) 
        //--> ms-if-loop(110) --> ms-attr(970) ...--> ms-each(1400)-->ms-with(1500)--〉ms-duplex(2000)垫后        
        var a = elem.getAttribute("ms-skip")
        var b = elem.getAttributeNode("ms-important")
        var c = elem.getAttributeNode("ms-controller")
        if (typeof a === "string") {
            return
        } else if (node = b || c) {
            var newVmodel = VMODELS[node.value]
            if (!newVmodel) {
                return
            }
            //ms-important不包含父VM，ms-controller相反
            var cb = vmodels.cb
            vmodels = node === b ? [newVmodel] : [newVmodel].concat(vmodels)
            vmodels.cb = cb
            elem.removeAttribute(node.name) //removeAttributeNode不会刷新[ms-controller]样式规则
            elem.classList.remove(node.name)
            createSignalTower(elem, newVmodel)
            elem.setAttribute("avalonctrl", node.value)
            newVmodel.$events.expr = elem.tagName + '[avalonctrl="' + node.value + '"]'
        }
        scanAttr(elem, vmodels) //扫描特性节点
    }

    function createSignalTower(elem, vmodel) {
        var id = elem.getAttribute("avalonctrl") || vmodel.$id
        elem.setAttribute("avalonctrl", id)
        vmodel.$events.expr = elem.tagName + '[avalonctrl="' + id + '"]'
    }

    function scanNodeList(parent, vmodels) {
        var node = parent.firstChild
        while (node) {
            var nextNode = node.nextSibling
            scanNode(node, node.nodeType, vmodels)
            node = nextNode
        }
    }

    function scanNodeArray(nodes, vmodels) {
        for (var i = 0, node; node = nodes[i++]; ) {
            scanNode(node, node.nodeType, vmodels)
        }
    }
    function scanNode(node, nodeType, vmodels) {
        if (nodeType === 1) {
            scanTag(node, vmodels) //扫描元素节点
        } else if (nodeType === 3 && rexpr.test(node.data)) {
            scanText(node, vmodels) //扫描文本节点
        } else if (kernel.commentInterpolate && nodeType === 8 && !rexpr.test(node.nodeValue)) {
            scanText(node, vmodels) //扫描注释节点
        }
    }
    function scanText(textNode, vmodels) {
        var bindings = []
        if (textNode.nodeType === 8) {
            var leach = []
            var value = trimFilter(textNode.nodeValue, leach)
            var token = {
                expr: true,
                value: value
            }
            if (leach.length) {
                token.filters = leach
            }
            var tokens = [token]
        } else {
            tokens = scanExpr(textNode.data)
        }
        if (tokens.length) {
            for (var i = 0, token; token = tokens[i++]; ) {
                var node = DOC.createTextNode(token.value) //将文本转换为文本节点，并替换原来的文本节点
                if (token.expr) {
                    var filters = token.filters
                    var binding = {
                        type: "text",
                        element: node,
                        value: token.value,
                        filters: filters
                    }
                    if (filters && filters.indexOf("html") !== -1) {
                        avalon.Array.remove(filters, "html")
                        binding.type = "html"
                        binding.group = 1
                        if (!filters.length) {
                            delete bindings.filters
                        }
                    }
                    bindings.push(binding) //收集带有插值表达式的文本
                }
                hyperspace.appendChild(node)
            }
            textNode.parentNode.replaceChild(hyperspace, textNode)
            if (bindings.length)
                executeBindings(bindings, vmodels)
        }
    }

    var rmsAttr = /ms-(\w+)-?(.*)/
    var priorityMap = {
        "if": 10,
        "repeat": 90,
        "data": 100,
        "widget": 110,
        "each": 1400,
        "with": 1500,
        "duplex": 2000,
        "on": 3000
    }

    var events = oneObject("animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit")
    var obsoleteAttrs = oneObject("value,title,alt,checked,selected,disabled,readonly,enabled")
    function scanAttr(elem, vmodels) {
        //防止setAttribute, removeAttribute时 attributes自动被同步,导致for循环出错
        var attributes = elem.hasAttributes() ? avalon.slice(elem.attributes) : []
        var bindings = [],
                msData = {},
                match
        for (var i = 0, attr; attr = attributes[i++]; ) {
            if (attr.specified) {
                if (match = attr.name.match(rmsAttr)) {
                    //如果是以指定前缀命名的
                    var type = match[1]
                    var param = match[2] || ""
                    var value = attr.value
                    var name = attr.name
                    msData[name] = value
                    if (events[type]) {
                        param = type
                        type = "on"
                    } else if (obsoleteAttrs[type]) {
                        log("ms-" + type + "已经被废弃,请使用ms-attr-*代替")
                        if (type === "enabled") {//吃掉ms-enabled绑定,用ms-disabled代替
                            type = "disabled"
                            value = "!(" + value + ")"
                        }
                        param = type
                        type = "attr"
                        elem.removeAttribute(name)
                        name = "ms-attr-" + param
                        elem.setAttribute(name, value)
                        match = [name]
                        msData[name] = value
                    }
                    if (typeof bindingHandlers[type] === "function") {
                        var binding = {
                            type: type,
                            param: param,
                            element: elem,
                            name: match[0],
                            value: value,
                            priority: type in priorityMap ? priorityMap[type] : type.charCodeAt(0) * 10 + (Number(param) || 0)
                        }
                        if (type === "if" && param === "loop") {
                            binding.priority += 100
                        }
                        if (vmodels.length) {
                            bindings.push(binding)
                            if (type === "widget") {
                                elem.msData = elem.msData || msData
                            }
                        }
                    }
                }
            }
        }
        if (msData["ms-checked"] && msData["ms-duplex"]) {
            log("warning!一个元素上不能同时定义ms-checked与ms-duplex")
        }
        bindings.sort(function(a, b) {
            return a.priority - b.priority
        })
        var firstBinding = bindings[0] || {}
        switch (firstBinding.type) {
            case "if":
            case "repeat":
            case "widget":
                executeBindings([firstBinding], vmodels)
                break
            default:
                executeBindings(bindings, vmodels)
                if (!stopScan[elem.tagName] && rbind.test(elem.innerHTML + elem.textContent)) {
                    scanNodeList(elem, vmodels) //扫描子孙元素
                }
                break;
        }
    }

    function executeBindings(bindings, vmodels) {
        if (bindings.length)
            vmodels.cb(bindings.length)
        for (var i = 0, data; data = bindings[i++]; ) {
            data.vmodels = vmodels
            bindingHandlers[data.type](data, vmodels)
            if (data.evaluator && data.element && data.element.nodeType === 1) { //移除数据绑定，防止被二次解析
                //chrome使用removeAttributeNode移除不存在的特性节点时会报错 https://github.com/RubyLouvre/avalon/issues/99
                data.element.removeAttribute(data.name)
            }
        }
        bindings.length = 0
    }

    var rfilters = /\|\s*(\w+)\s*(\([^)]*\))?/g,
            r11a = /\|\|/g,
            r11b = /U2hvcnRDaXJjdWl0/g
    function trimFilter(value, leach) {
        if (value.indexOf("|") > 0) { // 抽取过滤器 先替换掉所有短路与
            value = value.replace(r11a, "U2hvcnRDaXJjdWl0") //btoa("ShortCircuit")
            value = value.replace(rfilters, function(c, d, e) {
                leach.push(d + (e || ""))
                return ""
            })
            value = value.replace(r11b, "||") //还原短路与
        }
        return value
    }

    function scanExpr(str) {
        var tokens = [],
                value, start = 0,
                stop

        do {
            stop = str.indexOf(openTag, start)
            if (stop === -1) {
                break
            }
            value = str.slice(start, stop)
            if (value) { // {{ 左边的文本
                tokens.push({
                    value: value,
                    expr: false
                })
            }
            start = stop + openTag.length
            stop = str.indexOf(closeTag, start)
            if (stop === -1) {
                break
            }
            value = str.slice(start, stop)
            if (value) { //处理{{ }}插值表达式
                var leach = []
                value = trimFilter(value, leach)
                tokens.push({
                    value: value,
                    expr: true,
                    filters: leach.length ? leach : void 0
                })
            }
            start = stop + closeTag.length
        } while (1)
        value = str.slice(start)
        if (value) { //}} 右边的文本
            tokens.push({
                value: value,
                expr: false
            })
        }

        return tokens
    }
    /*********************************************************************
     *                          编译系统                                   *
     **********************************************************************/
    var keywords =
            // 关键字
            "break,case,catch,continue,debugger,default,delete,do,else,false" +
            ",finally,for,function,if,in,instanceof,new,null,return,switch,this" +
            ",throw,true,try,typeof,var,void,while,with"
            // 保留字
            + ",abstract,boolean,byte,char,class,const,double,enum,export,extends" +
            ",final,float,goto,implements,import,int,interface,long,native" +
            ",package,private,protected,public,short,static,super,synchronized" +
            ",throws,transient,volatile"
            // ECMA 5 - use strict
            + ",arguments,let,yield"
            + ",undefined"
    var rrexpstr = /\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|"(?:[^"\\]|\\[\w\W])*"|'(?:[^'\\]|\\[\w\W])*'|[\s\t\n]*\.[\s\t\n]*[$\w\.]+/g
    var rsplit = /[^\w$]+/g
    var rkeywords = new RegExp(["\\b" + keywords.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g')
    var rnumber = /\b\d[^,]*/g
    var rcomma = /^,+|,+$/g
    var cacheVars = createCache(512)
    var getVariables = function(code) {
        var key = "," + code.trim()
        if (cacheVars[key]) {
            return cacheVars[key]
        }
        var match = code
                .replace(rrexpstr, "")
                .replace(rsplit, ",")
                .replace(rkeywords, "")
                .replace(rnumber, "")
                .replace(rcomma, "")
                .split(/^$|,+/)
        return cacheVars(key, uniqSet(match))
    }
    /*添加赋值语句*/
    function addAssign(vars, scope, name, data) {
        var ret = [],
                prefix = " = " + name + "."
        for (var i = vars.length, prop; prop = vars[--i]; ) {
            if (scope.hasOwnProperty(prop)) {
                ret.push(prop + prefix + prop)
                data.vars.push(prop)
                if (data.type === "duplex") {
                    vars.get = name + "." + prop
                }
                vars.splice(i, 1)
            }
        }
        return ret

    }

    function uniqSet(array) {
        var ret = [], unique = {}
        for (var i = 0; i < array.length; i++) {
            var el = array[i]
            var id = el && typeof el.$id === "string" ? el.$id : el
            if (!unique[id]) {
                unique[id] = ret.push(el)
            }
        }
        return ret
    }

    /*创建具有一定容量的缓存体*/
    function createCache(maxLength) {
        var keys = []

        function cache(key, value) {
            if (keys.push(key) > maxLength) {
                delete cache[keys.shift()]
            }
            return cache[key] = value;
        }
        return cache;
    }
    var cacheExprs = createCache(128)
    //根据一段文本与一堆VM，转换为对应的求值函数及匹配的VM(解释器模式)
    var rduplex = /\w\[.*\]|\w\.\w/
    var rproxy = /(\$proxy\$[a-z]+)\d+$/

    function parseExpr(code, scopes, data) {
        var dataType = data.type
        var isDuplex = dataType === "duplex"
        var filters = data.filters ? data.filters.join("") : ""
        var exprId = scopes.map(function(el) {
            return el.$id.replace(rproxy, "$1")
        }) + code + dataType + filters
        var vars = getVariables(code).concat(),
                assigns = [],
                names = [],
                args = [],
                prefix = ""
        data.vars = []
        //args 是一个对象数组， names 是将要生成的求值函数的参数
        scopes = uniqSet(scopes)
        for (var i = 0, sn = scopes.length; i < sn; i++) {
            if (vars.length) {
                var name = "vm" + expose + "_" + i
                names.push(name)
                args.push(scopes[i])
                assigns.push.apply(assigns, addAssign(vars, scopes[i], name, data))
            }
        }
        if (!assigns.length && isDuplex) {
            return
        }
        if (!isDuplex) {
            //https://github.com/RubyLouvre/avalon/issues/583
            data.vars.forEach(function(v) {
                var reg = new RegExp("\\b" + v + "(?:\\.\\w+|\\[\\w+\\])+", "ig")
                code = code.replace(reg, function(_) {
                    var c = _.charAt(v.length)
                    if (c === "." || c === "[") {
                        var name = "var" + String(Math.random()).replace(/^0\./, "")
                        assigns.push(name + " = " + _)
                        return name
                    } else {
                        return _
                    }
                })
            })
        }
        //---------------args----------------
        if (filters) {
            args.push(avalon.filters)
        }
        data.args = args
        //---------------cache----------------
        var fn = cacheExprs[exprId] //直接从缓存，免得重复生成
        if (fn) {
            data.evaluator = fn
            return
        }
        var prefix = assigns.join(", ")
        if (prefix) {
            prefix = "var " + prefix
        }
        if (filters) { //文本绑定，双工绑定才有过滤器
            code = "\nvar ret" + expose + " = " + code
            var textBuffer = [],
                    fargs
            textBuffer.push(code, "\r\n")
            for (var i = 0, fname; fname = data.filters[i++]; ) {
                var start = fname.indexOf("(")
                if (start !== -1) {
                    fargs = fname.slice(start + 1, fname.lastIndexOf(")")).trim()
                    fargs = "," + fargs
                    fname = fname.slice(0, start).trim()
                } else {
                    fargs = ""
                }
                textBuffer.push(" if(filters", expose, ".", fname, "){\n\ttry{\nret", expose,
                        " = filters", expose, ".", fname, "(ret", expose, fargs, ")\n\t}catch(e){} \n}\n")
            }
            code = textBuffer.join("")
            code += "\nreturn ret" + expose
            names.push("filters" + expose)
        } else if (isDuplex) { //双工绑定
            var _body = "'use strict';\nreturn function(vvv){\n\t" +
                    prefix +
                    ";\n\tif(!arguments.length){\n\t\treturn " +
                    code +
                    "\n\t}\n\t" + (!rduplex.test(code) ? vars.get : code) +
                    "= vvv;\n} "
            try {
                fn = Function.apply(noop, names.concat(_body))
                data.evaluator = cacheExprs(exprId, fn)
            } catch (e) {
                log("debug: parse error," + e.message)
            }
            return
        } else if (dataType === "on") { //事件绑定
            if (code.indexOf("(") === -1) {
                code += ".call(this, $event)"
            } else {
                code = code.replace("(", ".call(this,")
            }
            names.push("$event")
            code = "\nreturn " + code + ";" //IE全家 Function("return ")出错，需要Function("return ;")
            var lastIndex = code.lastIndexOf("\nreturn")
            var header = code.slice(0, lastIndex)
            var footer = code.slice(lastIndex)
            code = header + "\n" + footer
        } else { //其他绑定
            code = "\nreturn " + code + ";" //IE全家 Function("return ")出错，需要Function("return ;")
        }
        try {
            fn = Function.apply(noop, names.concat("'use strict';\n" + prefix + code))
            data.evaluator = cacheExprs(exprId, fn)
        } catch (e) {
            log("debug: parse error," + e.message)
        } finally {
            vars = textBuffer = names = null //释放内存
        }
    }

    /*parseExpr的智能引用代理*/
    function parseExprProxy(code, scopes, data, tokens, noregister) {
        scopes.cb(-1)
        if (Array.isArray(tokens)) {
            code = tokens.map(function(el) {
                return el.expr ? "(" + el.value + ")" : JSON.stringify(el.value)
            }).join(" + ")
        }
        parseExpr(code, scopes, data)
        if (data.evaluator && !noregister) {
            data.handler = bindingExecutors[data.handlerName || data.type]
            //方便调试
            //这里非常重要,我们通过判定视图刷新函数的element是否在DOM树决定
            //将它移出订阅者列表
            registerSubscriber(data)
        }
    }
    avalon.parseExprProxy = parseExprProxy
    /*********************************************************************
     *绑定模块（实现“操作数据即操作DOM”的关键，将DOM操作放逐出前端开发人员的视野，让它交由框架自行处理，开发人员专致于业务本身） *                                 *
     **********************************************************************/


    head.insertAdjacentHTML("afterBegin", '<avalon><style id="avalonStyle">.avalonHide{ display: none!important }</style></avalon>')
    var ifGroup = head.firstChild
    var getBindingCallback = function(elem, name, vmodels) {
        var callback = elem.getAttribute(name)
        if (callback) {
            for (var i = 0, vm; vm = vmodels[i++]; ) {
                if (vm.hasOwnProperty(callback) && typeof vm[callback] === "function") {
                    return vm[callback]
                }
            }
        }
    }
    var cacheTmpls = avalon.templateCache = {}
    var bools = "autofocus,autoplay,async,checked,controls,declare,disabled,defer,defaultChecked,defaultSelected" +
            "contentEditable,isMap,loop,multiple,noHref,noResize,noShade,open,readOnly,selected"
    var boolMap = {}
    bools.replace(rword, function(name) {
        boolMap[name.toLowerCase()] = name
    })
    //这里的函数每当VM发生改变后，都会被执行（操作方为notifySubscribers）
    var bindingExecutors = avalon.bindingExecutors = {
        "attr": function(val, elem, data) {
            var method = data.type,
                    attrName = data.param

            if (method === "css") {
                avalon(elem).css(attrName, val)
            } else if (method === "attr") {
                // ms-attr-class="xxx" vm.xxx="aaa bbb ccc"将元素的className设置为aaa bbb ccc
                // ms-attr-class="xxx" vm.xxx=false  清空元素的所有类名
                // ms-attr-name="yyy"  vm.yyy="ooo" 为元素设置name属性
                if (boolMap[attrName]) {
                    var bool = boolMap[attrName]
                    if (typeof elem[bool] === "boolean") {
                        return elem[bool] = !!val
                    }
                }
                var toRemove = (val === false) || (val === null) || (val === void 0)
                if (toRemove) {
                    return elem.removeAttribute(attrName)
                }
                //SVG只能使用setAttribute(xxx, yyy), VML只能使用elem.xxx = yyy ,HTML的固有属性必须elem.xxx = yyy
                var isInnate = rsvg.test(elem) ? false : attrName in elem.cloneNode(false)
                if (isInnate) {
                    elem[attrName] = val
                } else {
                    elem.setAttribute(attrName, val)
                }

            } else if (method === "include" && val) {
                var vmodels = data.vmodels
                var rendered = data.includeRendered
                var loaded = data.includeLoaded
                var replace = data.includeReplaced
                var target = replace ? elem.parentNode : elem
                function scanTemplate(text) {
                    if (loaded) {
                        text = loaded.apply(target, [text].concat(vmodels))
                    }
                    if (rendered) {
                        checkScan(target, function() {
                            rendered.call(target)
                        }, NaN)
                    }
                    while (true) {
                        var node = data.startInclude.nextSibling
                        if (node && node !== data.endInclude) {
                            target.removeChild(node)
                        } else {
                            break
                        }
                    }
                    var dom = avalon.parseHTML(text)
                    var nodes = avalon.slice(dom.childNodes)
                    target.insertBefore(dom, data.endInclude)
                    scanNodeArray(nodes, vmodels)
                    vmodels.cb(-1)
                }
                if (data.param === "src") {
                    if (cacheTmpls[val]) {
                        avalon.nextTick(function() {
                            scanTemplate(cacheTmpls[val])
                        })
                    } else {
                        var xhr = new window.XMLHttpRequest
                        xhr.onload = function() {
                            var s = xhr.status
                            if (s >= 200 && s < 300 || s === 304) {
                                scanTemplate(cacheTmpls[val] = xhr.responseText)
                            }
                        }
                        xhr.open("GET", val, true)
                        xhr.withCredentials = true
                        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
                        xhr.send(null)
                    }
                } else {
                    //IE系列与够新的标准浏览器支持通过ID取得元素（firefox14+）
                    //http://tjvantoll.com/2012/07/19/dom-element-references-as-global-variables/
                    var el = val && val.nodeType == 1 ? val : DOC.getElementById(val)
                    avalon.nextTick(function() {
                        scanTemplate(el.value || el.innerText || el.innerHTML)
                    })
                }
            } else {
                elem[method] = val
                if (window.chrome && elem.tagName === "EMBED") {
                    var parent = elem.parentNode//#525  chrome1-37下embed标签动态设置src不能发生请求
                    var comment = document.createComment("ms-src")
                    parent.replaceChild(comment, elem)
                    parent.replaceChild(elem, comment)
                }
            }
        },
        "class": function(val, elem, data) {
            var $elem = avalon(elem),
                    method = data.type
            if (method === "class" && data.oldStyle) { //如果是旧风格
                $elem.toggleClass(data.oldStyle, !!val)
            } else {
                //如果存在冒号就有求值函数
                data.toggleClass = data._evaluator ? !!data._evaluator.apply(elem, data._args) : true
                data.newClass = data.immobileClass || val
                if (data.oldClass && data.newClass !== data.oldClass) {
                    $elem.removeClass(data.oldClass)
                }
                data.oldClass = data.newClass
                switch (method) {
                    case "class":
                        $elem.toggleClass(data.newClass, data.toggleClass)
                        break
                    case "hover":
                    case "active":
                        if (!data.hasBindEvent) { //确保只绑定一次
                            var activate = "mouseenter" //在移出移入时切换类名
                            var abandon = "mouseleave"
                            if (method === "active") {//在聚焦失焦中切换类名
                                elem.tabIndex = elem.tabIndex || -1
                                activate = "mousedown"
                                abandon = "mouseup"
                                $elem.bind("mouseleave", function() {
                                    data.toggleClass && $elem.removeClass(data.newClass)
                                })
                            }
                            $elem.bind(activate, function() {
                                data.toggleClass && $elem.addClass(data.newClass)
                            })
                            $elem.bind(abandon, function() {
                                data.toggleClass && $elem.removeClass(data.newClass)
                            })
                            data.hasBindEvent = true
                        }
                        break;
                }
            }
        },
        "data": function(val, elem, data) {
            var key = "data-" + data.param
            if (val && typeof val === "object") {
                elem[key] = val
            } else {
                elem.setAttribute(key, String(val))
            }
        },
        "repeat": function(method, pos, el) {
            if (method) {
                var data = this
                var parent = data.element.parentNode
                var proxies = data.proxies
                var transation = hyperspace.cloneNode(false)
                if (method === "del" || method === "move") {
                    var locatedNode = locateFragment(data, pos)
                }
                var group = data.group
                switch (method) {
                    case "add": //在pos位置后添加el数组（pos为数字，el为数组）
                        var arr = el
                        var last = data.$repeat.length - 1
                        var fragments = []
                        for (var i = 0, n = arr.length; i < n; i++) {
                            var ii = i + pos
                            var proxy = getEachProxy(ii, arr[i], data, last)
                            proxies.splice(ii, 0, proxy)
                            shimController(data, transation, proxy, fragments)
                        }
                        locatedNode = locateFragment(data, pos)
                        parent.insertBefore(transation, locatedNode)
                        for (var i = 0, fragment; fragment = fragments[i++]; ) {
                            scanNodeArray(fragment.nodes, fragment.vmodels)
                            fragment.nodes = fragment.vmodels = null
                        }
                        calculateFragmentGroup(data)
                        break
                    case "del": //将pos后的el个元素删掉(pos, el都是数字)
                        var removed = proxies.splice(pos, el)
                        var transation = removeFragment(locatedNode, group, el)
                        avalon.clearHTML(transation)
                        recycleEachProxies(removed)
                        break
                    case "index": //将proxies中的第pos个起的所有元素重新索引（pos为数字，el用作循环变量）
                        var last = proxies.length - 1
                        for (; el = proxies[pos]; pos++) {
                            el.$index = pos
                            el.$first = pos === 0
                            el.$last = pos === last
                        }
                        break
                    case "clear":
                        while (true) {
                            var node = data.element.nextSibling
                            if (node && node !== data.endRepeat) {
                                parent.removeChild(node)
                            } else {
                                break
                            }
                        }
                        break
                    case "move": //将proxies中的第pos个元素移动el位置上(pos, el都是数字)
                        var t = proxies.splice(pos, 1)[0]
                        if (t) {
                            proxies.splice(el, 0, t)
                            transation = removeFragment(locatedNode, group)
                            locatedNode = locateFragment(data, el)
                            parent.insertBefore(transation, locatedNode)
                        }
                        break
                    case "set": //将proxies中的第pos个元素的VM设置为el（pos为数字，el任意）
                        var proxy = proxies[pos]
                        if (proxy) {
                            proxy[proxy.$itemName] = el
                        }
                        break
                    case "append": //将pos的键值对从el中取出（pos为一个普通对象，el为预先生成好的代理VM对象池）
                        var pool = el
                        var keys = []
                        var fragments = []
                        for (var key in pos) { //得到所有键名
                            if (pos.hasOwnProperty(key) && key !== "hasOwnProperty") {
                                keys.push(key)
                            }
                        }
                        if (data.sortedCallback) { //如果有回调，则让它们排序
                            var keys2 = data.sortedCallback.call(parent, keys)
                            if (keys2 && Array.isArray(keys2) && keys2.length) {
                                keys = keys2
                            }
                        }
                        for (var i = 0, key; key = keys[i++]; ) {
                            if (key !== "hasOwnProperty") {
                                shimController(data, transation, pool[key], fragments)
                            }
                        }
                        data.proxySize = keys.length
                        parent.insertBefore(transation, data.element.nextSibling)
                        for (var i = 0, fragment; fragment = fragments[i++]; ) {
                            scanNodeArray(fragment.nodes, fragment.vmodels)
                            fragment.nodes = fragment.vmodels = null
                        }
                        calculateFragmentGroup(data)
                        break
                }
                var callback = data.renderedCallback || noop, args = arguments
                checkScan(parent, function() {
                    callback.apply(parent, args)
                    if (parent.oldValue && parent.tagName === "SELECT" && method === "index") {//fix #503
                        avalon(parent).val(parent.oldValue.split(","))
                    }
                }, NaN)
            }
        },
        "html": function(val, elem, data) {
            val = val == null ? "" : val
            var parent = "group" in data ? elem.parentNode : elem
            if ("group" in data) {
                var fragment, nodes
                //将值转换为文档碎片，原值可以为元素节点，文档碎片，NodeList，字符串
                if (val.nodeType === 11) {
                    fragment = val
                } else if (val.nodeType === 1 || val.item) {
                    nodes = val.nodeType === 1 ? val.childNodes : val.item ? val : []
                    fragment = hyperspace.cloneNode(true)
                    while (nodes[0]) {
                        fragment.appendChild(nodes[0])
                    }
                } else {
                    fragment = avalon.parseHTML(val)
                }
                nodes = avalon.slice(fragment.childNodes)
                if (nodes.length == 0) {
                    var comment = DOC.createComment("ms-html")
                    fragment.appendChild(comment)
                    nodes = [comment]
                }
                parent.insertBefore(fragment, elem) //fix IE6-8 insertBefore的第2个参数只能为节点或null
                var length = data.group
                while (elem) {
                    var nextNode = elem.nextSibling
                    parent.removeChild(elem)
                    length--
                    if (length == 0 || nextNode === null)
                        break
                    elem = nextNode
                }
                data.element = nodes[0]
                data.group = nodes.length
            } else {
                avalon.innerHTML(parent, val)
            }
            data.vmodels.cb(1)
            avalon.nextTick(function() {
                scanNodeList(parent, data.vmodels)
                data.vmodels.cb(-1)
            })
        },
        "if": function(val, elem, data) {
            if (val) { //插回DOM树
                if (elem.nodeType === 8) {
                    elem.parentNode.replaceChild(data.template, elem)
                    elem = data.element = data.template
                }
                if (elem.getAttribute(data.name)) {
                    elem.removeAttribute(data.name)
                    scanAttr(elem, data.vmodels)
                }
            } else { //移出DOM树，并用注释节点占据原位置
                if (elem.nodeType === 1) {
                    var node = data.element = DOC.createComment("ms-if")
                    elem.parentNode.replaceChild(node, elem)
                    data.template = elem
                    ifGroup.appendChild(elem)
                }
            }
        },
        "on": function(callback, elem, data) {
            data.type = "on"
            callback = function(e) {
                var fn = data.evaluator || noop
                return fn.apply(this, data.args.concat(e))
            }
            var eventType = data.param.replace(/-\d+$/, "") // ms-on-mousemove-10
            if (eventType === "scan") {
                callback.call(elem, {type: eventType})
            } else if (typeof data.specialBind === "function") {
                data.specialBind(elem, callback)
            } else {
                var removeFn = avalon.bind(elem, eventType, callback)
            }
            data.rollback = function() {
                if (typeof data.specialUnbind === "function") {
                    data.specialUnbind()
                } else {
                    avalon.unbind(elem, data.param, removeFn)
                }
            }
        },
        "text": function(val, elem) {
            val = val == null ? "" : val //不在页面上显示undefined null
            if (elem.nodeType === 3) { //绑定在文本节点上
                try {//IE对游离于DOM树外的节点赋值会报错
                    elem.data = val
                } catch (e) {
                }
            } else { //绑定在特性节点上
                elem.textContent = val
            }
        },
        "visible": function(val, elem, data) {
            elem.style.display = val ? data.display : "none"
        },
        "widget": noop
    }

    var rdash = /\(([^)]*)\)/
    function parseDisplay(nodeName, val) {
        //用于取得此类标签的默认display值
        var key = "_" + nodeName
        if (!parseDisplay[key]) {
            var node = DOC.createElement(nodeName)
            root.appendChild(node)
            val = getComputedStyle(node, null).display
            root.removeChild(node)
            parseDisplay[key] = val
        }
        return parseDisplay[key]
    }
    avalon.parseDisplay = parseDisplay
    //这里的函数只会在第一次被扫描后被执行一次，并放进行对应VM属性的subscribers数组内（操作方为registerSubscriber）
    var bindingHandlers = avalon.bindingHandlers = {
        //这是一个字符串属性绑定的范本, 方便你在title, alt,  src, href, include, css添加插值表达式
        //<a ms-href="{{url.hostname}}/{{url.pathname}}.html">
        "attr": function(data, vmodels) {
            var text = data.value.trim(),
                    simple = true
            if (text.indexOf(openTag) > -1 && text.indexOf(closeTag) > 2) {
                simple = false
                if (rexpr.test(text) && RegExp.rightContext === "" && RegExp.leftContext === "") {
                    simple = true
                    text = RegExp.$1
                }
            }
            if (data.type === "include") {
                var elem = data.element
                data.includeRendered = getBindingCallback(elem, "data-include-rendered", vmodels)
                data.includeLoaded = getBindingCallback(elem, "data-include-loaded", vmodels)
                var outer = data.includeReplaced = !!avalon(elem).data("includeReplace")
                data.startInclude = DOC.createComment("ms-include")
                data.endInclude = DOC.createComment("ms-include-end")
                if (outer) {
                    data.element = data.startInclude
                    elem.parentNode.insertBefore(data.startInclude, elem)
                    elem.parentNode.insertBefore(data.endInclude, elem.nextSibling)
                } else {
                    elem.insertBefore(data.startInclude, elem.firstChild)
                    elem.appendChild(data.endInclude)
                }
            }
            data.handlerName = "attr" //handleName用于处理多种绑定共用同一种bindingExecutor的情况
            parseExprProxy(text, vmodels, data, (simple ? null : scanExpr(data.value)))
        },
        //根据VM的属性值或表达式的值切换类名，ms-class="xxx yyy zzz:flag" 
        //http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
        "class": function(data, vmodels) {
            var oldStyle = data.param,
                    text = data.value,
                    rightExpr
            data.handlerName = "class"
            if (!oldStyle || isFinite(oldStyle)) {
                data.param = "" //去掉数字
                var noExpr = text.replace(rexprg, function(a) {
                    return Math.pow(10, a.length - 1) //将插值表达式插入10的N-1次方来占位
                })
                var colonIndex = noExpr.indexOf(":") //取得第一个冒号的位置
                if (colonIndex === -1) { // 比如 ms-class="aaa bbb ccc" 的情况
                    var className = text
                } else { // 比如 ms-class-1="ui-state-active:checked" 的情况 
                    className = text.slice(0, colonIndex)
                    rightExpr = text.slice(colonIndex + 1)
                    parseExpr(rightExpr, vmodels, data) //决定是添加还是删除
                    if (!data.evaluator) {
                        log("debug: ms-class '" + (rightExpr || "").trim() + "' 不存在于VM中")
                        return false
                    } else {
                        data._evaluator = data.evaluator
                        data._args = data.args
                    }
                }
                var hasExpr = rexpr.test(className) //比如ms-class="width{{w}}"的情况
                if (!hasExpr) {
                    data.immobileClass = className
                }
                parseExprProxy("", vmodels, data, (hasExpr ? scanExpr(className) : null))
            } else {
                data.immobileClass = data.oldStyle = data.param
                parseExprProxy(text, vmodels, data)
            }
        },
        "duplex": function(data, vmodels) {
            var elem = data.element,
                    hasCast
            parseExprProxy(data.value, vmodels, data, 0, 1)

            data.changed = getBindingCallback(elem, "data-duplex-changed", vmodels) || noop
            if (data.evaluator && data.args) {
                var params = []
                var casting = oneObject("string,number,boolean,checked")
                if (elem.type === "radio" && data.param === "") {
                    data.param = "checked"
                }
                data.param.replace(/\w+/g, function(name) {
                    if (/^(checkbox|radio)$/.test(elem.type) && /^(radio|checked)$/.test(name)) {
                        log("ms-duplex-radio已经更名为ms-duplex-checked")
                        name = "checked"
                        data.isChecked = true
                    }
                    if (name === "bool") {
                        name = "boolean"
                        log("ms-duplex-bool已经更名为ms-duplex-boolean")
                    } else if (name === "text") {
                        name = "string"
                        log("ms-duplex-text已经更名为ms-duplex-string")
                    }
                    if (casting[name]) {
                        hasCast = true
                    }
                    avalon.Array.ensure(params, name)
                })
                if (!hasCast) {
                    params.push("string")
                }
                data.param = params.join("-")
                data.bound = function(type, callback) {
                    elem.addEventListener(type, callback)
                    var old = data.rollback
                    data.rollback = function() {
                        elem.removeEventListener(type, callback)
                        old && old()
                    }
                }
                for (var i in avalon.vmodels) {
                    var v = avalon.vmodels[i]
                    v.$fire("avalon-ms-duplex-init", data)
                }
                var cpipe = data.pipe || (data.pipe = pipe)
                cpipe(null, data, "init")
                var tagName = elem.tagName
                duplexBinding[tagName] && duplexBinding[tagName](elem, data.evaluator.apply(null, data.args), data)
            }
        },
        "repeat": function(data, vmodels) {
            var type = data.type
            parseExprProxy(data.value, vmodels, data, 0, 1)
            data.proxies = []
            var freturn = false
            try {
                var $repeat = data.$repeat = data.evaluator.apply(0, data.args || [])
                var xtype = avalon.type($repeat)
                if (xtype !== "object" && xtype !== "array") {
                    freturn = true
                    avalon.log("warning:" + data.value + "对应类型不正确")
                }
            } catch (e) {
                freturn = true
                avalon.log("warning:" + data.value + "编译出错")
            }
            var elem = data.element
            elem.removeAttribute(data.name)
            data.sortedCallback = getBindingCallback(elem, "data-with-sorted", vmodels)
            data.renderedCallback = getBindingCallback(elem, "data-" + type + "-rendered", vmodels)

            var comment = data.element = DOC.createComment("ms-repeat")
            var endRepeat = data.endRepeat = DOC.createComment("ms-repeat-end")

            hyperspace.appendChild(comment)
            hyperspace.appendChild(endRepeat)

            if (type === "each" || type === "with") {
                data.template = elem.innerHTML.trim()
                avalon.clearHTML(elem).appendChild(hyperspace)
            } else {
                data.template = elem.outerHTML.trim()
                elem.parentNode.replaceChild(hyperspace, elem)
                data.group = 1
            }

            data.rollback = function() {//只用于list为对象的情况
                bindingExecutors.repeat.call(data, "clear")
                var elem = data.element
                var parentNode = elem.parentNode
                var content = avalon.parseHTML(data.template)
                var target = content.firstChild
                parentNode.replaceChild(content, elem)
                parentNode.removeChild(data.endRepeat)
                target = data.element = data.type === "repeat" ? target : parentNode
                data.group = target.setAttribute(data.name, data.value)
            }
            var arr = data.value.split(".") || []
            if (arr.length > 1) {
                arr.pop()
                var n = arr[0]
                for (var i = 0, v; v = vmodels[i++]; ) {
                    if (v && v.hasOwnProperty(n)) {
                        var events = v[n].$events
                        events[subscribers] = events[subscribers] || []
                        events[subscribers].push(data)
                        break
                    }
                }
            }
            if (freturn) {
                return
            }

            data.handler = bindingExecutors.repeat
            data.$outer = {}
            var check0 = "$key",
                    check1 = "$val"
            if (Array.isArray($repeat)) {
                check0 = "$first"
                check1 = "$last"
            }
            for (var i = 0, p; p = vmodels[i++]; ) {
                if (p.hasOwnProperty(check0) && p.hasOwnProperty(check1)) {
                    data.$outer = p
                    break
                }
            }
            var $list = ($repeat.$events || {})[subscribers]
            if ($list && avalon.Array.ensure($list, data)) {
                addSubscribers(data, $list)
            }
            if (!Array.isArray($repeat) && type !== "each") {
                var pool = withProxyPool[$repeat.$id]
                if (!pool) {
                    withProxyCount++
                    pool = withProxyPool[$repeat.$id] = {}
                    for (var key in $repeat) {
                        if ($repeat.hasOwnProperty(key) && key !== "hasOwnProperty") {
                            (function(k, v) {
                                pool[k] = createWithProxy(k, v, {})
                                pool[k].$watch("$val", function(val) {
                                    $repeat[k] = val //#303
                                })
                            })(key, $repeat[key])
                        }
                    }
                }
                data.handler("append", $repeat, pool)
            } else {
                data.handler("add", 0, $repeat)
            }
        },
        "html": function(data, vmodels) {
            parseExprProxy(data.value, vmodels, data)
        },
        "on": function(data, vmodels) {
            var value = data.value
            var eventType = data.param.replace(/-\d+$/, "") // ms-on-mousemove-10
            if (typeof bindingHandlers.on[eventType + "Hook"] === "function") {
                bindingHandlers.on[eventType + "Hook"](data)
            }
            if (value.indexOf("(") > 0 && value.indexOf(")") > -1) {
                var matched = (value.match(rdash) || ["", ""])[1].trim()
                if (matched === "" || matched === "$event") { // aaa() aaa($event)当成aaa处理
                    value = value.replace(rdash, "")
                }
            }
            parseExprProxy(value, vmodels, data)
        },
        "visible": function(data, vmodels) {
            var elem = avalon(data.element)
            var display = elem.css("display")
            if (display === "none") {
                var style = elem[0].style
                var has = /visibility/i.test(style.cssText)
                var visible = elem.css("visibility")
                style.display = ""
                style.visibility = "hidden"
                display = elem.css("display")
                if (display === "none") {
                    display = parseDisplay(elem[0].nodeName)
                }
                style.visibility = has ? visible : ""
            }
            data.display = display
            parseExprProxy(data.value, vmodels, data)
        },
        "widget": function(data, vmodels) {
            var args = data.value.match(rword)
            var elem = data.element
            var widget = args[0]
            var id = args[1]
            if (!id || id === "$") {//没有定义或为$时，取组件名+随机数
                id = widget + setTimeout("1")
            }
            var optName = args[2] || widget//没有定义，取组件名
            vmodels.cb(-1)
            var constructor = avalon.ui[widget]
            if (typeof constructor === "function") { //ms-widget="tabs,tabsAAA,optname"
                vmodels = elem.vmodels || vmodels
                for (var i = 0, v; v = vmodels[i++]; ) {
                    if (v.hasOwnProperty(optName) && typeof v[optName] === "object") {
                        var vmOptions = v[optName]
                        vmOptions = vmOptions.$model || vmOptions
                        break
                    }
                }
                if (vmOptions) {
                    var wid = vmOptions[widget + "Id"]
                    if (typeof wid === "string") {
                        id = wid
                    }
                }
                //抽取data-tooltip-text、data-tooltip-attr属性，组成一个配置对象
                var widgetData = avalon.getWidgetData(elem, widget)
                data.value = [widget, id, optName].join(",")
                data[widget + "Id"] = id
                elem.msData["ms-widget-id"] = id
                data.evaluator = noop
                var options = data[widget + "Options"] = avalon.mix({}, constructor.defaults, vmOptions || {}, widgetData)
                elem.removeAttribute("ms-widget")
                var vmodel = constructor(elem, data, vmodels) || {} //防止组件不返回VM
                if (vmodel.$id) {
                    avalon.vmodels[id] = vmodel
                    createSignalTower(elem, vmodel)
                    if (vmodel.hasOwnProperty("$init")) {
                        vmodel.$init(function() {
                            var nv = [vmodel].concat(vmodels)
                            nv.cb = vmodels.cb
                            avalon.scan(elem, nv)
                            if (typeof options.onInit === "function") {
                                options.onInit.call(elem, vmodel, options, vmodels)
                            }
                        })
                    }
                    if (vmodel.hasOwnProperty("$remove")) {
                        function offTree() {
                            if (!elem.msRetain && !root.contains(elem)) {
                                vmodel.$remove()
                                elem.msData = {}
                                delete VMODELS[vmodel.$id]
                                return false
                            }
                        }
                        if (window.chrome) {
                            elem.addEventListener("DOMNodeRemovedFromDocument", function() {
                                setTimeout(offTree)
                            })
                        } else {
                            avalon.tick(offTree)
                        }
                    }
                } else {
                    avalon.scan(elem, vmodels)
                }
            } else if (vmodels.length) { //如果该组件还没有加载，那么保存当前的vmodels
                elem.vmodels = vmodels
            }
        }
    }

    //============================   class preperty binding  =======================
    "hover,active".replace(rword, function(method) {
        bindingHandlers[method] = bindingHandlers["class"]
    })
    "with,each".replace(rword, function(name) {
        bindingHandlers[name] = bindingHandlers.repeat
    })
    bindingHandlers["if"] = bindingHandlers.data = bindingHandlers.text = bindingHandlers.html
    //============================= string preperty binding =======================
    //与href绑定器 用法差不多的其他字符串属性的绑定器
    //建议不要直接在src属性上修改，这样会发出无效的请求，请使用ms-src
    "title,alt,src,value,css,include,href".replace(rword, function(name) {
        bindingHandlers[name] = bindingHandlers.attr
    })
    //============================= model binding =======================
    //将模型中的字段与input, textarea的value值关联在一起
    var duplexBinding = bindingHandlers.duplex
    function fixNull(val) {
        return val == null ? "" : val
    }

    avalon.duplexHooks = {
        checked: {
            get: function(val, data) {
                return !data.element.oldValue
            }
        },
        string: {
            get: function(val) {//同步到VM
                return val
            },
            set: fixNull
        },
        "boolean": {
            get: function(val) {
                return val === "true"
            },
            set: fixNull
        },
        number: {
            get: function(val, data) {
                return isFinite(val) ? parseFloat(val) || 0 : val
            },
            set: fixNull
        }
    }

    function pipe(val, data, action) {
        data.param.replace(/\w+/g, function(name) {
            var hook = avalon.duplexHooks[name]
            if (hook && typeof hook[action] === "function") {
                val = hook[action](val, data)
            }
        })
        return val
    }
    //如果一个input标签添加了model绑定。那么它对应的字段将与元素的value连结在一起
    //字段变，value就变；value变，字段也跟着变。默认是绑定input事件，
    duplexBinding.INPUT = function(element, evaluator, data) {
        var type = element.type,
                bound = data.bound,
                $elem = avalon(element),
                composing = false
        function callback(value) {
            data.changed.call(this, value, data)
        }
        function compositionStart() {
            composing = true
        }
        function compositionEnd() {
            composing = false
        }
        //当value变化时改变model的值
        function updateVModel() {
            if (composing)//处理中文输入法在minlengh下引发的BUG
                return
            var val = element.oldValue = element.value //防止递归调用形成死循环
            var lastValue = data.pipe(val, data, "get")
            if ($elem.data("duplex-observe") !== false) {
                evaluator(lastValue)
                callback.call(element, lastValue)
                if ($elem.data("duplex-focus")) {
                    avalon.nextTick(function() {
                        element.focus()
                    })
                }
            }
        }

        //当model变化时,它就会改变value的值
        data.handler = function() {
            var val = data.pipe(evaluator(), data, "set")
            if (val !== element.value) {
                element.value = val
            }
        }
        if (data.isChecked || element.type === "radio") {
            updateVModel = function() {
                if ($elem.data("duplex-observe") !== false) {
                    var lastValue = data.pipe(element.value, data, "get")
                    evaluator(lastValue)
                    callback.call(element, lastValue)
                }
            }
            data.handler = function() {
                var val = evaluator()
                var checked = data.isChecked ? !!val : val + "" === element.value
                element.checked = element.oldValue = checked
            }
            bound("click", updateVModel)
        } else if (type === "checkbox") {
            updateVModel = function() {
                if ($elem.data("duplex-observe") !== false) {
                    var method = element.checked ? "ensure" : "remove"
                    var array = evaluator()
                    if (!Array.isArray(array)) {
                        log("ms-duplex应用于checkbox上要对应一个数组")
                        array = [array]
                    }
                    avalon.Array[method](array, data.pipe(element.value, data, "get"))
                    callback.call(element, array)
                }
            }
            data.handler = function() {
                var array = [].concat(evaluator()) //强制转换为数组
                element.checked = array.indexOf(data.pipe(element.value, data, "get")) >= 0
            }
            bound("change", updateVModel)
        } else {
            var events = element.getAttribute("data-duplex-event") || element.getAttribute("data-event") || "input"
            if (element.attributes["data-event"]) {
                log("data-event指令已经废弃，请改用data-duplex-event")
            }
            events.replace(rword, function(name) {
                switch (name) {
                    case "input":
                        bound("input", updateVModel)
                        bound("compositionstart", compositionStart)
                        bound("compositionend", compositionEnd)
                        break
                    default:
                        bound(name, updateVModel)
                        break
                }
            })
        }
        element.oldValue = element.value
        launch(function() {
            if (avalon.contains(root, element)) {
                onTree.call(element)
            } else if (!element.msRetain) {
                return false
            }
        })
        registerSubscriber(data)
        callback.call(element, element.value)
    }

    var TimerID, ribbon = [],
            launch = noop

    function W3CFire(el, name, detail) {
        var event = DOC.createEvent("Events")
        event.initEvent(name, true, true)
        if (detail) {
            event.detail = detail
        }
        el.dispatchEvent(event)
    }

    function onTree(value) { //disabled状态下改动不触发inout事件
        var newValue = arguments.length ? value : this.value
        if (!this.disabled && this.oldValue !== newValue) {
            var type = this.getAttribute("data-duplex-event") || "input"
            type = type.match(rword).shift()
            W3CFire(this, type)
        }
    }
    avalon.tick = function(fn) {
        if (ribbon.push(fn) === 1) {
            TimerID = setInterval(ticker, 60)
        }
    }
    function ticker() {
        for (var n = ribbon.length - 1; n >= 0; n--) {
            var el = ribbon[n]
            if (el() === false) {
                ribbon.splice(n, 1)
            }
        }
        if (!ribbon.length) {
            clearInterval(TimerID)
        }
    }

    function newSetter(value) {
        onSetter.call(this, value)
        onTree.call(this, value)
    }
    try {
        var inputProto = HTMLInputElement.prototype
        var onSetter = Object.getOwnPropertyDescriptor(inputProto, "value").set //屏蔽chrome, safari,opera
        Object.defineProperty(inputProto, "value", {
            set: newSetter,
            configurable: true
        })
    } catch (e) {
        launch = avalon.tick
    }

    duplexBinding.SELECT = function(element, evaluator, data) {
        var $elem = avalon(element)
        function updateVModel() {
            if ($elem.data("duplex-observe") !== false) {
                var val = $elem.val() //字符串或字符串数组
                if (Array.isArray(val)) {
                    val = val.map(function(v) {
                        return data.pipe(v, data, "get")
                    })
                } else {
                    val = data.pipe(val, data, "get")
                }
                if (val + "" !== element.oldValue) {
                    evaluator(val)
                }
                data.changed.call(element, val, data)
            }
        }
        data.handler = function() {
            var val = evaluator()
            val = val && val.$model || val
            if (Array.isArray(val)) {
                if (!element.multiple) {
                    log("ms-duplex在<select multiple=true>上要求对应一个数组")
                }
            } else {
                if (element.multiple) {
                    log("ms-duplex在<select multiple=false>不能对应一个数组")
                }
            }
            //必须变成字符串后才能比较
            val = Array.isArray(val) ? val.map(String) : val + ""
            if (val + "" !== element.oldValue) {
                $elem.val(val)
                element.oldValue = val + ""
            }
        }
        data.bound("change", updateVModel)
        checkScan(element, function() {
            registerSubscriber(data)
            data.changed.call(element, evaluator(), data)
        }, NaN)
    }
    duplexBinding.TEXTAREA = duplexBinding.INPUT
    //========================= event binding ====================
    var eventHooks = avalon.eventHooks
    //针对firefox, chrome修正mouseenter, mouseleave(chrome30+)
    if (!("onmouseenter" in root)) {
        avalon.each({
            mouseenter: "mouseover",
            mouseleave: "mouseout"
        }, function(origType, fixType) {
            eventHooks[origType] = {
                type: fixType,
                deel: function(elem, fn) {
                    return function(e) {
                        var t = e.relatedTarget
                        if (!t || (t !== elem && !(elem.compareDocumentPosition(t) & 16))) {
                            delete e.type
                            e.type = origType
                            return fn.call(elem, e)
                        }
                    }
                }
            }
        })
    }
    //针对IE9+, w3c修正animationend
    avalon.each({
        AnimationEvent: "animationend",
        WebKitAnimationEvent: "webkitAnimationEnd"
    }, function(construct, fixType) {
        if (window[construct] && !eventHooks.animationend) {
            eventHooks.animationend = {
                type: fixType
            }
        }
    })
    if (DOC.onmousewheel === void 0) {
        /* IE6-11 chrome mousewheel wheelDetla 下 -120 上 120
         firefox DOMMouseScroll detail 下3 上-3
         firefox wheel detlaY 下3 上-3
         IE9-11 wheel deltaY 下40 上-40
         chrome wheel deltaY 下100 上-100 */
        eventHooks.mousewheel = {
            type: "wheel",
            deel: function(elem, fn) {
                return function(e) {
                    e.wheelDeltaY = e.wheelDelta = e.deltaY > 0 ? -120 : 120
                    e.wheelDeltaX = 0
                    Object.defineProperty(e, "type", {
                        value: "mousewheel"
                    })
                    fn.call(elem, e)
                }
            }
        }
    }
    /*********************************************************************
     *          监控数组（与ms-each, ms-repeat配合使用）                     *
     **********************************************************************/

    function Collection(model) {
        var array = []
        array.$id = generateID()
        array.$model = model   //数据模型
        array.$events = {}
        array.$events[subscribers] = []
        array._ = modelFactory({
            length: model.length
        })
        array._.$watch("length", function(a, b) {
            array.$fire("length", a, b)
        })
        for (var i in EventManager) {
            array[i] = EventManager[i]
        }
        avalon.mix(array, CollectionPrototype)
        return array
    }


    var _splice = ap.splice
    var CollectionPrototype = {
        _splice: _splice,
        _fire: function(method, a, b) {
            notifySubscribers(this.$events[subscribers], method, a, b)
        },
        _add: function(arr, pos) {
            var oldLength = this.length
            pos = typeof pos === "number" ? pos : oldLength
            var added = []
            for (var i = 0, n = arr.length; i < n; i++) {
                added[i] = convert(arr[i], this.$model[pos + i])
            }
            _splice.apply(this, [pos, 0].concat(added))
            this._fire("add", pos, added)
            if (!this._stopFireLength) {
                return this._.length = this.length
            }
        },
        _del: function(pos, n) {
            var ret = this._splice(pos, n)
            if (ret.length) {
                this._fire("del", pos, n)
                if (!this._stopFireLength) {
                    this._.length = this.length
                }
            }
            return ret
        },
        push: function() {
            ap.push.apply(this.$model, arguments)
            var n = this._add(arguments)
            this._fire("index", n > 2 ? n - 2 : 0)
            return n
        },
        pushArray: function(array) {
            return this.push.apply(this, array)
        },
        unshift: function() {
            ap.unshift.apply(this.$model, arguments)
            var ret = this._add(arguments, 0) //返回长度
            this._fire("index", arguments.length)
            return ret
        },
        shift: function() {
            var el = this.$model.shift()
            this._del(0, 1)
            this._fire("index", 0)
            return el //返回被移除的元素
        },
        pop: function() {
            var el = this.$model.pop()
            this._del(this.length - 1, 1)
            return el //返回被移除的元素
        },
        splice: function(a, b) {
            // 必须存在第一个参数，需要大于-1, 为添加或删除元素的基点
            var len = this.length
            a = Math.floor(a) || 0
            a = a < 0 ? Math.max(len + a, 0) : Math.min(a, len)
            var removed = _splice.apply(this.$model, arguments),
                    ret = [], change
            this._stopFireLength = true //确保在这个方法中 , $watch("length",fn)只触发一次
            if (removed.length) {
                ret = this._del(a, removed.length)
                change = true
            }
            if (arguments.length > 2) {
                this._add(aslice.call(arguments, 2), a)
                change = true
            }
            this._stopFireLength = false
            this._.length = this.length
            if (change) {
                this._fire("index", 0)
            }
            return ret //返回被移除的元素
        },
        contains: function(el) { //判定是否包含
            return this.indexOf(el) !== -1
        },
        size: function() { //取得数组长度，这个函数可以同步视图，length不能
            return this._.length
        },
        remove: function(el) { //移除第一个等于给定值的元素
            return this.removeAt(this.indexOf(el))
        },
        removeAt: function(index) { //移除指定索引上的元素
            return index >= 0 ? this.splice(index, 1) : []
        },
        clear: function() {
            this.$model.length = this.length = this._.length = 0 //清空数组
            this._fire("clear", 0)
            return this
        },
        removeAll: function(all) { //移除N个元素
            if (Array.isArray(all)) {
                all.forEach(function(el) {
                    this.remove(el)
                }, this)
            } else if (typeof all === "function") {
                for (var i = this.length - 1; i >= 0; i--) {
                    var el = this[i]
                    if (all(el, i)) {
                        this.splice(i, 1)
                    }
                }
            } else {
                this.clear()
            }
        },
        ensure: function(el) {
            if (!this.contains(el)) { //只有不存在才push
                this.push(el)
            }
            return this
        },
        set: function(index, val) {
            if (index >= 0) {
                var valueType = avalon.type(val)
                if (val && val.$model) {
                    val = val.$model
                }
                var target = this[index]
                if (valueType === "object") {
                    for (var i in val) {
                        if (target.hasOwnProperty(i)) {
                            target[i] = val[i]
                        }
                    }
                } else if (valueType === "array") {
                    target.clear().push.apply(target, val)
                } else if (target !== val) {
                    this[index] = val
                    this.$model[index] = val
                    this._fire("set", index, val)
                }
            }
            return this
        }
    }
    "sort,reverse".replace(rword, function(method) {
        CollectionPrototype[method] = function() {
            var aaa = this.$model,
                    bbb = aaa.slice(0),
                    sorted = false
            ap[method].apply(aaa, arguments) //先移动model
            for (var i = 0, n = bbb.length; i < n; i++) {
                var a = aaa[i],
                        b = bbb[i]
                if (!isEqual(a, b)) {
                    sorted = true
                    var index = bbb.indexOf(a, i)
                    var remove = this._splice(index, 1)[0]
                    var remove2 = bbb.splice(index, 1)[0]
                    this._splice(i, 0, remove)
                    bbb.splice(i, 0, remove2)
                    this._fire("move", index, i)
                }
            }
            bbb = void 0
            if (sorted) {
                this._fire("index", 0)
            }
            return this
        }
    })

    function convert(val, $model) {
        var type = avalon.type(val)
        if (rcomplexType.test(type)) {
            val = val.$id ? val : modelFactory(val, 0, $model)
        }
        return val
    }

    //============ each/repeat/with binding 用到的辅助函数与对象 ======================
    //为ms-each, ms-with, ms-repeat要循环的元素外包一个msloop临时节点，ms-controller的值为代理VM的$id
    function shimController(data, transation, proxy, fragments) {
        var dom = avalon.parseHTML(data.template)
        var nodes = avalon.slice(dom.childNodes)
        transation.appendChild(dom)
        proxy.$outer = data.$outer
        var ov = data.vmodels
        var nv = [proxy].concat(ov)
        nv.cb = ov.cb
        var fragment = {
            nodes: nodes,
            vmodels: nv
        }
        fragments.push(fragment)
    }
    //如果ms-repeat紧挨着ms-repeat-end，那么就返回ms-repeat-end
    // 取得用于定位的节点。比如group = 3,  结构为
    // <div><!--ms-repeat--><br id="first"><br/><br/><br id="second"><br/><br/><!--ms-repeat-end--></div>
    // 当pos为0时,返回 br#first
    // 当pos为1时,返回 br#second
    // 当pos为2时,返回 ms-repeat-end
    function locateFragment(data, pos) {
        var startRepeat = data.element
        var endRepeat = data.endRepeat
        var nodes = []
        var node = startRepeat.nextSibling
        if (node !== endRepeat) {
            do {
                if (node !== endRepeat) {
                    nodes.push(node)
                } else {
                    break
                }
            } while (node = node.nextSibling)
        }
        return nodes[data.group * pos] || endRepeat
    }
    function removeFragment(node, group, pos) {
        var n = group * (pos || 1)
        var nodes = [node], i = 1
        var view = hyperspace
        while (i < n) {
            node = node.nextSibling
            if (node) {
                nodes[i++] = node
            }
        }
        for (var i = 0; node = nodes[i++]; ) {
            view.appendChild(node)
        }
        return view
    }

    function calculateFragmentGroup(data) {
        if (!isFinite(data.group)) {
            var nodes = data.element.parentNode.childNodes
            var length = nodes.length - 2 //去掉两个注释节点
            var n = "proxySize" in data ? data.proxySize : data.proxies.length
            data.group = length / n
        }
    }

    // 为ms-each, ms-repeat创建一个代理对象，通过它们能使用一些额外的属性与功能（$index,$first,$last,$remove,$key,$val,$outer）
    var watchEachOne = oneObject("$index,$first,$last")

    function createWithProxy(key, val, $outer) {
        var proxy = modelFactory({
            $key: key,
            $outer: $outer,
            $val: val
        }, {
            $val: 1,
            $key: 1
        })
        proxy.$id = ("$proxy$with" + Math.random()).replace(/0\./, "")
        return proxy
    }
    var eachProxyPool = []
    function getEachProxy(index, item, data, last) {
        var param = data.param || "el", proxy
        var source = {
            $remove: function() {
                return data.$repeat.removeAt(proxy.$index)
            },
            $itemName: param,
            $index: index,
            $outer: data.$outer,
            $first: index === 0,
            $last: index === last
        }
        source[param] = item
        for (var i = 0, n = eachProxyPool.length; i < n; i++) {
            var proxy = eachProxyPool[i]
            if (proxy.hasOwnProperty(param) && (avalon.type(proxy[param]) === avalon.type(item))) {
                for (var k in source) {
                    proxy[k] = source[k]
                }
                eachProxyPool.splice(i, 1)
                proxy.$watch(param, function(val) {
                    data.$repeat.set(proxy.$index, val)
                })
                return proxy
            }
        }
        var type = avalon.type(item)
        if (type === "object" || type === "function") {
            source.$skipArray = [param]
        }
        proxy = modelFactory(source, watchEachOne)
        proxy.$watch(param, function(val) {
            data.$repeat.set(proxy.$index, val)
        })
        proxy.$id = ("$proxy$" + data.type + Math.random()).replace(/0\./, "")
        return proxy
    }

    function recycleEachProxies(array) {
        for (var i = 0, el; el = array[i++]; ) {
            recycleEachProxy(el)
        }
        array.length = 0
    }

    function recycleEachProxy(proxy) {
        for (var i in proxy.$events) {
            if (Array.isArray(proxy.$events[i])) {
                proxy.$events[i].length = 0
            }
        }
        if (eachProxyPool.unshift(proxy) > kernel.maxRepeatSize) {
            eachProxyPool.pop()
        }
    }
    /*********************************************************************
     *                  文本绑定里默认可用的过滤器                        *
     **********************************************************************/
    var rscripts = /<script[^>]*>([\S\s]*?)<\/script\s*>/gim
    var ron = /\s+(on[^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g
    var ropen = /<\w+\b(?:(["'])[^"]*?(\1)|[^>])*>/ig
    var rsanitize = {
        a: /\b(href)\=("javascript[^"]*"|'javascript[^']*')/ig,
        img: /\b(src)\=("javascript[^"]*"|'javascript[^']*')/ig,
        form: /\b(action)\=("javascript[^"]*"|'javascript[^']*')/ig
    }
    var rsurrogate = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g
    var rnoalphanumeric = /([^\#-~| |!])/g;
    var filters = avalon.filters = {
        uppercase: function(str) {
            return str.toUpperCase()
        },
        lowercase: function(str) {
            return str.toLowerCase()
        },
        truncate: function(target, length, truncation) {
            //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
            length = length || 30
            truncation = truncation === void(0) ? "..." : truncation
            return target.length > length ? target.slice(0, length - truncation.length) + truncation : String(target)
        },
        sanitize: window.toStaticHTML ? toStaticHTML.bind(window) : function(str) {
            return str.replace(rscripts, "").replace(ropen, function(a, b) {
                var match = a.toLowerCase().match(/<(\w+)\s/)
                if (match) {//处理a标签的href属性，img标签的src属性，form标签的action属性
                    var reg = rsanitize[match[1]]
                    if (reg) {
                        a = a.replace(reg, function(s, name, value) {
                            var quote = value.charAt(0)
                            return  name + "=" + quote + "javascript:void(0)" + quote
                        })
                    }
                }
                return a.replace(ron, " ").replace(/\s+/g, " ")//移除onXXX事件
            })
        },
        camelize: camelize,
        escape: function(html) {
            //将字符串经过 html 转义得到适合在页面中显示的内容, 例如替换 < 为 &lt 
            return String(html).
                    replace(/&/g, '&amp;').
                    replace(rsurrogate, function(value) {
                        var hi = value.charCodeAt(0)
                        var low = value.charCodeAt(1)
                        return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';'
                    }).
                    replace(rnoalphanumeric, function(value) {
                        return '&#' + value.charCodeAt(0) + ';'
                    }).
                    replace(/</g, '&lt;').
                    replace(/>/g, '&gt;')
        },
        currency: function(number, symbol) {
            symbol = symbol || "\uFFE5"
            return symbol + avalon.filters.number(number)
        },
        number: function(number, decimals, dec_point, thousands_sep) {
            //与PHP的number_format完全兼容
            //number    必需，要格式化的数字
            //decimals  可选，规定多少个小数位。
            //dec_point 可选，规定用作小数点的字符串（默认为 . ）。
            //thousands_sep 可选，规定用作千位分隔符的字符串（默认为 , ），如果设置了该参数，那么所有其他参数都是必需的。
            // http://kevin.vanzonneveld.net
            number = (number + "").replace(/[^0-9+\-Ee.]/g, "")
            var n = !isFinite(+number) ? 0 : +number,
                    prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
                    sep = thousands_sep || ",",
                    dec = dec_point || ".",
                    s = "",
                    toFixedFix = function(n, prec) {
                        var k = Math.pow(10, prec)
                        return "" + Math.round(n * k) / k
                    }
            // Fix for IE parseFloat(0.55).toFixed(0) = 0 
            s = (prec ? toFixedFix(n, prec) : "" + Math.round(n)).split('.')
            if (s[0].length > 3) {
                s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
            }
            if ((s[1] || "").length < prec) {
                s[1] = s[1] || ""
                s[1] += new Array(prec - s[1].length + 1).join("0")
            }
            return s.join(dec)
        }
    }
    /*
     'yyyy': 4 digit representation of year (e.g. AD 1 => 0001, AD 2010 => 2010)
     'yy': 2 digit representation of year, padded (00-99). (e.g. AD 2001 => 01, AD 2010 => 10)
     'y': 1 digit representation of year, e.g. (AD 1 => 1, AD 199 => 199)
     'MMMM': Month in year (January-December)
     'MMM': Month in year (Jan-Dec)
     'MM': Month in year, padded (01-12)
     'M': Month in year (1-12)
     'dd': Day in month, padded (01-31)
     'd': Day in month (1-31)
     'EEEE': Day in Week,(Sunday-Saturday)
     'EEE': Day in Week, (Sun-Sat)
     'HH': Hour in day, padded (00-23)
     'H': Hour in day (0-23)
     'hh': Hour in am/pm, padded (01-12)
     'h': Hour in am/pm, (1-12)
     'mm': Minute in hour, padded (00-59)
     'm': Minute in hour (0-59)
     'ss': Second in minute, padded (00-59)
     's': Second in minute (0-59)
     'a': am/pm marker
     'Z': 4 digit (+sign) representation of the timezone offset (-1200-+1200)
     format string can also be one of the following predefined localizable formats:
     
     'medium': equivalent to 'MMM d, y h:mm:ss a' for en_US locale (e.g. Sep 3, 2010 12:05:08 pm)
     'short': equivalent to 'M/d/yy h:mm a' for en_US locale (e.g. 9/3/10 12:05 pm)
     'fullDate': equivalent to 'EEEE, MMMM d,y' for en_US locale (e.g. Friday, September 3, 2010)
     'longDate': equivalent to 'MMMM d, y' for en_US locale (e.g. September 3, 2010
     'mediumDate': equivalent to 'MMM d, y' for en_US locale (e.g. Sep 3, 2010)
     'shortDate': equivalent to 'M/d/yy' for en_US locale (e.g. 9/3/10)
     'mediumTime': equivalent to 'h:mm:ss a' for en_US locale (e.g. 12:05:08 pm)
     'shortTime': equivalent to 'h:mm a' for en_US locale (e.g. 12:05 pm)
     */
    new function() {
        function toInt(str) {
            return parseInt(str, 10)
        }

        function padNumber(num, digits, trim) {
            var neg = ""
            if (num < 0) {
                neg = "-"
                num = -num
            }
            num = "" + num
            while (num.length < digits)
                num = "0" + num
            if (trim)
                num = num.substr(num.length - digits)
            return neg + num
        }

        function dateGetter(name, size, offset, trim) {
            return function(date) {
                var value = date["get" + name]()
                if (offset > 0 || value > -offset)
                    value += offset
                if (value === 0 && offset === -12) {
                    value = 12
                }
                return padNumber(value, size, trim)
            }
        }

        function dateStrGetter(name, shortForm) {
            return function(date, formats) {
                var value = date["get" + name]()
                var get = (shortForm ? ("SHORT" + name) : name).toUpperCase()
                return formats[get][value]
            }
        }

        function timeZoneGetter(date) {
            var zone = -1 * date.getTimezoneOffset()
            var paddedZone = (zone >= 0) ? "+" : ""
            paddedZone += padNumber(Math[zone > 0 ? "floor" : "ceil"](zone / 60), 2) + padNumber(Math.abs(zone % 60), 2)
            return paddedZone
        }
        //取得上午下午

        function ampmGetter(date, formats) {
            return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1]
        }
        var DATE_FORMATS = {
            yyyy: dateGetter("FullYear", 4),
            yy: dateGetter("FullYear", 2, 0, true),
            y: dateGetter("FullYear", 1),
            MMMM: dateStrGetter("Month"),
            MMM: dateStrGetter("Month", true),
            MM: dateGetter("Month", 2, 1),
            M: dateGetter("Month", 1, 1),
            dd: dateGetter("Date", 2),
            d: dateGetter("Date", 1),
            HH: dateGetter("Hours", 2),
            H: dateGetter("Hours", 1),
            hh: dateGetter("Hours", 2, -12),
            h: dateGetter("Hours", 1, -12),
            mm: dateGetter("Minutes", 2),
            m: dateGetter("Minutes", 1),
            ss: dateGetter("Seconds", 2),
            s: dateGetter("Seconds", 1),
            sss: dateGetter("Milliseconds", 3),
            EEEE: dateStrGetter("Day"),
            EEE: dateStrGetter("Day", true),
            a: ampmGetter,
            Z: timeZoneGetter
        }
        var DATE_FORMATS_SPLIT = /((?:[^yMdHhmsaZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z))(.*)/,
                NUMBER_STRING = /^\d+$/
        var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/
        // 1        2       3         4          5          6          7          8  9     10      11

        function jsonStringToDate(string) {
            var match
            if (match = string.match(R_ISO8601_STR)) {
                var date = new Date(0),
                        tzHour = 0,
                        tzMin = 0,
                        dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear,
                        timeSetter = match[8] ? date.setUTCHours : date.setHours
                if (match[9]) {
                    tzHour = toInt(match[9] + match[10])
                    tzMin = toInt(match[9] + match[11])
                }
                dateSetter.call(date, toInt(match[1]), toInt(match[2]) - 1, toInt(match[3]))
                var h = toInt(match[4] || 0) - tzHour
                var m = toInt(match[5] || 0) - tzMin
                var s = toInt(match[6] || 0)
                var ms = Math.round(parseFloat('0.' + (match[7] || 0)) * 1000)
                timeSetter.call(date, h, m, s, ms)
                return date
            }
            return string
        }
        var rfixYMD = /^(\d+)\D(\d+)\D(\d+)/
        filters.date = function(date, format) {
            var locate = filters.date.locate,
                    text = "",
                    parts = [],
                    fn, match
            format = format || "mediumDate"
            format = locate[format] || format
            if (typeof date === "string") {
                if (NUMBER_STRING.test(date)) {
                    date = toInt(date)
                } else {
                    var trimDate = date.trim()
                    date = trimDate.replace(rfixYMD, function(a, b, c, d) {
                        var array = d.length === 4 ? [d, b, c] : [b, c, d]
                        return array.join("/")
                    })
                    date = jsonStringToDate(date)
                }
                date = new Date(date)
            }
            if (typeof date === "number") {
                date = new Date(date)
            }
            if (avalon.type(date) !== "date") {
                return
            }
            while (format) {
                match = DATE_FORMATS_SPLIT.exec(format)
                if (match) {
                    parts = parts.concat(match.slice(1))
                    format = parts.pop()
                } else {
                    parts.push(format)
                    format = null
                }
            }
            parts.forEach(function(value) {
                fn = DATE_FORMATS[value]
                text += fn ? fn(date, locate) : value.replace(/(^'|'$)/g, "").replace(/''/g, "'")
            })
            return text
        }
        var locate = {
            AMPMS: {
                0: "上午",
                1: "下午"
            },
            DAY: {
                0: "星期日",
                1: "星期一",
                2: "星期二",
                3: "星期三",
                4: "星期四",
                5: "星期五",
                6: "星期六"
            },
            MONTH: {
                0: "1月",
                1: "2月",
                2: "3月",
                3: "4月",
                4: "5月",
                5: "6月",
                6: "7月",
                7: "8月",
                8: "9月",
                9: "10月",
                10: "11月",
                11: "12月"
            },
            SHORTDAY: {
                "0": "周日",
                "1": "周一",
                "2": "周二",
                "3": "周三",
                "4": "周四",
                "5": "周五",
                "6": "周六"
            },
            fullDate: "y年M月d日EEEE",
            longDate: "y年M月d日",
            medium: "yyyy-M-d ah:mm:ss",
            mediumDate: "yyyy-M-d",
            mediumTime: "ah:mm:ss",
            "short": "yy-M-d ah:mm",
            shortDate: "yy-M-d",
            shortTime: "ah:mm"
        }
        locate.SHORTMONTH = locate.MONTH
        filters.date.locate = locate
    }
    /*********************************************************************
     *                     AMD加载器                                  *
     **********************************************************************/
    var modules = avalon.modules = {
        "ready!": {
            exports: avalon
        },
        "avalon": {
            exports: avalon,
            state: 2
        }
    }

    new function() {
        var loadings = [] //正在加载中的模块列表
        var factorys = [] //储存需要绑定ID与factory对应关系的模块（标准浏览器下，先parse的script节点会先onload）
        var basepath

        function cleanUrl(url) {
            return (url || "").replace(/[?#].*/, "")
        }
        plugins.js = function(url, shim) {
            var id = cleanUrl(url)
            if (!modules[id]) { //如果之前没有加载过
                modules[id] = {
                    id: id,
                    exports: {}
                }
                if (shim) { //shim机制
                    innerRequire(shim.deps || "", function() {
                        loadJS(url, id, function() {
                            modules[id].state = 2
                            if (shim.exports)
                                modules[id].exports = typeof shim.exports === "function" ?
                                        shim.exports() : window[shim.exports]
                            innerRequire.checkDeps()
                        })
                    })
                } else {
                    loadJS(url, id)
                }
            }
            return id
        }
        plugins.css = function(url) {
            var id = url.replace(/(#.+|\W)/g, "") ////用于处理掉href中的hash与所有特殊符号
            if (!DOC.getElementById(id)) {
                var node = DOC.createElement("link")
                node.rel = "stylesheet"
                node.href = url
                node.id = id
                head.insertBefore(node, head.firstChild)
            }
        }
        plugins.css.ext = ".css"
        plugins.js.ext = ".js"

        plugins.text = function(url) {
            var xhr = new XMLHttpRequest
            var id = url.replace(/[?#].*/, "")
            modules[id] = {}
            xhr.onload = function() {
                modules[id].state = 2
                modules[id].exports = xhr.responseText
                innerRequire.checkDeps()
            }
            xhr.onerror = function() {
                avalon.error(url + " 对应资源不存在或没有开启 CORS")
            }
            xhr.open("GET", url, true)
            xhr.withCredentials = true
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
            xhr.send()
            return id
        }
        //http://www.html5rocks.com/zh/tutorials/webcomponents/imports/
        if ('import' in DOC.createElement("link")) {
            plugins.text = function(url) {
                var id = url.replace(/[?#].*/, "")
                modules[id] = {}
                var link = DOC.createElement("link")
                link.rel = "import"
                link.href = url
                link.onload = function() {
                    modules[id].state = 2
                    var content = this["import"]
                    if (content) {
                        modules[id].exports = content.documentElement.outerHTML
                        avalon.require.checkDeps()
                    }
                    onerror(0, content)
                }

                function onerror(a, b) {
                    !b && avalon.error(url + "对应资源不存在或没有开启 CORS")
                    setTimeout(function() {
                        head.removeChild(link)
                    })
                }
                link.onerror = onerror
                head.appendChild(link)
                return id
            }
        }

        var cur = getCurrentScript(true)
        if (!cur) { //处理window safari的Error没有stack的问题
            cur = avalon.slice(document.scripts).pop().src
        }
        var url = cleanUrl(cur)
        basepath = kernel.base = url.slice(0, url.lastIndexOf("/") + 1)

        function getCurrentScript(base) {
            // 参考 https://github.com/samyk/jiagra/blob/master/jiagra.js
            var stack
            try {
                a.b.c() //强制报错,以便捕获e.stack
            } catch (e) { //safari的错误对象只有line,sourceId,sourceURL
                stack = e.stack
            }
            if (stack) {
                /**e.stack最后一行在所有支持的浏览器大致如下:
                 *chrome23:
                 * at http://113.93.50.63/data.js:4:1
                 *firefox17:
                 *@http://113.93.50.63/query.js:4
                 *opera12:http://www.oldapps.com/opera.php?system=Windows_XP
                 *@http://113.93.50.63/data.js:4
                 *IE10:
                 *  at Global code (http://113.93.50.63/data.js:4:1)
                 *  //firefox4+ 可以用document.currentScript
                 */
                stack = stack.split(/[@ ]/g).pop() //取得最后一行,最后一个空格或@之后的部分
                stack = stack[0] === "(" ? stack.slice(1, -1) : stack.replace(/\s/, "") //去掉换行符
                return stack.replace(/(:\d+)?:\d+$/i, "") //去掉行号与或许存在的出错字符起始位置
            }
            var nodes = (base ? DOC : head).getElementsByTagName("script") //只在head标签中寻找
            for (var i = nodes.length, node; node = nodes[--i]; ) {
                if ((base || node.className === subscribers) && node.readyState === "interactive") {
                    return node.className = node.src
                }
            }
        }

        function checkCycle(deps, nick) {
            //检测是否存在循环依赖
            for (var id in deps) {
                if (deps[id] === "司徒正美" && modules[id].state !== 2 && (id === nick || checkCycle(modules[id].deps, nick))) {
                    return true
                }
            }
        }

        function checkDeps() {
            //检测此JS模块的依赖是否都已安装完毕,是则安装自身
            loop: for (var i = loadings.length, id; id = loadings[--i]; ) {
                var obj = modules[id],
                        deps = obj.deps
                for (var key in deps) {
                    if (ohasOwn.call(deps, key) && modules[key].state !== 2) {
                        continue loop
                    }
                }
                //如果deps是空对象或者其依赖的模块的状态都是2
                if (obj.state !== 2) {
                    loadings.splice(i, 1) //必须先移除再安装，防止在IE下DOM树建完后手动刷新页面，会多次执行它
                    fireFactory(obj.id, obj.args, obj.factory)
                    checkDeps() //如果成功,则再执行一次,以防有些模块就差本模块没有安装好
                }
            }
        }


        function checkFail(node, onError) {
            var id = cleanUrl(node.src) //检测是否死链
            node.onload = node.onerror = null
            if (onError) {
                setTimeout(function() {
                    head.removeChild(node)
                })
                log("debug: 加载 " + id + " 失败" + onError + " " + (!modules[id].state))
            } else {
                return true
            }
        }
        var rdeuce = /\/\w+\/\.\./

        function loadResources(url, parent, ret, shim) {
            //1. 特别处理mass|ready标识符
            if (url === "ready!" || (modules[url] && modules[url].state === 2)) {
                return url
            }
            //2.  处理text!  css! 等资源
            var plugin
            url = url.replace(/^\w+!/, function(a) {
                plugin = a.slice(0, -1)
                return ""
            })
            plugin = plugin || "js"
            plugin = plugins[plugin] || noop
            //3. 转化为完整路径
            if (typeof kernel.shim[url] === "object") {
                shim = kernel.shim[url]
            }
            if (kernel.paths[url]) { //别名机制
                url = kernel.paths[url]
            }
            //4. 补全路径
            if (/^(\w+)(\d)?:.*/.test(url)) {
                ret = url
            } else {
                parent = parent.substr(0, parent.lastIndexOf('/'))
                var tmp = url.charAt(0)
                if (tmp !== "." && tmp !== "/") { //相对于根路径
                    ret = basepath + url
                } else if (url.slice(0, 2) === "./") { //相对于兄弟路径
                    ret = parent + url.slice(1)
                } else if (url.slice(0, 2) === "..") { //相对于父路径
                    ret = parent + "/" + url
                    while (rdeuce.test(ret)) {
                        ret = ret.replace(rdeuce, "")
                    }
                } else if (tmp === "/") {
                    ret = parent + url //相对于兄弟路径
                } else {
                    avalon.error("不符合模块标识规则: " + url)
                }
            }
            //5. 补全扩展名
            url = cleanUrl(ret)
            var ext = plugin.ext
            if (ext) {
                if (url.slice(0 - ext.length) !== ext) {
                    ret += ext
                }
            }
            //6. 缓存处理
            if (kernel.nocache) {
                ret += (ret.indexOf("?") === -1 ? "?" : "&") + Date.now()
            }
            return plugin(ret, shim)
        }

        function loadJS(url, id, callback) {
            //通过script节点加载目标模块
            var node = DOC.createElement("script")
            node.className = subscribers //让getCurrentScript只处理类名为subscribers的script节点
            node.onload = function() {
                var factory = factorys.pop()
                factory && factory.delay(id)
                if (callback) {
                    callback()
                }
                log("debug: 已成功加载 " + url)
            }

            node.onerror = function() {
                checkFail(node, true)
            }
            node.src = url //插入到head的第一个节点前，防止IE6下head标签没闭合前使用appendChild抛错
            head.appendChild(node) //chrome下第二个参数不能为null
            log("debug: 正准备加载 " + url) //更重要的是IE6下可以收窄getCurrentScript的寻找范围
        }

        innerRequire = avalon.require = function(list, factory, parent) {
            // 用于检测它的依赖是否都为2
            var deps = {},
                    // 用于保存依赖模块的返回值
                    args = [],
                    // 需要安装的模块数
                    dn = 0,
                    // 已安装完的模块数
                    cn = 0,
                    id = parent || "callback" + setTimeout("1")
            parent = parent || basepath
            String(list).replace(rword, function(el) {
                var url = loadResources(el, parent)
                if (url) {
                    dn++

                    if (modules[url] && modules[url].state === 2) {
                        cn++
                    }
                    if (!deps[url]) {
                        args.push(url)
                        deps[url] = "司徒正美" //去重
                    }
                }
            })
            modules[id] = {//创建一个对象,记录模块的加载情况与其他信息
                id: id,
                factory: factory,
                deps: deps,
                args: args,
                state: 1
            }
            if (dn === cn) { //如果需要安装的等于已安装好的
                fireFactory(id, args, factory) //安装到框架中
            } else {
                //放到检测列队中,等待checkDeps处理
                loadings.unshift(id)
            }
            checkDeps()
        }

        /**
         * 定义模块
         * @param {String} id ? 模块ID
         * @param {Array} deps ? 依赖列表
         * @param {Function} factory 模块工厂
         * @api public
         */
        innerRequire.define = function(id, deps, factory) { //模块名,依赖列表,模块本身
            var args = avalon.slice(arguments)

            if (typeof id === "string") {
                var _id = args.shift()
            }
            if (typeof args[0] === "function") {
                args.unshift([])
            } //上线合并后能直接得到模块ID,否则寻找当前正在解析中的script节点的src作为模块ID
            //现在除了safari外，我们都能直接通过getCurrentScript一步到位得到当前执行的script节点，
            //safari可通过onload+delay闭包组合解决
            var name = modules[_id] && modules[_id].state >= 1 ? _id : cleanUrl(getCurrentScript())
            if (!modules[name] && _id) {
                modules[name] = {
                    id: name,
                    factory: factory,
                    state: 1
                }
            }
            factory = args[1]
            factory.id = _id //用于调试
            factory.delay = function(d) {
                args.push(d)
                var isCycle = true
                try {
                    isCycle = checkCycle(modules[d].deps, d)
                } catch (e) {
                }
                if (isCycle) {
                    avalon.error(d + "模块与之前的模块存在循环依赖，请不要直接用script标签引入" + d + "模块")
                }
                delete factory.delay //释放内存
                innerRequire.apply(null, args) //0,1,2 --> 1,2,0
            }

            if (name) {
                factory.delay(name, args)
            } else { //先进先出
                factorys.push(factory)
            }
        }
        innerRequire.define.amd = modules

        function fireFactory(id, deps, factory) {
            for (var i = 0, array = [], d; d = deps[i++]; ) {
                array.push(modules[d].exports)
            }
            var module = Object(modules[id]),
                    ret = factory.apply(window, array)
            module.state = 2
            if (ret !== void 0) {
                modules[id].exports = ret
            }
            return ret
        }
        innerRequire.config = kernel
        innerRequire.checkDeps = checkDeps
    }

    /*********************************************************************
     *                    DOMReady                                         *
     **********************************************************************/
    var readyList = []
    function fireReady() {
        if (innerRequire) {
            modules["ready!"].state = 2
            innerRequire.checkDeps()//隋性函数，防止IE9二次调用_checkDeps
        } else {
            readyList.forEach(function(a) {
                a(avalon)
            })
        }
        fireReady = noop //隋性函数，防止IE9二次调用_checkDeps
    }

    if (DOC.readyState === "complete") {
        setTimeout(fireReady) //如果在domReady之外加载
    } else {
        DOC.addEventListener("DOMContentLoaded", fireReady)
        window.addEventListener("load", fireReady)
    }
    avalon.ready = function(fn) {
        if (innerRequire) {
            innerRequire("ready!", fn)
        } else if (fireReady === noop) {
            fn(avalon)
        } else {
            readyList.push(fn)
        }
    }
    avalon.config({
        loader: true
    })
    var msSelector = "[ms-controller],[ms-important]"
    avalon.ready(function() {
        var elems = DOC.querySelectorAll(msSelector),
                nodes = []
        for (var i = 0, elem; elem = elems[i++]; ) {
            if (!elem.__root__) {
                var array = elem.querySelectorAll(msSelector)
                for (var j = 0, el; el = array[j++]; ) {
                    el.__root__ = true
                }
                nodes.push(elem)
            }
        }
        for (var i = 0, elem; elem = nodes[i++]; ) {
            avalon.scan(elem)
        }
    })
})(document)