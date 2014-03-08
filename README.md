avalon.test
===========

专门用于放置<a href="https://github.com/RubyLouvre/avalon">avalon</a>的单元测试


<h3>第一步，安装node.js相关包</h3>

<p>打开一个控制台</p>
 
<p>输入npm install -g totoro</p>
<p>输入npm install -g totoro-server</p>
<p>输入totoro-server</p>
<p>这时会看到</p>
<pre class="brush:js;gutter:false;">
info 2014-03-03 14:03:58 index.js:66 | Start server <192.168.114.27:9999>
</pre>
<p>的字样,后面是IP地址与端口号</p>

<h3>第二步，配置要测试的浏览器</h3>

<p>打开你的firefox27 输入地址 http://192.168.114.27:9999/</p>
<p>打开你的IE10 输入地址 http://192.168.114.27:9999/</p>
<p>打开你的chrome33 输入地址 http://192.168.114.27:9999/</p>

<p>如果你有更多要测试的浏览器，也请继续打开它们。注意你要设法让它们能弹窗</p>
<p><b>firefox</b> 工具--> 选项 -->内容--> 阻止弹出窗口 -->例外 --> 填入IP（192.168.114.27）</p>
<p><b>chrome</b> 设置-->在展开的区域中找到 隐私设置 --> 内容设置 -->弹出式窗口--> 管理例外情况--> 填入IP（192.168.114.27）</p>
<p><b>IE</b> Internet选项--> 隐私 -->启用窗口阻止程序。如果没有勾上就作罢，否则点设置，添加要允许的网站地址(http://192.168.114.27:9999/)</p>

<p>打开另一个控制台</p>
<p>输入 totoro config --host=192.168.114.27 --port=9999</p>
<p>再输入 totoro list</p>
<p>这时就会看到</p>
<pre class="brush:js;gutter:false;">

 Desktop:
   chrome 33.0.1750.117 / windows 7 [1]
   firefox 27.0 / windows 7 [1]
   ie 10.0 / windows 7 [1]
……
</pre>
<p>说明配置成功</p>
<h3>第三步，运行测试文件</h3>
<pre class="brush:js;gutter:false;">
git clone git@github.com:RubyLouvre/avalon.test.git
cd avalon.test
totoro
</pre>
<p>会依次弹出三个窗口（或更多），成功会输出如下内容：</p>
<p><img src="https://raw.github.com/RubyLouvre/avalon.test/master/step.jpg"/></p>

<p>在src中拥有两个库,分别是<a href="https://github.com/visionmedia/mocha/releases">mocha</a>,
<a href="https://github.com/LearnBoost/expect.js/blob/master/index.js">expect</a>,大家可以到它们的官网看介绍.</p>

<p>至于如何编写测试,请看以下链接</p>
<p><a href="http://www.alloyteam.com/2013/12/hour-class-learning-costs-javascript-unit-testing-tool-matcha-mocha-and-chai/">Javascript单元测试工具“抹茶”——Mocha 和 Chai </a></p>
<p><a href="http://cnodejs.org/topic/516526766d38277306c7d277">初识 mocha in NodeJS</a></p>