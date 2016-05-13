(function($) {
    // Activity default options
    var defaults = {
        name        : "balance",                                // The activity name
        label       : "Balance",                                // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        exercice    : [],                                       // Exercice
        url         : "desktop/balance01.svg",                  // SVG balance
        calc        : false,                                    // finish exercice by entering the weight with keypad
        weights     : 0,
        number      : 0,                                        // Number of weight
        value       : 500,                                      // Weight to find
        type        : "value",                                    // Type of object to check
        ravailable  : false,                                    // Right plate is available
        debug       : true                                      // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[strong\\\](.+)\\\[/strong\\\]",        "<div class='strong'>$1</div>"
    ];

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
            if (settings.score<0) { settings.score = 0; }
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
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.svg($this); });
            },
            // Load the svg if require
            svg:function($this) {
                var settings = helpers.settings($this),debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }
                var elt= $("<div></div>").appendTo($this.find("#svg"));
                elt.svg();
                settings.svg = elt.svg('get');
                $(settings.svg).attr("class",settings["class"]);
                settings.svg.load('res/img/'+settings.url + debug,
                    { addTo: true, changeSize: true, onLoad:function() { helpers.loader.build($this); }
                });
            },
            build: function($this) {
                var settings = helpers.settings($this);

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }

                $this.css("font-size", Math.floor($this.height()/12)+"px");

                // Handle weights
                if (settings.weights) {
                    $("#weights>g",settings.svg.root()).hide();
                    for (var i in settings.weights) { $("#weights>#"+settings.weights[i],settings.svg.root()).show(); }
                }

                $("#weights>g").each(function(_index) {
                    var m = $(this).attr("transform").match(/([0-9]+),([0-9]+)/);
                    settings.origin[$(this).attr("id")] = [ parseInt(m[1]), parseInt(m[2]) ];
                });


                $("#weights>g",settings.svg.root()).bind("touchstart mousedown", function(_event) {
                    if (settings.interactive) {
                        var e = (_event && _event.originalEvent &&
                             _event.originalEvent.touches && _event.originalEvent.touches.length)?
                             _event.originalEvent.touches[0]:_event;

                        settings.elt.id = $(this).attr("id");
                        settings.elt.pos = [ e.clientX, e.clientY ];

                        var wleft=[], wright=[];
                        for (var i in settings.wleft) { if (settings.wleft[i]!=settings.elt.id) { wleft.push(settings.wleft[i]); }}
                        for (var i in settings.wright) { if (settings.wright[i]!=settings.elt.id) { wright.push(settings.wright[i]); }}
                        settings.wleft = wleft;
                        settings.wright = wright;

                        helpers.diff($this,true);

                        $(this).detach();
                        $("#weights",settings.svg.root()).append($(this));
                    }
                    _event.preventDefault();
                });

                $this.bind("touchmove mousemove", function(_event) {
                    if (settings.interactive && settings.elt.id) {
                        var e = (_event && _event.originalEvent &&
                             _event.originalEvent.touches && _event.originalEvent.touches.length)?
                             _event.originalEvent.touches[0]:_event;

                        settings.move.x = settings.elts[settings.elt.id][0]+(e.clientX-settings.elt.pos[0])/settings.ratio;
                        settings.move.y = settings.elts[settings.elt.id][1]+(e.clientY-settings.elt.pos[1])/settings.ratio;

                        $("#weights #"+settings.elt.id, settings.svg.root()).attr("transform","translate("+settings.move.x+","+settings.move.y+")");

                        $(".frontplate ",settings.svg.root()).attr("class","frontplate");

                        if (Math.pow((settings.move.x-150)/100,2)+Math.pow((settings.move.y-315+settings.diff*settings.diffmax)/75,2)<1) {
                            $("#plateleft", settings.svg.root()).attr("class","frontplate s");
                        }
                        else
                        if (settings.ravailable &&
                            Math.pow((settings.move.x-490)/100,2)+Math.pow((settings.move.y-315-settings.diff*settings.diffmax)/75,2)<1 &&
                            ( settings.move.x<460 || settings.move.y>305+settings.diff*settings.diffmax) ) {
                            $("#plateright", settings.svg.root()).attr("class","frontplate s");
                        }

                    }
                    _event.preventDefault();
                });

                $this.bind("touchend mouseup", function(_event) {
                    if (settings.interactive && settings.elt.id) {
                        
                        var plate = $(".frontplate.s",settings.svg.root());
                        if (plate.length) {
                            if (plate.attr("id")=="plateleft") { settings.wleft.push(settings.elt.id); }
                            else { settings.wright.push(settings.elt.id); }
                        }
                        else {
                            settings.move.x = settings.origin[settings.elt.id][0];
                            settings.move.y = settings.origin[settings.elt.id][1];
                        }
                        settings.elts[settings.elt.id]=[Math.round(settings.move.x),Math.round(settings.move.y)];

                        $("#weights #"+settings.elt.id, settings.svg.root()).attr("transform","translate("+
                            Math.round(settings.move.x)+","+Math.round(settings.move.y)+")");

                        helpers.diff($this,true);

                        settings.elt.id = 0;
                        $(".frontplate ",settings.svg.root()).attr("class","frontplate");

                    }
                    _event.preventDefault();
                });

                // Handle calculator
                if (settings.calc) {
                    $this.find("#calc").show();
                    $this.find("#calculator").draggable({containment:$this, handle:$this.find("#screen")}).css("position","absolute");
                }

                // Locale handling
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        next: function($this) {
            var settings = helpers.settings($this);
            settings.interactive = false;
            setTimeout(function(){ $this.find("#good").show(); },500);
            if (++settings.id<settings.number)  { setTimeout(function(){ helpers.build($this); }, 2500); }
            else                                { setTimeout(function(){ helpers.end($this); }, 2500); }
        },
        build: function($this) {
            var settings = helpers.settings($this);
            $this.find("#effects>div").hide();

            $this.find("#calc").removeClass("s");
            $this.find("#calculator").hide();

            settings.wleft  = [];
            settings.wright = [];

            for (var i in settings.origin) { $("#weights #"+i, settings.svg.root()).attr("transform", "translate("+
                    settings.origin[i][0]+","+ settings.origin[i][1]+")"); }

            if (settings.data) {
                var data = settings.data[settings.id%settings.data.length];
                if (data.value) { settings.value = data.value; }
                if (data.type)  { settings.type = data.type; }

                if (!settings.number) { settings.number = settings.data.length; }
            }
            else if (settings.gen && settings.number) {
                var data = eval('('+settings.gen+')')();
                if (data.value) { settings.value = data.value; }
                if (data.type)  { settings.type = data.type; }
            }

            if (settings.type=="value") {
                $("#value").attr("class","object v"+settings.id%3);
                $("#value tspan",settings.svg.root()).html(settings.value);
            }

            $(".object", settings.svg.root()).hide();
            $("#"+settings.type, settings.svg.root()).show();


            helpers.diff($this,false);

            settings.interactive = true;

            if (settings.id==0 && settings.course) { helpers.course.run($this); }
            
        },
        order: function($this) {
            var settings = helpers.settings($this), order = [];

            $("#weights>g").each(function(_index) {
                var m = $(this).attr("transform").match(/([0-9]+),([0-9]+)/);
                order.push({id:$(this).attr("id"), y:parseInt(m[2])});
            });
            order.sort(function(a,b){return (a.y>b.y); });
            for (var i in order) {
                $("#weights", settings.svg.root()).append($("#weights #"+order[i].id, settings.svg.root()).detach());
            }
        },
        position: function($this) {
            var settings = helpers.settings($this);
            $("#weights>g").each(function(_index) {
                if ($(this).attr("id")!=settings.elt.id) {
                    var m = $(this).attr("transform").match(/([0-9]+),([0-9]+)/);
                    settings.elts[$(this).attr("id")] = [ parseInt(m[1]), parseInt(m[2]) ];
                }
            });
        },
        balance: function($this) {
            var settings = helpers.settings($this), step = 5;

            var vdiff = (settings.anim.diff-settings.anim.init)*(Math.min(step,settings.anim.count)/step);
            settings.diff = settings.anim.init + vdiff;


            for (var i in settings.wleft) {
                $("#weights #"+settings.wleft[i], settings.svg.root()).attr("transform", "translate("+
                    settings.elts[settings.wleft[i]][0]+","+
                    (settings.elts[settings.wleft[i]][1]-Math.round(vdiff*settings.diffmax))+")");
            }
            for (var i in settings.wright) {
                $("#weights #"+settings.wright[i], settings.svg.root()).attr("transform", "translate("+
                    settings.elts[settings.wright[i]][0]+","+
                    (settings.elts[settings.wright[i]][1]+Math.round(vdiff*settings.diffmax))+")");
            }

            $("#indicator>g", settings.svg.root()).attr("transform", "rotate("+(settings.diff*80)+")");
            $("#rotator>g", settings.svg.root()).attr("transform", "matrix(1,"+(settings.diff/10)+",0,1,0,0)");
            $("#plateleft", settings.svg.root()).attr("transform", "translate(0,"+(-settings.diff*settings.diffmax)+")");
            $("#plateright", settings.svg.root()).attr("transform", "translate(0,"+(settings.diff*settings.diffmax)+")");

            if (settings.anim.count++<step) { settings.anim.timerid = setTimeout(function() { helpers.balance($this); },100); }
            else                            {
                helpers.position($this);
                if (!settings.calc && settings.diff==0) { helpers.next($this); }
            }
        },
        diff: function($this, _anim) {
            var settings = helpers.settings($this);

            helpers.order($this);

            var wleft = 0, wright = settings.value;
            for (var i in settings.wleft) { wleft+=parseInt(settings.wleft[i].substr(1)); }
            for (var i in settings.wright) { wright+=parseInt(settings.wright[i].substr(1)); }
            var diff=(wright-wleft)/1000;
            /* diff = (diff<0?-1:1) * Math.pow(Math.abs(diff),0.4); */
            /* diff = wright>wleft?1:(wright<wleft?-1:0); */
            diff = (diff<0?-10:10) * Math.pow(Math.abs(diff),0.4);
            if (diff<-1) { diff=-1; } if (diff>1) { diff=1; }

            settings.anim.diff  = diff;
            settings.anim.init  = settings.diff;
            settings.anim.count = (_anim && diff!=settings.diff)?1:99;

            if (settings.anim.timerid)  { clearTimeout(settings.anim.timerid); helpers.position($this); }
            if (settings.anim.count==1) { settings.anim.timerid = setTimeout(function() { helpers.balance($this); },100); }
            else                        { helpers.balance($this); }

        },
        // Handle the key input
        key: function($this, value, fromkeyboard) {
            var settings = helpers.settings($this);
            if (settings.calcreset) { settings.calculator = ""; settings.calcreset = false; }
            if (value==".") {
                if (settings.calculator.indexOf(".")==-1 && settings.calculator.length<5) {
                    settings.calculator+=(settings.calculator.length?"":"0")+"."; } }
            else if (value=="c") { settings.calculator=""; }
            else if (value=="v") {
                if (settings.interactive) {
                    settings.calcreset = true;
                    if (settings.calculator==settings.value) { helpers.next($this); }
                    else {
                        settings.interactive = false;
                        settings.score--;
                        setTimeout(function(){ $this.find("#wrong").show(); },0);
                        setTimeout(function(){ $this.find("#wrong").hide(); settings.interactive =true; },1000);
                    }
                }
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
        course: {
            run: function($this) {
                var settings = helpers.settings($this);
                if (settings.cc.timerid) { clearTimeout(settings.cc.timerid); settings.cc.timerid = 0; }
                settings.cc.page = 0;
                settings.cc.count = 0;
                if (settings.art) { $this.find("#art").html("<img src='res/img/"+settings.art+".svg'/>").show(); }
                $this.find("#course").show();
                $this.find("#course pre").html("").parent().css("opacity",0).animate({opacity:0.9}, 1000, function() {
                    helpers.course.char($this); });
            },
            char: function($this) {
                var settings = helpers.settings($this);
                settings.cc.available = true;
                if (settings.cc.count<settings.course[settings.cc.page].length) {
                    $this.find("#course pre").append(settings.course[settings.cc.page][settings.cc.count]);
                    settings.cc.count++;
                    settings.cc.timerid = setTimeout(function() { helpers.course.char($this); }, 10);
                }
                else { settings.cc.timerid = 0; }
            },
            click: function($this) {
                var settings = helpers.settings($this);
                if (settings.cc.available) {
                    if (settings.cc.timerid) {
                        clearTimeout(settings.cc.timerid); settings.cc.timerid = 0;
                        $this.find("#course pre").html(settings.course[settings.cc.page]);
                    }
                    else {
                        settings.cc.count=0;
                        if (++settings.cc.page<settings.course.length) {
                            $this.find("#course pre").html("");
                            helpers.course.char($this);
                        }
                        else {
                            settings.cc.available = false;
                            $this.find("#course>div").animate({opacity:0},400, function() { $(this).parent().hide(); });
                        }
                    }
                }
            }
        }
    };

    // The plugin
    $.fn.balance = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    calculator      : "",
                    calcreset       : false,
                    ratio           : 1,
                    elts            : {},
                    elt             : {},
                    diff            : 0,
                    diffmax         : 30,
                    origin          : {},
                    wleft           : [],
                    wright          : [],
                    score           : 5,
                    id              : 0,
                    move            : { x:0, y:0 },
                    cc              : { count:0, page:0,timerid:0,available:false },
                    anim            : { init:0, diff:0, timerid:0, count: 0}
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
                $this.find("#splashex").hide();
                settings.ratio = $this.width()/640;
                helpers.build($this);
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            },
            calc: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if ($this.find("#calc").hasClass("s")) {
                    $this.find("#calc").removeClass("s");
                    $this.find("#calculator").hide();
                }
                else {
                    settings.calcreset = true;
                    $this.find("#calc").addClass("s");
                    $this.find("#calculator").show();
                }
            },
            key: function(value, _elt) {
                var $this = $(this);
                if (_elt) { $(_elt).addClass("touch");
                    setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
                }
                helpers.key($(this), value, false);
            },
            course: function() { helpers.course.click($(this)); }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in balance plugin!'); }
    };
})(jQuery);

