(function($) {
    // Activity default options
    var defaults = {
        name        : "shop",                                   // The activity name
        label       : "Shop",                                   // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        exercice    : [],                                       // Exercice
        wallet      : [10,5,6,10,5,6,10,5,2,5,5,2,1],           // initial wallet
        errratio    : 1,                                        // Error ratio
        decimal     : true,                                     // Handle decimal
        messy       : false,                                    // Wallet is messy
        debug       : true                                      // Debug mode
    };

	
    var regExp = [
        "\\\[br\\\]",            					"<br>",
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[bb\\\](.+)\\\[/bb\\\]",                "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>"
    ];
	
    var coins = [ "cent1","cent2","cent5","cent10","cent20","cent50","coin1b","coin2","bill5","bill10","bill20","bill50","bill100" ];
    var valc = [ 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100 ];
    var cc = [ 0.9, 1.1, 1.3, 1.1, 1.5, 2, 1.7, 2, 0.5, 0.5, 0.5, 0.5, 1];
    var change = [ [[0,1]], [[0,2]], [[0,1],[1,2]], [[2,2]], [[3,2]], [[3,1],[4,2]], [[5,2]], [[6,2]], [[6,1],[7,2]], [[8,2]],
                   [[9,2]], [[9,1],[10,2]], [[11,2]] ];
    var products = [
                    // BY QUANTITY (x20)
                    "food/butter01","food/canned01","food/jam01","food/soup01",
                    "drink/milk01","drink/wine01","misc/batterie01","misc/salt01",
                    "tool/clean01","tool/scissors03","tool/envelope01","tool/compass02",
                    "pencil/blue01","pencil/brush02","pencil/corrector01","pencil/eraser01",
                    "pencil/marker01","pencil/marker03","pencil/spray01","pencil/pencil01",

                    // BY WEIGHT (x20)

                    "vegetable/apple01","vegetable/apricot01","vegetable/aubergine01","vegetable/banana01",
                    "vegetable/cherry02","vegetable/clementine01","vegetable/kiwi01","vegetable/leek01",
                    "vegetable/mushroom01","vegetable/orange01","vegetable/pear01","vegetable/pepper01",
                    "vegetable/pepper02","vegetable/pepper03","vegetable/pistachio01","vegetable/potato01",
                    "vegetable/radish01","vegetable/strawberry01","vegetable/tomato01","food/cheese01"
                    ];

    
    var n = {
        comma : ',',
        toString:function(_val, _nbdec) {
            var dec = Math.floor((_val - Math.floor(_val))*Math.pow(10,_nbdec)+0.1), txt = "";
            if (dec) {
                txt = n.comma;
                if (_nbdec==3 && dec<100) { txt+='0'; }
                txt+= (dec<10?'0':'')+dec;
            }
            return Math.floor(_val)+txt;
        },
        toFloat:function(_val) { return parseFloat(_val.replace(n.comma,".")); },
        price: function(_val) { return n.toString(_val, 2); },
        qty: function(_val) { return n.toString(_val,3); }
    };

    // private methods
    var helpers = {
        // @generic: Check the context
        checkContext: function(_settings){
            var ret         = "";
            if (!_settings.context)         { ret = "no context is provided in the activity call."; } else
            if (!_settings.context.onquit)  { ret = "mandatory callback onquit not available."; }

            if (ret.length) {
                ret+="\n\nUsage: $(\"target\")."+_settings.name+"({'onquit':function(_ret){}})";
            }
            return ret;
        },
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },
        // Binding clear
        unbind: function($this) {
            $(document).unbind("keypress keydown");
            $this.unbind("mouseup mousedown mousemove mouseleave touchstart touchmove touchend touchleave");
        },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this,{'status':'success','score':settings.score});
        },
        format: function(_text) {
            for (var j=0; j<2; j++) for (var i=0; i<regExp.length/2; i++) {
                var vReg = new RegExp(regExp[i*2],"g");
                _text = _text.replace(vReg,regExp[i*2+1]);
            }
            return _text;
        },
        loader: {
            css: function($this) {
                var settings = helpers.settings($this), cssAlreadyLoaded = false, debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

                $("head").find("link").each(function() {
                    if ($(this).attr("href").indexOf("activities/"+settings.name+"/"+settings.css) != -1) { cssAlreadyLoaded = true; }
                });

                if(cssAlreadyLoaded) { helpers.loader.template($this); }
                else {
                    $("head").append("<link></link>");
                    var css = $("head").children(":last");
                    var csspath = "activities/"+settings.name+"/"+settings.css+debug;

                    css.attr({ rel:  "stylesheet", type: "text/css", href: csspath }).ready(
                        function() { helpers.loader.template($this); });
                }
            },
            template: function($this) {
                var settings = helpers.settings($this), debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

                // Load the template
                var templatepath = "activities/"+settings.name+"/"+settings.template+debug;
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.build($this); });
            },
            build: function($this) {
                var settings = helpers.settings($this);

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }

                // COMPUTE DATA IF NEED
                if (typeof(settings.data)=="string") { settings.data = eval('('+settings.data+')')(); }

                if (settings.menu) {
                    $this.find("#menu .tab").hide();
					$this.find("#menu #phelp").show();
                    for (var i in settings.menu) { $this.find("#menu #"+settings.menu[i]).show(); }
                }

                // sketchbook
                var elt=$this.find("#psketchbook>svg");
                elt.svg();
                settings.sketchbook.svg = elt.svg('get');
                settings.sketchbook.g = settings.sketchbook.svg.group();

                $this.find("#psketchbook").bind("touchstart mousedown", function(_event) {
                    var e = (_event && _event.originalEvent &&
                             _event.originalEvent.touches && _event.originalEvent.touches.length)?
                             _event.originalEvent.touches[0]:_event;

                    settings.sketchbook.first = [ e.clientX, e.clientY ];
                    settings.sketchbook.last = [ e.clientX, e.clientY ];
                    settings.sketchbook.path = settings.sketchbook.svg.createPath();
                    settings.sketchbook.path = settings.sketchbook.svg.path( settings.sketchbook.g,
                      settings.sketchbook.path.move(  
                        (settings.sketchbook.last[0] - settings.sketchbook.offset[0])*settings.sketchbook.ratio,
                        (settings.sketchbook.last[1] - settings.sketchbook.offset[1])*settings.sketchbook.ratio ) );

                    settings.sketchbook.svg.circle( settings.sketchbook.g,
                        (settings.sketchbook.last[0] - settings.sketchbook.offset[0])*settings.sketchbook.ratio,
                        (settings.sketchbook.last[1] - settings.sketchbook.offset[1])*settings.sketchbook.ratio, 1.5);
                    
                    _event.preventDefault();
                });

                $this.bind("touchend touchleave mouseup mouseleave", function(_event) {
                    if (settings.sketchbook.path) {
                        var e = (_event && _event.originalEvent &&
                                 _event.originalEvent.touches && _event.originalEvent.touches.length)?
                                 _event.originalEvent.touches[0]:_event;
                        settings.sketchbook.path = 0;
                        settings.sketchbook.svg.circle( settings.sketchbook.g,
                            (settings.sketchbook.last[0] - settings.sketchbook.offset[0])*settings.sketchbook.ratio,
                            (settings.sketchbook.last[1] - settings.sketchbook.offset[1])*settings.sketchbook.ratio, 1.5);
                        _event.preventDefault();
                    }
                });

                $this.bind("mousemove touchmove", function(_event) {
                    if (settings.sketchbook.path) {
                        var e = (_event && _event.originalEvent &&
                             _event.originalEvent.touches && _event.originalEvent.touches.length)?
                             _event.originalEvent.touches[0]:_event;

                        if (Math.abs(settings.sketchbook.last[0] - e.clientX)+Math.abs(settings.sketchbook.last[1] - e.clientY)>5) {

                            settings.sketchbook.last = [ e.clientX, e.clientY ];
                            $(settings.sketchbook.path).attr({d:
                                $(settings.sketchbook.path).attr("d")+" L "+
                                    (e.clientX - settings.sketchbook.offset[0])*settings.sketchbook.ratio + "," +
                                    (e.clientY - settings.sketchbook.offset[1])*settings.sketchbook.ratio });
                        }
                        _event.preventDefault();
                    }
                });
                    
                // SALES
                if (settings.sales) {
                    for (var i in settings.sales) {
                        $this.find("#board").append(helpers.sale.create($this, i, settings.sales[i], { left:(21.5-i*5)+"em" })); }
                    $this.find("#board .sales").draggable({helper:"clone"});
                }

                $this.find("#pinvoice .footer .line").droppable({accept:".sales.ss2",
                    over: function(event, ui) { $(this).addClass("over");  },
                    out: function(event, ui) { $(this).removeClass("over"); },
                    drop:function(event, ui) {
                        var $this = $(this).closest(".shop"),settings = helpers.settings($this);
                        $(this).removeClass("over");
                        if (settings.data[settings.it].type=="invoice") {
                            var id = parseInt($(ui.draggable).attr("id").substr(1));
                            var sale = (id<2?settings.sales[id]:settings.data[settings.it].sales[id-2]);
                            helpers.sale.add($this, this, sale);
                            $this.find("#pinvoice #svalid").removeClass("s");
                        }
                    }
                });

                // Droppable wallet
                $this.find(".wallet").droppable({greedy:true, accept:".a",
                    over: function(event, ui) { if ($(this)!=settings.coins.wallet) { $(this).addClass("over"); } },
                    out: function(event, ui) { $(this).removeClass("over"); },
                    drop:function(event, ui) {
                        var $this = $(this).closest(".shop");
                        $this.find(".panel").removeClass("over");

                        var $old = $(ui.draggable).closest(".panel");
                        $(ui.draggable).detach();
                        var $coin = $(ui.draggable).clone();

                        $(this).children().first().append($coin);

                        var pos = [$coin.css("left"),$coin.css("top")];
                        for (var i in pos) { if (pos[i].indexOf("px")!=-1) { pos[i]=pos[i].substr(0,pos[i].length-2); } }
                        pos[0]=parseInt(pos[0]) + parseInt($old.offset().left) - parseInt($(this).offset().left);
                        pos[1]=parseInt(pos[1]) + parseInt($old.offset().top)  - parseInt($(this).offset().top);
                        $coin.css("left",pos[0]+"px").css("top",pos[1]+"px");

                        if ($(this).attr("id")=="pchange") {
                            var id = parseInt($coin.attr("class").substr(1,2));
                            if (settings.decimal || id>6) {
                                pos = helpers.panel.inside($this, $coin,1.4);
                                $this.find("#pmask").css("opacity",0).show().animate({opacity:1},500,function() {
                                    $coin.detach();
                                    var vWidth = $(this).width();
                                    var count = 0;
                                    for (var i in change[id]) for (var j=0; j<change[id][i][1]; j++) {
                                        var ii = change[id][i][0];
                                        var $c = $("<div class='v"+ii+(ii<8?" coin":" bill")+" a'><div><img src='res/img/coin/"+coins[ii]+".svg'/></div></div>");
                                        $c.css("left",(pos[0]+count*vWidth/10)+"px").css("top",(pos[1]+count*vWidth/10)+"px");
                                        $this.find("#pchange>div").append($c);
                                        helpers.panel.draggable($this, $c,true);
                                        count++;
                                    }

                                    $this.find("#pmask").animate({opacity:0.2},500,function(){ $(this).hide(); });
                                });
                            }
                            else { helpers.panel.draggable($this, $coin,true); }
                        }
                        else { helpers.panel.draggable($this, $coin,true); }
                }
                });

                helpers.fill($this, $this.find("#pwallet>div"), settings.wallet,settings.messy);

                // Locale handling
				
				
                // LOCALE HANDLING
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(helpers.format(value)); }
                }); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        debug: function($this, _txt) { $this.find("#output").append("<p>"+_txt+"</p>"); },
        sale: {
            create: function($this, _id, _sale, _args) {
                var args="";
                for (var i in _args) { args += i+":"+_args[i]+";"}
                var html="<div id='s"+_id+"' class='sales ss"+(_sale.product!=-1?1:2)+"' style='"+args+"'>";
                if (_sale.product!=-1) {
                    html+="<div class='icon'><img src='res/img/svginventoryicons/"+products[_sale.product]+".svg'/></div>";
                }
                html+="<div class='label type"+_sale.type+"'>"+_sale.value+"</div>";
                if (_sale.cond) { html+="<div class='cond"+(_sale.mode?"":" s")+"'>"+_sale.cond+"</div>"; }
                html+="</div>";
                return html;
            },
            add: function($this, _this, _sale) {
                if ($(_this).hasClass("s")) { $(_this).next().detach(); $(_this).removeClass("s");}

                var html="";
                html+="<div class='lineplus'><div class='sale'>";
                html+="<div class='icon' ontouchstart=\"$(this).closest('.shop').shop('del',this);event.preventDefault();\" "+
                      "onclick=\"$(this).closest('.shop').shop('del',this);\"><img src='res/img/default/white/cancel02.svg'/></div>";
                if (_sale.type==0) { html+="<div class='label'><div>"+_sale.value+"</div></div><div class='cell a'></div></div>"; }
                else { html+="<div class='label'>&#xA0;</div><div class='cell fixed'>"+_sale.value+"</div></div>"; }
                html+="<div class='line'><div class='total'>&#xA0;</div><div class='cell a'></div></div></div>";

                $(html).insertAfter($(_this));
                $(_this).next().find(".cell.a").each(function(){ helpers.cell.create($this, $(this));  });
                $(_this).addClass("s");
            }
        },
        whoishere: {
            run : function ($this, _callback) {
                var settings = helpers.settings($this);

                // HANDLE "alea" AND "same" VALUES
                if (settings.data[settings.it].here) {
                    if (settings.data[settings.it].here =="alea") {
                        do {  settings.data[settings.it].here = "client0"+Math.floor(Math.random()*8+1); }
                        while (settings.here==settings.data[settings.it].here);
                    }
                    else if (settings.data[settings.it].here =="same") { settings.data[settings.it].here = settings.here; }
                }

                if (settings.here && settings.here!=settings.data[settings.it].here) {
                    $this.find("#people #"+settings.here).animate({left:"-1.5em"},1000,
                        function() { $(this).hide(); helpers.whoishere.enter($this,_callback) } );
                }
                else { helpers.whoishere.enter($this, _callback); }
            },
            enter : function ($this, _callback) {
                var settings = helpers.settings($this);
                if (settings.data[settings.it].here && settings.here != settings.data[settings.it].here) {
                    settings.here = settings.data[settings.it].here;
                    $this.find("#people #"+settings.here).css("left","-1.5em").show().animate({left:0},1000, _callback);
                }
                else { _callback(); }
            }
        },
        run: function($this) {
            var settings = helpers.settings($this);

            // HANDLE CLIENTS OR PROVIDERS
            helpers.whoishere.run($this, function() {

                $this.find("#output").append("<p>build</p>");
                var data = settings.data[settings.it];

                // GET THE DIALOG TEXT
                var text = data.text;
                if (!$.isArray(text) && settings.dialog[text]) { text = settings.dialog[text]; }
                if (!$.isArray(text)) { text = [text]; }

                // DEAL WITH THE TUTORIAL TARGET
                $this.find("#background").html("").hide();
                if (typeof(data.background)!="undefined") {
					$this.find("#background").html("<img src='"+data.background+"' alt=''/>").show(); }

                $this.find("#pinvoice .good").removeClass("good");
                $this.find("#pinvoice .wrong").removeClass("wrong");
                $this.find("#pinvoice #svalid").removeClass("s");

                // HANDLE VALUE
                var gen = 0;
                if (typeof(data.value)=="string") {
                    if (data.value.indexOf("function")==-1) { gen = settings[data.value]; } else { gen = data.value; }
                }
                var vWallet = 0;
                $this.find("#pwallet .a").each( function() { vWallet+= valc[parseInt($(this).attr("class").substr(1,2))]; });
                vWallet = Math.round(vWallet*100)/100;

                if (gen) { data.value = eval('('+gen+')')({id:settings.it, wallet:vWallet, dec:settings.decimal }); }

                // HANDLE WALLET
                gen = 0;
                if (typeof(data.wallet)=="string") {
                    if (data.wallet.indexOf("function")==-1) { gen = settings[data.wallet]; } else { gen = data.wallet; }
                }

                if (gen) { data.wallet = eval('('+gen+')')(
                    {id:settings.it,value:n.toFloat($this.find("#pinvoice .cell").last().html())});
                }

                switch(data.type) {
                    case "dialog" :
                        $this.find("#pcalculator").hide(); $this.find("#calculator").removeClass("s");
                        helpers.text.run($this, { id:data.from, dialog:text},
                        function(){ helpers.next($this); } );
                        break;
                    case "bill" :
                        $this.find("#pbill .f").each(function(_index){ $(this).html(text[_index]); });
                        if (data.value==Math.floor(data.value)) { vv = data.value.toString(); }
                        else                                    { vv = data.value.toFixed(2).toString(); }
                        $this.find("#pbill #billval").html(vv.replace(".",","));
						$this.find("#pbill #payed").hide();
                        $this.find("#pbill").removeClass();
                        if (data.subtype) { $this.find("#pbill").addClass(data.subtype); }
                        helpers.fx.show($this, "bill");
                        helpers.fx.show($this, "money");
                        break;
                    case "invoice" :
                        $this.find("#pinvoice #content").html("");

                        if (data.sales) {
                            $this.find("#clientsales").html("").show();
                            for (var i in data.sales) {
                                $this.find("#clientsales").append(helpers.sale.create($this, parseInt(i)+2, data.sales[i],
                                    { top:(0.2+i*2.2)+"em", left:"0.2em" })); }
                            $this.find("#clientsales .sales").draggable({helper:"clone"});
                        }

                        $this.find("#pinvoice .footer .lineplus").detach();
                        $this.find("#pinvoice .footer .line").removeClass("s");

                        for (var i in data.value) {
                            var d = data.value[i];
                            d[0] = d[0]%products.length;
                            var hide = ((d.length>3) && (d[3]&4))?true:false;
                            var html="<div class='line' id='p"+i+"'>";
                            html+="<div class='label'><img src='res/img/svginventoryicons/"+products[d[0]]+".svg'/></div>";
                            html+="<div class='price'>"+(hide?"":d[1])+"</div>";
                            html+="<div class='quantity "+(hide?"hide":"")+"'>"+n.qty(d[2])+"</div>";
                            var vClass='cell', vVal = '';
                            if ((d.length>3) && (d[3]&1)) { vClass+=' fixed'; vVal = n.price(d[1]*d[2]); } else
                            if ((d.length>3) && (d[3]&2)) { vClass+=' highlight'; } else
                                                          { vClass+=' a'; }
                            html+="<div class='"+vClass+"'>"+vVal+"</div></div>";

                            $this.find("#pinvoice #content").append(html);
                        }
                        if (data.total) {
                            $this.find("#pinvoice .cell").last().html(data.total).addClass("fixed");
                            $this.find("#pinvoice #svalid").addClass("s");
                        }
                        else {
                            $this.find("#pinvoice .cell").last().html("").removeClass("fixed");
                            $this.find("#pinvoice #svalid").removeClass("s");
                        }
                        $this.find("#pinvoice .cell").each(function() {
                            if (!$(this).hasClass("fixed")) { helpers.cell.create($this, this); }
                        });
                        helpers.fx.show($this, "invoice");
                        $this.find("#pinvoice #content .line").droppable({accept:".sales.ss1",
                            over: function(event, ui) { $(this).addClass("over");  },
                            out: function(event, ui) { $(this).removeClass("over"); },
                            drop:function(event, ui) {
                                var $this = $(this).closest(".shop"),settings = helpers.settings($this);
                                $this.find("#pinvoice #content .line").removeClass("over");
                                if ( settings.data[settings.it].type=="invoice") {
                                    var id = parseInt($(ui.draggable).attr("id").substr(1));
                                    var sale = (id<2?settings.sales[id]:settings.data[settings.it].sales[id-2]);
                                    if (sale.product == settings.data[settings.it].value[parseInt($(this).attr("id").substr(1))][0]) {
                                        helpers.sale.add($this, this, sale);
                                    }
                                }
                            }
                        });
                        break;
                    case "sell":
                        var value = helpers.fill($this, $this.find("#pmoney>div"), data.wallet, true);
                        data.value = value - n.toFloat($this.find("#pinvoice .cell").last().html());
                        helpers.fx.show($this, "money");
                        break;
                        
                }
            });
        },
        fill: function($this, $panel, _wallet, _random) {
            var x = 0; y = 0, value = 0, $cc = [];
            for (var i in _wallet) {
                value += valc[i]*_wallet[i];
                for (var j=0; j<_wallet[i]; j++) {
                    if (x>=(i<8?6:5)) { x = 0; y=y+(i<4?1.5:2); }
                    var $c = $("<div class='v"+i+(i<8?" coin":" bill")+" a'><div><img src='res/img/coin/"+coins[i]+".svg'/></div></div>");
                    if (_random) {
                        $c.css("top", (0.1+Math.floor(Math.random()*60)/10)+"em")
                          .css("left", (0.1+Math.floor(Math.random()*(i<8?60:50))/10)+"em")
                    }
                    else {
                        $c.css("top", (0.1+y)+"em").css("left",(0.1+x)+"em");
                    }
                    x=x+0.1;
                    $cc.push($c);
                }
                if (_wallet[i]) { x=x+cc[i]; }
            }
            if (_random) {
                for (var i=0; i<10; i++) { $cc.sort(function(a,b){return 0.5-Math.random(); }); }
            }
            for (var c in $cc) {
                $panel.append($cc[c]);
                helpers.panel.draggable($this, $cc[c],false);
            }
            return value;
        },
        cell: {
            create: function($this, _this) {
                $(_this).unbind("click touchstart");
                $(_this).bind("click touchstart", function(event) {
                    var $this=$(this).closest('.shop'), settings = helpers.settings($this);
                    if (settings.data[settings.it].type=="invoice") {
                        if ($(this).hasClass("s")) { $(this).removeClass("s"); }
                        else { $this.find("#pinvoice .cell").removeClass("s"); $(this).addClass("s");
                               helpers.fx.show($this,"calculator"); }
                    }
                    event.preventDefault();
                });
            },
            next: function($this) {
                var found = false;
                $this.find("#pinvoice .cell.a").each(function() {
                    if ($(this).hasClass("s"))  { $(this).removeClass("s").removeClass("highlight"); found = true; } else
                    if (found)                  { $(this).addClass("s"); found = false; }
                });
            }
        },
        next: function($this) {
            var settings = helpers.settings($this);
            switch (settings.data[settings.it].type)
            {
                case "sell":
                    helpers.fx.hide($this,"wallet");
                    helpers.fx.hide($this,"calculator");
                    helpers.fx.hide($this,"invoice");
                    $this.find("#clientsales").html("").hide();
                    break;
            }

            if (settings.score<0) { settings.score = 0; }
            if (++settings.it<settings.data.length) { helpers.run($this); } else { helpers.end($this); }
        },
        text: {
            run: function($this, _text, _callback) {
                var settings = helpers.settings($this);
                if (settings.text.timerid) { clearTimeout(settings.text.timerid); settings.text.timerid = 0; }
                settings.text.value = _text;
                settings.text.page = 0;
                settings.text.count = 0;
                settings.text.callback = _callback;
                settings.text.available = false;
                settings.text.time  = 0;
                settings.text.pre     = $("<div></div>");
                
                $this.find("#bubbles").show();
                $this.find("#"+_text.id+" #pre").html(settings.text.pre).parent().css("opacity",0).show()
                                                .animate({opacity:0.9}, 400, function() { helpers.text.char($this); });
                    
                settings.text.width   = $this.find("#"+_text.id+" #pre").width()*0.8;
            },
            char: function($this) {
                var settings = helpers.settings($this);
                settings.text.available = true;
                if (!settings.text.time) { settings.text.time  = Date.now(); }
                var count = Math.floor((Date.now()-settings.text.time)/30);
                if (settings.text.count<settings.text.value.dialog[settings.text.page].length) {
                    
                    for (var i=settings.text.count; i<count; i++) {
                        var c = settings.text.value.dialog[settings.text.page][i];
                        if (c=='|' || (c==' ' && settings.text.pre.width()>settings.text.width)) {
                            var tmp = $("<div></div>");
                            settings.text.pre.parent().append("<br/>").append(tmp);
                            settings.text.pre = tmp;
                        } else { settings.text.pre.append(c); }
                    }
                    settings.text.count = count;
                    settings.text.timerid = setTimeout(function() { helpers.text.char($this); }, 2);
                }
                else { settings.text.timerid = 0; settings.text.time  = 0; }
            },
            click: function($this) {
                var settings = helpers.settings($this);
                if (settings.text.available) {
                    if (settings.text.timerid) {
                        clearTimeout(settings.text.timerid); settings.text.timerid = 0; settings.text.time = 0;
                        for (var i=settings.text.count; i<settings.text.value.dialog[settings.text.page].length; i++) {
                            var c = settings.text.value.dialog[settings.text.page][i];
                            if (c=='|' || (c==' ' && settings.text.pre.width()>settings.text.width)) {
                                var tmp = $("<div></div>");
                                settings.text.pre.parent().append("<br/>").append(tmp);
                                settings.text.pre = tmp;
                            } else { settings.text.pre.append(c); }
                        }
                    }
                    else {
                        settings.text.count=0;
                        if (++settings.text.page<settings.text.value.dialog.length) {
                            var tmp = $("<div></div>");
                            settings.text.pre.parent().html(tmp);
                            settings.text.pre = tmp;
                            helpers.text.char($this);
                        }
                        else {
                            settings.text.available = false;
                            $this.find("#"+settings.text.value.id).animate({opacity:0},400, function() {
                                $(this).hide().parent().hide();
                                if (settings.text.callback) { settings.text.callback(); }
                            });
                        }
                    }
                }
            }
        },
        fx : {
            show : function($this, _p) {
                $this.find("#menu #"+_p).addClass("s");
                $this.find("#p"+_p).show().animate({opacity:1}, 500); 
            },
            hide : function($this, _p,_delay) {
                $this.find("#menu #"+_p).removeClass("s");
                $this.find("#p"+_p).delay(_delay?_delay:0).animate({opacity:0}, 500,  function() { $(this).hide(); }); 
            }
        },
        pos: function(_$elt,_val) {
            var ret = _$elt.css(_val);
            return parseFloat(ret);
        },
        panel: {
            inside: function($this, $elt, _factor) {
                if (!_factor) { _factor = 1; }
                var pos = [ helpers.pos($elt,"left"), helpers.pos($elt,"top")];
                var maxw = $elt.parent().width() - $elt.width()*_factor;
                var maxh = $elt.parent().height() - $elt.height()*_factor;

                if (pos[0]<0)       { pos[0] = 0; $elt.animate({left:0},100); }
                if (pos[1]<0)       { pos[1] = 0; $elt.animate({top:0},100); }
                if (pos[0]>maxw)    { pos[0] = maxw; $elt.animate({left:maxw},100); }
                if (pos[1]>maxh)    { pos[1] = maxh; $elt.animate({top:maxh},100); }

                return pos;
            },
            draggable: function($this, $elt, _check) {
                if (_check) { helpers.panel.inside($this, $elt); }
                $elt.draggable({containment:$this.find("#board"), stack:".a", revert:true}).css("position","absolute");
            }
        },
        // Handle the key input
        key: function($this, value, fromkeyboard) {
            var settings = helpers.settings($this);
            if (value==".") {
                if (settings.calculator.indexOf(".")==-1 && settings.calculator.length<5) {
                    settings.calculator+=(settings.calculator.length?"":"0")+"."; } }
            else if (value=="c") { settings.calculator=""; }
            else if (value=="v") {
                $this.find("#pinvoice .cell.s").html(n.price(settings.calculator));
                helpers.cell.next($this);
                settings.calculator="";
                $this.find("#pinvoice #svalid").toggleClass("s", ($this.find("#pinvoice .footer .cell").last().html().length!=0) );
            }
            else if (settings.calculator.length<6) {
                if (value=="0" && settings.calculator.length<2 && settings.calculator[0]=='0') {}
                else {
                    if (settings.calculator.length==1 && settings.calculator[0]=='0') { settings.calculator=""; }
                    settings.calculator+=value.toString();
                }
            }
            $this.find("#screen").html(settings.calculator.length?settings.calculator:"0");
        },
        money: function($this) {
            var settings = helpers.settings($this);
            var value = 0;
            var itsgood = false;
            $this.find("#pmoney .a").each( function() { value+= valc[parseInt($(this).attr("class").substr(1,2))]; });
            settings.interactive = false;
            value = Math.round(value*100)/100;

            switch(settings.data[settings.it].type) {
                case "bill" :
                case "sell" :
                    if (Math.round(value*100)==Math.round(settings.data[settings.it].value*100)) { itsgood = true; }
                break;
            }

            if (itsgood) {
				$this.find("#good.fx").show();
                $this.find("#pmoney").addClass("good");
                $this.find("#pmoney .a").animate({opacity:0},500, function() { $(this).detach(); });
                helpers.fx.hide($this,"money",200);
				$this.find("#pbill #payed").show();
				helpers.fx.hide($this,"bill",800);
				$this.find("#background").hide();
                setTimeout(function() { helpers.next($this); },2000);
            }
            else {
				$this.find("#wrong.fx").show();
                settings.score -= settings.errratio;
                $this.find("#pmoney").addClass("wrong");
            }
            setTimeout(function() {
				$this.find("#pmoney").removeClass("good").removeClass("wrong");
				$this.find(".fx").hide();
				settings.interactive = true;
			}, 800);
        }
    };

    // The plugin
    $.fn.shop = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    calculator      : "",
                    timerid         : 0,
                    it              : 0,
                    here            : "",
                    text            : { timerid : 0, value:{}, page:0, count: 0, callback:0, time:0 , width:100, pre:0 },
                    coins           : { wallet: 0 },
                    score           : 5,
                    sketchbook      : { svg:0, g:0, path:0, ratio:1,  last:[0,0], offset:[0,0]}
                };

                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);

                    var $settings = $.extend({}, defaults, options, settings);
                    var checkContext = helpers.checkContext($settings);
                    if (checkContext.length) {
                        alert("CONTEXT ERROR:\n"+checkContext);
                    }
                    else {
                        $this.removeClass();
                        if ($settings["class"]) { $this.addClass($settings["class"]); }
                        helpers.settings($this.addClass(defaults.name), $settings);
                        helpers.loader.css($this);
                    }
                });
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (!settings.interactive) {
                    settings.interactive = true;
                    helpers.run($this);
                }
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            },
            menu: function(_id) {
                var $this = $(this) , settings = helpers.settings($this);
                if ($this.find("#p"+_id).is(":visible")) {
                    helpers.fx.hide($this, _id);
                } else {
                    if (_id=="calculator") { settings.calculator=""; }
                    helpers.fx.show($this, _id);
                    if (_id=="sketchbook") {
                        settings.sketchbook.ratio = 640/$this.find("#psketchbook").width();
                        settings.sketchbook.offset = [ $this.find("#psketchbook").offset().left, $this.find("#psketchbook").offset().top];
                    }
                }
            },
            key: function(value, _elt) {
                var $this = $(this);
                if (_elt) { $(_elt).addClass("touch");
                    setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
                }
                helpers.key($(this), value, false);
            },
            clear: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $(settings.sketchbook.g).empty();
            },
            del: function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
                var $sale = $(_elt).parent().parent();
                if ( settings.data[settings.it].type=="invoice") {
                    $sale.prev().removeClass("s");
                    $sale.detach();
                }
            },
            bubbles: function() { helpers.text.click($(this)); },
            valid: function() { helpers.money($(this)); },
            confirm: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.data[settings.it].type=="invoice" && $this.find("#pinvoice #svalid").hasClass("s")) {
                    var good=true;

                    // GLOBAL SALES / SALES BY PRODUCT
                    var sg = [], sp = [];
                    if (settings.sales) for (var i in settings.sales) {
                        var s = settings.sales[i]; if (s.product == -1) { sg.push(s) } else { sp.push(s); }
                    }
                    if (settings.data[settings.it].sales) for (var i in settings.data[settings.it].sales) {
                        var s = settings.data[settings.it].sales[i]; if (s.product == -1) { sg.push(s) } else { sp.push(s); }
                    }

                    // CHECK PRODUCT SALES
                    var sby = [], total = 0, reduc = 0;
                    for (var i in settings.data[settings.it].value) {
                        var pp = settings.data[settings.it].value[i];
                        var ss=[Math.floor(pp[1]*pp[2]*100+0.01)/100,0];
                        for (var i in sp) {
                            if ( (sp[i].product==pp[0]) &&
                                 (!sp[i].cond || (sp[i].mode?(sp[i].cond<pp[2]):(sp[i].cond<ss[0])) ) )
                            {
                                var val = sp[i].type?sp[i].value:ss[0]*sp[i].value/100;
                                if (val>=ss[0]) { val = 0; }
                                if (ss[1]<val) { ss[1] = val; }
                            }
                        }
                        total += ss[0];
                        reduc += ss[1];
                        sby.push(ss);
                    }
                    var max = 0;
                    for (var i in sg) if (!sg[i].cond || sg[i].cond<total) {
                        var val = sg[i].type?sg[i].value:total*sg[i].value/100;
                        if (val>=total) { val = 0; }
                        if (max<val) { max = val; }
                    }

                    var global = (max>reduc);
                    total=Math.round(total*100)/100;

                    //alert(sby+" "+total+" : "+reduc+" / "+max+" = "+global);

                    // CHECK PRODUCT LINES
                    for (var i in settings.data[settings.it].value) {
                        var pp = settings.data[settings.it].value[i];
                        var ss = sby[i];
                        var $line = $this.find("#pinvoice .line#p"+i);
                        var w = ( n.toFloat($line.find(".quantity").html())!=pp[2] ||
                                  n.toFloat($line.find(".cell").html()) != ss[0]);
                        var wplus = false;

                        if ($line.hasClass("s")) {
                            if (global || !ss[1]) { w = true; } else {
                                // CHECK THE SALE
                                var $lineplus = $line.next();
                                if (n.toFloat($lineplus.find(".sale .cell").html()) != Math.round(ss[1]*100)/100) {
                                    wplus = true; $lineplus.find(".sale").addClass("wrong");
                                }
                                if (n.toFloat($lineplus.find(".line .cell").html()) != Math.round((ss[0] - ss[1])*100)/100) {
                                    wplus = true; $lineplus.find(".line").addClass("wrong");
                                }
                            }
                        }
                        else { if (!global && ss[1]) { w = true; } }

                        if (w) { $line.addClass("wrong"); }
                        good = good & !w & !wplus;
                    }
                    // CHECK TOTAL
                    var $line = $this.find("#pinvoice .footer>.line");
                    if (n.toFloat($line.find(".cell").html()) != Math.round((total - (global?0:reduc))*100)/100) {
                        good = false; $line.addClass("wrong");
                    }
                    if ($line.hasClass("s")) {
                        if (global) {
                            var $lineplus = $line.next();
                            if (n.toFloat($lineplus.find(".sale .cell").html()) != Math.round(max*100)/100 ) {
                                good = false; $lineplus.find(".sale").addClass("wrong");
                            }
                            if (n.toFloat($lineplus.find(".line .cell").html()) != Math.round((total - max)*100)/100) {
                                good = false; $lineplus.find(".line").addClass("wrong");
                            }
                        }
                        else { good = false; $line.addClass("wrong"); }
                    }
                    else { if (global) { good = false; $line.addClass("wrong"); } }

                    if (good) {
                        $this.find("#pinvoice #svalid").addClass("good");
						$this.find("#background").hide();

                        var vVal = n.toFloat($this.find("#pinvoice .cell").last().html());
                        var vTr = settings.locale.tr1;
                        if (Math.floor(vVal)!=vVal) { vTr = settings.locale.tr2; }
                        var vTt = vTr[Math.floor(Math.random()*vTr.length)];
                        vTt = vTt.replace("X",Math.floor(vVal).toString()).replace("Y",(Math.round(vVal*100)%100).toString());

                        helpers.fx.hide($this,"calculator");
                        helpers.fx.hide($this,"sketchbook");

                        helpers.text.run($this, { id:"owner", dialog:[vTt]}, function(){ helpers.next($this); } );
                    }
                    else {
                        setTimeout(function() { $this.find("#pinvoice .wrong").removeClass("wrong"); },1000);
                    }
                }
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in shop plugin!'); }
    };
})(jQuery);

