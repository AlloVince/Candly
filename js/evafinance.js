function p(a){
    console.log(a);
}

(function () {

    /*
    if(typeof jQuery == "undefined") {
        throw new ReferenceError('EvaFinance require jQuery support.');
    }
    */
        
    /************************************
        Constants
    ************************************/

    var evafinance
        , VERSION = '1.0.0'
        , options = {
            container : null,
            timezoneOffset : 0,
            width : 0,
            height : 0,
            marginLeft : 10,
            marginRight: 80,
            marginTop : 10,
            marginBottom : 20,
            xAxisStroke : '#CCC',
            xAxisShapeRendering : 'crispEdges',
            xAxisFill : 'none',
            xAxisTicks : 5,
            xAxisOrient : 'bottom',
            yAxisStroke : '#CCC',
            yAxisShapeRendering : 'crispEdges',
            yAxisFill : 'none',
            yAxisTicks : 5,
            yAxisOrient : 'right',
            xGridStroke : '#EEE',
            xGridShapeRendering : 'crispEdges',
            xGridFill : 'none',
            xGridTicks : 5,
            yGridStroke : '#EEE',
            yGridShapeRendering : 'crispEdges',
            yGridFill : 'none',
            yGridTicks : 5,
            areaFillColor : '#FFCCB8',
            areaFillOpacity : 0.8,
            areaLineColor : '#F9653C',
            areaLineWeight : '2px',
            areaPointColor : '#F9653C',
            areaPointFillColor : '#FFF',
            areaPointSize : '3px',
            areaPointWeight : '2px',
            xColor : '#CCC',
            yColor : '#CCC',
            rectUpColor : '#A0C45E',
            rectDownColor : '#F9653C',
            lineUpColor : '#A0C45E',
            lineDownColor : '#F9653C',
            tooltipStyle  : null,
            tooltipxStyle : null, 
            tooltipyStyle : null, 
            watermarkUrl : ''
        }
        , status = {
            x : null,
            y : null,
            interval : 0,
            innerWidth : 0,
            innerHeight : 0,
            priceMin : 0,
            priceMax : 0,
            timestampMin : 0,
            timestampMax : 0        
        }
        , chartType = 'candle'
        , data = null
        , xaxisInterval = []
        , container = null  //only container is a jQuery object
        //All d3js objects in ui
        , ui = {
              chart : null
            , currentLine : null
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
        options = $.extend(options, inputOptions);
        if(options.width <= 0) {
            options.width = container.width() || 600;
        }

        if(options.height <= 0) {
            options.height = container.height() || 300;
        }

        container = $(options.container);

        if(!container.get(0)) {
             throw new ReferenceError('Input container not exist');
        }

        initUi(ui);
    }



    function initUi(inputUi) {
        var width = options.width,
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
            .append("svg:svg")
            .attr("class", "evafinance-wrapper")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("class", "evafinance-inner")
            .attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

        container.css({
            position : 'relative'
        });

        ui.tooltip = d3.select(container.get(0)).append("div").attr("class", "evafinance-tooltip");
        ui.tooltipx = d3.select(container.get(0)).append("div").attr("class", "evafinance-tooltipx");
        ui.tooltipy = d3.select(container.get(0)).append("div").attr("class", "evafinance-tooltipy");
    }

    function drawXaxis() {
        var x = d3.scale.linear()
            .domain([0, data.length -1])
            .range([0, status.innerWidth]);

        var xDisplay = d3.scale.linear().domain([status.timestampMin, status.timestampMax]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(options.xAxisTicks);
            //.ticks(2);
            //.tickFormat(function(timestamp) { return moment(timestamp).format("HH:mm"); });

            
        status.x = x;

        ui.chart.append("g")
        .attr("class", "evachart-xaxis")
        .attr("transform", "translate(0," + status.innerHeight + ")")
        .call(xAxis);

        ui.chart.selectAll(".evachart-xaxis text")
            .attr("font-size", "12px")
            .attr("fill", "#333");
        
        //xAxis.selectAll("text").attr("font-size", "12px");

        ui.chart.selectAll('.evachart-xaxis path, .evachart-xaxis line')
            .attr('stroke', options.xAxisStroke)
            .attr('shape-rendering', options.xAxisShapeRendering)
            .attr('fill', options.xAxisFill);

        ui.chart.append("g")
        .attr("class", "evachart-xgridlines")
        .selectAll(".evachart-xgridline")
        .data(x.ticks(options.xGridTicks))
        .enter().append("svg:line")
            .attr("class", "evachart-xgridline")
            .attr("x1", x)
            .attr("x2", x)
            .attr("y1", 0)
            .attr("y2", status.innerHeight)
            .attr("shape-rendering", options.xGridShapeRendering)
            .attr("fill", options.xGridFill)
            //.attr("stroke-dasharray", "5,5")
            .attr("stroke", options.xGridStroke);

    
    }

    function drawYaxis() {
        var domainDiff = (status.priceMax - status.priceMin) / 20;
        var y = d3.scale.linear()
            .domain([
                Math.ceil(status.priceMin - domainDiff),
                Math.floor(status.priceMax + domainDiff) //add 10% domain offset
            ])
            .range([status.innerHeight, 0]);

        var yAxis = d3.svg.axis()
            .scale(y)
            .ticks(options.yAxisTicks)
            .orient(options.yAxisOrient);

        status.y = y;

        ui.chart.append("g")
            .attr("class", "evachart-yaxis")
            .attr("transform", "translate(" + status.innerWidth + ",0)")
            .call(yAxis);

        ui.chart.selectAll('.evachart-yaxis path, .evachart-yaxis line')
            .attr('stroke', options.yAxisStroke)
            .attr('shape-rendering', options.yAxisShapeRendering)
            .attr('fill', options.yAxisFill);

        ui.chart.selectAll(".evachart-yaxis text")
            .attr("font-size", "12px")
            .attr("fill", "#333");

        ui.chart.append("g")
        .attr("class", "evachart-ygridlines")
        .selectAll(".evachart-xgridline")
        .data(y.ticks(options.yGridTicks))
        .enter().append("svg:line")
            .attr("class", "evachart-xgridline")
            .attr("x1", 0)
            .attr("x2", status.innerWidth)
            .attr("y1", y)
            .attr("y2", y)
            .attr("shape-rendering", options.yGridShapeRendering)
            //.attr("stroke-dasharray", "5,5")
            .attr("stroke", options.yGridStroke);
    
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

            data = chartData;
            status.priceMin = priceMin;
            status.priceMax = priceMax;
            status.timestampMin = chartData[0].start;
            status.timestampMax = chartData[chartData.length - 1].start;
            status.maxNumLength = maxNumLength;
            status.interval = interval;

            return this;
        }

        , getData : function(){
            return data;
        }

        , getStatus : function(){
            return status;
        }

        , setChartType : function(input) {
            chartType = input || 'area';
            return this;
        }

        , drawChart : function(){
            drawXaxis();
            drawYaxis();
            if(chartType === 'area') {
                this.drawCandleChart();
            } else {
                this.drawAreaChart();
            }
        }

        , drawCandleChart : function(){
        
        }

        , drawAreaChart : function(){
        
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
