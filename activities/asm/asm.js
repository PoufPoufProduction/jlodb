(function($) {
    // Activity default options
    var defaults = {
        name        : "asm",                                    // The activity name
        label       : "Assembler",                              // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        model       : 0,                                        // The screen model id
        labels      : [],                                       // Labels
        ops         : [],                                       // Available operation (empty=all)
        args        : [],                                       // Args
        nblines     : 5,                                        // Number of lines
        header      : 0,
        footer      : 0,
        font        : 0,                                        // Font-size of the source
        export      : false,                                    // Show code
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
            if (!_settings.context.onquit)  { ret = "mandatory callback onquit not available."; }

            if (ret.length) {
                ret+="\n\nUsage: $(\"target\")."+_settings.name+"({'onquit':function(_ret){}})";
            }
            return ret;
        },
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
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
                if (settings.context.onload) { settings.context.onload($this); }

                // Resize the template
                $this.css("font-size", Math.floor($this.height()/12)+"px");

                // Build source code
                if (settings.ops.length) {
                    $this.find("#source #ops .a").addClass("d");
                    for (var i in settings.ops) { $this.find("#source #ops #"+settings.ops[i]).removeClass("d"); }
                }
                for (var i in settings.args) {
                    $this.find("#source #args").append("<div class='a arg "+settings.args[i].type+"'>"+settings.args[i].value+"</div>");
                }
                $this.find("#source .a").each( function() {
                    if (!$(this).hasClass("d")) {
                        $(this).draggable({ containment:$this, helper:"clone", appendTo:$this.find("#lines"),
                            start:function() { settings.data.compiled = false;}});
                    }
                });
                if (settings.font) { $this.find("#detail #source>div").css("font-size",settings.font+"em"); }

                // Build the header
                var headlen = 0;
                if (settings.header) {
                    for (var i in settings.header) {
                        var html = "<div class='line"+(i%2?" i":"")+"'><div class='code'>";
                        html +="<div class='codelabel'>"+settings.header[i].label+"</div>";
                        html +="<div class='codevalue'>";
                        if ($.isArray(settings.header[i].value)) {
                            for (var j in settings.header[i].value) { html+="<p>"+settings.header[i].value[j]+"</p>"; }
                        }
                        else { html+=settings.header[i].value; }
                        html +="</div>";
                        html += "<div class='coderts'>"+(settings.header[i].rts?"rts":"")+"</div></div></div>";
                        $this.find("#code #lines").append(html);
                        headlen++;
                    }
                }

                // Prepare the program
                for (var i=0; i<settings.nblines; i++) {
                    $this.find("#code #lines").append("<div class='line x"+((i+headlen)%2?" i":"")+"'></div>");
                }
                $this.find("#code #lines .line.x").droppable({accept:".a",
                    drop:function(event, ui) {
                      if (($(this).offset().top+$(this).height()) < ($this.find("#code").offset().top+$this.find("#code").height()))
                      {
                        var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                    event.originalEvent.touches[0]:event;
                        var $elt = $(ui.draggable).clone().css("opacity", 1);
                        var children=[false,false,false];
                        $(this).children().each(function() {
                            if ($(this).hasClass("label") && !$(this).hasClass("arg"))  { children[0] = true; } else
                            if ($(this).hasClass("op"))     { children[1] = true; } else
                            if ($(this).hasClass("arg"))    { children[2] = true; }
                        });
                        if ($elt.hasClass("label")) {
                            if ( !children[1] && !children[2] && !$elt.hasClass("x")) {
                                $(this).find(".label").detach(); $elt.removeClass("arg");
                            }
                            else { $(this).find(".arg").detach(); $elt.addClass("arg"); }
                        } else
                        if ($elt.hasClass("op")) { $(this).find(".op").detach(); $(this).find(".label").addClass("arg"); } else
                        if ($elt.hasClass("arg")) { $(this).find(".arg").detach(); $(this).find(".label").detach(); }

                        var x           = event.clientX-$this.offset().left;
                        var y           = event.clientY-$this.offset().top;
                        var $old        = $this.find("#touch01>div").detach();
                        var $new        = $old.clone();
                        $this.find("#touch01").css("left",Math.floor(x - $this.find("#touch01").width()/2)+"px")
                                              .css("top",Math.floor(y - $this.find("#touch01").height()/2)+"px")
                                              .append($new.addClass("running")).show();
                        setTimeout(function(){$this.find("#touch01>div").removeClass("running").parent().hide(); },800);

                        $(this).append($elt);
                        $elt.draggable({ containment:$this, helper:"clone", appendTo:$this.find("#lines"),
                            start:function() {
                                settings.data.compiled = false;
                                $elt.css("opacity",0.2);},
                            stop: function( event, ui ) { $(this).detach(); } });
                      }
                } });

                // Build the footer
                if (settings.footer) {
                    for (var i in settings.footer) {
                        var html = "<div class='line"+(i%2?" i":"")+"'><div class='code'>";
                        html +="<div class='codelabel'>"+settings.footer[i].label+"</div>";
                        html +="<div class='codevalue'>";
                        if ($.isArray(settings.footer[i].value)) {
                            for (var j in settings.footer[i].value) { html+="<p>"+settings.footer[i].value[j]+"</p>"; }
                        }
                        else { html+=settings.footer[i].value; }
                        html +="</div>";
                        html += "<div class='coderts'>"+(settings.footer[i].rts?"rts":"")+"</div></div></div>";
                        $this.find("#code #lines").append(html);
                    }
                }

                if ($this.find("#code #lines").height()<$this.find("#code").height()) {
                    var html="<div class='filler' style='height:"+($this.find("#code").height()-$this.find("#code #lines").height()-2)+
                             "px;margin-top:2px;'></div>";
                    $this.find("#code #lines").append(html);
                }

                settings.data.$this = $this;
                settings.data.random = settings.random;

                helpers.loader.speed($this);

                helpers.process.init(settings.data);
                helpers.memory.init(settings.data);
                helpers.memory.clear(settings.data);
                helpers.screen.init($this);
                helpers.process.display(settings.data);
                helpers.stdout.splash($this);
                if ($.isArray(settings.exercice)) {
                    $this.find("#exercice").html("");
                    for (var i in settings.exercice) {
                        $this.find("#exercice").append("<p>"+(settings.exercice[i].length?settings.exercice[i]:"&nbsp;")+"</p>"); }
                } else { $this.find("#exercice").html(settings.exercice); }

                // Locale handling
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }


                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            },
            speed: function($this) {
                var settings = helpers.settings($this);
                var src=["debug","x1","x2","x3"];
                $this.find("#controls #speed img").attr("src","res/img/control/"+src[settings.data.speed]+".svg");
            }
        },
        // ASM CONSTANTS AND UTILS
        c: {
            offset: { random:0x00fd, stdout:0x00fe, key:0x00ff, stack:0x0100, screen:0x0200, code:0x1000, end:0x2000 },
            hex: function(_value, _16bits) { var r=_value.toString(16); while (r.length<(_16bits?4:2)) { r="0"+r; } return r; },
            token: function(_code) {
                var codheader = [];
                if (_code.indexOf(" ")>=0) { codheader = _code.split(" "); }
                else { for (var i=0; i<Math.floor(_code.length/2); i++) { codheader.push(_code[i*2]+_code[i*2+1]); } }
                return codheader;
            }
        },
        // HANDLE THE STDOUT
        stdout: {
            clear   : function($this) { var settings = helpers.settings($this);
                                        settings.stdout.lines = ["","","","","","",""]; settings.stdout.pos = 0; this.display($this); },
            display : function($this) { $this.find("pre").html(this.export($this)); },
            add     : function($this, _char, _donotdisplay) {
                var settings = helpers.settings($this);
                if (settings.stdout.pos<7 && settings.stdout.lines[settings.stdout.pos].length>=19) { settings.stdout.pos++; }
                if (_char=='\n')                { settings.stdout.pos++; }
                if (settings.stdout.pos==7)     { for (var i=0; i<6; i++) { settings.stdout.lines[i]=settings.stdout.lines[i+1]; }
                                                  settings.stdout.lines[6]=""; settings.stdout.pos=6; }
                if (_char!='\n')                { settings.stdout.lines[settings.stdout.pos]+=_char; }
                if (!_donotdisplay)             { this.display($this); }
            },
            ascii   : function($this, _ascii, _donotdisplay) {
                this.add($this, (_ascii==10||(_ascii>=32&&_ascii<127))?String.fromCharCode(_ascii):".", _donotdisplay); },
            line    : function($this, _line, _noteof) {
                for (var i in _line) { this.add($this,_line[i],true); }
                if (_noteof) { this.display($this);} else { this.add($this, '\n'); }
            },
            splash  : function($this) {
                var settings = helpers.settings($this), c = helpers.c;
                this.clear($this);
                settings.stdout.lines[settings.stdout.pos++]="0x"+c.hex(c.offset.random,true)+" random";
                settings.stdout.lines[settings.stdout.pos++]="0x"+c.hex(c.offset.stdout,true)+" stdout";
                settings.stdout.lines[settings.stdout.pos++]="0x"+c.hex(c.offset.key,true)+" keypressed";
                settings.stdout.lines[settings.stdout.pos++]="0x"+c.hex(c.offset.stack,true)+" stack";
                settings.stdout.lines[settings.stdout.pos++]="0x"+c.hex(c.offset.screen,true)+" "+helpers.screen.name($this);
                settings.stdout.lines[settings.stdout.pos++]="0x"+c.hex(c.offset.code,true)+" code";
                this.display($this);
            },
            export  : function($this) {
                var settings = helpers.settings($this);
                return settings.stdout.lines[0]+'\n'+settings.stdout.lines[1]+'\n'+settings.stdout.lines[2]+'\n'+
                       settings.stdout.lines[3]+'\n'+settings.stdout.lines[4]+'\n'+settings.stdout.lines[5]+'\n'+
                       settings.stdout.lines[6];
            },
            get : function($this) { var settings = helpers.settings($this); return settings.stdout.lines[settings.stdout.pos]; }
        },
        screen: {
            colors  : [[],
                       ["#000000", "#ffffff", "#880000", "#aaffee","#cc44cc", "#00cc55", "#0000aa", "#eeee77",
                        "#dd8855", "#664400", "#ff7777", "#333333","#777777", "#aaff66", "#0088ff", "#bbbbbb"],
                       ["#ffffff", "#000000"],
                       ["#081820", "#346856", "#88c070", "#e0f8d0"],
                       ["#081820", "#346856", "#88c070", "#e0f8d0"]],
            models  : [[16,16,8],[32,32,4],[48,32,1],[40,36,2],[80,72,2]],
            init: function($this) {
                var settings = helpers.settings($this);
                for (var i=0; i<256; i++) { this.colors[0].push("#"+helpers.c.hex(i)+helpers.c.hex(i)+helpers.c.hex(i)); }

                var model = this.models[settings.model];

                $this.find("#screens").addClass("s"+settings.model);

                settings.screen.p = Math.floor($this.find("#canvas").width()/model[0]);
                $this.find("#canvas canvas").attr("width",(model[0]*settings.screen.p)+"px")
                                            .attr("height",(model[1]*settings.screen.p)+"px")
                                            .css("width",(model[0]*settings.screen.p)+"px")
                                            .css("height",(model[1]*settings.screen.p)+"px")
                                            .css("margin-left",Math.floor(($this.find("#canvas").width()%model[0])/2)+"px")
                                            .css("margin-top",Math.floor(($this.find("#canvas").height()%model[1])/2)+"px");

                settings.screen.ctxt = $this.find("#canvas canvas")[0].getContext('2d');
                this.clear($this);
            },
            clear: function($this) {
                var settings = helpers.settings($this);
                settings.screen.ctxt.fillStyle = this.colors[settings.model][0];
                settings.screen.ctxt.fillRect(0, 0, this.models[settings.model][0]*settings.screen.p,
                                                    this.models[settings.model][1]*settings.screen.p);
            },
            name: function($this) {
                var settings = helpers.settings($this);
                var model = this.models[settings.model]; return model[0]+"x"+model[1]+"x"+(1<<model[2]); },
            set: function($this, _data, _addr, _val) {
                var settings = helpers.settings($this);
                var nb = 8/this.models[settings.model][2];
                var offset = (_addr-helpers.c.offset.screen)*nb;
                var mask = (1<<this.models[settings.model][2])-1;
                for (var i=0; i<nb; i++) {
                    var pixel = offset+i;
                    var s = ((nb-i-1)*this.models[settings.model][2]);
                    var color = (_val&(mask<<s))>>s;
                    var x = pixel%this.models[settings.model][0];
                    var y = Math.floor(pixel/this.models[settings.model][0]);
                    settings.screen.ctxt.fillStyle = this.colors[settings.model][color];
                    settings.screen.ctxt.fillRect(x*settings.screen.p, y*settings.screen.p, settings.screen.p, settings.screen.p);
                }
            }
        },
        // MEMORY
        memory: {
            set:  function(_data, _addr, _val)  { return _data.mem[_addr] = _val; },
            getb: function(_data, _addr)        { return _data.mem[_addr]; },
            getw: function(_data, _addr)        { return this.getb(_data,_addr) + (this.getb(_data,_addr + 1) << 8); },
            setb: function(_data, _addr, _val)  { this.set(_data, _addr, _val & 0xff);
                                                  if ((_addr >= helpers.c.offset.screen) && (_addr < helpers.c.offset.code)) {
                                                    helpers.screen.set(_data.$this,_data, _addr, _val);
                                                  }
                                                  if (_addr== helpers.c.offset.stdout) { helpers.stdout.ascii(_data.$this,_val,false);}},
            key:  function(_data, _val)         { this.setb(_data,0, helpers.c.offset.key, _val); },
            init: function(_data)               { if (!_data.mem) { _data.mem = new Array(helpers.c.offset.end);
                                                  for (var i = 0; i < helpers.c.offset.end; i++) { _data.mem[i]=0; } } },
            clear:function(_data)               { for (var i = 0; i < helpers.c.offset.code; i++) { this.set(_data,i,i==0xfc?0xff:0x00);} }
        },
        // COMPILER
        compiler: {
            process: function(_data) {
                var error = "";
                var labels = {
                    data: [],
                    get: function (_name) {
                        var ret = 0;
                        for (var i in this.data) { if (this.data[i].name==_name) { ret = this.data[i]; } }
                        if (!ret) { ret = { name: _name, pos:0, calls:[], callabs:[] }; this.data.push(ret); }
                        return ret;
                    }
                };
                helpers.stdout.line(_data.$this, "Compilation ", true);
                _data.pc = helpers.c.offset.code;
                _data.compiled = true;

                // HEADER
                var settings = helpers.settings(_data.$this);
                if (settings.header) {
                    for (var i in settings.header) {
                        labels.get(settings.header[i].label).pos = _data.pc;
                        var codheader = helpers.c.token(settings.header[i].code);
                        for (var j in codheader) { helpers.compiler.pushb(_data, parseInt(codheader[j],16)); }
                    }
                }

                _data.range[0] = _data.pc;
                _data.address  = {};

                // SCREEN
                _data.$this.find(".line.x").each(function(_index) {
                    if (_data.compiled) {

                        // PARSE EACH LINE
                        var line = { isempty:true, label:"", op:"", arg:{value:"", type:11, sub:0}};
                        $(this).find("div").each(function() {
                            if ($(this).hasClass("label") && ! $(this).hasClass("arg")) {
                                line.label = $(this).html(); line.isempty = false;
                            } else
                            if ($(this).hasClass("op")) { line.op=$(this).html(); line.isempty = false;}            else
                            if ($(this).hasClass("arg")) {
                                line.arg.value = $(this).html(); line.isempty = false; line.arg.sub = 0;
                                // GET THE TYPE OF THE ARG
                                if ($(this).hasClass("v"))      { line.arg.type=1; }                                else
                                if ($(this).hasClass("label"))  { line.arg.type=12;
                                    if ($(this).hasClass("x"))  { line.arg.sub = 6; } else
                                    if ($(this).hasClass("y"))  { line.arg.sub = 7; } else
                                    if ($(this).hasClass("i"))  { line.arg.sub = 8; }
                                }                                                                                   else
                                if ($(this).hasClass("x"))      { line.arg.type= ($(this).html().length==2)?3:6; }  else
                                if ($(this).hasClass("y"))      { line.arg.type= ($(this).html().length==2)?4:7; }  else
                                if ($(this).hasClass("i"))      { line.arg.type=8; }                                else
                                if ($(this).hasClass("ix"))     { line.arg.type=9; }                                else
                                if ($(this).hasClass("iy"))     { line.arg.type=10; }                               else
                                line.arg.type=($(this).html().length==2)?2:5;
                            }
                        });
                        // COMPILE THE LINE
                        if (!line.isempty) {
                            if (line.label.length) { labels.get(line.label).pos = _data.pc; }
                            else {
                                var opid = -1;
                                for (var i in opcodes) { if (opcodes[i][0]==line.op) { opid=i; } }
                                var opcode = opcodes[opid][line.arg.sub?line.arg.sub:line.arg.type], branchabs = false;
                                if (opcode==null && line.arg.type==12 && line.arg.sub==0) { opcode=opcodes[opid][5]; branchabs = true;}

                                if (opid!=-1 && opcode!=null) {
                                    _data.address[_data.pc] = _index;

                                    helpers.compiler.pushb(_data,opcode);
                                    switch(line.arg.type) {
                                        case 0: case 1: case 2: case 3:
                                        case 9: case 10:
                                            helpers.compiler.pushb(_data, parseInt(line.arg.value,16));
                                            break;
                                        case 4: case 5: case 6: case 7: case 8:
                                            helpers.compiler.pushw(_data, parseInt(line.arg.value,16));
                                            break;
                                        case 12:
                                            if (branchabs || line.arg.sub!=0 ) {
                                                labels.get(line.arg.value).callabs.push(_data.pc);
                                                helpers.compiler.pushw(_data, 0);
                                            }
                                            else {
                                                labels.get(line.arg.value).calls.push(_data.pc);
                                                helpers.compiler.pushb(_data, 0);
                                            }
                                            break;
                                    }
                                }
                                else {
                                    _data.compiled = false;
                                    if (opid==-1) { error = "("+_index+") "+line.op+" unknown"; }
                                    else          { error = "("+_index+") "+line.op+" no "+addr[line.arg.sub?line.arg.sub:line.arg.type]; }
                                }
                            }
                        }
                    }
                });
                _data.range[1] = _data.pc;

                // FOOTER
                if (settings.footer) {
                    for (var i in settings.footer) {
                        labels.get(settings.footer[i].label).pos = _data.pc;
                        var codfooter = helpers.c.token(settings.footer[i].code);
                        for (var j in codfooter) { helpers.compiler.pushb(_data, parseInt(codfooter[j],16)); }
                    }
                }

                // UPDATE THE LABELS
                for (var i in labels.data) {
                    if (_data.compiled) {
                        if (!labels.data[i].pos) { _data.compiled = false; error = labels.data[i].name+" unknown"; } else
                        for (var j in labels.data[i].calls) {
                            var offset = (256+(labels.data[i].pos-labels.data[i].calls[j]-1))%256;
                            helpers.memory.set(_data, labels.data[i].calls[j], offset & 0xff);
                        }
                        for (var j in labels.data[i].callabs) {
                            helpers.memory.set(_data, labels.data[i].callabs[j],     labels.data[i].pos & 0xff);
                            helpers.memory.set(_data, labels.data[i].callabs[j]+1,  (labels.data[i].pos>>8) & 0xff);
                        }
                    }
                }

                if (_data.compiled) { helpers.stdout.line(_data.$this, "OK"); } else
                                    { helpers.stdout.line(_data.$this, "KO");
                                      helpers.stdout.line(_data.$this, error); }
            },
            pushb: function (_data,_value) { helpers.memory.set(_data, _data.pc++, _value & 0xff); },
            pushw: function (_data,_value) { helpers.compiler.pushb(_data,_value & 0xff);
                                             helpers.compiler.pushb(_data,(_value >> 8) & 0xff); }
        },
        // PROCESS
        process: {
            init    : function(_data) { _data.reg.A = 0; _data.reg.X = 0; _data.reg.Y = 0; _data.reg.P = 0, 
                                        _data.reg.PC = helpers.c.offset.code, _data.reg.SP=0xFF; _data.count = 0;
                                        _data.timer = 0; },
            display : function(_data) {
                _data.$this.find("#rega .value").html(helpers.c.hex(_data.reg.A, false));
                _data.$this.find("#regx .value").html(helpers.c.hex(_data.reg.X, false));
                _data.$this.find("#regy .value").html(helpers.c.hex(_data.reg.Y, false));
                _data.$this.find("#regs .value").html(helpers.c.hex(_data.reg.SP, false));
                _data.$this.find("#regpc .value").html("0x"+helpers.c.hex(_data.reg.PC, true));
                for (var i=0; i<8; i++) {
                    _data.$this.find("#f"+(7-i)+" .value").html(_data.reg.P&(1<<i)?"1":"0");
                }
            },
            run: function(_data) {
                var donotstop;
                var debug = (_data.speed==0);
                var speed = 3-_data.speed;
                speed = 200*speed*speed;

                do {
                    var inside= (_data.reg.PC>=_data.range[0] && _data.reg.PC<_data.range[1]);
                    donotstop = false;
                    if (_data.reg.PC<_data.pc) {
                        // RANDOM
                        helpers.memory.set(_data,helpers.c.offset.random,
                            (_data.random?parseInt(_data.random[_data.count%_data.random.length],16):Math.floor(Math.random() * 256)));
                        _data.count++;

                        // SPEED
                        if (_data.speed<3 && inside) {
                            _data.$this.find(".line.x").removeClass("c");
                            if (typeof(_data.address[_data.reg.PC])!='undefined') {
                                $(_data.$this.find(".line.x").get(_data.address[_data.reg.PC])).addClass("c");
                            }
                        }

                        var i = helpers.c.hex(this.getb(_data),false);
                        if (i==0) { helpers.check.process(_data.$this, true); }
                        else if (helpers.process["i"+i]) {
                            helpers.process["i"+i](_data);
                            if (_data.speed!=3 ) this.display(_data);

                            if (inside && ( debug || _data.paused))
                                    { _data.$this.find("#controls #play img").attr("src","res/img/control/play.svg"); }
                            else    {
                                if (inside && speed) { _data.timer = setTimeout(function() { helpers.process.run(_data) }, speed); }
                                else                 {
                                    // AT MAXIMUM SPEED, LAUNCH A TIMER SOME TIME TO HANDLE EVENTS AND DISPLAY STUFF
                                    if (_data.count%97) { donotstop = true; }
                                    else                { _data.timer = setTimeout(function() { helpers.process.run(_data) }, 0); }
                                }
                            }
                        }
                        else {
                            helpers.stdout.line(_data.$this, i+" unknown");
                            helpers.check.process(_data.$this, false);
                        }
                    }
                    else { helpers.check.process(_data.$this, true); }
                } while (donotstop);
            },
            getb: function(_data) { var ret = helpers.memory.getb(_data, _data.reg.PC); _data.reg.PC+=1; return ret; },
            getw: function(_data) { var ret = helpers.memory.getw(_data, _data.reg.PC); _data.reg.PC+=2; return ret; },
            f: {
                nv: function(_data, _value) {
                    if (_value)                 { _data.reg.P &= 0xfd; } else { _data.reg.P |= 0x02; }
                    if (_value & 0x80)          { _data.reg.P |= 0x80; } else { _data.reg.P &= 0x7f; }
                },
                bit: function(_data, _value) {
                    if (_value & 0x80)          { _data.reg.P |= 0x80; } else { _data.reg.P &= 0x7f; }
                    if (_value & 0x40)          { _data.reg.P |= 0x40; } else { _data.reg.P &= ~0x40;}
                    if (_data.reg.A & _value)   { _data.reg.P &= 0xfd; } else { _data.reg.P |= 0x02; }
                },
                carry0: function(_data, _value)    { _data.reg.P = (_data.reg.P & 0xfe) | (_value & 1); },
                carry7: function(_data, _value)    { _data.reg.P = (_data.reg.P & 0xfe) | ((_value >> 7) & 1); },
                clc: function(_data)            { _data.reg.P &= 0xfe; },
                sec: function(_data)            { _data.reg.P |= 1; },
                clv: function(_data)            { _data.reg.P &= 0xbf; },
                over: function(_data)            { _data.reg.P |= 0x40; },
                dec: function(_data, _addr) {
                    var val = (helpers.memory.getb(_data, _addr)-1)&0xff; helpers.memory.setb(_data,_addr,val); this.nv(_data,val);
                },
                inc: function(_data, _addr) {
                    var val = (helpers.memory.getb(_data, _addr)+1)&0xff; helpers.memory.setb(_data,_addr,val); this.nv(_data,val);
                },
                ph: function (_data, _value) {
                    helpers.memory.setb(_data, (_data.reg.SP & 0xff) + 0x100, _value & 0xff);
                    if (--_data.reg.SP < 0) { _data.reg.SP &= 0xff; helpers.stdout.line(_data.$this, "Stack filled..."); }
                },
                pl: function(_data) {
                    if (++_data.reg.SP >= 0x100) { _data.reg.SP &= 0xff; helpers.stdout.line(_data.$this,"Stack emptied..."); }
                    return helpers.memory.getb(_data, (_data.reg.SP & 0xff) + 0x100);
                },
                jp: function(_data, _offset)        { _data.reg.PC+=(_offset>0x7f)?(_offset-0x100):_offset; },
                cmp: function(_data, _reg, _val)    { if (_reg >= _val) { this.sec(_data); } else { this.clc(_data); }
                                                      this.nv(_data, _reg-_val);
                },
                iszero      : function(_data)           { return _data.reg.P & 0x02; },
                isover      : function(_data)           { return _data.reg.P & 0x40; },
                isdecimal   : function(_data)           { return _data.reg.P & 8; },
                iscarry     : function(_data)           { return _data.reg.P & 1; },
                isneg       : function(_data)           { return _data.reg.P & 0x80; },
                a           : function(_data)           { this.nv(_data, _data.reg.A); },
                x           : function(_data)           { this.nv(_data, _data.reg.X); },
                y           : function(_data)           { this.nv(_data, _data.reg.Y); },
                sbc         : function(_data, _value)   {
                    var w;
                    if ((_data.reg.A ^ _value)&0x80) { this.over(_data); } else { this.clv(_data); }
                    if (this.isdecimal(_data)) {
                        var tmp = 0xf + (_data.reg.A & 0xf) - (_value & 0xf) + this.iscarry(_data);
                        if (tmp<0x10) { w=0; tmp-=6; } else { w = 0x10; tmp-=0x10; }
                        w += 0xf0 + (_data.reg.A & 0xf0) - (_value & 0xf0);
                        if (w<0x100) { this.clc(_data); if (this.isover(_data) && w<0x80) { this.clv(_data); } w-=0x60; }
                        else         { this.sec(_data); if (this.isover(_data) && w>=0x180) { this.clv(_data); } }
                        w+=tmp;
                    }
                    else {
                        w = 0xff + _data.reg.A - _value + this.iscarry(_data);
                        if (w<0x100) { this.clc(_data); if (this.isover(_data) && w<0x80) { this.clv(_data); } }
                        else         { this.sec(_data); if (this.isover(_data) && w>=0x180) { this.clv(_data); } }
                    }
                    _data.reg.A = w & 0xff;
                    this.a(_data);
                },
                adc         : function(_data, _value)   {
                    var tmp;
                    if ((_data.reg.A ^ _value)&0x80) { this.clv(_data); } else { this.over(_data); }
                    if (this.isdecimal(_data)) {
                        tmp = (_data.reg.A & 0xf) + (_value & 0xf) + this.iscarry(_data);
                        if (tmp >= 10) { tmp = 0x10 | ((tmp + 6) & 0xf); }
                        tmp += (_data.reg.A & 0xf0) + (_value & 0xf0);
                        if (tmp >= 160) { this.sec(_data); if (this.isover(_data) && tmp >= 0x180) { this.clv(_data); } tmp += 0x60; }
                        else            { this.clc(_data); if (this.isover(_data) && tmp<0x80) { this.clv(_data); } }
                    }
                    else {
                        tmp = _data.reg.A + _value + this.iscarry(_data);
                        if (tmp >= 0x100) { this.sec(_data); if (this.isover(_data) && tmp >= 0x180) { this.clv(_data); } }
                        else { this.clc(_data); if (this.isover(_data) && tmp<0x80) { this.clv(_data); } }
                    }
                    _data.reg.A = tmp & 0xff;
                    this.a(_data);
                }
            },
            i01: function(_data) { _data.reg.A|= helpers.memory.getb(_data, helpers.memory.getw(_data, (this.getb(_data)+_data.reg.X)&0xff));
                                   this.f.a(_data); },
            i05: function(_data) { _data.reg.A|= helpers.memory.getb(_data, this.getb(_data)); this.f.a(_data); },
            i06: function(_data) { var zp = this.getb(_data); var val = helpers.memory.getb(_data, zp);
                                   this.f.carry7(_data, val); val = val<<1; helpers.memory.setb(_data, zp, val); this.nv(_data, val); },
            i08: function(_data) { this.f.ph(_data, _data.reg.P | 0x30); },
            i09: function(_data) { _data.reg.A|= this.getb(_data); this.f.a(_data);  },
            i0a: function(_data) { this.f.carry7(_data,_data.reg.A); _data.reg.A = (_data.reg.A << 1) & 0xff; this.f.a(_data); },
            i0d: function(_data) { _data.reg.A|= helpers.memory.getb(_data, this.getw(_data)); this.f.a(_data); },
            i0e: function(_data) { var addr = this.getw(_data); var val = helpers.memory.getb(_data, addr);
                                   this.f.carry7(_data, val); val = val<<1; helpers.memory.setb(_data, addr, val); this.nv(_data, val); },
            i10: function(_data) { var offset = this.getb(_data); if (!this.f.isneg(_data)) { this.f.jp(_data,offset); } },
            i11: function(_data) { _data.reg.A|= helpers.memory.getb(_data, helpers.memory.getw(_data, (this.getb(_data)+_data.reg.Y)&0xff));
                                   this.f.a(_data); },
            i15: function(_data) { _data.reg.A|= helpers.memory.getb(_data, (this.getb(_data)+_data.reg.X)&0xff); this.f.a(_data); },
            i16: function(_data) { var zp = (this.getb(_data)+_data.reg.X)&0xff; var val = helpers.memory.getb(_data, zp);
                                   this.f.carry7(_data, val); val = val<<1; helpers.memory.setb(_data, zp, val); this.nv(_data, val); },
            i18: function(_data) { this.f.clc(_data); },
            i19: function(_data) { _data.reg.A|= helpers.memory.getb(_data, this.getw(_data)+_data.reg.Y); this.f.a(_data); },
            i1d: function(_data) { _data.reg.A|= helpers.memory.getb(_data, this.getw(_data)+_data.reg.X); this.f.a(_data); },
            i1e: function(_data) { var addr = this.getw(_data)+_data.reg.X; var val = helpers.memory.getb(_data, addr);
                                   this.f.carry7(_data, val); val = val<<1; helpers.memory.setb(_data, addr, val); this.nv(_data, val); },
            i20: function(_data) { this.f.ph(_data, ((_data.reg.PC+1)>>8)&0xff); this.f.ph(_data, (_data.reg.PC+1)&0xff);
                                   _data.reg.PC = this.getw(_data); },
            i21: function(_data) { _data.reg.A&= helpers.memory.getb(_data,helpers.memory.getw(_data,(this.getb(_data)+_data.reg.X)&0xff));
                                   this.f.a(_data); },
            i24: function(_data) { this.f.bit(_data,helpers.memory.getb(_data, this.getb(_data))); },
            i25: function(_data) { _data.reg.A&=helpers.memory.getb(_data, this.getb(_data)); this.f.a(_data); },
            i26: function(_data) { var sf=this.f.iscarry(_data), zp=this.getb(_data); var val=helpers.memory.getb(_data, zp);
                                   this.f.carry7(_data, val); val = val<<1; val|=sf; helpers.memory.setb(_data, zp, val);
                                   this.nv(_data, val); },
            i28: function(_data) { _data.reg.P = this.f.pl(_data) | 0x30; },
            i29: function(_data) { _data.reg.A &= this.getb(_data); this.f.a(_data); },
            i2a: function(_data) { var sf = this.f.iscarry(_data); this.f.carry7(_data, _data.reg.A);
                                   _data.reg.A = (_data.reg.A<<1)&0xff; _data.reg.A|=sf; this.f.a(_data); },
            i2c: function(_data) { this.f.bit(helpers.memory.getb(_data, this.getw(_data))); },
            i2d: function(_data) { _data.reg.A &= helpers.memory.getb(_data, this.getw(_data)); this.f.a(_data); },
            i2e: function(_data) { var sf=this.f.iscarry(_data), addr=this.getw(_data); var val=helpers.memory.getb(_data, addr);
                                   this.f.carry7(_data, val); val = val<<1; val|=sf; helpers.memory.setb(_data, addr, val);
                                   this.nv(_data, val); },
            i30: function(_data) { var offset = this.getb(_data); if (this.f.isneg(_data)) { this.f.jp(_data,offset); } },
            i31: function(_data) { _data.reg.A &= helpers.memory.getb(_data, helpers.memory.getw(_data,this.getp(_data))+_data.reg.Y);
                                   this.f.a(_data); },
            i35: function(_data) { _data.reg.A &= helpers.memory.getb((this.getb(_data)+_data.reg.X)&0xff); this.f.a(_data); },
            i36: function(_data) { var sf=this.f.iscarry(_data), zp=(this.getb(_data)+_data.reg.X)&0xff; var val=helpers.memory.getb(_data, zp);
                                   this.f.carry7(_data, val); val = val<<1; val|=sf; helpers.memory.setb(_data, zp, val);
                                   this.nv(_data, val); },
            i38: function(_data) { this.f.sec(_data); },
            i39: function(_data) { _data.reg.A &= helpers.memory.getb(this.getw(_data)+_data.reg.Y); this.f.a(_data); },
            i3d: function(_data) { _data.reg.A &= helpers.memory.getb(this.getw(_data)+_data.reg.X); this.f.a(_data); },
            i3e: function(_data) { var sf=this.f.iscarry(_data),addr=this.getw(_data)+_data.reg.X;var val=helpers.memory.getb(_data, addr);
                                   this.f.carry7(_data, val); val = val<<1; val|=sf; helpers.memory.setb(_data, addr, val);
                                   this.nv(_data, val); },
            i40: function(_data) { _data.reg.P = this.f.pl(_data) | 0x30; _data.reg.PC = this.f.pl(_data) | (this.f.pl(_data) << 8); },
            i41: function(_data) { _data.reg.A^= helpers.memory.getb(_data, helpers.memory.getw(_data, (this.getb(_data)+_data.reg.X)&0xff));
                                   this.f.a(_data); },
            i45: function(_data) { _data.reg.A^= helpers.memory.getb(_data, this.getb(_data)); this.f.a(_data); },
            i46: function(_data) { var zp = this.getb(_data); var val = helpers.memory.getb(_data, zp);
                                   this.f.carry0(_data, val); val = val>>1; helpers.memory.setb(_data, zp, val); this.nv(_data, val); },
            i48: function(_data) { this.f.ph(_data, _data.reg.A); },
            i49: function(_data) { _data.reg.A^= this.getb(_data); this.f.a(_data);  },
            i4a: function(_data) { this.f.carry0(_data, _data.reg.A); _data.reg.A = _data.reg.A >> 1; this.f.a(_data); },
            i4c: function(_data) { _data.reg.PC = this.getw(_data); },
            i4d: function(_data) { _data.reg.A^= helpers.memory.getb(_data, this.getw(_data)); this.f.a(_data); },
            i4e: function(_data) { var addr = this.getw(_data); var val = helpers.memory.getb(_data, addr);
                                   this.f.carry0(_data, val); val = val>>1; helpers.memory.setb(_data, addr, val); this.nv(_data, val); },
            i50: function(_data) { var offset = this.getb(_data); if (!this.f.isover(_data)) { this.f.jp(_data,offset); } },
            i51: function(_data) { _data.reg.A^= helpers.memory.getb(_data, helpers.memory.getw(_data, (this.getb(_data)+_data.reg.Y)&0xff));
                                   this.f.a(_data); },
            i55: function(_data) { _data.reg.A^= helpers.memory.getb(_data, (this.getb(_data)+_data.reg.X)&0xff); this.f.a(_data); },
            i56: function(_data) { var zp = (this.getb(_data)+_data.reg.X)&0xff; var val = helpers.memory.getb(_data, zp);
                                   this.f.carry0(_data, val); val = val>>1; helpers.memory.setb(_data, zp, val); this.nv(_data, val); },
            i58: function(_data) { _data.reg.P &= ~0x04; },
            i59: function(_data) { _data.reg.A^= helpers.memory.getb(_data, this.getw(_data)+_data.reg.Y); this.f.a(_data); },
            i5d: function(_data) { _data.reg.A^= helpers.memory.getb(_data, this.getw(_data)+_data.reg.X); this.f.a(_data); },
            i5e: function(_data) { var addr = this.getw(_data)+_data.reg.X; var val = helpers.memory.getb(_data, addr);
                                   this.f.carry0(_data, val); val = val>>1; helpers.memory.setb(_data, addr, val); this.nv(_data, val); },
            i60: function(_data) { _data.reg.PC = (this.f.pl(_data) | (this.f.pl(_data) << 8)) + 1;},
            i61: function(_data) { this.f.adc(_data, helpers.memory.getb(_data,
                                                        helpers.memory.getw(_data, (this.getb(_data)+_data.reg.X)&0xff))); },
            i65: function(_data) { this.f.adc(_data, helpers.memory.getb(_data,this.getb(_data))); },
            i66: function(_data) { var sf=this.f.iscarry(_data), zp=this.getb(_data); var val=helpers.memory.getb(_data, zp);
                                   this.f.carry0(_data, val); val = val>>1; if (sf) {val|=0x80;} helpers.memory.setb(_data, zp, val);
                                   this.nv(_data, val); },
            i68: function(_data) { _data.reg.A = this.f.pl(_data); this.f.a(_data); },
            i69: function(_data) { this.f.adc(_data, this.getb(_data)); },
            i6a: function(_data) { var sf=this.f.iscarry(_data); this.f.carry0(_data, _data.reg.A);
                                   _data.reg.A = _data.reg.A>>1; if (sf) {_data.reg.A|=0x80;} this.f.a(_data); },
            i6c: function(_data) { _data.reg.PC = helpers.memory.getw(_data, this.getw(_data)); },
            i6d: function(_data) { this.f.adc(_data, helpers.memory.getb(_data,this.getw(_data))); },
            i6e: function(_data) { var sf=this.f.iscarry(_data), addr=this.getw(_data); var val=helpers.memory.getb(_data, addr);
                                   this.f.carry0(_data, val); val = val>>1; if (sf) {val|=0x80;} helpers.memory.setb(_data, addr, val);
                                   this.nv(_data, val); },
            i70: function(_data) { var offset = this.getb(_data); if (this.f.isover(_data)) { this.f.jp(_data,offset); } },
            i71: function(_data) { this.f.adc(_data, helpers.memory.getb(_data,
                                                        helpers.memory.getw(_data, this.getb(_data))+_data.reg.Y)); },
            i75: function(_data) { this.f.adc(_data, helpers.memory.getb(_data,(this.getb(_data)+_data.reg.X)&0xff)); },
            i76: function(_data) { var sf=this.f.iscarry(_data), zp=(this.getb(_data)+_data.reg.X)&0xff; var val=helpers.memory.getb(_data, zp);
                                   this.f.carry0(_data, val); val = val>>1; if (sf) {val|=0x80;} helpers.memory.setb(_data, zp, val);
                                   this.nv(_data, val); },
            i78: function(_data) { _data.reg.P |= 0x04; },
            i79: function(_data) { this.f.adc(_data, helpers.memory.getb(_data,this.getw(_data)+_data.reg.Y)); },
            i7d: function(_data) { this.f.adc(_data, helpers.memory.getb(_data,this.getw(_data)+_data.reg.X)); },
            i7e: function(_data) { var sf=this.f.iscarry(_data), addr=this.getw(_data)+_data.reg.X; var val=helpers.memory.getb(_data, addr);
                                   this.f.carry0(_data, val); val = val>>1; if (sf) {val|=0x80;} helpers.memory.setb(_data, addr, val);
                                   this.nv(_data, val); },
            i81: function(_data) { helpers.memory.setb(_data,helpers.memory.getw(_data,(this.getb(_data)+_data.reg.X)&0xff),_data.reg.A);},
            i84: function(_data) { helpers.memory.setb(_data, this.getb(_data), _data.reg.Y); },
            i85: function(_data) { helpers.memory.setb(_data, this.getb(_data), _data.reg.A); },
            i86: function(_data) { helpers.memory.setb(_data, this.getb(_data), _data.reg.X); },
            i88: function(_data) { _data.reg.Y = ( _data.reg.Y - 1) & 0xff; this.f.y(_data); },
            i8a: function(_data) { _data.reg.A = _data.reg.X; this.f.a(_data);  },
            i8c: function(_data) { helpers.memory.setb(_data, this.getw(_data), _data.reg.Y); },
            i8d: function(_data) { helpers.memory.setb(_data, this.getw(_data), _data.reg.A); },
            i8e: function(_data) { helpers.memory.setb(_data, this.getw(_data), _data.reg.X); },
            i90: function(_data) { var offset = this.getb(_data); if (!this.f.iscarry(_data)) { this.f.jp(_data,offset); } },
            i91: function(_data) { helpers.memory.setb(_data, helpers.memory.getw(_data,this.getb(_data))+_data.reg.Y,_data.reg.A);},
            i94: function(_data) { helpers.memory.setb(_data, (this.getw(_data)+_data.reg.X)&0xff, _data.reg.Y); },
            i95: function(_data) { helpers.memory.setb(_data, (this.getw(_data)+_data.reg.X)&0xff, _data.reg.A); },
            i96: function(_data) { helpers.memory.setb(_data, (this.getw(_data)+_data.reg.Y)&0xff, _data.reg.X); },
            i98: function(_data) { _data.reg.A = _data.reg.Y; this.f.a(_data);  },
            i99: function(_data) { helpers.memory.setb(_data, this.getw(_data)+_data.reg.Y,  _data.reg.A); },
            i9a: function(_data) { _data.reg.SP = _data.reg.X & 0xff; },
            i9d: function(_data) { helpers.memory.setb(_data, this.getw(_data)+_data.reg.X,  _data.reg.A); },
            ia0: function(_data) { _data.reg.Y = this.getb(_data); this.f.y(_data);  },
            ia1: function(_data) { _data.reg.A = helpers.memory.getb(_data, helpers.memory.getw(_data, (this.getb(_data)+_data.reg.X)&0xff));
                                   this.f.a(_data); },
            ia2: function(_data) { _data.reg.X = this.getb(_data); this.f.x(_data);  },
            ia4: function(_data) { _data.reg.Y = helpers.memory.getb(_data, this.getb(_data)); this.f.y(_data); },
            ia5: function(_data) { _data.reg.A = helpers.memory.getb(_data, this.getb(_data)); this.f.a(_data); },
            ia6: function(_data) { _data.reg.X = helpers.memory.getb(_data, this.getb(_data)); this.f.x(_data); },
            ia8: function(_data) { _data.reg.Y = _data.reg.A; this.f.y(_data);  },
            ia9: function(_data) { _data.reg.A = this.getb(_data); this.f.a(_data);  },
            iaa: function(_data) { _data.reg.X = _data.reg.A; this.f.x(_data);  },
            iac: function(_data) { _data.reg.Y = helpers.memory.getb(_data, this.getw(_data)); this.f.y(_data); },
            iad: function(_data) { _data.reg.A = helpers.memory.getb(_data, this.getw(_data)); this.f.a(_data); },
            iae: function(_data) { _data.reg.X = helpers.memory.getb(_data, this.getw(_data)); this.f.x(_data); },
            ib0: function(_data) { var offset = this.getb(_data); if (this.f.iscarry(_data)) { this.f.jp(_data,offset); } },
            ib1: function(_data) { _data.reg.A = helpers.memory.getb(_data, helpers.memory.getw(_data, (this.getb(_data)+_data.reg.Y)&0xff));
                                   this.f.a(_data); },
            ib4: function(_data) { _data.reg.Y = helpers.memory.getb(_data, (this.getb(_data)+_data.reg.X)&0xff); this.f.y(_data); },
            ib5: function(_data) { _data.reg.A = helpers.memory.getb(_data, (this.getb(_data)+_data.reg.X)&0xff); this.f.a(_data); },
            ib6: function(_data) { _data.reg.X = helpers.memory.getb(_data, (this.getb(_data)+_data.reg.Y)&0xff); this.f.x(_data); },
            ib8: function(_data) { this.f.clv(); },
            ib9: function(_data) { _data.reg.A = helpers.memory.getb(_data, this.getw(_data)+_data.reg.Y); this.f.a(_data); },
            iba: function(_data) { _data.reg.X = _data.reg.SP & 0xff; this.f.x(_data); },
            ibc: function(_data) { _data.reg.Y = helpers.memory.getb(_data, this.getw(_data)+_data.reg.X); this.f.y(_data); },
            ibd: function(_data) { _data.reg.A = helpers.memory.getb(_data, this.getw(_data)+_data.reg.X); this.f.a(_data); },
            ibe: function(_data) { _data.reg.X = helpers.memory.getb(_data, this.getw(_data)+_data.reg.Y); this.f.x(_data); },
            ic0: function(_data) { this.f.cmp(_data, _data.reg.Y, this.getb(_data)); },
            ic1: function(_data) { this.f.cmp(_data, _data.reg.A, helpers.memory.getb(_data,
                                        helpers.memory.getw(_data, (this.getb(_data)+_data.reg.X)&0xff))); },
            ic4: function(_data) { this.f.cmp(_data, _data.reg.Y, helpers.memory.getb(this.getb(_data))); },
            ic5: function(_data) { this.f.cmp(_data, _data.reg.A, helpers.memory.getb(this.getb(_data))); },
            ic6: function(_data) { this.f.dec(_data, this.getb(_data)); },
            ic8: function(_data) { _data.reg.Y = ( _data.reg.Y + 1) & 0xff; this.f.y(_data); },
            ic9: function(_data) { this.f.cmp(_data, _data.reg.A, this.getb(_data)); },
            ica: function(_data) { _data.reg.X = ( _data.reg.X - 1) & 0xff; this.f.x(_data); },
            icc: function(_data) { this.f.cmp(_data, _data.reg.Y, helpers.memory.getb(this.getw(_data))); },
            icd: function(_data) { this.f.cmp(_data, _data.reg.A, helpers.memory.getb(this.getw(_data))); },
            ice: function(_data) { this.f.dec(_data, this.getw(_data)); },
            id0: function(_data) { var offset = this.getb(_data); if (!this.f.iszero(_data)) { this.f.jp(_data,offset); } },
            id1: function(_data) { this.f.cmp(_data, _data.reg.A, helpers.memory.getb(_data,
                                        helpers.memory.getw(_data, this.getb(_data))+_data.reg.Y)); },
            id5: function(_data) { this.f.cmp(_data, _data.reg.A, helpers.memory.getb((this.getb(_data)+_data.reg.X)&0xff)); },
            id6: function(_data) { this.f.dec(_data, (this.getb(_data)+_data.reg.X)&0xff); },
            id8: function(_data) { _data.reg.P &= 0xf7; },
            id9: function(_data) { this.f.cmp(_data, _data.reg.A, helpers.memory.getb(this.getw(_data)+_data.reg.Y)); },
            idd: function(_data) { this.f.cmp(_data, _data.reg.A, helpers.memory.getb(this.getw(_data)+_data.reg.X)); },
            ide: function(_data) { this.f.dec(_data, this.getw(_data)+_data.reg.X); },
            ie0: function(_data) { this.f.cmp(_data, _data.reg.X, this.getb(_data)); },
            ie1: function(_data) { this.f.sbc(_data, helpers.memory.getb(_data,
                                                        helpers.memory.getw(_data, (this.getb(_data)+_data.reg.X)&0xff))); },
            ie4: function(_data) { this.f.cmp(_data, _data.reg.X, helpers.memory.getb(this.getb(_data))); },
            ie5: function(_data) { this.f.sbc(_data, helpers.memory.getb(_data,this.getb(_data))); },
            ie6: function(_data) { this.f.inc(_data, this.getb(_data)); },
            ie8: function(_data) { _data.reg.X = ( _data.reg.X + 1) & 0xff; this.f.x(_data); },
            ie9: function(_data) { this.f.sbc(_data, this.getb(_data)); },
            iea: function(_data) { },
            iec: function(_data) { this.f.cmp(_data, _data.reg.X, helpers.memory.getb(this.getw(_data))); },
            ied: function(_data) { this.f.sbc(_data, helpers.memory.getb(_data,this.getw(_data))); },
            iee: function(_data) { this.f.inc(_data, this.getw(_data)); },
            if0: function(_data) { var offset = this.getb(_data); if (this.f.iszero(_data)) { this.f.jp(_data,offset); } },
            if1: function(_data) { this.f.sbc(_data, helpers.memory.getb(_data,
                                                        helpers.memory.getw(_data, this.getb(_data))+_data.reg.Y)); },
            if5: function(_data) { this.f.sbc(_data, helpers.memory.getb(_data,(this.getb(_data)+_data.reg.X)&0xff)); },
            if6: function(_data) { this.f.inc(_data, (this.getb(_data)+_data.reg.X)&0xff); },
            if8: function(_data) { _data.reg.P |= 8; },
            if9: function(_data) { this.f.sbc(_data, helpers.memory.getb(_data,this.getw(_data)+_data.reg.Y)); },
            ifd: function(_data) { this.f.sbc(_data, helpers.memory.getb(_data,this.getw(_data)+_data.reg.X)); },
            ife: function(_data) { this.f.inc(_data, this.getw(_data)+_data.reg.X); }
        },
        // CHECK THE PROGRAM
        check: {
            process: function($this, _finished){
                var settings = helpers.settings($this);
                var success = true;

                helpers.process.display(settings.data);

                $this.find("#check>div").hide();
                $this.find("#check").show();
                for (var i in settings.valid) {
                    if (helpers.check["c"+i]) {
                        var good=helpers.check["c"+i](settings.data, settings.valid[i]);
                        success&=good;
                        if (good) { $this.find("#check #"+i+"good").show(); }
                        else      { $this.find("#check #"+i+"wrong").show(); }
                    }
                }

                $this.find("#effects>div").hide();
                if (success && _finished) { $this.find("#effects #good").show(); setTimeout(function(){helpers.end($this);}, 2000); }
                else                      { $this.find("#effects #wrong").show(); setTimeout(function(){helpers.next($this);},2000); }
                $this.find("#effects").show();
                $this.find("#controls #play img").attr("src","res/img/control/play.svg");
                $this.find("#controls").removeClass("running");
                settings.data.running = false;
            },
            ca  : function(_data, _value) { return (_data.reg.A==parseInt(_value,16)); },
            cx  : function(_data, _value) { return (_data.reg.X==parseInt(_value,16)); },
            cy  : function(_data, _value) { return (_data.reg.Y==parseInt(_value,16)); },
            cmem: function(_data, _value) {
                var ret = true;
                for (var j in _value) {
                    var mem  = helpers.c.token(_value[j]);
                    var addr = parseInt(j, 16);
                    for (var k=0; k<mem.length; k++) { ret&=(helpers.memory.getb(_data,addr+k)==parseInt(mem[k],16)); }
                }
                return ret; },
            cout: function(_data, _value) { return (_value==helpers.stdout.get(_data.$this)); },
            cn : function(_data, _value) { return ( ((_data.reg.P&0x80)!=0)==_value); },
            cv : function(_data, _value) { return ( ((_data.reg.P&0x40)!=0)==_value); },
            cd : function(_data, _value) { return ( ((_data.reg.P&0x08)!=0)==_value); },
            cz : function(_data, _value) { return ( ((_data.reg.P&0x02)!=0)==_value); },
            cc : function(_data, _value) { return ( ((_data.reg.P&0x01)!=0)==_value); }
        },
        next: function($this) {
            $this.find(".mask").hide();
            $this.find("#check>div").hide();
            $this.find("#check").hide();
            $this.find("#effects").hide();
            $this.find("#effects #wrong").hide();
            $this.find(".line.x").removeClass("c");
        },
        key:function($this, _value) { helpers.memory.set(helpers.settings($this).data, helpers.c.offset.key, _value & 0xff); }
    };

    // The plugin
    $.fn.asm = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    score           : 5,
                    data : {
                        $this       : 0,
                        compiled    : false,
                        running     : false,
                        paused      : false,
                        reg         : { A:0, X:0, Y:0, P:0, PC:0, SP:0 },
                        mem         : 0,
                        pc          : 0,
                        range       : [0,0],
                        random      : [],
                        speed       : 2,
                        count       : 0,
                        address     : {},
                        timer       : 0
                    },
                    stdout: { lines : ["","","","","","",""], pos: 0 },
                    screen: { p : 1, ctxt : 0 }
                };

                return this.each(function() {
                    var $this = $(this);
                    $(document).unbind("keydown");
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
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find(".mask").show();
                settings.context.onquit($this,{'status':'abort'});
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find(".mask").hide();
                $this.find("#splash").hide();
            },
            code: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (!settings.data.compiled) { helpers.compiler.process(settings.data); }
                if (settings.data.compiled) {
                    var code="";
                    var html="";
                    for (var i=helpers.c.offset.code; i<settings.data.pc; i++){
                        html+=(i%16)?" ":("<p>0x"+helpers.c.hex(i,true)+" ");
                        html+=helpers.c.hex(settings.data.mem[i],false);
                        code+=helpers.c.hex(settings.data.mem[i],false);
                        if (i%16==15) { html+="</p>"; }
                    }
                    $this.find("#binary div").html(html+"</p>");
                    if (settings.export) { alert(code); } else { $this.find("#binary").show(); }
                }
            },
            stack: function() {
                var $this = $(this) , settings = helpers.settings($this);
                var html="";
                for (var i=helpers.c.offset.stack; i<helpers.c.offset.stack+256; i++){
                    html+=(i%16)?" ":("<p>0x"+helpers.c.hex(i,true)+" ");
                    html+=helpers.c.hex(settings.data.mem[i],false);
                    if (i%16==15) { html+="</p>"; }
                }
                $this.find("#binary div").html(html+"</p>");
                $this.find("#binary").show();
            },
            click: function(_value) { helpers.key($(this), _value); },
            play: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.data.running) {
                    if (settings.data.speed==0 || settings.data.paused ) {
                        settings.data.paused = false;
                        $this.find("#controls #play img").attr("src","res/img/control/pause.svg");
                        helpers.process.run(settings.data);
                    }
                    else {
                        settings.data.paused = true;
                    }
                }
                else {
                    if (!settings.data.compiled) { helpers.compiler.process(settings.data); }
                    if (settings.data.compiled) {
                        helpers.stdout.clear($this);
                        $this.find(".mask").show();
                        $this.find("#controls").addClass("running");
                        $this.find("#controls #play img").attr("src","res/img/control/pause.svg");
                        settings.data.running = true;
                        settings.data.paused = false;
                        helpers.screen.clear($this);
                        helpers.process.init(settings.data);
                        helpers.process.display(settings.data);
                        helpers.memory.clear(settings.data);
                        setTimeout(function(){ helpers.process.run(settings.data);}, 200);
                    }
                }
            },
            speed: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.data.running && settings.data.speed==0 ) { settings.data.paused = true; }
                if (settings.data.running && settings.data.speed==2 ) { $this.find(".line.x").removeClass("c"); }

                settings.data.speed = (settings.data.speed+1)%4;
                helpers.loader.speed($this);
            },
            stop: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.data.running) {
                    if (settings.data.timer) { clearTimeout(settings.data.timer); settings.data.timer = 0; }
                    helpers.check.process($this, false);
                }
            },
            stdout: function() { helpers.stdout.splash($(this)); }

        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in assembler plugin!'); }
    };
})(jQuery);
