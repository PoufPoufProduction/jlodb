(function($) {
    // Activity default options
    var defaults = {
        name        : "paint",                                  // The activity name
        label       : "Paint",                                  // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        url         : "",                                       // The board as svg url, html url or element
        board       : "",                                       // The board content
        boardsize   : 1,                                        // The board font-size
        mode        : "class",                                  // Fill mone [class,content]
        lang        : "en-US",                                  // Current localization
        nbcolor     : 2,                                        // Number of colors
        fontex      : 1,                                        // The font-size multiplicator
        result      : "",                                       // The result
        source      : ["source",""],                            // The source group + prefix
        canvas      : "canvas",                                 // Toggle element group
        toggle      : "c",                                      // Toggle element class
        remove      : false,                                    // Remove previous painting
        number      : 1,                                        // Number of exercices
        tag         : 0,
        tagsize     : 1,
        scorearg    : 0,
        errratio    : 1,
        effects     : true,                                     // Show effects
        background  : "",
		dev			: false,
        debug       : true                                     // Debug mode
    };
    
    var sources = {
        db16 : [["1","","#140c1c","white"],["2","","#442434","white"],["3","","#30346d","white"],["4","","#4e4a4f","white"],["5","","#854c30","white"],["6","","#346524","white"],["7","","#d04648","white"],["8","","#757161","white"],["9","","#597dce","white"],["a","","#d27d2c","white"],["b","","#8595a1","white"],["c","","#6daa2c","white"],["d","","#d2aa99","white"],["e","","#6dc2ca","white"],["f","","#dad45e","white"],["g","","#deeed6","white"]],
        db32 : [["1","","#000000","white"],["2","","#231f34","white"],["3","","#44283c","white"],["4","","#663931","white"],["5","","#8f563b","white"],["6","","#df7126","white"],["7","","#d99f65","white"],["8","","#eec49b","white"],["9","","#faf235","white"],["a","","#99e550","white"],["b","","#6bbd2f","white"],["c","","#36946e","white"],["d","","#4b692e","white"],["e","","#534b25","white"],["f","","#323c39","white"],["g","","#3f3e73","white"],["h","","#2f6082","white"],["i","","#5a6ee1","white"],["j","","#649aff","white"],["k","","#5fcde4","white"],["l","","#cbdbfc","white"],["m","","#ffffff","white"],["n","","#9badb7","white"],["o","","#847e87","white"],["p","","#696a6a","white"],["q","","#595651","white"],["r","","#75418a","white"],["s","","#ac3232","white"],["t","","#d95662","white"],["u","","#d67bba","white"],["v","","#8f974a","white"],["w","","#896e2f","white"]]
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
        end: function($this, _args) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this, _args);
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
                
                if (settings.url.indexOf(".html")!=-1) {
                    var templatepath = settings.url+debug;
                    $this.find("#ptboard").load( templatepath, function(response, status, xhr) { helpers.loader.build($this); });
                }
                else if (settings.url.indexOf(".svg")!=-1) {
                    var elt= $("<div id='svg'></div>").appendTo($this.find("#ptboard"));
                    elt.svg();
                    settings.svg = elt.svg('get');

                    settings.svg.load(settings.url + debug,
                        { addTo: true, changeSize: true, onLoad:function() { helpers.loader.build($this); }
                    });
                }
                else {
                    $this.find("#ptboard").html(settings.url);
                    helpers.loader.build($this);
                }
            },
            build: function($this) {
                var settings = helpers.settings($this);

                $this.children().hide()

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }

                if (settings.data) { settings.nbcolor = settings.data.length; }

                var source = settings.source;
                if (typeof(source)=="string" && sources[source]) { source = sources[source]; }
                
                if (source && $.isArray(source[0])) {
                    $this.addClass("full");
                    $this.find("#ptsources").html("");
                    for (var i=0; i<source.length; i++) {
                        var s = source[i];
                        var $html;
                        
                        if (settings.mode=="content" && s.length>4) {
                            $html = $("<div id='s"+s[0]+"' style='color:"+s[3]+";background-color:"+s[2]+";'></div>");
                            $html.append("<div class='val2'>"+s[4]+"</div>");
                            $html.append("<div class='val1'>"+(s.length>5?s[5]:s[1])+"</div>");
                        }
                        else {
                            $html = $("<div id='s"+s[0]+"' style='color:"+s[3]+";background-color:"+s[2]+";'>"+s[1]+"</div>");
                        }
                        $this.find("#ptsources").append($html);
                        
                        $html.bind('touchstart mousedown', function(event) {
                            var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                    event.originalEvent.touches[0]:event;
                            if (settings.interactive) {
                                $this.find("#ptsources>div").removeClass("s");
                                $(this).attr("class","s");
                                settings.color = [$(this).attr("id").substr(1),-1];
                            }
                            event.preventDefault();
                        });
                        
                    }
                    
                    if (typeof(settings.selected) != "undefined") {
                        $("#ptsources #s"+settings.selected).addClass("s");
                        settings.color = [settings.selected,-1];
                    }
                }
                else {
                    for (var i=0; i<settings.nbcolor; i++) {
                        if (settings.svg) {
                            var $elt = $("#"+source[0]+" #"+source[1]+i, settings.svg.root());
                            $elt.bind('touchstart mousedown', function(event) {
                                var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                        event.originalEvent.touches[0]:event;
                                if (settings.interactive) {
                                    $("#"+source[0]+" .s", settings.svg.root()).attr("class","");
                                    $(this).attr("class","s");
                                    settings.color = [parseInt($(this).attr("id").substr(source[1].length)),-1];
                                }
                                event.preventDefault();
                            });
                        }
                    }
                    if (typeof(settings.selected) != "undefined") {
                        
                        if (settings.svg) { $("#"+source[0]+" #"+source[1]+settings.selected, settings.svg.root()).attr("class","s"); }
                        settings.color = [settings.selected,-1];
                    }
                }

                $this.find("#ptboard").bind('touchstart mousedown', function(_event) { settings.down=true; _event.preventDefault();})
                                    .bind('touchend touchleave mouseup mouseleave', function(_event) { settings.elt=0; settings.down=false; _event.preventDefault();});

                $this.find("#g_instructions #content").css("font-size",0.5*settings.fontex+"em");
                helpers.build($this);

                // Locale handling

                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                $this.children().show()
                if (!$this.find("#g_splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        board: {
            text: function($this){
                var settings    = helpers.settings($this);
                var html        = "<div class='word'>";
                var r           = $.isArray(settings.result)?settings.result[0]:settings.result;
                
                settings.number = 1;
                    
                for (var i in r) {
                    if (r[i]==' ')  { html+="</div><div class='c'></div><div class='word'>"; }
                    else            {
                        var val = r[i];
                        if (settings.source) { for (var s in settings.source) { if (settings.source[s][0]==r[i]) { val=settings.source[s][1]; }} }
                        var font=1;
                        if (val.length>1) { font-=val.length*0.1; }
                        html+="<div><div class='label' style='font-size:"+font+"em;height:"+(1.2/font)+"em;'>"+val+"</div><div class='c'></div></div>";
                    }
                }
                $this.find("#ptboard").addClass("text")
                     .html("<div id='canvas'  style='font-size:"+settings.boardsize+"em;'>"+html+"</div></div>");
            }
        },
        build: function($this) {
            var settings = helpers.settings($this);
            
            if (settings.lastcanvas) {
                    var vElt = 0;
                    if (settings.svg) { vElt = $("#"+settings.lastcanvas+" ."+settings.toggle, settings.svg.root()); }
                    else              { vElt = $this.find("#"+settings.lastcanvas+" ."+settings.toggle); }

                    vElt.each(function() {
                        var vClass=$(this).attr("class");
                        if (vClass) {
                            vClass=vClass.replace(" wrong","");
                            if (settings.remove) { vClass=vClass.replace(/ c[0-9]/g,""); }
                            $(this).attr("class",vClass);
                        }
                    });
            }

            var exercice = settings.exercice;
            var tag      = settings.tag;
            if (settings.gen) {
                var vValue = eval('('+settings.gen+')')($this, settings,settings.id);
                if (vValue.exercice) { exercice = vValue.exercice; }
                if (vValue.tag)      { tag = vValue.tag; }
                if (vValue.result)   { settings.result = vValue.result; }
                if (vValue.t)        { settings.t = vValue.t; }
                if (vValue.txt)      { settings.txt = vValue.txt; }
				if (vValue.img)		 { settings.img = vValue.img; }
                if (vValue.legend)   { settings.legend = vValue.legend; }
                if (vValue.canvas)   { settings.canvas = vValue.canvas; }
                if (vValue.o)   	 { settings.o = vValue.o; }
                settings.scorearg = vValue.scorearg;
            }
            
            if (helpers.board[settings.board]) { helpers.board[settings.board]($this); }
 
            var t = settings.t;
            if (!t && settings.values) { number=settings.values.length; t = settings.values[settings.id%settings.values.length].t; }
            if (t) {
                if (settings.svg) {
                    $("text.t", settings.svg.root()).each(function(_index) {
                        if (_index<t.length) {
                            if ($.isArray(t)) { $(this).text(t[_index]); }
                            else { $(this).text(t[_index].charCodeAt(0)>60?t[_index].charCodeAt(0)-55:t[_index]); }
                        }
                    });
                }
            }
            
            if (settings.txt) {
                for (var i in settings.txt) {
                    if (settings.svg) { $("text#"+i, settings.svg.root()).text(settings.txt[i]); }
                }
            }
            
            if (settings.img) {
                for (var i in settings.img) {
                    if (settings.svg) {
						$("image#"+i, settings.svg.root()).attr("xlink:href",settings.img[i]).show();
					}
                }
            }
            
            if (settings.legend) {
                var legend = settings.legend;
                if ($.isArray(legend)) { legend = legend[settings.id%legend.length]; }
                var html="";
                for (var i in legend) {
                    html+="<div><div class='label'>"+i+"</div><div class='value'>"+jtools.format(legend[i])+"</div></div>";
                }
                
                $this.find("#ptlegend").html(html).draggable({axis:'y',containment:'parent'}).show();
            }

            var o = settings.o;
            if (!o && settings.values) { o = settings.values[settings.id%settings.values.length].o; }
            if (o) {
                $(".o", settings.svg.root()).each(function(_index) {
                    if (_index<o.length) { var val = o[_index]; if (val==' ') val = '0'; $(this).attr("class","o c"+val); }
                });
            }

            // SVGCLASS
            if (settings.svgclass) {
                var svgclass = $.isArray(settings.svgclass)?settings.svgclass[settings.id%settings.svgclass.length]:settings.svgclass;
                $this.find("svg").attr("class",svgclass);
            }

            // UNBIND
            if (settings.svg) { $("."+settings.toggle, settings.svg.root()).unbind('touchmove mousemove'); }
            else              { $this.find("#ptboard ."+settings.toggle).unbind('touchmove mousemove'); }
            
            // HANDLE CANVAS
            var canvas = settings.canvas;
            if ($.isArray(canvas)) { canvas = canvas[settings.id%canvas.length]; }
            if (settings.svg) {
                if (settings.lastcanvas) { $("#"+settings.lastcanvas, settings.svg.root()).css("display","none"); }
                $("#"+canvas, settings.svg.root()).css("display","inline");
            }
            else              {
                if (settings.lastcanvas) {$("#"+settings.lastcanvas, settings.svg.root()).css("display","none"); }
                $this.find("#ptboard #"+canvas).css("display","inherit");
            }
            settings.lastcanvas = canvas;
            
            var toggles = settings.svg?
                $("#"+canvas+" ."+settings.toggle, settings.svg.root()):
                $this.find("#ptboard #"+canvas+" ."+settings.toggle);
                
            toggles.each(function(_index) {
                    $(this).unbind('touchmove mousemove touchstart mousedown');
					
                    $(this).bind('touchmove', function(_event) {
						var vEvent =
							(_event && _event.originalEvent && _event.originalEvent.touches && _event.originalEvent.touches.length)?
							_event.originalEvent.touches[0]:_event;
						var $e=$(document.elementFromPoint(vEvent.pageX,vEvent.pageY));
						
						if ($e) {
							var isToggle = false;
							if ($e.attr("class")) {
								var cc = $e.attr("class").split(" ");
								for (var it in cc) { if (cc[it]==settings.toggle) { isToggle = true; } }
							}
							if (!isToggle) { $e = $e.parent("."+settings.toggle); }
						}

                        if (settings.interactive && settings.color[0]!=-1 && settings.down && $e && $e.attr("class") && settings.elt!=$e) {
                            helpers.paint($this, $e, false);
                            if (settings.cbk) { eval('('+settings.cbk+')')(settings.svg.root(),helpers.result($this), $e.attr("id").substr(1)); }
                        }
                        settings.elt = $e;
                        _event.preventDefault();
                    });
					
                    $(this).bind('mousemove', function(_event) {
						var $e = $(this);
						
                        if (settings.interactive && settings.color[0]!=-1 && settings.down && settings.elt!=$e) {
                            helpers.paint($this, $(this), false);
                            if (settings.cbk) { eval('('+settings.cbk+')')(settings.svg.root(),helpers.result($this), $e.attr("id").substr(1)); }
                        }
                        settings.elt = $e;
                        _event.preventDefault();
                    });
                    $(this).bind('touchstart mousedown', function(_event) {
						var $e = $(this);
                        if (settings.interactive && settings.color[0]!=-1) {
                            helpers.paint($this, $e, true);
                            if (settings.cbk) { eval('('+settings.cbk+')')(settings.svg.root(),helpers.result($this), $e.attr("id").substr(1)); }
                        }
                        settings.elt = $e;
                        _event.preventDefault();
                    });
                    $(this).attr("id","c"+_index);
            });
            
            if (!exercice && settings.values) { exercice = settings.values[settings.id].exercice; }
            if (exercice) {
				$this.find("#g_instructions #content").html(jtools.instructions(exercice));
				$this.find("#g_instructions").show();
				if (tag) {
					if (tag.indexOf(".svg")!=-1) { tag="<div class='char'><img src='"+tag+"' alt=''/></div>"; }
					else                         { tag="<div style='font-size:"+settings.tagsize+"em;'>"+tag+"</div>"; }
					$this.find("#g_instructions #tag").html(tag).show();
				}
			}

            $this.find("#g_submit").removeClass();
            $this.find("#g_effects").removeClass();

        },
        result: function($this) {
            var result="", settings = helpers.settings($this);
            var canvas = $.isArray(settings.canvas)?settings.canvas[settings.id%settings.canvas.length]:settings.canvas;
            var $elts;
            if (settings.svg) { $elts = $("#"+canvas+" ."+settings.toggle, settings.svg.root()); }
            else              { $elts = $this.find("#ptboard #"+canvas+" ."+settings.toggle); }
            $elts.each(function(_index) {
                var vClass = $(this).attr("class"), val;
                if (vClass==settings.toggle) { val=" "; } else { val = vClass.substr(-1); }
                if (settings.data&&settings.data[val]&&settings.data[val].skip) { val =" "; }
                result+=val;
            });
            return result;
        },
        paint: function($this, $elt, _begin) {
            var settings = helpers.settings($this);
            var ok = true;
			
            var c = $elt.attr("class").substr(-1);
            if (c=="c") { c = -1; }
            
            if (_begin) {
                settings.color[1] = settings.color[0];
				
				var id = c;
				if ( settings.color[1]!=-1 && settings.source ) {
                    for (var s=0; s<settings.source.length; s++) {
						if (settings.source[s][0]==settings.color[1]) {id=s; break; }}
				}
				if (    c!=-1 && settings.data && settings.data[id] &&
						(settings.data[id].toggle||settings.data[id].notover) && c==settings.color[1])
					{  settings.color[1] = -1; }
            }

            if (settings.data ) {
                if (c!=-1 && settings.data[c] && settings.data[c].notover && c!=settings.color[0]) { ok = false; }
            }

            if (ok) {
                $elt.attr("class",settings.color[1]!=-1?"c c"+settings.color[1]:"c");

                if (settings.mode=="content") {
                    var val="";
                    if ( settings.color[1]!=-1 && settings.source ) {
                        var s=0;
                        for (var ss in settings.source) {
                            if (settings.source[ss][0]==settings.color[1]) {s=settings.source[ss]; break; }}
                        if (s.length>4) { val = s[4]; }
                    }
                    $elt.html(val);
                }
                
                if (settings.onpaint) { eval('('+settings.onpaint+')')($this, settings, helpers.result($this)); }
            }
        }
    };

    // The plugin
    $.fn.paint = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    down            : false,
                    score           : 5,
                    color           : [-1,-1],
                    elt             : 0,
                    id              : 0,
                    lastcanvas      : 0
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
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.finish = true;
                helpers.end($this,{'status':'abort'});
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
            },
            tag: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive && settings.legend) { $this.find("#ptlegend").toggle(); }
            },
            valid: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {

                    var canvas = $.isArray(settings.canvas)?settings.canvas[settings.id%settings.canvas.length]:settings.canvas;
                    settings.interactive = false;

                    var result=helpers.result($this);
					var goal=settings.result;
                    var nbErrors = 0;
					var isComputed = false;

                    if (settings.scorefct) {
                        if (settings.scorefct=="noscore") { settings.score = 5; isComputed = true;}
                        else {
                            var arg = $.isArray(settings.scorearg)?settings.scorearg[settings.id%settings.canvas.length]:settings.scorearg;
							var rfct = eval('('+settings.scorefct+')')($this,result,arg);
							
							if (typeof(rfct)=="number") {
								nbErrors = rfct;
								isComputed = true;
							}
							else { goal = rfct; }
                        }
                    }
                    
					if (!isComputed) {
                        var r = $.isArray(goal)?goal[settings.id%settings.result.length]:goal;
						if (r.indexOf("function")!=-1) {
							var arg = $.isArray(settings.scorearg)?settings.scorearg[settings.id%settings.canvas.length]:settings.scorearg;
                            r = eval('('+r+')')($this,result,arg);
						}
                        for (var i=0; i<r.length; i++) {
                            if (r[i]!=result[i]) {
                                var $elt;
                                if (settings.svg) { $elt = $("#"+canvas+" #c"+i, settings.svg.root()); }
                                else              { $elt = $this.find("#ptboard #"+canvas+" #c"+i); }
                                $elt.attr("class", $elt.attr("class")+" wrong");
                                nbErrors++;
                            }
                        }
                    }
					
                    settings.score-=nbErrors*settings.errratio;
                    
                    $this.find("#ptlegend").hide();

                    // DISPLAY ALERT
                    $this.find("#ptboard").addClass(nbErrors?"wrong":"good");
                    $this.find("#g_submit").addClass(nbErrors?"wrong":"good");
                    if (settings.effects) {  $this.find("#g_effects").addClass(nbErrors?"wrong":"good"); }

                    if (settings.score<0) { settings.score = 0; }
                    if (++settings.id<settings.number) {
                        setTimeout(function() { settings.interactive=true; helpers.build($this); }, nbErrors?3000:1500);
                    }
                    else  { setTimeout(function() { helpers.end($this, {'status':'success','score':settings.score}); }, nbErrors?3000:1500); }
                }
            }
        };
        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in paint plugin!'); }
    };
})(jQuery);

