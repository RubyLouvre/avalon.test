define([], function () {
////////////////////////////////////////////////////////////////////////
//////////    最前面的是与绑定没关的测试   /////////////////////////////
////////////////////////////////////////////////////////////////////////
    function fireClick(el) {
        if (el.click) {
            el.click()
        } else {
//https://developer.mozilla.org/samples/domref/dispatchEvent.html
            var evt = document.createEvent("MouseEvents")
            evt.initMouseEvent("click", true, true, window,
                    0, 0, 0, 0, 0, false, false, false, false, 0, null);
            !el.dispatchEvent(evt);
        }
    }
    function expect2(a) {
        return {
            to: {
                be: function (b) {
                    console.log(a, b, a === b)
                }
            }
        }
    }
    function heredoc(fn) {
        return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').replace(/\*\/[^\/]+$/, '')
    }
    function clearTest(vmName, div, fn) {
        if (typeof vmName === "string") {
            delete avalon.vmodels[vmName]
        } else if (vmName) {
            delete avalon.vmodels[vmName.$id]
        }
        if (div) {
            div.innerHTML = ""
            document.body.removeChild(div)
        }
        if (fn) {
            fn()
        }
    }
    describe("VBScript对象遍历BUG", function () {
        it("sync", function () {
            var vm = avalon.define({
                $id: "testx",
                object: {A: 1, B: 3, C: 5, D: 6, E: 8}
            })
            var keys = []
            for (var i in vm.object) {
                if (vm.object.hasOwnProperty(i)) {
                    keys.push(i)
                }
            }
            // var keys = Object.keys(vm.object)
            expect(keys).to.eql(["A", "B", "C", "D", "E"])
            delete avalon.vmodels.testx
        })
    })

    describe("扫描机制", function () {
        it("async", function (done) {
            var model = avalon.define({
                $id: "test",
                array: [1, 2, 3, 4],
                bbb: "xxx",
                aaa: "yyy",
                color: "green",
                toggle: false,
                s1: "组件第一行"
            })
            avalon.ui.scandal = function (element, data) {
                return avalon.define(data.scandalId, function (vm) {
                    avalon.mix(vm, data.scandalOptions)
                    vm.s2 = "组件第二行"
                    vm.$init = function (continueScan) {
                        element.innerHTML = "<p>{{s1}}</p><p>{{s2}}</p>"
                        continueScan()
                    }
                    vm.$remove = function () {
                        element.innerHTML = ""
                    }
                })
            }
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 <div ms-data-aaa="bbb" ms-repeat="array" ms-css-background="color" id="scanIf1"><div>{{el}}</div></div>
                 <div ms-data-aaa="bbb" ms-each="array" ms-css-background="color" id="scanIf2"><div>{{el}}</div></div>
                 <div ms-if="toggle"  ms-data-xxx="aaa" id="scanIf3">{{bbb}}</div> 
                 <div ms-if="!toggle" ms-data-xxx="aaa" id="scanIf4">{{color}}</div>
                 <div ms-widget="scandal" ms-data-scandal-s1="s1" id="scanIf5"></div>
                 */
            })
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function () {
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
                setTimeout(function () {
                    clearTest(null, div, done)
                })
            }, 100)
        })
    })

    describe("设置透明度", function () {
        //确保位置没有错乱
        it("sync", function () {
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
    describe("custom.filter", function () {

        it("async", function (done) {
            avalon.filters.parseSymbol = function (str) {
                return {
                    '元': '元',
                    'USD': '美元',
                    'HKD': '港币'
                }[str];
            };
            var vm = avalon.define({
                $id: 'custom.filter',
                name: "大跃进右"
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '{{"HKD" |parseSymbol}}'
            body.appendChild(div)
            avalon.scan(div, vm)

            setTimeout(function () {
                expect(div.innerHTML).to.be("港币")
                clearTest("custom.filter", div, done)
            }, 300)

        })
    })


    describe("ms-duplex-checked", function () {

        it("async", function (done) {
            var vm = avalon.define({
                $id: 'ms-duplex-checked',
                testCheck1: false,
                testCheck2: false,
                testCheck3: false
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 <input type="checkbox" ms-duplex-checked="testCheck1"> {{testCheck1}}
                 <input type="checkbox" ms-duplex-checked="testCheck2"> {{testCheck2}}
                 <input type="checkbox" ms-duplex-checked="testCheck3"> {{testCheck3}}
                 <input type="text">
                 */
            })

            body.appendChild(div)
            avalon.scan(div, vm)

            setTimeout(function () {
                var inputs = div.getElementsByTagName("input")

                expect(inputs[0].checked).to.be(false)
                expect(inputs[1].checked).to.be(false)
                expect(inputs[2].checked).to.be(false)
                inputs[1].click()

                setTimeout(function () {
                    var inputs = div.getElementsByTagName("input")

                    expect(inputs[1].checked).to.be(true)
                    expect(vm.testCheck2).to.be(true)
                    inputs[3].focus()
                    setTimeout(function () {
                        var inputs = div.getElementsByTagName("input")
                        expect(inputs[1].checked).to.be(true)
                        clearTest("ms-duplex-checked", div, done)
                    }, 300)
                }, 300)

            }, 300)

        })
    })
    describe("$watch对象的子属性", function () {
        it("async", function (done) {
            var a = 111
            var vm = avalon.define({
                $id: 'testvv',
                postData: {
                    venue: '3323',
                    aa: 333
                }
            })
            vm.postData.$watch('venue', function (val) {
                a = val
            })
            setTimeout(function () {
                vm.postData = {
                    venue: '11',
                    aa: 444
                }
            }, 200)
            
            setTimeout(function () {
                expect(a).to.be("11")
                clearTest(vm, 0, done)
            }, 350)

        })
    })
    describe("avalon.ready", function () {
        //确保位置没有错乱
        it("async", function (done) {
            var index = 0
            avalon.ready(function () {
                ++index
            })
            setTimeout(function () {
                expect(index).to.be(1)
                done()
            }, 300)
        })

    })
    describe("加载器", function () {
        //确保位置没有错乱
        it("普通加载", function (done) {
            var a = 1
            require(["./mmRequest"], function () {
                a = 2
            })
            setTimeout(function () {
                expect(typeof avalon.ajax).to.be("function")
                expect(typeof avalon.Promise).to.be("function")
                expect(a).to.be(2)
                done()
            }, 500)
        })
        it("测试baseUrl, paths, shim", function (done) {
            setTimeout(function () {
                require.config({
                    baseUrl: "/avalon/src/jQuery/",
                    paths: {
                        jquery: "jquery-1.11.2"
                    },
                    "shim": {
                        "jquery.alpha": ["jquery"],
                        "jquery.beta": ["jquery"]
                    }
                })
                require(["jquery", "jquery.alpha", "jquery.beta"], function (a) {
                    expect(typeof a).to.be("function")
                    expect(typeof a.fn.alpha).to.be("function")
                    expect(typeof a.fn.beta).to.be("function")
                    done()
                })

            })

        })
        //
        it("测试加载拥有AMD结构的流行库", function (done) {
            setTimeout(function () {
                require.config({
                    baseUrl: "/avalon/src/jQuery/",
                    paths: {
                        jquery: "jquery-1.11.2",
                        "jquery.placeholder": "jquery.placeholder",
                        underscore: "underscore-1.7",
                        backbone: "backbone"
                    }
                })
                require(["backbone", "jquery.placeholder"], function (a, b) {
                    expect(a.VERSION).to.be("1.1.2")
                    expect(typeof jQuery.fn.placeholder.input).to.be("boolean")
                    done()
                })
            })
        })
        it("测试text,css插件", function (done) {
            setTimeout(function () {
                require.config({
                    baseUrl: "/avalon/src/jQuery/"
                })
                var index = 0
                require(["./aaa.js", "text!./aaa.txt", "css!./eee"], function (a, b) {
                    expect(a).to.be("aaa")
                    expect(b).to.be("text")
                    ++index
                })
                setTimeout(function () {
                    expect(index).to.be(1)
                    var color = avalon(document.body).css("border-left-color")
                    if (color === "rgb(255, 0, 0)")
                        color = "red"
                    expect(color).to.be("red")
                    done()
                }, 300)
            })
        })

        it("测试baseUrl, packages2", function (done) {
            setTimeout(function () {
                require.config({
                    baseUrl: "/avalon/src",
                    packages: [{
                            name: "dog1",
                            location: "dog",
                            main: "xxx"
                        }]
                })
                var index = 0
                require(["dog1"], function (a) {
                    index = a
                })
                setTimeout(function () {
                    expect(index).to.be(3333)
                    done()
                }, 300)
            })
        }, 300)
        it("测试baseUrl, packages", function (done) {
            setTimeout(function () {
                require.config({
                    baseUrl: "/avalon/src",
                    packages: ["cat"]
                })
                var index = 0
                require(["./loader/ccc", "./loader/ddd", "cat"], function (a, b, c) {
                    expect(a + b + c).to.be(85)
                    ++index
                })
                setTimeout(function () {
                    expect(index).to.be(1)
                    done()
                }, 300)
            })
        }, 300)
        it("测试map", function (done) {
            setTimeout(function () {
                require.config({
                    baseUrl: "/avalon/src/loader",
                    map: {
                        "old/aaa": {
                            ddd: "ddd1.0"
                        },
                        "new/aaa": {
                            ddd: "ddd1.2"
                        },
                        "*": {
                            ddd: "ddd1.1"
                        }
                    }
                })
                var index2 = 0
                require(["old/aaa", "new/aaa", "eee"], function (a, b, c) {
                    expect(a).to.be(1456)
                    expect(b).to.be(1300)
                    expect(c).to.be(8990)
                    avalon.log(a, b, c)
                    ++index2
                })
                setTimeout(function () {
                    expect(index2).to.be(1)
                    done()
                }, 300)
            })
        }, 600)
    })
    if (!avalon.directive) {
        describe("确保数组的$model与它的元素的$model是共通的", function () {
            //确保位置没有错乱
            it("sync", function () {
                var test = avalon.define("array$model", function (vm) {
                    vm.array = [{
                            id: 1
                        }, {
                            id: 2
                        }, {
                            id: 3
                        }, {
                            id: 4
                        }]
                })
                expect(test.array.$model[0]).to.be(test.array[0].$model)
            })
        })
    }
    describe("offsetParent", function () {
        //确保位置没有错乱
        it("async", function (done) {
            var div = document.createElement("div")
            div.innerHTML = '<table id="offsetparenttable" border="1">' +
                    '    <tr>' +
                    '        <td id="offsetparenttd">TD</td>' +
                    '    </tr>' +
                    '</table>' +
                    '<ul>' +
                    '    <li id="offsetparentli"></li>' +
                    '</ul>' +
                    '<div id="offsetrelative" style="position:relative;left:20px;height:200px;width:200px;background:red;">' +
                    '   <div id="offsetreabsolue" style="position:absolute;left:20px;height:100px;width:200px;background:pink;">' +
                    '        <div id="offsetreabsolue2" style="position:absolute;left:40px;height:50px;width:50px;background:blue;"></div>' +
                    '        <div id="offsetreabsolue3" style="height:20px;"></div>' +
                    '        <div id="offsetreabsolue4" style="position:absolute;left:60px;top:40px;height:20px;width:20px;background:green;"></div>' +
                    '     </div>' +
                    '</div>'
            document.body.appendChild(div)
            setTimeout(function () {
                var offsetParent = function (id) {
                    return avalon(document.getElementById(id)).offsetParent()[0] || {}
                }
                expect(offsetParent("offsetparenttd").tagName).to.be("HTML")
                expect(offsetParent("offsetparentli").tagName).to.be("HTML")
                expect(offsetParent("offsetrelative").tagName).to.be("HTML")
                expect(offsetParent("offsetreabsolue").id).to.be("offsetrelative")
                expect(offsetParent("offsetreabsolue2").id).to.be("offsetreabsolue")
                expect(offsetParent("offsetreabsolue3").id).to.be("offsetreabsolue")
                expect(offsetParent("offsetreabsolue4").id).to.be("offsetreabsolue")
                clearTest(null, div, done)


            }, 100)
        })
    })


    describe("avalon.each", function () {
        //确保位置没有错乱
        it("sync", function () {
            var array = ["aaa", "bbb", "ccc", "ddd"],
                    index = 0
            avalon.each(array, function (a, b) {
                switch (index++) {
                    case 0:
                        expect(a).to.be(0)
                        expect(b).to.be("aaa")
                        break;
                    case 1:
                        expect(a).to.be(1)
                        expect(b).to.be("bbb")
                        break;
                    case 2:
                        expect(a).to.be(2)
                        expect(b).to.be("ccc")
                        break;
                    case 3:
                        expect(a).to.be(3)
                        expect(b).to.be("ddd")
                        break;
                }
            })
            var obj = {
                xxx: 111,
                yyy: 222
            },
            k = 0
            avalon.each(obj, function (a, b) {
                switch (k++) {
                    case 0:
                        expect(a).to.be("xxx")
                        expect(b).to.be(111)
                        break;
                    case 1:
                        expect(a).to.be("yyy")
                        expect(b).to.be(222)
                        break;
                }
            })
        })
    })

    describe('newparser', function () {
        //确保位置没有错乱
        it("sync", function () {

            var str = 'bbb["a\aa"]'

            var rcomments = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg // form http://jsperf.com/remove-comments
            var rbracketstr = /\[(['"])[^'"]+\1\]/g
            var rspareblanks = /\s*(\.|'|")\s*/g
            var rvariable = /"(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'|\.?[a-z_$]\w*/ig
            var rexclude = /^['".]/

            function getVariables(code) {
                var match = code
                        .replace(rcomments, "") //移除所有注释
                        .replace(rbracketstr, "") //将aaa["xxx"]转换为aaa 去掉子属性
                        .replace(rspareblanks, "$1") //将"' aaa .  bbb'"转换为"'aaa.ddd'"
                        .match(rvariable) || []
                var vars = [],
                        unique = {}
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

    describe("shortcircuit", function () {
        it("async", function (done) {
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
                data: [{
                        id: "47",
                        name: "111"
                    }, {
                        id: "58",
                        name: "222"
                    }, {
                        id: "69",
                        name: "333"
                    }]
            });
            avalon.scan(div, vm)
            setTimeout(function () {
                var s = div.getElementsByTagName("select")
                expect(avalon(s[0]).val()).to.be("111")
                expect(avalon(s[1]).val()).to.be("111")
                expect(avalon(s[2]).val()).to.be("111")
                vm.filter = "22"
                setTimeout(function () {
                    var s = div.getElementsByTagName("select")
                    expect(avalon(s[0]).val()).to.be("222")
                    expect(avalon(s[1]).val() || "").to.be("")
                    expect(avalon(s[2]).val()).to.be("222")
                    vm.filter = "5"
                    setTimeout(function () {
                        var s = div.getElementsByTagName("select")
                        expect(avalon(s[0]).val()).to.be("222")
                        expect(avalon(s[1]).val()).to.be("222")
                        expect(avalon(s[2]).val() || "").to.be("")
                        vm.filter = "5"
                        clearTest(vm, div, done)
                    }, 150)

                }, 150)

            }, 150)

        })
    })
    describe("array.splice(0,0,1,2,3)", function () {
        it("async", function (done) {
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
            setTimeout(function () {
                var s = div.getElementsByTagName("li")
                expect(s[0].innerHTML).to.be("1")
                expect(s[1].innerHTML).to.be("2")
                vm.array.splice(0, 0, 3, 4, 5)

                setTimeout(function () {
                    var s = div.getElementsByTagName("li")
                    expect(s.length).to.be(5)
                    expect(s[0].innerHTML).to.be("3")
                    expect(s[1].innerHTML).to.be("4")
                    expect(s[2].innerHTML).to.be("5")
                    expect(s[3].innerHTML).to.be("1")
                    expect(s[4].innerHTML).to.be("2")
                    clearTest(vm, div, done)
                }, 150)

            }, 150)

        })
    })
    describe("ms-repeat与非监听数组或对象", function () {
        it("async", function (done) {
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 <div ms-repeat="$array">{{el}},{{$first}},{{$last}},{{$index}}</div>
                 <div ms-repeat="$object">{{$key}}--{{$val}}</div>
                 */
            })
            body.appendChild(div)
            var vm = avalon.define({
                $id: "$array",
                $array: [4, 5, 6, 7],
                $object: {
                    a: 22,
                    b: 33,
                    c: 44
                }
            });
            avalon.scan(div, vm)
            setTimeout(function () {
                var s = div.getElementsByTagName("div")
                expect(s.length).to.be(7)
                expect(s[0].innerHTML).to.be("4,true,false,0")
                expect(s[1].innerHTML).to.be("5,false,false,1")
                expect(s[2].innerHTML).to.be("6,false,false,2")
                expect(s[3].innerHTML).to.be("7,false,true,3")
                expect(s[4].innerHTML).to.be("a--22")
                expect(s[5].innerHTML).to.be("b--33")
                expect(s[6].innerHTML).to.be("c--44")
                clearTest(vm, div, done)
            }, 150)
        })
    })
    describe("data-duplex-event='change'", function () {
        //https://github.com/RubyLouvre/avalon/issues/668
        it("async", function (done) {
            var vm = avalon.define({
                $id: "data-duplex-event",
                q: 'aaa'
            })

            var body = document.body
            var div = document.createElement("div")
            var str = '<input ms-duplex="q"  data-duplex-event="blur"/>{{q}}'
            div.innerHTML = str
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var aaa = div.getElementsByTagName("input")[0]
                aaa.value = "222"
                setTimeout(function () {

                    expect(vm.q).to.be("222")
                    clearTest(vm, div, done)
                }, 300)

            })

        })
    })

    describe("input:hidden", function () {
        //https://github.com/RubyLouvre/avalon/issues/668
        it("async", function (done) {
            var vm = avalon.define({
                $id: "input:hidden",
                q: 'aaa'
            })

            var body = document.body
            var div = document.createElement("div")
            var str = '<input ms-duplex="q"  type="hidden"/>{{q}}'
            div.innerHTML = str
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var aaa = div.getElementsByTagName("input")[0]
                aaa.value = "222"
                setTimeout(function () {
                    expect(vm.q).to.be("222")
                    clearTest(vm, div, done)

                }, 300)
            })

        })
    })


    describe("data-duplex-observe", function () {
        //https://github.com/RubyLouvre/avalon/issues/668
        it("async", function (done) {
            var vm = avalon.define({
                $id: "data-duplex-observe",
                q: 'aaa'
            })

            var body = document.body
            var div = document.createElement("div")
            var str = '<input ms-duplex="q"  ms-data-duplex-observe="q"/><span id="data-duplex-observe">{{q}}</span>'
            div.innerHTML = str
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var aaa = div.getElementsByTagName("input")[0]
                var el = document.getElementById("data-duplex-observe")
                expect(vm.q).to.be("aaa")
                aaa.value = "222"
                setTimeout(function () {
                    expect(el.innerHTML).to.be("222") //可以变动
                    aaa.value = "false"

                    setTimeout(function () {
                        expect(el.innerHTML).to.be("false") //再变一次
                        aaa.value = "123"
                        setTimeout(function () {
                            expect(el.innerHTML).to.be("false")
                            clearTest(vm, div, done)

                        }, 300)

                    }, 300)

                }, 300)
            })

        })
    })

    describe("array.clear() + checkbox ms-duplex-string", function () {
        //https://github.com/RubyLouvre/avalon/issues/668
        it("async", function (done) {
            var vm = avalon.define({
                $id: 'idTypeTable',
                data: [{
                        "Code": "10001",
                        "Title": "图书证1"
                    }, {
                        "Code": "10002",
                        "Title": "图书证2"
                    }, {
                        "Code": "10003",
                        "Title": "图书证3"
                    }, {
                        "Code": "10004",
                        "Title": "图书证4"
                    }],
                selectedArr: ["10001", "10002", "10003"],
                checkAll: function () {
                    vm.selectedArr = ["10001", "10002", "10003", "10004"];
                },
                cancelAll: function () {
                    vm.selectedArr.clear();
                }
            })

            var body = document.body
            var div = document.createElement("div")
            var str = heredoc(function () {
                /*
                 <ul>
                 <li ms-repeat="data">
                 <input type="checkbox" ms-attr-value="el.Code" ms-duplex-string="selectedArr">{{el.Title}}
                 </li>
                 </ul>
                 */
            })
            div.innerHTML = str
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var s = div.getElementsByTagName("input")
                expect(s[0].checked).to.be(true)
                expect(s[1].checked).to.be(true)
                expect(s[2].checked).to.be(true)
                expect(s[3].checked).to.be(false)
                vm.cancelAll()
                setTimeout(function () {
                    var s = div.getElementsByTagName("input")
                    expect(s[0].checked).to.be(false)
                    expect(s[1].checked).to.be(false)
                    expect(s[2].checked).to.be(false)
                    expect(s[3].checked).to.be(false)
                    vm.checkAll()
                    setTimeout(function () {
                        var s = div.getElementsByTagName("input")
                        expect(s[0].checked).to.be(true)
                        expect(s[1].checked).to.be(true)
                        expect(s[2].checked).to.be(true)
                        expect(s[3].checked).to.be(true)
                        clearTest(vm, div, done)
                    }, 300)
                }, 300)
            }, 300)

        })
    })

    describe("avalon.parseHTML", function () {
        avalon.parseHTML.p = 1
        it("async", function (done) { //函数,正则,元素,节点,文档,window等对象为非

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

            var xxx = avalon.parseHTML("<col/>").firstChild || {}
            expect(xxx.tagName).to.be("COL")

            var xxx = avalon.parseHTML("<td>111</td>").firstChild || {}
            expect(xxx.tagName).to.be("TD")

            var xxx = avalon.parseHTML("<th>111</th>").firstChild || {}
            expect(xxx.tagName).to.be("TH")

            var nodes = avalon.parseHTML("<thead></thead>").childNodes
            expect(nodes.length).to.be(1)
            expect(nodes[0].tagName).to.be("THEAD")

            var xxx = avalon.parseHTML("<table></table>").firstChild
            expect(xxx.tagName).to.be("TABLE")
            expect(xxx.innerHTML).to.be("")

            var yyy = avalon.parseHTML("xxx").firstChild
            expect(yyy.nodeValue).to.be("xxx")

            var zzz = avalon.parseHTML("").firstChild
            expect(zzz.nodeValue).to.be("")
            setTimeout(function () {
                expect(avalon.parseHTML.p).to.be(11)
                delete avalon.parseHTML.p
                body.removeChild(node)
                body.removeChild(div)
                done()
            }, 300)

        })
    })
    describe("avalon.innerHTML", function () {
        //确保位置没有错乱
        it("async", function (done) {

            var body = document.body
            var div = document.createElement("div")
            var id = "ms" + (new Date - 0)
            var str = ("<span></span><script>avalon.XXXX = 'XXXX'<\/script>").replace(/XXXX/g, id)
            body.appendChild(div)
            avalon.innerHTML(div, str)
            setTimeout(function () {
                var spans = div.getElementsByTagName("span")
                expect(spans.length).to.be(1)
                expect(avalon[id]).to.be(id)

                delete avalon[id]

                body.removeChild(div)
                done()
            }, 300)


        })
    })
    describe("avalon.isWindow", function () {

        it("sync", function () {
            expect(avalon.isWindow(1)).to.be(false)
            expect(avalon.isWindow({})).to.be(false)
            //自定义的环引用对象
            var obj = {}
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

    describe("avalon.isPlainObject", function () {

        it("sync", function () {
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
            var fn = function () {
            }
            expect(avalon.isPlainObject(fn)).to.be(false)
            fn.prototype = {
                someMethod: function () {
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

    describe("avalon.isFunction", function () {
        if (avalon.isFunction) {
            it("sync", function () {
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


    describe("textNode.nodeValue === textNode.data", function () {
        it("sync", function () {

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

    describe("插值表达式中存在|", function () {
        it("sync", function (done) {
            var vm = avalon.define({
                $id: "rstringLiteral",
                xxx: "111",
                yyy: "222"
            })
            var div = document.createElement("div")
            div.innerHTML = "{{xxx + '|'+ yyy}}"
            document.body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                expect(div.innerHTML).to.be("111|222")
                clearTest(vm, div, done)
            })

        })
    })

    describe("ms-html", function () {
        it("async1", function (done) {
            var vm = avalon.define({
                $id: "ms-html1",
                array: ["<span>{{$index}}</span>", "<span>{{$index}}</span>", "<span>{{$index}}</span>"]
            })
            var div = document.createElement("div")
            div.innerHTML = '<div ms-repeat="array" ms-html="el"></div>'
            var body = document.body
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var spans = div.getElementsByTagName("span")
                console.log(div.innerHTML + "!")
                expect(spans.length).to.be(3)
                expect(spans[0].innerHTML).to.be("0")
                expect(spans[1].innerHTML).to.be("1")
                expect(spans[2].innerHTML).to.be("2")
                clearTest(vm, div, done)
            }, 300)
        })

        it("async2", function (done) {
            var div = document.createElement("div")
            var vm = avalon.define({
                $id: "ms-html2",
                toggle: false,
                html: "<span>11</span><strong>222</strong><span>333</span><strong>444</strong><span>555</span>",
                show: function () {
                    vm.toggle = true
                },
                scan: function () {
                    avalon.scan(div)
                }
            });
            div.innerHTML = '<div ms-if="toggle">%%%%{{html|html}}%%%%</div>'
            var body = document.body
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var divs = div.getElementsByTagName("div")
                expect(divs.length).to.be(0)
                vm.scan()
                setTimeout(function () {
                    vm.show()
                    setTimeout(function () {
                        var spans = div.getElementsByTagName("span")
                        var strongs = div.getElementsByTagName("strong")
                        expect("span" + spans.length).to.be("span3")
                        expect(strongs.length).to.be(2)
                        clearTest(vm, div, done)
                    }, 300)
                }, 300)
            }, 300)
        })
    })

    describe("avalon.slice", function () {

        it("sync", function () {
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



    describe("内部方法isArrayLike", function () {
        function isArrayLike(obj) {
            if (!obj)
                return false
            var n = obj.length
            if (n === (n >>> 0)) { //检测length属性是否为非负整数
                var type = Object.prototype.toString.call(obj).slice(8, -1)
                if (/(?:regexp|string|function|window|global)$/i.test(type))
                    return false
                if (type === "Array")
                    return true
                try {
                    if ({}.propertyIsEnumerable.call(obj, "length") === false) { //如果是原生对象
                        return /^\s?function/.test(obj.item || obj.callee)
                    }
                    return true
                } catch (e) { //IE的NodeList直接抛错
                    return !obj.eval //IE6-8 window
                }
            }
            return false
        }

        it("sync", function () {
            //函数,正则,元素,节点,文档,window等对象为非
            expect(isArrayLike(function () {
            })).to.be(false);
            expect(isArrayLike(document.createElement("select"))).to.be(true);
            expect(isArrayLike("string")).to.be(false)
            expect(isArrayLike(/test/)).to.be(false)
            expect(isArrayLike(window)).to.be(false)
            expect(isArrayLike(true)).to.be(false)
            expect(isArrayLike(avalon.noop)).to.be(false)
            expect(isArrayLike(100)).to.be(false)
            expect(isArrayLike(document)).to.be(false)
            expect(isArrayLike(arguments)).to.be(true)
            expect(isArrayLike(document.links)).to.be(true)
            expect(isArrayLike(document.documentElement.childNodes)).to.be(true)
            // 自定义对象必须有length, 并且为非负正数
            expect(isArrayLike({
                0: "a",
                1: "b",
                length: 2
            })).to.be(true)

        })

    })

    describe("vm.array = vm.array", function () {
        //确保位置没有错乱
        it("async", function (done) {
            var a = avalon.define("vm.array", function (vm) {
                vm.array = [1, 2, 3]
            });
            setTimeout(function () {
                a.array = a.array
                setTimeout(function () {
                    expect(avalon.type(a.array)).to.be("array")
                    delete avalon.vmodels["vm.array"]
                    done()
                }, 200)
            }, 100)
        })
    })

    describe("vm.array被重置后$watch机制还有效", function () {
        //确保位置没有错乱
        it("async", function (done) {
            var count = 1,
                    length
            var model = avalon.define("arrlength", function (vm) {
                vm.arr = [1, 2, 3]
            });
            model.arr.$watch('length', function (a) {
                length = a
                ++count
            });
            var hehe = model.arr;
            setTimeout(function () {
                model.arr = [1, 2, 3, 4, 5, 6, 7]
            }, 50);
            setTimeout(function () {
                expect(length).to.be(7)
                expect(count).to.be(2)
            }, 100);
            setTimeout(function () {

                hehe.push(10)
            }, 150);
            setTimeout(function () {
                expect(length).to.be(8)
                expect(count).to.be(3)
                delete avalon.vmodels["arrlength"]
                done()
            }, 200);
        })
    })


    describe("avalon.range", function () {

        it("sync", function () {
            expect(avalon.range(10)).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
            expect(avalon.range(1, 11)).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
            expect(avalon.range(0, 30, 5)).to.eql([0, 5, 10, 15, 20, 25])
            expect(avalon.range(0, -10, -1)).to.eql([0, -1, -2, -3, -4, -5, -6, -7, -8, -9])
            expect(avalon.range(0)).to.eql([])
        })

    })

    describe("filters.sanitize", function () {

        it("async", function (done) {
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

            var vm = avalon.define({
                $id: "multiFilter",
                test: str
            })

            var div = document.createElement("div")
            div.innerHTML = '{{test|lowercase|truncate(239)|sanitize|html}}'

            var body = document.body
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var ret = div.innerHTML
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
                clearTest(vm, div, done)
            }, 100)
        })

    })

    describe("filters.number", function () {
        it("sync", function () {
            expect(avalon.filters.number(1111111111)).to.be("1,111,111,111.000")
            expect(avalon.filters.number(1111111111, 2, '.', '-')).to.be("1-111-111-111.00")

        })
    })

    describe("filters.truncate", function () {
        it("async", function (done) {

            var vm = avalon.define({
                $id: "truncate",
                name: "大跃进右"
            })

            var div = document.createElement("div")
            div.innerHTML = '{{name|truncate(3,"***")}}'

            var body = document.body
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var ret = div.innerHTML
                expect(ret).to.be("***")
                clearTest(vm, div, done)
            }, 100)

        })
    })
    describe("avalon.oneObject", function () {

        it("sync", function () {
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

    describe("avalon.parseDisplay", function () {
        it("sync", function () {
            expect(typeof avalon.parseDisplay).to.be("function")
        })
    })


    describe("addClass,removeClass", function () {

        it("async", function (done) {
            avalon.ready(function () {
                var body = avalon(document.body)
                body.addClass("aaaa bbbb cccc dddd bbbb")
                expect(body[0].className).to.be("aaaa bbbb cccc dddd")
                body.removeClass("aaaa bbbb cccc dddd bbbb")
                expect(body[0].className).to.be("")
                done()
            })
        })

    })

    describe("filters.date", function () {
        //验证最常用的日期过滤器
        it("sync", function () {
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
            expect(avalon.filters.date("2015-01-31 00:00:00", "yyyy-MM-dd")).to.be("2015-01-31")
            expect(avalon.filters.date("\/Date(1216796600500)\/", "yyyy-MM-dd")).to.be("2008-07-23")
            expect(avalon.filters.date(1373021259229, format)).to.be("2013 07 05:18:47:39")
        })
        it("async", function (done) {
            var vm = avalon.define({
                $id: "dateFilter",
                test: "2014/12/24"
            })
            var div = document.createElement("div")
            div.innerHTML = '<p>{{test|date("yyyy MM dd:HH:mm:ss")}}</p>' + '<p>{{ 1373021259229|date("yyyy MM dd:HH:mm:ss")}}</p>' + '<p>{{ "1373021259229"|date("yyyy MM dd:HH:mm:ss")}}</p>' + '<p>{{ "2014-12-07T22:50:58+08:00" | date("yyyy MM dd:HH:mm:ss")}}</p>' + '<p>{{ "\/Date(1373021259229)\/" | date("yyyy MM dd:HH:mm:ss")}}</p>'
            var body = document.body
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var ps = div.getElementsByTagName("p")
                expect(ps[0].innerHTML).to.be("2014 12 24:00:00:00")
                expect(ps[1].innerHTML).to.be("2013 07 05:18:47:39")
                expect(ps[2].innerHTML).to.be("2013 07 05:18:47:39")
                expect(ps[3].innerHTML).to.be("2014 12 07:22:50:58")
                expect(ps[4].innerHTML).to.be("2013 07 05:18:47:39")
                clearTest(vm, div, done)
            }, 100)
        })
    })
    ////////////////////////////////////////////////////////////////////////
    //////////    下面是绑定属性,监控属性相关   ////////////////////////////
    ////////////////////////////////////////////////////////////////////////


    describe("avalon1.4.5之 前需要对计算属性与$model做的测试 ", function () {
        if (avalon.directive) {
            return
        }
        describe("计算属性", function () {
            it("async", function () {
                var vm = avalon.define({
                    $id: "computed",
                    firstName: "司徒",
                    lastName: "正美",
                    fullName: {
                        set: function (val) {
                            var array = val.split(" ")
                            this.firstName = array[0]
                            this.lastName = array[1]
                        },
                        get: function () {
                            return this.firstName + " " + this.lastName;
                        }
                    }
                })
                vm.$watch("fullName", function (a) {
                    expect(a).to.be("清风 火羽")
                })


                expect(vm.fullName).to.be("司徒 正美")
                vm.fullName = "清风 火羽"
                expect(vm.firstName).to.be("清风")
                expect(vm.lastName).to.be("火羽")
            })

            it("async2", function (done) {
                var model = avalon.define("computed2", function (vm) {
                    vm.test0 = false;
                    vm.test1 = {
                        set: function (val) {
                            this.test0 = val;
                        },
                        get: function () {
                            return this.test0;
                        }
                    };
                    vm.test2 = false;
                    vm.$watch('test1', function (val) {
                        vm.test2 = val;
                    });
                    vm.one = function () {
                        vm.test1 = !vm.test1;
                    };
                    vm.two = function () {
                        vm.test0 = !vm.test0;
                    };
                });
                var body = document.body
                var div = document.createElement("div")
                div.innerHTML = "<div > <button ms-click=\"one\" type=\"button\">\u6D4B\u8BD51</button> <button ms-click=\"two\" type=\"button\">\u6D4B\u8BD52</button> <br>test1: {{test1}} <br>test2: {{test2}}</div>"
                body.appendChild(div)
                avalon.scan(div, model)
                setTimeout(function () {
                    var buttons = div.getElementsByTagName("button")
                    buttons[0].click()
                    expect(model.test0).to.be(true)
                    expect(model.test1).to.be(true)
                    setTimeout(function () {
                        buttons[1].click()
                        expect(model.test0).to.be(false)
                        expect(model.test1).to.be(false)
                        delete avalon.vmodels.computed2
                        body.removeChild(div)
                        done()
                    }, 100)

                }, 100)

            })

            it("async3", function (done) {
                var model = avalon.define("computed3", function (vm) {
                    vm.test0 = false;
                    vm.test1 = false;
                    vm.test2 = false;
                    vm.msg = '';
                    vm.$watch('test0', function (val) {
                        if (val) {
                            vm.msg += 'test0-';
                            vm.test1 = true;
                            if (vm.test2) {
                                vm.msg = 'ok';
                            }
                            vm.msg += '！！';
                        }
                    });
                    vm.$watch('test1', function (val) {
                        if (val) {
                            vm.msg += 'test1-';
                            vm.test2 = true;
                        }
                    });
                    vm.one = function () {
                        vm.test0 = true;
                    };
                });
                var body = document.body
                var div = document.createElement("div")
                div.innerHTML = "<div type=\"button\"><button ms-click=\"one\">\u6D4B\u8BD51</button><br>test0: {{test0}}<br>test1: {{test1}}<br>test2: {{test2}}<br>msg: {{msg}}</div>"
                body.appendChild(div)
                avalon.scan(div, model)
                setTimeout(function () {
                    div.getElementsByTagName("button")[0].click()
                    setTimeout(function () {
                        expect(model.test0).to.be(true)
                        expect(model.test1).to.be(true)
                        expect(model.test2).to.be(true)
                        expect(model.msg).to.be("ok！！")
                        clearTest(model, div, done)
                    })
                }, 100)

            })

            it("依赖项触发计算属性变动", function () {
                var model = avalon.define({
                    $id: "computed4",
                    test1: "test1",
                    test2: {
                        get: function () {
                            return this.test1;
                        }
                    }
                });
                expect(model.test2).to.be("test1")
                model.test1 = "test@@@"
                expect(model.$model.test2).to.be("test@@@")
                delete avalon.vmodels.computed4
            })
            it("在对象绑定里输出索引值", function (done) {
                var count = 0;
                var vm = avalon.define({
                    $id: "test",
                    list: {
                        a: 'a',
                        b: 'b',
                        c: 'c'
                    },
                    getIndex: function () {
                        return count++;
                    }
                })
                var body = document.body
                var div = document.createElement("div")
                div.innerHTML = heredoc(function () {
                    /**
                     <h3>演示如何在对象绑定里输出索引值</h3>
                     <div ms-repeat="list">{{getIndex()}}-{{$val}}</div>
                     */
                })
                body.appendChild(div)
                avalon.scan(div, vm)
                setTimeout(function () {
                    var divs = div.getElementsByTagName("div")
                    expect(divs[0].innerHTML).to.be("0-a")
                    expect(divs[1].innerHTML).to.be("1-b")
                    expect(divs[2].innerHTML).to.be("2-c")
                    clearTest(vm, div, done)
                })

            })

            it("多个依赖变动时，延迟计算属性的$watch回调", function (done) {
                var vm = avalon.define({
                    $id: "computed5",
                    a: 1,
                    b: 2,
                    c: {
                        get: function () {
                            return this.a + " " + this.b
                        },
                        set: function (v) {
                            var arr = v.split(" ")
                            this.a = arr[0] || ""
                            this.b = arr[1]
                        }
                    }
                });
                var index = 0
                vm.$watch("c", function () {
                    index++
                })
                expect(vm.c).to.be("1 2")
                vm.a = "xx"
                vm.b = "yy"
                expect(vm.c).to.be("xx yy")
                if (avalon.version <= 1.44) {
                    expect(index).to.be(0)
                } else {
                    expect(index).to.be(2)
                }

                setTimeout(function () {
                    if (avalon.version <= 1.44) {
                        expect(index).to.be(1)
                    } else {
                        expect(index).to.be(2)
                    }
                    delete avalon.vmodels.computed5
                    done()
                }, 300)
            })

            it("计算属性与依赖项的$watch回调顺序", function (done) {
                var vm = avalon.define({
                    $id: "computed6",
                    a: 10,
                    b: 20,
                    c: {
                        get: function () {
                            return this.a + " " + this.b
                        },
                        set: function (v) {
                            var arr = v.split(" ")
                            this.a = arr[0] || ""
                            this.b = arr[1]
                        }
                    }
                });
                var arr = []
                vm.$watch("a", function () {
                    arr.push("a")
                })
                vm.$watch("b", function () {
                    arr.push("b")
                })
                vm.$watch("c", function () {
                    arr.push("c")
                })
                expect(vm.c).to.be("10 20")
                vm.c = "30 40"
                expect(vm.a).to.be("30")
                expect(vm.b).to.be("40")
                setTimeout(function () {
                    expect(arr.join(" ")).to.be("a b c")
                    delete avalon.vmodels.computed6
                    done()
                }, 300)
            })
        });
        describe("双工绑定与$model", function () {
            //检测值的同步
            it("async", function (done) {
                var model = avalon.define("ms-duplex-select", function (vm) {
                    vm.array = ["aaa", "bbb", "ccc", "ddd"]
                    vm.selected = "ddd"
                    vm.$watch("selected", function (a, b) {
                        expect(model.$model.selected).to.be("bbb")
                        expect(a).to.be("bbb")
                        expect(b).to.be("ddd")
                        clearTest("ms-duplex-select", div, done)
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
                setTimeout(function () {
                    var el = div.getElementsByTagName("select")[0]
                    el.options[1].selected = true //改动属性
                    fireEvent(el, "change") //触发事件
                }, 200)
            })
        })
        describe("监控数组的$model应该等于其父VM.$model中的同名数组", function () {

            it("async", function (done) {
                var vmodel = avalon.define({
                    $id: 'observableArray$model',
                    x: 2,
                    arr: [{
                            id: 1000,
                            name: 'test1'
                        }, {
                            id: 2000,
                            name: 'test2'
                        }]
                })
                var body = document.body
                var div = document.createElement("div")
                div.innerHTML = ' <div ms-repeat="arr"><input type="text" ms-duplex="el.name"/>{{el.name}}</div>'
                body.appendChild(div)
                avalon.scan(div, vmodel)
                setTimeout(function () {
                    var inputs = div.getElementsByTagName("input")
                    inputs[0].value = "xxxx"
                    inputs[1].value = "yyyy"
                    setTimeout(function () {
                        expect(vmodel.arr[0].$model.name).to.be("xxxx")
                        expect(vmodel.$model.arr[0].name).to.be("xxxx")
                        expect(vmodel.arr[1].$model.name).to.be("yyyy")
                        expect(vmodel.$model.arr[1].name).to.be("yyyy")
                        var data = vmodel.arr.$events[avalon.subscribers][0]
                        var is138 = "$proxies" in vmodel.arr
                        var is143 = "$proxy" in vmodel.arr
                        if (is138) {
                            var $proxies = vmodel.arr.$proxies
                            expect($proxies[0].el()).to.be(vmodel.arr[0])
                            expect($proxies[0].el().$model).to.be(vmodel.arr[0].$model)
                        } else if (is143) {
                            var $proxies = vmodel.arr.$proxy
                            expect($proxies[0].el).to.be(vmodel.arr[0])
                            expect($proxies[0].el.$model).to.be(vmodel.arr[0].$model)
                        } else {
                            var $proxies = data.proxies
                            expect($proxies[0].el).to.be(vmodel.arr[0])
                            expect($proxies[0].el.$model).to.be(vmodel.arr[0].$model)
                        }

                        expect(vmodel.$model.arr[0]).to.be(vmodel.arr[0].$model)
                        clearTest("observableArray$model", div, done)
                    }, 300)

                }, 300)
            })

        })
    })

    describe("属性绑定", function () {

        it("async", function (done) {
            var vm = avalon.define({
                $id: "ms-attr-*",
                aaa: "new",
                active: "ok"
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 <input ms-attr-value='aaa' ms-attr-class='active' value='old'>
                 */
            })
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var input = div.getElementsByTagName("input")[0]

                expect(input.value).to.be("new")
                expect(input.className).to.be("ok")
                clearTest(vm, div, done)
            }, 100)
        })

    })

    describe("对于不存在的属性将不移除对应的插值表达式或绑定属性", function () {
        //移除操作分别在parseExprProxy与executeBindings里
        it("async", function (done) {
            var model = avalon.define('parseExprProxy', function (vm) {
                vm.name = "名字"
                vm.answer = "短笛"
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<div >我的{{name}}叫{{answer}},他的{{name}}叫{{no}},{{10*10}}" +
                    "</div><p  ms-text=\"name\"></p> <p  ms-text=\"no\"></p>"
            body.appendChild(div)
            avalon.scan(div, model)

            setTimeout(function () {
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


    describe("事件绑定", function () {
        //移除操作分别在parseExprProxy与executeBindings里
        it("async", function (done) {
            var val = false
            var model = avalon.define('onclick', function (vm) {
                vm.f1 = function () {
                    val = true
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<button type='button' ms-click='f1'>click me</button>"
            body.appendChild(div)
            avalon.scan(div, model)

            setTimeout(function () {
                var test = div.getElementsByTagName("button")[0]
                test.click()
                setTimeout(function () {
                    expect(val).to.be(true)
                    body.removeChild(div)
                    done()
                }, 300)
            })
        })

    })

    describe("ms-attr-checked", function () {
        it("async", function (done) {
            var vm = avalon.define({
                $id: "check1",
                isChecked: false
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<input type='checkbox' ms-attr-checked='isChecked'/>checkedx"
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var test = div.getElementsByTagName("input")[0]
                expect(test.checked).to.be(false)
                test.click()
                setTimeout(function () {
                    expect(test.checked).to.be(true)
                    clearTest("check1", div, done)
                }, 300)
            }, 300)
        })
    })

    describe("ms-attr-checked2", function () {
        it("async", function (done) {
            var vm = avalon.define({
                $id: "check2",
                isChecked: false
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<input type='checkbox' ms-attr-checked='isChecked'/>checkedx"
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var test = div.getElementsByTagName("input")[0]
                expect(test.checked).to.be(false)
                vm.isChecked = true
                setTimeout(function () {
                    expect(test.checked).to.be(true)
                    clearTest("check2", div, done)
                }, 300)
            }, 300)
        })
    })
    describe("插值表达式", function () {
        it("async", function (done) {
            var vm = avalon.define({
                $id: "texttext",
                x: '{{uuu}}',
                y: '{{bbb}}',
                arr: [1, 2, 3]
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = 'A：<div ms-each="arr">{{x}}</div>B：<div ms-repeat="arr">{{y}}</div>'
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var ps = div.getElementsByTagName("div")
                var prop = "textContent" in div ? "textContent" : "innerText"
                expect(ps.length).to.be(4)
                expect(ps[0][prop]).to.be("{{uuu}}{{uuu}}{{uuu}}")
                expect(ps[1][prop]).to.be("{{bbb}}")
                expect(ps[2][prop]).to.be("{{bbb}}")
                expect(ps[3][prop]).to.be("{{bbb}}")

                clearTest(vm, div, done)

            }, 300)
        })
    })
    describe("类名绑定", function () {
        it("async", function (done) {
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
            setTimeout(function () {
                var ps = div.getElementsByTagName("p")
                expect(ps[0].className).to.be("aaa xxx ccc")
                expect(ps[1].className).to.be("")
                model.toggle = false
                setTimeout(function () {
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
    describe("双工绑定", function () {
        it("sync", function () {
            var reg = /\w\[.*\]|\w\.\w/
            //用于ms-duplex
            expect(reg.test("aaa[bbb]")).to.be(true)
            expect(reg.test("aaa.kkk")).to.be(true)
            expect(reg.test("eee")).to.be(false)
        })

        it("async", function (done) {
            var model = avalon.define("ms-duplex-regexp", function (vm) {
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
                '<p>{{aaa.yyy}}</p>'
            ].join('')
            body.appendChild(div)
            avalon.scan(div, model)

            setTimeout(function () { //必须等扫描后才能开始测试，100-400ms是一个合理的数字
                var ps = div.getElementsByTagName("p")
                expect(ps[0].innerHTML).to.be("text")
                expect(ps[1].innerHTML).to.be("444")
                expect(ps[2].innerHTML).to.be("555")
                model.ccc = "change"
                setTimeout(function () {
                    expect(ps[0].innerHTML).to.be("change")
                    body.removeChild(div)
                    delete avalon.vmodels["ms-duplex-regexp"]
                    done()
                })
            })

        })
        it("textarea", function (done) {
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
            setTimeout(function () {
                var aaa = div.getElementsByTagName("textarea")[0]
                var bbb = div.getElementsByTagName("input")[0]
                aaa.value = "textarea"
                bbb.value = "input"
                setTimeout(function () {
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
    describe("双工绑定ms-duplex-boolean", function () {
        //ms-duplex-bool只能用于radio控件，会自动转换value为布尔，同步到VM
        //IE6下通过程序触发radio控件，ms-duplex-boolean失效 https://github.com/RubyLouvre/avalon/issues/681
        it("async", function (done) {
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

            setTimeout(function () {
                var inputs = div.getElementsByTagName("input")
                expect(inputs.length).to.be(2)
                expect(inputs[0].checked + "1").to.be("false1")
                expect(inputs[1].checked).to.be(true)
                inputs[0].click()
                setTimeout(function () {
                    expect(inputs[0].checked + "2").to.be("true2")
                    expect(typeof model.aaa).to.be("boolean")
                    expect(model.aaa).to.be(true)
                    body.removeChild(div)
                    delete avalon.vmodels["ms-duplex-boolean"]
                    done()
                }, 100)

            }, 100)
        })
    })

    describe("双工绑定ms-duplex-number", function () {
        //1.4.1新添加
        it("async", function (done) {
            var model = avalon.define({
                $id: "ms-duplex-number",
                aaa: 222,
                bbb: NaN
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = ['<input ms-duplex-number="aaa" >',
                '<input ms-duplex-number="bbb" data-duplex-number="strong">'
            ].join("")
            body.appendChild(div)
            avalon.scan(div, model)

            setTimeout(function () {
                var inputs = div.getElementsByTagName("input")
                expect(inputs.length).to.be(2)
                expect(inputs[0].value).to.be("222")
                expect(inputs[1].value).to.be("0")
                inputs[0].value = "888"
                inputs[1].value = "999"
                setTimeout(function () {
                    expect(model.aaa).to.be(888)
                    expect(model.bbb).to.be(999)
                    clearTest("ms-duplex-number", div, done)

                }, 100)

            }, 100)
        })
    })

    describe("双工绑定ms-duplex-string", function () {
        it("async", function (done) {
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 <input ms-duplex-string="xxx" type="radio" value="aaa">aaa
                 <input ms-duplex-string="xxx" type="radio" value="bbb">bbb
                 <input ms-duplex-string="xxx" type="radio" value="ccc">ccc
                 */
            })
            document.body.appendChild(div)

            var vm = avalon.define({
                $id: "ms-click-ms-duplex",
                xxx: "bbb"
            })
            avalon.scan(div, vm)
            setTimeout(function () { //必须等扫描后才能开始测试，400ms是一个合理的数字
                var ps = div.getElementsByTagName("input")
                var input = ps[0]
                expect(ps[1].checked).to.be(true)
                input.click()
                if (input.fireEvent) {
                    input.fireEvent("onchange")
                }
                setTimeout(function () {
                    expect(vm.xxx).to.be("aaa")
                    clearTest("ms-click-ms-duplex", div, done)
                }, 300)
            }, 300)
        })
    })

    describe("双工绑定ms-duplex-checked", function () {
        it("async", function (done) {
            var div = document.createElement("div")
            div.innerHTML = '<input ms-duplex-checked="xxx" type="checkbox" id="ms-duplex-checked-c" >' +
                    '<input ms-duplex-checked="yyy" type="radio" id="ms-duplex-checked-r" >'
            document.body.appendChild(div)

            var model = avalon.define("ms-duplex-checked", function (vm) {
                vm.xxx = false
                vm.yyy = false
            })
            avalon.scan(div, model)
            setTimeout(function () { //必须等扫描后才能开始测试，400ms是一个合理的数字
                var ps = div.getElementsByTagName("input")
                expect(ps[0].checked).to.be(false)
                expect(ps[1].checked).to.be(false)
                ps[0].click()
                ps[1].click()
                setTimeout(function () {
                    expect(model.xxx).to.be(true)
                    expect(model.yyy).to.be(true)
                    expect(ps[0].checked).to.be(true)
                    expect(ps[1].checked).to.be(true)
                    clearTest("ms-duplex-checked", div, done)
                }, 300)
            }, 300)
        })
    })


    ////////////////////////////////////////////////////////////////////////
    //////////    下面是监控数组相关        ////////////////////////////
    ////////////////////////////////////////////////////////////////////////


    describe("确保不会误删元素", function () {

        it("sync", function () {
            var model = avalon.define("removeArray", function (vm) {
                vm.array = [1, 2, 3, 4]
            })
            expect(model.array.remove(5)).to.eql([])
            expect(model.array.removeAt(-1)).to.eql([])
            delete avalon.vmodels["removeArray"]

        })
    })

    describe("array.size()", function () {

        it("async", function (done) {
            var model = avalon.define("array-size", function (vm) {
                vm.array = [1, 2, 3, 4]
            })
            var div = document.createElement("div")
            div.innerHTML = '{{array.size()}}'
            document.body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function () {
                expect(div.innerHTML).to.eql("4")
                clearTest("array-size", div, done)
            })


        })
    })
    describe("重写一个对象", function () {
        it("async", function (done) {
            var vmodel = avalon.define({
                $id: "overrideObject",
                first: {
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
            setTimeout(function () {
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

            setTimeout(function () {
                vmodel.first = {
                    array: ["@@@", "###", "$$$", "%%%"],
                    object: {
                        grape: "葡萄",
                        coconut: "椰子",
                        pitaya: "火龙果",
                        orange: "橙子"
                    }
                }
                setTimeout(function () {
                    var lis = div.getElementsByTagName("li")
                    expect(lis[0].innerHTML).to.be("@@@")
                    expect(lis[1].innerHTML).to.be("###")
                    expect(lis[2].innerHTML).to.be("$$$")
                    expect(lis[3].innerHTML).to.be("%%%")
                    expect(lis[4].innerHTML).to.be("grape:葡萄")
                    expect(lis[5].innerHTML).to.be("coconut:椰子")
                    expect(lis[6].innerHTML).to.be("pitaya:火龙果")
                    expect(lis[7].innerHTML).to.be("orange:橙子")
                    clearTest("overrideObject", div, done)
                }, 300)

            }, 500)
        })
    })


    describe("对象数组全部删光再添加,确保ms-duplex还可以用#403", function () {
        it("async", function (done) {
            var vmodel = avalon.define("recycleEachProxy", function (vm) {
                vm.array = [{
                        a: 1
                    }, {
                        a: 2
                    }, {
                        a: 3
                    }]
                vm.add = function () {
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
            setTimeout(function () {
                var lis = div.getElementsByTagName("li")
                expect(lis.length).to.be(3)
                expect(lis[0][prop].trim()).to.be("1")
                expect(lis[1][prop].trim()).to.be("2")
                expect(lis[2][prop].trim()).to.be("3")
                fireClick(lis[0])
                lis = div.getElementsByTagName("li")
                fireClick(lis[0])
                lis = div.getElementsByTagName("li")
                fireClick(lis[0])
                setTimeout(function () {
                    var lis = div.getElementsByTagName("li")
                    expect(lis.length).to.be(0)
                    var button = div.getElementsByTagName("button")[0]
                    fireClick(button)
                    fireClick(button)
                    fireClick(button)
                    setTimeout(function () {
                        var lis = div.getElementsByTagName("li")
                        expect(lis.length).to.be(3)
                        expect(lis[0][prop].trim()).to.be("4")
                        expect(lis[1][prop].trim()).to.be("4")
                        expect(lis[2][prop].trim()).to.be("4")

                        setTimeout(function () {
                            vmodel.array[2].a = 5
                            expect(lis[2][prop].trim()).to.be("5")
                            clearTest("recycleEachProxy", div, done)
                        }, 300)

                    }, 300)

                }, 300)


            }, 300)

        })
    })

    describe("通过ms-duplex同步ms-repeat生成的代理vm", function () {
        it("async", function (done) {
            var vm = avalon.define({
                $id: "repeat-has-duplex",
                data: {
                    list: ["1"]
                },
                click: function () {
                    vm.data.list.push("3")
                },
                clear: function () {
                    vm.data.list = []
                },
                serialize: function () {
                    return vm.data.list.$model + ""
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 <a href="#"  ms-on-click="click">add</a> <br>
                 <a href="#"  ms-on-click="serialize">serialize</a> <br>
                 <a href="#"  ms-on-click="clear">clear</a>
                 <p ms-repeat-el="data.list">
                 <input type="text" ms-attr-hehe="$index"  ms-duplex="el">
                 </p>
                 */
            })
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var input = div.getElementsByTagName("input")[0]
                expect(vm.serialize()).to.be("1")
                input.value = "2"
            }, 100)
            setTimeout(function () {
                expect(vm.serialize()).to.be("2")
            }, 200)
            setTimeout(function () {
                var as = div.getElementsByTagName("a")
                fireClick(as[2]) //请空
                setTimeout(function () {
                    var input = div.getElementsByTagName("input")
                    expect(input.length).to.be(0)
                    fireClick(as[0]) //添加3
                    fireClick(as[0]) //添加3
                    fireClick(as[0]) //添加3
                    //    fireClick(as[0]) //添加3
                }, 300)
                setTimeout(function () {
                    var input = div.getElementsByTagName("input")
                    input[0].value = 8 //请空
                    input[2].value = 7 //请空
                }, 600)

                setTimeout(function () {
                    expect(vm.serialize()).to.be("8,3,7")
                    clearTest("repeat-has-duplex", div, done)
                }, 900)
            }, 300)
        })
    })

    describe("双重循环测试$outer", function () {
        it("async", function (done) {
            var vmodel = avalon.define({
                $id: "$outertest",
                array: [
                    [1, 2, 3, 4],
                    ["a", "b", "c", "d"],
                    [11, 22, 33, 44]
                ]
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<table border="1" width="500"><tr ms-repeat="array"><td  ms-repeat-elem="el">{{$outer.$index}}' +
                    '.{{$index}}.{{elem}}</td></tr></table>'
            body.appendChild(div)
            avalon.scan(div, vmodel)
            setTimeout(function () {
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
                clearTest("$outertest", div, done)
            }, 400)
        })
    })

    describe("ms-repeat循环非监控对象2", function () {
        it("async", function (done) {
            var vmodel = avalon.define({
                $id: "ms-repeat-skiparray",
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
            var div = document.createElement("div")
            div.innerHTML = '<div ms-repeat="moreBanks" >{{$val.text}}</div><div ms-repeat="banksInfo" >{{$val.text}}</div>'
            body.appendChild(div)
            avalon.scan(div, vmodel)
            setTimeout(function () {
                var banks = div.getElementsByTagName("div")
                expect(banks.length).to.be(6)
                expect(banks[0].innerHTML.trim()).to.be("农业银行")
                expect(banks[1].innerHTML.trim()).to.be("招商银行")
                expect(banks[2].innerHTML.trim()).to.be("工商银行")
                expect(banks[3].innerHTML.trim()).to.be("建设银行")
                expect(banks[4].innerHTML.trim()).to.be("中国银行")
                expect(banks[5].innerHTML.trim()).to.be("邮政银行")

                clearTest("ms-repeat-skiparray", div, done)

            }, 300)
        })
    })
    describe("ms-each同时循环两行", function () {
        it("async", function (done) {
            var vmodel = avalon.define("ms-each-double", function (vm) {
                vm.data = {
                    list: [1, 2, 3, 4, 5, 6, 7]
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<h2>ms-each同时循环两行</h2><ul  ms-each-el="data.list"><li ms-if="$index ==  0">Name: {{el}}</li><li ms-if="$index !==  0" class="test">Name:{{el}}</li></ul>'
            body.appendChild(div)
            avalon.scan(div, vmodel)
            setTimeout(function () {
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
                clearTest("ms-each-double", div, done)
            }, 300)
        })
    })
    describe("1.3.6 set方法对整个被赋值的监控数组不起作用", function () {
        it("async", function (done) {
            var m1 = avalon.define({
                $id: "getEachProxyBUG1",
                fruits: [{
                        a: "苹果",
                        b: "apple"
                    }, {
                        a: "香蕉",
                        b: "banana"
                    }]
            })
            var m2 = avalon.define({
                $id: "getEachProxyBUG2",
                fighters: []
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 <div ms-controller="getEachProxyBUG1">
                 <h1 ms-repeat="fruits">{{el.a}}</h1> 
                 </div>
                 <div ms-controller="getEachProxyBUG2" id="getEachProxyBUG2">
                 <h1 ms-repeat="fighters">{{el}}</h1>
                 </div>'
                 */
            })
            body.appendChild(div)
            avalon.scan(div)
            setTimeout(function () {
                m1.fruits = [];
            }, 300);
            setTimeout(function () {
                m2.fighters = ['su-35', 'su-22'];
            }, 500);
            setTimeout(function () {
                m2.fighters.set(0, 'j-31')
                m2.fighters.set(1, 'j-10')
            }, 700);
            setTimeout(function () {
                var els = div.getElementsByTagName("h1")
                var prop = "textContent" in div ? "textContent" : "innerText"
                expect(els.length).to.be(2)
                expect(els[0][prop]).to.be("j-31")
                expect(els[1][prop]).to.be("j-10")
                clearTest("getEachProxyBUG1", div, done)
                delete avalon.vmodels.getEachProxyBUG2
            }, 900);
        })
    })

    describe("删除或添加项时会让触发其它项的更新", function () {
        //其实与【1.3.6 set方法对整个被赋值的监控数组不起作用】的问题一致
        it("async", function (done) {
            var index = 0
            var vm = avalon.define({
                $id: "collection-add-del",
                array: [
                    {html: "<div ms-scan=add>{{$index}}</div>"},
                    {html: "<div ms-scan=add>{{$index}}</div>"},
                    {html: "<div ms-scan=add>{{$index}}</div>"}
                ],
                add: function () {
                    ++index
                }
            });
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<div ms-repeat="array" ms-html="el.html"></div>'
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                vm.array.shift();
                setTimeout(function () {
                    expect(index).to.be(3)
                    clearTest("collection-add-del", div, done)
                }, 200)
            }, 300)
        })
    })

    describe("短路与短路或", function () {
        it("async", function (done) {
            var vm = avalon.define({
                $id: "shortcircuit",
                aa: {
                    b: false,
                    c: true
                },
                change1: function () {
                    vm.aa.b = true
                    vm.aa.c = true
                },
                change2: function () {
                    vm.aa.b = true
                    vm.aa.c = false
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<div ms-if="aa.b && aa.c">{{aa.b}}</div>'
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var nodes = div.getElementsByTagName("div")
                expect(nodes.length).to.be(0)
                vm.change1()
            }, 100)
            setTimeout(function () {
                var nodes = div.getElementsByTagName("div")
                expect(nodes.length).to.be(1)
                vm.change2()
            }, 200)
            setTimeout(function () {
                var nodes = div.getElementsByTagName("div")
                expect(nodes.length).to.be(0)
                vm.change1()
            }, 300)
            setTimeout(function () {
                var nodes = div.getElementsByTagName("div")
                expect(nodes.length).to.be(1)
                clearTest("shortcircuit", div, done)
            }, 400)
        })
    })

    describe("重写一个空对象", function () {
        it("async", function (done) {
            var vm = avalon.define({
                $id: "overrideEmptyObject",
                first: {}
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<input ms-duplex="first.duplex"><ul><li ms-repeat="first.array">{{el}}</li></ul><ol><li ms-repeat="first.object">{{$key}}:{{$val}}</li></ol>'
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                vm.first = {
                    duplex: 444,
                    array: ["@@@", "###", "$$$", "%%%"],
                    object: {
                        grape: "葡萄",
                        coconut: "椰子",
                        pitaya: "火龙果",
                        orange: "橙子"
                    }
                }
                setTimeout(function () {
                    var input = div.getElementsByTagName("input")[0]
                    expect(input.value).to.be("444")
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
                    clearTest(vm, div, done)
                }, 300)

            }, 300)
        })
    })

    describe("select使用ms-duplex不再通过不稳定checkScan回调来设置selected", function () {
        it("async", function (done) {
            var vm = avalon.define({
                $id: "select-ms-duplex",
                k: "c",
                b: "b",
                array: ["a", "b", "c", "d"],
                selected: "c"
            })

            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 <select ms-duplex="selected" ms-each="array">
                 <option >{{el}}</option>
                 </select>
                 <select ms-duplex="selected">
                 <option ms-repeat="array">{{el}}</option>
                 </select>
                 <select ms-duplex="selected">
                 <option value="a">a</option>
                 <option ms-attr-value="b">b</option>
                 <option>{{k}}</option>
                 <option>d</option>
                 </select>
                 <select ms-duplex="selected">
                 <option>a</option>
                 <option>c</option>
                 <option>b</option>
                 <option>d</option>
                 </select>
                 */
            })
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var ss = div.getElementsByTagName("select")
                expect(ss[0].options.length).to.be(4)
                expect(ss[0].options[2].selected).to.be(true)
                expect(ss[1].options.length).to.be(4)
                expect(ss[1].options[2].selected).to.be(true)
                expect(ss[2].options[2].selected).to.be(true)
                expect(ss[3].options[1].selected).to.be(true)
                clearTest("select-ms-duplex", div, done)
            }, 300)
        })
    })

    describe("当删除一个元素时$last会自动向前挪", function () {

        it("async", function (done) {
            var model = avalon.define({
                $id: "$last1",
                array: [1, 2, 3, 4]
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<ul><li ms-repeat="array" ms-class="xxx: $last"><button type="button" ms-click="$remove">移除</button></li></ul>'
            body.appendChild(div)
            avalon.scan(div, model)

            setTimeout(function () {
                var lis = div.getElementsByTagName("li")
                expect(lis.length).to.be(4)
                expect(lis[0].className).to.be("")
                expect(lis[1].className).to.be("")
                expect(lis[2].className).to.be("")
                expect(lis[3].className).to.be("xxx")
                var button = lis[3].firstChild
                button.click()
                setTimeout(function () {
                    var lis = div.getElementsByTagName("li")
                    expect(lis.length).to.be(3)
                    expect(lis[0].className).to.be("")
                    expect(lis[1].className).to.be("")
                    expect(lis[2].className).to.be("xxx")
                    delete avalon.vmodels["$last1"]
                    body.removeChild(div)
                    done()
                }, 50)


            }, 50)
        })
    })

    describe("当添加一个元素时$last会自动向后移", function () {
        //https://github.com/RubyLouvre/avalon/issues/785
        it("async", function (done) {
            var model = avalon.define({
                $id: "$last2",
                array: [1, 2, 3, 4]
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<ul><li ms-repeat="array" ms-class="xxx: $last">{{$index}}</li></ul>'
            body.appendChild(div)
            avalon.scan(div, model)

            setTimeout(function () {
                var lis = div.getElementsByTagName("li")
                expect(lis.length).to.be(4)
                expect(lis[0].className).to.be("")
                expect(lis[1].className).to.be("")
                expect(lis[2].className).to.be("")
                expect(lis[3].className).to.be("xxx")
                model.array.push(5, 6)
                setTimeout(function () {
                    var lis = div.getElementsByTagName("li")
                    expect(lis.length).to.be(6)
                    expect(lis[5].className).to.be("xxx")
                    expect(lis[4].className).to.be("")
                    expect(lis[3].className).to.be("")
                    delete avalon.vmodels["$last2"]
                    body.removeChild(div)
                    done()
                }, 50)
            }, 50)
        })
    })

    describe("iteratorCallback", function () {
        //ms-with, ms-each, ms-repeat的各种回调
        it("async", function (done) {
            var endIndex = 0
            var model = avalon.define("test" + Math.random(), function (vm) {
                vm.array = [1, 2, 3, 4]
                vm.object = {
                    a: 1,
                    b: 2,
                    c: 3
                }
                vm.sort = function () {
                    return ["b", "a", "c"]
                }
                vm.callback = function (a) {
                    expect(a).to.be("add")
                    expect(this.tagName.toLowerCase()).to.be("ul")
                    end()
                }
                vm.callback2 = function (a) {
                    expect(a).to.be("add")
                    expect(this.tagName.toLowerCase()).to.be("ol")
                    end()
                }
                vm.callback3 = function (a) {
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
            div.innerHTML = heredoc(function () {
                /*
                 <div>
                 <ul ms-each="array" data-each-rendered="callback">
                 <li>{{el}}</li>
                 </ul>
                 <ol>
                 <li ms-repeat="array" data-repeat-rendered="callback2">{{el}}</li>
                 </ol>
                 <table border="1">
                 <tr ms-with="object" data-with-sorted="sort" data-with-rendered="callback3"><td>{{$key}}:{{$val}}</td></tr>
                 </table>
                 </div>
                 */
            })
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

    describe("ms-with", function () {
        it("async", function (done) {
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
            setTimeout(function () {
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
                setTimeout(function () {
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


    describe('$remove', function () {

        it("async", function (done) {
            var model = avalon.define("$remove", function (vm) {
                vm.array = ["a", "b", "c", "d", "e", "f", "g", "h"]
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<ul><li ms-repeat=\"array\"><button type=\"button\" ms-click=\"$remove\">{{el}}</button></li></ul>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function () {
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

    describe('vm.array=newArray', function () {
        it("async", function (done) {
            var vm = avalon.define({
                $id: "overrideArray",
                array: []
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 <table>
                 <tr><td>11</td><th ms-repeat="array">{{el}}</th><td>22</td></tr>
                 </table>
                 */
            })
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                vm.array = ["aaa", "bbb", "ccc"]
                setTimeout(function () {
                    var cells = div.getElementsByTagName("tr")[0].cells
                    expect(cells[0].tagName).to.be("TD")
                    expect(cells[1].tagName).to.be("TH")
                    expect(cells[2].tagName).to.be("TH")
                    expect(cells[3].tagName).to.be("TH")
                    expect(cells[4].tagName.toLowerCase()).to.be("td")
                    clearTest(vm, div, done)
                })
            }, 100)
        })

        it("async2", function (done) {
            var vm = avalon.define({
                $id: "overrideArray2",
                array: []
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 <table>
                 <tr><td>11</td><th ms-repeat="array">{{el}}</th><td>22</td></tr>
                 <tr><th ms-repeat-xx="array">{{xx}}</th><td>111</td><td>222</td></tr>
                 </table>
                 */
            })
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                vm.array = ["aaa", "bbb", "ccc"]
                setTimeout(function () {
                    var cells = div.getElementsByTagName("tr")[0].cells
                    expect(cells[0].tagName).to.be("TD")
                    expect(cells[1].tagName).to.be("TH")
                    expect(cells[2].tagName).to.be("TH")
                    expect(cells[3].tagName).to.be("TH")
                    expect(cells[4].tagName).to.be("TD")
                    var cells = div.getElementsByTagName("tr")[1].cells
                    expect(cells[0].tagName).to.be("TH")
                    expect(cells[1].tagName).to.be("TH")
                    expect(cells[2].tagName).to.be("TH")
                    expect(cells[3].tagName).to.be("TD")
                    expect(cells[4].tagName).to.be("TD")
                    clearTest(vm, div, done)
                })
            }, 100)
        })
    })

    describe("ms-repeat", function () {
        it("async", function (done) {
            var model = avalon.define("ms-repeat", function (vm) {
                vm.object = {
                    "kkk": "vvv",
                    "kkk2": "vvv2",
                    "kkk3": "vvv3"
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<div><ul><li ms-repeat=\"object\">{{$key}}:{{$val}}</li></ul><ol ms-with=\"object\"><li>{{$key}}:{{$val}}</li></ol></div>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function () {
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
                setTimeout(function () {
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



    describe("ms-src", function () {
        //检测值的同步
        it("async", function (done) {
            var model = avalon.define("ms-src", function (vm) {
                vm.data = {
                    path: 'http://su.bdimg.com/static/superplus/img/logo_white.png'
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<div ms-controller=\"ms-src\"><img ms-src=\"data.path\"/></div>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function () {
                var el = div.getElementsByTagName("img")[0]
                expect(el.src).to.be("http://su.bdimg.com/static/superplus/img/logo_white.png")
                body.removeChild(div)
                done()
            }, 300)
        })
    })

    describe("filters.html", function () {
        //确保位置没有错乱
        it("async", function (done) {
            var model = avalon.define({
                $id: "html-filter",
                yyy: "<li >1</li><li>2</li><li>3</li><li>4</li>"
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<ul>{{yyy|html}}<li class=\"last\">last</li></ul>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function () {
                var lis = div.getElementsByTagName("li")
                expect(lis[0].className).to.be("")
                expect(lis.length).to.be(5)
                model.yyy = "<li>X</li><li>Y</li><li>Z</li><li>A</li><li>B</li><li>C</li>"
                setTimeout(function () {
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

    describe("filters.uppercase", function () {
        it("async", function (done) {
            var model = avalon.define({
                $id: "uppercase",
                aaa: "aaa"
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "{{aaa|uppercase}}"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function () {
                expect(div.innerHTML).to.be("AAA")
                delete avalon.vmodels["uppercase"]
                body.removeChild(div)
                done()
            }, 100)
        })
    })

    describe("filters.lowercase", function () {
        it("async", function (done) {
            var model = avalon.define({
                $id: "lowercase",
                aaa: "AAA"
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "{{aaa|lowercase}}"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function () {
                expect(div.innerHTML).to.be("aaa")
                delete avalon.vmodels["lowercase"]
                body.removeChild(div)
                done()
            }, 100)
        })
    })

    describe("filters.currency", function () {
        it("async", function (done) {
            var model = avalon.define({
                $id: "currency",
                aaa: 1122223
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "{{aaa|currency}}"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function () {
                expect(div.innerHTML).to.be("￥1,122,223.00")
                delete avalon.vmodels["currency"]
                body.removeChild(div)
                done()
            }, 100)
        })
        it("async", function (done) {
            var model = avalon.define({
                $id: "currency2",
                aaa: 7444442
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "{{aaa|currency('$')}}"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function () {
                expect(div.innerHTML).to.be("$7,444,442.00")
                delete avalon.vmodels["currency2"]
                body.removeChild(div)
                done()
            }, 100)
        })
    })

    describe("filters.html.2", function () {
        //详见 https://github.com/RubyLouvre/avalon/issues/598
        it("async", function (done) {
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

            setTimeout(function () {

                expect(div.innerHTML.trim().replace(/<!--[\w\:]+-->/g, "")).to.be("正确{{aaa}}——{{y}}——bbb")
                body.removeChild(div)
                done()
            }, 100)

        })
    })

    describe('ms-repeat nest-object', function () {
        //确保位置没有错乱
        it("async", function (done) {
            var model = avalon.define("nest-object", function (vm) {
                vm.list = {
                    a: {
                        str: 444
                    },
                    b: {
                        str: 666
                    }
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = "<ul ms-controller=\"nest-object\"><li ms-repeat=\"list\"><input ms-duplex=\"$val.str\"/></li></ul>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function () {
                var inputs = div.getElementsByTagName("input")
                expect(inputs[0].value).to.be("444")
                expect(inputs[1].value).to.be("666")
                delete avalon.vmodels["nest-object"]
                body.removeChild(div)
                done()
            }, 100)
        })
    })

    describe("avalon.Array", function () {
        //确保位置没有错乱
        it("sync", function () {
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

        it("async", function (done) {
            var model = avalon.define({
                $id: "array2",
                array: ["a", "b", "c", "d"]
            })
            var body = document.body
            var div = document.createElement("ul")
            div.innerHTML = "<li ms-repeat='array'>{{el}}|{{$first}}|{{$last}}|{{$index}}</li>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function () {
                var inputs = div.getElementsByTagName("li")
                expect(inputs[0].innerHTML).to.be("a|true|false|0")
                expect(inputs[1].innerHTML).to.be("b|false|false|1")
                expect(inputs[2].innerHTML).to.be("c|false|false|2")
                expect(inputs[3].innerHTML).to.be("d|false|true|3")
                model.array.push("e", "f")
                model.array.unshift("x", "y")
                setTimeout(function () {
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
                    setTimeout(function () {
                        var inputs = div.getElementsByTagName("li")
                        expect(inputs[0].innerHTML).to.be("x|true|false|0")
                        expect(inputs[1].innerHTML).to.be("y|false|false|1")
                        expect(inputs[2].innerHTML).to.be("a|false|false|2")
                        expect(inputs[3].innerHTML).to.be("b|false|false|3")
                        expect(inputs[4].innerHTML).to.be("k|false|false|4")
                        expect(inputs[5].innerHTML).to.be("e|false|false|5")
                        expect(inputs[6].innerHTML).to.be("f|false|true|6")
                        model.array.reverse()
                        setTimeout(function () {
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
                            setTimeout(function () {
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

        it("async", function (done) {
            var model = avalon.define({
                $id: "array3",
                array: [{
                        a: 7
                    }, {
                        a: 3
                    }, {
                        a: 1
                    }, {
                        a: 2
                    }, {
                        a: 6
                    }, {
                        a: 1
                    }]
            })
            var body = document.body
            var div = document.createElement("ul")
            div.innerHTML = "<li ms-repeat='array'>{{el.a}}</li>"
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function () {
                var inputs = div.getElementsByTagName("li")
                expect(inputs[0].innerHTML).to.be("7")
                expect(inputs[1].innerHTML).to.be("3")
                expect(inputs[2].innerHTML).to.be("1")
                expect(inputs[3].innerHTML).to.be("2")
                expect(inputs[4].innerHTML).to.be("6")
                expect(inputs[5].innerHTML).to.be("1")
                model.array.sort(function (a, b) {
                    return a.a - b.a
                })
                setTimeout(function () {
                    var inputs = div.getElementsByTagName("li")
                    expect(inputs[0].innerHTML).to.be("1")
                    expect(inputs[1].innerHTML).to.be("1")
                    expect(inputs[2].innerHTML).to.be("2")
                    expect(inputs[3].innerHTML).to.be("3")
                    expect(inputs[4].innerHTML).to.be("6")
                    expect(inputs[5].innerHTML).to.be("7")
                    model.array.reverse()
                    setTimeout(function () {
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

    describe("W3CFire的avalon签名", function () {
        //确保位置没有错乱
        it("async", function (done) {
            function W3CFire(el, name, detail) {
                var event = document.createEvent("Events")
                event.initEvent(name, true, true)
                event.fireByAvalon = true //签名，标记事件是由avalon触发
                //event.isTrusted = false 设置这个opera会报错
                if (detail)
                    event.detail = detail
                el.dispatchEvent(event)
            }
            var body = document.body
            var div = document.createElement("div")
            body.appendChild(div)
            if (div.addEventListener) {
                div.addEventListener("click", function (e) {
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

    describe("循环绑定中的事件绑定", function () {
        //确保位置没有错乱
        it("async", function (done) {
            var test = false
            var vm = avalon.define({
                $id: "repeaton",
                arr: [1],
                f1: function () {
                    test = true
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<div ms-controller="repeaton"><div ms-each="arr">' +
                    '<button ms-click="f1" type="button">测试</button></div>{{arr|html}}</div>'
            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var button = div.getElementsByTagName("button")[0]
                button.click()
                setTimeout(function () {
                    expect(test).to.be(true)
                    clearTest(vm, div, done)
                }, 300)
            }, 100)
        })
    })
    describe("ms-repeat-clear", function () {
        //https://github.com/RubyLouvre/avalon/issues/512
        it("async", function (done) {
            var model = avalon.define({
                $id: "repeatclear",
                arr: [],
                f1: function () {
                    model.arr = [1, 2]
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = '<div ms-controller="repeatclear"><p ms-each="arr">123</p></div>'
            body.appendChild(div)
            avalon.scan(div, model)
            setTimeout(function () {
                model.f1()
                setTimeout(function () {
                    model.f1()
                    setTimeout(function () {
                        model.f1()
                        setTimeout(function () {
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

    describe("select标签里使用ms-duplex并且option是用ms-repeat生成", function () {
        it("async", function (done) {
            var vm = avalon.define({
                $id: 'ms-duplex-select',
                selected: ["a", "b"],
                array: ["a", "b", "c", "d"]
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 <select ms-duplex="selected" multiple><option ms-repeat="array">{{el}}</option></select>
                 */
            })

            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var options = div.getElementsByTagName("option")
                expect(options[0].selected).to.be(true)
                expect(options[1].selected).to.be(true)
                expect(options[2].selected).to.be(false)
                expect(options[3].selected).to.be(false)
                vm.array = ["d", "k", "a", "b"]
                setTimeout(function () {
                    var options = div.getElementsByTagName("option")
                    expect(options[0].selected).to.be(false)
                    expect(options[1].selected).to.be(false)
                    expect(options[2].selected).to.be(true)
                    expect(options[3].selected).to.be(true)
                    clearTest(vm, div, done)

                }, 400)
            }, 500)
        })
    })
    describe("对空对象进行替换后,再修改新属性不生效", function () {
        it("async", function (done) {
            var vm = avalon.define({
                $id: "test",
                obj: {}
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 <h1>{{obj.aaa}}</h1>
                 */
            })

            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                vm.obj = {
                    aaa: 222
                }
                setTimeout(function () {
                    vm.obj.aaa = 444
                    setTimeout(function () {
                        var h1 = div.getElementsByTagName("h1")[0]
                        expect(h1.innerHTML).to.be("444")
                        clearTest(vm, div, done)
                    }, 200)
                }, 100)
            }, 300)

        })
    })
    describe("重置一个监控数组时,ms-duplex的错误没有被吞掉", function () {
        it("async", function (done) {
            var vm = avalon.define({
                $id: "test",
                nums: [{num: 1}, {num: 2}, {num: 3}],
                ids: [{id: "a"}, {id: "b"}, {id: "c"}],
                totalNum: {
                    get: function () {
                        var num = 0;
                        for (var i = 0; i < this.nums.length; i++) {
                            num += this.nums[i].num;
                        }
                        return num;
                    }
                },
                changeArray: function () {
                    vm.ids = [{id: "x"}, {id: "y"}, {id: "z"}];
                }
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 <p ms-repeat-item="nums"><input type="text" ms-duplex="ids[$index].id" /></p>
                 <p>{{totalNum}}</p>
                 */
            })

            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var s = div.getElementsByTagName("p")
                expect(s.length).to.be(4)
                var i = div.getElementsByTagName("input")
                expect(i[0].value).to.be("a")
                expect(i[1].value).to.be("b")
                expect(i[2].value).to.be("c")
                vm.changeArray()
                setTimeout(function () {
                    var i = div.getElementsByTagName("input")
                    expect(i[0].value).to.be("x")
                    expect(i[1].value).to.be("y")
                    expect(i[2].value).to.be("z")
                    expect(s[3].innerHTML).to.be("6")
                    clearTest(vm, div, done)
                }, 300)

            }, 300)

        })
    })


    describe("removeAll处理重复元素的数组", function () {
        it("async", function (done) {
            var vm = avalon.define({
                $id: "test",
                array: ["c", "r", "c", "c", "m", "c", "c", "v", "b"]
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 <div ms-repeat="array">{{el}}</div>
                 */
            })

            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () {
                var s = div.getElementsByTagName("div")
                expect(s.length).to.be(9)
                vm.array.removeAll(["c"])
                setTimeout(function () {
                    var s = div.getElementsByTagName("div")
                    expect(s.length).to.be(4)
                    expect(s[0].innerHTML).to.be("r")
                    expect(s[1].innerHTML).to.be("m")
                    expect(s[2].innerHTML).to.be("v")
                    expect(s[3].innerHTML).to.be("b")
                    clearTest(vm, div, done)
                }, 300)

            }, 300)

        })
    })
    describe("1.4.5 html过滤正则BUG", function () {
        it("async", function (done) {
            avalon.filters.html2 = function (str) {
                if (!str) {
                    return '';
                }
                return str.replace(/\n/g, '<br/>');
            }
            var vm = avalon.define({
                $id: "test",
                a: "sss\ndddd"
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 {{a|html2|html}}
                 */
            })

            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () { //第一次变换值，没问题
                var n = div.getElementsByTagName("br").length
                expect(n).to.be(1)
                clearTest(vm, div, done)
            }, 300);
        })
    })
    describe("1.4.5 对 对象进行增删重排 ", function () {
        it("async", function (done) {
            var vm = avalon.define({
                $id: "test",
                object: {
                    a: 1,
                    b: 1,
                    c: 1,
                    d: 1
                },
                text: "初始状态"
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 <p>{{text}}实验</p>
                 <ul>
                 <li ms-repeat="object">{{$key}}:<strong>{{$val}}</strong></li>
                 </ul>
                 <ol ms-with="object">
                 <li>{{$key}}:<strong>{{$val}}</strong></li>
                 </ol>
                 */
            })
            body.appendChild(div)
            avalon.scan(div, vm)
            var text = div.innerText ? "innerText" : "textContent"
            setTimeout(function () { //第一次变换值，没问题
                var lis = div.getElementsByTagName("li")
                expect(lis.length).to.be(8)
                expect(lis[0][text]).to.be("a:1")
                expect(lis[1][text]).to.be("b:1")
                expect(lis[2][text]).to.be("c:1")
                expect(lis[3][text]).to.be("d:1")
                expect(lis[4][text]).to.be("a:1")
                expect(lis[5][text]).to.be("b:1")
                expect(lis[6][text]).to.be("c:1")
                expect(lis[7][text]).to.be("d:1")
                vm.text = "修改"
                vm.object = {
                    a: 2,
                    b: 2,
                    c: 2,
                    d: 2
                }
                setTimeout(function () { //第一次变换值，没问题
                    var lis = div.getElementsByTagName("li")
                    expect(lis.length).to.be(8)
                    expect(lis[0][text]).to.be("a:2")
                    expect(lis[1][text]).to.be("b:2")
                    expect(lis[2][text]).to.be("c:2")
                    expect(lis[3][text]).to.be("d:2")
                    expect(lis[4][text]).to.be("a:2")
                    expect(lis[5][text]).to.be("b:2")
                    expect(lis[6][text]).to.be("c:2")
                    expect(lis[7][text]).to.be("d:2")
                    vm.text = "移除"
                    vm.object = {
                        a: 3,
                        b: 3
                    }
                    setTimeout(function () { //第一次变换值，没问题
                        var lis = div.getElementsByTagName("li")
                        expect(lis.length).to.be(4)
                        expect(lis[0][text]).to.be("a:3")
                        expect(lis[1][text]).to.be("b:3")
                        expect(lis[2][text]).to.be("a:3")
                        expect(lis[3][text]).to.be("b:3")
                        vm.text = "添加"
                        vm.object = {
                            a: 3,
                            b: 3,
                            f: 4,
                            g: 4
                        }
                        setTimeout(function () { //第一次变换值，没问题
                            var lis = div.getElementsByTagName("li")
                            expect(lis.length).to.be(8)
                            expect(lis[0][text]).to.be("a:3")
                            expect(lis[1][text]).to.be("b:3")
                            expect(lis[2][text]).to.be("f:4")
                            expect(lis[3][text]).to.be("g:4")
                            expect(lis[4][text]).to.be("a:3")
                            expect(lis[5][text]).to.be("b:3")
                            expect(lis[6][text]).to.be("f:4")
                            expect(lis[7][text]).to.be("g:4")
                            vm.text = "排序"
                            vm.object = {
                                g: 4,
                                f: 4,
                                b: 3,
                                a: 3
                            }
                            setTimeout(function () { //第一次变换值，没问题
                                var lis = div.getElementsByTagName("li")
                                expect(lis.length).to.be(8)
                                expect(lis[0][text]).to.be("g:4")
                                expect(lis[1][text]).to.be("f:4")
                                expect(lis[2][text]).to.be("b:3")
                                expect(lis[3][text]).to.be("a:3")
                                expect(lis[4][text]).to.be("g:4")
                                expect(lis[5][text]).to.be("f:4")
                                expect(lis[6][text]).to.be("b:3")
                                expect(lis[7][text]).to.be("a:3")
                                clearTest(vm, div, done)
                            }, 300);
                        }, 300);
                    }, 300);
                }, 300);
            }, 300);
        })
    })
    describe("1.4.4 ms-with, ms-repeat对对象不断重复赋值时，元素节点与当前对象的键值对个数不符", function () {
        it("async", function (done) {
            var vm = avalon.define({
                $id: "test",
                data: {a: 1, b: 2, c: 3}
            })
            var body = document.body
            var div = document.createElement("div")
            div.innerHTML = heredoc(function () {
                /*
                 <ul>
                 <li ms-repeat="data" ms-text="$val"></li>
                 </ul>
                 */
            })

            body.appendChild(div)
            avalon.scan(div, vm)
            setTimeout(function () { //第一次变换值，没问题
                vm.data = {a: 4, b: 5, c: 6}
            }, 300);
            setTimeout(function () {//第二次变换值，上一次ms-repeat循环出来的4,5,6还在，li的数量变成了6个
                vm.data = {a: 7, b: 8, c: 9}
            }, 600);
            setTimeout(function () {//第三次变换值，也有同样的问题
                vm.data = {a: 10, b: 11, c: 12}
            }, 900);
            setTimeout(function () {//第三次变换值，也有同样的问题
                var lis = div.getElementsByTagName("li")
                expect(lis.length).to.be(3)
                clearTest(vm, div, done)
            }, 1100);
        })
    })

})

/**
 * 
 <div ms-with="object"><strong 
 ms-if-loop="$val>2">{{$key}}-{{$val}} </strong></div>
 
 <button ms-click="change">change</button>
 
 var vm = avalon.define({
 $id: 'test',
 array: [1, 2, 3, 4, 5],
 depth: [
 [1, 2, 3],
 ["a", "b", "c"]
 ],
 object: {
 a: 1,
 b: 2,
 c: 3,
 d: 4,
 e: 5
 },
 
 over: function() {
 console.log(arguments)
 },
 
 change: function() {
 var randomNum = Math.random()
 
 vm.array = [1 + randomNum, 2 + randomNum, 3 + randomNum, 4 + randomNum, 5 + randomNum]
 vm.object.a = vm.array[0]
 vm.object.b = vm.array[1]
 vm.object.c = vm.array[2]
 vm.object.d = vm.array[3]
 vm.object.e = vm.array[4]
 }
 })
 * 
 * 
 */