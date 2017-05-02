(function($) {
    // Activity default options
    var defaults = {
        name        : "cards",                            // The activity name
        label       : "Cards",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        exercice    : [],                                       // Exercice
        font        : 1.2, 
        debug       : false                                     // Debug mode
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
                
                
                $this.find("#board").html("");
                for (var i in settings.elts) {  $this.find("#board").append(settings.elts[i].$html); }
                
                // Optional devmode
                if (settings.dev) { $this.find("#devmode").show(); }

                // Exercice
                $this.find("#exercice").html(helpers.format(settings.exercice));

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        build: {
            id : { stock:0, waste: 0, foundation: 0, rowstack: 0},
            stock: function($this, _data) {
                var settings = helpers.settings($this);
                var ret = {
                    id          : "s"+helpers.build.id.stock++,
                    type        : "stock",
                    waste       : _data.waste?"w"+_data.waste:"w0",
                    cards       : [],
                    number      : 3,
                    isempty     : function() { return (this.cards.length==0); },
                    draw        : function() {
                        this.$html.html(this.isempty()?"":"<div class='card'><img src='res/img/cards/00back01.svg'/></div>");
                    }                        
                };
                
                // Fill cards and sort
                for (var i=0;i<52;i++) { ret.cards.push({value:i}); }
                for (var i=0;i<50;i++) { ret.cards.sort(function(){return Math.random()>0.5; }); }
                
                ret.$html = $("<div class='card slot stock' id='"+ret.id+"'></div>");
                ret.$html.css("top",topx(_data.pos[1])+"em").css("left",lefty(_data.pos[0])+"em");
                
                ret.$html.bind("mousedown touchstart", function(_event) {
                    var $this    = $(this).closest(".cards");
                    var settings = helpers.settings($this);
                    var stock    = settings.elts[$(this).attr("id")];
                    if (stock.isempty()) {
                        while (!settings.elts[stock.waste].isempty()) { stock.cards.push(settings.elts[stock.waste].cards.pop()); }
                    }
                    else {
                        var cpt      = 0;
                        while (cpt<stock.number && !stock.isempty()) {
                            settings.elts[stock.waste].cards.push(stock.cards.pop());
                            cpt++;
                        }
                    }
                    stock.draw();
                    settings.elts[stock.waste].update();
                    _event.preventDefault();
                });
                ret.draw();
                    
                return ret;
            },
            waste: function($this, _data) {
                var settings = helpers.settings($this);
                var ret = {
                    id      : "w"+helpers.build.id.waste++,
                    type    : "waste",
                    stock   : _data.stock?"s"+_data.stock:"s0",
                    cards   : [],
                    isempty : function() { return (this.cards.length==0); },
                    update  : function() {
                        if (this.isempty()) { this.$html.html(""); }
                        else
                        for (var i=this.$html.children().length; i<this.cards.length; i++) {
                            var c=this.cards[i];
                            var $html=$("<div class='card'><img src='res/img/cards/"+values[c.value%13]+colors[Math.floor(c.value/13)]+
                                        ".svg' alt=''/></div>");
                            this.$html.append($html);
                        }
                    }
                };
                ret.$html = $("<div class='card slot waste' id='"+ret.id+"'></div>");
                ret.$html.css("top",topx(_data.pos[1])+"em").css("left",lefty(_data.pos[0])+"em");
                
                return ret;
            },
            foundation: function($this, _data) {
                var settings = helpers.settings($this);
                var ret = {
                    id      : "f"+helpers.build.id.foundation++,
                    type    : "foundation",
                    color   : _data.color
                };
                ret.$html = $("<div class='card slot foundation "+ret.color+"' id='"+ret.id+"'></div>");
                ret.$html.css("top",topx(_data.pos[1])+"em").css("left",lefty(_data.pos[0])+"em");
                
                return ret;
            },
            rowstack: function($this, _data) {
                var settings = helpers.settings($this);
                var ret = {
                    id      : "r"+helpers.build.id.rowstack++,
                    type    : "rowstack",
                    cards   : []
                };
                ret.$html = $("<div class='card slot rowstack' id='"+ret.id+"'></div>");
                ret.$html.css("top",topx(_data.pos[1])+"em").css("left",lefty(_data.pos[0])+"em");
                
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
                    interactive     : false,
                    elts            : {}
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

