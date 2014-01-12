(function($) {
    // Activity default options
    var defaults = {
        name        : "asm",                                    // The activity name
        label       : "Assembler",                              // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
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
                            start:function() { settings.data.compiled = false;}});
                    }
                });

                // Build the header
                var headlen = 0;
                if (settings.header) {
                    for (var i in settings.header) {
                        $this.find("#code #lines").append("<div class='line"+(i%2?" i":"")+"'><div class='code'>"+
                            "<div class='codelabel'>"+settings.header[i].label+"</div>"+
                            "<div class='codevalue'>"+settings.header[i].value+"</div>"+
                            "<div class='coderts'>"+(settings.header[i].rts?"rts":"")+"</div>"+
                            "</div></div>");
                        headlen++;
                    }
                }

                // Prepare the program
                for (var i=0; i<settings.nblines; i++) {
                    $this.find("#code #lines").append("<div class='line x"+((i+headlen)%2?" i":"")+"'></div>");
                }
                $this.find("#code #lines .line.x").droppable({accept:".a",
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
                                    settings.data.compiled = false;
                                    if ($elt.hasClass("label")) { $elt.removeClass("e"); } $elt.detach();} });
                        }
                } });

                settings.data.$this = $this;

                helpers.stdout.splash($this);
                helpers.process.init(settings.data);
                helpers.memory.init(settings.data);
                helpers.process.display(settings.data);
                if ($.isArray(settings.exercice)) {
                    $this.find("#exercice").html("");
                    for (var i in settings.exercice) {
                        $this.find("#exercice").append("<p>"+(settings.exercice[i].length?settings.exercice[i]:"&nbsp;")+"</p>"); }
                } else { $this.find("#exercice").html(settings.exercice); }
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
            add     : function($this, _char, _donotdisplay) {
                if (this.pos<7 && this.lines[this.pos].length>=19) { this.pos++; }
                if (_char=='\n')    { this.pos++; }
                if (this.pos==7)    { for (var i=0; i<6; i++) { this.lines[i]=this.lines[i+1]; } this.lines[6]=""; this.pos=6; }
                if (_char!='\n')    { this.lines[this.pos]+=_char; }
                if (!_donotdisplay) { this.display($this); }
            },
            line    : function($this, _line, _noteof) {
                for (var i in _line) { this.add($this,_line[i],true); }
                if (_noteof) { this.display($this);} else { this.add($this, '\n'); }
            },
            splash  : function($this) {
                var settings = helpers.settings($this), c = helpers.c;
                this.clear($this);
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
            set:  function(_data, _addr, _val)  { return _data.mem[_addr] = _val; },
            getb: function(_data, _addr)        { return _data.mem[_addr]; },
            getw: function(_data, _addr)        { return this.getb(_data,_addr) + (this.getb(_data,_addr + 1) << 8); },
            setb: function(_data, _addr, _val)  { this.set(_data, _addr, _val & 0xff);
                                                  if ((_addr >= helpers.c.offset.screen) && (_addr < helpers.c.offset.code)) { }
                                                  if (_addr== helpers.c.offset.stdout) { helpers.stdout.add(_data, _val); } },
            key:  function(_data, _val)         { this.setb(_data,0, helpers.c.offset.key, _val); },
            rand: function(_data)               { this.set(_data,helpers.c.offset.random, Math.floor(Math.random() * 256)); },
            init: function(_data)               { if (!_data.mem) { _data.mem = new Array(helpers.c.offset.end);} },
            clear:function(_data)               { for (var i = 0; i < helpers.c.offset.code; i++) { this.set(_data,i, 0x00); } }
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
                        var codheader = settings.header[i].code.split(" ");
                        for (var j in codheader) { helpers.compiler.pushb(_data, parseInt(codheader[j],16)); }
                    }
                }

                // SCREEN
                _data.$this.find(".line.x").each(function(_index) {
                    if (_data.compiled) {
                        // PARSE EACH LINE
                        var line = { isempty:true, label:"", op:"", arg:{value:"", type:11}};
                        $(this).find("div").each(function() {
                            if ($(this).hasClass("label")) {
                                if ($(this).hasClass("e")) { line.arg.value=$(this).html(); line.arg.type=12; }
                                else                       { line.label = $(this).html(); }
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
                            if (line.label.length) {
                                var label = labels.get(line.label);
                                label.pos = _data.pc;
                            }
                            else {
                                var opid = -1;
                                for (var i in opcodes) { if (opcodes[i][0]==line.op) { opid=i; } }
                                var opcode = opcodes[opid][line.arg.type], branchabs = false;
                                if (opcode==null && line.arg.type==12) { opcode=opcodes[opid][5]; branchabs = true;}

                                if (opid!=-1 && opcode) {
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
                                            if (branchabs) {
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
                                    else          { error = "("+_index+") "+line.op+" no "+addr[line.arg.type]; }
                                }
                            }
                        }
                    }
                });
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
            init    : function(_data) { _data.reg.A = 0; _data.reg.X = 0; _data.reg.Y = 0; _data.reg.F = 0, 
                                        _data.reg.PC = helpers.c.offset.code, _data.reg.SP=0xFF; },
            display : function(_data) {
                _data.$this.find("#rega .value").html(helpers.c.hex(_data.reg.A, false));
                _data.$this.find("#regx .value").html(helpers.c.hex(_data.reg.X, false));
                _data.$this.find("#regy .value").html(helpers.c.hex(_data.reg.Y, false));
                _data.$this.find("#regs .value").html(helpers.c.hex(_data.reg.SP, false));
                _data.$this.find("#regpc .value").html("0x"+helpers.c.hex(_data.reg.PC, true));
                for (var i=0; i<8; i++) {
                    _data.$this.find("#f"+(7-i)+" .value").html(_data.reg.F&(1<<i)?"1":"0");
                }
            },
            run: function(_data) {
                if (_data.reg.PC<_data.pc) {
                    var i = helpers.c.hex(this.getb(_data),false);
                    if (helpers.process["i"+i]) {
                        helpers.process["i"+i](_data);
                        this.display(_data);
                        setTimeout(function() { helpers.process.run(_data) }, 100);
                    }
                    else { helpers.stdout.line(_data.$this, i+" unknown"); _data.$this.find("#mask").hide(); }
                }
                else {
                    helpers.stdout.line(_data.$this, "Done");
                    helpers.check.process(_data.$this);
                }
            },
            getb: function(_data) { var ret = helpers.memory.getb(_data, _data.reg.PC); _data.reg.PC+=1; return ret; },
            getw: function(_data) { var ret = helpers.memory.getw(_data, _data.reg.PC); _data.reg.PC+=2; return ret; },
            f: {
                nv: function(_data, _value) {
                    if (_value)         { _data.reg.F &= 0xfd; } else { _data.reg.F |= 0x02; }
                    if (_value & 0x80)  { _data.reg.F |= 0x80; } else { _data.reg.F &= 0x7f; }
                },
                a: function(_data) { this.nv(_data, _data.reg.A); },
                x: function(_data) { this.nv(_data, _data.reg.X); },
                y: function(_data) { this.nv(_data, _data.reg.Y); }
            },
            i88: function(_data) { _data.reg.Y = ( _data.reg.Y - 1) & 0xff; this.f.y(_data); },
            i8a: function(_data) { _data.reg.A = _data.reg.X; this.f.a(_data);  },
            i98: function(_data) { _data.reg.A = _data.reg.Y; this.f.a(_data);  },
            ia0: function(_data) { _data.reg.Y = this.getb(_data); this.f.y(_data);  },
            ia2: function(_data) { _data.reg.X = this.getb(_data); this.f.x(_data);  },
            ia5: function(_data) { _data.reg.A = helpers.memory.getb(_data, this.getb(_data)); this.f.a(_data); },
            ia8: function(_data) { _data.reg.Y = _data.reg.A; this.f.y(_data);  },
            ia9: function(_data) { _data.reg.A = this.getb(_data); this.f.a(_data);  },
            iaa: function(_data) { _data.reg.X = _data.reg.A; this.f.x(_data);  },
            ic8: function(_data) { _data.reg.Y = ( _data.reg.Y + 1) & 0xff; this.f.y(_data); },
            ica: function(_data) { _data.reg.X = ( _data.reg.X - 1) & 0xff; this.f.x(_data); },
            ie8: function(_data) { _data.reg.X = ( _data.reg.X + 1) & 0xff; this.f.x(_data); }
        },
        // CHECK THE PROGRAM
        check: {
            process: function($this){
                var settings = helpers.settings($this);
                var success = true;

                $this.find("#check>div").hide();
                $this.find("#check").show();
                for (var i in settings.valid) {
                    if (helpers.check["c"+i]) {
                        var good=helpers.check["c"+i](settings.data, settings.valid[i]);
                        success&=good;
                        if (good) { $this.find("#check #"+i+"good").show(); }
                        else      { $this.find("#check #"+i+"wrong").show(); }
                }}

                if (success) { setTimeout(function(){helpers.end($this);}, 2000); }
                else         { setTimeout(function(){helpers.next($this);},2000); }
            },
            ca : function(_data, _value) { return (_data.reg.A==parseInt(_value,16)); },
            cx : function(_data, _value) { return (_data.reg.X==parseInt(_value,16)); },
            cy : function(_data, _value) { return (_data.reg.Y==parseInt(_value,16)); }
        },
        next: function($this) {
            $this.find("#mask").hide();
            $this.find("#check>div").hide();
            $this.find("#check").hide();
        }
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
                        reg         : { A:0, X:0, Y:0, F:0, PC:0, SP:0 },
                        mem         : 0,
                        pc          : 0
                    }
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
                $this.find("#mask").show();
                settings.context.onQuit({'status':'abort'});
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#mask").hide();
                $this.find("#splash").hide();
            },
            code: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (!settings.data.compiled) { helpers.compiler.process(settings.data); }
                if (settings.data.compiled) {
                    var html="";
                    for (var i=helpers.c.offset.code; i<settings.data.pc; i++){
                        html+=(i%16)?" ":("<p>0x"+helpers.c.hex(i,true)+" ");
                        html+=helpers.c.hex(settings.data.mem[i],false);
                        if (i%16==15) { html+="</p>"; }
                    }
                    $this.find("#binary div").html(html+"</p>");
                    $this.find("#binary").show();
                }
            },
            play: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (!settings.data.compiled) { helpers.compiler.process(settings.data); }
                if (settings.data.compiled) {
                    $this.find("#mask").show();
                    helpers.process.init(settings.data);
                    helpers.process.display(settings.data);
                    helpers.memory.clear(settings.data);
                    helpers.process.run(settings.data);
                }
            }

        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in assembler plugin!'); }
    };
})(jQuery);

