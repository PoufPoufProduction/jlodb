(function($) {
    // Activity default options
    var defaults = {
        name        : "code",                                   // The activity name
        label       : "Code",                                  // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        values      : [],                                       // Specific values
        a           : {                                         // Authorizations
            op      : true,
            va      : true,
            ma      : true,
            cl      : true
        },
        initsc      : [],                                       // Init screen
        debug       : true,                                     // Debug mode
        devmode     : false
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",                  "<b>$1</b>",
        "\\\[bb\\\](.+)\\\[/bb\\\]",                  "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",                  "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[o1\\\]([^\\\[]+)\\\[/o1\\\]",          "<span style='opacity:0.5'>$1</span>",
        "\\\[o2\\\]([^\\\[]+)\\\[/o2\\\]",          "<span style='opacity:0.1'>$1</span>",
        "\\\[svg\\\]([^\\\[]+)\\\[/svg\\\]",        "<div class='svg'><div><svg width='100%' height='100%' viewBox='0 0 32 32'><rect x='0' y='0' width='32' height='32' style='fill:black'/>$1</svg></div></div>",
        "\\\[code\\\](.+)\\\[/code\\\]",            "<div class='cc'>$1</div>",
        "\\\[strong\\\](.+)\\\[/strong\\\]",        "<div class='strong'>$1</div>"
    ];

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
        end: function($this) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this,{'status':'success','score':settings.score});
        },
        format: function(_text) {
            for (var j=0; j<5; j++) for (var i=0; i<regExp.length/2; i++) {
                var vReg = new RegExp(regExp[i*2],"g");
                _text = _text.replace(vReg,regExp[i*2+1]);
            }
            return _text;
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
                
                // HANDLE THE TIPS
                if (settings.tips) {
                    $this.find("#tip>div").html(settings.tips.length);
                    $this.find("#ptip .tip1").addClass("s");
                }

                // Add specific value
                for (var i in settings.values) {
                    $this.find("#ops #va").append("<div class='a va v s c' id='"+i+"'><div class='label'>"+i+"</div></div>");
                }

                for (var i in settings.a) {
                    if (settings.a[i]) {
                        if ($.isArray(settings.a[i])) {
                            for (var elt in settings.a[i]) { $this.find("#ops #"+i+" #"+settings.a[i][elt]+".a").addClass("s"); }
                        }
                        else { $this.find("#ops #"+i+" .a").addClass("s"); }
                    }
                }

                $this.find("#ops .a.s").draggable({ containment:$this, helper:"clone", appendTo:$this.find("#lines")});
                helpers.addline($this,$this.find("#code #lines"));
                
                setTimeout(function() {
                    helpers.screen.init($this);
                }, 100);
                    
                // Locale handling

                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                if ($.isArray(settings.exercice)) {
                    $this.find("#exercice #ex").html("");
                    for (var i in settings.exercice) { $this.find("#exercice #ex").append(
                        "<p>"+(settings.exercice[i].length?helpers.format(settings.exercice[i]):"&#xA0;")+"</p>"); }
                } else { $this.find("#exercice #ex").html(helpers.format(settings.exercice)); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            },
            speed: function($this) {
                var settings = helpers.settings($this);
                var src=["debug","x1","x2","x3"];
                $this.find("#controls #speed img").attr("src","res/img/control/"+src[settings.data.speed]+".svg");
            }
        },
        crc32: function (_data) {
            var table =
                '00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D';

            var crc = 0;
            var x = 0;
            var y = 0;

            crc = crc ^ (-1);
            for (var i = 0, iTop = _data.length; i < iTop; i++) {
                y = (crc ^ _data[i]) & 0xFF;
                x = '0x' + table.substr(y * 9, 8);
                crc = (crc >>> 8) ^ x;
            }

            return crc ^ (-1);
        },
        // HANDLE THE STDOUT
        stdout: {
            clear   : function($this) { var settings = helpers.settings($this);
                                        settings.stdout.lines = ["","","","","","",""]; settings.stdout.pos = 0; this.display($this); },
            display : function($this) { $this.find("pre").html(this.export($this)); },
            add     : function($this, _char) {
                var settings = helpers.settings($this);
                if (settings.stdout.pos<7 && settings.stdout.lines[settings.stdout.pos].length>=19) { settings.stdout.pos++; }
                if (_char=='\n')                { settings.stdout.pos++; }
                if (settings.stdout.pos==7)     { for (var i=0; i<6; i++) { settings.stdout.lines[i]=settings.stdout.lines[i+1]; }
                                                  settings.stdout.lines[6]=""; settings.stdout.pos=6; }
                if (_char!='\n')                { settings.stdout.lines[settings.stdout.pos]+=_char; }
                this.display($this);
            },
            ascii   : function($this, _ascii) {
                this.add($this, (_ascii==10||(_ascii>=32&&_ascii<127))?String.fromCharCode(_ascii):"."); },
            print   : function($this, _value) {
                if (typeof(_value)=="number") { this.ascii($this, _value); } else
                if (typeof(_value)=="string" && _value.length==1 )  { this.ascii($this, _value.charCodeAt()); } else
                {
                    for (var i=0; i<_value.length; i++) {
                        this.print($this, _value[i]);
                        if (typeof(_value)=="object") { this.ascii($this,32); }
                    }
                }
            },
            dumpn : function($this, _value) {
                var value = _value.toString();
                for (var i=0; i<value.length; i++) { this.add($this, value[i].toString()); }
                this.add($this, ' ');
            },
            dump    : function($this, _value) {
                if (typeof(_value)=="number") { this.dumpn($this, _value); } else
                if (typeof(_value)=="string" && _value.length==1 )  { this.dumpn($this, _value.charCodeAt()); } else
                {
                    for (var i=0; i<_value.length; i++) { this.dump($this, _value[i]); }
                }
            },
            export  : function($this) {
                var settings = helpers.settings($this);
                return settings.stdout.lines[0]+'\n'+settings.stdout.lines[1]+'\n'+settings.stdout.lines[2]+'\n'+
                       settings.stdout.lines[3]+'\n'+settings.stdout.lines[4]+'\n'+settings.stdout.lines[5]+'\n'+
                       settings.stdout.lines[6];
            },
            get : function($this) { var settings = helpers.settings($this); return settings.stdout.lines[settings.stdout.pos]; },
            crc32: function($this) {
                var settings = helpers.settings($this);
                var val=[], ret = 0;
                for (var i=0; i<7; i++) for (var j=0; j<19; j++) {
                    val.push((settings.stdout.lines && settings.stdout.lines[i] && j<settings.stdout.lines[i].length)?
                                settings.stdout.lines[i].charCodeAt(j):0); }
                return helpers.crc32(val);
            }
        },
        screen: {
            init: function($this) {
                var settings = helpers.settings($this);
                
                settings.screen.s = 640/settings.screen.model[0];
                settings.screen.h = settings.screen.model[1]*settings.screen.s;
                
                var elt=$this.find("#canvas svg");
                elt.svg();
                settings.screen.svg = elt.svg('get');
                settings.screen.g = settings.screen.svg.group();
                this.clear($this);
            },
            clear: function($this) {
                var settings = helpers.settings($this);
                $("rect",settings.screen.g).detach();
                settings.screen.svg.rect( settings.screen.g,0,0,640,settings.screen.h,{fill:"black"});
                settings.screen.data=[];
                for (var i=0; i<settings.screen.model[0]*settings.screen.model[1]*3; i++) { settings.screen.data.push(0); }
                
                for (var i in settings.initsc) {
                    var ii = settings.initsc[i];
                    if (ii.coord.length==3) { helpers.screen[ii.svg]($this, ii.coord[0], ii.coord[1], ii.coord[2], ii.rgb); }
                    else { helpers.screen[ii.svg]($this, ii.coord[0], ii.coord[1], ii.coord[2], ii.coord[3], ii.rgb); }
                }

            },
            pixel: function($this, _i, _j, _color) {
                var settings = helpers.settings($this);
                var color = "rgb("+_color[0]+","+_color[1]+","+_color[2]+")";
                for (var i=0; i<3; i++) {    
                    settings.screen.data[(_i+_j*settings.screen.model[0])*3+i] = _color[i];
                }
                settings.screen.svg.rect( settings.screen.g,
                        _i*settings.screen.s,_j*settings.screen.s,settings.screen.s+1,settings.screen.s+1,{fill:color});
            },
            circle: function($this, _i, _j, _r, _color) {
                var settings = helpers.settings($this);
                for (var i=Math.max(0,_i-_r); i<Math.min(settings.screen.model[0],_i+_r+1); i++)
                for (var j=Math.max(0,_j-_r); j<Math.min(settings.screen.model[1],_j+_r+1); j++) {
                    if ((i-_i)*(i-_i)+(j-_j)*(j-_j)<(_r+1)*(_r+1)) { this.pixel($this,i,j,_color); }
                }
            },
            rect: function($this, _i, _j, _w, _h, _color) {
                var settings = helpers.settings($this);
                
                for (var i=Math.max(0,_i); i<Math.min(settings.screen.model[0],_i+_w); i++)
                for (var j=Math.max(0,_j); j<Math.min(settings.screen.model[1],_j+_h); j++) {
                    this.pixel($this,i,j,_color);
                }
            },
            line: function($this, _x1, _y1, _x2, _y2, _color) {
                var settings = helpers.settings($this);
                var vRatio = (_y1==_y2)?10000:(_x1-_x2)/(_y1-_y2);
                if (Math.abs(vRatio)>1) {
                    for (var i=Math.min(_x1,_x2); i<=Math.max(_x1,_x2); i++) {
                        this.pixel($this,i,Math.round((_x1<_x2?_y1:_y2)+(i-Math.min(_x1,_x2))/vRatio),_color);
                    }
                }
                else {
                    for (var j=Math.min(_y1,_y2); j<=Math.max(_y1,_y2); j++) {
                        this.pixel($this,Math.round((_y1<_y2?_x1:_x2)+(j-Math.min(_y1,_y2))*vRatio),j,_color);
                    }
                }
            },
            draw: function($this, _spr, _i, _j, _w, _h) {
                var settings = helpers.settings($this);
                for (var j=0; j<_h; j++) {
                for (var i=0; i<_w; i++) {
                    var color = [_spr[(i+j*_w)*3+0],_spr[(i+j*_w)*3+1],_spr[(i+j*_w)*3+2]];
                    this.pixel($this,(_i+i),(_j+j),color);
                }}
            },
            crc32: function($this) {
                var settings = helpers.settings($this);
                return helpers.crc32(settings.screen.data);
            }
        },
        dropvalue: function($this, $e) {
            var settings = helpers.settings($this);
            $e.find(".d.va").droppable({greedy:true, accept:".v",
                over: function(event, ui) {
                    $(this).addClass("over");
                },
                out: function(event, ui) {
                    $(this).removeClass("over");
                },
                drop:function(event, ui) {
                  $this.find(".over").removeClass("over");
                  if ($(this).offset().top>=$this.find("#code").offset().top)
                  {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                    event.originalEvent.touches[0]:event;
                    var $elt = $(ui.draggable).clone().addClass("cc");
                    $(this).html($elt);
                    helpers.dropvalue($this, $elt);

                    var x           = event.clientX-$this.offset().left;
                    var y           = event.clientY-$this.offset().top;
                    var $old        = $this.find("#touch01>div").detach();
                    var $new        = $old.clone();
                    $this.find("#touch01").css("left",Math.floor(x - $this.find("#touch01").width()/2)+"px")
                                          .css("top",Math.floor(y - $this.find("#touch01").height()/2)+"px")
                                          .append($new.addClass("running")).show();
                    setTimeout(function(){$this.find("#touch01>div").removeClass("running").parent().hide(); },800);
                  }
            }});
        },
        addline: function($this, $elt, $_line) {
            var settings = helpers.settings($this);

            var $html=$_line?$_line:$("<div class='line' id='"+(settings.codeid++)+"'></div>");
            $html.droppable({greedy:true, accept:".o",
                drop:function(event, ui) {
                  if ($(this).offset().top>=$this.find("#code").offset().top)
                  {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                    event.originalEvent.touches[0]:event;
                    var $e = $(ui.draggable).clone().addClass("cc").css("opacity",1);
                    var ok = !($(this).parent().hasClass("op") && $e.attr("id").substr(0,3)=="fct");
                    if (ok) {
                        $(this).html($e);
                        var x           = event.clientX-$this.offset().left;
                        var y           = event.clientY-$this.offset().top;
                        var $old        = $this.find("#touch01>div").detach();
                        var $new        = $old.clone();
                        $this.find("#touch01").css("left",Math.floor(x - $this.find("#touch01").width()/2)+"px")
                                              .css("top",Math.floor(y - $this.find("#touch01").height()/2)+"px")
                                              .append($new.addClass("running")).show();
                        setTimeout(function(){$this.find("#touch01>div").removeClass("running").parent().hide(); },800);

                        $this.find("#code").scrollTop(500);

                        // HANDLE LINES
                        var $last = $(this).parent().find(">.line").last();
                        if ($last.html().length) { helpers.addline($this, $(this).parent()); }

                        // MAKE THE NEW OPERATION DRAGGABLE
                        $e.draggable({ containment:$this, helper:"clone", appendTo:$this.find("#code #lines"),
                            start:function( event, ui) { ui.helper.removeClass("cc"); $e.css("opacity",0.2);},
                            stop: function( event, ui) { $(this).detach(); } });

                        // HANDLE ARGUMENTS
                        helpers.dropvalue($this, $e);

                        // HANDLE FUNCTION
                        // AS IT MAY HAVE BEEN CLONED, MAKE THE LINES DROPPABLE ONCE AGAIN
                        $e.find(".line").each(function() { helpers.addline($this,0,$(this)); });
                        // BUILD A NEW LINE IF NECESSARY
                        $e.find(".d.op").each(function() {
                            var $line = $(this).find(".line");
                            if (!$line.length || $line.html().length) { helpers.addline($this, $(this)); }
                        });
                    }
                  }
            }});
            if (!$_line) { $elt.append($html); }
        },
        process: {
            value: {
                // $elt IS THE DROPPABLE ZONE
                get: function($this, $elt, _complex) {
                    var settings = helpers.settings($this);
                    var ret = 0;
                    if ($elt.html().length) {
                        var $current = $elt.children().first();
                        var $first = $current.find(".d.va").first();
                        if ($current.hasClass("ma")) {
                          switch($current.attr("id")) {
                            case "plus":    ret = this.get($this, $first) + this.get($this, $first.next().next());      break;
                            case "minus":   ret = this.get($this, $first) - this.get($this, $first.next().next());      break;
                            case "mult":    ret = this.get($this, $first) * this.get($this, $first.next().next());      break;
                            case "div":     ret = this.get($this, $first) / this.get($this, $first.next().next());      break;
                            case "modulo":  ret = this.get($this, $first) % this.get($this, $first.next().next());      break;
                            case "lt":      ret =(this.get($this, $first) < this.get($this, $first.next().next()))?1:0; break;
                            case "gt":      ret =(this.get($this, $first) > this.get($this, $first.next().next()))?1:0; break;
                            case "lte":     ret =(this.get($this, $first)<= this.get($this, $first.next().next()))?1:0; break;
                            case "gte":     ret =(this.get($this, $first)>= this.get($this, $first.next().next()))?1:0; break;
                            case "eq":      ret =(this.get($this, $first)== this.get($this, $first.next().next()))?1:0; break;
                            case "neq":     ret =(this.get($this, $first)!= this.get($this, $first.next().next()))?1:0; break;
                            case "or":      ret = this.get($this, $first) | this.get($this, $first.next().next());      break;
                            case "and":     ret = this.get($this, $first) & this.get($this, $first.next().next());      break;
                            case "neg":     ret = - this.get($this, $first);                        break;
                            case "pow2":    ret = Math.pow(this.get($this, $first),2);              break;
                            case "cos":     ret = Math.cos(Math.PI*this.get($this, $first)/180);    break;
                            case "sin":     ret = Math.sin(Math.PI*this.get($this, $first)/180);    break;
                            case "tan":     ret = Math.tan(Math.PI*this.get($this, $first)/180);    break;
                            case "floor":   ret = Math.floor(this.get($this, $first));              break;
                            case "ceil":    ret = Math.ceil(this.get($this, $first));               break;
                            case "round":   ret = Math.round(this.get($this, $first));              break;
                            case "sqrt":    ret = Math.sqrt(this.get($this, $first));               break;
                            case "log":     ret = Math.log(this.get($this, $first));                break;
                            case "exp":     ret = Math.exp(this.get($this, $first));                break;
                            case "atan":    ret = 180*Math.atan(this.get($this, $first))/Math.PI;   break;
                            case "color":
                                ret = [ settings.data.color[0], settings.data.color[1], settings.data.color[2] ];
                                break;
                            case "read":
                                ret = settings.data.lastkey;
                                settings.data.lastkey = 0;
                                if (ret) {
                                    settings.sav.stdout.push(helpers.stdout.crc32($this));
                                    settings.sav.screen.push(helpers.screen.crc32($this));
                                }
                                break;
                            case "len":
                                var val = this.get($this, $first, true);
                                ret = (typeof(val)=="number")?1:val.length;
                                break;
                            case "get":
                                var val = this.get($this, $first, true);
                                var id = this.get($this, $first.next());
                                ret = 0;
                                if (typeof(val)!="number" && id<val.length) {
                                    if (typeof(val)=="string") { ret = val[id].charCodeAt(); } else { ret = val[id]; }
                                }
                                break;
                            case "find":
                                var val= this.get($this, $first, true);
                                var id = this.get($this, $first.next());
                                ret = -1;
                                if (typeof(val)!="number") {
                                    for (var i=0; i<val.length; i++) {
                                        if (typeof(val[i])=="number" || val[i].length == 1) {
                                            var v = val[i]; if (typeof(v)!="number") { v = v.charCodeAt(); }
                                            if (ret==-1 && v==id) { ret = i; }
                                        }
                                    }
                                }
                                break;
                            case "sub":
                                var val= this.get($this, $first, true);
                                var pos = this.get($this, $first.next());
                                var len = this.get($this,$first.next().next());
                                ret = 0;
                                if (typeof(val)=="string") { ret = val.substr(pos, len); }
                                break;
                            case "sub2":
                                var val= this.get($this, $first, true);
                                var pos = this.get($this, $first.next());
                                ret = 0;
                                if (typeof(val)=="string") { ret = val.substr(pos); }
                                break;
                          }
                        }
                        else {
                            if ($current.attr("id") && $current.attr("id").length && $current.attr("id")[0]!='V') {

                                if (settings.values && settings.values[$current.text()]) {
                                    ret = settings.values[$current.text()];
                                }
                                else {
                                    switch($current.attr("id")) {
                                        case "R" : case "G"  : case "B" :
                                        case "I" : case "J"  : case "K" :
                                        case "X" : case "Y"  : case "Z" :
                                            ret = settings.data[$current.text()]; break;
                                        case "TRUE"     : ret = 1;          break;
                                        case "FALSE"    : ret = 0;          break;
                                        case "PI"       : ret = Math.PI;    break;
                                        case "UP"       : ret = 38;         break;
                                        case "DOWN"     : ret = 40;         break;
                                        case "LEFT"     : ret = 39;         break;
                                        case "RIGHT"    : ret = 37;         break;
                                    }
                                }
                            }
                            else {
                                ret = parseInt($current.text());
                                if (isNaN(ret) || $current.hasClass("char")) { ret = $current.text().charCodeAt(); }
                            }
                        }
                    }
                    if (!_complex && typeof(ret)!="number") { ret = 0; }
                    return ret;
                }
            },
            draw: function($this, $elt) {
                helpers.screen.draw( $this, helpers.process.value.get($this, $elt.find(".d.va").first(),true),
                        Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first().next())),
                        Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first().next().next())),
                        Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first().next().next().next())),
                        Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first().next().next().next().next())));
                return true;
            },
            dump: function($this, $elt) {
                var settings = helpers.settings($this);
                helpers.stdout.dump($this, helpers.process.value.get($this, $elt.find(".d.va").first(), true ));
                return true;
            },
            else: function($this, $elt) {
                var settings = helpers.settings($this);
                var value = helpers.process.value.get($this, $elt.find(".d.va").first());
                if (value!=0) {
                    settings.data.stack.push({$elt:$elt.find(".d.op").first().children().first(),
                                              $first:$elt.find(".d.op").first().children().first(),
                                              count:1, sav:0 });
                }
                else {
                    settings.data.stack.push({$elt:$elt.find(".d.op").last().children().first(),
                                              $first:$elt.find(".d.op").last().children().first(),
                                              count:1, sav:0 });
                }
                return false;
            },
            if: function($this, $elt) {
                var settings = helpers.settings($this);
                var value = helpers.process.value.get($this, $elt.find(".d.va").first());
                var ret = (value!=0);
                if (ret) {
                    settings.data.stack.push({$elt:$elt.find(".d.op").children().first(),
                                              $first:$elt.find(".d.op").children().first(),
                                              count:1, sav:0 });
                }
                return !ret;
            },
            pixel: function($this, $elt) {
                var settings = helpers.settings($this);
                helpers.screen.pixel( $this, helpers.process.value.get($this, $elt.find(".d.va").first())%settings.screen.model[0],
                                              helpers.process.value.get($this, $elt.find(".d.va").first().next())%settings.screen.model[1], settings.data.color );
                return true;
            },
            print: function($this, $elt) {
                var settings = helpers.settings($this);
                helpers.stdout.print($this, helpers.process.value.get($this, $elt.find(".d.va").first(), true) );
                return true;
            },
            circle: function($this, $elt) {
                var settings = helpers.settings($this);
                helpers.screen.circle( $this, Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first())),
                        Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first().next())),
                        Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first().next().next())), settings.data.color);
                return true;
            },
            rect: function($this, $elt) {
                var settings = helpers.settings($this);
                helpers.screen.rect( $this, Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first())),
                        Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first().next())),
                        Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first().next().next())),
                        Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first().next().next().next())), settings.data.color);
                return true;
            },
            line: function($this, $elt) {
                var settings = helpers.settings($this);
                helpers.screen.line( $this, Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first())),
                        Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first().next())),
                        Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first().next().next())),
                        Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first().next().next().next())),settings.data.color);
                return true;
            },
            call1: function($this, $elt) {
                var settings = helpers.settings($this);
                var ret = ($this.find("#code #fct1").length==1);
                if (ret) {
                    settings.data.stack.push({$elt:$this.find("#code #fct1 .d.op").children().first(),
                                              $first:0, count:0, sav:{X:settings.data.X, Y:settings.data.Y, Z:settings.data.Z,
                                                                      R:settings.data.R, G:settings.data.G, B:settings.data.B } });
                    helpers.initvar($this,false);
                }
                return !ret;
            },
            call2: function($this, $elt) {
                var settings = helpers.settings($this);
                var ret = ($this.find("#code #fct2").length==1);
                if (ret) {
                    var valueX = helpers.process.value.get($this, $elt.find(".d.va").first(), true);
                    settings.data.stack.push({$elt:$this.find("#code #fct2 .d.op").children().first(),
                                              $first:0, count:0, sav:{X:settings.data.X, Y:settings.data.Y, Z:settings.data.Z,
                                                                      R:settings.data.R, G:settings.data.G, B:settings.data.B } });
                    helpers.initvar($this,false);
                    settings.data.X = valueX;
                }
                return !ret;
            },
            call3: function($this, $elt) {
                var settings = helpers.settings($this);
                var ret = ($this.find("#code #fct3").length==1);
                if (ret) {
                    var valueX = helpers.process.value.get($this, $elt.find(".d.va").first(), true);
                    var valueY = helpers.process.value.get($this, $elt.find(".d.va").first().next(), true);
                    settings.data.stack.push({$elt:$this.find("#code #fct3 .d.op").children().first(),
                                              $first:0, count:0, sav:{X:settings.data.X, Y:settings.data.Y, Z:settings.data.Z,
                                                                      R:settings.data.R, G:settings.data.G, B:settings.data.B } });
                    helpers.initvar($this,false);
                    settings.data.X = valueX;
                    settings.data.Y = valueY;
                }
                return !ret;
            },
            rep: function($this, $elt) {
                var settings = helpers.settings($this);
                var value = Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first()));
                var ret = (value>0);
                if (ret) {
                    settings.data.stack.push({$elt:$elt.find(".d.op").children().first(),
                                              $first:$elt.find(".d.op").children().first(),
                                              count:value, sav:0 });
                }
                return !ret;
            },
            rgb: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.color = [ Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first()))%256,
                                        Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first().next()))%256,
                                        Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first().next().next()))%256 ];
                return true;
            },
            pick: function($this, $elt) {
                var settings = helpers.settings($this);
                var pos = 3 * ( helpers.process.value.get($this, $elt.find(".d.va").first()) +
                            helpers.process.value.get($this, $elt.find(".d.va").first().next()) * settings.screen.model[0]);
                
                settings.data.color=[settings.screen.data[pos],settings.screen.data[pos+1],settings.screen.data[pos+2]];
                return true;
            },
            xx: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.X = helpers.process.value.get($this, $elt.find(".d.va").first(), true);
                return true;
            },
            yy: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.Y = helpers.process.value.get($this, $elt.find(".d.va").first(), true);
                return true;
            },
            zz: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.Z = helpers.process.value.get($this, $elt.find(".d.va").first(), true);
                return true;
            },
            ii: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.I = helpers.process.value.get($this, $elt.find(".d.va").first(), true);
                return true;
            },
            jj: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.J = helpers.process.value.get($this, $elt.find(".d.va").first(), true);
                return true;
            },
            kk: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.K = helpers.process.value.get($this, $elt.find(".d.va").first(), true);
                return true;
            },
            rr: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.R = helpers.process.value.get($this, $elt.find(".d.va").first(), true);
                return true;
            },
            gg: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.G = helpers.process.value.get($this, $elt.find(".d.va").first(), true);
                return true;
            },
            bb: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.B = helpers.process.value.get($this, $elt.find(".d.va").first(), true);
                return true;
            }
        },
        initvar: function($this, _global) {
            var settings = helpers.settings($this);
            settings.data.X = 99; settings.data.Y = 98; settings.data.Z = 97;
            if (_global) { settings.data.I = 57; settings.data.J = 58; settings.data.K = 59; }
            settings.data.R = 63; settings.data.G = 62; settings.data.B = 61;
        },
        init: function($this) {
            var settings = helpers.settings($this);
            helpers.initvar($this,true);
            settings.data.count = 0;
            settings.data.timer = 0;
            settings.data.lastkey = 0;
            settings.data.stack=[{$elt:$this.find("#code #lines").children().first(), $first:0, count:1, sav:0}];
            settings.data.color = [255,255,255];
            helpers.screen.clear($this);
            helpers.stdout.clear($this);
            settings.sav.stdout = [];
            settings.sav.screen = [];
            $this.find("#code #lines .line").removeClass("s");
            $this.find("#mask").show();
        },
        popstack: function($this) {
            var settings = helpers.settings($this);
            var current = settings.data.stack[settings.data.stack.length-1];
            if (current.sav) {
                        settings.data.X = current.sav.X;
                        settings.data.Y = current.sav.Y;
                        settings.data.Z = current.sav.Z;
            }
            settings.data.stack.pop();
            if (settings.data.stack.length) {
                settings.data.stack[settings.data.stack.length-1].$elt =
                            settings.data.stack[settings.data.stack.length-1].$elt.next();
            }
        },
        run: function($this) {
            var settings = helpers.settings($this);
            var debug = (settings.data.speed==0);
            var speed = 3-settings.data.speed;
            var donotstop;
            speed = 200*speed*speed;

            do {
                donotstop = false;
                settings.data.count++;

                if (settings.data.stack.length>=50) {
                    setTimeout(function() { helpers.finish($this, false); }, 1000);
                    return;
                }

                if (speed) {  $this.find("#code #lines .line").removeClass("s"); }

                if (settings.data.stack.length) {
                    var current = settings.data.stack[settings.data.stack.length-1];

                    if (current.$elt.length) {
                        if (speed) { current.$elt.addClass("s"); }

                        var op   = current.$elt.children().first().attr("id");
                        var next = true;
                        if (op && helpers.process[op]) { next = helpers.process[op]($this, current.$elt.children().first()); }
                        if (next) { settings.data.stack[settings.data.stack.length-1].$elt = current.$elt.next(); }
                    }
                    else {
                        if (--current.count>0) { current.$elt = current.$first; }
                        else                   { helpers.popstack($this); }
                    }

                        if (debug || settings.data.paused) { $this.find("#controls #play img").attr("src","res/img/control/play.svg"); }
                        else {
                            if (speed) { settings.data.timer = setTimeout(function() { helpers.run($this); }, speed); }
                            else {
                                if (settings.data.count%97) { donotstop = true; }
                                else                        { settings.data.timer = setTimeout(function() { helpers.run($this); }, 0); }
                            }
                        }
                }
                else { setTimeout(function() { helpers.finish($this, false); }, 1000); return; }
            } while (donotstop);
        },
        finish: function($this, _stopped) {
            var settings = helpers.settings($this);
            $this.find("#mask").hide();
            $this.find("#controls").removeClass("running");
            $this.find("#controls #play img").attr("src","res/img/control/play.svg");
            settings.data.running = false;
            settings.data.paused = false;
            var good = false;

            settings.sav.stdout.push(helpers.stdout.crc32($this));
            settings.sav.screen.push(helpers.screen.crc32($this));

            if (settings.devmode) {
                alert("\"valid\":{"+
                    "\"screen\":"+ (settings.sav.screen.length==1?settings.sav.screen[0]:"["+settings.sav.screen+"]")+
                     ",\"stdout\":"+(settings.sav.stdout.length==1?settings.sav.stdout[0]:"["+settings.sav.stdout+"]")+"}");
            }
            else if (!_stopped) {
                good = true;
                if (settings.valid.stdout)          {
                    if ($.isArray(settings.valid.stdout)) {
                        alert("stdout TODO");
                    }
                    else { good &= (helpers.stdout.crc32($this)==settings.valid.stdout); }
                }
                if (good && settings.valid.screen)  {
                    if ($.isArray(settings.valid.screen)) {
                        alert("screen TODO");
                    }
                    else { good &= (helpers.screen.crc32($this)==settings.valid.screen); }
                }
            }

            $this.find("#effects>div").hide();
            $this.find("#it .it").hide();
            if (good) {
                $this.find("#it #itgood").show();
                $this.find("#effects #good").show();
                $this.find("#it>div").css("left","110%").animate({left:"30%"},500, function() {
                    $this.find("#continue").show();
                }).parent().show();
                settings.interactive = false;
            }
            else {
                $this.find("#it #itwrong").show();
                $this.find("#effects #wrong").show();
                
                $this.find("#it>div").css("left","110%").animate({left:"30%"},500, function() {
                    var stdout = helpers.stdout.crc32($this);
                    var screen = helpers.screen.crc32($this);
                    var helpid = -1;
                    if (settings.help) for (var i in settings.help) {
                        var help = settings.help[i], stdoutok = false, screenok=false;
                        if (help.stdout) {
                            if ($.isArray(help.stdout)) {
                                for (var j in help.stdout) { if (help.stdout[j] == stdout) { stdoutok = true; }}
                            }
                            else if (help.stdout == stdout) { stdoutok = true; }
                        }
                        else { stdoutok = true; }

                        if (help.screen) {
                            if ($.isArray(help.screen)) {
                                for (var j in help.screen) { if (help.screen[j] == screen) { screenok = true; }}
                            }
                            else if (help.screen == screen) { screenok = true; }
                        }
                        else { screenok = true; }

                        if (stdoutok && screenok) { helpid = i; }
                    }
                    if (helpid!=-1) {
                        $this.find("#dialog>div").html(helpers.format(settings.help[helpid].dialog)).parent().show();
                        $this.find("#continue").show();
                    }
                    else {
                        setTimeout(function(){
                            $this.find("#it>div").animate({left:"110%"},500,function() {
                                $(this).parent().hide(); });
                            helpers.clean($this);
                        },1500);
                    }
                    
                }).parent().show();
                
                
            }
            $this.find("#effects").show();
        },
        clean: function($this) {
            var settings = helpers.settings($this);
            $this.find("#effects").hide();
            $this.find("#effects #wrong").hide();
            $this.find("#continue").hide();
            $this.find("#dialog>div").html("").parent().hide();
            $this.find("#code #lines .line").removeClass("s");

        },
        key:function($this, _value) {
            var settings = helpers.settings($this);
            var buttons = { "v37":"left", "v38":"up", "v39":"right", "v40":"down", "v65":"a", "v66":"b" };
            var b=buttons["v"+_value];
            if (b) {
                settings.data.lastkey = _value;
                
                $this.find("#keypad .s").removeClass("s"); 
                $this.find("#keypad #"+b).addClass("s");
                if (settings.keytimerid) { clearTimeout(settings.keytimerid); }
                settings.keytimerid = setTimeout(function() { $this.find("#keypad .s").removeClass("s"); }, 300 );
            }
        }   
    };

    // The plugin
    $.fn.code = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive    : false,
                    codeid          : 0,
                    stdout          : { lines   :[],        pos : 0 },
                    screen          : { model   : [32,32],  p   : 1 },
                    sav             : { stdout  :[],        screen:[]},
                    score           : 5,
                    keytimerid      : 0,
                    tipid           : 0,
                    data : {
                        running     : false,
                        paused      : false,
                        speed       : 2,
                        count       : 0,
                        timer       : 0,
                        lastkey     : 0,
                        I:0, J:0,
                        X:0, Y:0, Z:0,
                        color       : [255,255,255],
                        stack       : []
                    }
                };

                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);
                    $(document).keydown(function(_e) { if (_e.which!=116) { helpers.key($this, _e.which); _e.preventDefault(); } });

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
            click: function(_key) {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.key($this, _key);

            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
            },
            tab: function(_elt, _id) {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#source #ops .tab").hide();
                $this.find("#source #ops #"+_id).show();
                $this.find("#source #tabs .icon").removeClass("s");
                $(_elt).addClass("s");
            },
            play: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    if (settings.data.running) {
                        if (settings.data.speed==0 || settings.data.paused ) {
                            settings.data.paused = false;
                            $this.find("#controls #play img").attr("src","res/img/control/pause.svg");
                            helpers.run($this);
                        }
                        else {
                            settings.data.paused = true;
                        }
                    }
                    else {
                        $this.find(".mask").show();
                        $this.find("#controls").addClass("running");
                        $this.find("#controls #play img").attr("src","res/img/control/pause.svg");
                        settings.data.running = true;
                        settings.data.paused = false;
                        helpers.init($this);
                        setTimeout(function(){ helpers.run($this);}, 200);
                    }
                }
            },
            speed: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    if (settings.data.running && settings.data.speed==0 ) { settings.data.paused = true; }
                    if (settings.data.running && settings.data.speed==2 ) { $this.find(".line").removeClass("c"); }

                    settings.data.speed = (settings.data.speed+1)%4;
                    helpers.loader.speed($this);
                }
            },
            stop: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    var $this = $(this) , settings = helpers.settings($this);
                    if (settings.data.running) {
                        if (settings.data.timer) { clearTimeout(settings.data.timer); settings.data.timer = 0; }
                        helpers.finish($this, true);
                    }
                }
            },
            cont: function() {
                var $this = $(this) , settings = helpers.settings($this);
                
                helpers.clean($this);
                $this.find("#it>div").animate({left:"110%"},1000,function() { 
                    $(this).parent().hide();
                    if (!settings.interactive) { helpers.end($this); }
                });
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = false;
                $this.find("#mask").show();
                settings.context.onquit($this,{'status':'abort'});
            },
            stdout: function() {
                var $this = $(this) , settings = helpers.settings($this);
                console.log(helpers.stdout.crc32($this));
            },
            screen: function() {
                var $this = $(this) , settings = helpers.settings($this);
                console.log(helpers.screen.crc32($this));
            },
            tip: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.tipid<settings.tips.length) {
                    $this.find("#ptip .tip"+(settings.tipid+1)).removeClass("s").addClass("f")
                         .find(".content").html(helpers.format(settings.tips[settings.tipid]));
                         
                    settings.tipid++;
                    $this.find("#tip>div").html(settings.tips.length-settings.tipid);
                    if (settings.tipid<settings.tips.length) { $this.find("#ptip .tip"+(settings.tipid+1)).addClass("s"); }
                    $this.find("#tipconfirm").hide();
                    $this.find("#tippopup").css("opacity",1).show()
                         .animate({opacity:0},1000,function() { $(this).hide(); });
                    settings.wrong++;
                }
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in code plugin!'); }
    };
})(jQuery);

