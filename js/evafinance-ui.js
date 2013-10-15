$(document).ready(function(){
    var finance = new EvaFinanceChart('#chart', {
        width : $("#chart").width(),
        height : 300
    });
    finance.dataReady(function(){
        finance.setChartType($("#switch-candle").hasClass('active') ? 'candle' : 'area');
        finance.drawChart();

        finance.drawPrevCloseLine(parseFloat($("#prevclose").html()));

        var timestamp = '';
        var lastPrice = '';
        var longPollingRequest;
        var longPolling = function(){
            longPollingRequest = $.ajax({
                url : $("#comet-source").val(),
                data : {
                    type : $("#symbol").val(),
                    timestamp : timestamp,
                    price : lastPrice
                },
                dataType : 'json',
                success : function(response) {
                    var data = response.data[0];
                    var point = {
                        close : data.bid,
                        end : response.timestamp * 1000,
                        high : data.high,
                        low : data.low,
                        open : data.ask,
                        price : data.ask,
                        start : response.timestamp * 1000,
                        symbol : data.symbol,
                        timestamp : response.timestamp * 1000,
                        volume : data.volume                   
                    }
                    timestamp  = response.timestamp;
                    lastPrice = point.price;
                    //finance.drawNewDot(point);
                    //finance.drawNewCandle(point);
                    finance.drawRealTimePoint(point);
                    finance.drawCurrentPrice(lastPrice);
                    

                    //TODO: use callback here
                    $(".price-current .number").html(point.price);


                    var prevClose = $("#prevclose").html();
                    var priceDiff = point.price - prevClose;
                    $(".finance-price, .finance-price .icon").removeClass('up down');
                    if(priceDiff > 0) {
                        $(".price-current .number").animate({
                            backgroundColor : '#00A53C',
                            color : '#FFF'
                        }, 'easeInQuint', function(){
                            $(this).animate({
                                backgroundColor : '#FFF',
                                color : '#00A53C'
                            }, 1000, 'easeInQuint', function(){
                                $(this).css('backgroundColor', 'transparent');      
                            });
                        });
                        $(".finance-price, .finance-price .icon").addClass('up');
                    } else {
                        $(".price-current .number").animate({
                            backgroundColor : '#E75859',
                            color : '#FFF',
                        }, 'easeInQuint');
                        $(".finance-price, .finance-price .icon").addClass('down');
                    }
                    $(".price-diff .number").html(numeral(priceDiff).format('0[.]0000'));
                    $(".price-diff-percent .number").html(numeral((priceDiff) / point.price).format('0[.]00%'));

                    longPolling();
                },
                error : function(XMLHttpRequest, textstatus, error) { 
                    if(textstatus !== 'abort') {
                            setTimeout(function(){
                                    longPolling();
                            }, 15000);
                    }
                }
            });
        }
        longPolling();
        
        /*
        var i = 1;
        setInterval(function(){
            var price = finance.status.priceMin - i;
            var point = {
                close : price,
                end : 1379400180000,
                high : price,
                low : price,
                open : price,
                price : price,
                start : 1379400121000,
                symbol : "XAUUSD",
                timestamp : 1379400180000,
                volume : "715"
            };
            finance.drawNewDot(point);        
            i++;
        }, 2000);
        */

        var refreshAreaChart = function(){
            setInterval(function(){
                $.ajax({
                    url : $("#chart-source").val(),
                    data : {
                        'symbol' : $("#symbol").val()
                    },
                    datatype : 'json',
                    success : function(response) {
                            if(response.length == 0) {
                                return false;
                            }
                            finance.refreshAreaChart(response);
                            longPollingRequest.abort();
                            finance.drawCurrentPrice(response[response.length - 1].close);
                            longPolling();
                    }
                });
            }, 60000);
        }
        refreshAreaChart();

        /*
        var dummy = [];
        setTimeout(function(){
            $.ajax({
                url : $("#chart-source").val(),
                data : {
                    'symbol' : $("#symbol").val()
                },
                datatype : 'json',
                success : function(response) {
                        dummy = dummy.length > 0 ? dummy : response.slice(0);
                        for(var i in dummy) {
                            dummy[i].start = parseInt(dummy[i].start) + 6000;
                            dummy[i].end = parseInt(dummy[i].end) + 6000;
                            dummy[i].low = parseFloat(dummy[i].low) + 10;
                            dummy[i].price = parseFloat(dummy[i].price) + 10;
                            dummy[i].high = parseFloat(dummy[i].high) + 20;
                        }
                        finance.refreshAreaChart(dummy.slice(0));
                }
            });
        }, 10);
        */

        $("#lastupdate").html(moment(finance.getLastUpdate()).format('YYYY/MM/DD H:mm:ss'));

        $("#symbol").on("change", function(){
            window.location = 'chart.php?symbol=' +  $("#symbol").val();
        });

        $("#switch-candle").on("click", function(){
            $(".chart-type .btn").removeClass('active');
            $(this).addClass('active');
            finance.setChartType('candle');
            finance.clearChart();
            finance.drawCandle();
        });

        $("#switch-area").on("click", function(){
            $(".chart-type .btn").removeClass('active');
            $(this).addClass('active');
            finance.setChartType('area');
            finance.clearChart();
            finance.drawArea();
        });

        $(".interval .btn").on("click", function(){
            $(".interval .btn").removeClass('active');
            $(this).addClass('active');
            finance.changeDataSource($("#chart-source").val() + '?interval=' + $(this).html() + '&symbol=' + $("#symbol").val(), 'jsonp');
        });
    });


    /*
    $('form').on('submit', function(){
        finance.changeDataSource('chart.php?symbol=' + $("#symbol").val() + '&num=' + $("#num").val());
        return false;
    });
    */
});


(function(d){d.each(["backgroundColor","borderBottomColor","borderLeftColor","borderRightColor","borderTopColor","color","outlineColor"],function(f,e){d.fx.step[e]=function(g){if(!g.colorInit){g.start=c(g.elem,e);g.end=b(g.end);g.colorInit=true}g.elem.style[e]="rgb("+[Math.max(Math.min(parseInt((g.pos*(g.end[0]-g.start[0]))+g.start[0]),255),0),Math.max(Math.min(parseInt((g.pos*(g.end[1]-g.start[1]))+g.start[1]),255),0),Math.max(Math.min(parseInt((g.pos*(g.end[2]-g.start[2]))+g.start[2]),255),0)].join(",")+")"}});function b(f){var e;if(f&&f.constructor==Array&&f.length==3){return f}if(e=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(f)){return[parseInt(e[1]),parseInt(e[2]),parseInt(e[3])]}if(e=/rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(f)){return[parseFloat(e[1])*2.55,parseFloat(e[2])*2.55,parseFloat(e[3])*2.55]}if(e=/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(f)){return[parseInt(e[1],16),parseInt(e[2],16),parseInt(e[3],16)]}if(e=/#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(f)){return[parseInt(e[1]+e[1],16),parseInt(e[2]+e[2],16),parseInt(e[3]+e[3],16)]}if(e=/rgba\(0, 0, 0, 0\)/.exec(f)){return a.transparent}return a[d.trim(f).toLowerCase()]}function c(g,e){var f;do{f=d.css(g,e);if(f!=""&&f!="transparent"||d.nodeName(g,"body")){break}e="backgroundColor"}while(g=g.parentNode);return b(f)}var a={aqua:[0,255,255],azure:[240,255,255],beige:[245,245,220],black:[0,0,0],blue:[0,0,255],brown:[165,42,42],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgrey:[169,169,169],darkgreen:[0,100,0],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkviolet:[148,0,211],fuchsia:[255,0,255],gold:[255,215,0],green:[0,128,0],indigo:[75,0,130],khaki:[240,230,140],lightblue:[173,216,230],lightcyan:[224,255,255],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightyellow:[255,255,224],lime:[0,255,0],magenta:[255,0,255],maroon:[128,0,0],navy:[0,0,128],olive:[128,128,0],orange:[255,165,0],pink:[255,192,203],purple:[128,0,128],violet:[128,0,128],red:[255,0,0],silver:[192,192,192],white:[255,255,255],yellow:[255,255,0],transparent:[255,255,255]}})(jQuery);

