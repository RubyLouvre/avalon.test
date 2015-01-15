define([], function() {
////////////////////////////////////////////////////////////////////////
//////////    最前面的是与绑定没关的测试   /////////////////////////////
////////////////////////////////////////////////////////////////////////

    describe("扫描机制", function() {
        it("async", function(done) {
            var model = avalon.define({
                $id: "test",
                array: [1, 2, 3, 4],
                bbb: "xxx",
                aaa: "yyy",
                color: "green",
                toggle: false,
                s1: "组件第一行"
            })
            avalon.ui.scandal = function(element, data) {
                return avalon.define(data.scandalId, function(vm) {
                    avalon.mix(vm, data.scandalOptions)
                    vm.s2 = "组件第二行"
                    vm.$init = function(continueScan) {
                        element.innerHTML = "<p>{{s1}}</p><p>{{s2}}</p>"
                        continueScan()
                    }
                    vm.$remove = function() {
                        element.innerHTML = ""
                    }
                })
            }
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<div ms-data-aaa="bbb" ms-repeat="array" ms-css-background="color" id="scanIf1"><div>{{el}}</div></div>' +
                    '<div ms-data-aaa="bbb" ms-each="array" ms-css-background="color" id="scanIf2"><div>{{el}}</div></div>' +
                    '<div ms-if="toggle"  ms-data-xxx="aaa" id="scanIf3">{{bbb}}</div> {{color}}</div>' +
                    '<div ms-if="!toggle" ms-data-xxx="aaa" id="scanIf4">{{color}}</div>' +
                    '<div ms-widget="scandal" ms-data-scandal-s1="s1" id="scanIf5"></div>'
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                function get(id) {
                    return document.getElementById(id)
                }
                expect(get("scanIf1").style.backgroundColor).to.be("green")
                expect(get("scanIf2").style.backgroundColor).to.be("green")
                var scanIf3 = get("scanIf3")
                expect(scanIf3.parentNode.tagName.toUpperCase()).to.be("AVALON")
                expect(scanIf3.getAttribute("ms-data-xxx")).to.be("aaa")
                expect(scanIf3.getAttribute("ms-if")).to.be("toggle")
                expect(get("scanIf4").getAttribute("data-xxx")).to.be("yyy")
                expect(get("scanIf5").getAttribute("data-scandal-s1")).to.be("组件第一行")
                var ps = get("scanIf5").getElementsByTagName("p")
                expect(ps.length).to.be(2)
                expect(ps[0].innerHTML).to.be("组件第一行")
                expect(ps[1].innerHTML).to.be("组件第二行")
                setTimeout(function() {

                    body.removeChild(div)
                    done()
                })
            }, 100)
        })
    })

    describe("设置透明度", function() {
//确保位置没有错乱
        it("sync", function() {
            var body = document.body
            var div = document.createElement("div")
            body.appendChild(div)
            var el = avalon(div)
            el.css("opacity", 0.1)
            expect(Number(el.css("opacity")).toFixed(2)).to.be("0.10")

            el.css("opacity", 0.6)
            expect(Number(el.css("opacity")).toFixed(2)).to.be("0.60")

            el.css("opacity", 8)

            expect(el.css("opacity")).to.be("1")
            body.removeChild(div)
        })
    })
    describe("确保数组的$model与它的元素的$model是共通的", function() {
        //确保位置没有错乱
        it("sync", function() {
            var test = avalon.define("array$model", function(vm) {
                vm.array = [{id: 1}, {id: 2}, {id: 3}, {id: 4}]
            })
            expect(test.array.$model[0]).to.be(test.array[0].$model)
        })
    })

    describe('newparser', function() {
        //确保位置没有错乱
        it("sync", function() {

            var str = 'bbb["a\aa"]'

            var rcomments = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg  // form http://jsperf.com/remove-comments
            var rbracketstr = /\[(['"])[^'"]+\1\]/g
            var rspareblanks = /\s*(\.|'|")\s*/g
            var rvariable = /"(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'|\.?[a-z_$]\w*/ig
            var rexclude = /^['".]/
            function getVariables(code) {
                var match = code
                        .replace(rcomments, "")//移除所有注释
                        .replace(rbracketstr, "")//将aaa["xxx"]转换为aaa 去掉子属性
                        .replace(rspareblanks, "$1")//将"' aaa .  bbb'"转换为"'aaa.ddd'"
                        .match(rvariable) || []
                var vars = [], unique = {}
                for (var i = 0; i < match.length; ++i) {
                    var variable = match[i]
                    if (!rexclude.test(variable) && !unique[variable]) {
                        unique[variable] = vars.push(variable)
                    }
                }
                return vars
            }
            var arr = getVariables(str)
            expect(arr.length).to.be(1)
            expect(arr[0]).to.be("bbb")
        })
    })

    describe("shortcircuit", function() {
        it("async", function(done) {
            var body = document.body
            var div = document.createElement("div")
            var str = '<select id="select1">' +
                    '    <option ms-repeat="data" ms-if-loop="(el.id.indexOf(filter) > -1) || (el.name.indexOf(filter) > -1)">{{ el.name }}</option>' +
                    '</select>' +
                    '<select id="select2">' +
                    '    <option ms-repeat="data" ms-if-loop="el.id.indexOf(filter) > -1">{{ el.name }}</option>' +
                    '</select>' +
                    '<select id="select3">' +
                    '    <option ms-repeat="data" ms-if-loop="el.name.indexOf(filter) > -1">{{ el.name }}</option>' +
                    '</select>' +
                    '<input type="text" ms-duplex="filter"/>'
            div.innerHTML = str
            body.appendChild(div)
            var vm = avalon.define({
                $id: "shortcircuit",
                filter: "",
                data: [
                    {id: "47", name: "111"},
                    {id: "58", name: "222"},
                    {id: "69", name: "333"}
                ]
            });
            avalon.scan(div, vm)
            setTimeout(function() {
                var s = div.getElementsByTagName("select")
                expect(avalon(s[0]).val()).to.be("111")
                expect(avalon(s[1]).val()).to.be("111")
                expect(avalon(s[2]).val()).to.be("111")
                vm.filter = "22"
                setTimeout(function() {
                    var s = div.getElementsByTagName("select")
                    expect(avalon(s[0]).val()).to.be("222")
                    expect(avalon(s[1]).val() || "").to.be("")
                    expect(avalon(s[2]).val()).to.be("222")
                    vm.filter = "5"
                    setTimeout(function() {
                        var s = div.getElementsByTagName("select")
                        expect(avalon(s[0]).val()).to.be("222")
                        expect(avalon(s[1]).val()).to.be("222")
                        expect(avalon(s[2]).val() || "").to.be("")
                        vm.filter = "5"
                        delete avalon.vmodels.shortcircuit
                        div.innerHTML = ""
                        body.removeChild(div)
                        done()

                    }, 150)

                }, 150)

            }, 150)

        })
    })
    describe("array.splice(0,0,1,2,3)", function() {
        it("async", function(done) {
            var body = document.body
            var div = document.createElement("div")
            var str = ' <ul>' +
                    '   <li ms-repeat="array">{{el}}</li>' +
                    '</ul>'
            div.innerHTML = str
            body.appendChild(div)
            var vm = avalon.define({
                $id: "arraysplice",
                array: [1, 2]
            });
            avalon.scan(div, vm)
            setTimeout(function() {
                var s = div.getElementsByTagName("li")
                expect(s[0].innerHTML).to.be("1")
                expect(s[1].innerHTML).to.be("2")
                vm.array.splice(0, 0, 3, 4, 5)

                setTimeout(function() {
                    var s = div.getElementsByTagName("li")
                    expect(s.length).to.be(5)
                    expect(s[0].innerHTML).to.be("3")
                    expect(s[1].innerHTML).to.be("4")
                    expect(s[2].innerHTML).to.be("5")
                    expect(s[3].innerHTML).to.be("1")
                    expect(s[4].innerHTML).to.be("2")
                    delete avalon.vmodels.shortcircuit
                    div.innerHTML = ""
                    body.removeChild(div)
                    done()

                }, 150)

            }, 150)

        })
    })

    describe("avalon.parseHTML", function() {
        avalon.parseHTML.p = 1
        it("async", function(done) {             //函数,正则,元素,节点,文档,window等对象为非

            var node = avalon.parseHTML("<b><script> avalon.parseHTML.p  += 10<\/script></b>").firstChild
            var body = document.body
            body.appendChild(node)

            //IE6-8下移除所有动态生成的BR元素
            var node2 = avalon.parseHTML("<b></b><script><\/script><b></b><script><\/script><b></b>")
            var div = document.createElement("div")
            body.appendChild(div)
            div.appendChild(node2)
            expect(div.getElementsByTagName("br").length).to.be(0)

            //IE6-8下移除所有动态生成的caption元素
            var nodes = avalon.parseHTML("<tr><td>1</td></tr>").childNodes

            expect(nodes.length).to.be(1)

            var nodes = avalon.parseHTML("<option>xxx</option>").childNodes

            expect(nodes.length).to.be(1)

            var nodes = avalon.parseHTML('<area shape="rect" coords="22,83,126,125" alt="HTML Tutorial"href="/html/index.htm"  target="_blank" />').childNodes
            expect(nodes.length).to.be(1)

            var nodes = avalon.parseHTML("<legend>legend</legend>").childNodes

            expect(nodes.length).to.be(1)

            var nodes = avalon.parseHTML('<param name="audio" value="music.wav" /><param name="width" value="600" /><param name="height" value="400" />').childNodes
            expect(nodes.length).to.be(3)


            setTimeout(function() {
                expect(avalon.parseHTML.p).to.be(11)
                delete avalon.parseHTML.p
                body.removeChild(node)
                body.removeChild(div)
                done()
            }, 300)

        })
    })
    describe("avalon.innerHTML", function() {
        //确保位置没有错乱
        it("async", function(done) {

            var body = document.body
            var div = document.createElement("div")
            var id = "ms" + (new Date - 0)
            var str = ("<span></span><script>avalon.XXXX = 'XXXX'<\/script>").replace(/XXXX/g, id)
            body.appendChild(div)
            avalon.innerHTML(div, str)
            setTimeout(function() {
                var spans = div.getElementsByTagName("span")
                expect(spans.length).to.be(1)
                expect(avalon[id]).to.be(id)
                delete avalon[id]

                body.removeChild(div)
                done()
            }, 300)


        })
    })
    describe("avalon.isWindow", function() {

        it("sync", function() {
            expect(avalon.isWindow(1)).to.be(false)
            expect(avalon.isWindow({})).to.be(false)
            //自定义的环引用对象
            var obj = {
            }
            obj.window = obj

            expect(avalon.isWindow(obj)).to.be(false)
            expect(avalon.isWindow(window)).to.ok()

            var iframe = document.createElement("iframe")
            document.body.appendChild(iframe)
            var iwin = iframe.contentWindow || iframe.contentDocument.parentWindow
            //检测iframe的window对象
            expect(avalon.isWindow(iwin)).to.ok()
            document.body.removeChild(iframe)
        })

    })

    describe("avalon.isPlainObject", function() {

        it("sync", function() {
            //不能DOM, BOM与自定义"类"的实例
            expect(avalon.isPlainObject([])).to.be(false)
            expect(avalon.isPlainObject(1)).to.be(false)
            expect(avalon.isPlainObject(null)).to.be(false)
            expect(avalon.isPlainObject(void 0)).to.be(false)
            expect(avalon.isPlainObject(window)).to.be(false)
            expect(avalon.isPlainObject(document.body)).to.be(false)
            if (window.dispatchEvent) {
                expect(avalon.isPlainObject(window.location)).to.be(false)
            }
            var fn = function() {
            }
            expect(avalon.isPlainObject(fn)).to.be(false)
            fn.prototype = {
                someMethod: function() {
                }
            };
            expect(avalon.isPlainObject(new fn)).to.be(false)
            expect(avalon.isPlainObject({})).to.be(true)
            expect(avalon.isPlainObject({
                aa: "aa",
                bb: "bb",
                cc: "cc"
            })).to.be(true)
            expect(avalon.isPlainObject(new Object)).to.be(true)
        })

    })

    describe("avalon.isFunction", function() {
        if (avalon.isFunction) {
            it("sync", function() {
                //不能DOM, BOM与自定义"类"的实例
                expect(avalon.isFunction(eval)).to.be(true)
                expect(avalon.isFunction(confirm)).to.be(true)
                expect(avalon.isFunction(window.open)).to.be(true)
                expect(avalon.isFunction(alert)).to.be(true)
                expect(avalon.isFunction(document.getElementById)).to.be(true)
                expect(avalon.isFunction(avalon.isFunction)).to.be(true)
                expect(avalon.isFunction(document.createElement)).to.be(true)
            })
        }
    })


    describe("textNode.nodeValue === textNode.data", function() {
        it("sync", function() {

            var element = document.createElement("div")
            element.innerHTML = "zzzz<!--yyy-->"
            document.body.appendChild(element)
            var first = element.firstChild
            expect(first.nodeType).to.be(3)
            expect(element.lastChild.nodeType).to.be(8)
            first.data = "xxx"
            expect(first.nodeValue).to.be("xxx")
            expect(element.innerText || element.textContent).to.be("xxx")
            expect(first.nodeValue).to.be(first.data)
            expect(element.lastChild.nodeValue).to.be(element.lastChild.data)
            document.body.removeChild(element)

        })
    })

    describe("ms-html", function() {
        it("async1", function(done) {
            var model = avalon.define({
                $id: "ms-html1",
                array: ["<span>{{$index}}</span>", "<span>{{$index}}</span>", "<span>{{$index}}</span>"]
            })
            var div = document.createElement("div")
            div.innerHTML = '<div ms-repeat="array" ms-html="el"></div>'
            var body = document.body
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var spans = div.getElementsByTagName("span")
                expect(spans.length).to.be(3)
                expect(spans[0].innerHTML).to.be("0")
                expect(spans[1].innerHTML).to.be("1")
                expect(spans[2].innerHTML).to.be("2")
                delete avalon.vmodels["ms-html1"]
                div.innerHTML = ""
                body.removeChild(div)
                done()
            }, 100)
        })

        it("async2", function(done) {
            var div = document.createElement("div")
            var model = avalon.define({
                $id: "ms-html2",
                toggle: false,
                html: "<span>11</span><strong>222</strong><span>333</span><strong>444</strong><span>555</span><strong>666</strong>",
                show: function() {
                    model.toggle = true
                },
                scan: function() {
                    avalon.scan(div)
                }
            });

            div.innerHTML = '<div ms-if="toggle">%%%%{{html|html}}%%%%</div>'
            var body = document.body
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var divs = div.getElementsByTagName("div")
                expect(divs.length).to.be(0)
                model.scan()
                setTimeout(function() {
                    model.show()
                    setTimeout(function() {
                        model.show()
                        var spans = div.getElementsByTagName("span")
                        var strongs = div.getElementsByTagName("strong")
                        expect(spans.length).to.be(3)
                        expect(strongs.length).to.be(3)
                        delete avalon.vmodels["ms-html2"]
                        div.innerHTML = ""
                        body.removeChild(div)
                        done()
                    }, 100)
                }, 100)
            }, 100)
        })
    })

    describe("avalon.slice", function() {

        it("sync", function() {
            var a = [1, 2, 3, 4, 5, 6, 7]
            expect(avalon.slice(a, 0)).to.eql(a.slice(0))
            expect(avalon.slice(a, 1, 4)).to.eql(a.slice(1, 4))
            expect(avalon.slice(a, -1)).to.eql(a.slice(-1))
            expect(avalon.slice(a, 1, -2)).to.eql(a.slice(1, -2))
            expect(avalon.slice(a, 1, NaN)).to.eql(a.slice(1, NaN))
            expect(avalon.slice(a, 1, 2.1)).to.eql(a.slice(1, 2.1))
            expect(avalon.slice(a, 1.1, 4)).to.eql(a.slice(1.1, 4))
            expect(avalon.slice(a, 1.2, NaN)).to.eql(a.slice(1, NaN))
            expect(avalon.slice(a, NaN)).to.eql(a.slice(NaN))
            expect(avalon.slice(a, 1.3, 3.1)).to.eql(a.slice(1.3, 3.1))
            expect(avalon.slice(a, 2, "XXX")).to.eql(a.slice(2, "XXX"))
            expect(avalon.slice(a, -2)).to.eql(a.slice(-2))
            expect(avalon.slice(a, 1, 9)).to.eql(a.slice(1, 9))
            expect(avalon.slice(a, 20, -21)).to.eql(a.slice(20, -21))
            expect(avalon.slice(a, -1, null)).to.eql(a.slice(-1, null))
        })

    })



    describe("内部方法isArrayLike", function() {

        function isArrayLike(obj) {
            if (obj && typeof obj === "object" && !avalon.isWindow(obj)) {
                var n = obj.length
                if (+n === n && !(n % 1) && n >= 0) { //检测length属性是否为非负整数
                    try {
                        if ({}.propertyIsEnumerable.call(obj, "length") === false) { //如果是原生对象
                            return Array.isArray(obj) || /^\s?function/.test(obj.item || obj.callee)
                        }
                        return true
                    } catch (e) { //IE的NodeList直接抛错
                        return true
                    }
                }
            }
            return false
        }

        it("sync", function() {
            //函数,正则,元素,节点,文档,window等对象为非
            expect(isArrayLike(function() {
            })).to.be(false);
            expect(isArrayLike(document.createElement("select"))).to.be(true);
            expect(isArrayLike("string")).to.be(false)
            expect(isArrayLike(/test/)).to.be(false)

            expect(isArrayLike(window)).to.be(false)
            expect(isArrayLike(document)).to.be(false)

            expect(isArrayLike(arguments)).to.be.ok()
            expect(isArrayLike(document.links)).to.be.ok()
            expect(isArrayLike(document.documentElement.childNodes)).to.be.ok()
            //自定义对象必须有length,并且为非负正数
            expect(isArrayLike({
                0: "a",
                1: "b",
                length: 2
            })).to.be.ok()

        })

    })

    describe("vm.array = vm.array", function() {
        //确保位置没有错乱
        it("async", function(done) {
            var a = avalon.define("vm.array", function(vm) {
                vm.array = [1, 2, 3]
            });
            setTimeout(function() {
                a.array = a.array
                setTimeout(function() {
                    expect(avalon.type(a.array)).to.be("array")
                    done()
                }, 200)
            }, 100)
        })
    })

//    describe("计算属性多次初触发", function() {
//        //确保位置没有错乱
//        it("sync", function() {
//            var index = 1
//            var model = avalon.define("computed2", function(vm) {
//                vm.salary1 = 1
//                vm.salary2 = 2
//                vm.salary3 = 3
//                vm.amount = {
//                    get: function() {
//                        index++
//                        return this.salary1 + this.salary2 + this.salary3;
//                    }
//                };
//            });
//            expect(index).to.be(1)
//            expect(model.amount).to.be(6)
//            model.salary1 = 1000
//            expect(index).to.be(2)
//            expect(model.amount).to.be(1005)
//            model.salary2 = 100
//            expect(index).to.be(3)
//            expect(model.amount).to.be(1103)
//            model.salary3 = 10
//            expect(index).to.be(4)
//            expect(model.amount).to.be(1110)
//            avalon.vmodels.computed2
//        })
//    })
    describe("avalon.range", function() {

        it("sync", function() {
            expect(avalon.range(10)).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
            expect(avalon.range(1, 11)).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
            expect(avalon.range(0, 30, 5)).to.eql([0, 5, 10, 15, 20, 25])
            expect(avalon.range(0, -10, -1)).to.eql([0, -1, -2, -3, -4, -5, -6, -7, -8, -9])
            expect(avalon.range(0)).to.eql([])
        })

    })

    describe("filters.sanitize", function() {

        it("async", function(done) {
            var str = "<a href='javascript:fix'>SSS</a><img onclick=333 src=http://tp2.sinaimg.cn/1823438905/180/40054009869/1/><p onfocus='aaa' ontap=\"ddd\" title=eee onkeypress=eee>onmousewheel=eee<span onmouseup='ddd'>DDD</span></p><script>alert(1)<\/script>222222"
            var ret = avalon.filters.sanitize(str)
            expect(ret.indexOf("fix")).to.be(-1)
            expect(ret.indexOf("onclick")).to.be(-1)
            expect(ret.indexOf("ontap")).to.be(-1)
            expect(ret.indexOf("onkeypress")).to.be(-1)
            expect(ret.indexOf("onfocus")).to.be(-1)
            expect(ret.indexOf("onmouseup")).to.be(-1)
            expect(ret.indexOf("<script")).to.be(-1)
            expect(ret.indexOf("onmousewheel")).not.to.be(-1)

            var model = avalon.define({
                $id: "multiFilter",
                test: str
            })

            var div = document.createElement("div")
            div.innerHTML = '{{test|lowercase|truncate(239)|sanitize|html}}'

            var body = document.body
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var ret = div.innerHTML
                //console.log(ret)
                expect(ret.indexOf("fix")).to.be(-1)
                expect(ret.indexOf("onclick")).to.be(-1)
                expect(ret.indexOf("ontap")).to.be(-1)
                expect(ret.indexOf("onkeypress")).to.be(-1)
                expect(ret.indexOf("onfocus")).to.be(-1)
                expect(ret.indexOf("onmouseup")).to.be(-1)
                expect(ret.indexOf("<script")).to.be(-1)
                expect(ret.indexOf("onmousewheel")).not.to.be(-1)
                expect(ret.indexOf("222")).to.be(-1)
                var as = div.getElementsByTagName("a")
                expect(as.length).to.be(1)
                expect(as[0].innerHTML).to.be("sss")
                as = div.getElementsByTagName("span")
                expect(as.length).to.be(1)
                expect(as[0].innerHTML).to.be("ddd")
                delete avalon.vmodels["multiFilter"]
                div.innerHTML = ""
                body.removeChild(div)
                done()
            }, 100)
        })

    })
    describe("avalon.oneObject", function() {

        it("sync", function() {
            expect(avalon.oneObject("aa,bb,cc")).to.eql({
                "aa": 1,
                "bb": 1,
                "cc": 1
            })
            expect(avalon.oneObject([1, 2, 3], false)).to.eql({
                "1": false,
                "2": false,
                "3": false
            })
        })

    })

    describe("avalon.parseDisplay", function() {
        it("sync", function() {
            expect(typeof avalon.parseDisplay).to.be("function")
        })
    })


    describe("addClass,removeClass", function() {

        it("async", function(done) {
            avalon.ready(function() {
                var body = avalon(document.body)
                body.addClass("aaaa bbbb cccc dddd bbbb")
                expect(body[0].className).to.be("aaaa bbbb cccc dddd")
                body.removeClass("aaaa bbbb cccc dddd bbbb")
                expect(body[0].className).to.be("")
                done()
            })
        })

    })

    describe("filters.date", function() {
        //验证最常用的日期过滤器
        it("sync", function() {
            var format = "yyyy MM dd:HH:mm:ss"
            expect(avalon.filters.date(new Date("2014/4/1"), format)).to.be("2014 04 01:00:00:00")
            expect(avalon.filters.date("2011/07/08", format)).to.be("2011 07 08:00:00:00")
            expect(avalon.filters.date("2011-07-08", format)).to.be("2011 07 08:00:00:00")
            expect(avalon.filters.date("01-10-2000", format)).to.be("2000 01 10:00:00:00")
            expect(avalon.filters.date("07 04,2000", format)).to.be("2000 07 04:00:00:00")
            expect(avalon.filters.date("3 14,2000", format)).to.be("2000 03 14:00:00:00")
            expect(avalon.filters.date("1373021259229", format)).to.be("2013 07 05:18:47:39")
            expect(avalon.filters.date("2014-06-10T15:21:2", format)).to.be("2014 06 10:15:21:02")
            expect(avalon.filters.date("2014-12-07T22:50:58+08:00", format)).to.be("2014 12 07:22:50:58")
            expect(avalon.filters.date(1373021259229, format)).to.be("2013 07 05:18:47:39")
        })
        it("async", function(done) {
            var model = avalon.define({
                $id: "dateFilter",
                test: "2014/12/24"
            })
            var div = document.createElement("div")
            div.innerHTML = '{{test|date("yyyy MM dd:HH:mm:ss")}}'
            var body = document.body
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                expect(div.innerHTML).to.be("2014 12 24:00:00:00")
                delete avalon.vmodels["dateFilter"]
                div.innerHTML = ""
                body.removeChild(div)
                done()
            }, 100)
        })
    })
    ////////////////////////////////////////////////////////////////////////
    //////////    下面是绑定属性,监控属性相关   ////////////////////////////
    ////////////////////////////////////////////////////////////////////////


    describe("计算属性", function() {
        it("async", function() {
            var model = avalon.define("computed", function(vm) {
                vm.firstName = "司徒";
                vm.lastName = "正美"
                vm.fullName = {
                    set: function(val) {
                        var array = val.split(" ")
                        this.firstName = array[0]
                        this.lastName = array[1]
                    },
                    get: function() {
                        return this.firstName + " " + this.lastName;
                    }
                }
                vm.$watch("fullName", function(a) {
                    expect(a).to.be("清风 火羽")
                })

            })

            expect(model.fullName).to.be("司徒 正美")
            model.fullName = "清风 火羽"
            expect(model.firstName).to.be("清风")
            expect(model.lastName).to.be("火羽")
        })

        it("async2", function(done) {
            var model = avalon.define("computed2", function(vm) {
                vm.test0 = false;
                vm.test1 = {
                    set: function(val) {
                        this.test0 = val;
                    },
                    get: function() {
                        return this.test0;
                    }
                };
                vm.test2 = false;
                vm.$watch('test1', function(val) {
                    vm.test2 = val;
                });
                vm.one = function() {
                    vm.test1 = !vm.test1;
                };
                vm.two = function() {
                    vm.test0 = !vm.test0;
                };
            });
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<div > <button ms-click=\"one\" type=\"button\">\u6D4B\u8BD51</button> <button ms-click=\"two\" type=\"button\">\u6D4B\u8BD52</button> <br>test1: {{test1}} <br>test2: {{test2}}</div>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var buttons = div.getElementsByTagName("button")
                buttons[0].click()
                expect(model.test0).to.be(true)
                expect(model.test1).to.be(true)
                setTimeout(function() {
                    buttons[1].click()
                    expect(model.test0).to.be(false)
                    expect(model.test1).to.be(false)
                    delete avalon.vmodels.computed2
                    body.removeChild(div)
                    done()
                }, 100)

            }, 100)

        })

        it("async3", function(done) {
            var model = avalon.define("computed3", function(vm) {
                vm.test0 = false;
                vm.test1 = false;
                vm.test2 = false;
                vm.msg = '';
                vm.$watch('test0', function(val) {
                    if (val) {
                        vm.msg += 'test0-';
                        vm.test1 = true;
                        if (vm.test2) {
                            vm.msg = 'ok';
                        }
                        vm.msg += '！！';
                    }
                });
                vm.$watch('test1', function(val) {
                    if (val) {
                        vm.msg += 'test1-';
                        vm.test2 = true;
                    }
                });
                vm.one = function() {
                    vm.test0 = true;
                };
            });
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<div type=\"button\"><button ms-click=\"one\">\u6D4B\u8BD51</button><br>test0: {{test0}}<br>test1: {{test1}}<br>test2: {{test2}}<br>msg: {{msg}}</div>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                div.getElementsByTagName("button")[0].click()
                setTimeout(function() {
                    expect(model.test0).to.be(true)
                    expect(model.test1).to.be(true)
                    expect(model.test2).to.be(true)
                    expect(model.msg).to.be("ok！！")
                    delete avalon.vmodels.computed3
                    body.removeChild(div)
                    done()
                })
            }, 100)

        })

        it("sync", function() {
            var model = avalon.define({
                $id: "computed4",
                test1: "test1",
                test2: {
                    get: function() {
                        return this.test1;
                    }
                }
            });
            expect(model.test2).to.be("test1")
            model.test1 = "test@@@"
            expect(model.$model.test2).to.be("test@@@")
            delete avalon.vmodels.computed4
        })

    });

    describe("属性绑定", function() {

        it("async", function(done) {
            var model = avalon.define("ms-attr-*", function(vm) {
                vm.aaa = "new"
                vm.active = "ok"
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<div ms-controller=\"ms-attr-*\"><input ms-attr-value='aaa' ms-attr-class='active' value='old'></div>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var input = div.getElementsByTagName("input")[0]

                expect(input.value).to.be("new")
                expect(input.className).to.be("ok")

                body.removeChild(div)
                done()
            }, 100)
        })

    })

    describe("对于不存在的属性将不移除对应的插值表达式或绑定属性", function() {
        //移除操作分别在parseExprProxy与executeBindings里
        it("async", function(done) {
            var model = avalon.define('parseExprProxy', function(vm) {
                vm.name = "名字"
                vm.answer = "短笛"
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<div >我的{{name}}叫{{answer}},他的{{name}}叫{{no}},{{10*10}}" +
                    "</div><p  ms-text=\"name\"></p> <p  ms-text=\"no\"></p>"
            body.appendChild(div)
            avalon.scan(div, model)

            setTimeout(function() {
                var test = div.getElementsByTagName("div")[0]
                var pp = div.getElementsByTagName("p")
                expect(test.innerHTML).to.be("我的名字叫短笛,他的名字叫{{no}},100")
                expect(pp[0].getAttribute("ms-text") || "").to.be("")
                expect(pp[1].getAttribute("ms-text")).to.be("no")
                body.removeChild(div)
                done()
            })
        })

    })


    describe("事件绑定", function() {
        //移除操作分别在parseExprProxy与executeBindings里
        it("async", function(done) {
            var val = false
            var model = avalon.define('onclick', function(vm) {
                vm.f1 = function() {
                    val = true
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<button type='button' ms-click='f1'>click me</button>"
            body.appendChild(div)
            avalon.scan(div, model)

            setTimeout(function() {
                var test = div.getElementsByTagName("button")[0]
                test.click()
                setTimeout(function() {
                    expect(val).to.be(true)
                    body.removeChild(div)
                    done()
                }, 300)
            })
        })

    })

    describe("checked绑定", function() {
        it("async", function(done) {
            var model = avalon.define('checkedx', function(vm) {
                vm.x = 0
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<input type='radio' ms-attr-checked='x'/>checkedx"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var test = div.getElementsByTagName("input")[0]
                expect(test.checked).to.be(false)
                body.removeChild(div)
                done()
            }, 300)
        })
    })
    describe("插值表达式", function() {
        it("async", function(done) {
            var model = avalon.define({
                $id: "texttext",
                x: '{{uuu}}',
                y: '{{bbb}}',
                arr: [1, 2, 3]
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = 'A：<div ms-each="arr">{{x}}</div>B：<div ms-repeat="arr">{{y}}</div>'
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var ps = div.getElementsByTagName("div")
                var prop = "textContent" in div ? "textContent" : "innerText"
                expect(ps.length).to.be(4)
                expect(ps[0][prop]).to.be("{{uuu}}{{uuu}}{{uuu}}")
                expect(ps[1][prop]).to.be("{{bbb}}")
                expect(ps[2][prop]).to.be("{{bbb}}")
                expect(ps[3][prop]).to.be("{{bbb}}")
                div.innerHTML = ""
                body.removeChild(div)
                done()

            }, 300)
        })
    })
    describe("类名绑定", function() {
        it("async", function(done) {
            var model = avalon.define({
                $id: "ms-class-test",
                b: "xxx",
                toggle: true
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<p ms-class='aaa {{b}} ccc: toggle'></p><p ms-class='aaa bbb ccc: !toggle'></p>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var ps = div.getElementsByTagName("p")
                expect(ps[0].className).to.be("aaa xxx ccc")
                expect(ps[1].className).to.be("")
                model.toggle = false
                setTimeout(function() {
                    expect(ps[0].className).to.be("")
                    expect(ps[1].className).to.be("aaa bbb ccc")
                    body.removeChild(div)
                    done()
                }, 300)
            }, 300)
        })
    })
    ////////////////////////////////////////////////////////////////////////
    //////////    下面是ms-duplex及ms-duplex-*相关        /////////////////////
    ////////////////////////////////////////////////////////////////////////
    describe("双工绑定", function() {
        it("sync", function() {
            var reg = /\w\[.*\]|\w\.\w/
            //用于ms-duplex
            expect(reg.test("aaa[bbb]")).to.be(true)
            expect(reg.test("aaa.kkk")).to.be(true)
            expect(reg.test("eee")).to.be(false)
        })

        it("async", function(done) {
            var model = avalon.define("ms-duplex-regexp", function(vm) {
                vm.aaa = {
                    xxx: "444",
                    yyy: "555"
                }
                vm.bbb = "yyy"
                vm.ccc = "text";
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = ['<input ms-duplex="aaa[\'xxx\']">',
                '<input ms-duplex="aaa[bbb]">',
                '<input ms-duplex="ccc"/>',
                '<p>{{ccc}}</p>',
                '<p>{{aaa.xxx}}</p>',
                '<p>{{aaa.yyy}}</p>'].join('')
            body.appendChild(div)
            avalon.scan(div, model)

            setTimeout(function() {//必须等扫描后才能开始测试，100-400ms是一个合理的数字
                var ps = div.getElementsByTagName("p")
                expect(ps[0].innerHTML).to.be("text")
                expect(ps[1].innerHTML).to.be("444")
                expect(ps[2].innerHTML).to.be("555")
                model.ccc = "change"
                setTimeout(function() {
                    expect(ps[0].innerHTML).to.be("change")
                    body.removeChild(div)
                    delete avalon.vmodels["ms-duplex-regexp"]
                    done()
                })
            })

        })
        it("textarea", function(done) {
            var model = avalon.define({
                $id: "textarea",
                aaa: 111,
                bbb: 222
            })

            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<textarea ms-duplex="aaa" id="aaa"></textarea><span>{{aaa}}</span>' +
                    '<input ms-duplex="bbb" id="bbb"><span>{{bbb}}</span>'
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var aaa = div.getElementsByTagName("textarea")[0]
                var bbb = div.getElementsByTagName("input")[0]
                aaa.value = "textarea"
                bbb.value = "input"
                setTimeout(function() {
                    var spans = div.getElementsByTagName("span")
                    expect(spans[0].innerHTML).to.be("textarea")
                    expect(spans[1].innerHTML).to.be("input")
                    body.removeChild(div)
                    delete avalon.vmodels["textarea"]
                    done()
                }, 100)
            }, 100)
        })

    })
    describe("双工绑定ms-duplex-boolean", function() {
        //ms-duplex-bool只能用于radio控件，会自动转换value为布尔，同步到VM
        it("async", function(done) {
            var model = avalon.define({
                $id: "ms-duplex-boolean",
                aaa: false
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = ['<input ms-duplex-boolean="aaa" type="radio" value="true">',
                '<input ms-duplex-boolean="aaa" type="radio" value="false">'
            ].join("")
            body.appendChild(div)
            avalon.scan(div, model)

            setTimeout(function() {
                var inputs = div.getElementsByTagName("input")
                expect(inputs[0].checked).to.be(false)
                expect(inputs[1].checked).to.be(true)
                inputs[0].click()
                expect(inputs[0].checked).to.be(true)
                expect(model.aaa).to.be(true)
                body.removeChild(div)
                delete avalon.vmodels["ms-duplex-boolean"]
                done()
            }, 100)
        })
    })

    describe("双工绑定ms-duplex-string", function() {
        it("async", function(done) {
            var div = document.createElement("div")
            div.innerHTML = '<input ms-duplex-string="xxx" type="radio"  value="aaa">aaa' +
                    '<input ms-duplex-string="xxx" type="radio" value="bbb">bbb' +
                    '<input ms-duplex-string="xxx" type="radio" value="ccc">ccc'
            document.body.appendChild(div)

            var model = avalon.define({
                $id: "ms-click-ms-duplex",
                xxx: "bbb"
            })
            avalon.scan(div, model)
            setTimeout(function() {//必须等扫描后才能开始测试，400ms是一个合理的数字
                var ps = div.getElementsByTagName("input")
                var input = ps[0]
                expect(ps[1].checked).to.be(true)
                input.click()
                if (input.fireEvent) {
                    input.fireEvent("onchange")
                }
                setTimeout(function() {
                    expect(model.xxx).to.be("aaa")
                    document.body.removeChild(div)
                    div.innerHTML = ""
                    delete avalon.vmodels["ms-click-ms-duplex"]
                    done()
                }, 300)
            }, 300)
        })
    })
    describe("双工绑定ms-duplex-checked", function() {
        it("async", function(done) {
            var div = document.createElement("div")
            div.innerHTML = '<input ms-duplex-checked="xxx" type="checkbox" id="ms-duplex-checked-c" >' +
                    '<input ms-duplex-checked="yyy" type="radio" id="ms-duplex-checked-r" >'
            document.body.appendChild(div)

            var model = avalon.define("ms-duplex-checked", function(vm) {
                vm.xxx = false
                vm.yyy = false
            })
            avalon.scan(div, model)
            setTimeout(function() {//必须等扫描后才能开始测试，400ms是一个合理的数字
                var ps = div.getElementsByTagName("input")
                expect(ps[0].checked).to.be(false)
                expect(ps[1].checked).to.be(false)
                ps[0].click()
                ps[1].click()
                setTimeout(function() {
                    expect(model.xxx).to.be(true)
                    expect(model.yyy).to.be(true)
                    expect(ps[0].checked).to.be(true)
                    expect(ps[1].checked).to.be(true)
                    document.body.removeChild(div)
                    div.innerHTML = ""
                    done()
                }, 300)
            }, 300)
        })
    })
    describe("双工绑定与$model", function() {
        //检测值的同步
        it("async", function(done) {
            var model = avalon.define("ms-duplex-select", function(vm) {
                vm.array = ["aaa", "bbb", "ccc", "ddd"]
                vm.selected = "ddd"
                vm.$watch("selected", function(a, b) {
                    expect(model.$model.selected).to.be("bbb")
                    expect(a).to.be("bbb")
                    expect(b).to.be("ddd")
                    body.removeChild(div)
                    done()
                })
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<div><select ms-duplex=\"selected\"><option ms-repeat=\"array\" ms-attr-value=\"el\">{{el}}</option></select></div>"
            body.appendChild(div)
            avalon.scan(div, model)
            function fireEvent(element, type) {
                if (document.createEvent) {
                    var evt = document.createEvent("HTMLEvents");
                    evt.initEvent(type, true, true)
                    return !element.dispatchEvent(evt);
                } else if (document.createEventObject) {
                    var evt = document.createEventObject();
                    return element.fireEvent("on" + type, evt)
                }
            }
            setTimeout(function() {
                var el = div.getElementsByTagName("select")[0]
                el.options[1].selected = true//改动属性
                fireEvent(el, "change")//触发事件
            }, 200)
        })
    })
    ////////////////////////////////////////////////////////////////////////
    //////////    下面是监控数组相关        ////////////////////////////
    ////////////////////////////////////////////////////////////////////////


    describe("确保不会误删元素", function() {

        it("sync", function() {
            var model = avalon.define("removeArray", function(vm) {
                vm.array = [1, 2, 3, 4]
            })
            expect(model.array.remove(5)).to.eql([])
            expect(model.array.removeAt(-1)).to.eql([])
            delete avalon.vmodels["removeArray"]

        })
    })

    describe("array.size()", function() {

        it("async", function(done) {
            var model = avalon.define("ArraySize", function(vm) {
                vm.array = [1, 2, 3, 4]
            })
            var div = document.createElement("div")
            div.innerHTML = '{{array.size()}}'
            document.body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                expect(div.innerHTML).to.eql("4")
                document.body.removeChild(div)
                div.innerHTML = ""
                done()
                delete avalon.vmodels["ArraySize"]
            })


        })
    })
    describe("重写一个对象", function() {
        it("async", function(done) {
            var vmodel = avalon.define("overrideObject", function(vm) {
                vm.first = {
                    array: ["aaa", "bbb", "ccc", "ddd"],
                    object: {
                        banana: "香蕉",
                        apple: "苹果",
                        peach: "桃子",
                        pear: "雪梨"
                    }
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<h2>重写一个对象</h2><ul><li ms-repeat="first.array">{{el}}</li></ul><ol><li ms-repeat="first.object">{{$key}}:{{$val}}</li></ol>'
            body.appendChild(div)
            avalon.scan(div, vmodel)
            setTimeout(function() {
                var lis = div.getElementsByTagName("li")
                expect(lis[0].innerHTML).to.be("aaa")
                expect(lis[1].innerHTML).to.be("bbb")
                expect(lis[2].innerHTML).to.be("ccc")
                expect(lis[3].innerHTML).to.be("ddd")
                expect(lis[4].innerHTML).to.be("banana:香蕉")
                expect(lis[5].innerHTML).to.be("apple:苹果")
                expect(lis[6].innerHTML).to.be("peach:桃子")
                expect(lis[7].innerHTML).to.be("pear:雪梨")

            }, 250)

            setTimeout(function() {
                vmodel.first = {
                    array: ["@@@", "###", "$$$", "%%%"],
                    object: {
                        grape: "葡萄",
                        coconut: "椰子",
                        pitaya: "火龙果",
                        orange: "橙子"
                    }
                }
                setTimeout(function() {
                    var lis = div.getElementsByTagName("li")
                    expect(lis[0].innerHTML).to.be("@@@")
                    expect(lis[1].innerHTML).to.be("###")
                    expect(lis[2].innerHTML).to.be("$$$")
                    expect(lis[3].innerHTML).to.be("%%%")
                    expect(lis[4].innerHTML).to.be("grape:葡萄")
                    expect(lis[5].innerHTML).to.be("coconut:椰子")
                    expect(lis[6].innerHTML).to.be("pitaya:火龙果")
                    expect(lis[7].innerHTML).to.be("orange:橙子")
                    body.removeChild(div)
                    div.innerHTML = ""
                    done()
                }, 300)

            }, 500)
        })
    })
    describe("监控数组的$model应该等于其父VM.$model中的同名数组", function() {

        it("async", function(done) {
            var vmodel = avalon.define({
                $id: 'observableArray$model',
                x: 2,
                arr: [
                    {id: 1000, name: 'test1'},
                    {id: 2000, name: 'test2'}
                ]
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = ' <div ms-repeat="arr"><input type="text" ms-duplex="el.name"/>{{el.name}}</div>'
            body.appendChild(div)
            avalon.scan(div, vmodel)
            setTimeout(function() {
                var inputs = div.getElementsByTagName("input")
                inputs[0].value = "xxxx"
                inputs[1].value = "yyyy"
                setTimeout(function() {
                    expect(vmodel.arr[0].$model.name).to.be("xxxx")
                    expect(vmodel.$model.arr[0].name).to.be("xxxx")
                    expect(vmodel.arr[1].$model.name).to.be("yyyy")
                    expect(vmodel.$model.arr[1].name).to.be("yyyy")
                    var data = vmodel.arr.$events[avalon.subscribers][0]
                    var is138 = "$proxies" in  vmodel.arr
                    if (is138) {
                        var $proxies = vmodel.arr.$proxies
                        expect($proxies[0].el()).to.be(vmodel.arr[0])
                        expect($proxies[0].el().$model).to.be(vmodel.arr[0].$model)
                    } else {
                        var $proxies = data.proxies
                        expect($proxies[0].el).to.be(vmodel.arr[0])
                        expect($proxies[0].el.$model).to.be(vmodel.arr[0].$model)
                    }

                    expect(vmodel.$model.arr[0]).to.be(vmodel.arr[0].$model)
                    body.removeChild(div)
                    div.innerHTML = ""
                    done()
                }, 300)

            }, 300)
        })

    })
    describe("对象数组全部删光再添加,确保ms-duplex还可以用#403", function() {
        it("async", function(done) {
            var vmodel = avalon.define("recycleEachProxy", function(vm) {
                vm.array = [{
                        a: 1
                    }, {
                        a: 2
                    }, {
                        a: 3
                    }]
                vm.add = function() {
                    vmodel.array.push({
                        a: 4
                    })
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<ul><li ms-repeat="array" ms-click="$remove"><input ms-duplex="el.a">{{el.a}}</li></ul><button ms-click="add" type="button">add</button>'
            body.appendChild(div)
            avalon.scan(div, vmodel)
            var prop = "innerText" in div ? "innerText" : "textContent"
            setTimeout(function() {
                var lis = div.getElementsByTagName("li")
                expect(lis.length).to.be(3)
                expect(lis[0][prop].trim()).to.be("1")
                expect(lis[1][prop].trim()).to.be("2")
                expect(lis[2][prop].trim()).to.be("3")
                lis[0].click()
                lis = div.getElementsByTagName("li")
                lis[0].click()
                lis = div.getElementsByTagName("li")
                lis[0].click()
                setTimeout(function() {
                    var lis = div.getElementsByTagName("li")
                    expect(lis.length).to.be(0)
                    var button = div.getElementsByTagName("button")[0]
                    button.click()
                    button.click()
                    button.click()
                    setTimeout(function() {
                        var lis = div.getElementsByTagName("li")
                        expect(lis.length).to.be(3)
                        expect(lis[0][prop].trim()).to.be("4")
                        expect(lis[1][prop].trim()).to.be("4")
                        expect(lis[2][prop].trim()).to.be("4")

                        setTimeout(function() {
                            vmodel.array[2].a = 5
                            expect(lis[2][prop].trim()).to.be("5")
                            body.removeChild(div)
                            div.innerHTML = ""
                            delete avalon.vmodels["recycleEachProxy"]
                            done()
                        }, 300)


                    }, 300)

                }, 300)


            }, 300)

        })
    })

    describe("ms-repeat + ms-duplex", function() {
        it("async", function(done) {
            var vmodel = avalon.define("xxx" + (new Date - 0), function(vm) {
                vm.data = {
                    list: ["1"]
                }
                vm.click = function() {
                    vm.data.list.push("3")
                }

                vm.clear = function() {
                    vm.data.list = []
                }

                vm.serialize = function() {
                    return vm.data.list.$model + ""
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<a href="#"  ms-on-click="click">add</a> <br>\
            <a href="#"  ms-on-click="serialize">serialize</a> <br>\
            <a href="#"  ms-on-click="clear">clear</a>\
            <p  ms-repeat-el="data.list" >\
                <input type="text"   ms-attr-hehe="$index"  ms-duplex="el"></p>'
            body.appendChild(div)
            avalon.scan(div, vmodel)
            setTimeout(function() {
                var input = div.getElementsByTagName("input")[0]
                expect(vmodel.serialize()).to.be("1")
                input.value = "2"
            }, 100)
            setTimeout(function() {
                expect(vmodel.serialize()).to.be("2")
            }, 200)
            setTimeout(function() {
                var as = div.getElementsByTagName("a")
                as[2].click()//请空
                setTimeout(function() {
                    as[0].click()//请空
                    as[0].click()//请空
                    as[0].click()//请空
                })
                setTimeout(function() {
                    var input = div.getElementsByTagName("input")
                    input[0].value = 8//请空
                    input[2].value = 7//请空
                }, 300)

                setTimeout(function() {
                    expect(vmodel.serialize()).to.be("8,3,7")
                    body.removeChild(div)
                    div.innerHTML = ""
                    delete avalon.vmodels["ms-each-double"]
                    done()
                }, 600)
            }, 300)
        })
    })

    describe("ms-repeat循环非监控对象", function() {
        it("async", function(done) {
            var vmodel = avalon.define({
                $id: "$outertest",
                array: [[1, 2, 3, 4], ["a", "b", "c", "d"], [11, 22, 33, 44]]
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<table border="1" width="500"><tr ms-repeat="array"><td  ms-repeat-elem="el">{{$outer.$index}}' +
                    '.{{$index}}.{{elem}}</td></tr></table>'
            body.appendChild(div)
            avalon.scan(div, vmodel)
            setTimeout(function() {
                var tds = div.getElementsByTagName("td")

                expect(tds.length).to.be(12)
                expect(tds[0].innerHTML.trim()).to.be("0.0.1")
                expect(tds[1].innerHTML.trim()).to.be("0.1.2")
                expect(tds[2].innerHTML.trim()).to.be("0.2.3")
                expect(tds[3].innerHTML.trim()).to.be("0.3.4")
                expect(tds[4].innerHTML.trim()).to.be("1.0.a")
                expect(tds[5].innerHTML.trim()).to.be("1.1.b")
                expect(tds[6].innerHTML.trim()).to.be("1.2.c")
                expect(tds[7].innerHTML.trim()).to.be("1.3.d")
                expect(tds[8].innerHTML.trim()).to.be("2.0.11")
                expect(tds[9].innerHTML.trim()).to.be("2.1.22")
                expect(tds[10].innerHTML.trim()).to.be("2.2.33")
                expect(tds[11].innerHTML.trim()).to.be("2.3.44")
                body.removeChild(div)
                div.innerHTML = ""
                delete avalon.vmodels["$outertest"]
                done()
            }, 300)
        })
    })

    describe("ms-repeat循环非监控对象", function() {
        it("async", function(done) {
            var vmodel = avalon.define({
                $id: "ms-repeat-skip",
                $skipArray: ["banksInfo", "moreBanks"],
                banksInfo: {
                    ccb: {
                        text: "建设银行"
                    },
                    boc: {
                        text: "中国银行"
                    },
                    post: {
                        text: "邮政银行"
                    }
                },
                moreBanks: {
                    abc: {
                        text: "农业银行"
                    },
                    cmb: {
                        text: "招商银行"
                    },
                    icbc: {
                        text: "工商银行"
                    }
                }
            })
            var body = document.body
            var aaa = document.createElement("div")
            aaa.innerHTML = '<div ms-repeat="moreBanks" > {{$val.text}}</div><div ms-repeat="banksInfo" >{{$val.text}}</div>'
            body.appendChild(aaa)
            avalon.scan(aaa, vmodel)
            setTimeout(function() {
                var div = aaa.getElementsByTagName("div")
                expect(div.length).to.be(6)
                expect(div[0].innerHTML.trim()).to.be("农业银行")
                expect(div[1].innerHTML.trim()).to.be("招商银行")
                expect(div[2].innerHTML.trim()).to.be("工商银行")
                expect(div[3].innerHTML.trim()).to.be("建设银行")
                expect(div[4].innerHTML.trim()).to.be("中国银行")
                expect(div[5].innerHTML.trim()).to.be("邮政银行")
                body.removeChild(aaa)
                aaa.innerHTML = ""
                delete avalon.vmodels["ms-repeat-skip"]
                done()
            }, 300)
        })
    })
    describe("ms-each同时循环两行", function() {
        it("async", function(done) {
            var vmodel = avalon.define("ms-each-double", function(vm) {
                vm.data = {list: [1, 2, 3, 4, 5, 6, 7]}
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<h2>ms-each同时循环两行</h2><ul  ms-each-el="data.list"><li ms-if="$index ==  0">Name: {{el}}</li><li ms-if="$index !==  0" class="test">Name:{{el}}</li></ul>'
            body.appendChild(div)
            avalon.scan(div, vmodel)
            setTimeout(function() {
                var ul = div.getElementsByTagName("ul")[0]
                var lis = ul.getElementsByTagName("li")
                expect(lis.length).to.be(7)
                expect(lis[0].className).to.be("")
                expect(lis[1].className).to.be("test")
                expect(lis[2].className).to.be("test")
                expect(lis[3].className).to.be("test")
                expect(lis[4].innerHTML).to.be("Name:5")
                expect(lis[5].innerHTML).to.be("Name:6")
                expect(lis[6].innerHTML).to.be("Name:7")
                body.removeChild(div)
                div.innerHTML = ""
                delete avalon.vmodels["ms-each-double"]
                done()
            }, 300)
        })
    })
    describe("1.3.6 监控数组部分数组在一定情况下出现监听丢失", function() {
        it("async", function(done) {
            var m1 = avalon.define({
                $id: "getEachProxyBUG1",
                fruits: [{a: "苹果", b: "apple"}, {a: "香蕉", b: "banana"}]
            })
            var m2 = avalon.define({
                $id: "getEachProxyBUG2",
                fighters: []
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<div ms-controller="getEachProxyBUG1"><h1 ms-repeat="fruits" >{{el.a}}</h1> </div>' +
                    '<div ms-controller="getEachProxyBUG2" id="getEachProxyBUG2"> <h1 ms-repeat="fighters" >{{el}}</h1></div>'
            body.appendChild(div)
            avalon.scan(div)
            setTimeout(function() {
                m1.fruits = [];
            }, 300);
            setTimeout(function() {
                m2.fighters = ['su-35', 'su-22'];
            }, 500);
            setTimeout(function() {
                m2.fighters.set(0, 'j-31')
                m2.fighters.set(1, 'j-10')
            }, 700);
            setTimeout(function() {
                var els = div.getElementsByTagName("h1")
                var prop = "textContent" in div ? "textContent" : "innerText"
                expect(els.length).to.be(2)
                expect(els[0][prop]).to.be("j-31")
                expect(els[1][prop]).to.be("j-10")
                div.innerHTML = ""
                body.removeChild(div)
                done()
            }, 900);
        })
    })

    describe("短路与短路或", function() {
        it("async", function(done) {
            var vmodel = avalon.define({
                $id: "test" + String(Math.random()).split(/0\./, ""),
                aa: {
                    b: false,
                    c: true
                },
                change1: function() {
                    vmodel.aa.b = true
                    vmodel.aa.c = true
                },
                change2: function() {
                    vmodel.aa.b = true
                    vmodel.aa.c = false
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<div ms-if="aa.b && aa.c">{{aa.b}}</div>'
            body.appendChild(div)
            avalon.scan(div, vmodel)
            setTimeout(function() {
                var nodes = div.getElementsByTagName("div")
                expect(nodes.length).to.be(0)
                vmodel.change1()
            }, 100)
            setTimeout(function() {
                var nodes = div.getElementsByTagName("div")
                expect(nodes.length).to.be(1)
                vmodel.change2()
            }, 200)
            setTimeout(function() {
                var nodes = div.getElementsByTagName("div")
                expect(nodes.length).to.be(0)
                vmodel.change1()
            }, 300)
            setTimeout(function() {
                var nodes = div.getElementsByTagName("div")
                expect(nodes.length).to.be(1)
                body.removeChild(div)
                div.innerHTML = ""
                delete avalon.vmodels[vmodel.$id]
                done()
            }, 400)
        })
    })

    describe("重写一个空对象", function() {
        it("async", function(done) {
            var vmodel = avalon.define("overrideEmptyObject", function(vm) {
                vm.first = {
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<ul><li ms-repeat="first.array">{{el}}</li></ul><ol><li ms-repeat="first.object">{{$key}}:{{$val}}</li></ol>'
            body.appendChild(div)
            avalon.scan(div, vmodel)
            setTimeout(function() {
                vmodel.first = {
                    array: ["@@@", "###", "$$$", "%%%"],
                    object: {
                        grape: "葡萄",
                        coconut: "椰子",
                        pitaya: "火龙果",
                        orange: "橙子"
                    }
                }
                setTimeout(function() {
                    var lis = div.getElementsByTagName("li")
                    expect(lis.length).to.be(8)
                    expect(lis[0].innerHTML).to.be("@@@")
                    expect(lis[1].innerHTML).to.be("###")
                    expect(lis[2].innerHTML).to.be("$$$")
                    expect(lis[3].innerHTML).to.be("%%%")
                    expect(lis[4].innerHTML).to.be("grape:葡萄")
                    expect(lis[5].innerHTML).to.be("coconut:椰子")
                    expect(lis[6].innerHTML).to.be("pitaya:火龙果")
                    expect(lis[7].innerHTML).to.be("orange:橙子")
                    body.removeChild(div)
                    div.innerHTML = ""
                    done()
                }, 300)

            }, 300)
        })
    })

    describe('移除数组最后一个元素后确保$last正确无误', function() {

        it("async", function(done) {
            var model = avalon.define('removeLastElement', function(vm) {
                vm.array = [2, 3, 4, 5]
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<ul>' +
                    '<li ms-repeat="array">{{$last}}<button type="button" ms-click="$remove">移除</button></li>' +
                    '</ul>'
            body.appendChild(div)
            avalon.scan(div, model)

            setTimeout(function() {
                var buttons = div.getElementsByTagName("button")
                var button = buttons[buttons.length - 1]
                button.click()
                setTimeout(function() {
                    var lis = div.getElementsByTagName("li")
                    var li = lis[lis.length - 1]
                    expect(/true/.test(li.innerHTML)).to.be(true)
                    delete avalon.vmodels["removeLastElement"]
                    body.removeChild(div)
                    done()
                }, 50)


            }, 50)
        })
    })

    describe("iteratorCallback", function() {
        //ms-with, ms-each, ms-repeat的各种回调
        it("async", function(done) {
            var endIndex = 0
            var model = avalon.define("test" + Math.random(), function(vm) {
                vm.array = [1, 2, 3, 4]
                vm.object = {
                    a: 1,
                    b: 2,
                    c: 3
                }
                vm.sort = function() {
                    return ["b", "a", "c"]
                }
                vm.callback = function(a) {
                    expect(a).to.be("add")
                    expect(this.tagName.toLowerCase()).to.be("ul")
                    end()
                }
                vm.callback2 = function(a) {
                    expect(a).to.be("add")
                    expect(this.tagName.toLowerCase()).to.be("ol")
                    end()
                }
                vm.callback3 = function(a) {
                    expect(a).to.be("append")
                    expect(this.tagName.toLowerCase()).to.be("tr")
                    var cells = this.cells
                    expect(cells[0].innerHTML).to.be("b:2")
                    expect(cells[1].innerHTML).to.be("a:1")
                    expect(cells[2].innerHTML).to.be("c:3")
                    end()
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<div><ul ms-each=\"array\" data-each-rendered=\"callback\"><li>{{el}}</li></ul><ol><li ms-repeat=\"array\" data-repeat-rendered=\"callback2\">{{el}}</li></ol>\n<table border=\"1\"><tbody><tr ms-with=\"object\" data-with-sorted=\"sort\" data-with-rendered=\"callback3\"><td>{{$key}}:{{$val}}</td></tr></tbody></table></div>"
            body.appendChild(div)
            avalon.scan(div, model)
            function end() {
                endIndex++;
                if (endIndex == 3) {
                    body.removeChild(div)
                    done()
                }
            }
        })
    })

    describe("ms-with", function() {
        it("async", function(done) {
            var model = avalon.define({
                $id: "testmswith",
                $skipArray: ["bbb"],
                aaa: {
                    a: 1,
                    b: 2,
                    c: 3
                },
                bbb: {
                    a: 1,
                    b: 2,
                    c: 3
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<div ms-with="aaa"><p>{{$key}}--{{$val}}</p><input ms-duplex="$val"/></div>' +
                    '<div ms-with="bbb"><p>{{$key}}--{{$val}}</p><input ms-duplex="$val"/></div>'
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var ps = div.getElementsByTagName("p")
                expect(ps.length).to.be(6)
                expect(ps[0].innerHTML).to.be("a--1")
                expect(ps[1].innerHTML).to.be("b--2")
                expect(ps[2].innerHTML).to.be("c--3")
                expect(ps[3].innerHTML).to.be("a--1")
                expect(ps[4].innerHTML).to.be("b--2")
                expect(ps[5].innerHTML).to.be("c--3")
                var inputs = div.getElementsByTagName("input")
                inputs[0].value = 10
                inputs[1].value = 20
                inputs[2].value = 30
                inputs[3].value = 40
                inputs[4].value = 50
                inputs[5].value = 60
                setTimeout(function() {
                    var ps = div.getElementsByTagName("p")
                    expect(ps.length).to.be(6)
                    expect(ps[0].innerHTML).to.be("a--10")
                    expect(ps[1].innerHTML).to.be("b--20")
                    expect(ps[2].innerHTML).to.be("c--30")
                    expect(ps[3].innerHTML).to.be("a--1")
                    expect(ps[4].innerHTML).to.be("b--2")
                    expect(ps[5].innerHTML).to.be("c--3")
                    delete avalon.vmodels["testmswith"]
                    body.removeChild(div)
                    done()
                }, 100)

            }, 50)
        })
    })


    describe('$remove', function() {

        it("async", function(done) {
            var model = avalon.define("$remove", function(vm) {
                vm.array = ["a", "b", "c", "d", "e", "f", "g", "h"]
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<ul><li ms-repeat=\"array\"><button type=\"button\" ms-click=\"$remove\">{{el}}</button></li></ul>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var buttons = div.getElementsByTagName("button")
                buttons[1].click()
                buttons = div.getElementsByTagName("button")
                expect(buttons[1].innerHTML).to.be("c")
                buttons[3].click()
                buttons = div.getElementsByTagName("button")
                expect(buttons[3].innerHTML).to.be("f")
                buttons[1].click()
                buttons = div.getElementsByTagName("button")
                expect(buttons[1].innerHTML).to.be("d")
                body.removeChild(div)
                done()
            }, 100)
        })

    })

    describe('vm.array=newArray', function() {
        it("async", function(done) {
            var model = avalon.define("overrideArray", function(vm) {
                vm.array = []
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<table  border=\"1\"><tbody><tr><td>11</td><th ms-repeat=\"array\">{{el}}</th><td>22</td></tr></tbody></table>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                model.array = ["aaa", "bbb", "ccc"]
                setTimeout(function() {
                    var cells = div.getElementsByTagName("tr")[0].cells
                    expect(cells[0].tagName).to.be("TD")
                    expect(cells[1].tagName).to.be("TH")
                    expect(cells[2].tagName).to.be("TH")
                    expect(cells[3].tagName).to.be("TH")
                    expect(cells[4].tagName.toLowerCase()).to.be("td")
                    body.removeChild(div)
                    done()
                })
            }, 100)
        })
    })

    describe("ms-repeat", function() {
        it("async", function(done) {
            var model = avalon.define("ms-repeat", function(vm) {
                vm.object = {"kkk": "vvv", "kkk2": "vvv2", "kkk3": "vvv3"}
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<div><ul><li ms-repeat=\"object\">{{$key}}:{{$val}}</li></ul><ol ms-with=\"object\"><li>{{$key}}:{{$val}}</li></ol></div>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var ul = div.getElementsByTagName("ul")[0]
                var lis = ul.getElementsByTagName("li")
                expect(lis.length).to.be(3)
                expect(lis[0].innerHTML).to.be("kkk:vvv")
                expect(lis[1].innerHTML).to.be("kkk2:vvv2")
                expect(lis[2].innerHTML).to.be("kkk3:vvv3")
                var ol = div.getElementsByTagName("ol")[0]
                var lis = ol.getElementsByTagName("li")
                expect(lis.length).to.be(3)
                expect(lis[0].innerHTML).to.be("kkk:vvv")
                expect(lis[1].innerHTML).to.be("kkk2:vvv2")
                expect(lis[2].innerHTML).to.be("kkk3:vvv3")
                model.object = {
                    a: 22,
                    b: 33,
                    c: 44,
                    d: 55
                }
                setTimeout(function() {
                    var ul = div.getElementsByTagName("ul")[0]
                    var lis = ul.getElementsByTagName("li")
                    expect(lis.length).to.be(4)
                    expect(lis[0].innerHTML).to.be("a:22")
                    expect(lis[1].innerHTML).to.be("b:33")
                    expect(lis[2].innerHTML).to.be("c:44")
                    expect(lis[3].innerHTML).to.be("d:55")
                    body.removeChild(div)
                    done()
                }, 300)


            }, 100)
        })
    })



    describe("ms-src", function() {
        //检测值的同步
        it("async", function(done) {
            var model = avalon.define("ms-src", function(vm) {
                vm.data = {
                    path: 'http://su.bdimg.com/static/superplus/img/logo_white.png'
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<div ms-controller=\"ms-src\"><img ms-src=\"data.path\"/></div>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var el = div.getElementsByTagName("img")[0]
                expect(el.src).to.be("http://su.bdimg.com/static/superplus/img/logo_white.png")
                body.removeChild(div)
                done()
            }, 300)
        })
    })

    describe("filters.html", function() {
        //确保位置没有错乱
        it("async", function(done) {
            var model = avalon.define({
                $id: "html-filter",
                yyy: "<li >1</li><li>2</li><li>3</li><li>4</li>"
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<ul>{{yyy|html}}<li class=\"last\">last</li></ul>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var lis = div.getElementsByTagName("li")
                expect(lis[0].className).to.be("")
                expect(lis.length).to.be(5)
                model.yyy = "<li>X</li><li>Y</li><li>Z</li><li>A</li><li>B</li><li>C</li>"
                setTimeout(function() {
                    var lis = div.getElementsByTagName("li")
                    expect(lis[0].innerHTML).to.be("X")
                    expect(lis[1].innerHTML).to.be("Y")
                    expect(lis[2].innerHTML).to.be("Z")
                    expect((lis[6] || {}).innerHTML).to.be("last")
                    expect(lis.length).to.be(7)
                    body.removeChild(div)
                    delete avalon.vmodels["html-filter"]
                    done()
                }, 100)


            }, 100)
        })
    })

    describe("filters.uppercase", function() {
        it("async", function(done) {
            var model = avalon.define({
                $id: "uppercase",
                aaa: "aaa"
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "{{aaa|uppercase}}"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                expect(div.innerHTML).to.be("AAA")
                delete avalon.vmodels["uppercase"]
                body.removeChild(div)
                done()
            }, 100)
        })
    })

    describe("filters.lowercase", function() {
        it("async", function(done) {
            var model = avalon.define({
                $id: "lowercase",
                aaa: "AAA"
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "{{aaa|lowercase}}"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                expect(div.innerHTML).to.be("aaa")
                delete avalon.vmodels["lowercase"]
                body.removeChild(div)
                done()
            }, 100)
        })
    })

    describe("filters.currency", function() {
        it("async", function(done) {
            var model = avalon.define({
                $id: "currency",
                aaa: 1122223
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "{{aaa|currency}}"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                expect(div.innerHTML).to.be("￥1,122,223.00")
                delete avalon.vmodels["currency"]
                body.removeChild(div)
                done()
            }, 100)
        })
        it("async", function(done) {
            var model = avalon.define({
                $id: "currency2",
                aaa: 7444442
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "{{aaa|currency('$')}}"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                expect(div.innerHTML).to.be("$7,444,442.00")
                delete avalon.vmodels["currency2"]
                body.removeChild(div)
                done()
            }, 100)
        })
    })

    describe("filters.html.2", function() {
        //详见 https://github.com/RubyLouvre/avalon/issues/598
        it("async", function(done) {
            var model = avalon.define({
                $id: 'html-filter2',
                x: '{{aaa}}',
                x2: '{{y}}',
                y: 'bbb'
            });
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '正确{{x}}——{{x2}}——{{y|html}}'
            body.appendChild(div)
            avalon.scan(div, model)

            setTimeout(function() {
                expect(div.innerHTML.trim()).to.be("正确{{aaa}}——{{y}}——bbb")
                body.removeChild(div)
                done()
            }, 100)

        })
    })

    describe('ms-repeat nest-object', function() {
        //确保位置没有错乱
        it("async", function(done) {
            var model = avalon.define("nest-object", function(vm) {
                vm.list = {
                    a: {str: 444},
                    b: {str: 666}
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<ul ms-controller=\"nest-object\"><li ms-repeat=\"list\"><input ms-duplex=\"$val.str\"/></li></ul>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var inputs = div.getElementsByTagName("input")
                expect(inputs[0].value).to.be("444")
                expect(inputs[1].value).to.be("666")
                delete avalon.vmodels["nest-object"]
                body.removeChild(div)
                done()
            }, 100)
        })
    })

    describe("avalon.Array", function() {
        //确保位置没有错乱
        it("sync", function() {
            var array = [1, 2, 3, 4, 5]
            avalon.Array.ensure(array, 4)
            expect(array.length).to.be(5)
            avalon.Array.ensure(array, 6)
            expect(array.length).to.be(6)
            avalon.Array.remove(array, 7)
            expect(array.length).to.be(6)
            avalon.Array.remove(array, 4)
            expect(array.length).to.be(5)
            avalon.Array.removeAt(array, 4)
            expect(array.length).to.be(4)
            expect(array.join(",")).to.be("1,2,3,5")
        })

        it("async", function(done) {
            var model = avalon.define({
                $id: "array2",
                array: ["a", "b", "c", "d"]
            })
            var body = document.body
            var div = document.createElement("ul")
            div.innerHTML = "<li ms-repeat='array'>{{el}}|{{$first}}|{{$last}}|{{$index}}</li>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var inputs = div.getElementsByTagName("li")
                expect(inputs[0].innerHTML).to.be("a|true|false|0")
                expect(inputs[1].innerHTML).to.be("b|false|false|1")
                expect(inputs[2].innerHTML).to.be("c|false|false|2")
                expect(inputs[3].innerHTML).to.be("d|false|true|3")
                model.array.push("e", "f")
                model.array.unshift("x", "y")
                setTimeout(function() {
                    var inputs = div.getElementsByTagName("li")
                    expect(inputs[0].innerHTML).to.be("x|true|false|0")
                    expect(inputs[1].innerHTML).to.be("y|false|false|1")
                    expect(inputs[2].innerHTML).to.be("a|false|false|2")
                    expect(inputs[3].innerHTML).to.be("b|false|false|3")
                    expect(inputs[4].innerHTML).to.be("c|false|false|4")
                    expect(inputs[5].innerHTML).to.be("d|false|false|5")
                    expect(inputs[6].innerHTML).to.be("e|false|false|6")
                    expect(inputs[7].innerHTML).to.be("f|false|true|7")
                    model.array.splice(4, 2, "k")
                    setTimeout(function() {
                        var inputs = div.getElementsByTagName("li")
                        expect(inputs[0].innerHTML).to.be("x|true|false|0")
                        expect(inputs[1].innerHTML).to.be("y|false|false|1")
                        expect(inputs[2].innerHTML).to.be("a|false|false|2")
                        expect(inputs[3].innerHTML).to.be("b|false|false|3")
                        expect(inputs[4].innerHTML).to.be("k|false|false|4")
                        expect(inputs[5].innerHTML).to.be("e|false|false|5")
                        expect(inputs[6].innerHTML).to.be("f|false|true|6")
                        model.array.reverse()
                        setTimeout(function() {
                            var inputs = div.getElementsByTagName("li")
                            expect(inputs[0].innerHTML).to.be("f|true|false|0")
                            expect(inputs[1].innerHTML).to.be("e|false|false|1")
                            expect(inputs[2].innerHTML).to.be("k|false|false|2")
                            expect(inputs[3].innerHTML).to.be("b|false|false|3")
                            expect(inputs[4].innerHTML).to.be("a|false|false|4")
                            expect(inputs[5].innerHTML).to.be("y|false|false|5")
                            expect(inputs[6].innerHTML).to.be("x|false|true|6")
                            model.array.remove("b")
                            model.array.removeAt(2)
                            setTimeout(function() {
                                var inputs = div.getElementsByTagName("li")
                                expect(inputs[0].innerHTML).to.be("f|true|false|0")
                                expect(inputs[1].innerHTML).to.be("e|false|false|1")
                                expect(inputs[2].innerHTML).to.be("a|false|false|2")
                                expect(inputs[3].innerHTML).to.be("y|false|false|3")
                                expect(inputs[4].innerHTML).to.be("x|false|true|4")

                                delete avalon.vmodels["array2"]
                                body.removeChild(div)
                                done()
                            }, 100)

                        }, 100)

                    }, 100)

                }, 100)
            }, 100)
        })

        it("async", function(done) {
            var model = avalon.define({
                $id: "array3",
                array: [{a: 7}, {a: 3}, {a: 1}, {a: 2}, {a: 6}, {a: 1}]
            })
            var body = document.body
            var div = document.createElement("ul")
            div.innerHTML = "<li ms-repeat='array'>{{el.a}}</li>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var inputs = div.getElementsByTagName("li")
                expect(inputs[0].innerHTML).to.be("7")
                expect(inputs[1].innerHTML).to.be("3")
                expect(inputs[2].innerHTML).to.be("1")
                expect(inputs[3].innerHTML).to.be("2")
                expect(inputs[4].innerHTML).to.be("6")
                expect(inputs[5].innerHTML).to.be("1")
                model.array.sort(function(a, b) {
                    return a.a - b.a
                })
                setTimeout(function() {
                    var inputs = div.getElementsByTagName("li")
                    expect(inputs[0].innerHTML).to.be("1")
                    expect(inputs[1].innerHTML).to.be("1")
                    expect(inputs[2].innerHTML).to.be("2")
                    expect(inputs[3].innerHTML).to.be("3")
                    expect(inputs[4].innerHTML).to.be("6")
                    expect(inputs[5].innerHTML).to.be("7")
                    model.array.reverse()
                    setTimeout(function() {
                        var inputs = div.getElementsByTagName("li")
                        expect(inputs[0].innerHTML).to.be("7")
                        expect(inputs[1].innerHTML).to.be("6")
                        expect(inputs[2].innerHTML).to.be("3")
                        expect(inputs[3].innerHTML).to.be("2")
                        expect(inputs[4].innerHTML).to.be("1")
                        expect(inputs[5].innerHTML).to.be("1")

                        delete avalon.vmodels["array3"]
                        body.removeChild(div)
                        done()
                    }, 100)
                }, 100)
            }, 100)
        })

    })

    describe("W3CFire的avalon签名", function() {
        //确保位置没有错乱
        it("async", function(done) {
            function W3CFire(el, name, detail) {
                var event = document.createEvent("Events")
                event.initEvent(name, true, true)
                event.fireByAvalon = true//签名，标记事件是由avalon触发
                //event.isTrusted = false 设置这个opera会报错
                if (detail)
                    event.detail = detail
                el.dispatchEvent(event)
            }
            var body = document.body
            var div = document.createElement("div")
            body.appendChild(div)
            if (div.addEventListener) {
                div.addEventListener("click", function(e) {
                    expect(e.fireByAvalon).to.be(true)
                    e.stopPropagation()
                    body.removeChild(div)
                    done()
                })
                W3CFire(div, "click")
            } else {
                expect("IE").to.be("IE")
                body.removeChild(div)
                done()
            }
        })
    })

    describe("循环绑定中的事件绑定", function() {
        //确保位置没有错乱
        it("async", function(done) {
            var test = false
            var model = avalon.define({
                $id: "repeaton",
                arr: [1],
                f1: function() {
                    test = true
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<div ms-controller="repeaton"><div ms-each="arr">' +
                    '<button ms-click="f1" type="button">测试</button></div>{{arr|html}}</div>'
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var button = div.getElementsByTagName("button")[0]
                button.click()
                setTimeout(function() {
                    expect(test).to.be(true)
                    body.removeChild(div)
                    done()
                }, 300)
            }, 100)
        })
    })
    describe("ms-repeat-clear", function() {
        //https://github.com/RubyLouvre/avalon/issues/512
        it("async", function(done) {
            var model = avalon.define({
                $id: "repeatclear",
                arr: [],
                f1: function() {
                    model.arr = [1, 2]
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<div ms-controller="repeatclear"><p ms-each="arr">123</p></div>'
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                model.f1()
                setTimeout(function() {
                    model.f1()
                    setTimeout(function() {
                        model.f1()
                        setTimeout(function() {
                            var p = div.getElementsByTagName("p")[0]
                            var test = (p.textContent || p.innerText).trim()
                            expect(test).to.be("123123")
                            body.removeChild(div)
                            done()
                        }, 100)
                    }, 60)
                }, 60)
            }, 60)
        })
    })


})
