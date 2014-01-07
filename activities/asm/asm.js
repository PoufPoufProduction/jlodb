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

    var opcodes = [
      /* Name, Imm,  ZP,   ZPX,  ZPY,  ABS, ABSX, ABSY,  IND, INDX, INDY, SNGL, BRA */
      ["ADC", 0x69, 0x65, 0x75, null, 0x6d, 0x7d, 0x79, null, 0x61, 0x71, null, null],
      ["AND", 0x29, 0x25, 0x35, null, 0x2d, 0x3d, 0x39, null, 0x21, 0x31, null, null],
      ["ASL", null, 0x06, 0x16, null, 0x0e, 0x1e, null, null, null, null, 0x0a, null],
      ["BIT", null, 0x24, null, null, 0x2c, null, null, null, null, null, null, null],
      ["BPL", null, null, null, null, null, null, null, null, null, null, null, 0x10],
      ["BMI", null, null, null, null, null, null, null, null, null, null, null, 0x30],
      ["BVC", null, null, null, null, null, null, null, null, null, null, null, 0x50],
      ["BVS", null, null, null, null, null, null, null, null, null, null, null, 0x70],
      ["BCC", null, null, null, null, null, null, null, null, null, null, null, 0x90],
      ["BCS", null, null, null, null, null, null, null, null, null, null, null, 0xb0],
      ["BNE", null, null, null, null, null, null, null, null, null, null, null, 0xd0],
      ["BEQ", null, null, null, null, null, null, null, null, null, null, null, 0xf0],
      ["BRK", null, null, null, null, null, null, null, null, null, null, 0x00, null],
      ["CMP", 0xc9, 0xc5, 0xd5, null, 0xcd, 0xdd, 0xd9, null, 0xc1, 0xd1, null, null],
      ["CPX", 0xe0, 0xe4, null, null, 0xec, null, null, null, null, null, null, null],
      ["CPY", 0xc0, 0xc4, null, null, 0xcc, null, null, null, null, null, null, null],
      ["DEC", null, 0xc6, 0xd6, null, 0xce, 0xde, null, null, null, null, null, null],
      ["EOR", 0x49, 0x45, 0x55, null, 0x4d, 0x5d, 0x59, null, 0x41, 0x51, null, null],
      ["CLC", null, null, null, null, null, null, null, null, null, null, 0x18, null],
      ["SEC", null, null, null, null, null, null, null, null, null, null, 0x38, null],
      ["CLI", null, null, null, null, null, null, null, null, null, null, 0x58, null],
      ["SEI", null, null, null, null, null, null, null, null, null, null, 0x78, null],
      ["CLV", null, null, null, null, null, null, null, null, null, null, 0xb8, null],
      ["CLD", null, null, null, null, null, null, null, null, null, null, 0xd8, null],
      ["SED", null, null, null, null, null, null, null, null, null, null, 0xf8, null],
      ["INC", null, 0xe6, 0xf6, null, 0xee, 0xfe, null, null, null, null, null, null],
      ["JMP", null, null, null, null, 0x4c, null, null, 0x6c, null, null, null, null],
      ["JSR", null, null, null, null, 0x20, null, null, null, null, null, null, null],
      ["LDA", 0xa9, 0xa5, 0xb5, null, 0xad, 0xbd, 0xb9, null, 0xa1, 0xb1, null, null],
      ["LDX", 0xa2, 0xa6, null, 0xb6, 0xae, null, 0xbe, null, null, null, null, null],
      ["LDY", 0xa0, 0xa4, 0xb4, null, 0xac, 0xbc, null, null, null, null, null, null],
      ["LSR", null, 0x46, 0x56, null, 0x4e, 0x5e, null, null, null, null, 0x4a, null],
      ["NOP", null, null, null, null, null, null, null, null, null, null, 0xea, null],
      ["ORA", 0x09, 0x05, 0x15, null, 0x0d, 0x1d, 0x19, null, 0x01, 0x11, null, null],
      ["TAX", null, null, null, null, null, null, null, null, null, null, 0xaa, null],
      ["TXA", null, null, null, null, null, null, null, null, null, null, 0x8a, null],
      ["DEX", null, null, null, null, null, null, null, null, null, null, 0xca, null],
      ["INX", null, null, null, null, null, null, null, null, null, null, 0xe8, null],
      ["TAY", null, null, null, null, null, null, null, null, null, null, 0xa8, null],
      ["TYA", null, null, null, null, null, null, null, null, null, null, 0x98, null],
      ["DEY", null, null, null, null, null, null, null, null, null, null, 0x88, null],
      ["INY", null, null, null, null, null, null, null, null, null, null, 0xc8, null],
      ["ROR", null, 0x66, 0x76, null, 0x6e, 0x7e, null, null, null, null, 0x6a, null],
      ["ROL", null, 0x26, 0x36, null, 0x2e, 0x3e, null, null, null, null, 0x2a, null],
      ["RTI", null, null, null, null, null, null, null, null, null, null, 0x40, null],
      ["RTS", null, null, null, null, null, null, null, null, null, null, 0x60, null],
      ["SBC", 0xe9, 0xe5, 0xf5, null, 0xed, 0xfd, 0xf9, null, 0xe1, 0xf1, null, null],
      ["STA", null, 0x85, 0x95, null, 0x8d, 0x9d, 0x99, null, 0x81, 0x91, null, null],
      ["TXS", null, null, null, null, null, null, null, null, null, null, 0x9a, null],
      ["TSX", null, null, null, null, null, null, null, null, null, null, 0xba, null],
      ["PHA", null, null, null, null, null, null, null, null, null, null, 0x48, null],
      ["PLA", null, null, null, null, null, null, null, null, null, null, 0x68, null],
      ["PHP", null, null, null, null, null, null, null, null, null, null, 0x08, null],
      ["PLP", null, null, null, null, null, null, null, null, null, null, 0x28, null],
      ["STX", null, 0x86, null, 0x96, 0x8e, null, null, null, null, null, null, null],
      ["STY", null, 0x84, 0x94, null, 0x8c, null, null, null, null, null, null, null],
      ["---", null, null, null, null, null, null, null, null, null, null, null, null]
    ];

    var addr = [ null, 'imm', 'zp', 'zpx', 'zpy', 'abs', 'absx', 'absy', 'ind', 'indx', 'indy', 'sngl', 'bra' ];

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
                $this.css("font-size", Math.floor($this.height()/12)+"px");

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
                        $(this).draggable({ containment:$this, helper:"clone", appendTo:$this.find("#lines"), cursor:"move",
                            start:function() { settings.compiled = false;}});
                    }
                });

                // Prepare the program
                for (var i=0; i<settings.nblines; i++) {
                    $this.find("#code #lines").append("<div class='line"+(i%2?" i":"")+"'></div>");
                }
                $this.find("#code #lines .line").droppable({accept:".a",
                    drop:function(event, ui) {
                        var $elt = $(ui.draggable).clone();
                        var children=[false,false,false];
                        $(this).children().each(function() {
                            if ($(this).hasClass("label") && !$(this).hasClass("e"))  { children[0] = true; } else
                            if ($(this).hasClass("op"))     { children[1] = true; } else
                            if ($(this).hasClass("arg") || $(this).hasClass("e"))  { children[2] = true; }
                        });
                        var append = false;
                        if ($elt.hasClass("label")) {
                            append = !children[2];
                            if (append && children[1]) { $elt.addClass("e"); } else
                            if (append && children[0]) { $(this).find(".label").detach(); }
                        } else
                        if ($elt.hasClass("op")) {
                            append = !children[0];
                            if (append && children[1]) { $(this).find(".op").detach(); }
                        } else
                        if ($elt.hasClass("arg")) {
                            append = !children[0];
                            if (append && children[2]) { $(this).find(".arg").detach(); $(this).find(".e").detach(); }
                        }
                        if (append) {
                            $(this).append($elt);
                            $elt.draggable({ containment:$this, helper:"clone", appendTo:$this.find("#lines"), cursor:"move",
                                start:function() {
                                    settings.compiled = false;
                                    if ($elt.hasClass("label")) { $elt.removeClass("e"); } $elt.detach();} });
                        }
                } });

                helpers.stdout.splash($this);
                helpers.process.init();
                helpers.memory.init();
                helpers.process.display($this);
                $this.find("#exercice").html(settings.exercice);
                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        // ASM CONSTANTS AND UTILS
        c: {
            offset: { random:0x00fd, stdout:0x00fe, key:0x00ff, stack:0x0100, screen:0x0200, code:0x1000, end:0x2000 },
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
        // MEMORY
        memory: {
            data : 0,
            set:  function($this, addr, val)    { return this.data[addr] = val; },
            get:  function($this, addr)         { return this.data[addr]; },
            getw: function($this, addr)         { return this.get($this,addr) + (this.get($this,addr + 1) << 8); },
            setb: function($this, addr, value)  { this.set($this,addr, value & 0xff);
                                                  if ((addr >= helpers.c.offset.screen) && (addr < helpers.c.offset.code)) { }
                                                  if (addr== helpers.c.offset.stdout) { helpers.stdout.add($this, value); } },
            key:  function($this, e)            { this.setb($this,0, helpers.c.offset.key, value); },
            rand: function($this)               { this.set($this,helpers.c.offset.random, Math.floor(Math.random() * 256)); },
            init: function($this)               { if (!this.data) { this.data = new Array(helpers.c.offset.end);} },
            clear:function($this)               { for (var i = 0; i < helpers.c.offset.code; i++) { this.set($this,i, 0x00); } }
        },
        // COMPILER
        compiler: {
            labels:[],
            pc: 0,
            process: function($this) {
                var settings = helpers.settings($this);
                this.pc = helpers.c.offset.code;
                settings.compiled = true;
                $this.find(".line").each(function() {
                    // PARSE EACH LINE
                    var line = { isempty:true, islabel:false, op:"", arg:{value:"", type:11}};
                    $(this).find("div").each(function() {
                        if ($(this).hasClass("label")) {
                            if ($(this).hasClass("e")) { line.arg.value=$(this).html(); line.arg.type=12; }
                            else                       { line.islabel = true; }
                            line.isempty = false;
                        } else
                        if ($(this).hasClass("op")) { line.op=$(this).html(); line.isempty = false;} else
                        if ($(this).hasClass("arg")) {
                            line.arg.value = $(this).html(); line.isempty = false;
                            // GET THE TYPE OF THE ARG
                            if ($(this).hasClass("v")) { line.arg.type=1; } else
                            if ($(this).hasClass("x")) { line.arg.type= ($(this).html().length==2)?3:6; } else
                            if ($(this).hasClass("y")) { line.arg.type= ($(this).html().length==2)?4:7; } else
                            if ($(this).hasClass("i")) { line.arg.type=8; } else
                            if ($(this).hasClass("ix")){ line.arg.type=9; } else
                            if ($(this).hasClass("iy")){ line.arg.type=10; } else
                            line.arg.type=($(this).html().length==2)?2:5;
                        }
                    });
                    // COMPILE THE LINE
                    if (!line.isempty) {
                        if (line.islabel) {
                            // TODO
                        }
                        else {
                            var opid = -1;
                            for (var i in opcodes) { if (opcodes[i][0]==line.op) { opid=i; } }
                            if (opid!=-1 && opcodes[opid][line.arg.type]) {
                                helpers.compiler.pushb($this,opcodes[opid][line.arg.type]);
                                switch(line.arg.type) {
                                    case 0: case 1: case 2: case 3:
                                    case 9: case 10:
                                        helpers.compiler.pushb($this, line.arg.value);
                                        break;
                                    case 4: case 5: case 6: case 7: case 8:
                                        helpers.compiler.pushw($this, line.arg.value);
                                        break;
                                    case 12:
                                        helpers.compiler.pushb($this, 0);
                                        break;
                                }
                            }
                        }
                    }
                });
            },
            pushb: function ($this,_value) { helpers.memory.set($this, this.pc++, _value & 0xff); },
            pushw: function ($this,_value) { helpers.compiler.pushb($this,_value & 0xff);
                                             helpers.compiler.pushb($this,(_value >> 8) & 0xff); }
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
                    interactive     : false,
                    compiled        : false
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
                        helpers.loader.css($this);
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
                $this.find("#splash").hide();
            },
            code: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.compiler.process($this);
                var html="";
                for (var i=helpers.c.offset.code; i<helpers.compiler.pc; i++){
                    html+=(i%16)?" ":("<p>0x"+helpers.c.hex(i,true)+" ");
                    html+=helpers.c.hex(helpers.memory.data[i],false);
                    if (i%16==15) { html+="</p>"; }
                }
                $this.find("#binary div").html(html+"</p>");
                $this.find("#binary").show();
            }

        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in assembler plugin!'); }
    };
})(jQuery);

