(function($) {
    // Activity default parameters
    var defaults = {
        name        : "sudoku",             // The activity name
        template    : "template.html",      // Activity html template
        css         : "style.css",          // Activity css style sheet
        intro       : "intro.html",         // Activity introduction page
        lang        : "fr-FR",              // Current localization
        level       : 1,                    // Grid level
        score       : 1,                    // The score (from 1 to 5)
        debug       : false                 // Debug mode
    };

    // private methods
    var helpers = {
        // @generic: Check the context
        checkContext: function(_settings){
            var ret         = "";
            if (!_settings.context)         { ret = "no context is provided in the activity call."; } else
            if (!_settings.context.onQuit)  { ret = "mandatory callback onQuit not available."; }

            if (ret.length) {
                ret+="\n\nUsage: $(\"target\")."+_settings.name+"({'onQuit':function(_ret){}})";
            }
            return ret;
        },
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            settings.context.onQuit({'status':'success', 'score':settings.score});
        },
        loader: {
            css: function($this) {
                var settings = helpers.settings($this), cssAlreadyLoaded = false, debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

                if (settings.context.onload) { settings.context.onload(true); }

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
                $this.load( templatepath, function(response, status, xhr) {
                    if (status=="error") {
                        settings.context.onquit({'status':'error', 'statusText':templatepath+": "+xhr.status+" "+xhr.statusText});
                    }
                    else { helpers.loader.build($this); }
                });
            },
            build: function($this) {
                var settings = helpers.settings($this);
                if (settings.context.onLoad) { settings.context.onLoad(false); }

                // Resize the template
                var fontSize= Math.floor(($this.height()-11)/27);
                $this.css("font-size", fontSize+"px");
                $this.find("#menu").css("font-size", Math.floor(($this.width()-$this.height())/6)+"px");
                $this.find("#keypad").css("font-size", Math.floor(2*fontSize)+"px");

                // Update the grid
                $this.find("div.border").each(function(index) {
                    var r = Math.floor(Math.random()*2)+1;
                    $(this).css("background-image", "url('res/img/svginventoryicons/background/border/square0"+r+".svg')");
                });

                $this.find("div.fill").each(function(index) {
                    var vY = Math.floor(index/9) + (Math.floor((index%9)/3)) - Math.floor((index%27)/9);
                    var vX = index%3 + 3*Math.floor((index%27)/9);
                    if (settings.data[vY][vX]>10) {
                        $(this).text(settings.data[vY][vX]%10).addClass("final");
                    }
                    else {
                        $(this).bind("click touchstart",function(event) {
                            var vEvent = (event && event.originalEvent &&
                                          event.originalEvent.touches && event.originalEvent.touches.length)?
                                event.originalEvent.touches[0]:event;
                            $(this).closest('.'+settings.name).sudoku('click', $(this), vEvent, { posX:vX, posY:vY });
                            event.preventDefault();
                        }).hover(
                            function() {if (!settings.elt) { settings.elthover = $(this);} },
                            function() {if (settings.elthover==$(this)) { settings.elthover=0; } });

                        $(this).next().find("div").each(function(_index) { $(this).bind("click touchstart",function(event) {
                            var vEvent = (event && event.originalEvent && event.originalEvent.touches &&
                                          event.originalEvent.touches.length)?
                                event.originalEvent.touches[0]:event;
                            $(this).closest('.'+settings.name).sudoku('click', $(this), vEvent);
                            event.preventDefault();
                            }).hover(
                                function() {if (!settings.elt) { settings.elthover = $(this); }},
                                function() {if (settings.elthover==$(this)) { settings.elt=0; } });
                        });
                    }
                });

                // Keypad
                for (var i=0; i<10; i++) {
                    $this.find("#keypad #key"+i).css("top",(1.5*Math.cos(2*Math.PI*(i/10))-0.5)+"em")
                                       .css("left",(1.5*Math.sin(2*Math.PI*(i/10))-0.5)+"em")
                                       .show();
                }

                // LOCALE HANDLING
                $this.find("h1#label").html(settings.label);
                if (settings.locale) {$.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); });}
                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        // Highlight the row, the col and the subgrid which contain the selected cell
        highlight:function($this, _posX, _posY) {
            $this.find("td.cell").each(function(index) {
                $(this).removeClass("level1").removeClass("level2").removeClass("level3");
                if (_posX>=0) {
                    var vY = Math.floor(index/9) + (Math.floor((index%9)/3)) - Math.floor((index%27)/9);
                    var vX = index%3 + 3*Math.floor((index%27)/9);
                    var vSquare = Math.floor(_posY/3)*3+Math.floor(_posX/3);
                    var vValue = 0;
                    if (vX==_posX) { vValue++; }
                    if (vY==_posY) { vValue++; }
                    if (Math.floor(index/9)==vSquare) { vValue++; }
                    if (vValue) { $(this).addClass("level"+vValue); }
                }
            });
        },
        // Check if the grid is done
        check:function($this) {
            var settings = helpers.settings($this);
            var finish = true;
            $this.find("div.fill").each(function(index) {
                var vY = Math.floor(index/9) + (Math.floor((index%9)/3)) - Math.floor((index%27)/9);
                var vX = index%3 + 3*Math.floor((index%27)/9);
                if (settings.data[vY][vX]%10 != $(this).text()) { finish= false; }
            });
            return finish;
        },
        // Update the timer
        timer:function($this) {
            var settings = helpers.settings($this);
            settings.timer.value++;
            var vS = settings.timer.value%60;
            var vM = Math.floor(settings.timer.value/60)%60;
            var vH = Math.floor(settings.timer.value/3600);
            if (vH>99) { vS=99; vM=99; vH=99; }
            $this.find("#time").text((vH<10?"0":"")+vH+(vM<10?":0":":")+vM+(vS<10?":0":":")+vS);
            settings.timer.id = setTimeout(function() { helpers.timer($this); }, 1000);
        },
        // compute the score regarding the time and the grid level
        score:function(level, time) {
            var timeref = 600*level;
            var score = 1;
            if (time<timeref)       { score = 5; } else
            if (time<timeref*1.2)   { score = 4; } else
            if (time<timeref*1.5)   { score = 3; } else
            if (time<timeref*2)     { score = 2; }
            return score;
        },
        // Handle the key pressed (or the value selected from the wheel)
        key:function($this, value) {
            var settings = helpers.settings($this);
            if (!settings.elt && settings.elthover) { settings.elt = settings.elthover; }
            if (settings.keypad)    { clearTimeout(settings.keypad); settings.keypad=0; }
            if (!settings.timer.id) { helpers.timer($this); }
            $this.find("div#keypad").hide();

            if (value==0)   {
                settings.elt.text("");
            }
            else
            if (value>0)    {
                settings.elt.text(value);
                if (settings.elt.hasClass("fill")) {
                    settings.finish = helpers.check($this);
                    if (settings.finish) {
                        clearTimeout(settings.timer.id);
                        settings.score = helpers.score(settings.level, settings.timer.value);
                        setTimeout(function() { helpers.end($this); }, 1000);
                    }
                }
                else
                {
                    settings.elt.closest('.cell').addClass("h");
                }
            }
            settings.elt = 0;
        }
    };

    // The plugin
    $.fn.sudoku = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The SUDOKU initial settings
                var settings = {
                    elt         : 0,
                    elthover    : 0,
                    fillmode    : true,     // false in the hint mode
                    complete    : false,    // the game is finished
                    timer: {                // the general timer
                        id      : 0,        // the timer id
                        value   : 0         // the timer value
                    },
                    keypad      : 0
                };

                // Check the context and send the load
                return this.each(function() {
                    var $this = $(this);
                    $(document).unbind("keypress");
                    $(document).keypress(function(_e) { helpers.key($this, String.fromCharCode(_e.which)); });

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
            // Handle the click event
            click:function(elt, event, data) {
                var $this = $(this) , settings = helpers.settings($this), $keypad = $this.find("#keypad");
                if (data) { helpers.highlight($this, data.posX, data.posY); }

                if (settings.keypad) { clearTimeout(settings.keypad); settings.keypad=0; }
                if (!settings.finish) {

                    var mode = $this.find("#grid").hasClass("f");
                    if (mode && !elt.hasClass("fill")) {
                        elt.closest('.hint').hide().prev().text(elt.text()).show();
                        elt.closest('.cell').removeClass("h");
                        settings.finish = helpers.check($this);
                        if (settings.finish) {
                            clearTimeout(settings.timer.id);
                            setTimeout(function() { helpers.end($this); }, 1000);
                        }
                    }
                    else {
                        settings.keypad = setTimeout(function() { $this.sudoku('key', -1); }, 2000);

                        var vTop    = event.clientY - $this.offset().top;
                        var vLeft   = event.clientX - $this.offset().left;
                        var tmp     = $this.find("#bg1").height()/1.5;
                        if (vTop<tmp)                   { vTop = tmp; }
                        if (vLeft<tmp)                  { vLeft = tmp; }
                        if (vTop+tmp>$this.height())    { vTop=$this.height()-tmp; }
                        if (vLeft+tmp>$this.width())    { vLeft=$this.width()-tmp; }
                        $keypad.css("top", vTop+"px").css("left", vLeft+"px").show();

                        settings.elt = elt;
                    }
                }
            },
            // Forward the click event from the popup keypad
            key:function(value) {
                helpers.key($(this), value);
            },
            // Pause the game, hide the grid and display the help
            pause: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.timer.id) {
                    clearTimeout(settings.timer.id); settings.timer.id=0;
                    $this.find("#grid9x9").hide();
                }
                else {
                    helpers.timer($this);
                    $this.find("#grid9x9").show();
                }
            },
            // Toggle the game mode
            toggle: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (!settings.finish) {
                    var mode = $this.find("#grid").hasClass("f");
                    if (!mode) {
                        $this.find("#grid").addClass("f");
                        $this.find("#toggle>img").attr("src", "res/img/svginventoryicons/pencil/pen01.svg");
                        $this.find("div.fill").each(function(index) {
                            var vHintEmpty = true;
                            $(this).next().find("div").each(function(_index) {
                                if ($(this).text()) { vHintEmpty = false; } });
                            if (vHintEmpty) { $(this).show().next().hide(); } });
                    }
                    else {
                        $this.find("#grid").removeClass("f");
                        $this.find("#toggle>img").attr("src", "res/img/svginventoryicons/pencil/pencil01.svg");
                        helpers.highlight($this, -1,-1);
                        $this.find("div.fill").each(function(index) { if (!$(this).text()) { $(this).hide().next().show(); } });
                    }
                }
            },
            // Close the help and display the grid
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $(this).find("#splash").hide();
                $(this).find("#grid9x9").show();
                if (settings.timer.value) {helpers.timer($this);}
            },
            // Abort the game from the confirmation panel
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.finish = true;
                if (settings.timer.id) { clearTimeout(settings.timer.id); settings.timer.id=0; }
                settings.context.onQuit({'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in sudoku plugin!'); }
    };
})(jQuery);


