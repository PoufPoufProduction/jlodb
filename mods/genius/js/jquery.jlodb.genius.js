(function($) {
    // Activity default options
    var defaults = {
        name        : "genius",                 // The activity name
        template    : "template.html",          // Activity html template
        css         : "style.css",              // Activity css style sheet
        lang        : "fr-FR",                  // Current localization
        menu        : "menu",                   // Menu id
        debug       : true                      // Debug mode
    };

    var s = {
        opened      : 1,
        finished    : 2
    };

    // private methods
    var helpers = {
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },
        base64: {
            code: function(_val) {
                var r = 47;
                if (_val<26) { r = 65 +_val; }      else if (_val<52) { r = 97+(_val-26); } else
                if (_val<62) { r = 48 + (_val-52); } else if (_val<63) { r = 43; }
                return String.fromCharCode(r);
            },
            decode: function(_val) {
                var r = 63;
                _val = _val.charCodeAt(0);
                if (_val>=65 && _val<=90)   { r = _val - 65; } else
                if (_val>=97 && _val<=122)  { r = _val - 97 + 26; } else
                if (_val>=48 && _val<=57)   { r = _val - 48 + 52; } else
                if (_val==43) { r = 62; }
                return parseInt(r);
            },
            node: function($this, _id, _val) {
                var settings = helpers.settings($this), ret = 3;
                if (settings.nodes) {
                    var byte     = Math.floor(_id/3);
                    var offset   = (1<<(5-(parseInt(_id)%3)*2)) | (1<<(4-(parseInt(_id)%3)*2));

                    if (byte<settings.nodes.length) {
                        if (_val) {
                            var val = helpers.base64.code(helpers.base64.decode(settings.nodes[byte])|(_val<<(4-(parseInt(_id)%3)*2)));
                            settings.nodes= settings.nodes.substr(0,byte)+val+settings.nodes.substr(byte+1);
                        }
                        else { ret = (helpers.base64.decode(settings.nodes[byte]) & offset)>>(4-(parseInt(_id)%3)*2); }
                    } else { ret = 0; }
                }

                return ret;
            }
        },
        loader: {
            css: function($this) {
                var settings = helpers.settings($this), cssAlreadyLoaded = false, debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }
                var path = "mods/genius/"+settings.css;
                $("head").find("link").each(function() {
                    if ($(this).attr("href").indexOf(path) != -1) { cssAlreadyLoaded = true; }
                });
                if(cssAlreadyLoaded) { helpers.loader.template($this); }
                else {
                    $("head").append("<link>");
                    var css = $("head").children(":last");
                    var csspath = path+debug;

                    css.attr({ rel:  "stylesheet", type: "text/css", href: csspath }).ready(
                        function() { helpers.loader.template($this); });
                }
            },
            template: function($this) {
                var settings = helpers.settings($this), debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }
                // Load the template
                var templatepath = "mods/genius/"+settings.template+debug;
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.svg($this); });
            },
            // Load the svg if require
            svg:function($this) {
                var settings = helpers.settings($this),debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }
                var elt= $("<div id='svg'></div>").appendTo($this.find("#map"));
                elt.svg();
                settings.svg = elt.svg('get');
                $(settings.svg).attr("class",settings.class);
                settings.svg.load('mods/genius/data/locale/'+settings.lang+'/map.svg' + debug,
                    { addTo: true, changeSize: true, onLoad:function() { helpers.loader.build($this); }
                });
            },
            build: function($this) {
                var settings = helpers.settings($this);
                // ZOOM DRAG
                $this.find("#zoom .slider").draggable({ axis:"x", containment:"parent",
                drag:function() {
                    var x= ($(this).offset().left-$(this).parent().offset().left)/($(this).parent().width()-$(this).width());
                    settings.nav.zoom = 1+Math.max(0,Math.min(x,1))*(settings.nav.max-1);
                    helpers.nav($(this).closest(".genius"));
                }});
                $this.find("#move .slider").draggable({ containment:"parent",
                drag:function() {
                    var x = ($(this).offset().left-$(this).parent().offset().left)/($(this).parent().width()-$(this).width());
                    var y = ($(this).offset().top-$(this).parent().offset().top)/($(this).parent().height()-$(this).height());
                    settings.nav.x=2*x-1;
                    settings.nav.y=2*y-1;
                    helpers.nav($(this).closest(".genius"));
                }});

                $(".node",settings.svg.root()).each(function() {
                $(this).unbind("mousedown touchstart").bind("mousedown touchstart",function(event) {
                    var $this=$(this).closest(".genius"), settings = helpers.settings($this);
                    settings.id     = $(this).attr("id");
                    settings.overtimer = settings.onhover?
                        setTimeout(function() { settings.overtimer = -1;
                                                settings.onendhover($this); settings.onhover($this, settings.id); }, 500):0;
                    event.stopPropagation();
                    event.preventDefault()
                });
                $(this).unbind("mouseup touchend").bind("mouseup touchend",function(event) {
                    // CLICK HANDLER: CALL LISTENER OR OPEN MENU ACCORDING TO THE NODE ID
                    var $this=$(this).closest(".genius"), settings = helpers.settings($this);
                    var available   = ($(this).attr("class").indexOf("available")!=-1);
                    settings.id     = $(this).attr("id");

                    if (settings.onendhover) { settings.onendhover($this); }

                    if (settings.overtimer>0) { clearTimeout(settings.overtimer); settings.overtimer = 0; }
                    else if (settings.overtimer==-1 && settings.onendhover) {
                        settings.overtimer = 0; event.stopPropagation(); event.preventDefault(); return;
                    }

                    if (settings.onnode) { available &= settings.onnode($this, settings.id, available); }

                    if (available) {
                        $.getJSON("mods/genius/api/node.php?id="+settings.id, function(data) {
                            if(data.status=="success") {
                                $this.find("#node #header h1").html(data.name);

                                var abstracts = data.abstract.split('|');
                                var html="";
                                for (var i in abstracts) { html+="<p>"+abstracts[i]+"</p>"; }
                                $this.find("#node #nav #abstract").html(html);

                                if (data.subject) {
                                    var subject = data.subject.split('|');
                                    html="";
                                    for (var i in subject) { html+="<li>"+subject[i]+"</li>"; }
                                    $this.find("#node #nav #subject ul").html(html);
                                }
                                else { $this.find("#node #nav #subject ul").html(""); }

                                var ex = [];
                                if (data.exercices.length) { ex = data.exercices.split(","); }

                                if (settings.state) { settings.state($this, settings.id, ex, helpers.menu ); }
                                else                { helpers.menu($this, ex, ""); }
                            }
                        });

                        $this.find("#node #header h1").removeClass().addClass($(this).attr("class"));
                    }
                    event.stopPropagation();
                    event.preventDefault(); });
                });

                if (settings.onbuild) { settings.onbuild($this); }
            }
        },
        nav  : function($this) {
            var settings = helpers.settings($this);
            $this.find("#svg").css("font-size",settings.nav.zoom+'em')
                              .css("top",((1+settings.nav.y)*($this.find("#map").height()-$this.find("#svg").height())/2)+'px')
                              .css("left",((1+settings.nav.x)*($this.find("#map").width()-$this.find("#svg").width())/2)+'px');
            $this.find("#move .slider").css("font-size",(1/settings.nav.zoom)+'em')
                              .css("top",((1+settings.nav.y)*($this.find("#move").height()-$this.find("#move .slider").height())/2)+'px')
                              .css("left",((1+settings.nav.x)*($this.find("#move").width()-$this.find("#move .slider").width())/2)+'px');
        },
        menu : function($this, _ex, _state) {
            var settings = helpers.settings($this);
            $this.find("#node").show();
            $this.find("#"+settings.menu).menu({
                list    : _ex,
                state   : _state,
                onupdate: function($menu, _state) { if (settings.onupdate) { settings.onupdate($this, $menu, settings.id, _state); } },
                onclick : function($menu, _args)  { if (settings.onclick)  { settings.onclick($this, $menu, _args); } }
            });
            if (settings.onshow) { settings.onshow($this); }
        },
        states: function($this) {
            var settings = helpers.settings($this);
            var aclass = " available";
            // PARSE THE NODES
            $(".node",settings.svg.root()).each(function() {
                var current = $(this).attr("class");
                if (current.indexOf(aclass)==0) { current = current.substr(-aclass.length); }
                var available = (helpers.base64.node($this, parseInt($(this).attr("id")))!=0);
                $(this).attr("class",current+(available?aclass:""));
            });

            // PARSE THE LINKS
            // A LINKS IS OPENED IF THE SOURCE IS FINISHED
            $(".link",settings.svg.root()).each(function() {
                var current = $(this).attr("class");
                if (current.indexOf(aclass)==0) { current = current.substr(-aclass.length); }
                if (current.indexOf(" ")!=-1) {
                    var available = (( helpers.base64.node($this, parseInt(current.split(" ")[1].substr(1))) & s.finished)!=0)

                    $(this).attr("class",current+(available?aclass:""));
                }
            });
        }
    };

    // The plugin
    $.fn.genius = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    nav: { zoom : 1, max : 3, x : 0, y : 0 },
                    nodes: "",
                    id: 0,
                    overtimer: 0
                };

                return this.each(function() {
                    var $this = $(this);

                    var $settings = $.extend({}, defaults, options, settings);
                    $this.removeClass();
                    helpers.settings($this.addClass(defaults.name), $settings);
                    helpers.loader.css($this);
                });
            },
            states: function(_args) {
                var $this = $(this), settings = helpers.settings($this);
                if (_args && _args.nodes) {
                    if (settings.nodes.length) {
                        var nodes = "";
                        for (var i=0; i<Math.max(settings.nodes.length,_args.nodes.length); i++) {
                            nodes+= helpers.base64.code(
                                        (i<settings.nodes.length?helpers.base64.decode(settings.nodes[i]):0) |
                                        (i<_args.nodes.length?helpers.base64.decode(_args.nodes[i]):0) );
                        }
                        settings.nodes = nodes;
                    }
                    else { settings.nodes = _args.nodes; }
                }
                helpers.states($this);
            },
            header: function() {
                var $this = $(this), settings = helpers.settings($this);
                if (settings.onheader) { settings.onheader($this, settings.id); }
            },
            closenode: function() {
                var $this = $(this), settings = helpers.settings($this);
                if (settings.onclosenode) { settings.onclosenode($this); }
            },
            finish: function() {
                var $this = $(this), settings = helpers.settings($this);
                $(this).find("#finish").show();

                helpers.base64.node($this, settings.id, s.finished);

                $(".link.s"+settings.id,settings.svg.root()).each(function() {
                    var good = true;
                    var dest = parseInt($(this).attr("class").split(" ")[2].substr(1));

                    $(".link.d"+dest,settings.svg.root()).each(function() {
                        var source = parseInt($(this).attr("class").split(" ")[1].substr(1));
                        if ((helpers.base64.node($this, source)&s.finished)==0) { good=false; }
                    });
                    if (good) { helpers.base64.node($this, dest, s.opened); }
                });
                helpers.states($this);
                if (settings.onstate) { settings.onstate($this, settings.nodes); }

            },
            svg : function(_val) {
                var $this = $(this), settings = helpers.settings($this);
                return $(_val, settings.svg.root());
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in jlodb genius plugin!'); }
    };
})(jQuery);

