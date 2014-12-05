(function($) {
    // Alchemist default options
    var defaults = {
        name        : "alchemist",          // The activity name
        template    : "template.html",      // Alchemist's html template
        css         : "style.css",          // Alchemist's css style sheet
        lang        : "fr-FR",              // Current localization
        score       : 0,                    // The score (from 0 to 5)
        debug       : false                 // Debug modef
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
            settings.context.onquit($this,
                {'status':'success', 'score':settings.score, 'points':settings.points, 'pieces':settings.pieces});
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
                if (settings.context.onload) { settings.context.onload($this); }
                $this.css("font-size", Math.floor(($this.height()-7)/9)+"px");

                // Locale handling
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        // Display the discovered elements
        overview: function($this) {
            var settings = helpers.settings($this);
            $this.find("#overview div img").each(function(index) {
                if (index<=settings.level && !$(this).children().length) { $(this).show(); }
            });
        },
        // Choose a new preview pair randomly (regarding the current level) and display it
        preview: function($this) {
            var settings = helpers.settings($this);
            var val = [ Math.floor(Math.random()*settings.level), val2 = Math.floor(Math.random()*settings.level) ];
            $this.find("#preview div").each(function(index) {
                $(this).css("background-image", "url('res/img/svginventoryicons/background/noborder/transmut01.svg')")
                       .append($("<img src='res/img/svginventoryicons/"+settings.tiles[val[index]]+
                                 ".svg' alt='"+val[index]+"'/>"));
            });
        },
        addpoints: function($this, _val) {
            var settings = helpers.settings($this);
            settings.points+=_val;
            var str="";
            for (var i=0; i<7-settings.points.toString().length; i++) { str+="0"; }
            str+=settings.points;
            $this.find("#points").html(str);
        },
        // Detach the preview pair and use it as current tile. Call for a new preview pair
        next: function($this) {
            var settings = helpers.settings($this);
            settings.tile.posx = 2;
            settings.tile.orientation = 0;
            settings.tile.div1 = $("<div class='tile'></div>").appendTo($this.find("#board")).css("left", "2em").css("top", "1em").
                                 css("background-image", "url('res/img/svginventoryicons/background/noborder/transmut01.svg')");
            settings.tile.div2 = $("<div class='tile'></div>").appendTo($this.find("#board")).css("left", "3em").css("top", "1em").
                                 css("background-image", "url('res/img/svginventoryicons/background/noborder/transmut01.svg')");
            var alt1 = $this.find("#preview1 img").detach().appendTo(settings.tile.div1).attr("alt");
            var alt2 = $this.find("#preview2 img").detach().appendTo(settings.tile.div2).attr("alt");
            settings.tile.div1.data("alt", alt1);
            settings.tile.div2.data("alt", alt2);
            helpers.preview($this);
            helpers.overview($this);
            settings.interactive = true;

            helpers.addpoints($this, Math.pow(3,parseInt(alt1))+Math.pow(3,parseInt(alt2)));
            settings.pieces+=2;
        },
        // Handle the interactive inputs
        key:function($this, value) {
            var settings = helpers.settings($this);
            if (settings.interactive) {
                // Move the current tile in the upper area
                if (value==37 || value=="left") {
                    if (settings.tile.posx>0) { settings.tile.posx--; }
                }
                else if (value==38 || value=="up") {
                    settings.tile.orientation = (settings.tile.orientation+1)%4;
                    if ((settings.tile.posx==5) && (settings.tile.orientation%2==0)) { settings.tile.posx = 4; }
                }
                else if (value==39 || value=="right"){
                    if ( ((settings.tile.posx<4)&&(settings.tile.orientation%2==0)) ||
                         ((settings.tile.posx<5)&&(settings.tile.orientation%2==1)) ) {
                        settings.tile.posx++;
                    }
                }

                // Update the current tile position
                var top1 = settings.tile.orientation==1?0:1;
                var top2 = settings.tile.orientation==3?0:1;
                var left1= settings.tile.posx+(settings.tile.orientation==2?1:0);
                var left2= settings.tile.posx+(settings.tile.orientation==0?1:0);
                $(settings.tile.div1).css("top", ""+top1+"em");
                $(settings.tile.div1).css("left", ""+left1+"em");
                $(settings.tile.div2).css("top", ""+top2+"em");
                $(settings.tile.div2).css("left", ""+left2+"em");

                // If down is pressed, drop the current tile while inactivate the inputs
                if (value==40 || value=="down") {
                    settings.interactive = false;
                    settings.board[top1][left1] = settings.tile.div1;
                    settings.board[top2][left2] = settings.tile.div2;
                    helpers.drop($this);
                }
            }
            else if ($this.find("#splash").is(":visible")) { $this.alchemist('next'); }
        },
        // Drop the current tile to the top of the stack
        drop:function($this) {
            var settings = helpers.settings($this);
            for (var i=0; i<6; i++) for (var j=7; j>=0; j--) {
                var vElt = settings.board[j][i];
                if (vElt!=0) {
                    var k=j;
                    while ((k<8)&&(settings.board[k+1][i]==0)) { k++; }
                    if (k!=j) {
                        settings.board[k][i] = vElt;
                        settings.board[j][i] = 0;
                        vElt.animate({top: k+"em"}, 250, function() {});
                    }
                }
            }
            setTimeout(function() { helpers.power($this); },300);
        },
        // Return false if a pair is still in the upper area
        check: function($this) {
            var settings = helpers.settings($this);
            var vRet = true;
            for (var i=0; i<6; i++) for (var j=0; j<2; j++) { if (settings.board[j][i]!=0) { vRet = false; } }
            return vRet;
        },
        // Check the number of neighbours
        neighbourhood: function($this, n) {
            var settings = helpers.settings($this);
            var vModif = false;
            for (var i=0; i<6; i++) for (var j=0; j<9; j++) {
                if (n[j][i]) {
                    if ((i>0) && 
                        ($(settings.board[j][i]).data("alt")==$(settings.board[j][i-1]).data("alt"))) {
                            if (!n[j][i-1]) { n[j][i-1] = 1; vModif = true; }
                    }
                    if ((j>0) && 
                        ($(settings.board[j][i]).data("alt")==$(settings.board[j-1][i]).data("alt"))) {
                            if (!n[j-1][i]) { n[j-1][i] = 1; vModif = true; }
                    }
                    if ((i<5) && 
                        ($(settings.board[j][i]).data("alt")==$(settings.board[j][i+1]).data("alt"))) {
                            if (!n[j][i+1]) { n[j][i+1] = 1; vModif = true; }
                    }
                    if ((j<8) && 
                        ($(settings.board[j][i]).data("alt")==$(settings.board[j+1][i]).data("alt"))) {
                            if (!n[j+1][i]) { n[j+1][i] = 1; vModif = true; }
                    }
                }
            }
            return vModif?helpers.neighbourhood($this, n):n;
        },
        // Transmut elements if more than 3 are touching themself
        transmut: function($this, y, x) {
            var settings = $this.data("settings"), ret = false , Elt = settings.board[y][x], Value = eval($(Elt).data("alt"));
            if (Elt!=0) {
                var neighbour = [ [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ],
                                  [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ],
                                  [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ] ];
                neighbour[y][x] = 1;
                neighbour = helpers.neighbourhood($this, neighbour);
                var count = 0;
                for (var i=0; i<6; i++) for (var j=0; j<9; j++) { if (neighbour[j][i]) { count++; } }
                if (count>2) {
                    ret = true;
                    for (var i=0; i<6; i++) for (var j=0; j<9; j++) {
                        if (neighbour[j][i]) {
                            $(settings.board[j][i]).empty().remove();
                            settings.board[j][i] = 0;
                        }
                    }
                    if (Value>10) { Value = 10; }
                    if (Value==settings.level) { settings.level++; }

                    settings.board[y][x] =
                        $("<div class='tile'></div>").appendTo($this.find("#board")).css("left", ""+x+"em").css("top", ""+y+"em").
                            css("background-image", "url('res/img/svginventoryicons/background/noborder/transmut01.svg')").
                            data("alt", (20+Value+1)).
                            append($("<img alt='"+(20+Value+1)+
                                     "' src='res/img/svginventoryicons/"+settings.tiles[Value+1]+".svg'/>"));
                }
            }
            return ret;
        },
        // compute the score
        score:function(level) {
            var l = level-6;
            if (l>5) { l=5; }
            if (l<0) { l=0; }
            return l;
        },
        power: function($this) {
            var settings = $this.data("settings"), cont = false;
            for (var j=8; j>1; j--) for (i=0; i<6; i++) { cont = cont | helpers.transmut($this, j,i); }
            for (var j=8; j>1; j--) for (i=0; i<6; i++) {
                if (settings.board[j][i]) { settings.board[j][i].data("alt", settings.board[j][i].data("alt")%20); }
            }
            if (cont) { helpers.drop($this); }
            else {
                if (helpers.check($this)) { helpers.next($this); }
                else {
                    settings.score = helpers.score(settings.level);
                    helpers.end($this);
                }
            }
        }
    };

    // The plugin
    $.fn.alchemist = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    finish          : false,
                    interactive     : false,
                    tiles           : [ "potion/green13", "potion/yellow12", "potion/red04",
                                        "potion/purple02", "misc/salt01", "mineral/sulphur01",
                                        "mineral/copper01", "mineral/silver01", "mineral/gold01",
                                        "mineral/white05", "mineral/magic01", "potion/white01" ],
                    tile            : { posx:0, orientation:0, div1:0, div2:0 },
                    level           : 2,
                    points          : 0,
                    pieces          : 0,
                    board:          [ [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ],
                                      [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ],
                                      [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ] ]
                };


                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);
                    $(document).keydown(function(_e) { helpers.key($this, _e.which); });

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
            click: function(value) {
                helpers.key($(this), value);
            },
            next: function() {
                var settings = $(this).data("settings");
                // Hide instruction
                $(this).find("#splash").hide();

                helpers.preview($(this));
                helpers.next($(this));

            },
            quit: function() {
                var $this = $(this) , settings = $this.data("settings");
                settings.finish = true;
                settings.context.onquit($this,
                    {'status':'abort', 'score':settings.score, 'points':settings.points, 'pieces':settings.pieces});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in alchemist plugin!'); }
    };
})(jQuery);

