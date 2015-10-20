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
        debug       : true                                     // Debug mode
    };

    var coins = [ "cent1","cent2","cent5","cent10","cent20","cent50","coin1b","coin2","bill5","bill10","bill20","bill50","bill100" ];
    var cc = [ 0.9, 1.1, 1.3, 1.1, 1.5, 2, 1.7, 2, 0.5, 0.5, 0.5, 0.5, 1];
    var change = [ [[0,1]], [[0,2]], [[0,1],[1,2]], [[2,2]], [[3,2]], [[3,1],[4,2]], [[5,2]], [[6,2]], [[6,1],[7,2]], [[8,2]],
                   [[9,2]], [[9,1],[10,2]], [[11,2]] ];

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

                $this.find("#pcalculator").draggable({containment:$this.find("#board"), stack:".panel", handle:"#screen"});
                $this.find(".wallet").draggable({containment:$this.find("#board"), stack:".panel"});

                // Fill the wallet
                var x = 0; y = 0;
                for (var i in settings.wallet) {
                    for (var j=0; j<settings.wallet[i]; j++) {
                        if (x>=(i<8?6:5)) { x = 0; y=y+(i<4?1.5:2); }
                        var c = $("<div class='v"+i+(i<8?" coin":" bill")+" a'><div><img src='res/img/coin/"+coins[i]+".svg'/></div></div>");
                        
                        c.css("top", (0.1+y)+"em").css("left",(0.1+x)+"em");
                        x=x+0.1;
                        $this.find("#pwallet>div").append(c);
                    }
                    x=x+cc[i];
                }
                $this.find(".a").each(function() { helpers.panel.draggable($this, $(this)); });

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
                            pos = helpers.panel.inside($this, $coin,1.4);
                            $this.find("#pmask").css("opacity",0).show().animate({opacity:1},500,function() {
                                $coin.detach();
                                var vWidth = $(this).width();
                                var id = parseInt($coin.attr("class").substr(1,2));
                                var count = 0;
                                for (var i in change[id]) for (var j=0; j<change[id][i][1]; j++) {
                                    var ii = change[id][i][0];
                                    var $c = $("<div class='v"+ii+(ii<8?" coin":" bill")+" a'><div><img src='res/img/coin/"+coins[ii]+".svg'/></div></div>");
                                    $c.css("left",(pos[0]+count*vWidth/10)+"px").css("top",(pos[1]+count*vWidth/10)+"px");
                                    $this.find("#pchange>div").append($c);
                                    helpers.panel.draggable($this, $c);
                                    count++;
                                }

                                $this.find("#pmask").animate({opacity:0.2},500,function(){ $(this).hide(); });
                            });
                        }
                        else {
                            helpers.panel.draggable($this, $coin);
                        }

                }
                });

                $this.find("#pmoney").show();
                for (var i=0;i<10;i++)
                helpers.panel.add($this, "#pmoney", Math.floor(Math.random()*12));

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
                if (settings.here != settings.data[settings.it].here) {
                    settings.here = settings.data[settings.it].here;
                    $this.find("#people #"+settings.here).css("left","-1.5em").show().animate({left:0},1000, _callback);
                }
                else { _callback(); }
            }
        },
        run: function($this) {
            var settings = helpers.settings($this);
            helpers.whoishere.run($this, function() {
                switch(settings.data[settings.it].type) {
                    case "dialog" :
                        var dialog = settings.data[settings.it].value;
                        if (!$.isArray(dialog) && settings.dialog[dialog]) { dialog = settings.dialog[dialog]; }
                        if (!$.isArray(dialog)) { dialog = [dialog]; }
                        helpers.text.run($this, { id:settings.data[settings.it].from, dialog:dialog},
                        function(){ helpers.next($this); } );
                        break;
                }
            });
        },
        next: function($this) {
            var settings = helpers.settings($this);
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
        pos: function(_$elt,_val) {
            var ret = _$elt.css(_val);
            return parseFloat(ret);
        },
        panel: {
            zindex: function($this, _id) {
                if (_id[0]!='p') { _id = 'p'+_id; }
                var zindex=0;
                $this.find(".panel").each(function() {
                    var z = $(this).css("z-index");
                    if (z!="auto" && parseInt(z)>zindex) { zindex=z; }});
                if (zindex) { $this.find("#"+_id).css("z-index",zindex+1); }
            },
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
            draggable: function($this, $elt) {
                helpers.panel.inside($this, $elt);
                $elt.draggable({containment:$this.find("#board"), stack:".a", revert:true,
                    start:function(event, ui) {
                        helpers.panel.zindex($this, $(this).closest(".panel").attr("id"));
                    }
                });
            },
            add: function($this, _elt, _coin) {
                var $c = $("<div class='v"+_coin+(_coin<8?" coin":" bill")+" a'>"+
                          "<div><img src='res/img/coin/"+coins[_coin]+".svg'/></div></div>");
                $this.find(_elt+">div").append($c);
                $c.css("top", (Math.random()*6)+"em").css("left",(Math.random()*5)+"em");
                helpers.panel.draggable($this,$c);
            }
        },
        // Handle the key input
        key: function($this, value, fromkeyboard) {
            var settings = helpers.settings($this);
            if (value==".") {
                if (settings.calculator.indexOf(".")==-1 && settings.calculator.length<5) {
                    settings.calculator+=(settings.calculator.length?"":"0")+"."; } }
            else if (value=="c") { settings.calculator=""; }
            else if (value=="v") { settings.calculator="";}
            else if (settings.calculator.length<6) {
                if (value=="0" && settings.calculator.length && settings.calculator[0]=='0') {}
                else { settings.calculator+=value.toString(); }
            }
            $this.find("#screen").html(settings.calculator.length?settings.calculator:"0");
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
                    coins           : { wallet: 0 }
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
                settings.interactive = true;
                helpers.run($this);
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            },
            menu: function(_id) {
                var $this = $(this) , settings = helpers.settings($this);
                if ($this.find("#p"+_id).is(":visible")) {
                    $this.find("#p"+_id).hide();
                    $this.find("#"+_id).removeClass("s");
                } else {
                    helpers.panel.zindex($this,_id);
                    if (_id=="calculator") { settings.calculator=""; }
                    $this.find("#p"+_id).show();
                    $this.find("#"+_id).addClass("s");
                }
            },
            key: function(value, _elt) {
                var $this = $(this);
                if (_elt) { $(_elt).addClass("touch");
                    setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
                }
                helpers.key($(this), value, false);
            },
            bubbles: function() { helpers.text.click($(this)); }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in shop plugin!'); }
    };
})(jQuery);

