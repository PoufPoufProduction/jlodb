(function($) {
    // Activity default options
    var defaults = {
        name        : "abacus",                                 // The activity name
        label       : "Abacus",                                 // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        exercice    : [],                                       // Exercice
        type        : "suanpan",                                // Abacus type (suanpan/soroban/classic)
        mode        : "normal",                                 // Mode (normal, hexa)
        number      : 3,                                        // Number of exercices
        fontex      : 1,                                        // Exercice font size
        fx          : true,                                     // Add FX
        errratio    : 1,                                        // Ratio error
        reset       : true,                                     // Reset abacus after each question
        background  : "",                                       // Background image
        debug       : true                                     // Debug mode
    };

    var c = {
        suanpan: { b:[5,2],  u:[8,6], nb:13, defmove:true },
        soroban: { b:[4,1],  u:[8,6], nb:13, defmove:true },
        classic: { b:[10,0], u:[13,0],nb:13, defmove:true }
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
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.svg($this); });
            },
            // Load the svg if require
            svg:function($this) {
                var settings = helpers.settings($this),debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }
                var elt= $this.find("#board");
                elt.svg();
                settings.svg = elt.svg('get');
                $(settings.svg).attr("class",settings["class"]);

                settings.svg.load('res/img/desktop/abacus/'+settings.type+'.svg'+ debug,
                    { addTo: true, changeSize: true, onLoad:function() { helpers.loader.build($this); }
                });
            },
            build: function($this) {
                var settings = helpers.settings($this);

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }

                // Locale handling
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                // Data
                if (settings.gen && settings.number) {
                    settings.data = [];
                    var lastvalue = -1;
                    for (var i=0; i<settings.number; i++) {
                        var v=eval('('+settings.gen+')')(lastvalue);
                        settings.data.push(v);
                        lastvalue = v.value;
                    }
                }
                else { settings.number = settings.data.length; }

                // Balls
                 $(".b", settings.svg.root()).bind("touchstart mousedown", function(event) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                            event.originalEvent.touches[0]:event;
                    $(".b", settings.svg.root()).each(function() { $(this).attr("class",$(this).attr("class").replace(" m","")); });
                    
                    settings.ratio = $this.find("#board").height()/90;

                    var vOk = settings.interactive;
                    if (settings.data[settings.id].target && $(this).attr("class").indexOf("tgt")==-1) { vOk = false; }

                    if (vOk) {
                        var row = $(this).attr("id").substr(-1);
                        settings.mouse.row = (row=='a')?10:parseInt(row);
                        settings.mouse.col = parseInt($(this).parent().attr("id").substr(1));

                        if (settings.mouse.row>c[settings.type].b[0]) {
                            settings.mouse.up = (c[settings.type].u[0]-settings.mouse.row<=settings.status[settings.mouse.col][1]);
                            if (settings.mouse.up) {
                                for (var i=c[settings.type].u[0]-settings.status[settings.mouse.col][1]; i<=settings.mouse.row; i++) {
                                    $("#e"+settings.mouse.col+i, settings.svg.root()).attr("class",
                                        $("#e"+settings.mouse.col+i, settings.svg.root()).attr("class").replace(" up","")+" m"); }
                            } else {
                                for (var i=settings.mouse.row; i<=7-settings.status[settings.mouse.col][1]; i++) {
                                    $("#e"+settings.mouse.col+i, settings.svg.root()).attr("class",
                                        $("#e"+settings.mouse.col+i, settings.svg.root()).attr("class").replace(" up","")+" m"); }
                            }
                        }
                        else {
                            settings.mouse.up = (settings.mouse.row>settings.status[settings.mouse.col][0]);
                            if (settings.mouse.up) {
                                for (var i=settings.status[settings.mouse.col][0]+1; i<=settings.mouse.row; i++) {
                                    $("#e"+settings.mouse.col+(i==10?'a':i), settings.svg.root()).attr("class",
                                        $("#e"+settings.mouse.col+(i==10?'a':i), settings.svg.root()).attr("class").replace(" up","")+" m"); }
                            } else {
                                for (var i=settings.mouse.row; i<=settings.status[settings.mouse.col][0]; i++) {
                                    $("#e"+settings.mouse.col+(i==10?'a':i), settings.svg.root()).attr("class",
                                      $("#e"+settings.mouse.col+(i==10?'a':i), settings.svg.root()).attr("class").replace(" up","")+" m"  ); }
                            }
                        }
                        settings.mouse.clientY = vEvent.clientY;
                        settings.mouse.clientX = vEvent.clientX;
                        settings.mouse.move = 0;
						

                    }
                    event.preventDefault();
                });

                $this.find("#board").bind("mousemove touchmove", function(event) {
                    if (settings.interactive && settings.mouse.clientY) {
						
                        var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                            event.originalEvent.touches[0]:event;
                        if (c[settings.type].defmove) {
                            settings.mouse.move = ((vEvent.clientY - settings.mouse.clientY)/settings.ratio);
                        }
                        else {
                            settings.mouse.move = ((vEvent.clientX - settings.mouse.clientX)/settings.ratio);
                        }

                        var vMax = (settings.mouse.row>c[settings.type].b[0]?c[settings.type].u[1]:c[settings.type].u[0]);
                        if (settings.mouse.up)    {
                            settings.mouse.move = Math.min(0,settings.mouse.move);
                            if (settings.mouse.move<-vMax) { settings.mouse.move = -vMax; }
                        }
                        else {
                            settings.mouse.move = Math.max(0,settings.mouse.move);
                            if (settings.mouse.move>vMax) { settings.mouse.move = vMax; }
                        }
                        var vMove = settings.mouse.move;
                        if (!settings.mouse.up&&settings.mouse.row<=c[settings.type].b[0]) { vMove -= vMax; }
                        if (settings.mouse.up&&settings.mouse.row>c[settings.type].b[0])   { vMove += vMax; }

                        $(".b.m", settings.svg.root()).attr("transform","translate(0,"+vMove+")");

                    }
                });

                $this.find("#board").bind("mouseup mouseleave touchend touchleave", function(event) {
                    if (settings.interactive && settings.mouse.move) {
                        var vMax = (settings.mouse.row>c[settings.type].b[0]?c[settings.type].u[1]:c[settings.type].u[0]);
                        if (Math.abs(settings.mouse.move)>0.8*vMax) {
                            if (settings.mouse.row>c[settings.type].b[0]) {
                                settings.status[settings.mouse.col][1] = c[settings.type].u[0]-settings.mouse.row-(settings.mouse.up?1:0);
                            }
                            else {
                                settings.status[settings.mouse.col][0] = settings.mouse.row-(settings.mouse.up?0:1);
                            }
                            settings.ballid++;
                            
                            /*
                            if (settings.fx) {
                                var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?event.originalEvent.touches[0]:event;
                                var x           = vEvent.clientX-$this.offset().left;
                                var y           = vEvent.clientY-$this.offset().top;
                                $this.find("#fx>div").addClass("running").parent()
                                    .css("left",Math.floor(x)+"px")
                                    .css("top",Math.floor(y)+"px")
                                    .show();
                                setTimeout(function(){$this.find("#fx>div").removeClass("running").parent().hide(); },500);
                            }
                            */
                        
                        }
                    }
                    helpers.update($this);
                    $(".b", settings.svg.root()).each(function() { $(this).attr("class",$(this).attr("class").replace(" m","")); });
                    settings.mouse.clientY=0;
                    settings.mouse.move = 0;
                });

                // Exercice
                if ($.isArray(settings.exercice)) {
                    $this.find("#exercice>div").css("font-size",settings.fontex+"em").html("");
                    for (var i in settings.exercice) { $this.find("#exercice>div").append(
                        "<p>"+(settings.exercice[i].length?helpers.format(settings.exercice[i]):"&#xA0;")+"</p>"); }
                } else { $this.find("#exercice>div").html("<p>"+helpers.format(settings.exercice)+"<p>"); }


                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        update:function($this) {
            var settings = helpers.settings($this);

            for (var i=0; i<c[settings.type].nb; i++) {
                var value = settings.status[i][0]+5*settings.status[i][1];
                var vErr = "";
                if (settings.mode=="normal") {
                    switch (settings.type) {
                        case "suanpan" :
                            if (settings.status[i][0]==5 || settings.status[i][1]==2) { value="X"; vErr="err"; } break;
                        case "classic" :
                            if (settings.status[i][0]==10) { value="X"; vErr="err"; } break;
                    }
                }
                $("#val2 #c"+i, settings.svg.root()).text(value.toString()).attr("class",vErr);

                
                for (var j=1; j<=c[settings.type].b[0]; j++) {
                    var $elt    = $("#e"+i+((j==10)?'a':j), settings.svg.root());
                    var vClass  = $elt.attr("class").replace(" up","").replace(" tgt","");
                    var vUp     = (j<=settings.status[i][0]);
                    if (vUp) { vClass+=" up"; }
                    $elt.attr("transform","translate(0,"+(vUp?-c[settings.type].u[0]:0)+")").attr("class",vClass);
                }
                for (var j=0; j<c[settings.type].b[1]; j++) {
                    var $elt    = $("#e"+i+(7-j), settings.svg.root());
                    var vClass  = $elt.attr("class").replace(" up","").replace(" tgt","");
                    var vUp     = (j<settings.status[i][1]);
                    if (vUp) { vClass+=" up"; }
                    $elt.attr("transform","translate(0,"+(vUp?c[settings.type].u[1]:0)+")").attr("class",vClass);
                }
            }
            $this.find("#comment>div").html("");
            var t = settings.data[settings.id].target;
            if (t && settings.ballid<t.length) {
                var $elt = $("#e"+t[settings.ballid][0]+t[settings.ballid][1], settings.svg.root());
                $elt.attr("class", $elt.attr("class")+" tgt");

                if (t[settings.ballid].length>2) { $this.find("#comment>div").html(t[settings.ballid][2]); }
            }
        },
        next: function($this, _reset) {
            var settings = helpers.settings($this);
            $(".val text", settings.svg.root()).text("");
            $this.find("#effects").hide();
            $this.find("#submit").removeClass();
            settings.ballid = 0;

            var data = settings.data[settings.id], val, i;
            
            if (settings.svgclass) {
                $(settings.svg.root()).attr("class",$.isArray(settings.svgclass)?settings.svgclass[settings.puzzleid]:settings.svgclass);
            }
            
            $(".b", settings.svg.root()).each(function() {
                var tmp = $(this).attr("class");
                $(this).attr("class",tmp.replace(" wrong",""));
            });

            if (data.init) {
                settings.status = [];
                var val = data.init;
                for (var i=0; i<c[settings.type].nb; i++) {
                    var v = val%10, status=[0,0];
                    if (v>=5 && settings.type!= "classic") { status[1] = 1; v=v-5; }
                    status[0] = v;
                    val = Math.floor(val/10);
                    settings.status.push(status);
                }
            }
            else
            if (_reset) { settings.status = []; for (var i=0; i<c[settings.type].nb; i++) { settings.status.push([0,0]); } }

            if ($.isArray(data.value)) {
                i = 0; val = data.value[1];
                while(val>0) { $("#val0 #a"+i, settings.svg.root()).text(val%10); val = Math.floor(val/10); i++; }
                i = 0; val = data.value[2];
                while(val>0) { $("#val1 #b"+i, settings.svg.root()).text(val%10); val = Math.floor(val/10); i++; }
                $("#op", settings.svg.root()).text(data.value[0]);
                data.result=eval(data.value[1]+data.value[0]+data.value[2]);
            }
            else {
                i = 0; val = data.value;
                data.result = data.value;
                while(val>0) { $("#val1 #b"+i, settings.svg.root()).text(val%10); val = Math.floor(val/10); i++; }
            }
            helpers.update($this);
        }
    };

    // The plugin
    $.fn.abacus = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    id              : 0,
                    ballid          : 0,
                    svg             : 0,
                    status          : [],
                    ratio           : 0,
                    wrongs          : 0,
                    score           : 0,
                    mouse           : { clientY:0, col:0, row:0, up:true, move:0 }
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
            valid: function() {
                var $this = $(this) , settings = helpers.settings($this);

                var data = settings.data[settings.id], result = data.result, wrongs = 0;
                for (var i=0; i<c[settings.type].nb; i++) {
                    var $v = $("#val2 #c"+i, settings.svg.root());
                    if ($v.text()!=(result%10).toString()) {
                        wrongs++;
                        $v.attr("class","err");
                        $("#c"+i+" .b", settings.svg.root()).each(function() {
                            var tmp = $(this).attr("class");
                            $(this).attr("class",tmp+" wrong");
                        });
                    }
                    result=Math.floor(result/10);
                }
                settings.id++;
                settings.wrongs+=wrongs;

                $this.find("#good").toggle(!wrongs);
                $this.find("#wrong").toggle(wrongs);
                $this.find("#effects").show();
                $this.find("#submit").addClass(wrongs?"wrong":"good");

                if (settings.id<settings.data.length) {
                    setTimeout(function() { helpers.next($this, settings.reset); }, wrong?2000:500);
                }
                else {
                    settings.score = Math.max(0,Math.floor(5-settings.wrongs*settings.errratio));
                    setTimeout(function() { helpers.end($this); }, wrong?2000:500);
                }
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
                helpers.next($this, true);
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in abacus plugin!'); }
    };
})(jQuery);

