(function($) {
    // Activity default options
    var defaults = {
        name        : "path",                            // The activity name
        label       : "Path",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        exercice    : [],                               // Exercice
        url         : "",
        dots        : ".values>*",                        // values
        radius      : 5,                               // magnetic radius
        first       : 0,                                    // first dot
        sizepoint  : 15,
        colorpoint : "rgba(255,0,0,0.5)",
        sizepath    : 3,
        colorpath   : "yellow",
        colorpathf  : "black",
        limit       : 0,                            // Segment limit
        result      : "",
        fontex      : 1,
        groupname   : "paths",
        group       : 0,
        width       : 640,
        effects     : false,
        debug       : true                                     // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[strong\\\]([^\\\[]+)\\\[/strong\\\]",        "<div class='strong'>$1</div>",
        "\\\[h1\\\]([^\\\[]+)\\\[/h1\\\]",        "<div class='h1'>$1</div>",
        "\\\[small\\\]([^\\\[]+)\\\[/small\\\]",        "<div class='small'>$1</div>",
        "\\\[img\\\]([^\\\[]+)\\\[/img\\\]",        "<div class='img'><img src='res/img/$1.svg'/></div>",
        "\\\[action\\\]([^\\\[]+)\\\[/action\\\]",  "<div class='icon' style='float:left;margin:.1em;font-size:2em;'><img src='res/img/action/$1.svg'/></div>"
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
                var elt= $this.find("#board");
                elt.svg();
                settings.svg = elt.svg('get');

                settings.svg.load('res/img/'+settings.url+ debug,
                    { addTo: true, changeSize: true, onLoad:function() {
                        $this.find("#board>svg").attr("class",settings["class"]);
                        helpers.loader.build($this);
                    }
                });
            },
            build: function($this) {
                var settings = helpers.settings($this);

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }

                $this.css("font-size", Math.floor($this.height()/12)+"px");

                // Build the nodes
                if (typeof(settings.dots)=="string") {
                    var gloss={};
                    $(settings.dots,settings.svg.root()).each(function() {
                        if ($(this).is("circle")) {
                            if ($(this).attr("id")) {
                                gloss[$(this).attr("id")] = [ parseFloat($(this).attr("cx")), parseFloat($(this).attr("cy")) ];
                            }
                            settings.nodes.push( [ parseFloat($(this).attr("cx")), parseFloat($(this).attr("cy")) ] );
                        }
                        else if ($(this).is("use")) {
                            var ref = gloss[$(this).attr("xlink:href").substr(1)];
                            var m = $(this).attr("transform").match(/(-*[\.0-9]+),(-*[\.0-9]+)/);
                            var x = ref[0]+parseFloat(m[1]);
                            var y = ref[1]+parseFloat(m[2]);
                            if ($(this).attr("id")) { gloss[$(this).attr("id")] = [ x,y ]; }
                            settings.nodes.push( [x,y] );
                        }
                    });
                }

                settings.group = $("#"+settings.groupname, settings.svg.root());
                if (!settings.group.length) {
                    settings.group = $(settings.svg.group());
                    settings.group.attr("id", "#"+settings.groupname);
                }

                var ff = settings.first;
                if (!$.isArray(ff)) { ff = [ff]; }

                for (var i=0; i<ff.length; i++) {
                    var f = settings.nodes[ff[i]];
                    var cursor = $("#c"+i,settings.svg.root());
                    if (!cursor.length) {
                        cursor = $(settings.svg.circle(0, 0,
                        $.isArray(settings.sizepoint)?settings.sizepoint[i%settings.sizepoint.length]:settings.sizepoint,
                        { style: "fill:"+($.isArray(settings.colorpoint)?settings.colorpoint[i%settings.colorpoint.length]:settings.colorpoint)+";"+
                                 "cursor:move" } ));
                    }
                    cursor.attr("transform","translate("+f[0]+","+f[1]+")")
                          .attr("id", "c"+i).show()
                          .bind("touchstart mousedown", function(_event) {
                        if (settings.interactive) {
                            var e = (_event && _event.originalEvent &&
                                 _event.originalEvent.touches && _event.originalEvent.touches.length)?
                                 _event.originalEvent.touches[0]:_event;

                            var id = $(this).attr("id"), nid = parseInt(id.substr(1));
                            settings.current = nid;
                            if (!settings.begin[id]) {
                                settings.begin[id] = $.isArray(settings.first)?settings.first[nid%settings.first.length]:settings.first;
                            }
                            settings.cursor.init = [ e.clientX, e.clientY,
                                                     settings.nodes[settings.begin[id]][0], settings.nodes[settings.begin[id]][1]];
                            if (settings.path) { $(settings.path).detach(); }
                            settings.path = settings.svg.line( settings.group,
                                settings.nodes[settings.begin[id]][0],
                                settings.nodes[settings.begin[id]][1],
                                settings.nodes[settings.begin[id]][0]+0.01,
                                settings.nodes[settings.begin[id]][1]+0.01,
                                { "style" : "fill:none;stroke-linecap:round;stroke-linejoin:miter;"+
                                            "stroke-width:"+($.isArray(settings.sizepath)?settings.sizepath[i%settings.sizepath.length]:settings.sizepath)+";"+
                                            "stroke:"+($.isArray(settings.colorpath)?settings.colorpath[i%settings.colorpath.length]:settings.colorpath)
                                }
                            );
                            // $("#"+id, settings.svg.root()).detach().appendTo(settings.svg.root());
                            
                        }
                        _event.preventDefault();
                    });
                }


                $this.bind("touchmove mousemove", function(_event) {
                    if (settings.interactive && settings.current != -1 ) {
                        var e = (_event && _event.originalEvent &&
                                 _event.originalEvent.touches && _event.originalEvent.touches.length)?
                                 _event.originalEvent.touches[0]:_event;
                        var id = "c"+settings.current;
                        var x = settings.cursor.init[2] + (e.clientX - settings.cursor.init[0])/settings.ratio;
                        var y = settings.cursor.init[3] + (e.clientY - settings.cursor.init[1])/settings.ratio;

                        var dist = -1;
                        var current = -1;
                        for (var i=0; i<settings.nodes.length; i++) {
                            if (i!= settings.begin[id]) {
                                var d = (x-settings.nodes[i][0])*(x-settings.nodes[i][0]) +
                                        (y-settings.nodes[i][1])*(y-settings.nodes[i][1]);

                                if ((dist==-1||d<dist) && d<settings.radius*settings.radius) {
                                    current = i; dist = d;
                                }
                            }
                        }

                        
                        if (current!=-1) {

                            

                            var limit = 0, ok = true;
                            var vx = settings.nodes[current][0], vy = settings.nodes[current][1];
                            if (settings.limit) { limit = $.isArray(settings.limit)?
                                                    settings.limit[settings.current%settings.limit.length]:settings.limit; }
                            if (limit) { 
                                if (typeof(limit)=="object") {
                                    ok = ( Math.abs(vx-settings.nodes[settings.begin[id]][0]) < limit.x) &&
                                         ( Math.abs(vy-settings.nodes[settings.begin[id]][1]) < limit.y);
                                }
                                else {
                                    var d = (vx-settings.nodes[settings.begin[id]][0])*(vx-settings.nodes[settings.begin[id]][0]) +
                                            (vy-settings.nodes[settings.begin[id]][1])*(vy-settings.nodes[settings.begin[id]][1]);
                                    ok = (d<=limit*limit);
                                }
                            }

                            if (ok)  {
                                x = settings.nodes[current][0]; y = settings.nodes[current][1];

                                if (settings.paths[id] && settings.paths[id].nodes && settings.paths[id].nodes.length &&
                                                current == settings.paths[id].nodes[settings.paths[id].nodes.length-1] ) {
                                    $("#cc"+settings.current+"x"+(settings.paths[id].paths.length-1), settings.svg.root()).detach();
                                    settings.paths[id].nodes.splice(-1,1);
                                    settings.paths[id].paths.splice(-1,1);
                                }
                                else {

                                    if (!settings.paths[id]) { settings.paths[id] = { paths:[], nodes:[] }; }

                                    settings.paths[id].paths.push(settings.svg.line( settings.group,
                                        settings.nodes[settings.begin[id]][0], settings.nodes[settings.begin[id]][1], x,y,
                                        {   "id"    : "cc"+settings.current+"x"+settings.paths[id].paths.length,
                                            "style" : "fill:none;stroke-linecap:round;stroke-linejoin:miter;"+
                                                    "stroke-width:"+($.isArray(settings.sizepath)?settings.sizepath[i%settings.sizepath.length]:settings.sizepath)+";"+
                                                    "stroke:"+($.isArray(settings.colorpathf)?settings.colorpathf[i%settings.colorpathf.length]:settings.colorpathf)
                                        }
                                    ));
                                    settings.paths[id].nodes.push(settings.begin[id]);
                                    $(settings.path).detach().appendTo(settings.group);
                                }

                                $(settings.path).attr("x1",x).attr("y1",y);
                                settings.begin[id] = current;
                            }

                        }

                        $("#c"+settings.current, settings.svg.root()).attr("transform","translate("+x+","+y+")");
                        $(settings.path).attr("x2",x).attr("y2",y);
                        
                    }
                        _event.preventDefault();
                });


                $this.bind("touchend mouseup", function(_event) {
                    if (settings.interactive && settings.current != -1 ) {

                        var id = "c"+settings.current;
                        $("#c"+settings.current, settings.svg.root())
                            .attr("transform","translate("+settings.nodes[settings.begin[id]][0]+","+settings.nodes[settings.begin[id]][1]+")");
                        
                        if (settings.path) { $(settings.path).detach(); }
                        settings.current  = -1;

                        // CHECK RESULT FOR EACH CURSOR
                        var ff = settings.first, good = true;
                        if (!$.isArray(ff)) { ff = [ff]; }

                        for (var i=0; i<ff.length; i++) {
                            var r = $.isArray(settings.result)?settings.result[i%settings.result.length]:settings.result, rr = 0;

                            // OBJECTIVE IS A PATH
                            if (r.toString().indexOf(',')!=-1)     { rr = r.split(','); } else
                            if (r.toString().indexOf('to')!=-1)    {
                                var m = r.match(/([0-9]+)to([0-9]+)/); rr = [];
                                for (var j = parseInt(m[1]); j <= parseInt(m[2]); j++) { rr.push(j); }
                            }
                            var p = settings.paths["c"+i];
                            if (settings.dev) { alert(p.nodes.join(',')+','+settings.begin["c"+i]); }
                            if (rr) {
                                if (p && p.nodes && (p.nodes.length+1 == rr.length) && (settings.begin["c"+i] == rr[rr.length-1]) ) {
                                    for (var j=0; j<p.nodes.length; j++) { if (p.nodes[j]!=rr[j]) { good = false; } }
                                }
                                else { good = false; }
                            }
                            else { good = good && (settings.begin["c"+i] == r); }
                        }

                        if (good) {
                            for (var i=0; i<ff.length; i++) { $("#c"+i,settings.svg.root()).hide(); }
                            $this.find("#board>svg").attr("class",settings["class"]+" done");
                            if (settings.effects) { $this.find("#effects").show(); }
                            settings.interactive = false;
                            setTimeout(function() { helpers.end($this);}, 2000);
                        }
                    }
                        _event.preventDefault();
                });

                // Locale handling
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                if (settings.text) {
                    if (typeof(settings.text)=="object") {
                        for (var i in settings.text) { $("#"+i,settings.svg.root()).text(settings.text[i]); }
                    }
                    else {
                        var gtext = settings.gtext?"#"+settings.gtext+" ":"";
                        $(gtext+".t",settings.svg.root()).each(function(_i) { if (_i<settings.text.length) $(this).text(settings.text[_i]); });
                    }
                }

                // Exercice
                if (settings.exercice && settings.exercice.length) {
                    if ($.isArray(settings.exercice)) {
                        $this.find("#exercice>div").css("font-size",settings.fontex+"em").html("").parent().show();
                        for (var i in settings.exercice) { $this.find("#exercice>div").append(
                            "<p>"+(settings.exercice[i].length?helpers.format(settings.exercice[i]):"&nbsp;")+"</p>"); }
                    } else { $this.find("#exercice>div").css("font-size",settings.fontex+"em").html(helpers.format(settings.exercice)).parent().show(); }
                }
                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        }
    };

    // The plugin
    $.fn.path = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    score           : 5,
                    nodes           : [],
                    ratio           : 1,
                    current         : -1,                               // current path pointer
                    cursor          : { init:[], current: -1 },         // mouse position
                    begin           : {},                               // point of the current path (by pointer id)
                    path            : 0,                                // the current path (not validated)
                    paths           : {}                                // validated path (by pointer id)
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
                settings.ratio = $this.width()/settings.width;
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in path plugin!'); }
    };
})(jQuery);

