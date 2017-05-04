(function($) {
    // Activity default options
    var defaults = {
        name        : "cards",                            // The activity name
        label       : "Cards",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        exercice    : [],                                       // Exercice
        back        : "res/img/cards/00back02.svg",            // Back image
        font        : 1.2, 
        debug       : true                                     // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[strong\\\](.+)\\\[/strong\\\]",        "<div class='strong'>$1</div>"
    ];
    
    var topx=function(_x) { return 0.3+_x*2.6; }
    var lefty=function(_y) { return 0.5+_y*1.8; }
    var colors=["hearts","spades","diamonds","clubs"];
    var values=["01","02","03","04","05","06","07","08","09","10","11","12","13"];

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
        // End all timers
        quit: function($this) {
            var settings = helpers.settings($this);
            // if (settings.timerid) { clearTimeout(settings.timerid); }
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

                $this.css("font-size", ($this.height()/12)+"px");
                $this.find("#board").css("font-size", settings.font+"em");

                // Locale handling
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }
                
                // Prepare cards
                if (settings.cards) {
                    for (var i in settings.cards) {
                        var c = settings.cards[i];
                        settings.data[i] = [];
                        if (c.type=="c52") { for (var k=0;k<52;k++) { settings.data[i].push({value:k});  } }
                        else if (c.data) {
                            for (var j in c.data) {
                                var elt=$.extend({},c.data[j]);
                                if (c.font) { elt.font = c.font; }
                                settings.data[i].push(elt);
                            }
                        }
                    }
                }
                else { settings.data.c52 = []; for (var i=0;i<52;i++) { settings.data.c52.push({value:i});  } }
                
                for (var i in settings.data) { for (var k=0;k<50;k++) { settings.data[i].sort(function(){return Math.random()>0.5; }); } }
                
                // Prepare gaming elements
                $this.find("#board").html("");
                var elts=["stock","waste","foundation","rowstack"];
                for (var i in elts) {
                    var e = elts[i];
                    if (settings[e])     {
                        var elt = helpers.build[e]($this, settings[e]);
                        settings.elts[elt.id]=elt;
                    }
                    if (settings[e+"s"]) { for (var j in settings[e+"s"]) {
                        var elt = helpers.build[e]($this, settings[e+"s"][j]);
                        settings.elts[elt.id]=elt;
                    }}
                }
                
                for (var i in settings.elts) {
                    $this.find("#board").append(settings.elts[i].$html);
                    settings.elts[i].update();
                }
                
                // Optional devmode
                if (settings.dev) { $this.find("#devmode").show(); }

                // Exercice
                $this.find("#exercice").html(helpers.format(settings.exercice));

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        getElt: function($this, _id) {
            var settings = helpers.settings($this);
            var ret = 0;
            for (var i in settings.elts) {
                if (settings.elts[i].id==_id) { ret = settings.elts[i]; break; }
                for (var j in settings.elts[i].cards) {  if (settings.elts[i].cards[j].id==_id) { ret = settings.elts[i]; break; } }
            }
            return ret;
        },
        getCard: function($this, _id) {
            var settings = helpers.settings($this);
            var ret = 0;
            for (var i in settings.elts) {
                for (var j in settings.elts[i].cards) {  if (settings.elts[i].cards[j].id==_id) { ret = settings.elts[i].cards[j]; break; } }
            }
            return ret;
        },
        build: {
            id : { stock:0, waste: 0, foundation: 0, rowstack: 0, cards : 0},
            droppable: function($elt, _args) {
                $elt.addClass("droppable").droppable({
                    over: function( event, ui ) { $(this).addClass("s"); },
                    out: function( event, ui )  { $(this).removeClass("s"); },
                    drop: function( event, ui ) {
                        var $this=$(this).closest(".cards");
                        var settings = helpers.settings($this);
                        $(this).parent().find(".s").removeClass("s");
                        var from    = helpers.getElt($this, ui.draggable.attr("id"));
                        var to      = helpers.getElt($this, $(this).attr("id"));
                        var c       = helpers.getCard($this, ui.draggable.attr("id"));
                        var up      = 0;
                        var accept  = to.accept;
                        var ok      = true;
                        
                        if (to.isempty()) { if (to.first) { accept = to.first; } }
                        else              { up = to.cards[0]; }

                        switch(accept) {
case "heartsup" :   ok =(typeof(c.value)!="undefined" && c.value>=0  && c.value<13 && c.value%13==to.cards.length); break;
case "spadesup" :   ok =(typeof(c.value)!="undefined" && c.value>=13 && c.value<26 && c.value%13==to.cards.length); break;
case "diamondsup":  ok =(typeof(c.value)!="undefined" && c.value>=26 && c.value<39 && c.value%13==to.cards.length); break;
case "clubsup" :    ok =(typeof(c.value)!="undefined" && c.value>=39 && c.value<52 && c.value%13==to.cards.length); break;
                        }
                        
                        if (ok) {
                            var elt     = from.cards.pop();
                            to.cards.push(elt);
                            
                            // avoid the draggable revert: maybe better way?
                            elt.$html=ui.draggable.clone();
                            elt.$html.appendTo($(this).parent());
                            ui.draggable.detach();
                            
                            to.update();
                            from.update();
                        }
                    }
                });
            },
            stock: function($this, _data) {
                var settings = helpers.settings($this);
                var ret = {
                    id          : "s"+helpers.build.id.stock++,
                    pos         : [_data.pos[0], _data.pos[1]],
                    type        : "stock",
                    waste       : _data.waste?"w"+_data.waste:"w0",
                    cards       : [],
                    nbcards     : 52,
                    number      : 1,
                    isempty     : function() { return (this.cards.length==0); },
                    update      : function() {
                        this.$html.html(this.isempty()?"":"<div class='card'><img src='"+settings.back+"'/></div>");
                    }                        
                };
                
                // Compute number of cards
                if (_data.nbcards) { ret.nbcards = _data.nbcards; }
                else {
                    if (_data.cards) {
                        if ($.isArray(_data.cards)) {
                            ret.nbcards = 0;
                            for (var i in _data.cards) { ret.nbcards += settings.data[_data.cards[i]].length; }
                        }
                        else { ret.nbcards = settings.data[_data.cards].length; }
                    }
                }
                
                // Fill cards and sort
                while (ret.cards.length<ret.nbcards) {
                    var c = "c52";
                    if (_data.cards) {
                        if ($.isArray(_data.cards)) { var i=Math.floor(Math.random()*_data.cards.length); c=_data.cards[i]; }
                        else                        { c=_data.cards; }
                    }
                    if (settings.data[c].length) {
                        var card = settings.data[c].pop();
                        card.id  = "c"+helpers.build.id.cards++;
                        card.$html = $("<div class='card' id='"+card.id+"'><div class='back'>"+
                                       "<img src='"+settings.back+"' alt=''/></div><div class='front'></div></div>");
                        if (typeof(card.value) != 'undefined') {
                            card.$html.find(".front").append("<img src='res/img/cards/"+values[card.value%13]+
                                              colors[Math.floor(card.value/13)]+".svg' alt=''/>");
                        }
                        else if (card.label) {
                            var font=0.5*(card.font?card.font:1);
                            if (card.img) {
                                card.$html.addClass("withimg")
                                          .find(".front").append("<div class='img'><img src='"+card.img+"' alt=''/></div>");
                            }
                            card.$html.addClass("withtxt blank")
                                      .find(".front").append("<div class='txt'><span style='font-size:"+font+"em;'>"+card.label+"<span></div>");
                        }
                        else if (card.img) {
                            card.$html.addClass("blank withimg")
                                      .find(".front").append("<div class='img'><img src='"+card.img+"' alt=''/></div>");
                        }
                        $this.find("#board").append(card.$html.hide());
                        ret.cards.push(card);
                    }
                }
                
                ret.$html = $("<div class='card slot stock' id='"+ret.id+"'></div>");
                ret.$html.css("top",topx(_data.pos[1])+"em").css("left",lefty(_data.pos[0])+"em");
                
                ret.$html.bind("mousedown touchstart", function(_event) {
                    var $this    = $(this).closest(".cards");
                    var settings = helpers.settings($this);
                    var stock    = settings.elts[$(this).attr("id")];
                    if (stock.isempty()) {
                        while (!settings.elts[stock.waste].isempty()) {
                            var elt = settings.elts[stock.waste].cards.pop();
                            elt.$html.hide();
                            stock.cards.push(elt);
                        }
                    }
                    else {
                        var cpt      = 0;
                        while (cpt<stock.number && !stock.isempty()) {
                            settings.elts[stock.waste].cards.push(stock.cards.pop());
                            cpt++;
                        }
                    }
                    stock.update($this);
                    settings.elts[stock.waste].update();
                    _event.preventDefault();
                });
                    
                return ret;
            },
            waste: function($this, _data) {
                var settings = helpers.settings($this);
                var ret = {
                    id      : "w"+helpers.build.id.waste++,
                    pos     : [_data.pos[0], _data.pos[1]],
                    type    : "waste",
                    stock   : _data.stock?"s"+_data.stock:"s0",
                    fanned  : _data.fanned?[_data.fanned[0],_data.fanned[1]]:[0,0],
                    cards   : [],
                    isempty : function() { return (this.cards.length==0); },
                    update  : function() {
                        if (this.isempty()) { this.$html.html(""); }
                        else {
                            for (var i=0; i<this.cards.length; i++) {
                                var c=this.cards[i];
                                c.$html.css("top",(topx(this.pos[1])+this.fanned[1]*i)+"em")
                                       .css("left",(lefty(this.pos[0])+this.fanned[0]*i)+"em")
                                       .css("z-index",i)
                                       .show();
                            }
                            var $last = this.cards[this.cards.length-1].$html;
                            if ($last) {
                                $last.draggable({
                                        revert:true, zIndex:100,
                                        stop: function( event, ui ) { $(this).parent().find(".s").removeClass("s"); }
                                    }).css("position","absolute");
                            }
                        }
                        
                    }
                };
                ret.$html = $("<div class='card slot waste' id='"+ret.id+"'></div>");
                ret.$html.css("top",topx(ret.pos[1])+"em").css("left",lefty(ret.pos[0])+"em");
                
                return ret;
            },
            foundation: function($this, _data) {
                var settings = helpers.settings($this);
                var ret = {
                    id      : "f"+helpers.build.id.foundation++,
                    type    : "foundation",
                    fanned  : _data.fanned?[_data.fanned[0],_data.fanned[1]]:[0,0],
                    pos     : [_data.pos[0], _data.pos[1]],
                    cards   : [],
                    isempty : function() { return (this.cards.length==0); },
                    bg      : _data.background?_data.background:"res/img/cards/00drop01.svg",
                    accept  : _data.accept,
                    update  : function() {
                        for (var i=0; i<this.cards.length; i++) {
                            var c=this.cards[i];
                            c.$html.css("top",(topx(this.pos[1])+this.fanned[1]*i)+"em")
                                   .css("left",(lefty(this.pos[0])+this.fanned[0]*i)+"em")
                                   .css("z-index",i)
                                   .show();
                        }
                        if (false) {
                            var $last = this.cards[this.cards.length-1].$html;
                            if ($last) {
                                $last.draggable({
                                        revert:true, zIndex:100,
                                        stop: function( event, ui ) { $(this).parent().find(".s").removeClass("s"); }
                                    }).css("position","absolute");
                            }
                        }
                    }
                };
                ret.$html = $("<div class='card slot foundation' id='"+ret.id+"'></div>");
                ret.$html.css("top",topx(_data.pos[1])+"em").css("left",lefty(_data.pos[0])+"em")
                         .css("background-image","url("+ret.bg+")");
                helpers.build.droppable(ret.$html);
                
                return ret;
            },
            rowstack: function($this, _data) {
                var settings = helpers.settings($this);
                var ret = {
                    id      : "r"+helpers.build.id.rowstack++,
                    stock   : _data.stock?"s"+_data.stock:"s0",
                    fanned  : _data.fanned?[_data.fanned[0],_data.fanned[1]]:[0,0],
                    pos     : [_data.pos[0], _data.pos[1]],
                    type    : "rowstack",
                    cards   : [],
                    isempty : function() { return (this.cards.length==0); },
                    update  : function() {
                        if (this.$html.hasClass("droppable")) { this.$html.droppable("disable"); }
                        for (i=0; i<this.cards.length; i++) {
                            var elt=this.cards[i];
                            elt.$html.css("top",(topx(ret.pos[1])+ret.fanned[1]*i)+"em")
                                     .css("left",(lefty(ret.pos[0])+ret.fanned[0]*i)+"em")
                                     .css("z-index",i).show();
                            if (elt.$html.hasClass("droppable")) { elt.$html.droppable("disable"); }
                        }
                        var $drop = this.$html;
                        if (!this.isempty()) { $drop = this.cards[this.cards.length-1].$html; }
                        helpers.build.droppable($drop);
                    }
                };
                ret.$html = $("<div class='card slot rowstack' id='"+ret.id+"'></div>");
                ret.$html.css("top",topx(_data.pos[1])+"em").css("left",lefty(_data.pos[0])+"em");
                
                var nbcards = _data.nbcards?_data.nbcards:1;
                for (var i=0; i<nbcards; i++) {
                    var elt = settings.elts[ret.stock].cards.pop();
                    if (i!=nbcards-1) {  elt.$html.addClass("down"); }
                    ret.cards.push(elt);
                }
                
                return ret;
            }
        }
    };

    // The plugin
    $.fn.cards = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,        // can player play ?
                    elts            : {},           // all gaming elements
                    data            : {},           // all cards
                    from            : {}
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
            devmode: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#devoutput textarea").val("Debug output").parent().show();
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.quit($this);
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in cards plugin!'); }
    };
})(jQuery);

