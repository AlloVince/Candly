/*
 * EvaFinanceChart Manager
 *
 * 角色划分：
 * - ChartObj ： 图表对象，一个ChartObj对应一个Dom + 一个Evafinancechart 
 *               可能多个ChartObj对应一个DataObj
 *               可能多个ChartObj对应一个Comet
 * - DataObj ： 数据对象，一个数据对象由三个条件限定
 *              1. 数据类型 如 EURUSD
 *              2. 数据频率 如 1 （代表1分钟图）
 *              3. 数据数量 如 50 代表数据对象中有50条数据
 *              TODO : 以后会有条件4：数据起始结束日期
 *              上述三个条件生成唯一的数据key ： EURUSD_1_50
 * - DataPool : 数据池，所有的数据对象在加载后都会存入数据池，可以供ChartObj复用
 *              数据池提供定时更新机制
 * - ChartPool : 图表池，所有的图表对象在实例化后会存入图表池，当数据池更新后，图表池也会跟随更新
 * - CometObj : 实时数据对象，一些数据的展示
 * - CometPool ： 实时数据池，实时数据会通过Long Polling方式更新到实时数据池
 *                数据更新后会刷新图表池
 *
 *  事件机制
 *  chartadded : 添加一个chartobj
 *  chartchange : 更改一个chartobj参数
 *  chartupdated : 更新一个chartobj（数据载入后）
 *  chartcollected : 所有chartobj添加完毕
 *  datainsert : 插入一个dataObj 
 *  startload : 数据开始加载
 *  startrefresh : 数据开始刷新
 *  dataloaded : 数据加载完成后触发
 *  chartcreated : 图表绘制完成后触发
 *  datarefreshed : 数据更新后触发
 *  cometadded : 添加一个cometObj
 *  cometcollected : 所有cometObj添加完毕
 *  cometed : long polling 完成后触发
 *  pricechange : long polling 导致实时数据变化后触发
 *
 * 运行流程
 * 1. 分析页面所有Dom， 通过 collectChartObj将所有相关Dom转化为ChartObj，并放入ChartPool
 * addChartObj
 * removeChartObj
 * getChartObj(dom)
 * 2. 分析所有ChartObj，生成DataObj，DataObj放入DataPool，触发dataloaded事件
 * chartObjToDataObj(chartObj)
 * addDataObj
 * removeDataObj
 * getDataObj(datakey or dom)
 * 3. Dataloaded事件触发后，找到该dataObj所对应的所有ChartObj，绘制图形，触发Chartcreated事件
 * 4. chartcreated事件触发后，搜索所有cometobj，根据cometobj情况绘制currentline / 
 *
 * 与上述并行
 * 1. 分析页面所有Dom， collectCometObj() 整理所有的cometObj
 * 2. 发起Comet请求, 每次请求会触发cometed事件
 * addCometObj(dom)
 * removeCometObj(dom)
 * 3. cometed事件触发后，找到所有cometobj，更新实时数据
 * 4. cometed事件触发后，找到所有chartobj，更新图形
 *
 * DataPool有自动回收机制，页面不活跃的DataObj都会被自动回收 （）
 *
 * 可能的业务场景：
 * ### 点击top slider，动态绘制EFC
 * 1. updateChartObj() ->  change data- attrs -> addChartObj(dom)
 * 2. 
 *
 * ### 点击侧栏tab
 * 1. addChartObj()
 * 2. addCometObj()
 *
 * ### Ajax切换频道
 *
 *
 *
 * author : AlloVince
 * project page : https://github.com/AlloVince/EvaFinanceChart
 * license : MIT
 */
(function () {
    'use strict';

    var debug = true;
    //Debug shortcut
    function p(){
        //console.log(debug);
        if(typeof console === 'undefined') {
            return false;
        }
        console.log.apply(console, arguments);
    }

        
    /************************************
        Constants
    ************************************/

    var efcmanager = {}
        , VERSION = '1.0.0'
        , defaultOptions = {
            efcSelector : '.efc',
            cometSelector : '*[data-comet]',
            dataType : 'json',
            events : {},
            chartEnable : true,
            cometEnable : true,
            cometType : 'polling',  //or comet
            cometInterval : 2000,      //default polling interval
            dateFormat : 'L HH:mm',
            chartUrl : '/data.php',
            cometUrl : '/comet.php'
        }
        , defaultDataObj = {
              uriObj : null,
              lastupdate : null,
              //symbol : null,
              //interval : null,
              //rows : null,
              refreshInterval : null,
              refresh : false,
              refreshHandler : null,
              data : [] 
        }
        , dataPool = {}
        , defaultChartObj = {
            container : null,
            efc : null,
            symbol : null,
            //type : 'candle',
            interval : 5,
            rows : 50,
            //prevclose : null,
            shiftFlag : false,
            isReady : false,
            refresh : false
        }
        , chartPool = []
        , defaultCometObj = {
            container : null,
            symbol : null
        }
        , cometPool = []
        , lastCometData = [] 
        , cometData = []
        , cometRequestHandler = null
        , cometTimeoutHandler = null
        , cometTimestamp = null
        , cometLastPrice = null
        , cometProcess = 0
        , maxCometProcess = 1
        , windowLoad = false
        , options = {}
        , efcAttrs = ['symbol', 'interval', 'rows', 'refresh']
        , hasModule = (typeof module !== 'undefined' && module.exports);


    /************************************
        Constructors
    ************************************/
    function EfcManager(inputOptions) {
        options = $.extend({}, defaultOptions, inputOptions);

        debug = options.debug;

        initEvent(this);
        this.collectChartObj();
        this.collectCometObj();
    }

    function initEvent(root) {
        var events = $.extend(defautEvents, options.events),
            key = 0;
        for(key in events) {
            root.on(key, events[key]);
        }
    }



    /************************************
        Top Level Functions
    ************************************/
    efcmanager = function (options, ui) {
        return new EfcManager(options, ui);
    };

    // version number
    efcmanager.version = VERSION;


    /************************************
        EvaFinanceChart Prototype
    ************************************/
    efcmanager.fn = EfcManager.prototype = {
        loadData : function(dataObj) {
            var root = this;
            $.ajax({
                url : dataObj.uriObj.toString(),
                dataType : options.dataType,
                error : function(response) {
                    p('dataload error %o', response);
                },
                success : function(response){
                    dataObj.data = response.results;
                    dataObj.lastupdate = new Date().getTime();
                    root.trigger('dataloaded', [dataObj]);
                }
            });
        }

        , refreshData : function(dataObj) {
            var root = this;
            $.ajax({
                url : dataObj.uriObj.toString(),
                dataType : options.dataType,
                error : function(response) {
                    p('dataload error %o', response);
                },
                success : function(response){
                    dataObj.data = response.results;
                    dataObj.lastupdate = new Date().getTime();
                    root.trigger('datarefreshed', [dataObj]);
                }
            });        
        }

        , getChartPool : function() {
            return chartPool;
        }

        , getDataPool : function() {
            return dataPool;
        }

        , getCometPool : function() {
            return cometPool;
        }

        , getDatakey : function(symbol, interval, rows) {
            return symbol + '_' + interval + '_' + rows;
        }

        , collectChartObj : function() {

            var root = this;

            $(options.efcSelector).each(function() {
                root.addChartObj(this);
            });

            this.trigger('chartcollected');

            return this;
        }

        , collectCometObj : function() {
            var root = this;
            $(options.cometSelector).each(function() {
                root.addCometObj(this);
            });
            this.trigger('cometcollected');
            return this;
        }

        , addChartObj : function(selectorOrDom) {
            var container = $(selectorOrDom),
                i,
                attrs = {},
                chartObj = {},
                efcOptions = {};

            for(i in chartPool) {
                //chartObj already added
                if(chartPool[i].container && chartPool[i].container[0] === container[0]) {
                    return this;
                }
            }

            for(i in efcAttrs) {
                attrs[efcAttrs[i]] = container.attr('data-efc-' + efcAttrs[i]);
            }

            chartObj = $.extend({}, defaultChartObj, attrs);
            chartObj.container = container;

            if(!chartObj.symbol || !chartObj.interval || !chartObj.rows) {
                p("chartObj params not complete %o", chartObj);
                return this;
            }

            efcOptions = {
                container : container,
                width : container.width(),
                height : container.height()
            };
            if(container.attr('data-efc-options')) {
                efcOptions = $.extend(efcOptions, $.parseJSON(container.attr('data-efc-options')))
            }
            chartObj.efc = new EvaFinanceChart(efcOptions);

            chartPool.push(chartObj);

            //p("chartObj added : %o", chartObj);

            this.trigger('chartadded', [chartObj]);

            return this;
        }

        , changeChartObj : function(selectorOrDom, attrs, options) {
            var chartChanger = $(selectorOrDom),
                container = $(chartChanger.attr('data-efc-target')),
                chartObj = this.getChartObj(container),
                symbol = chartChanger.attr('data-efc-symbol') || chartObj.symbol,
                interval = chartChanger.attr('data-efc-interval') || chartObj.interval,
                rows = chartChanger.attr('data^efc-rows') || chartObj.rows;

            chartObj.symbol = symbol;
            chartObj.interval = interval;
            chartObj.rows = rows;
            chartObj.shiftFlag = false;


            this.trigger('chartchange', [chartObj]);
        }

        , chartObjGC : function() {
            var i = 0,
                page = $('body');

            p("Before GC chartPool length : %s", chartPool.length);
            for(i in chartPool) {
                if(chartPool[i].container && !page.has(chartPool[i].container[0]).length) {
                    p("GC : %o", chartPool[i].container[0]);
                    chartPool.splice(i, 1);
                }
            }
            p("After GC chartPool length : %s", chartPool.length);
            
        }

        , removeChartObj : function() {
        
        }

        , getChartObj : function(selectorOrDom) {
            var container = $(selectorOrDom),
                i = 0;
            for(i in chartPool) {
                if(chartPool[i].container && container[0] === chartPool[i].container[0]) {
                    return chartPool[i];
                }
            }

            return false;
        }

        , addDataObj : function(chartObj) {
            var datakey = this.getDatakey(chartObj.symbol, chartObj.interval, chartObj.rows);
            if(typeof dataPool[datakey] !== 'undefined') {
                return this;
            }

            var dataObj = $.extend({}, defaultDataObj, {
                datakey : datakey,
                refresh : chartObj.refresh
            });

            dataObj.uriObj = new Uri(options.chartUrl)
                .addQueryParam('symbol', chartObj.symbol)
                .addQueryParam('interval', chartObj.interval)
                .addQueryParam('rows', chartObj.rows);

            switch(chartObj.interval) {
                case '1' : 
                    dataObj.refreshInterval = 60000;
                    break;
                case '5' :
                    dataObj.refreshInterval = 300000;
                    break;
                case '15' :
                    dataObj.refreshInterval = 15 * 60 * 1000;
                    break;
                default : 
                    dataObj.refresh = false;
            }

            dataPool[datakey] = dataObj;

            this.trigger('datainsert', [dataObj, chartObj]);
            return this;
        }

        , removeDataObj : function() {
        
        }

        , getDataObj : function(chartObjOrDatakey) {
            if(typeof chartObjOrDatakey === 'object') {
                var datakey = this.getDatakey(chartObjOrDatakey.symbol, chartObjOrDatakey.interval, chartObjOrDatakey.rows);
                if(typeof dataPool[datakey] === 'undefined') {
                    return false;
                }
                return dataPool[datakey];
            
            } else {
                if(typeof dataPool[chartObjOrDatakey] === 'undefined') {
                    return false;
                }
                return dataPool[chartObjOrDatakey];
            }
        
        }

        , searchConnectedCharts : function(datakey) {
            var i,
                symbol,
                interval, 
                rows,
                charts = [],
                chartObj = {};

                datakey = datakey.split('_');
                symbol = datakey[0];
                interval = datakey[1];
                rows = datakey[2];
            for(i in chartPool) {
                chartObj = chartPool[i];
                if(chartObj.symbol == symbol && chartObj.interval == interval && chartObj.rows == rows) {
                    charts.push(chartObj);
                }
            
            }

            return charts;
        }

        , addCometObj : function(selectorOrDom) {
            var container = $(selectorOrDom),
                cometObj = {},
                i;

            if(!container[0] || !container.attr('data-comet')) {
                return this;
            }
            
            for(i in cometPool) {
                //chartObj already added
                if(cometPool[i].container && cometPool[i].container[0] === container[0]) {
                    return this;
                }
            }

            cometObj = $.extend({}, defaultCometObj, {
                container : container,
                symbol : container.attr('data-comet')
            });

            cometPool.push(cometObj);

            this.trigger('cometadded', [cometObj]);

            return this;
        }


        , comet : function() {
            //comet already started
            if(cometProcess >= maxCometProcess) {
                return this;
            }
            cometProcess++;

            var root = this,
                symbols = [],
                symbolString,
                i;

            for(i in cometPool) {
                symbols.push(cometPool[i].symbol);
            }
            symbols = _.uniq(symbols);
            symbolString = symbols.join('_');
            p('comet strings : %s', symbolString);

            cometRequestHandler = $.ajax({
                url : options.cometUrl,
                dataType : options.dataType, 
                data : {
                    symbol : symbolString,
                    timestamp : cometTimestamp,
                    price : cometLastPrice
                },
                success : function(response) {
                    lastCometData = cometData.slice(0);
                    cometData = response.results.slice(0);
                    cometTimestamp = response.timestamp;
                    root.trigger('cometed');
                    cometProcess--;

                    if(options.cometType == 'comet') {
                        root.comet();
                    } else {
                        cometTimeoutHandler = setTimeout(function(){
                            root.comet();
                        }, options.cometInterval);
                    }
                }    
            });
        
            return cometRequestHandler;
        }

        , stopComet : function() {
            cometRequestHandler.abort();
            cometRequestHandler = null;
            cometProcess = 0;        
        }

        , cometObjGC : function() {
        }

        , reboot : function() {
            this.distroy();
            this.collectChartObj();
            this.collectCometObj();
            return this;
        }

        , distroy : function() {
            var i = 0;
            chartPool = [];
            cometPool = [];
            for(i in dataPool) {
                clearInterval(dataPool[i].refreshHandler);
            }
            dataPool = [];
            this.stopComet();
        }

        , clearChartPool : function() {
            chartPool = [];
            return this;
        }

        , trigger : function(eventName, params) {
            $(document).trigger(eventName, params);
            return this;
        }

        , on : function(eventName, callback) {
            $(document).on(eventName, $.proxy(callback, this));
            return this;
        }

        , off : function(eventName) {
            $(document).off(eventName);
            return this;
        }
    }


    function updateDigital(cometObj, price, lastPrice) {
        var container = cometObj.container,
            prevclose = container.find('.prevclose').val(),
            prevclose = prevclose > 0 ? prevclose : price,
            numLength = prevclose.toString().length,
            maxDecimalLength = numLength - Math.floor(prevclose).toString().length,
            numeralFormat = maxDecimalLength > 0 ? '0[.]' + Array(maxDecimalLength).join('0') : '0',
            priceDiff = numeral(price - prevclose).format(numeralFormat);
            
        var priceDiffPercent = priceDiff / prevclose;
            priceDiffPercent = priceDiffPercent < 0.0001 ? 0.0001 : priceDiffPercent;
            priceDiffPercent = numeral(priceDiffPercent).format('0[.]00%');

        if(priceDiff > 0) {
            container.removeClass('up down').addClass('up');   
            container.find('.price-icon').removeClass('icon-arrow-right icon-arrow-up icon-arrow-down').addClass('icon-arrow-up');
        } else {
            container.removeClass('up down').addClass('down');   
            container.find('.price-icon').removeClass('icon-arrow-right icon-arrow-up icon-arrow-down').addClass('icon-arrow-down');
        }
        container.find('.price-current').html(price);
        //container.find('.price-current').html(price).textillate({ in: { effect: 'rotateInUpLeft' } });
        container.find('.price-diff').html(priceDiff);
        container.find('.price-diff-percent').html(priceDiffPercent);
        container.find('.lastupdate').html(moment(cometTimestamp * 1000).format(options.dateFormat));
    }


    function updateChart(chartObj, price, lastPrice) {
        if(chartObj.isReady === false) {
            return false;
        }

        p("Update chart shiftFlag : %s, price:%s", chartObj.shiftFlag, price);

        if(chartObj.shiftFlag === false) {
            chartObj.efc.setCurrent(price);
            chartObj.efc.drawCurrentLine();
            chartObj.efc.shiftData(price);
            chartObj.efc.updateChart();
            chartObj.efc.updateCurrentLine();
            chartObj.shiftFlag = true;
        } else {
            chartObj.efc.setLastPrice(price);
            chartObj.efc.updateChart();
            chartObj.efc.updateCurrentLine();
        }

    }

    var defautEvents = {
        'chartadded' : function(event, chartObj) {
            this.addDataObj(chartObj);
        },

        'chartchange' : function(event, chartObj) {
            var dataObj = this.getDataObj(chartObj);
            if(!dataObj) {
                return this.addDataObj(chartObj);
            }
            chartObj.efc.setData(dataObj.data);
            chartObj.efc.updateChart();
            chartObj.efc.updateCurrentLine();
            this.trigger('chartupdated', [chartObj]);
        },
        
        'chartcollected' : function(event) {
            this.chartObjGC();
        },

        'startload' : function() {
        },

        'datainsert' : function(event, dataObj) {
            var root = this;

            //data already loaded
            if(dataObj.data.length > 0) {
                return false;
            }

            root.loadData(dataObj);
        },

        'dataloaded' : function(event, dataObj) {
            //p("data loaded %o", dataObj);
            var root = this,
                i,
                charts = root.searchConnectedCharts(dataObj.datakey),
                chartObj = {};
            for(i in charts) {
                if(!chartObj.isReady) {
                    chartObj = charts[i];
                    chartObj.efc.setData(dataObj.data);
                    chartObj.efc.drawChart();
                    chartObj.isReady = true;
                    root.trigger('chartcreated', [chartObj]);                
                } else {
                    chartObj.efc.setData(dataObj.data);
                    chartObj.efc.updateChart();
                    chartObj.efc.updateCurrentLine();
                    root.trigger('chartupdated', [chartObj]);                
                }

            }

            if(dataObj.refresh) {
                dataObj.refreshHandler = setInterval(function(){
                    root.refreshData(dataObj);
                    root.trigger('startrefresh', dataObj);
                }, dataObj.refreshInterval);
            }

        },

        'cometadded' : function(event, cometObj) {
        },

        'cometcollected' : function(event) {
            var self = this;
            if(windowLoad) {
                self.comet();
            } else {
                //to void jsonp comet make browser always show loading status
                $(window).load(function(){
                    windowLoad = true;
                    setTimeout(function(){
                        self.comet();
                    }, 100);            
                });            
            }
        },

        'cometed' : function(event) {
            //p('cometed triggered');
            //p("cometed data : %o", cometData);
            //p("last comet data : %o", lastCometData);

            var i, 
                symbol,
                symbols = {},
                backup = {},
                root = this;

            for(i in cometData) {
                symbols[cometData[i].symbol] = cometData[i].price;
            }

            if(lastCometData.length < 1) {
                for(symbol in symbols) {
                    root.trigger('pricechanged', [symbol, symbols[symbol], false]);
                }
                return false;
            }

            for(i in lastCometData) {
                backup[lastCometData[i].symbol] = lastCometData[i].price;
            }
            
            for(symbol in symbols) {
                //new symbol in comet
                if(typeof backup[symbol] === 'undefined') {
                    this.trigger('pricechanged', [symbol, symbols[symbol], false]);
                } else if(symbols[symbol] !== backup[symbol]) {
                    this.trigger('pricechanged', [symbol, symbols[symbol], backup[symbol]]);
                }
            }

        },

        'pricechanged' : function(event, symbol, price, lastPrice) {
            p('pricechanged triggered %s, price : %s, lastPrice : %s', symbol, price, lastPrice);

            var root = this,
                i,
                chartObj = {},
                cometObj = {};

            for(i in cometPool) {
                cometObj = cometPool[i];
                if(cometObj.symbol == symbol) {
                    updateDigital(cometObj, price, lastPrice);
                }
            }

            for(i in chartPool) {
                chartObj = chartPool[i];
                if(chartObj.symbol == symbol) {
                    updateChart(chartObj, price, lastPrice);
                }
            }
        },

        'chartcreated' : function(event, chartObj) {
            //update current line when chart created first time
            if(chartObj.shiftFlag === true) {
                return false;
            }

            if(cometData.length < 1) {
                return false;
            }

            var i,
                symbol = chartObj.symbol;
            for(i in cometData) {
                if(symbol == cometData[i].symbol) {
                    updateChart(chartObj, cometData[i].price, false);
                }
            }
        },

        'startrefresh' : function(event, dataObj) {
        
        },

        'datarefreshed' : function(event, dataObj) {
            p("datarefreshed triggered %o", dataObj);

            var root = this,
                i,
                charts = root.searchConnectedCharts(dataObj.datakey),
                chartObj = {};
            //TODO: not chartObj here will recollect memory
            for(i in charts) {
                chartObj = charts[i];
                chartObj.efc.setData(dataObj.data);
                chartObj.efc.updateChart();
                root.trigger('chartrefreshed', [chartObj]);
            }
        }
    }


    // CommonJS module is defined
    if (hasModule) {
        module.exports = efcmanager;
    }

    /*global ender:false */
    if (typeof ender === 'undefined') {
        // here, `this` means `window` in the browser, or `global` on the server
        // add `efc` as a global object via a string identifier,
        // for Closure Compiler 'advanced' mode
        this['EfcManager'] = efcmanager;
    }

    /*global define:false */
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return efcmanager;
        });
    }
}).call(this);
