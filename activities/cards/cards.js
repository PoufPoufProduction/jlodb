(function($) {
    // Activity default options
    var defaults = {
        name        : "cards",                            // The activity name
        label       : "Cards",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        back        : "res/img/cards/00back02.svg",            // Back image
        font        : 1, 
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
            if (_text && _text.length) {
                for (var j=0; j<2; j++) for (var i=0; i<regExp.length/2; i++) {
                    var vReg = new RegExp(regExp[i*2],"g");
                    _text = _text.replace(vReg,regExp[i*2+1]);
                }
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
                    if (settings.elts[i].$html) { $this.find("#board").append(settings.elts[i].$html); }
                    settings.elts[i].update();
                }
                
                if (settings.game) {
                    for (var g in settings.game) {
                        $this.find("#userguide ul").append("<li>"+helpers.format(settings.game[g])+"</li>");
                    }
                }
                
                // Optional devmode
                if (settings.dev) { $this.find("#devmode").show(); }

                // Exercice
                if (settings.exercice) { $this.find("#exercice").html(helpers.format(settings.exercice)); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        processclick: function() {
            var $this       = $(this).closest(".cards");
            var settings    = helpers.settings($this);
            if ( ! $(this).is('.ui-draggable-dragging') ) {
                if (settings.timerid) {
                    clearTimeout(settings.timerid);
                    settings.timerid=0;               
                    var id          = $(this).attr("id");
                    var stock       = helpers.getElt($this, id);
                    
                    if (stock.cards[stock.cards.length-1].id == id) {
                        var good = 0;
                        var card = stock.cards[stock.cards.length-1];
                        for (var i in settings.elts) {
                            var elt     = settings.elts[i];
                            var accept  = elt.accept;
                            var ok      = true;
                            var down    = 0;

                            if (elt.isempty())          { if (elt.first) { accept = elt.first; } }
                            else                        { down = elt.cards[elt.cards.length-1]; }
                            if (helpers.valid[accept])  { ok = helpers.valid[accept](card,down); }
                            if (elt.success && ok)      { good = i; }
                            
                        }
                        if (good) {
                            $this.find("#fx>div").addClass("running").parent()
                                .css("left",($(this).offset().left-$this.find("#board").offset().left)+"px")
                                .css("top",($(this).offset().top-$this.find("#board").offset().top)+"px")
                                .show();
                            setTimeout(function(){ $this.find("#fx>div").removeClass("running").parent().hide(); },500);
                                
                            stock.cards.pop();
                            settings.elts[good].cards.push(card);
                            stock.update();
                            settings.elts[good].update();
                            
                            helpers.check($this);
                            
                        }
                    }
                }
                else { settings.timerid=setTimeout(function() { settings.timerid=0; }, 300); }
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
        valid: {
            g:function(_top,_back) {
                return ( typeof(_top.value)!="undefined" && !_top.$html.hasClass("down") &&
                        (!_back || (typeof(_back.value)!="undefined" && !_back.$html.hasClass("down"))));
            },
            heartsup: function(_top, _back) {
                return (this.g(_top, _back) && _top.value>=0  && _top.value<13 && _top.value%13==(_back?(_back.value%13)+1:0));
            },
            spadesup: function(_top, _back) {
                return (this.g(_top, _back) && _top.value>=13 && _top.value<26 && _top.value%13==(_back?(_back.value%13)+1:0));
            },
            diamondsup: function(_top, _back) {
                return (this.g(_top, _back) && _top.value>=26 && _top.value<39 && _top.value%13==(_back?(_back.value%13)+1:0));
            },
            clubsup: function(_top, _back) {
                return (this.g(_top, _back) && _top.value>=39 && _top.value<52 && _top.value%13==(_back?(_back.value%13)+1:0));
            },
            togglecolordown: function(_top, _back) {
                return (this.g(_top, _back) &&
                        (Math.floor(_top.value/13)%2!=Math.floor(_back.value/13)%2) && (_top.value%13)==(_back.value%13)-1 );
            },
            king: function(_top, _back) {
                return (this.g(_top, _back) && _top.value%13==12);
            },
            onlyone: function(_top, _back) { return (_back==0); },
            all: function(_top, _back) { return true; },
            none: function(_top, _back) { return false; }
            
        },
        build: {
            draggable: function($elt) {
                $elt.addClass("draggable").draggable({
                    start:function() {
                        var $this       = $(this).closest(".cards");
                        var settings    = helpers.settings($this);
                        var id          = $(this).attr("id");
                        var stock       = helpers.getElt($this, id);
                        settings.tomove = [];
                        settings.timerid=0;
                        for (var i=stock.cards.length-1; i>=0; i--) {
                            var $html=stock.cards[i].$html, $board=$html.closest("#board");
                            var c = stock.cards[i];
                            c.origin = [$html.offset().left - $board.offset().left, $html.offset().top - $board.offset().top];
                            c.$html.css("z-index",100+i);
                            settings.tomove.push(c);
                            if (c.$html.hasClass("droppable")) { c.$html.removeClass("droppable").droppable("disable"); }
                            if (c.id==id) { break; }
                        }
                    },
                    drag: function(event, ui) {
                        var $this       = $(this).closest(".cards");
                        var settings    = helpers.settings($this);
                        var id          = $(this).attr("id");
                        var currentLoc  = $(this).position();
                        var orig        = ui.originalPosition;
                        var offsetLeft  = currentLoc.left-orig.left;
                        var offsetTop   = currentLoc.top-orig.top;
                                                
                        for (var i in settings.tomove) {
                            if (settings.tomove[i].id!=id) {
                                var $html = settings.tomove[i].$html;
                                $html.css('left', settings.tomove[i].origin[0]+offsetLeft);
                                $html.css('top', settings.tomove[i].origin[1]+offsetTop);
                            }
                        }
                    },
                    stop: function( event, ui ) {
                        var $this       = $(this).closest(".cards");
                        var settings    = helpers.settings($this);
                        $(this).parent().find(".s").removeClass("s");
                        
                        for (var i in settings.tomove) {
                            var c=settings.tomove[i];
                            c.$html.animate({left:c.origin[0],top:c.origin[1]},200);
                        }
                        if (settings.tomove.length) {
                            setTimeout(function() {
                                var from = helpers.getElt($this, settings.tomove[0].$html.attr("id"));
                                settings.tomove=[];
                                from.update();
                            }, 300);
                        }
                    }
                }).draggable("enable").css("position","absolute")
                .unbind("mousedown touchstart", helpers.processclick).bind("mousedown touchstart", helpers.processclick);
            },
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
                        var down    = to.isempty()?0:to.cards[to.cards.length-1];
                        var ok      = true;
                        
                        var checkdown = down;
                        for (var i=settings.tomove.length-1; i>=0; i--) {
                            var checkup = settings.tomove[i];
                            var accept = to.accept;
                            if (checkdown==0 && to.first) { accept = to.first; }
                            if (ok && helpers.valid[accept]) { ok = helpers.valid[accept](checkup,checkdown); }
                            checkdown = checkup;
                        }
                        
                        if (ok) {
                            var cards = [];
                            for (var i in settings.tomove)
                            {
                                var elt     = from.cards.pop();
                                cards.push(elt);
                                
                                var $clone = elt.$html.clone();
                                elt.$html.detach();
                                elt.$html = $clone;
                                elt.$html.removeClass("ui-draggable-dragging droppable draggable");
                                elt.$html.appendTo($(this).parent());
                            }
                            cards.reverse();
                            for (var i in cards) { to.cards.push(cards[i]); }
                            settings.tomove=[];
                            
                            
                            console.log("update : "+to.id+" + "+from.id);
                            to.update();
                            from.update();
                            
                            $this.find("#fx>div").addClass("running").parent()
                                .css("left",($(this).offset().left-$this.find("#board").offset().left)+"px")
                                .css("top",($(this).offset().top-$this.find("#board").offset().top)+"px")
                                .show();
                            setTimeout(function(){ $this.find("#fx>div").removeClass("running").parent().hide(); },500);
                            
                            helpers.check($this);
                    
                        }
                    }
                }).droppable("enable");
            },
            stock: function($this, _data) {
                var settings = helpers.settings($this);
                var ret = {
                    id          : "s"+settings.ids.stock++,
                    $html       : 0,
                    pos         : _data.pos?[_data.pos[0], _data.pos[1]]:0,
                    type        : "stock",
                    waste       : _data.waste?"w"+_data.waste:"w0",
                    cards       : [],
                    nbcards     : 52,
                    number      : _data.number?_data.number:1,
                    success     : _data.success,
                    isempty     : function() { return (this.cards.length==0); },
                    update      : function() {
                        if (this.$html) { this.$html.html(this.isempty()?"":"<div class='card'><img src='"+settings.back+"'/></div>"); }
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
                        card.id  = "c"+settings.ids.cards++;
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
                
                if (ret.pos) {
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
                }
                    
                return ret;
            },
            waste: function($this, _data) {
                var settings = helpers.settings($this);
                var ret = {
                    id      : "w"+settings.ids.waste++,
                    pos     : [_data.pos[0], _data.pos[1]],
                    type    : "waste",
                    stock   : _data.stock?"s"+_data.stock:"s0",
                    fanned  : _data.fanned?[_data.fanned[0],_data.fanned[1]]:[0,0],
                    cards   : [],
                    success : _data.success,
                    isempty : function() { return (this.cards.length==0); },
                    update  : function() {
                        if (this.isempty()) { this.$html.html(""); }
                        else {
                            for (var i=0; i<this.cards.length; i++) {
                                var elt=this.cards[i];
                                elt.$html.css("top",(topx(this.pos[1])+this.fanned[1]*i)+"em")
                                       .css("left",(lefty(this.pos[0])+this.fanned[0]*i)+"em")
                                       .css("z-index",i+2)
                                       .show();
                                       
                                if (elt.$html.hasClass("draggable")) { elt.$html.draggable("disable"); }
                            }
                            var $last = this.cards[this.cards.length-1].$html;
                            if ($last) { helpers.build.draggable($last); }
                        }
                        
                    }
                };
                ret.$html = $("<div class='card slot waste' id='"+ret.id+"'></div>");
                ret.$html.css("top",topx(ret.pos[1])+"em").css("left",lefty(ret.pos[0])+"em");
                
                return ret;
            },
            rowstack: function($this, _data) {
                var settings = helpers.settings($this);
                var ret = {
                    id      : "r"+settings.ids.rowstack++,
                    type    : "rowstack",
                    stock   : _data.stock?"s"+_data.stock:"s0",
                    fanned  : _data.fanned?[_data.fanned[0],_data.fanned[1]]:[0,0],
                    pos     : [_data.pos[0], _data.pos[1]],
                    type    : "rowstack",
                    cards   : [],
                    bg      : _data.background?_data.background:"res/img/cards/00drop01.svg",
                    accept  : _data.accept,
                    first   : _data.first,
                    success : _data.success,
                    pinned  : _data.pinned,
                    isempty : function() { return (this.cards.length==0); },
                    update  : function() {
                        var log="";
                        log+="UPDATE "+this.id+" (nbcards: "+this.cards.length+") ";
                        // CLEAR AND SHOW CARDS
                        if (this.$html.hasClass("droppable")) { this.$html.droppable("disable"); }
                        var dropd = 0, dragd = 0;
                        for (i=0; i<this.cards.length; i++) {
                            var elt=this.cards[i];
                            elt.$html.css("top",(topx(ret.pos[1])+ret.fanned[1]*i)+"em")
                                     .css("left",(lefty(ret.pos[0])+ret.fanned[0]*i)+"em")
                                     .css("z-index",i+2)
                                     .show();
                            if (elt.$html.hasClass("droppable")) { elt.$html.droppable("disable"); dropd++; }
                            if (elt.$html.hasClass("draggable")) { elt.$html.draggable("disable"); dragd++; }
                        }
                        log+="(drop: "+dropd+") (drag: "+dragd+") ";
                        var $drop = this.$html;
                        if (!this.isempty()) {
                            var lastcard = this.cards[this.cards.length-1];
                            $drop = lastcard.$html;
                            var $last = lastcard.$html;
                            
                            // TOP CARD IS DOWN-FACED
                            if ($last.hasClass("down")) {
                                $last.bind("mousedown touchstart", function(_event) {
                                    $(this).unbind("mousedown touchstart").removeClass("down");
                                    var stack  = helpers.getElt($this, $(this).attr("id"));
                                    stack.update();
                                    _event.preventDefault();
                                });
                                $drop=0;
                            }
                            else if (!this.pinned) {
                                var ok, cpt=this.cards.length-1;
                                do {
                                    ok = true;
                                    var card=this.cards[cpt];
                                    if (cpt<this.cards.length-1) {
                                        var top=this.cards[cpt+1];
                                        if (this.accept && helpers.valid[this.accept]) {                                   
                                            ok = helpers.valid[this.accept](top,card);
                                        }      
                                    }
                                    cpt--;
                                    if (ok) { helpers.build.draggable(card.$html); }
                                    
                                } while (ok && cpt>=0);
                            }
                        }
                        if ($drop) { log+="[drop: "+$drop.attr("id")+"]"; helpers.build.droppable($drop); }
                        console.log(log);
                    }
                };
                ret.$html = $("<div class='card slot rowstack' id='"+ret.id+"'></div>");
                ret.$html.css("top",topx(_data.pos[1])+"em").css("left",lefty(_data.pos[0])+"em")
                         .css("background-image","url("+ret.bg+")");
                
                var nbcards = _data.nbcards?_data.nbcards:0;
                var list="";
                for (var i in settings.elts) { list+=" "+i; }
                console.log("DEBUG "+ret.stock+" ("+list+")");
                for (var i=0; i<nbcards; i++) {
                    var elt = settings.elts[ret.stock].cards.pop();
                    if (i!=nbcards-1 && _data.type=="lastup") {  elt.$html.addClass("down"); }
                    ret.cards.push(elt);
                }
                
                return ret;
            }
        },
        check: function($this) {
            var settings = helpers.settings($this);
            var success = true;
            for (var i in settings.elts) {
                if (typeof (settings.elts[i].success) == "number") {
                    console.log(i+": "+settings.elts[i].success+" <> "+settings.elts[i].cards.length);
                    if (settings.elts[i].success != settings.elts[i].cards.length) { success = false; }
                }
                else if (typeof (settings.elts[i].success) != "undefined") {
                }
            }
            
            if (success) {
                settings.score = 5;
                $this.find("#good").toggle(success);
                $this.find("#wrong").toggle(!success);
                $this.find("#effects").show();
                setTimeout(function() { helpers.end($this); }, 2000);
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
                    from            : {},
                    ids             : { stock:0, waste: 0, rowstack: 0, cards : 0},
                    tomove          : [],
                    timerid         : 0
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

