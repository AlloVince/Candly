function p(a){
    console.log(a);
}

/*
* #chart
* - svg.evachart-wrapper
*   - g.evachart-inner
*     - g.evachart-xaxis
*     - g.evachart-yaxis
*     - g.evachart-xlines
*     - g.evachart-ylines
*     - g.evachart-boardarea
*     - g.evachart-boardcandle
*     - g.evachart-crossline
*     - g.evachart-cline
*     
*
*
*/
var EvaFinanceChart = function(container, options, ui){
 
    this.initContainer(container);
    this.initOptions(options);
    this.initUI(ui);
    this.initData();
}

EvaFinanceChart.prototype = {

    dataReadyFunc : []

    , defaultUI : {
        wapper : '.evachart-wrapper',
        inner : '.evachart-inner',
        xaxis : '.evachart-xaxis',
        yaxis : '.evachart-yaxis',
        xlines : '.evachart-xlines',
        ylines : '.evachart-ylines',
        boardarea : '.evachart-boardarea',
        boardcandle : '.evachart-boardcandle',
        crossline : '.evachart-crossline',
        cline : '.evachart-cline'
        /*
        lastUpdate : '.lastupdate',
        switchToCandleStick : '.switch-candle',
        switchToAreaStick : '.switch-area',
        intervalSwitchToOneMinute : '.switch-oneminute',
        intervalSwitchToFiveMinute : '.switch-fiveminute',
        intervalSwitchToFifteenMinute : '.switch-fifteenminute',
        intervalSwitchToOneHour : '.switch-onehour',
        intervalSwitchToFiveHour : '.switch-fivehour',
        intervalSwitchToOneDay : '.switch-oneday',
        intervalSwitchToOneWeek : '.switch-oneweek',
        intervalSwitchToOneMonth : '.switch-onemonth',
        zoomIn : '.zoomin',
        zoomOut : '.zoomout',
        saveToImage : '.saveimage',
        print : '.print'
        */
    }

    , ui : {
    }

    , tooltip : null

    , tooltipx : null

    , tooltipy : null

    , loading : null

    , container : '#chart'

    , options : {
        width : 0,
        height : 0,
        margin : 0,
        marginLeft : 10,
        marginRight: 80,
        marginTop : 10,
        marginBottom : 20,
        xTicks : 5,
        yTicks : 6,
        timeInterval : 60,  //60 seconds
        timezoneOffset : 0,
        areaFillColor : '#FFCCB8',
        areaFillOpacity : 0.8,
        areaLineColor : '#F9653C',
        areaLineWeight : '2px',
        areaDotColor : '#F9653C',
        areaDotFillColor : '#FFF',
        areaDotSize : '3px',
        areaDotWeight : '2px',
        xColor : '#CCC',
        yColor : '#CCC',
        rectUpColor : '#A0C45E',
        rectDownColor : '#F9653C',
        lineUpColor : '#A0C45E',
        lineDownColor : '#F9653C',
        chartClass : 'chart'
    }

    , chart : null

    , chartType : 'candle'

    , data : null

    , currentLine : null

    , xInterval : []

    , ready : false

    , realTimePoint : null

    , dataFormat : {
        '1' : 'HH:mm',
        '5' : 'HH:mm',
        '15' : 'HH:mm',
        '30' : 'DD:HH:mm'
    }

    , status : {
        x : null,
        y : null,
        interval : 0,
        innerWidth : 0,
        innerHeight : 0,
        priceMin : 0,
        priceMax : 0,
        timestampMin : 0,
        timestampMax : 0,
        x1 : 0,
        x2 : 0,
        y1 : 0,
        y2 : 0
    }

    , isReady : function(){
        return this.ready;
    }

    , callReady : function(){
        if(true === this.isReady()){
            for(var key in this.dataReadyFunc){
                this.dataReadyFunc[key]();
            }
        }
    }

    , dataReady : function(func){
        if (typeof func !== 'function') {
            return false;
        } 
        this.dataReadyFunc.push(func);
    }

    , initUI : function(ui){
        this.ui = ui = $.extend({}, this.defaultUI, ui);

        var container = this.container,
            options = this.options,
            marginLeft = options.marginLeft,
            marginRight = options.marginRight,
            marginTop = options.marginTop,
            marginBottom = options.marginBottom,
            width = options.width,
            height = options.height,
            innerWidth = width - marginLeft - marginRight,
            innerHeight = height - marginTop - marginBottom,
            status = this.status;      

        status.marginLeft = marginLeft;
        status.marginRight = marginRight;
        status.marginTop = marginTop;
        status.marginBottom = marginBottom;
        status.innerWidth = innerWidth;
        status.innerHeight = innerHeight;


        this.status = status;
        

        for(var key in ui){
            this.ui[key] = container.find(ui[key]);
        }

        var chart =  d3.select(container.get(0))
            .append("svg:svg")
            .attr("class", "evachart-wrapper")
            .attr("width", this.options.width)
            .attr("height", this.options.height)
            .append("g")
            .attr("class", "evachart-inner")
            .attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

        //watermark
        chart.append("svg:image")
            .attr("x", marginLeft)
            .attr("y", innerHeight - 90 - 10)
            .attr("width", 300)
            .attr("height", 90)
            .attr("opacity", 0.2)
            .attr("xlink:href", "logo.png");

        this.chart = chart;

        this.tooltip = d3.select("body").append("div")   
        .attr("id", "tooltip");           

        this.tooltipx = d3.select("body").append("div")   
        .attr("id", "tooltipx").style('display', 'none');       

        this.tooltipy = d3.select("body").append("div")   
        .attr("id", "tooltipy").style('display', 'none');

        this.loading = d3.select("body").append("div")   
        .attr("id", "loading").html('<i class="icon-spinner icon-spin icon-large"></i>').style('display', 'none');
    }

    , initOptions : function(options){
        this.options = $.extend({}, this.options, options);
        if(this.options.width <= 0) {
            this.options.width = this.container.width() || 600;
        }

        if(this.options.height <= 0) {
            this.options.height = this.container.height() || 300;
        }
    }

    , initContainer : function(container) {
        this.container = $(container);
    }

    , initData : function(){
        if(!this.container[0]) {
            return false;
        }

        var dataUrl = this.container.attr('data-url');
        var dataType = this.container.attr('data-type') || 'json';
        var self = this;

        this.showLaading();
        $.ajax({
           url : dataUrl,
           dataType : dataType,
           success : function(data){
               self.ready = true;
               self.setData(data);
               self.callReady();
               self.hideLoading();
           } 
        });
    }

    //add timestamp
    //sort data by time asc
    , setData : function(input) {
        var data = input.slice(0);
        
        data.sort(function(a, b) {
            if (a.start === b.start) {
                return 0;
            } else if (b.start < a.start) {
                return 1;
            }
            return -1;
        });

        var priceMin = data[0].low,
            priceMax = data[0].high,
            maxNumLength = data[0].price.length,
            options = this.options;

        data = $.map(data, function(n, i){
            maxNumLength = maxNumLength > n.price.length ? maxNumLength : n.price.length;
            n.start = (n.start - options.timezoneOffset) * 1000;
            n.end = (n.end - options.timezoneOffset) * 1000;
            n.timestamp =  n.end;
            return n;
        });

        //Longest num after .
        maxNumLength = maxNumLength - Math.floor(priceMin).toString().length - 1;

        data = $.map(data, function(n, i){
            /*
            n.price = parseFloat(n.price).toFixed(maxNumLength);
            n.high = parseFloat(n.high).toFixed(maxNumLength);
            n.low = parseFloat(n.low).toFixed(maxNumLength);
            n.open = parseFloat(n.open).toFixed(maxNumLength);
            n.close = parseFloat(n.close).toFixed(maxNumLength);
            */

            priceMin = priceMin < n.low ? priceMin : n.low;
            priceMax = priceMax > n.high ? priceMax : n.high;

            return n;
        });

        //priceMin = parseFloat(priceMin);
        //priceMax = parseFloat(priceMax);

        this.data = data;
        this.status.priceMin = priceMin;
        this.status.priceMax = priceMax;
        this.status.timestampMin = data[0].timestamp;
        this.status.timestampMax = data[data.length - 1].timestamp;
        this.status.maxNumLength = maxNumLength;
        this.status.interval = data[1].timestamp - data[0].timestamp;  //TODO: maybe not correct
    }

    , changeDataSource : function(dataUrl, dataType) {
        var self = this;
        this.ready = false;
        dataType = dataType || 'json';
        self.showLaading();
        $.ajax({
           url : dataUrl,
           dataType : dataType,
           success : function(data){
               self.ready = true;
               self.setData(data);
               self.clearChart();
               self.refreshAxis();
               self.chartType == 'candle' ? self.drawCandle() : self.drawArea();
               self.hideLoading();
           } 
        });
    
    }

    , setChartType : function(chartType) {
        this.chartType = chartType || 'area';
        return this;
    }

    , getLastUpdate : function(){
        if(!this.data) {
            return false;
        }

        return this.data[this.data.length - 1].timestamp;
    }

    , showLaading : function() {
        this.loading.style('display', 'block');
        this.loading.transition().duration(200).style('opacity', 100);
        var offset = this.container.offset();
        var width = this.container.width();
        var height = this.container.height();
        this.loading.style('top', (offset.top + height / 2 - 30) + 'px');
        this.loading.style('left', (offset.left + width / 2 - 30) + 'px');
    }

    , hideLoading : function(){
        this.loading.transition().duration(200).style('opacity', 0);
    }

    , drawPrevCloseLine : function(prevPrice){
        var status = this.status;
        var y = status.y(prevPrice);

        this.chart
        .append("svg:line")
            .attr("class", "prevline")
            .attr("x1", 0)
            .attr("x2", status.innerWidth)
            .attr("y1", y)
            .attr("y2", y)
            //.attr("shape-rendering", "crispEdges")
            .attr("shape-rendering", "optimizeSpeed")
            //.attr("stroke-dasharray", "5,5")
            .attr("stroke", "#FF0000");
    }

    , drawCurrentPrice : function(currentPrice) {
        var status = this.status;
        var y = status.y(currentPrice);

        if(this.currentLine) {
            var currentLine = this.currentLine;
            currentLine.selectAll('line')
                .transition().duration(500)
                .attr('y1', y)
                .attr('y2', y);
        
            currentLine.selectAll('rect')
                .transition().duration(500)
                .attr('y', y - 8);

            currentLine.selectAll('text')
                .transition().duration(500)
                .attr('y', y - 8 + 13)
                .text(currentPrice);

        } else {
            var currentLine = this.chart.append("g")
                .attr("class", "cline");

            currentLine.append("svg:line")
                .attr("class", "cline-element")
                .attr("x1", 0)
                .attr("x2", status.innerWidth + 10)
                .attr("y1", y)
                .attr("y2", y)
                .attr("shape-rendering", "crispEdges")
                .attr("stroke", "#000000");            

            currentLine.append("svg:rect")
            .attr("class", "cline-element")
            .attr("x", status.innerWidth + 10)
            .attr("y", y - 8)		  
            .attr("height", 16)
            .attr("width", 60)
            .attr("fill", '#000')
            .attr("opacity", 0.7);

            currentLine.append("text")
            .attr("class", "cline-element")
            .text(currentPrice)
            .attr("x", status.innerWidth + 10)
            .attr("y", y - 8 + 13)		  
            .attr("fill", "#FFF");

            this.currentLine = currentLine;
        }

    }

    , drawNewDot : function(input) {
        var data = this.data,
        status = this.status,
        options = this.options,
        x = status.x,
        y = status.y,
        speed = 800,
        innerHeight = status.innerHeight;        

        var line = d3.svg.line()
            .x(function(d) { return x(d.timestamp); })
            .y(function(d) { return y(d.price); }),
        area = d3.svg.area()
            .x(function(d) { return x(d.timestamp); })
            .y0(innerHeight)
            .y1(function(d) { return y(d.price); })
        ;

        //move all point
        this.chart.selectAll('circle').data(data)
        .transition()
        .duration(speed)
        .attr("cx", function(d, i) { return x(d.timestamp); })
        .attr("cy", function(d, i) { return y(d.price); })
        ;

        this.chart.selectAll('path.board-area-path').datum(data).transition()
        .duration(speed)
        .attr("d", line);

        this.chart.selectAll('path.board-area-fill').datum(data).transition()
        .duration(speed)
        .attr("d", area);
    }

    , drawNewCandle : function(input) {
        var data = this.data,
        status = this.status,
        options = this.options,
        x = status.x,
        y = status.y,
        speed = 800;

        function min(a, b){ return a < b ? a : b;}
        function max(a, b){ return a > b ? a : b;}   

        var board = this.chart.selectAll('g.board-candle');

        board.selectAll("rect.candle-body")
            .data(data)
            .transition()
            .duration(speed)
            .attr("y", function(d) {return y(max(d.open, d.close));})		  
            .attr("height", function(d) { 
                var candleBodyHeight = y(min(d.open, d.close))-y(max(d.open, d.close));
                return candleBodyHeight > 0 ? candleBodyHeight : 2;
            })
            .attr("fill", function(d){ return d.open > d.close ? options.lineDownColor : options.lineUpColor; });

        board.selectAll("line.candle-stem")
            .data(data)
            .transition()
            .duration(speed)
            .attr("y1", function(d) { return y(d.high);})
            .attr("y2", function(d) { return y(d.low); })
            .attr("stroke", function(d){ return d.open > d.close ? options.lineDownColor : options.lineUpColor; });
            
    }

    , drawRealTimePoint : function(input) {
        var point = $.extend({}, input),
        options = this.options,
        data = this.data,
        status = this.status,
        interval = status.interval,
        lastIndex = data.length - 1,
        realTimePoint = this.realTimePoint,
        lastPoint = $.extend({}, data[lastIndex]),
        price = point.price
        axisChanged = false;

        if(!realTimePoint) {
            realTimePoint = point;
            realTimePoint.high = price;
            realTimePoint.low = price;
            realTimePoint.high = price;
            realTimePoint.open = price;
            realTimePoint.close = price;
        } else {
            realTimePoint.price = price;
            realTimePoint.close = price;
            realTimePoint.high = price > realTimePoint.high ? price : realTimePoint.high;
            realTimePoint.low = price < realTimePoint.low ? price : realTimePoint.low;
        }

        realTimePoint.timestamp = lastPoint.timestamp;


        if(lastPoint.isRealTime) {
            data[lastIndex] = $.extend(lastPoint, realTimePoint);
        } else {
            realTimePoint.timestamp = realTimePoint.timestamp + interval;
            data.shift();
            data.push(realTimePoint);  
            for(var i in data){
                data[i].timestamp -= interval;
            }
            data[lastIndex].isRealTime = true;
        }
        this.realTimePoint = realTimePoint;
        this.data = data;        

        //when price out of min/max range, redraw xaxis & yaxis
        if(realTimePoint.high > status.priceMax || realTimePoint.low < status.priceMin) {
            this.refreshAxis();
            x = this.status.x;
            y = this.status.y;
            axisChanged = true;
        }

        if(this.chartType == 'area') {
            this.drawNewDot();
        } else {
            this.drawNewCandle();
        }
    }

    , refreshAreaChart : function(data) {
        this.realTimePoint = null;
        this.setData(data);
        //need redraw axis here
        this.refreshAxis();


        var options = this.options,
        data = this.data,
        status = this.status,
        x = status.x,
        y = status.y,
        interval = status.interval,
        innerHeight = status.innerHeight;

        var speed = 800,
        line = d3.svg.line()
            .x(function(d) { return x(d.timestamp); })
            .y(function(d) { return y(d.price); }),
        area = d3.svg.area()
            .x(function(d) { return x(d.timestamp); })
            .y0(innerHeight)
            .y1(function(d) { return y(d.price); })
        ;

        //move all point
        this.chart.selectAll('circle').data(data)
        .transition()
        .duration(speed)
        .attr("cx", function(d, i) { return x(d.timestamp); })
        .attr("cy", function(d, i) { return y(d.price); })
        ;

        this.chart.selectAll('path.board-area-path').datum(data).transition()
        .duration(speed)
        .attr("d", line);

        this.chart.selectAll('path.board-area-fill').datum(data).transition()
        .duration(speed)
        .attr("d", area);
    
    }

    , refreshAxis : function(){
        var data = this.data, 
            options = this.options,
            status = this.status,
            i = 0,
            priceMin = data[0].low,
            priceMax = data[data.length - 1].high;

        for(i in data) {
            priceMin = priceMin < data[i].low ? priceMin : data[i].low;
            priceMax = priceMax > data[i].high ? priceMax : data[i].high;
        }

        status.priceMin = priceMin;
        status.priceMax = priceMax;


        var domainDiff = (status.priceMax - status.priceMin) / 20;

        var x = d3.scale.linear()
            .domain([
                    status.timestampMin,
                    status.timestampMax
            ])
            .range([0, status.innerWidth]);
            
        var y = d3.scale.linear()
            .domain([
                status.priceMin - domainDiff,
                status.priceMax + domainDiff //add 10% domain offset
            ])
            .range([status.innerHeight, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(options.xTicks)
            .tickFormat(function(timestamp) { return moment(timestamp).format("HH:mm"); });


        var yAxis = d3.svg.axis()
            .scale(y)
            .ticks(options.yTicks)
            .orient("right");


        
        status.x = x;
        status.y = y;
        this.status = status;

        this.chart.selectAll('.evachart-yaxis')
        .call(yAxis);

        this.chart.selectAll(".evachart-xaxis")
        .call(xAxis);
    }


    , drawCrossLine : function(){
        var crosslineArea = this.chart.append("g").attr('class', 'evachart-crossline');
        crosslineArea
        .append("svg:line")
            .attr("class", "crossline-y")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", 0)
            .attr("y2", this.status.innerHeight)
            .attr("shape-rendering", "crispEdges")
            .attr("stroke-dasharray", "5,5")
            .attr("stroke", "#333");

        crosslineArea
        .append("svg:line")
            .attr("class", "crossline-x")
            .attr("x1", 0)
            .attr("x2", this.status.innerWidth)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("shape-rendering", "crispEdges")
            .attr("stroke-dasharray", "5,5")
            .attr("stroke", "#333");
    }

    , drawX : function() {
        var data = this.data, 
            options = this.options,
            status = this.status;
        
        var x = d3.scale.linear()
            .domain([
                    status.timestampMin,
                    status.timestampMax
            ])
            .range([0, status.innerWidth]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(options.xTicks)
            .tickFormat(function(timestamp) { return moment(timestamp).format("HH:mm"); });

            
        this.status.x = x;

        this.chart.append("g")
        .attr("class", "evachart-xaxis")
        .attr("transform", "translate(0," + status.innerHeight + ")")
        .call(xAxis);

        this.chart.selectAll('.evachart-xaxis path, .evachart-xaxis line')
            .attr('stroke', '#000')
            .attr('shape-rendering', 'crispEdges')
            .attr('fill', 'none');

        this.chart.append("g")
        .attr("class", "evachart-xlines")
        .selectAll(".xline")
        .data(x.ticks(options.xTicks))
        .enter().append("svg:line")
            .attr("class", "xline")
            .attr("x1", x)
            .attr("x2", x)
            .attr("y1", 0)
            .attr("y2", status.innerHeight)
            .attr("shape-rendering", "crispEdges")
            .attr("stroke-dasharray", "5,5")
            .attr("stroke", "#ccc");

    }

    , drawY : function() {
        var data = this.data, 
            options = this.options,
            status = this.status,
            domainDiff = (status.priceMax - status.priceMin) / 20;

        
        var y = d3.scale.linear()
            .domain([
                status.priceMin - domainDiff,
                status.priceMax + domainDiff //add 10% domain offset
            ])
            .range([status.innerHeight, 0]);

        var yAxis = d3.svg.axis()
            .scale(y)
            .ticks(options.yTicks)
            .orient("right");


        this.status.y = y;

        this.chart.append("g")
            .attr("class", "evachart-yaxis")
            .attr("transform", "translate(" + status.innerWidth + ",0)")
            .call(yAxis);

        this.chart.selectAll('.evachart-yaxis path, .evachart-yaxis line')
            .attr('stroke', '#000')
            .attr('shape-rendering', 'crispEdges')
            .attr('fill', 'none');


        this.chart.append("g")
        .attr("class", "evachart-ylines")
        .selectAll(".yline")
        .data(y.ticks(options.yTicks))
        .enter().append("svg:line")
            .attr("class", "yline")
            .attr("x1", status.marginLeft)
            .attr("x2", status.innerWidth)
            .attr("y1", y)
            .attr("y2", y)
            .attr("shape-rendering", "crispEdges")
            .attr("stroke-dasharray", "5,5")
            .attr("stroke", "#ccc");
    }

    , removeX : function(){
        this.chart.select(".evachart-xaxis").remove();
    }

    , removeY : function(){
        this.chart.selectAll("g.evachart-yaxis").remove();
    }

    , drawCandle : function(){
        var data = this.data, 
            options = this.options,
            margin = options.margin,
            marginLeft = options.marginLeft,
            marginRight = options.marginRight,
            marginTop = options.marginTop,
            marginBottom = options.marginBottom,
            width = options.width,
            height = options.height,
            innerWidth = width - marginLeft - marginRight,
            innerHeight = height - marginTop - marginBottom,
            x = this.status.x,
            y = this.status.y,
            interval = this.status.interval;

        function min(a, b){ return a < b ? a : b;}
        function max(a, b){ return a > b ? a : b;}   

        var stickWidth = 0.5 * innerWidth / data.length;
        var xInterval = [];
        var realInterval = (innerWidth - stickWidth) / (data.length - 1);

        var board = this.chart.selectAll('g.board-candle').empty() ? 
           this.chart.append("g").attr('class', 'board-candle') : 
           this.chart.selectAll('g.board-candle');

        board.selectAll("rect")
            .data(data)
            .enter().append("svg:rect")
            .attr("class", "candle-body")
            .attr("id", function(d, i) {
                return 'candle-body-' + i;
            })
            .attr("x", function(d, i) {
                var point = (
                    i === 0 ? 
                    x(d.timestamp) :
                    realInterval * i
                );
                xInterval.push(point);
                return point;
            })
            .attr("y", function(d) {return y(max(d.open, d.close));})		  
            .attr("height", function(d) { return y(min(d.open, d.close))-y(max(d.open, d.close));})
            .attr("width", function(d) { return stickWidth; })
            .attr("fill",function(d) { return d.open > d.close ? options.rectDownColor : options.rectUpColor ;});

        this.xInterval = xInterval;


        board.selectAll("line.stem")
            .data(data)
            .enter().append("svg:line")
            .attr("class", "candle-stem")
            .attr("shape-rendering", "crispEdges")
            .attr("x1", function(d, i) { 
                return i * realInterval + stickWidth / 2;
            })
            .attr("x2", function(d, i) { 
                return i * realInterval + stickWidth / 2;
            })		    
            .attr("y1", function(d) { return y(d.high);})
            .attr("y2", function(d) { return y(d.low); })
            .attr("stroke", function(d){ return d.open > d.close ? options.lineDownColor : options.lineUpColor; })

        $(document).off("mousemove");
        this.on("mouseOverCandle", board.selectAll("rect"));
        this.on("mouseOutCandle", board.selectAll("rect"));
        this.on("mouseMoveCandle", board);
    
    }

    , drawCandleStickChart : function(){
        this.chartType = 'candle';
        this.drawX();
        this.drawY();
        this.drawCandle();
        this.drawCrossLine();
    }

    , drawArea : function(){
        var data = this.data, 
            options = this.options,
            margin = options.margin,
            marginLeft = options.marginLeft,
            marginRight = options.marginRight,
            marginTop = options.marginTop,
            marginBottom = options.marginBottom,
            width = options.width,
            height = options.height,
            innerWidth = width - marginLeft - marginRight,
            innerHeight = height - marginTop - marginBottom,
            x = this.status.x,
            y = this.status.y;

        var area = d3.svg.area()
        .x(function(d) { return x(d.timestamp); })
        .y0(innerHeight)
        .y1(function(d) { return y(d.price); });

        var line = d3.svg.line()
        .x(function(d) { return x(d.timestamp); })
        .y(function(d) { return y(d.price); });

        var xInterval = [];

        var board = this.chart.selectAll('g.board-area').empty() ? 
           this.chart.append("g").attr('class', 'board-area') : 
           this.chart.selectAll('g.board-area');

        board.append("path")
        .datum(data)
        .attr("class", "board-area-fill")
        .attr("d", area)
        .attr("fill", options.areaFillColor)
        .attr("opacity", options.areaFillOpacity);

        board.append("path")
        .datum(data)
        .attr("class", "board-area-path")
        .attr("d", line)
        .attr("fill", 'none')
        .attr("stroke", options.areaLineColor)
        .attr("stroke-width", "2px");

        board.selectAll("circle").data(data).enter()
        .append("circle")
        .attr("stroke", options.areaLineColor)
        .attr("stroke-width", options.areaDotWeight)
        .attr("fill", options.areaDotFillColor)
        .attr("class", "area-circle")
        .attr("id", function(d, i) {
            return 'area-circle-' + i;
        })
        .attr("cx", function(d, i) { 
            var point = x(d.timestamp);
            xInterval.push(point);
            return point; 
        })
        .attr("cy", function(d, i) { return y(d.price) })
        .attr("r", options.areaDotSize);

        this.xInterval = xInterval;

        $(document).off("mousemove");
        this.on("mouseOverDot", board.selectAll("circle"));
        this.on("mouseOutDot", board.selectAll("circle"));
        this.on("mouseMoveDot", board);
    }

    , drawAreaChart : function(){
        this.chartType = 'area';
        this.drawX();
        this.drawY();
        this.drawArea();
        this.drawCrossLine();
    }

    , drawChart : function(){
       this.chartType == 'candle' ? this.drawCandleStickChart() : this.drawAreaChart();
    }

    , clearChart : function(){
        this.chart.selectAll('g.board-candle').remove();
        this.chart.selectAll('g.board-area').remove();
    }

    , on : function(eventName, selections){
        if(!this.events[eventName]) {
            return false;
        }
        $.proxy(this.events[eventName], this)(selections);
    }


    , events : {
        onChartLoaded : function(){
        }

        , mouseOverDot : function(selections) {
            var self = this;
            selections.on("mouseover", function(d, i){
                d3.select(this).transition()
                .duration(200)
                .attr('r', 7);

                /*
                self.tooltip.html(tmpl($("#tooltip-tmpl").html(), d));

                self.tooltip.style("top", (d3.event.pageY - 28) + "px");    

                if(i < self.data.length / 2) {
                    self.tooltip.style("left", (d3.event.pageX + 10) + "px")     
                } else {
                    self.tooltip.style("left", (d3.event.pageX - 140) + "px")     
                }

                self.tooltip.transition()
                .style("display", "block")
                .duration(50)      
                .style("opacity", 0.9); 
                */
            });
        }

        , mouseOutDot : function(selections) {
            var self = this;
            selections.on("mouseout", function(d, i){
                d3.select(this).transition()
                .duration(100)
                .attr('r', 3);            
            });
        }

        , mouseOverCandle : function(selections) {
            var self = this;
            selections.on("mouseover", function(d, i){
                d3.select(this).transition()
                .duration(200);

                /*
                self.tooltip.html(tmpl($("#tooltip-tmpl").html(), d));

                self.tooltip.style("top", (d3.event.pageY - 28) + "px");    

                if(i < self.data.length / 2) {
                    self.tooltip.style("left", (d3.event.pageX + 10) + "px")     
                } else {
                    self.tooltip.style("left", (d3.event.pageX - 140) + "px")     
                }

                self.tooltip.transition()
                .style("display", "block")
                .duration(50)      
                .style("opacity", 0.9); 
                */
            });
        }

        , mouseOutCandle : function(selections) {
            var self = this;
            selections.on("mouseout", function(d, i){
            });
        }

        , mouseMoveCandle : function(selections) {
            var self = this,
                marginTop = self.options.marginTop,
                marginLeft = self.options.marginLeft,
                xInterval = this.xInterval,
                innerWidth = self.status.innerWidth,
                innerHeight = self.status.innerHeight;

            self.tooltipx.style("display",  "block");
            self.tooltipy.style("display",  "block");

            //Use DOM original mousemove here. D3 event has delay
            $(document).on("mousemove.candle", function(event){

                /*
                //move with mouse
                self.chart.select('line.crossline-x').transition()
                .duration(50)
                    .attr('y1', event.pageY - offset.top - marginTop - 1)
                    .attr('y2', event.pageY - offset.top - marginTop - 1 );
                */

                var offset = $(self.container).offset(),
                x = event.pageX - offset.left - marginLeft,
                y = event.pageY - offset.top - marginTop,
                yAxis = self.status.y;

                //check mause whether out of chart range
                if(x < 0 || x > innerWidth + 10 || y < 0 || y > innerHeight + 10) {
                    self.tooltip.style("visibility", 'hidden'); 
                    self.tooltipx.style("visibility", 'hidden');
                    self.tooltipy.style("visibility", 'hidden');
                    self.chart.select('line.crossline-y').style("visibility", 'hidden'); 
                    self.chart.select('line.crossline-x').style("visibility", 'hidden'); 
                } else {
                    self.tooltip.style("visibility", 'visible'); 
                    self.tooltipx.style("visibility", 'visible');
                    self.tooltipy.style("visibility", 'visible');
                    self.chart.select('line.crossline-y').style("visibility", 'visible'); 
                    self.chart.select('line.crossline-x').style("visibility", 'visible'); 
                }

                x = x < 0 ? 0 : x;
                x = x >= innerWidth + 1 ? innerWidth + 1 : x;
                self.chart.select('line.crossline-y').transition()
                .duration(50)
                    .attr('x1', x - 1)
                    .attr('x2', x - 1);

                var interv = 0;
                xInterval.map(function(d, i){
                    if(x > d) {
                        interv = i;
                        return false;
                    }
                });

                var candleData = self.chart.select('#candle-body-' + interv).data()[0];
                var candleY = yAxis(candleData.price);

                self.chart.select('line.crossline-x').transition()
                .duration(50)
                    .attr('y1', candleY)
                    .attr('y2', candleY);

                self.tooltip.html(tmpl($("#tooltip-tmpl").html(), candleData));
                self.tooltip.style("top", (candleY + offset.top - 28) + "px");    

                if(interv < self.data.length / 2) {
                    self.tooltip.style("left", (x + offset.left + 10) + "px")     
                } else {
                    self.tooltip.style("left", (x + offset.left - 135) + "px")     
                }

                self.tooltip.transition()
                .style("display", "block")
                .duration(50)      
                .style("opacity", 0.9); 


                self.tooltipx.html(moment(candleData.start).format('L hh:mm'));
                self.tooltipx
                    .style("top",  (innerHeight + offset.top + 10) + "px");
                if(interv < self.data.length / 2) {
                    self.tooltipx.style("left",  (x + offset.left + 10) + "px");
                } else {
                    self.tooltipx.style("left",  (x + offset.left - 124) + "px");
                }

                self.tooltipy.html(candleData.price);
                self.tooltipy
                    .style("top",  (candleY + offset.top) + "px")
                    .style("left",  (offset.left + innerWidth + marginLeft) + "px");
            });        
        }


        , mouseMoveDot : function(selections) {
            var self = this,
                marginTop = self.options.marginTop,
                marginLeft = self.options.marginLeft,
                xInterval = this.xInterval,
                yAxis = self.status.y,
                innerWidth = self.status.innerWidth,
                innerHeight = self.status.innerHeight;


            //Use DOM original mousemove here. D3 event has delay
            $(document).on("mousemove.dot", function(event){

                var offset = $(self.container).offset(),
                x = event.pageX - offset.left - marginLeft,
                y = event.pageY - offset.top - marginTop;

                x = x < 0 ? 0 : x;
                x = x >= innerWidth + 1 ? innerWidth + 1 : x;
                self.chart.select('line.crossline-y').transition()
                .duration(50)
                    .attr('x1', x - 1)
                    .attr('x2', x - 1);

                if(x < 0 || x > innerWidth + 10 || y < 0 || y > innerHeight + 10) {
                    self.tooltip.style("visibility", 'hidden'); 
                    self.tooltipx.style("visibility", 'hidden');
                    self.tooltipy.style("visibility", 'hidden');
                    self.chart.select('line.crossline-y').style("visibility", 'hidden'); 
                    self.chart.select('line.crossline-x').style("visibility", 'hidden'); 
                } else {
                    self.tooltip.style("visibility", 'visible'); 
                    self.tooltipx.style("visibility", 'visible');
                    self.tooltipy.style("visibility", 'visible');
                    self.chart.select('line.crossline-y').style("visibility", 'visible'); 
                    self.chart.select('line.crossline-x').style("visibility", 'visible'); 
                }

                var interv = 0;
                xInterval.map(function(d, i){
                    if(x > d) {
                        interv = i;
                        return false;
                    }
                });

                var circleData = self.chart.select('#area-circle-' + interv).data()[0];
                var circleY = yAxis(circleData.price);
                //p(circleData);

                self.chart.select('line.crossline-x').transition()
                .duration(50)
                    .attr('y1', circleY)
                    .attr('y2', circleY);

                self.tooltip.html(tmpl($("#tooltip-tmpl").html(), circleData));
                self.tooltip.style("top", (circleY + offset.top - 20) + "px");    


                if(interv < self.data.length / 2) {
                    self.tooltip.style("left", (x + offset.left + 10) + "px")     
                } else {
                    self.tooltip.style("left", (x + offset.left - 125) + "px")     
                }

                self.tooltip.transition()
                .style("display", "block")
                .style("opacity", 0.9); 

                if(self.chartType == 'candle') {
                
                } else {
                    self.tooltip.transition()
                    .style("display", "none");
                }


                self.tooltipx.html(moment(circleData.end).format('L hh:mm'));
                self.tooltipx
                    .style("top",  (innerHeight + offset.top + 10) + "px");
                if(interv < self.data.length / 2) {
                    self.tooltipx.style("left",  (x + offset.left + 10) + "px");
                } else {
                    self.tooltipx.style("left",  (x + offset.left - 124) + "px");
                }

                self.tooltipy.html(circleData.price);
                self.tooltipy
                    .style("top",  (circleY + offset.top) + "px")
                    .style("left",  (offset.left + innerWidth + marginLeft) + "px");
            });    
        }


    }

}
