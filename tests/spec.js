define([], function() {


    describe('isWindow', function() {

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

    describe('isPlainObject', function() {

        it("sync", function() {
            //不能DOM, BOM与自定义"类"的实例
            expect(avalon.isPlainObject([])).to.be(false)
            expect(avalon.isPlainObject(1)).to.be(false)
            expect(avalon.isPlainObject(null)).to.be(false)
            expect(avalon.isPlainObject(void 0)).to.be(false)
            expect(avalon.isPlainObject(window)).to.be(false)
            expect(avalon.isPlainObject(document.body)).to.be(false)
            expect(avalon.isPlainObject(window.location)).to.be(false)
            var fn = function() {
            }
            expect(avalon.isPlainObject(fn)).to.be(false)
            fn.prototype = {
                someMethod: function() {
                }
            };
            expect(avalon.isPlainObject(new fn)).to.be(false)
            expect(avalon.isPlainObject({})).to.be.ok()
            expect(avalon.isPlainObject({
                aa: "aa",
                bb: "bb",
                cc: "cc"
            })).to.be.ok()
            expect(avalon.isPlainObject(new Object)).to.be.ok()
        })

    })


    describe('isArrayLike', function() {

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

    describe('range', function() {

        it("sync", function() {
            expect(avalon.range(10)).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
            expect(avalon.range(1, 11)).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
            expect(avalon.range(0, 30, 5)).to.eql([0, 5, 10, 15, 20, 25])
            expect(avalon.range(0, -10, -1)).to.eql([0, -1, -2, -3, -4, -5, -6, -7, -8, -9])
            expect(avalon.range(0)).to.eql([])
        })

    })

    describe('oneObject', function() {

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

    describe('slice', function() {

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

    describe('textNode.nodeValue === textNode.data', function() {

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

    describe('/\w\[.*\]|\w\.\w/', function() {
        it("sync", function() {
            var reg = /\w\[.*\]|\w\.\w/
            //用于ms-duplex
            expect(reg.test("aaa[bbb]")).to.be(true)
            expect(reg.test("aaa.kkk")).to.be(true)
            expect(reg.test("eee")).to.be(false)
        })

        it("async", function(done) {
            var model = avalon.define('test', function(vm) {
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

            setTimeout(function() {//必须等扫描后才能开始测试，400ms是一个合理的数字
                var ps = div.getElementsByTagName("p")
                expect(ps[0].innerHTML).to.be("text")
                expect(ps[1].innerHTML).to.be("444")
                expect(ps[2].innerHTML).to.be("555")
                model.ccc = "change"
                expect(ps[0].innerHTML).to.be("change")
                body.removeChild(div)
                done()
            }, 100)

        })

    })

    describe('ms-duplex-bool', function() {
//ms-duplex-bool只能用于radio控件，会自动转换value为布尔，同步到VM
        it("async", function(done) {
            var model = avalon.define('test', function(vm) {
                vm.aaa = false
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = ['<input ms-duplex-bool="aaa" type="radio" value="true">',
                '<input ms-duplex-bool="aaa" type="radio" value="false">'
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
                done()
            }, 100)
        })
    })

    describe("compute", function() {
        it("async", function() {
            var model = avalon.define("test", function(vm) {
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
            var model = avalon.define("test", function(vm) {
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
            div.innerHTML = "<div ms-controller=\"test\"> <button ms-click=\"one\" type=\"button\">\u6D4B\u8BD51</button> <button ms-click=\"two\" type=\"button\">\u6D4B\u8BD52</button> <br>test1: {{test1}} <br>test2: {{test2}}</div>"
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

                    body.removeChild(div)
                    done()
                }, 100)

            }, 100)

        })

        it("async3", function(done) {
            var model = avalon.define("test2", function(vm) {
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
            div.innerHTML = "<div ms-controller=\"test2\" type=\"button\"><button ms-click=\"one\">\u6D4B\u8BD51</button><br>test0: {{test0}}<br>test1: {{test1}}<br>test2: {{test2}}<br>msg: {{msg}}</div>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                div.getElementsByTagName("button")[0].click()
                setTimeout(function() {
                    expect(model.test0).to.be(true)
                    expect(model.test1).to.be(true)
                    expect(model.test2).to.be(true)
                    expect(model.msg).to.be("ok！！")
                    body.removeChild(div)
                    done()
                })
            }, 100)

        })

    });
    describe("iteratorCallback", function() {
//ms-with, ms-each, ms-repeat的各种回调
        it("async", function(done) {
            var model = avalon.define("test", function(vm) {
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
            div.innerHTML = "<div ms-controller=\"test\"><ul ms-each=\"array\" data-each-rendered=\"callback\"><li>{{el}}</li></ul><ol><li ms-repeat=\"array\" data-repeat-rendered=\"callback2\">{{el}}</li></ol>\n            <table border=\"1\"><tbody><tr ms-with=\"object\" data-with-sorted=\"sort\" data-with-rendered=\"callback3\"><td>{{$key}}:{{$val}}</td></tr></tbody></table></div>"
            body.appendChild(div)
            avalon.scan(div, model)
            var endIndex = 0
            function end() {
                endIndex++
                if (endIndex == 3) {
                    body.removeChild(div)
                    done()
                }
            }
        })
    })

    describe("filters.date", function() {
        //验证最常用的日期过滤器
        it("async", function() {
            var format = "yyyy MM dd:HH:mm:ss"
            expect(avalon.filters.date(new Date("2014/4/1"), format)).to.be("2014 04 01:00:00:00")
            expect(avalon.filters.date("2011/07/08", format)).to.be("2011 07 08:00:00:00")
            expect(avalon.filters.date("2011-07-08", format)).to.be("2011 07 08:00:00:00")
            expect(avalon.filters.date("01-10-2000", format)).to.be("2000 01 10:00:00:00")
            expect(avalon.filters.date("07 04,2000", format)).to.be("2000 07 04:00:00:00")
            expect(avalon.filters.date("3 14,2000", format)).to.be("2000 03 14:00:00:00")
            expect(avalon.filters.date("1373021259229", format)).to.be("2013 07 05:18:47:39")
            expect(avalon.filters.date(1373021259229, format)).to.be("2013 07 05:18:47:39")
        })
    })

    describe('$remove', function() {

        it("async", function(done) {
            var model = avalon.define("test", function(vm) {
                vm.array = ["a", "b", "c", "d", "e", "f", "g", "h"]
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<ul ms-controller=\"test\"><li ms-repeat=\"array\"><button type=\"button\" ms-click=\"$remove\">{{el}}</button></li></ul>"
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
            var model = avalon.define("test", function(vm) {
                vm.array = []
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<table ms-controller=\"test\" border=\"1\"><tbody><tr><td>11</td><th ms-repeat=\"array\">{{el}}</th><td>22</td></tr></tbody></table>"
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
            var model = avalon.define("xxx", function(vm) {
                vm.object = {"kkk": "vvv", "kkk2": "vvv2", "kkk3": "vvv3"}
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<div ms-controller=\"xxx\"><ul><li ms-repeat=\"object\">{{$key}}:{{$val}}</li></ul><ol ms-with=\"object\"><li>{{$key}}:{{$val}}</li></ol></div>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var ul = div.getElementsByTagName("ul")[0]
                expect(ul.children.length).to.be(3)
                expect(ul.children[0].innerHTML).to.be("kkk:vvv")
                expect(ul.children[1].innerHTML).to.be("kkk2:vvv2")
                expect(ul.children[2].innerHTML).to.be("kkk3:vvv3")
                var ol = div.getElementsByTagName("ol")[0]
                expect(ol.children.length).to.be(3)
                expect(ol.children[0].innerHTML).to.be("kkk:vvv")
                expect(ol.children[1].innerHTML).to.be("kkk2:vvv2")
                expect(ol.children[2].innerHTML).to.be("kkk3:vvv3")
                body.removeChild(div)
                done()
            }, 100)
        })
    })


    describe('ms-duplex', function() {
        //检测值的同步
        it("async", function(done) {
            var model = avalon.define("ttyy", function(vm) {
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
            div.innerHTML = "<div ms-controller=\"test\"><select ms-duplex=\"selected\"><option ms-repeat=\"array\" ms-value=\"el\">{{el}}</option></select></div>"
            body.appendChild(div)
            avalon.scan(div, model)
            function fireEvent(element, type) {
                if (document.createEvent) {
                    var evt = document.createEvent("HTMLEvents");
                    evt.initEvent(type, true, true)
                    return !element.dispatchEvent(evt);
                } else if (document.createEventObject) {
                    var evt = document.createEventObject();
                    return element.fireEvent('on' + type, evt)
                }
            }
            setTimeout(function() {
                var el = div.getElementsByTagName("select")[0]
                el.options[1].selected = true//改动属性
                fireEvent(el, "change")//触发事件
            }, 200)
        })
    })
    describe('ms-src', function() {
        //检测值的同步
        it("async", function(done) {
            var model = avalon.define("ms-src", function(vm) {
                vm.data = {}
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<div ms-controller=\"ms-src\"><img ms-src=\"data.path\"/></div>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var el = div.getElementsByTagName("img")[0]
                expect(/undefined$/.test(el.src)).to.be(true)
                body.removeChild(div)
                done()
            }, 300)
        })
    })

    describe('html-filter', function() {
        //确保位置没有错乱
        it("async", function(done) {
            var model = avalon.define("html-filter", function(vm) {
                vm.yyy = "<li >1</li><li>2</li><li>3</li><li>4</li>"
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<ul ms-controller=\"html-filter\">{{yyy|html}}<li class=\"last\">last</li></ul>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function() {
                var el = div.getElementsByTagName("li")[0]
                expect(el.className).to.be("")
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
})
