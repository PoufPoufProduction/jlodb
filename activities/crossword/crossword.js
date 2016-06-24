(function($) {
    // Activity default options
    var defaults = {
        name        : "crossword",                              // The activity name
        label       : "Crossword",                              // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        font        : 1,                                        // The font-size multiplicator
        empty       : ' ',                                      // Empty cell value
        margin      : 0,                                        // Margin value
        horiz       : false,                                    // Only horizontal words
        hint        : true,                                     // Hint available
        move        : true,                                     // Move after key
        keypad      : "num",                                    // The keypad
        number      : 1,                                        // Number of exercices
        debug       : true                                      // Debug mode
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

                $this.css("font-size", Math.floor($this.height()/12)+"px");

                helpers.build($this);

                // DISPLAY KEYPAD
                $this.find("#menu #"+settings.keypad).show();

                // Locale handling
                $this.find("h1#label").html(settings.label);
                $this.find("#guide").html(settings.guide);
                $this.find("#guide2").html(settings.guide2);
                if (settings.title) { $this.find("#title").html(settings.title); } else { $this.addClass("notitle"); }
                if (settings.exercice) {
                    if ($.isArray(settings.exercice)) {
                        for (var i in settings.exercice) { $this.find("#exercice").append("<p>"+settings.exercice[i]+"</p>"); }
                    } else { $this.find("#exercice").html(settings.exercice); }
                } else { $this.addClass("noex"); }
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        build:function($this) {
            var settings = helpers.settings($this);
            $this.find("#effects>div").hide();
            $this.find("#effects").hide();

            if (settings.gen) {
                var gen = eval('('+settings.gen+')')();
                settings.data  = gen.data;
                settings.fixed = gen.fixed;
                settings.def   = gen.def;
            }

            // BUILD TABLE
            var rbut = 0.9;
            var horiz = settings.horiz?1.2:1;
            var size = Math.floor(Math.min((($this.find("#board").width()*0.98)/(settings.data[0].length+settings.margin)),
                                           (($this.find("#board").height()*rbut)/(settings.data.length*horiz+settings.margin))));
            var mtop= Math.floor(($this.find("#board").height()*rbut-(size*settings.data.length*horiz))/2);
            var mleft= Math.floor(($this.find("#board").width()-(size*settings.data[0].length))/2);
            html="<table style='font-size:"+size+"px;margin-top:"+mtop+"px;margin-left:"+mleft+"px;'>";
            for (var row in settings.data) {
                html+="<tr>";
                for (var col in settings.data[row]) {
                    var value=(settings.data[row][col]==settings.empty)?0:Math.floor(Math.random()*2)+1;
                    html+="<td><div class='bg bg"+value+(settings.horiz?" horiz":"")+"' id='"+col+"x"+row+"'>";
                    if (value!=0) {
                        html+="<div class='v'";
                        html+=" onclick='$(this).closest(\".crossword\").crossword(\"click\","+col+","+row+");'";
                        html+=" ontouchstart='$(this).closest(\".crossword\").crossword(\"click\","+col+","+row+");";
                        html+="event.preventDefault();'></div>";
                        html+="<table class='hint'>";
                        for (var i=0; i<9; i++) {
                            if (i%3==0) { html+="<tr>"; }
                            html+="<td><div id='c"+i+"'";
                            html+=" onclick='$(this).closest(\".crossword\").crossword(\"click\","+col+","+row+",this);'";
                            html+=" ontouchstart='$(this).closest(\".crossword\").crossword(\"click\","+col+","+row+",this);";
                            html+="event.preventDefault();'></div></td>";
                            if (i%3==2) { html+="</tr>"; }
                        }
                        html+="</table>";
                    }
                    else { html+=">"; }
                    html+="</div></td>";
                }
                html+="</tr>";
            }
            html+="</table>";
            $this.find("#board").html(html);

            // FIXED CELLS
            if (settings.fixed) for (var i in settings.fixed) {
                $elt = $this.find("#"+settings.fixed[i][0]+"x"+settings.fixed[i][1]);
                $elt.addClass("fixed").find(".v").html(settings.data[settings.fixed[i][1]][settings.fixed[i][0]]);
            }
        },
        key: function($this, _val) {
            var settings = helpers.settings($this);
            var vRegexp = 0;
            if (settings.keypad=="num") { vRegexp = new RegExp("[1-9]", "g"); } else
            if (settings.keypad=="abc") { _val = _val.toUpperCase(); vRegexp = new RegExp("[A-Z]", "g"); } else
            if (settings.keypad=="fr")  { _val = _val.toLowerCase(); vRegexp = new RegExp("[a-zéèêàç]", "g"); }
            var vOk = true;
            if (vRegexp) { vOk = (_val.match(vRegexp)); }


            if (settings.interactive && vOk) {
                if (settings.mode) {
                    if (settings.elt.pos[0]!=-1 && settings.elt.pos[1]!=-1) {
                        if (!$this.find("#"+settings.elt.pos[0]+"x"+settings.elt.pos[1]).hasClass("fixed")) {
                            $this.find("#"+settings.elt.pos[0]+"x"+settings.elt.pos[1]+" .v").html(_val[0]);

                            // MOVE TO THE NEXT CHARACTER
                            if (settings.move) {
                                if (settings.elt.horiz) { settings.elt.pos[0]++; } else { settings.elt.pos[1]++; }
                                $this.find(".l2").removeClass("l2").addClass("l1");
                                if ( settings.elt.pos[0]>=settings.data[0].length)  { settings.elt.pos[0] = -1; }
                                if ( settings.elt.pos[1]>=settings.data.length)     { settings.elt.pos[1] = -1; }
                                if ( settings.elt.pos[0]!=-1 && settings.elt.pos[1]!=-1) {
                                    var $elt = $this.find("#"+settings.elt.pos[0]+"x"+settings.elt.pos[1]);
                                    if (!$elt.hasClass("fixed")) { $elt.removeClass("l1").addClass("l2"); }
                                }
                            }
                        }
                    }
                }
                else {
                    if (settings.elt.hint) {
                        settings.elt.hint.html(_val[0]);

                        if (settings.move) {
                            if (settings.elt.horiz) { settings.elt.pos[0]++; } else { settings.elt.pos[1]++; }
                            if ( settings.elt.pos[0]>=settings.data[0].length)  { settings.elt.pos[0] = -1; }
                            if ( settings.elt.pos[1]>=settings.data.length)     { settings.elt.pos[1] = -1; }
                            $this.find(".hint div").removeClass("s");
                            $this.find(".l2").removeClass("l2").addClass("l1");
                            if ( settings.elt.pos[0]!=-1 && settings.elt.pos[1]!=-1) {
                                var $elt = $this.find("#"+settings.elt.pos[0]+"x"+settings.elt.pos[1]);
                                if (!$elt.hasClass("fixed")) {
                                    settings.elt.hint = $elt.find("#"+settings.elt.hint.attr("id"));
                                    settings.elt.hint.addClass("s");
                                    $elt.removeClass("l1").addClass("l2");
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    // The plugin
    $.fn.crossword = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    mode    : true,
                    interactive : false,
                    score   : 5,
                    elt     : {
                        horiz   : true,
                        pos     : [-1,-1],
                        hint    : 0
                    },
                    id      : 0
                };


                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);
                    $this.unbind("mouseup mousedown mousemove mouseout touchstart touchmove touchend touchleave");
                    $(document).keypress(function(_e) { helpers.key($this, String.fromCharCode(_e.which)); });

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
                settings.context.onquit($this,{'status':'abort'});
            },
            click: function(_col,_row, _hint) {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    _col = parseInt(_col); _row = parseInt(_row);

                    $this.find(".bg").removeClass("l1").removeClass("l2");
                    $this.find(".hint div").removeClass("s");

                    // TOGGLE ORIENTATION
                    if (settings.elt.pos[0]==_col && settings.elt.pos[1]==_row &&
                            (!_hint || !settings.elt.hint || $(_hint).attr("id")==settings.elt.hint.attr("id"))) {
                        settings.elt.horiz = (!settings.elt.horiz);
                    }
                    settings.elt.pos = [_col,_row];
                    if (settings.horiz) { settings.elt.horiz = true; }

                    // FIND THE BEST ORIENTATION
                    var begin, end;
                    for (var i=0; i<2; i++) {
                        if (settings.elt.horiz) {
                            var begin=_col; while(begin>=0 && settings.data[_row][begin]!=settings.empty) { begin--; } begin++;
                            var end=begin;  while(end<settings.data[0].length && settings.data[_row][end]!=settings.empty) { end++; } end--;
                        }
                        else {
                            var begin=_row; while(begin>=0 && settings.data[begin][_col]!=settings.empty) { begin--; } begin++;
                            var end=begin;  while(end<settings.data.length && settings.data[end][_col]!=settings.empty) { end++; } end--;
                        }
                        if (begin==end) { settings.elt.horiz = (!settings.elt.horiz); } else break;
                     }

                    // SHOW CURRENT COL OR ROW
                    for (var i=begin; i<=end; i++) {
                        $this.find("#"+(settings.elt.horiz?i+"x"+_row:_col+"x"+i))
                            .addClass((i==(settings.elt.horiz?_col:_row))?"l2":"l1");
                    }

                    // GET THE DEFINITION
                    var ref = settings.elt.horiz?begin+"x"+_row:_col+"x"+begin;
                    var def = "";
                    if (settings.def && settings.def[settings.elt.horiz?"horiz":"vert"] &&
                        settings.def[settings.elt.horiz?"horiz":"vert"][ref]) {
                        def = settings.def[settings.elt.horiz?"horiz":"vert"][ref];

                        if (settings.regexp) {
                            var vRegexp = new RegExp(settings.regexp.from, "g");
                            def = def.replace(vRegexp, settings.regexp.to);
                        }

                    }

                    var $def = $this.find("#definition");
                    $def.html("<div style='font-size:"+settings.font+"em;'>"+def+"</div>").toggleClass("center",(def.length<5));

                    if (_hint) {
                        if (settings.mode) {
                            $(_hint).closest(".bg").find(".v").html($(_hint).html()).show();
                        }
                        else {
                            $(_hint).addClass("s");
                            settings.elt.pos=[_col,_row]; settings.elt.hint = $(_hint);
                        }
                    }
                    else { settings.elt.hint = 0; }
                }
            },
            key: function(_elt) { 
                if (_elt) { $(_elt).addClass("touch");
                    setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
                }
                helpers.key($(this), $(_elt).text()); },
            next: function()    { helpers.settings($(this)).interactive = true; },
            valid: function() {
                var $this = $(this) , settings = helpers.settings($this);
                var error = 0;
                $this.find(".bg").removeClass("l1").removeClass("l2");
                $this.find(".bg .v").show();
                $this.find(".hint div").removeClass("s");
                for (var row=0; row<settings.data.length; row++) for (var col=0; col<settings.data[row].length; col++) {
                    if (settings.data[row][col]!=settings.empty &&
                        settings.data[row][col]!=this.find("#"+col+"x"+row+" .v").text()) {
                        error++;
                        this.find("#"+col+"x"+row).addClass("wrong");
                    }
                }
                settings.score-=error;
                if (settings.score<0) settings.score=0;

                if (error==0) { $this.find("#effects #good").show(); }
                else          { $this.find("#effects #wrong").show(); }
                $this.find("#effects").show();

                if (++settings.id<settings.number && settings.gen) {
                    setTimeout(function() { helpers.build($this); }, 1000);
                }
                else {
                    settings.interactive = false;
                    $this.find("#valid").hide();
                    setTimeout(function() { helpers.end($this); }, 1000);
                }
            },
            mode: function(_elt, _val) {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.hint && settings.mode!=_val) {
                    settings.mode = _val;
                    settings.elt.pos = [-1,-1];
                    $this.find("#buttons .bg").removeClass("s");
                    $this.find(".hint div").removeClass("s");
                    $(_elt).parent().addClass("s");
                    $("#board .bg").each( function() {
                        $cell = $(this);
                        if (settings.mode) {
                            var hintempty=true;
                            $cell.find(".hint div").each(function() {
                                var v = $(this).html();
                                if (v && v.length!=0 && v[0]!=' ' && v!="&#xA0;") { hintempty=false; }
                            });
                            if (hintempty) { $cell.find(".v").show(); }

                        }
                        else {
                            var $value = $cell.find(".v");
                            if ($value && (!$value.html() || $value.html().length==0 || $value.html()[0]==' ' || $value.html()=="&#xA0;")) {
                                 $value.hide();
                            }
                        }
                    });
                }
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in crossword plugin!'); }
    };
})(jQuery);

