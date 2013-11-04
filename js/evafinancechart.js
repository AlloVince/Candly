/*!
 * EvaFinanceChart (EFC)
 * A data driven finance chart component based on d3.js
 * author : AlloVince
 * project page : https://github.com/AlloVince/EvaFinanceChart
 * license : MIT
 */
(function () {
    'use strict';

    //Debug shortcut
    function p(a){
        if(typeof console === 'undefined') {
            return false;
        }
        console.log(a);
    }
        
    /************************************
        Constants
    ************************************/

    var efc = {}
        , VERSION = '1.0.0'
        , defaultOptions = {
            container : null,
            timezoneOffset : 0,
            width : 0,
            height : 0,
            marginLeft : 3,
            marginRight: 50,
            marginTop : 6,
            marginBottom : 12,

            //x axis
            xAxisStroke : '#CCC',
            xAxisShapeRendering : 'crispEdges',
            xAxisFill : 'none',
            xAxisTicks : 5,
            xAxisTickSize : 0,
            xAxisOrient : 'bottom',
            xAxisLabelSize : 12,
            xAxisLabelColor : '#666',
            dateFormatHour : 'HH:mm',
            dateFormatDay : 'MM/DD',
            dateFormatYear : 'YYYY',

            //y axis
            yAxisStroke : '#CCC',
            yAxisShapeRendering : 'crispEdges',
            yAxisFill : 'none',
            yAxisTicks : 5,
            yAxisTickSize : 0,
            yAxisOrient : 'right',
            xGridStroke : '#EEE',
            xGridShapeRendering : 'crispEdges',
            xGridFill : 'none',
            xGridTicks : 5,
            yGridStroke : '#EEE',
            yGridShapeRendering : 'crispEdges',
            yGridFill : 'none',
            yGridTicks : 5,
            yAxisLabelSize : 12,
            yAxisLabelColor : '#333',

            //area chart
            areaFillEnable : true,
            //areaFillColor : '#FFCCB8',
            areaFillColor : '#E3F4FF',
            areaFillOpacity : 0.8,
            areaLineEnable : true,
            //areaLineColor : '#F9653C',
            areaLineColor : '#45496E',
            areaLineWidth : 1,
            areaPointEnable : false,
            areaPointStroke : '#F9653C',
            areaPointStrokeWidth : 2,
            areaPointFill : '#FFF',
            areaPointSize : 3,
            areaPointWeight : 2,
            areaTransitionSpeed : 800,
            areaTransitionEase : 'cubic-in-out',


            //candle chart
            candleWidthPercent : 0.5,
            candleBodyUpColor : '#32EA32',
            candleBodyDownColor : '#FE3232', 
            candleBodyStrokeWidth : '1',
            candleLineUpColor : '#333',
            candleLineDownColor : '#333',
            candleLineWidth : 1,
            candleLineShapeRendering : 'crispEdges',
            candleTransitionSpeed : 800,
            candleTransitionEase : 'cubic-in-out',
            //candleTransitionEase : 'bounce',

            //prevcloseLine
            prevcloseLineEnable : true,
            prevcloseLineColor : '#D95151',
            prevcloseLineWidth : 1,
            prevcloseLineShapeRendering : 'crispEdges',

            //current line
            currentLineEnable : true,
            currentLineColor : '#333',
            currentLineWidth : 1,
            currentLineShapeRendering : 'crispEdges',
            currentLineRectHeight : 16,
            currentLineRectFill : '#000',
            currentLineRectOpacity : 0.7,
            currentLineTextFontSize : 12,
            currentLineTextColor : '#FFF',
            currentLineTextMargin : 3,
            currentLineTransitionSpeed : 800,
            currentLineTransitionEase : 'bounce',

            //crossline
            crossLineEnable : true,
            crossxLineColor : '#333',
            crossxLineWidth : 1,
            crossxLineShapeRendering : 'crispEdges',
            crossxLineStrokeDasharray : '5,5',
            crossyLineColor : '#333',
            crossyLineWidth : 1,
            crossyLineShapeRendering : 'crispEdges',
            crossyLineStrokeDasharray : '5,5',

            tooltipTmpl : '开盘价：<%- p.open%><br/>收盘价：<%- p.close%><br/>最高价：<%- p.high%><br/>最低价：<%- p.low%>',
            tooltipMargin : [0, 10, 0, 10],
            tooltipStyle  : {
                'display' : 'block',
                'width' : '110px',
                'padding' : '5px',
                'line-height' : '18px',
                'position' : 'absolute',
                'font-size' : '12px',
                'background' : '#FFF',
                'box-shadow' : '0 0 3px rgba(0, 0, 0, .2)',
                'opacity' : '0.8',
                'visibility' : 'hidden',
                'border' : '1px solid #E3F4FF'
            },
            tooltipWidth : 120,
            tooltipHeight : 82,
            tooltipxStyle : {
                'display' : 'inline-block',
                'position' : 'absolute',
                'font-size' : '12px',
                'background' : '#FFF',
                'text-align' : 'center',
                'border' : '1px solid #E3F4FF'
            }, 
            tooltipxWidth : 95,
            tooltipxFormat : 'L hh:mm',
            tooltipyStyle : {
                'display' : 'inline-block',
                'position' : 'absolute',
                'font-size' : '12px',
                'background' : '#FFF',
                'border' : '1px solid #E3F4FF'
            }, 
            
            //watermark
            watermarkUrl : '',
            watermarkWidth : 0,
            watermarkHeight : 0,
            watermarkOpacity : 0.2,
            watermarkMargin : [0, 0, 0, 0],
            watermarkPosition : 'BL', //bottom left

            numberalEngine : null,
            templateEngine : null,
            events : {} //for overwrite default events
        }

        , defaultStatus = {
            rendered : false, //chart already rendered, for IE8
            namespace : null,
            x : null,
            y : null,
            areaInterval : [],
            candleInterval : [],
            interval : 0,
            innerWidth : 0,
            innerHeight : 0,
            priceMin : 0,
            priceMax : 0,
            numeralFormat : '',
            timestampMin : 0,
            timestampMax : 0        
        }
        //All d3js objects in ui
        , defaultUi = {
              chart : null
            , watermark : null
            , xAxis : null
            , yAxix : null
            , xGrid : null
            , yGrid : null
            , boardarea : null
            , boardcandle : null
            , prevcloseLine : null
            , currentLine : null
            , crossLine : null
            , tooltip : null
            , tooltipx : null
            , tooltipy : null
            , loading : null
        }
        , hasModule = (typeof module !== 'undefined' && module.exports);


    /************************************
        Constructors
    ************************************/


    function EvaFinanceChart (inputOptions, inputUi) {
        var options = $.extend(defaultOptions, inputOptions),
            container = $(options.container),
            namespace =  'efc_' + _.uniqueId() + '_';

        this._container = container;
        
        if(!this._container.get(0)) {
             throw new ReferenceError('Input container not exist');
        }

        if(options.width <= 0) {
            options.width = this._container.width() || 620;
        }

        if(options.height <= 0) {
            options.height = this._container.height() || 250;
        }


        this._options = $.extend({}, options);
        this._status = $.extend({}, defaultStatus);
        this._ui = $.extend({}, defaultUi);
        this._chartType = 'candle';
        this._prevClose = null;
        this._current = null;
        this._data = {};
        this._status.namespace = namespace;

        initUi(this);    
        initEvent(this);
    }

    function ControlEvent(root){
    }

    /**
     * By James from http://www.xinotes.org/notes/note/515/
     */
    /*
    function randomString(length) {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
       
        if (! length) {
            length = Math.floor(Math.random() * chars.length);
        }
       
        var str = '';
        for (var i = 0; i < length; i++) {
            str += chars[Math.floor(Math.random() * chars.length)];
        }
        return str;
    }
    */

    function initEvent(root) {
        var container = root._container,
            options = root._options,
            status = root._status,
            ui = root._ui,
            width = options.width,
            height = options.height,
            marginLeft = options.marginLeft,
            marginRight = options.marginRight,
            marginTop = options.marginTop,
            marginBottom = options.marginBottom,
            innerWidth = width - marginLeft - marginRight,
            innerHeight = height - marginTop - marginBottom;

        var events = $.extend(defautEvents, root._options.events);
        for(var key in events) {
            root.on(key, events[key]);
        }


        container.on('mousemove', function(event) {
            var offset = container.offset(),
                x = event.pageX - offset.left - marginLeft,
                y = event.pageY - offset.top - marginTop,
                interval = root._chartType == 'area' ? status.areaInterval : status.candleInterval;

            //check mause whether out of chart range
            //mouse effect area should be little larger than chart area, or else the edge area will be hard to detected
            if(!( x < -10 || x > innerWidth + 10 || y < -10 || y > innerHeight + 10)) {
                var index = 0;
                interval.map(function(d, i){
                    if(x > d) {
                        index = i;
                        return false;
                    }
                });
                var params = {
                    x : x,
                    y : y,
                    index : index
                }
                if(root._chartType == 'area') {
                    root.trigger('mousemoveonarea', [params]);
                } else {
                    root.trigger('mousemoveoncandle', [params]);
                }
            }
        });
    }

    function initUi(root) {
        var options = root._options,
            container = root._container,
            status = root._status,
            ui = root._ui,
            width = options.width,
            height = options.height,
            marginLeft = options.marginLeft,
            marginRight = options.marginRight,
            marginTop = options.marginTop,
            marginBottom = options.marginBottom,
            innerWidth = width - marginLeft - marginRight,
            innerHeight = height - marginTop - marginBottom,
            key;

        status.marginLeft = marginLeft;
        status.marginRight = marginRight;
        status.marginTop = marginTop;
        status.marginBottom = marginBottom;
        status.innerWidth = innerWidth;
        status.innerHeight = innerHeight;

        ui.chart = d3.select(container.get(0))
            .append('svg:svg')
            .attr('class', 'efc-wrapper')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('class', 'efc-inner')
            .attr('transform', 'translate(' + marginLeft + ',' + marginTop + ')');

        container.css({
            //background : '#EFEFEF',
            //border : '1px solid',
            position : 'relative',
            width : width + 'px',
            height : height + 'px'
        });

        ui.watermark = ui.chart.append('g').attr('class', 'efc-watermark-layer');

        ui.xAxis = ui.chart.append('g').attr('class', 'efc-xaxis')
            .attr('transform', 'translate(0,' + innerHeight + ')') ;

        ui.xGrid = ui.chart.append('g').attr('class', 'efc-xgridlines');

        ui.yAxis = ui.chart.append('g').attr('class', 'efc-yaxis')
            .attr('transform', 'translate(' + innerWidth + ',0)');

        ui.yGrid = ui.chart.append('g').attr('class', 'efc-ygridlines');

        ui.boardcandle = ui.chart.append('g').attr('class', 'efc-boardcandle');
        
        ui.boardarea = ui.chart.append('g').attr('class', 'efc-boardarea');

        ui.prevcloseLine = ui.chart.append('g').attr('class', 'efc-prevclose-layer');

        ui.rangeLine = ui.chart.append('g').attr('class', 'efc-range-layer');

        ui.currentLine = ui.chart.append('g').attr('class', 'efc-current-layer');

        ui.crossLine = ui.chart.append('g').attr('class', 'efc-cross-layer');

        ui.tooltip = d3.select(container.get(0)).append('div').attr('class', 'efc-tooltip');
        for(key in options.tooltipStyle) {
            ui.tooltip.style(key, options.tooltipStyle[key]);
        }

        ui.tooltipx = d3.select(container.get(0)).append('div').attr('class', 'efc-tooltipx');
        for(key in options.tooltipxStyle) {
            ui.tooltipx.style(key, options.tooltipxStyle[key]);
        }

        ui.tooltipy = d3.select(container.get(0)).append('div').attr('class', 'efc-tooltipy');
        for(key in options.tooltipyStyle) {
            ui.tooltipy.style(key, options.tooltipyStyle[key]);
        }

        root._ui = ui;
    }

    function drawXaxis(root) {
        var options = root._options,
            container = root._container,
            status = root._status,
            ui = root._ui,
            data = root._data;
        
        var x = d3.scale.linear()
                .domain([0, data.length -1])
                .range([0, status.innerWidth]),
            xAxisLabels = [],
            dayDiff = moment(status.timestampMax).format('YYYYMMDD') - moment(status.timestampMin).format('YYYYMMDD');

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom')
            .tickFormat(function(i) { 
                var nowMoment = moment(data[i].start);
                xAxisLabels.push(i);

                if(dayDiff == 0) {
                    return nowMoment.format(options.dateFormatHour);
                } else {

                    var nowDate = nowMoment.format('YYYYMMDD');
                    //Display date for first one
                    if(i < 1) {
                        return nowMoment.format(options.dateFormatDay);
                    } else {
                        var step = xAxisLabels[1] - xAxisLabels[0];
                        var lastDate = moment(data[i - step].start).format('YYYYMMDD');

                        if(nowDate == lastDate) {
                            return nowMoment.format(options.dateFormatHour);
                        } else {
                            return nowMoment.format(options.dateFormatDay);
                        }
                    
                    }
                }
            })
            .tickSize(options.xAxisTickSize)
            .ticks(options.xAxisTicks);
            
        status.x = x;

        ui.xAxis.call(xAxis);

        ui.xAxis.selectAll('.efc-xaxis text')
            .attr('font-size', options.xAxisLabelSize + 'px')
            .style('text-anchor', 'start')
            .attr('fill', options.xAxisLabelColor);
        

        ui.xAxis.selectAll('.efc-xaxis path, .evachart-xaxis line')
            .attr('stroke', options.xAxisStroke)
            .attr('shape-rendering', options.xAxisShapeRendering)
            .attr('fill', options.xAxisFill);

        ui.xGrid.selectAll('.efc-xgridline').remove();
        ui.xGrid.selectAll('.efc-xgridline')
            .data(x.ticks(options.xGridTicks))
            .enter().append('svg:line')
            .attr('class', 'efc-xgridline')
            .attr('x1', x)
            .attr('x2', x)
            .attr('y1', 0)
            .attr('y2', status.innerHeight)
            .attr('shape-rendering', options.xGridShapeRendering)
            .attr('fill', options.xGridFill)
            //.attr('stroke-dasharray', '5,5')
            .attr('stroke', options.xGridStroke);

    
    }

    function drawYaxis(root) {
        var options = root._options,
            container = root._container,
            status = root._status,
            ui = root._ui,
            prevClose = root._prevClose,
            current = root._current,
            data = root._data;


        var domainDiff = (status.priceMax - status.priceMin) / 20;

        if(status.maxNumLength > 2) {
            var yAxisMax = status.priceMax + domainDiff, //add 10% domain offset
            yAxisMin = status.priceMin - domainDiff,
            yAxisMax = prevClose > 0 && prevClose >= yAxisMax ? prevClose + domainDiff : yAxisMax,
            yAxisMin = prevClose > 0 && prevClose <= yAxisMin ? prevClose - domainDiff : yAxisMin;

            yAxisMax = current > 0 && current >= yAxisMax ? current + domainDiff : yAxisMax,
            yAxisMin = current > 0 && current <= yAxisMin ? current - domainDiff : yAxisMin;
        } else {
            var yAxisMax = Math.ceil(status.priceMax + domainDiff), //add 10% domain offset
            yAxisMin = Math.floor(status.priceMin - domainDiff),
            yAxisMax = prevClose > 0 && prevClose >= yAxisMax ? Math.ceil(prevClose + domainDiff) : yAxisMax,
            yAxisMin = prevClose > 0 && prevClose <= yAxisMin ? Math.floor(prevClose - domainDiff) : yAxisMin;
            
            yAxisMax = current > 0 && current >= yAxisMax ? Math.ceil(current + domainDiff) : yAxisMax,
            yAxisMin = current > 0 && current <= yAxisMin ? Math.floor(current - domainDiff) : yAxisMin;
        }

        var y = d3.scale.linear().domain([yAxisMin, yAxisMax]).range([status.innerHeight, 0]),
            yAxis = d3.svg.axis().scale(y)
                    .ticks(options.yAxisTicks)
                    .tickSize(options.yAxisTickSize)
                    .orient(options.yAxisOrient);

        status.y = y;

        ui.yAxis.call(yAxis);

        ui.yAxis.selectAll('.efc-yaxis path, .evachart-yaxis line')
            .attr('stroke', options.yAxisStroke)
            .attr('shape-rendering', options.yAxisShapeRendering)
            .attr('fill', options.yAxisFill);

        ui.yAxis.selectAll('.efc-yaxis text')
            .attr('font-size', options.yAxisLabelSize + 'px')
            .attr('fill', options.yAxisLabelColor);

        //Remove grid lines when reduced
        ui.yGrid.selectAll('.efc-ygridline').remove();
        ui.yGrid.selectAll('.efc-ygridline')
            .data(y.ticks(options.yGridTicks))
            .enter().append('svg:line')
            .attr('class', 'efc-ygridline')
            .attr('x1', 0)
            .attr('x2', status.innerWidth)
            .attr('y1', y)
            .attr('y2', y)
            .attr('shape-rendering', options.yGridShapeRendering)
            //.attr('stroke-dasharray', '5,5')
            .attr('stroke', options.yGridStroke);
    
    }

    /************************************
        Top Level Functions
    ************************************/
    efc = function (options, ui) {
        return new EvaFinanceChart(options, ui);
    };

    // version number
    efc.version = VERSION;

    /*
    efc.controlevent = function(){
        var events = new ControlEvent(this);
        return events;
    }
    */



    /************************************
        EvaFinanceChart Prototype
    ************************************/
    efc.fn = EvaFinanceChart.prototype = {
        setData : function(input) {
            if(input instanceof Array === false) {
                throw new TypeError('Chart data require array type');
            }

            var options = this._options,
                status = this._status;
            var chartData = input.slice(0);
            //sort data by start ASC
            chartData.sort(function(a, b) {
                if (a.start === b.start) {
                    return 0;
                } else if (b.start < a.start) {
                    return 1;
                }
                return -1;
            });

            var priceMin = chartData[0].low,
                priceMax = chartData[0].high,
                maxNumLength = chartData[0].price.toString().length,
                interval = chartData[1] - chartData[0];

            //js timestamp is ms
            chartData = $.map(chartData, function(n, i){
                n.index =  i;
                maxNumLength = maxNumLength > n.price.toString().length ? maxNumLength : n.price.toString().length;

                //interval MUST be caculated here before *1000
                if(typeof chartData[i + 1] !== 'undefined') {
                    interval = interval >= chartData[i + 1].start - n.start ? interval : chartData[i + 1].start - n.start;
                }
                n.start = n.start > 2000000000 ? n.start : (n.start - options.timezoneOffset) * 1000;
                n.end = n.end > 2000000000 ? n.end : (n.end - options.timezoneOffset) * 1000;
                priceMin = priceMin < n.low ? priceMin : n.low;
                priceMax = priceMax > n.high ? priceMax : n.high;

                return n;
            });

            //Longest num after .
            maxNumLength = maxNumLength - Math.floor(priceMin).toString().length - 1;

            status.priceMin = priceMin;
            status.priceMax = priceMax;
            status.timestampMin = chartData[0].start;
            status.timestampMax = chartData[chartData.length - 1].start;
            status.maxNumLength = maxNumLength;
            status.interval = interval;
            status.numeralFormat = '0.' + Array(maxNumLength).join('0');
            this._data = chartData;

            return this;
        }

        , getData : function(){
            return this._data;
        }

        , setPrevClose : function(num){
            this._prevClose = num;
            return this;
        }

        , getPrevClose : function(){
            return this._prevClose;
        }

        , getStatus : function(){
            return this._status;
        }

        , setChartType : function(input) {
            this._chartType = input || 'area';
            return this;
        }

        , getChartType : function() {
            return this._chartType;
        }

        , setOption : function(key, value) {
            this._options[key] ? this._options[key] = value : '';
            return this;
        }

        , shiftData : function(price) {
            var data = this._data,
                i = 0,
                len = data.length,
                lastPoint = data[len - 1],
                point = $.extend({}, lastPoint),
                timestamp = new Date().getTime();

            point.open = lastPoint.close;
            point.close = point.open;
            point.start = timestamp;
            point.end = timestamp;
            point.price = price;
            point.high = price;
            point.low = price;

            data.shift();
            data.push(point);
            this.setCurrent(point.price);
            this.setData(data);
            return this;
        }

        , setLastPrice : function(price) {
            var data = this._data,
                i = 0,
                len = data.length,
                lastPoint = $.extend({}, data[len - 1]),
                timestamp = new Date().getTime();

            lastPoint.price = price;
            lastPoint.high = price > lastPoint.high ? price : lastPoint.high;
            lastPoint.low = price < lastPoint.low ? price : lastPoint.low;
            lastPoint.close = price;
            lastPoint.start = timestamp;
            lastPoint.end = timestamp;

            /*
            p(typeof price);
            p(typeof lastPoint.high);
            p(price > lastPoint.high);
           */

            data[len - 1] = lastPoint;
            this.setCurrent(price);
            this.setData(data);
            return this;
        }

        , drawWaterMark : function(watermarkOptions) {
            var options = this._options,
                status = this._status,
                ui = this._ui,
                x = 0,
                y = 0,
                top = 0,
                right = 1,
                bottom = 2,
                left = 3,
                innerWidth = status.innerWidth,
                innerHeight = status.innerHeight;

            options = $.extend(options, watermarkOptions);
            var margin = options.watermarkMargin,
                width = options.watermarkWidth,
                height = options.watermarkHeight;

            switch(options.watermarkPosition.toUpperCase()) {
                case 'TL' : 
                    x = margin[left];
                    y = margin[top];
                break;
                case 'TR' : 
                    x = innerWidth - width - margin[right];
                    y = margin[top];
                break;
                case 'CENTER' : 
                    x = (innerWidth - width) / 2;
                    y = (innerHeight - height) / 2;
                break;
                case 'BR' : 
                    x = innerWidth - width - margin[right];
                    y = innerHeight - height - margin[bottom]; 
                break;
                case 'BL' :
                default : 
                    x = margin[left];
                    y = innerHeight - height - margin[bottom]; 
            }

            var watermark = 
                ui.watermark.select('image.efc-watermark').empty() ?
                    ui.watermark.append('svg:image')
                        .attr('class', 'efc-watermark')
                        :
                    ui.watermark.select('image.efc-watermark');


            watermark
                .attr('x', x)
                .attr('y', y)
                .attr('width', options.watermarkWidth)
                .attr('height', options.watermarkHeight)
                .attr('opacity', options.watermarkOpacity)
                .attr('xlink:href', options.watermarkUrl);

            return this;
        }

        , drawPrevcloseLine : function(){
            var options = this._options,
                status = this._status,
                ui = this._ui;

            var prevClosePrice = this.getPrevClose();
            if(!prevClosePrice || prevClosePrice <= 0) {
                return false;
            }
            var y = status.y(prevClosePrice);

            ui.prevcloseLine.select('line.efc-prevclose-line').remove();
            ui.prevcloseLine
                .append('svg:line')
                .attr('class', 'efc-prevclose-line')
                .attr('x1', 0)
                .attr('x2', status.innerWidth)
                .attr('y1', y)
                .attr('y2', y)
                .attr('shape-rendering', options.prevcloseLineShapeRendering)
                .attr('stroke', options.prevcloseLineColor)
                .attr('stroke-width', options.prevcloseLineWidth);

            return this;
        }

        , drawCurrentLine : function(){
            var options = this._options,
                status = this._status,
                ui = this._ui;

            var currentPrice = this.getCurrent();
            if(!currentPrice || currentPrice <= 0) {
                return false;
            }
            var y = status.y(currentPrice);

            var line = ui.currentLine.select('line.efc-current-line').empty() ? 
                    ui.currentLine.append('svg:line').attr('class', 'efc-current-line')
                : ui.currentLine.select('line.efc-current-line');
            
            line.attr('x1', 0)
                .attr('x2', status.innerWidth)
                .attr('y1', y)
                .attr('y2', y)
                .attr('shape-rendering', options.currentLineShapeRendering)
                .attr('stroke', options.currentLineColor)
                .attr('stroke-width', options.currentLineWidth);

            var rect = ui.currentLine.select('rect.efc-current-rect').empty() ? 
                    ui.currentLine.append('svg:rect').attr('class', 'efc-current-rect')
                    : ui.currentLine.select('rect.efc-current-rect');

            rect.attr('x', status.innerWidth)
                .attr('y', y - options.currentLineRectHeight / 2)		  
                .attr('height', options.currentLineRectHeight)
                .attr('width', status.marginRight)
                .attr('fill', options.currentLineRectFill)
                .attr('opacity', options.currentLineRectOpacity);

            var text = ui.currentLine.select('text.efc-current-text').empty() ?
                ui.currentLine.append('text').attr('class', 'efc-current-text')
                : ui.currentLine.select('text.efc-current-text');

            text.text(currentPrice)
                .attr('font-size', options.currentLineTextFontSize + 'px')
                .attr('x', status.innerWidth + options.currentLineTextMargin)
                .attr('y', y - options.currentLineRectHeight / 2 + options.currentLineTextFontSize)
                .attr('fill', options.currentLineTextColor);

            return this;
        }

        , drawCrossLine : function(){
            var options = this._options,
                status = this._status,
                ui = this._ui;


            var xline = ui.crossLine.select('line.efc-cross-xline').empty() ? 
                    ui.crossLine.append('svg:line').attr('class', 'efc-cross-xline')
                : ui.crossLine.select('line.efc-cross-xline');
            
            xline.attr('x1', 0)
                .attr('x2', status.innerWidth)
                .attr('y1', 0)
                .attr('y2', 0)
                .attr('visibility', 'hidden')
                .attr('shape-rendering', options.crossxLineShapeRendering)
                .attr('stroke-dasharray', options.crossxLineStrokeDasharray)
                .attr('stroke', options.crossxLineColor)
                .attr('stroke-width', options.crossxLineWidth);

            var yline = ui.crossLine.select('line.efc-cross-yline').empty() ? 
                    ui.crossLine.append('svg:line').attr('class', 'efc-cross-yline')
                : ui.crossLine.select('line.efc-cross-yline');
            
            yline.attr('x1', 0)
                .attr('x2', 0)
                .attr('y1', 0)
                .attr('y2', status.innerHeight)
                .attr('visibility', 'hidden')
                .attr('shape-rendering', options.crossyLineShapeRendering)
                .attr('stroke-dasharray', options.crossyLineStrokeDasharray)
                .attr('stroke', options.crossyLineColor)
                .attr('stroke-width', options.crossyLineWidth);
        }

        , drawRangeLine : function(){
            return this;
        }

        , drawChart : function(){
            drawXaxis(this);
            drawYaxis(this);

            if(this._options.prevcloseLineEnable) {
                this.drawPrevcloseLine();
            }

            if(this._options.currentLineEnable) {
                this.drawCurrentLine();
            }

            if(this._options.crossLineEnable) {
                this.drawCrossLine();
            }

            if(this._chartType === 'area') {
                this.drawAreaChart();
            } else {
                this.drawCandleChart();
            }

            return this;
        }

        , drawCandleChart : function(){
            var options = this._options,
                status = this._status,
                ui = this._ui,
                data = this._data,
                interval = status.candleInterval,
                min = function(a, b) {
                    return a < b ? a : b;
                },
                max = function(a, b) {
                    return a > b ? a : b;
                },
                stickWidth = options.candleWidthPercent * status.innerWidth / data.length,
                realInterval = (status.innerWidth - stickWidth) / (data.length - 1);

            interval = [];

            ui.boardcandle.selectAll('line.efc-chartcandle-line').remove();
            ui.boardcandle.selectAll('rect.efc-chartcandle-body').remove();

            ui.boardcandle.selectAll('line.efc-chartcandle-line')
                .data(data)
                .enter().append('svg:line')
                .attr('class', 'efc-chartcandle-line')
                .attr('shape-rendering', options.candleLineShapeRendering)
                .attr('x1', function(d, i) { 
                    return i * realInterval + stickWidth / 2;
                })
                .attr('x2', function(d, i) { 
                    return i * realInterval + stickWidth / 2;
                })		    
                .attr('y1', function(d) { return status.y(d.high);})
                .attr('y2', function(d) { return status.y(d.low); })
                .attr('stroke-width', options.candleLineWidth)
                .attr('stroke', function(d){ return d.open > d.close ? options.candleLineDownColor : options.candleLineDownColor; });

            ui.boardcandle.selectAll('rect.efc-chartcandle-body')
                .data(data)
                .enter().append('svg:rect')
                .attr('class', 'efc-chartcandle-body')
                .attr('x', function(d, i) {
                    var point = realInterval * i;
                    interval.push(point);
                    return point;
                })
                .attr('y', function(d) {return status.y(max(d.open, d.close));})		  
                .attr('height', function(d) {
                    var height = status.y(min(d.open, d.close)) - status.y(max(d.open, d.close));
                    height = height < 1 ? 1 : height;
                    return height;
                })
                .attr('width', function(d) { return stickWidth; })
                .attr('stroke', function(d){
                    return d.open > d.close ? options.candleLineDownColor : options.candleLineDownColor;
                })
                .attr('stroke-width', options.candleBodyStrokeWidth)
                .attr('shape-rendering', 'crispEdges')
                .attr('fill',function(d) { return d.open > d.close ? options.candleBodyDownColor : options.candleBodyUpColor;});

            status.candleInterval = interval;

            return this;
        }

        , drawAreaChart : function(){
            var options = this._options,
                status = this._status,
                ui = this._ui,
                data = this._data,
                interval = status.areaInterval,
                i = 0;

            var area = d3.svg.area()
                .x(function(d, i) { return status.x(i); })
                .y0(status.innerHeight)
                .y1(function(d) { return status.y(d.price); })
            , line = d3.svg.line()
                .x(function(d, i) { return status.x(i); })
                .y(function(d) { return status.y(d.price); })
            , pathFill = ui.boardarea.select('path.efc-chartarea-fill').empty() ?
                         ui.boardarea.append('path').attr('class', 'efc-chartarea-fill') : 
                         ui.boardarea.select('path.efc-chartarea-fill')
            , pathLine = ui.boardarea.select('path.efc-chartarea-line').empty() ?
                         ui.boardarea.append('path').attr('class', 'efc-chartarea-line') : 
                         ui.boardarea.select('path.efc-chartarea-line')
            ;


            //init xInterval whatever
            interval = [];
            for(i in data) {
                interval.push(status.x(i));
            }
            status.areaInterval = interval;

            if(options.areaFillEnable) {
                pathFill
                    .datum(data)
                    .attr('d', area)
                    .attr('fill', options.areaFillColor)
                    .attr('opacity', options.areaFillOpacity);
            }

            pathLine
                .datum(data)
                .attr('d', line)
                .attr('fill', 'none')
                .attr('stroke', options.areaLineColor)
                .attr('stroke-width', options.areaLineWidth + 'px');


            if(options.areaPointEnable) {
                circle = ui.boardarea.selectAll('circle.efc-chartarea-circle').remove(); 
                ui.boardarea.selectAll('circle.efc-chartarea-circle')
                    .data(data).enter()
                    .append('circle')
                    .attr('class', 'efc-chartarea-circle')
                    .attr('stroke', options.areaPointStroke)
                    .attr('stroke-width', options.areaPointStrokeWidth)
                    .attr('fill', options.areaPointFill)
                    .attr('cx', function(d, i) { 
                        var point = status.x(i);
                        return point; 
                    })
                    .attr('cy', function(d, i) { return status.y(d.price) })
                    .attr('r', options.areaPointSize);
            }
            return this;
        }

        , updateChart : function() {
            drawXaxis(this);
            drawYaxis(this);

            this.drawPrevcloseLine();
            if(this._chartType === 'area') {
                this.updateAreaChart();
            } else {
                this.updateCandleChart();
            }
            return this;
        }

        , updateAreaChart : function() {
            var options = this._options,
                status = this._status,
                ui = this._ui,
                data = this._data;

            var area = d3.svg.area()
                .x(function(d, i) { return status.x(i); })
                .y0(status.innerHeight)
                .y1(function(d) { return status.y(d.price); })
            , line = d3.svg.line()
                .x(function(d, i) { return status.x(i); })
                .y(function(d) { return status.y(d.price); })
            , speed = options.areaTransitionSpeed 
            , ease = options.areaTransitionEase
            ;

            ui.boardarea.selectAll('circle.efc-chartarea-circle').data(data)
                .transition()
                .ease(ease)
                .duration(speed)
                .attr('cx', function(d, i) { return status.x(i); })
                .attr('cy', function(d, i) { return status.y(d.price); });

            ui.boardarea.select('path.efc-chartarea-line').datum(data).transition()
                .duration(speed)
                .ease(ease)
                .attr('d', line);

            ui.boardarea.select('path.efc-chartarea-fill').datum(data).transition()
                .duration(speed)
                .ease(ease)
                .attr('d', area);
        
            return this;
        }

        , updateCandleChart : function() {
            var options = this._options,
                status = this._status,
                ui = this._ui,
                data = this._data,
                min = function(a, b) {
                    return a < b ? a : b;
                },
                max = function(a, b) {
                    return a > b ? a : b;
                },
                ease = options.candleTransitionEase,
                speed = options.candleTransitionSpeed;

            ui.boardcandle.selectAll('rect.efc-chartcandle-body')
                .data(data)
                .transition()
                .ease(ease)
                .duration(speed)
                .attr('y', function(d) {return status.y(max(d.open, d.close));})		  
                .attr('height', function(d) { 
                    var candleBodyHeight = status.y(min(d.open, d.close)) - status.y(max(d.open, d.close));
                    return candleBodyHeight > 0 ? candleBodyHeight : 2;
                })
                .attr('stroke', function(d){
                    return d.open > d.close ? options.candleLineDownColor : options.candleLineDownColor;
                })
                .attr('fill',function(d) { return d.open > d.close ? options.candleBodyDownColor : options.candleBodyUpColor;});

            ui.boardcandle.selectAll('line.efc-chartcandle-line')
                .data(data)
                .transition()
                .ease(ease)
                .duration(speed)
                .attr('y1', function(d) { return status.y(d.high);})
                .attr('y2', function(d) { return status.y(d.low); })
                .attr('stroke', function(d){ return d.open > d.close ? options.candleLineDownColor : options.candleLineDownColor; });

            return this;
        }

        , updateCurrentLine : function() {
            var options = this._options,
                status = this._status,
                ui = this._ui,
                speed = options.currentLineTransitionSpeed,
                ease = options.currentLineTransitionEase,
                currentPrice = this.getCurrent(),
                y = status.y(currentPrice);

            if(!currentPrice || currentPrice <= 0) {
                return false;
            }

            ui.currentLine.select('line.efc-current-line')
                .transition().duration(speed)
                .ease(ease)
                .attr('y1', y)
                .attr('y2', y);

            ui.currentLine.select('rect.efc-current-rect')
                .transition().duration(speed)
                .ease(ease)
                .attr('y', y - options.currentLineRectHeight / 2);

            ui.currentLine.select('text.efc-current-text')
                .transition().duration(speed)
                .ease(ease)
                .text(currentPrice)
                .attr('y', y - options.currentLineRectHeight / 2 + options.currentLineTextFontSize);

            return this;
        }

        , setCurrent : function(current) {
            this._current = current;
            drawYaxis(this);
            return this;
        }

        , getCurrent : function() {
            return this._current;
        }

        , getOptions : function() {
            return this._options;
        }

        , getContainer : function() {
            return this._container;
        }

        , getUI : function() {
            return this._ui;
        }

        , trigger : function(eventName, params) {
            this._container.trigger(eventName, params);
            return this;
        }

        , on : function(eventName, callback) {
            this._container.on(eventName, $.proxy(callback, this));
            return this;
        }

        , off : function(eventName) {
            this._container.off(eventName);
            return this;
        }
    }

    var onMauseMoveDefault = function(root, event, params) {
        var ui = root._ui,
            data = root._data,
            status = root._status,
            options = root._options,
            format = options.tooltipxFormat,
            innerHeight = status.innerHeight,
            innerWidth = status.innerWidth,
            marginTop = status.marginTop,
            marginLeft = status.marginLeft,
            marginRight = status.marginRight,
            tooltipWidth = options.tooltipWidth,
            tooltipHeight = options.tooltipHeight,
            tooltipxWidth = options.tooltipxWidth,
            tooltipMarginLeft = options.tooltipMargin[3],
            tooltipMarginRight = options.tooltipMargin[1],
            index = params.index,
            x = params.x,
            y = params.y,
            point = data[index],
            chartType = root._chartType;

        
        var tooltipxX = x < marginLeft ? marginLeft : x;
            tooltipxX =  x + tooltipxWidth > innerWidth ? innerWidth - tooltipxWidth : tooltipxX;
        
        ui.tooltipx.style('visibility', 'visible');
        ui.tooltipx.html(moment(point.start).format(format));
        ui.tooltipx.style('left', tooltipxX + 'px');
        ui.tooltipx.style('top', marginTop + innerHeight + 'px');


        ui.tooltipy.style('visibility', 'visible');
        ui.tooltipy.html(point.price);
        ui.tooltipy.style('left', marginLeft + innerWidth + 'px');
        ui.tooltipy.style('top', status.y(point.price) + 'px');

        y = y < 0 ? 0 : y; 
        y = y > innerHeight ? innerHeight : y; 
        ui.crossLine.select('line.efc-cross-xline')
            .style('visibility', 'visible')
            .attr('y1', status.y(point.price) + 'px')
            .attr('y2', status.y(point.price) + 'px');


        x = x < 0 ? 0 : x; 
        x = x > innerWidth ? innerWidth : x; 
        ui.crossLine.select('line.efc-cross-yline')
            .style('visibility', 'visible')
            .attr('x1', x + 'px')
            .attr('x2', x + 'px');

        var tooltipX = x > innerWidth / 2 ? x - tooltipWidth - tooltipMarginRight : x + tooltipMarginLeft;
        var tooltipY =  status.y(point.price);
        tooltipY = tooltipY + tooltipHeight + marginTop > innerHeight ? innerHeight - tooltipHeight - marginTop : tooltipY;
        ui.tooltip.style('visibility', 'visible');
        ui.tooltip.style('left', tooltipX + 'px');
        ui.tooltip.style('top', tooltipY + 'px');
        ui.tooltip.html(_.template(options.tooltipTmpl, { p : point}));    

        if(chartType == 'area') {
            ui.tooltip.style('visibility', 'hidden');
        } else {
            ui.boardcandle.selectAll('rect.efc-chartcandle-body')
                .attr('stroke-width', function(d, i) {
                    return i == index ? options.candleLineWidth + 1 : options.candleLineWidth;
                });
        }
    }

    var defautEvents = {
        'mouseleave' : function(event) {
            var ui = this._ui,
                options = this._options;
            ui.tooltipx.style('visibility', 'hidden');
            ui.tooltipy.style('visibility', 'hidden');
            ui.tooltip.style('visibility', 'hidden');
            ui.crossLine.select('line.efc-cross-xline')
                .style('visibility', 'hidden');
            ui.crossLine.select('line.efc-cross-yline')
                .style('visibility', 'hidden');

            ui.boardcandle.selectAll('rect.efc-chartcandle-body')
                .attr('stroke-width', options.candleLineWidth);
        },

        'mousemoveonarea' : function(event, params) {
            onMauseMoveDefault(this, event, params);
        },

        'mousemoveoncandle' : function(event, params) {
            onMauseMoveDefault(this, event, params);
        }
    }


    // CommonJS module is defined
    if (hasModule) {
        module.exports = efc;
    }

    /*global ender:false */
    if (typeof ender === 'undefined') {
        // here, `this` means `window` in the browser, or `global` on the server
        // add `efc` as a global object via a string identifier,
        // for Closure Compiler 'advanced' mode
        this['EvaFinanceChart'] = efc;
    }

    /*global define:false */
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return efc;
        });
    }
}).call(this);
