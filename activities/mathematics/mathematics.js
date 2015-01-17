(function($) {
    // Activity default options
    var defaults = {
        name        : "mathematics",                            // The activity name
        label       : "Mathematics",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        debug       : false                                     // Debug mode
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
            $this.unbind("mouseup mousedown mousemove mouseout touchstart touchmove touchend touchleave");
        },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this,{'status':'success','score':settings.score});
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
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.build($this); });
            },
            build: function($this) {
                var settings = helpers.settings($this);

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }

                $this.css("font-size", Math.floor($this.height()/12)+"px");

                // Build panel droppable
                $this.find("#f001").droppable({accept:".a.op",
                    drop:function(event, ui) {
                        $this.find("#f001").html("");
                        var $elt = $(ui.draggable).clone().removeClass("move");
                        settings.root=helpers.data.node($this,true,$elt);
                        helpers.data.display($this);
                    }
                });

                // Locale handling
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
                helpers.build($this);
            }
        },
        data : {
            label: function(_elt) {
                var ret=_elt.value;
                if (_elt.type=="op") switch(_elt.value) {
                    case "plus" : ret = "+"; break;
                    case "mult" : ret = "*"; break;
                    case "div"  : ret = "/"; break;
                    case "minus": ret = "-"; break;
                    default: break;
                }
                return ret;
            },
            node: function($this,_root,$elt) {
                var settings = helpers.settings($this);
                var ret = { id:         "n"+settings.nodecounter,
                            $html:      $("<div class='d' id='n"+settings.nodecounter+"'></div>"),
                            children:   0,
                            width:      0,
                            pos:        0
                          };
                settings.nodecounter++;

                ret.$html.droppable({accept:_root?".a.op":".a", greedy:true,
                    drop:function(event,ui) {
                        var $elt = $(ui.draggable).clone().removeClass("move");
                        var node = helpers.data.get($(this).attr("id"), settings.root);
                        node.$html.html($elt);
                        if (node.children) {
                            helpers.data.remove(node.children[0]);
                            helpers.data.remove(node.children[1]);
                        }
                        if ($elt.hasClass("op")) {
                            node.children=[helpers.data.node($this,false,0),helpers.data.node($this,false,0)];
                        }
                        else { node.children=0; }
                        helpers.data.width(node);
                        helpers.data.display($this);
                    }
                });
                if ($elt) {
                    ret.$html.html($elt);
                    ret.children=[helpers.data.node($this,false,0),helpers.data.node($this,false,0)];
                }
                return ret;
            },
            get: function(_id,_node) {
                if (_node.id==_id) { return _node; }
                else if (_node.children) { return helpers.data.get(_id,_node.children[0]) || helpers.data.get(_id,_node.children[1]); }
                else { return 0; }
            },
            remove: function(_node) {
                _node.$html.detach();
                if (_node.children) { helpers.data.remove(_node.children[0]); helpers.data.remove(_node.children[1]);}
            },
            width: function(_node) {
                if (_node.children) { _node.len=helpers.data.width(_node.children[0]) + helpers.data.width(_node.children[1]); }
                else { _node.width=1; }
                return _node.width;
            },
            display: function($this,_node) {
                var settings = helpers.settings($this);
                var node = _node;
                if (!node) {  node=settings.root; }
                if (!node.pos) { $this.find("#f001").append(node.$html); node.pos=1; }
                if (node.children) {
                    helpers.data.display($this,node.children[0]);
                    helpers.data.display($this,node.children[1]);
                }
            }
        },
        build: function($this) {
            var settings = helpers.settings($this);
            var data = (settings.data?settings.data[settings.dataid]:settings);
            var exercice = (settings.data?settings.exercice[settings.dataid]:settings.exercice);

            if (data.figure) {
                if (data.figure.url)        { $this.find("#figure").html("<img src='"+data.figure.url+"'/>"); } else
                if (data.figure.content)    { $this.find("#figure").html(data.figure.content); }
            }

            if ($.isArray(exercice)) {
                var html=""; for (var i in exercice) { html+="<div>"+exercice[i]+"</div>"; }
                $this.find("#exercice>div").html(html);
            }
            else { $this.find("#exercice>div").html(exercice); }

            $this.find("#inventory .z").each(function(_index) {
                var html="";
                if (data.values && _index<data.values.length) {
                    html="<div class='a "+data.values[_index].type+"'>"+
                            "<div class='label'>"+helpers.data.label(data.values[_index])+"</div></div>";
                }
                $(this).html(html);
            });
            $this.find("#inventory .a").draggable({containment:$this, helper:"clone", appendTo:$this, /* revert:true, */
                start:function( event, ui) { $(this).addClass("move");},
                stop: function( event, ui) { $(this).removeClass("move"); } });
        }
    };

    // The plugin
    $.fn.mathematics = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    dataid          : 0,                // data index
                    nodecounter     : 0,                // node counter
                    root            : {}                // build tree
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
                        if ($settings.class) { $this.addClass($settings.class); }
                        helpers.settings($this.addClass(defaults.name), $settings);
                        helpers.loader.css($this);
                    }
                });
            },
            next: function() {
                $(this).find("#splash").hide();
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in mathematics plugin!'); }
    };
})(jQuery);

