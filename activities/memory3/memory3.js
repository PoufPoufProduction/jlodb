(function($) {
    // Memory default options
    var defaults = {
        name        : "memory3",            // The activity name
        template    : "template.html",      // Memory's html template
        css         : "style.css",          // Mermory's css style sheet
        lang        : "fr-FR",              // Current localization
        delay       : 0,                    // Time of display the values
        prefix      : "",                   // Prefix for data
        font        : 0.8,
        debug       : true                 // Debug mode
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
            settings.context.onquit($this,{'status':'success', 'score':settings.score});
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
            shuffle: function(a) {
                var j = 0, valI = '', valJ = valI, l = a.length - 1;
                while(l > -1) { j = Math.floor(Math.random() * l); valI = a[l]; valJ = a[j]; a[l] = valJ; a[j] = valI; l = l - 1; }
                return a;
            },
            build: function($this) {
                var settings = helpers.settings($this);
                if (settings.context.onload) { settings.context.onload($this); }

                // Resize the template
                $this.css("font-size", Math.floor($this.height()/12)+"px");

                var nb = settings.data.length*2;
                settings.still = settings.data.length;
                $this.addClass("nb"+nb);
                settings.cards=[];
                for (var i in settings.data) {
                    if ( $.isArray(settings.data[i])) {
                        settings.cards.push({src:settings.prefix+settings.data[i][0], val:i, nb:0});
                        settings.cards.push({src:settings.prefix+settings.data[i][1], val:i, nb:0});
                    }
                    else {
                        settings.cards.push({src:settings.prefix+settings.data[i], val:i, nb:0});
                        settings.cards.push({src:settings.prefix+settings.data[i], val:i, nb:0});
                    }
                }
                settings.cards = this.shuffle(settings.cards);


                for (var i=0; i<nb; i++) {
                    var html="<div class='card' id='"+i+"' onclick=\"$(this).closest('.memory3').memory3('click',this);\"";
                    html+=" ontouchstart=\"$(this).closest('.memory3').memory3('click',this);event.preventDefault();\"";
                    html+="><div class='content'>";
                    if (settings.cards[i].src.indexOf("svg")!=-1) { html+="<div class='icon'><img src='"+settings.cards[i].src+"'/></div>"; }
                    else  {
                        html+="<p style='top:"+Math.round(10*(1-settings.font)/(2.5*settings.font))/10+"em;width:"+(1/settings.font)+"em;font-size:"+settings.font+"em;'>"+settings.cards[i].src+"</p>"; }
                    html+="<div class='icon'><img src='res/img/svginventoryicons/background/border/card03.svg'/></div>";
                    html+="</div></div>";
                    $this.find("#board").append(html);
                }

                // Locale handling
                $this.find("h1#label").html(settings.label);
                if(settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }
                if (settings.exercice) { $this.find("#exercice").show().find(">div").html(settings.exercice); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        }
    };

    // The plugin
    $.fn.memory3 = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The initial settings
                var settings = {
                    score       : 5,
                    show        : [],
                    still       : 0,
                    interactive : false
                };

                return this.each(function() {
                    // Update the settings
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
            // Next level
            next: function() {
                var $this=$(this), settings = helpers.settings($this);
                settings.interactive = true;

            },
            click: function(_elt) {
                var $this=$(this), settings = helpers.settings($this);
                if (settings.interactive && $(_elt).css("opacity")!=0 && !$(_elt).find(".content").is(":visible")) {
                    $(_elt).find(".content").show();
                    settings.show.push($(_elt).attr("id"));
                    if (settings.show.length==2) {
                        settings.interactive = false;
                        setTimeout(function() {
                            if (settings.cards[settings.show[0]].val == settings.cards[settings.show[1]].val) {
                                $this.find("#board #"+settings.show[0]).css("opacity",0);
                                $this.find("#board #"+settings.show[1]).css("opacity",0);
                                if (--settings.still<=0) { helpers.end($this); }
                            }
                            else { $this.find("#wrong").hide(); }
                            settings.show=[];
                            $this.find("#board").find(".content").hide();
                            helpers.settings($this).interactive = true; }, 500);

                        if ((settings.cards[settings.show[0]].val != settings.cards[settings.show[1]].val) && 
                            (settings.cards[settings.show[0]].nb++ | settings.cards[settings.show[1]].nb++ )) {
                            $this.find("#wrong").show();
                            if (settings.score) { settings.score--; }
                        }
                    }
                }
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.finish = true;
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in memory3 plugin!'); }
    };
})(jQuery);
