EvaFinanceChart
===============

A data-driven finance chart component based on d3js.

### Quick Start

Init chart and real-time data source url :

<script>
$(document).ready(function(){
    var em = new EfcManager({
        'chartUrl' : 'http://api.markets.wallstreetcn.com/v1/chart',
        'cometUrl' : 'http://api.markets.wallstreetcn.com/v1/price',
        'dataType' : 'jsonp'
    });
});
</script>

    <script>
    $(document).ready(function(){
        var em = new EfcManager({
            'chartUrl' : 'http://api.markets.wallstreetcn.com/v1/chart',
            'cometUrl' : 'http://api.markets.wallstreetcn.com/v1/price',
            'dataType' : 'jsonp'
        });
    });
    </script>


Generate a animation finance chart just by single line code:

<div id="quick-startchart" class="efc" data-efc-symbol="XAUUSD" data-efc-interval="1" data-efc-rows="90" data-efc-refresh="1" data-efc-options='{"height":260,"prevclose":1235.98,"watermarkEnable":1,"watermarkUrl":"/watermark.png","watermarkWidth":194,"watermarkHeight":24,"watermarkMargin":[0, 0, 10, 10]}'></div>


    <div id="quick-startchart" class="efc" data-efc-symbol="XAUUSD" data-efc-interval="1" data-efc-rows="90" data-efc-refresh="1" data-efc-options='{"height":260,"prevclose":1235.98,"watermarkEnable":1,"watermarkUrl":"/watermark.png","watermarkWidth":194,"watermarkHeight":24,"watermarkMargin":[0, 0, 10, 10]}'></div>

Basic
======


### Draw Candle Stick Chart

<div id="basic-candle"></div>
<script>
    $(document).ready(function(){
        var efc = new EvaFinanceChart({
            container : "#basic-candle",
            chartType : 'candle',
            width : 630,
            height : 250
        });
        efc.setData(dataEurusd);
        efc.drawChart();
    });
</script>

    <div id="basic-candle"></div>
    <script>
        $(document).ready(function(){
            var efc = new EvaFinanceChart({
                container : "#basic-candle",
                chartType : 'candle',
                width : 630,
                height : 250
            });
            efc.setData(dataEurusd);
            efc.drawChart();
        });
    </script>

-----

### Draw Area Chart

<div id="basic-area"></div>
<script>
    $(document).ready(function(){
        var efc = new EvaFinanceChart({
            container : "#basic-area",
            chartType : 'area',
            width : 630,
            height : 250
        });
        efc.setData(dataEurusd);
        efc.drawChart();
    });
</script>

    <div id="basic-area"></div>
    <script>
        $(document).ready(function(){
            var efc = new EvaFinanceChart({
                container : "#basic-area",
                chartType : 'area',
                width : 630,
                height : 250
            });
            efc.setData(dataEurusd);
            efc.drawChart();
        });
    </script>

-----


Customize
==========

<div id="customize-investing"></div>
<script>
    $(document).ready(function(){
        var efc = new EvaFinanceChart({
            container : "#customize-investing",
            candleBodyUpColor : '#32EA32',
            candleBodyDownColor : '#FE3232', 
            currentLineRectFill : '#000', 
            areaFillColor : '#E3F4FF', 
            width : 630,
            height : 250
        });
        efc.setData(dataEurusd);
        efc.drawChart();
    });
</script>

    <div id="customize-investing"></div>
    <script>
        $(document).ready(function(){
            var efc = new EvaFinanceChart({
                container : "#customize-investing",
                candleBodyUpColor : '#32EA32',
                candleBodyDownColor : '#FE3232', 
                currentLineRectFill : '#000', 
                areaFillColor : '#E3F4FF', 
                width : 630,
                height : 250
            });
            efc.setData(dataEurusd);
            efc.drawChart();
        });
    </script>

-----
