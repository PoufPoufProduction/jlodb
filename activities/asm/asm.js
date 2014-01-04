(function($) {
    // Activity default options
    var defaults = {
        name        : "asm",                                    // The activity name
        label       : "Assembler",                              // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        score       : 1,                                        // The score (from 1 to 5)
        screen      : "default",                                // The screen id
        littleindian: true,                                     // Little indian
        labels      : [],                                       // Labels
        ops         : [],                                       // Available operation (empty=all)
        args        : [],                                       // Args
        nblines     : 5,                                        // Number of lines
        debug       : false                                     // Debug mode
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
            settings.context.onQuit({'status':'success','score':settings.score});
        },
        // ASM CONSTANTS AND UTILS
        c: {
            offset: { random:0x00fd, stdout:0x00fe, key:0x00ff, stack:0x0100, screen:0x0200, code:0x1000 },
            hex: function(_value, _16bits) { var r=_value.toString(16); while (r.length<(_16bits?4:2)) { r="0"+r; } return r; }
        },
        // HANDLE THE STDOUT
        stdout: {
            lines   : ["","","","","","",""], pos: 0,
            clear   : function($this) { this.lines = ["","","","","","",""]; this.pos = 0; this.display($this); },
            display : function($this) { $this.find("pre").html(this.export()); },
            add     : function($this, _char) {
                if (this.pos<7 && this.lines[this.pos].length>=19) { this.pos++; }
                if (_char=='\n') { this.pos++; }
                if (this.pos==7) { for (var i=0; i<6; i++) { this.lines[i]=this.lines[i+1]; } this.lines[6]=""; this.pos=6; }

                if (_char!='\n') { this.lines[this.pos]+=_char; }
                this.display($this);
            },
            splash  : function($this) {
                var settings = helpers.settings($this), c = helpers.c;
                this.lines[this.pos++]="0x"+c.hex(c.offset.random,true)+" random";
                this.lines[this.pos++]="0x"+c.hex(c.offset.stdout,true)+" stdout";
                this.lines[this.pos++]="0x"+c.hex(c.offset.key,true)+" keypressed";
                this.lines[this.pos++]="0x"+c.hex(c.offset.stack,true)+" stack";
                this.lines[this.pos++]="0x"+c.hex(c.offset.screen,true)+" screen"; //TODO Change for screen's name 32x32x8
                this.lines[this.pos++]="0x"+c.hex(c.offset.code,true)+" code";
                //this.lines[this.pos++]=(settings.littleindian?"[Little indian]":"[Big indian]");
                this.display($this);
            },
            export  : function() {
                return this.lines[0]+'\n'+this.lines[1]+'\n'+this.lines[2]+'\n'+this.lines[3]+'\n'+
                       this.lines[4]+'\n'+this.lines[5]+'\n'+this.lines[6];
            }
        },
        // PROCESS
        process: {
            A:0, X:0, Y:0, F:0, PC:0, SP:0,
            init    : function() { this.A = 0; this.X = 0; this.Y = 0; this.F = 0, this.PC = helpers.c.offset.code, this.SP=0xFF; },
            display : function($this) {
                $this.find("#rega .value").html(helpers.c.hex(this.A, false));
                $this.find("#regx .value").html(helpers.c.hex(this.X, false));
                $this.find("#regy .value").html(helpers.c.hex(this.Y, false));
                $this.find("#regs .value").html(helpers.c.hex(this.SP, false));
                $this.find("#regpc .value").html("0x"+helpers.c.hex(this.PC, true));
                for (var i=0; i<8; i++) {
                    $this.find("#f"+(7-i)+" .value").html(this.F&(1<<i)?"1":"0");
                }
            }
        },
        // Handle the elements sizes and show the activity
        resize: function($this) {
            var settings = helpers.settings($this);

            // Send the onLoad callback
            if (settings.context.onLoad) { settings.context.onLoad(false); }

            // Resize the template
            $this.css("font-size", Math.floor($this.height()/16)+"px");

            // Build source code
            for (var i in settings.labels) {
                $this.find("#source #labels").append("<div class='a label'>"+settings.labels[i]+"</div>");
            }
            if (settings.ops.length) {
                $this.find("#source #ops .a").addClass("d");
                for (var i in settings.ops) { $this.find("#source #ops #"+settings.ops[i]).removeClass("d"); }
            }
            for (var i in settings.args) {
                $this.find("#source #args").append("<div class='a arg "+settings.args[i].type+"'>"+settings.args[i].value+"</div>");
            }
            $this.find("#source .a").each( function() {
                if (!$(this).hasClass("d")) {
                    $(this).draggable({ containment:$this, revert:true, helper:"clone", appendTo:$this.find("#lines")});
                }
            });

            // Prepare the program
            for (var i=0; i<settings.nblines; i++) {
                $this.find("#code #lines").append("<div class='line"+(i%2?" i":"")+"'></div>");
            }

            helpers.stdout.splash($this);
            helpers.process.init();
            helpers.process.display($this);

            $this.find("#exercice").html(settings.exercice);

            // Handle spash panel
            if (settings.nosplash) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            else                   { $this.find("#intro").show(); }

        },
        // Load the different elements of the activity
        load: function($this) {
            var settings = helpers.settings($this);
            var debug = "";
            if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

            // Send the onLoad callback
            if (settings.context.onLoad) { settings.context.onLoad(true); }

            // Load the template
            var templatepath = "activities/"+settings.name+"/"+settings.template+debug;
            $this.load( templatepath, function(response, status, xhr) {
                if (status=="error") {
                    settings.context.onQuit({'status':'error', 'statusText':templatepath+": "+xhr.status+" "+xhr.statusText});
                }
                else {
                    var cssAlreadyLoaded = false;
                    $("head").find("link").each(function() {
                        if ($(this).attr("href").indexOf("activities/"+settings.name+"/"+settings.css) != -1) { cssAlreadyLoaded = true; }
                    });

                    if(cssAlreadyLoaded) {
                        helpers.resize($this);
                    }
                    else {
                        // Load the css
                        $("head").append("<link>");
                        var css = $("head").children(":last");
                        var csspath = "activities/"+settings.name+"/"+settings.css+debug;
                        css.attr({ rel:  "stylesheet", type: "text/css", href: csspath }).ready(function() {
                            helpers.resize($this);
                        });
                    }
                }
            });
        }
    };

    // The plugin
    $.fn.asm = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    finish          : false,
                    interactive     : false
                };

                return this.each(function() {
                    var $this = $(this);
                    $(document).unbind("keydown");

                    var $settings = $.extend({}, defaults, options, settings);
                    var checkContext = helpers.checkContext($settings);
                    if (checkContext.length) {
                        alert("CONTEXT ERROR:\n"+checkContext);
                    }
                    else {
                        $this.removeClass();
                        if ($settings.class) { $this.addClass($settings.class); }
                        helpers.settings($this.addClass(defaults.name), $settings);
                        helpers.load($this);
                    }
                });
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.finish = true;
                settings.context.onQuit({'status':'abort'});
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
                $this.find("#intro").hide();
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in assembler plugin!'); }
    };
})(jQuery);

