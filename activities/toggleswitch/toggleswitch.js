(function($) {
    // Activity default options
    var defaults = {
        name        : "toggleswitch",                           // The activity name
        label       : "Toggle switch"            ,              // The activity label
        templateX   : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        score       : 1,                                        // The score (from 1 to 5)
        number      : 0,                                        // Pages number
        show        : true,                                     // Show the wrong responses
        toggle      : "a",                                      // Active class
        group       : "",                                       // Active group
        result      : "",
        init        : "",
        font        : 1,                                        // Template font
        loop        : true,                                     // State loop
        illustration: "",                                       // Add an illustration (text or image)
        errratio    : 1,                                        // Ratio error
        fontex      : 1,
        fonttag     : 1,
        errelt      : "",                                       // wrong element
        background  : "",
        debug       : true                                      // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[s\\\]([^\\\[]+)\\\[/s\\\]",            "<s>$1</s>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[green\\\]([^\\\[]+)\\\[/green\\\]",    "<span style='color:green'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[h1\\\]([^\\\[]+)\\\[/h1\\\]",          "<div style='text-align:center; font-size:3em;font-weight:bold;'>$1</div>",
        "\\\[h2\\\]([^\\\[]+)\\\[/h2\\\]",          "<div style='text-align:center; font-size:1.5em;font-weight:bold;'>$1</div>",
        "\\\[img\\\]([^\\\[]+)\\\[/img\\\]",        "<div style='width:100%'><img src='$1' alt=''/></div>",
        "\\\[icon\\\]([^\\\[]+)\\\[/icon\\\]",      "<div class='icon' style='font-size:1.2em;float:left'><img src='$1' alt=''/></div>",
        "\\\[icon2\\\]([^\\\[]+)\\\[/icon2\\\]",    "<div class='icon' style='font-size:2em;float:left'><img src='$1' alt=''/></div>",
        "\\\[math\\\]([^\\\[]+)\\\[/math\\\]",      "<div class='math'><math>$1</math></div>"
    ];

    var onClicks = {
        onlyone : function($this, elts, id, settings) {
            var nb=0; for (var i in elts) { if (elts[i].state==1) nb++; } return (elts[id].state==1 || nb<1);
        }
    }

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
                var templatepath = "activities/"+settings.name+"/"+settings.templateX+debug;
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.build($this); });
            },
            build: function($this) {
                var settings = helpers.settings($this);
                if (settings.context.onload) { settings.context.onload($this); }

                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }
                
                // Locale handling
                $this.find("#guide").html(settings.guide);
                $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); });
                setTimeout(function() { helpers.build($this); }, 500);
                if (settings.time) { $this.addClass("timeattack"); }
                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        // REFRESH A TOGGLE ELEMENT
        refresh: function($this, elt) {
            var settings = helpers.settings($this), o = elt.state;
            if (settings.states.style) {
                var style   = {};
                if (o<0 && settings.show && settings.wrong && settings.wrong.style ) { style = settings.wrong.style;}
                if (o>=0) { style = settings.states.style[o%settings.states.style.length]; }
                for (var i in style) { elt.elt.css(i, style[i]); }
            }

            if (settings.states.content)
            {
                var content = "";
                if (o<0 && settings.show && settings.wrong && settings.wrong.content ) { content = settings.wrong.content; }
                if (o>=0) { content = settings.states.content[o%settings.states.content.length]; }

                if (settings.regexp) {
                    vRegexp = new RegExp(settings.regexp.from, "g");
                    content = content.replace(vRegexp, settings.regexp.to);
                }

                if (content.length) { elt.elt.html(content); }
            }
            if (settings.states["class"]) {
                var cl = "";

                if (o<0 && settings.show && settings.wrong && settings.wrong["class"] ) { cl = settings.wrong["class"]; }
                if (o>=0) { cl = settings.states["class"][o%settings.states["class"].length]; }

                if (cl.length) { elt.elt.attr("class",cl); }
            }
        },
        // CHANGE A STATUT
        click: function($this, id) {
            var settings = helpers.settings($this);
            if (settings.interactive) {
                var elt = settings.current.elts[id];

                var isOk = true;
                var onClick = 0;
                if (settings.current.onclick)   { onClick = settings.current.onclick; } else
                if (settings.onclick)           { onClick = settings.onclick; }

                if (onClick) {
                    if (onClicks[onClick])  { isOk = onClicks[onClick]($this, settings.current.elts, id, settings); }
                    else                    { isOk = eval('('+onClick+')')($this, settings.current.elts, id, settings); }
                }

                if (isOk) {
                    elt.state++;
                    if (elt.state==((settings.states.nb)?settings.states.nb:2)) {
                        if (settings.loop)  { elt.state = 0; helpers.refresh($this, elt); }
                        else                { elt.state--; }
                    }
                    else { helpers.refresh($this, elt); }
                }
            }
        },
        fill: function($this) {
            var settings = helpers.settings($this);
            settings.current.elts = [];
            var vToggle = (settings.current.group?"#"+settings.current.group+" ":"")+"."+settings.toggle;
            $this.find(vToggle).each(function(index) {
                var elt={ elt:$(this), state:0 };
                if (settings.current.init) { elt.state = parseInt(settings.current.init[index%settings.current.init.length]); }

                settings.current.elts.push(elt);
                helpers.refresh($this,elt);
                $(this).bind("mousedown touchstart",function(event){ helpers.click($this,index); event.preventDefault();});
            });

            // HANDLE THE ILLUSTRATION
            var vIllus = settings.illustration;
            if ($.isArray(vIllus)) { vIllus = vIllus[settings.it%vIllus.length]; }

            if (vIllus) {
                if (vIllus.indexOf("<svg")!=-1) { $this.find("#illustration").html(vIllus); }
                else { $this.find("#illustration").html("<img src='"+vIllus+"'/>"); }
            }

             // HANDLE THE LEGEND
            var vLegend = settings.current.legend || settings.legend;
            if ($.isArray(vLegend)) { vLegend = vLegend[settings.it%vLegend.length]; }

            if (vLegend) { $this.find("#legend").html(helpers.format(vLegend)); }
			
			// HANDLE STATIC TEXT OR IMAGE IN SVG
            var txt = settings.current.txt;
            if (txt) {
                for (var i in txt) {
                    if (txt[i].toString().indexOf(".svg")!=-1)  { $("#"+i,settings.svg.root()).attr("xlink:href",txt[i]).show(); }
					else 							            { $("#"+i,settings.svg.root()).text(txt[i]).show(); }
                }
            }
            
            // HANDLE THE ERRELT
            if (settings.errelt) {
                $this.find((settings.current.group?"#"+settings.current.group+" ":"")+"#"+settings.errelt).bind(
                    "mousedown touchstart",function(event) {
                        
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches &&
                                  event.originalEvent.touches.length)?event.originalEvent.touches[0]:event;

                    if (settings.interactive) {
                        settings.interactive = false;
                        $this.find("#error").css("left", vEvent.clientX-$this.offset().left)
                                            .css("top",  vEvent.clientY-$this.offset().top)
                                            .css("opacity", 1)
                                            .animate({opacity:0}, 500, function(){$(this).hide();settings.interactive = true; })
                                            .show();
                        settings.wrongs++;
                    }
                    event.preventDefault();
                });
            }
  

            settings.interactive = true;
        },
        // Build the question
        build: function($this) {
            var settings = helpers.settings($this);
            $this.find("#submit").removeClass("good").removeClass("wrong");
            $this.find("#effects").hide();
            $this.removeClass("end");

            if (!settings.number)   { settings.number = (settings.values)?settings.values.length:1; }

            // 3 CASES : GEN (FUNCTION), VALUES (ARRAY), DATA (SINGLE)
            settings.current=settings.values?settings.values[settings.it%settings.values.length]:settings;
            
            if (settings.current.gen) {
                var gen = eval('('+settings.current.gen+')')($this,settings,settings.it);
                settings.current = $.extend({}, gen);
            }
            
            if (settings.group)                                 { settings.current.group    = settings.group; }
            if (settings.t)                                     { settings.current.t        = settings.t; } 
            if (settings.svgclass)                              { settings.current.svgclass = settings.svgclass; }
            if (settings.template)                              { settings.current.template = settings.template; }
            
            if (settings.exercice && settings.exercice.tag)     { settings.current.tag    = settings.exercice.tag;}
			
            // HANDLE THE EXERCICE
            if (settings.exercice) {
                if ($.type(settings.exercice)=="string") {
                    $this.find("#exercice #content").html(helpers.format(settings.exercice));
                } else {
                    $this.find("#exercice #content").html(helpers.format(settings.exercice.value));
                    if (settings.current.tag) {
                        if ($.isArray(settings.current.tag)) {
                            $this.find("#exercice #tag>div").html(settings.current.tag[settings.it%settings.current.tag.length]).parent().show();
                        }
                        else {
                            $this.find("#exercice #tag>div").html(settings.current.tag).parent().show();
                        }
                        $this.find("#exercice #tag>div").css("font-size",settings.fonttag+"em");
                    }
                    if (settings.exercice.font) { $this.find("#exercice #content").css("font-size",settings.exercice.font+"em");
                    }
                }
                $this.find("#exercice").show();
            } else
            if (settings.current.exercice) {
                $this.find("#exercice #content").html(settings.current.comment);
                $this.find("#exercice").show(); }
            else { $this.find("#exercice").hide(); }
            $this.find("#exercice #content").css("font-size",settings.fontex+"em");

            if (settings.current.template) {
                var debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

                var vRegexp = 0;
                if (settings.regexp) { vRegexp = new RegExp(settings.regexp.from, "g"); }

                if (settings.current.template.indexOf(".svg")!=-1) {
                    var templatepath = "res/img/"+settings.current.template+debug;
                    $this.find("#data").html("");
                    var elt= $("<div id='svg'></div>").appendTo($this.find("#data"));
                    elt.svg();
                    settings.svg = elt.svg('get');
                    settings.svg.load(templatepath, { addTo: true, changeSize: true, onLoad:function() {
                        
                        if (settings.current.svgclass) { $(settings.svg.root()).attr("class",settings.current.svgclass); }
                        $this.find(".t").each(function(index) {
                            var t = settings.current.t;
                            if (t && t.length>index) {
                                var value = t[index];
                                if (vRegexp) { value = value.replace(vRegexp, settings.regexp.to); }
                                $(this).text(value);
                            }
                        });
                        helpers.fill($this); }
                    });
                }
                else {
                    var templatepath = "activities/"+settings.name+"/template/"+settings.current.template+".html"+debug;
                    $this.find("#data").load(templatepath, function(response, status, xhr) {
                        $this.find(".t").each(function(index) {
                            var value = index<settings.current.t.length?settings.current.t[index]:" ";
                            if (vRegexp) { value = value.replace(vRegexp, settings.regexp.to); }
                            if (settings.current.t && settings.current.t.length>index) {
                                $(this).html("<div style='font-size:"+settings.font+"em;margin-top:"+
                                             (1-settings.font)/(2*settings.font)+"em;'>"+helpers.format(value.toString())+"</div>"); }});
                        helpers.fill($this);
                    });
                }
            }
            else {
                $this.find("#data").html(settings.current.data?settings.current.data:settings.data);
                $this.find(".t").each(function(index) {
                    var value = settings.current.t[index];
                    if (vRegexp) { value = value.replace(vRegexp, settings.regexp.to); }
                    if (settings.current.t && settings.current.t.length>index) { $(this).text(value); }});
                helpers.fill($this);
            }
			
			
        },
        timer: function($this) {
            var settings = helpers.settings($this);
            $this.find("#timer").removeClass("err");
            var delta = Date.now()-settings.timer.begin;
            var t = settings.time-Math.floor(delta/1000);
            $this.find("#timer").html(jlodbtime(t));
            if (t<=0) {
                if (!$this.find("#timer").hasClass("s")) { $this.find("#timer").addClass("s"); }
                if (Math.abs(t)>=settings.timer.err*settings.time/5) {
                    settings.timer.err++;
                    settings.wrongs++;
                    $this.find("#timer").addClass("err");
                }
            }
            if (settings.interactive) { settings.timer.id = setTimeout(function() { helpers.timer($this); },200); }
        }

    };

    // The plugin
    $.fn.toggleswitch = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive : false,
                    it          : 0,
                    wrongs      : 0,        // number of false response
                    current     : {         // the current page
                        elt     : "",
                        t       : [],
                        result  : "",
                        values  : []
                    },
                    timer       : {
                        begin   : 0,
                        id      : 0,
                        err     : 0
                    },
                    svg         : 0
                };

                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);
                    this.onselectstart = function() { return false; }

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
            valid: function() {
                var $this   = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    settings.interactive = false;
                    var wrongs  = 0;
                    if (settings.scorefct) { wrongs = eval('('+settings.scorefct+')')($this, settings.current.elts, settings); }
                    else {
                        for (var i in settings.current.elts) {
                            if(!settings.current.result || settings.current.result.length<i ||
                                settings.current.elts[i].state!=settings.current.result[i]) {
                                wrongs++;
                                settings.current.elts[i].state = -1;
                            }
                        }
                    }
                    
                    for (var i in settings.current.elts) { helpers.refresh($this, settings.current.elts[i]); }

                    var value = wrongs?"wrong":"good";
                    $this.find("#submit").addClass(value);
                    settings.wrongs+=settings.errratio*wrongs;
                    settings.it++;
                    $this.addClass("end");

                    $this.find("#effects>div").hide();
                    if (!wrongs) { $this.find("#effects #good").show(); }
                    else         { $this.find("#effects #wrong").show(); }
                    $this.find("#effects").show();

                    if (settings.it>=settings.number) {

                        settings.score = 5-settings.wrongs;
                        if (settings.score<0) { settings.score = 0; }
                        $(this).find("#valid").hide();
                        setTimeout(function() { helpers.end($this); }, wrongs?2000:1000);
                    }
                    else {
                        setTimeout(function() {
                            helpers.build($this);
                            $this[settings.name]('next');
                        }, wrongs?2000:1000);
                    }
                }
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = false;
                settings.context.onquit($this,{'status':'abort'});
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.time) {
                    $this.find("#timer").removeClass("s").html(jlodbtime(settings.time));
                    settings.timer.begin = Date.now();
                    settings.timer.id = setTimeout(function() { helpers.timer($this); },200);
                }
                $(this).find("#submit").show();
            },
            refresh: function() {
                var $this = $(this) , settings = helpers.settings($this);
                for (var i in settings.current.elts) { helpers.refresh($this, settings.current.elts[i]); }
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in toggleswitch plugin!'); }
    };
})(jQuery);

