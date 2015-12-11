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

    var coins = [ "cent1","cent2","cent5","cent10","cent20","cent50","coin1b","coin2","bill5","bill10","bill20","bill50","bill100" ];
    var valc = [ 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100 ];
    var cc = [ 0.9, 1.1, 1.3, 1.1, 1.5, 2, 1.7, 2, 0.5, 0.5, 0.5, 0.5, 1];
    var change = [ [[0,1]], [[0,2]], [[0,1],[1,2]], [[2,2]], [[3,2]], [[3,1],[4,2]], [[5,2]], [[6,2]], [[6,1],[7,2]], [[8,2]],
                   [[9,2]], [[9,1],[10,2]], [[11,2]] ];
    var products = [ "vegetable/banana01","vegetable/strawberry01","vegetable/cherry02","vegetable/tomato01","vegetable/pepper01" ];

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
            $this.unbind("mouseup mousedown mousemove mouseout touchstart touchmove touchend touchleave");
        },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this,{'status':'success','score':settings.score});
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
                    $("head").append("<link>");
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

                $this.css("font-size", Math.floor($this.height()/12)+"px");
/*
                $this.find("#pcalculator").draggable({containment:$this.find("#board"), stack:".pstack", handle:"#screen"});
                $this.find(".wallet").draggable({containment:$this.find("#board"), stack:".pstack"});
                $this.find("#pbill").draggable({containment:$this.find("#board"), stack:".pstack"});
*/

                if (settings.menu) {
                    $this.find("#menu .tab").hide();
                    for (var i in settings.menu) { $this.find("#menu #"+settings.menu[i]).show(); }
                }

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
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        whoishere: {
            run : function ($this, _callback) {
                var settings = helpers.settings($this);
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

                var data = settings.data[settings.it];

                // GET THE DIALOG TEXT
                var text = data.text;
                if (!$.isArray(text) && settings.dialog[text]) { text = settings.dialog[text]; }
                if (!$.isArray(text)) { text = [text]; }

                // DEAL WITH THE TUTORIAL TARGET
                $this.find("#target").hide();
                if (typeof(data.target)!="undefined") { $this.find("#target").css("left",(data.target*1.1)+"em").show(); }

                $this.find("#pinvoice .good").removeClass("good");
                $this.find("#pinvoice .wrong").removeClass("wrong");
                $this.find("#pinvoice #svalid").removeClass("s");

                // HANDLE VALUE
                var gen = 0;
                if (typeof(data.value)=="string") {
                    if (data.value.indexOf("function")==-1) { gen = settings[data.value]; } else { gen = data.value; }
                }
                if (gen) { data.value = eval('('+gen+')')({id:settings.it}); }

                // HANDLE WALLET
                gen = 0;
                if (typeof(data.wallet)=="string") {
                    if (data.wallet.indexOf("function")==-1) { gen = settings[data.wallet]; } else { gen = data.wallet; }
                }
                if (gen) { data.wallet = eval('('+gen+')')(
                    {id:settings.it,value:parseFloat($this.find("#pinvoice .final .cell").html())});
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
                        $this.find("#pbill").removeClass();
                        if (data.subtype) { $this.find("#pbill").addClass(data.subtype); }
                        helpers.fx.show($this, "bill");
                        helpers.fx.show($this, "money");
                        break;
                    case "invoice" :
                        $this.find("#pinvoice #content").html("");
                        for (var i in data.value) {
                            var d = data.value[i];
                            d[0] = d[0]%products.length;
                            var html="<div class='line'>";
                            html+="<div class='label'><img src='res/img/svginventoryicons/"+products[d[0]]+".svg'/></div>";
                            html+="<div class='price'>"+d[1]+"</div>";
                            html+="<div class='quantity'>"+d[2]+"</div>";
                            var vClass='cell', vVal = '';
                            if ((d.length>3) && (d[3]&1)) { vClass+=' fixed'; vVal = (d[1]*d[2]).toString().replace('.',','); }
                            if ((d.length>3) && (d[3]&2)) { vClass+=' highlight'; }
                            html+="<div class='"+vClass+"'>"+vVal+"</div></div>";
                            $this.find("#pinvoice #content").append(html);
                        }
                        if (data.total) {
                            $this.find("#pinvoice .final .cell").html(data.total).addClass("fixed");
                            $this.find("#pinvoice #svalid").addClass("s");
                        }
                        else {
                            $this.find("#pinvoice .final .cell").html("").removeClass("fixed");
                            $this.find("#pinvoice #svalid").removeClass("s");
                        }
                        $this.find("#pinvoice .cell").each(function() {
                            if (!$(this).hasClass("fixed")) { helpers.cell.create($this, this); }
                        });
                        helpers.fx.show($this, "invoice");
                        break;
                    case "sell":
                        var value = helpers.fill($this, $this.find("#pmoney>div"), data.wallet, true);
                        data.value = value - parseFloat($this.find("#pinvoice .final .cell").html());
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
                    if ($(this).hasClass("s")) { $(this).removeClass("s"); }
                    else { $this.find("#pinvoice .cell").removeClass("s"); $(this).addClass("s");
                           helpers.fx.show($this,"calculator"); }
                    event.preventDefault();
                });
            },
            next: function($this) {
                var found = false;
                $this.find("#pinvoice .cell").each(function() {
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
                $this.find("#bubbles").show();
                $this.find("#"+_text.id+" .content").html("").parent().css("opacity",0).show().animate({opacity:0.9}, 400, function() {
                    helpers.text.char($this); });
            },
            char: function($this) {
                var settings = helpers.settings($this);
                settings.text.available = true;
                if (settings.text.count<settings.text.value.dialog[settings.text.page].length) {
                    $this.find("#"+settings.text.value.id+" .content").append(settings.text.value.dialog[settings.text.page][settings.text.count]);
                    settings.text.count++;
                    settings.text.timerid = setTimeout(function() { helpers.text.char($this); }, 10);
                }
                else { settings.text.timerid = 0; }
            },
            click: function($this) {
                var settings = helpers.settings($this);
                if (settings.text.available) {
                    if (settings.text.timerid) {
                        clearTimeout(settings.text.timerid); settings.text.timerid = 0;
                        $this.find("#"+settings.text.value.id+" .content").html(settings.text.value.dialog[settings.text.page]);
                    }
                    else {
                        settings.text.count=0;
                        if (++settings.text.page<settings.text.value.dialog.length) {
                            $this.find("#"+settings.text.value.id+" .content").html("");
                            helpers.text.char($this);
                        }
                        else {
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
                $this.find("#pinvoice .cell.s").html(settings.calculator);
                helpers.cell.next($this);
                settings.calculator="";
                $this.find("#pinvoice #svalid").toggleClass("s", ($this.find("#pinvoice .footer .cell").html().length!=0) );
            }
            else if (settings.calculator.length<6) {
                if (value=="0" && settings.calculator.length && settings.calculator[0]=='0') {}
                else { settings.calculator+=value.toString(); }
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
                    if (value==settings.data[settings.it].value) { itsgood = true; }
                break;
            }
            if (itsgood) {
                $this.find("#pmoney").addClass("good");
                $this.find("#pmoney .a").animate({opacity:0},500, function() { $(this).detach(); });
                helpers.fx.hide($this,"money",200); helpers.fx.hide($this,"bill");
                setTimeout(function() { helpers.next($this); },1000);
            }
            else {
                settings.score -= settings.errratio;
                $this.find("#pmoney").addClass("wrong");
            }
            setTimeout(function() { $this.find("#pmoney").removeClass("good").removeClass("wrong"); settings.interactive = true; }, 800);
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
                    text            : { timerid : 0, value:{}, page:0, count: 0, callback:0},
                    coins           : { wallet: 0 },
                    score           : 5
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
                }
            },
            key: function(value, _elt) {
                var $this = $(this);
                if (_elt) { $(_elt).addClass("touch");
                    setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
                }
                helpers.key($(this), value, false);
            },
            bubbles: function() { helpers.text.click($(this)); },
            valid: function() { helpers.money($(this)); },
            confirm: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if ($this.find("#pinvoice #svalid").hasClass("s")) {
                    $this.find("#pinvoice #svalid").addClass("good");

                    var vVal = parseFloat($this.find("#pinvoice .final .cell").html());
                    var vTr = settings.locale.tr1;
                    if (Math.floor(vVal)!=vVal) { vTr = settings.locale.tr1; }
                    var vTt = vTr[Math.floor(Math.random()*vTr.length)];
                    vTt = vTt.replace("X",Math.floor(vVal).toString()).replace("Y",((vVal*100)%10).toString());

                    helpers.text.run($this, { id:"owner", dialog:[vTt]},
                        function(){ helpers.next($this); } );
                }
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in shop plugin!'); }
    };
})(jQuery);

