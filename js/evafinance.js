function p(a){
    if(typeof console === 'undefined') {
        return false;
    }
    console.log(a);
}

(function () {

    /*
    if(typeof jQuery == 'undefined') {
        throw new ReferenceError('EvaFinance require jQuery support.');
    }
    */
        
    /************************************
        Constants
    ************************************/

    var evafinance = {}
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
            //candleTransitionEase : 'cubic-in-out',
            candleTransitionEase : 'bounce',

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

            tooltipStyle  : null,
            tooltipxStyle : null, 
            tooltipyStyle : null, 
            
            //watermark
            watermarkUrl : '',
            watermarkWidth : 0,
            watermarkHeight : 0,
            watermarkOpacity : 0.2,
            watermarkMargin : [0, 0, 0, 0],
            watermarkPosition : 'bl' //bottom left
        }

        , defaultStatus = {
            rendered : false, //chart already rendered, for IE8
            namespace : null,
            x : null,
            y : null,
            xInterval : [],
            interval : 0,
            innerWidth : 0,
            innerHeight : 0,
            priceMin : 0,
            priceMax : 0,
            timestampMin : 0,
            timestampMax : 0        
        }
        //, defaultChartType = 'candle'
        //, defaultPrevClose = null
        //, displayRange = []  //be able to display a part of data 
        //, container = null  //only container is a jQuery object
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


    function EvaFinance (inputOptions, inputUi) {
        var options = $.extend(defaultOptions, inputOptions);
        this._container = $(options.container);
        
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
        this._status.namespace = _.uniqueId() + '_';

        initUi(this);
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
            innerHeight = height - marginTop - marginBottom;

        status.marginLeft = marginLeft;
        status.marginRight = marginRight;
        status.marginTop = marginTop;
        status.marginBottom = marginBottom;
        status.innerWidth = innerWidth;
        status.innerHeight = innerHeight;

        ui.chart = d3.select(container.get(0))
            .append('svg:svg')
            .attr('class', 'evafinance-wrapper')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('class', 'evafinance-inner')
            .attr('transform', 'translate(' + marginLeft + ',' + marginTop + ')');

        container.css({
            //background : '#EFEFEF',
            //border : '1px solid',
            position : 'relative',
            width : width + 'px',
            height : height + 'px'
        });

        ui.watermark = ui.chart.append('g').attr('class', 'evafinance-watermark-layer');

        ui.xAxis = ui.chart.append('g').attr('class', 'evafinance-xaxis')
            .attr('transform', 'translate(0,' + innerHeight + ')') ;

        ui.xGrid = ui.chart.append('g').attr('class', 'evafinance-xgridlines');

        ui.yAxis = ui.chart.append('g').attr('class', 'evafinance-yaxis')
            .attr('transform', 'translate(' + innerWidth + ',0)');

        ui.yGrid = ui.chart.append('g').attr('class', 'evafinance-ygridlines');

        ui.boardcandle = ui.chart.append('g').attr('class', 'evafinance-boardcandle');
        
        ui.boardarea = ui.chart.append('g').attr('class', 'evafinance-boardarea');

        ui.prevcloseLine = ui.chart.append('g').attr('class', 'evafinance-prevclose-layer');

        ui.currentLine = ui.chart.append('g').attr('class', 'evafinance-current-layer');

        ui.crossLine = ui.chart.append('g').attr('class', 'evafinance-cross-layer');

        ui.tooltip = d3.select(container.get(0)).append('div').attr('class', 'evafinance-tooltip');
        ui.tooltipx = d3.select(container.get(0)).append('div').attr('class', 'evafinance-tooltipx');
        ui.tooltipy = d3.select(container.get(0)).append('div').attr('class', 'evafinance-tooltipy');

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

        ui.xAxis.selectAll('.evafinance-xaxis text')
            .attr('font-size', options.xAxisLabelSize + 'px')
            .style('text-anchor', 'start')
            .attr('fill', options.xAxisLabelColor);
        

        ui.xAxis.selectAll('.evafinance-xaxis path, .evachart-xaxis line')
            .attr('stroke', options.xAxisStroke)
            .attr('shape-rendering', options.xAxisShapeRendering)
            .attr('fill', options.xAxisFill);

        ui.xGrid.selectAll('.evafinance-xgridline').remove();
        ui.xGrid.selectAll('.evafinance-xgridline')
            .data(x.ticks(options.xGridTicks))
            .enter().append('svg:line')
            .attr('class', 'evafinance-xgridline')
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


        //trigger('evafinance.drawxaxis.before');

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

        ui.yAxis.selectAll('.evafinance-yaxis path, .evachart-yaxis line')
            .attr('stroke', options.yAxisStroke)
            .attr('shape-rendering', options.yAxisShapeRendering)
            .attr('fill', options.yAxisFill);

        ui.yAxis.selectAll('.evafinance-yaxis text')
            .attr('font-size', options.yAxisLabelSize + 'px')
            .attr('fill', options.yAxisLabelColor);

        //Remove grid lines when reduced
        ui.yGrid.selectAll('.evafinance-ygridline').remove();
        ui.yGrid.selectAll('.evafinance-ygridline')
            .data(y.ticks(options.yGridTicks))
            .enter().append('svg:line')
            .attr('class', 'evafinance-ygridline')
            .attr('x1', 0)
            .attr('x2', status.innerWidth)
            .attr('y1', y)
            .attr('y2', y)
            .attr('shape-rendering', options.yGridShapeRendering)
            //.attr('stroke-dasharray', '5,5')
            .attr('stroke', options.yGridStroke);
    
        //trigger('evafinance.drawxaxis.after');
    }

    function trigger(eventName) {
        //$(document).trigger(namespace + eventName, this);
    }

    /************************************
        Top Level Functions
    ************************************/
    evafinance = function (options, ui) {
        return new EvaFinance(options, ui);
    };

    // version number
    evafinance.version = VERSION;

    /************************************
        EvaFinance Prototype
    ************************************/
    evafinance.fn = EvaFinance.prototype = {
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
                n.start = (n.start - options.timezoneOffset) * 1000;
                n.end = (n.end - options.timezoneOffset) * 1000;
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

        , setOption : function(key, value) {
            this._options[key] ? this._options[key] = value : '';
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
                ui.watermark.select('image.evafinance-watermark').empty() ?
                    ui.watermark.append('svg:image')
                        .attr('class', 'evafinance-watermark')
                        :
                    ui.watermark.select('image.evafinance-watermark');


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

            ui.prevcloseLine.select('line.evafinance-prevclose-line').remove();
            ui.prevcloseLine
                .append('svg:line')
                .attr('class', 'evafinance-prevclose-line')
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

            var line = ui.currentLine.select('line.evafinance-current-line').empty() ? 
                    ui.currentLine.append('svg:line').attr('class', 'evafinance-current-line')
                : ui.currentLine.select('line.evafinance-current-line');
            
            line.attr('x1', 0)
                .attr('x2', status.innerWidth)
                .attr('y1', y)
                .attr('y2', y)
                .attr('shape-rendering', options.currentLineShapeRendering)
                .attr('stroke', options.currentLineColor)
                .attr('stroke-width', options.currentLineWidth);

            var rect = ui.currentLine.select('rect.evafinance-current-rect').empty() ? 
                    ui.currentLine.append('svg:rect').attr('class', 'evafinance-current-rect')
                    : ui.currentLine.select('rect.evafinance-current-rect');

            rect.attr('x', status.innerWidth)
                .attr('y', y - options.currentLineRectHeight / 2)		  
                .attr('height', options.currentLineRectHeight)
                .attr('width', status.marginRight)
                .attr('fill', options.currentLineRectFill)
                .attr('opacity', options.currentLineRectOpacity);

            var text = ui.currentLine.select('text.evafinance-current-text').empty() ?
                ui.currentLine.append('text').attr('class', 'evafinance-current-text')
                : ui.currentLine.select('text.evafinance-current-text');

            text.text(currentPrice)
                .attr('font-size', options.currentLineTextFontSize + 'px')
                .attr('x', status.innerWidth + options.currentLineTextMargin)
                .attr('y', y - options.currentLineRectHeight / 2 + options.currentLineTextFontSize)
                .attr('fill', options.currentLineTextColor);

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
                xInterval = status.xInterval,
                min = function(a, b) {
                    return a < b ? a : b;
                },
                max = function(a, b) {
                    return a > b ? a : b;
                },
                stickWidth = options.candleWidthPercent * status.innerWidth / data.length,
                realInterval = (status.innerWidth - stickWidth) / (data.length - 1);

            xInterval = [];

            ui.boardcandle.selectAll('line.evafinance-chartcandle-line').remove();
            ui.boardcandle.selectAll('rect.evafinance-chartcandle-body').remove();

            ui.boardcandle.selectAll('line.evafinance-chartcandle-line')
                .data(data)
                .enter().append('svg:line')
                .attr('class', 'evafinance-chartcandle-line')
                .attr('shape-rendering', options.candleLineShapeRendering)
                .attr('x1', function(d, i) { 
                    return i * realInterval + stickWidth / 2;
                })
                .attr('x2', function(d, i) { 
                    return i * realInterval + stickWidth / 2;
                })		    
                .attr('y1', function(d) { return status.y(d.high);})
                .attr('y2', function(d) { return status.y(d.low); })
                .attr('stroke', function(d){ return d.open > d.close ? options.candleLineDownColor : options.candleLineDownColor; });

            ui.boardcandle.selectAll('rect.evafinance-chartcandle-body')
                .data(data)
                .enter().append('svg:rect')
                .attr('class', 'evafinance-chartcandle-body')
                .attr('x', function(d, i) {
                    var point = realInterval * i;
                    xInterval.push(point);
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
        }

        , drawAreaChart : function(){
            var options = this._options,
                status = this._status,
                ui = this._ui,
                data = this._data,
                xInterval = status.xInterval;

            var area = d3.svg.area()
                .x(function(d, i) { return status.x(i); })
                .y0(status.innerHeight)
                .y1(function(d) { return status.y(d.price); })
            , line = d3.svg.line()
                .x(function(d, i) { return status.x(i); })
                .y(function(d) { return status.y(d.price); })
            , pathFill = ui.boardarea.select('path.evafinance-chartarea-fill').empty() ?
                         ui.boardarea.append('path').attr('class', 'evafinance-chartarea-fill') : 
                         ui.boardarea.select('path.evafinance-chartarea-fill')
            , pathLine = ui.boardarea.select('path.evafinance-chartarea-line').empty() ?
                         ui.boardarea.append('path').attr('class', 'evafinance-chartarea-line') : 
                         ui.boardarea.select('path.evafinance-chartarea-line')
            ;


            //init xInterval whatever
            xInterval = [];

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
                circle = ui.boardarea.selectAll('circle.evafinance-chartarea-circle').remove(); 
                ui.boardarea.selectAll('circle.evafinance-chartarea-circle')
                    .data(data).enter()
                    .append('circle')
                    .attr('class', 'evafinance-chartarea-circle')
                    .attr('stroke', options.areaPointStroke)
                    .attr('stroke-width', options.areaPointStrokeWidth)
                    .attr('fill', options.areaPointFill)
                    .attr('cx', function(d, i) { 
                        var point = status.x(i);
                        xInterval.push(point);
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

            ui.boardarea.selectAll('circle.evafinance-chartarea-circle').data(data)
                .transition()
                .ease(ease)
                .duration(speed)
                .attr('cx', function(d, i) { return status.x(i); })
                .attr('cy', function(d, i) { return status.y(d.price); });

            ui.boardarea.select('path.evafinance-chartarea-line').datum(data).transition()
                .duration(speed)
                .ease(ease)
                .attr('d', line);

            ui.boardarea.select('path.evafinance-chartarea-fill').datum(data).transition()
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

            ui.boardcandle.selectAll('rect.evafinance-chartcandle-body')
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

            ui.boardcandle.selectAll('line.evafinance-chartcandle-line')
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

            ui.currentLine.select('line.evafinance-current-line')
                .transition().duration(speed)
                .ease(ease)
                .attr('y1', y)
                .attr('y2', y);

            ui.currentLine.select('rect.evafinance-current-rect')
                .transition().duration(speed)
                .ease(ease)
                .attr('y', y - options.currentLineRectHeight / 2);

            ui.currentLine.select('text.evafinance-current-text')
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

        , bind : function(eventName, func){
            $(document).on(this._namespace + eventName, func);

            return this;
        }

        , unbind : function(eventName) {
            $(document).off(this._namespace + eventName);

            return this;
        }
    }


    // CommonJS module is defined
    if (hasModule) {
        module.exports = evafinance;
    }

    /*global ender:false */
    if (typeof ender === 'undefined') {
        // here, `this` means `window` in the browser, or `global` on the server
        // add `evafinance` as a global object via a string identifier,
        // for Closure Compiler 'advanced' mode
        this['EvaFinance'] = evafinance;
    }

    /*global define:false */
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return evafinance;
        });
    }
}).call(this);
