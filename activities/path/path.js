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
        effects     : true,
        background  : "",
        debug       : true                                     // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[strong\\\]([^\\\[]+)\\\[/strong\\\]",  "<div class='strong'>$1</div>",
        "\\\[h1\\\]([^\\\[]+)\\\[/h1\\\]",          "<div class='h1'>$1</div>",
        "\\\[small\\\]([^\\\[]+)\\\[/small\\\]",    "<div class='small'>$1</div>",
        "\\\[img\\\]([^\\\[]+)\\\[/img\\\]",        "<div class='img'><img src='$1.svg'/></div>",
        "\\\[a\\\]([^\\\[]+)\\\[/a\\\]",            "<div class='icon' style='float:left;margin:.1em;font-size:2em;'><img src='res/img/action/$1.svg'/></div>",
        "\\\[a2\\\]([^\\\[]+)\\\[/a2\\\]",          "<div class='icon' style='float:left;margin:.1em;font-size:4em;'><img src='res/img/action/$1.svg'/></div>"
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
                
                // AUTOMATIC FILL
                if (settings.gen) {
                    var gen = eval('('+settings.gen+')')();
                    if (gen.svg)    { $("#background",settings.svg.root()).html(gen.svg); }
                    if (gen.nodes)  { settings.nodes = gen.nodes; }
                    if (gen.result) { settings.result = gen.result; }
                    if (gen.limits) { settings.limits = gen.limits; }
                }
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }
                
                // GET THE NODES FROM SVG
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

                // BUILD A HASHTABLE OF NODE PROXIMITY IF ANY
                var limit = 0;
                settings.neighboor=[];
                if (settings.limit) { limit = $.isArray(settings.limit)?settings.limit[settings.current%settings.limit.length]:settings.limit; }
                if (limit) {
                    for (var i=0; i<settings.nodes.length; i++) { settings.neighboor[i] = []; }
                    for (var i=0; i<settings.nodes.length; i++) {
                        for (var j=i+1; j<settings.nodes.length; j++) {
                            if (helpers.isreachable(settings.nodes[i][0],settings.nodes[i][1],
                                    settings.nodes[j][0],settings.nodes[j][1], limit)) {
                                settings.neighboor[i].push(j);
                                settings.neighboor[j].push(i);
                            }
                        }
                    }
                }
                else {
                    for (var i=0; i<settings.nodes.length; i++) { settings.neighboor[i] = [];
                        for (var j=0; j<settings.nodes.length; j++) {
                            if (i!=j) { settings.neighboor[i].push(j); }
                        }
                    }
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
                                      
                            settings.ratio = $this.width()/settings.width;

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
                            
                            settings.currentlimit = helpers.getlimit($this, settings.begin[id].toString());
                            
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
                        var x  = settings.cursor.init[2] + (e.clientX - settings.cursor.init[0])/settings.ratio;
                        var y  = settings.cursor.init[3] + (e.clientY - settings.cursor.init[1])/settings.ratio;
                        var begin = settings.nodes[settings.begin[id]];
                        
                        var dx = Math.abs(x-begin[0]), dy = Math.abs(y-begin[1]);
                        if (settings.constraint=="ortho") { if (dx>dy) { y = begin[1]; } else { x = begin[0]; } }
                            
                        var ok = true;
                        if (settings.currentlimit) { ok = helpers.isreachable(x,y, begin[0],begin[1],settings.currentlimit); }
                            

                        if (ok) {
                            var dist    = -1;
                            var current = -1;
                            for (var i=0; i<settings.neighboor[settings.begin[id]].length; i++) {
                                var index   = settings.neighboor[settings.begin[id]][i];
                                var node    = settings.nodes[index];
                                var d       = (x-node[0])*(x-node[0]) + (y-node[1])*(y-node[1]);

                                if ((dist==-1||d<dist) && d<settings.radius*settings.radius) {
                                    if ((limit==0) || ( helpers.isreachable(x, y, node[0], node[1], limit) )) {
                                        current = index; dist = d;
                                    }
                                }
                            }
                            
                            if (current!=-1) {
                                x = settings.nodes[current][0]; y = settings.nodes[current][1];

                                // BACKWARD: REMOVE LAST PATH
                                if (settings.paths[id] && settings.paths[id].nodes && settings.paths[id].nodes.length &&
                                                current == settings.paths[id].nodes[settings.paths[id].nodes.length-1] ) {
                                    $("#cc"+settings.current+"x"+(settings.paths[id].paths.length-1), settings.svg.root()).detach();
                                    settings.paths[id].nodes.splice(-1,1);
                                    settings.paths[id].paths.splice(-1,1);
                                }
                                // FORWARD: DRAW NEW PATH
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
                                
                                settings.currentlimit = helpers.getlimit($this, current.toString());
                                
                                $(settings.path).attr("x1",x).attr("y1",y);
                                settings.begin[id] = current;
                            }
                            
                            $("#c"+settings.current, settings.svg.root()).attr("transform","translate("+x+","+y+")");
                            $(settings.path).attr("x2",x).attr("y2",y);

                        }
                    }
                        _event.preventDefault();
                });


                $this.bind("touchend touchleave mouseup mouseleave", function(_event) {
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
                            if (settings.effects) {
                                $this.find("#goal").css("left","110%").show().delay(400).animate({left:"60%"},300);
                                setTimeout(function() { $this.find("#effects").show(); }, 1000);
                            }
                            if ($("#flags", settings.svg.root()).length) {
                                $($("#flags>*", settings.svg.root()).get(rr[rr.length-1])).show();
                            }
                            settings.interactive = false;
                            setTimeout(function() { helpers.end($this);}, 2000);
                        }
                    }
                        _event.preventDefault();
                });

                // Tips
                if (settings.tips) {
                    $this.find("#tip>div").html(settings.tips.length).parent().show();
                }
                
                // Locale handling

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
                            "<p>"+(settings.exercice[i].length?helpers.format(settings.exercice[i]):"&#xA0;")+"</p>"); }
                    } else { $this.find("#exercice>div").css("font-size",settings.fontex+"em").html(helpers.format(settings.exercice)).parent().show(); }
                }
                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        isreachable: function (_x1,_y1,_x2,_y2,_limit) {
            var ret;
            if ($.isArray(_limit))        { ok = (_y2-_y1<=_limit[0]) && (_y1-_y2<=_limit[2]) &&
                                                 (_x2-_x1<=_limit[3]) && (_x1-_x2<=_limit[1]); } else
            if (typeof(_limit)=="object") { ok = ( Math.abs(_x1-_x2) < _limit.x) && ( Math.abs(_y1-_y2) < _limit.y); }
            else                          { ok = ((_x1-_x2)*(_x1-_x2) + (_y1-_y2)*(_y1-_y2) <= _limit*_limit); }
            return ok;
        },
        getlimit: function($this, _id) {
            var settings = helpers.settings($this);
            var ret = 0;
            if (settings.limit) {
                ret = $.isArray(settings.limit)?settings.limit[settings.current%settings.limit.length]:settings.limit;
            }
            if (settings.limits) {
                var limits = $.isArray(settings.limits)?
                    settings.limits[settings.current%settings.limits.length]:settings.limits;
                if (limits[_id]) { ret = limits[_id]; }
            }
            return ret;
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
                    currentlimit    : 0,
                    cursor          : { init:[], current: -1 },         // mouse position
                    begin           : {},                               // point of the current path (by pointer id)
                    path            : 0,                                // the current path (not validated)
                    paths           : {},                               // validated path (by pointer id)
                    tipid           : 0
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
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            },
            showhelp: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.tipid<settings.tips.length) { $this.find("#mask").show(); }
            },
            help: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.tipid<settings.tips.length) {
                    var tip=settings.tips[settings.tipid];
                    var begin = tip[0];
                    for (var i=1; i<tip.length; i++) {
                        var end=tip[i];
                        
                        settings.svg.line( $("#tips", settings.svg.root()),
                            settings.nodes[begin][0], settings.nodes[begin][1],
                            settings.nodes[end][0], settings.nodes[end][1] );
                        
                        begin=end;
                    }
                    settings.score--;
                    settings.tipid++;
                    
                    $this.find("#tip>div").html(settings.tips.length-settings.tipid);
                }
                $this.find("#mask").hide();
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in path plugin!'); }
    };
})(jQuery);

