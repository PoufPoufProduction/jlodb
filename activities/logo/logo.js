(function($) {
    // Activity default options
    var defaults = {
        name        : "logo",                                   // The activity name
        label       : "logo",                                   // The activity label
        template    : "template.html",                          // Activity's html template
        url         : "desktop/logo.svg",                       // The initial svg filename
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        a           : {                                         // Authorizations
            op      : true,
            va      : true,
            ma      : true,
            cl      : true
        },
        dev         : false,
        debug       : true                                      // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
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
            for (var j=0; j<2; j++) for (var i=0; i<regExp.length/2; i++) {
                var vReg = new RegExp(regExp[i*2],"g");
                _text = _text.replace(vReg,regExp[i*2+1]);
            }
            return _text;
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
        round: function(_val) { return Math.round(_val*100)/100; },
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
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.svg($this); });
            },
            svg:function($this) {
                var settings = helpers.settings($this), debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }
                var elt= $this.find("#board");
                elt.svg();
                settings.svg = elt.svg('get');
                settings.svg.load( 'res/img/'+settings.url + debug,
                    { addTo: true, changeSize: true, onLoad:function() { helpers.loader.build($this); }
                });
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

                // LOCALE HANDLING
                if ($.isArray(settings.exercice)) {
                    $this.find("#exercice>div").html("");
                    for (var i in settings.exercice) { $this.find("#exercice>div").append(
                        "<p>"+(settings.exercice[i].length?helpers.format(settings.exercice[i]):"&#xA0;")+"</p>"); }
                } else { $this.find("#exercice>div").html(helpers.format(settings.exercice)); }
                $.each(settings.locale.source, function(id,value) { $this.find("#"+id+" .label").html(value); $this.find("#h"+id+" .label").html(value);});
                $.each(settings.locale, function(id,value) { if (typeof(value)=="string") {$this.find("#"+id).html(helpers.format(value)); }});

                for (var i in settings.a) {
                    if (settings.a[i]) {
                        if ($.isArray(settings.a[i])) {
                            for (var elt in settings.a[i]) { $this.find("#panels #"+i+" #"+settings.a[i][elt]+".a").addClass("s"); }
                        }
                        else { $this.find("#panels #"+i+" .a").addClass("s"); }
                    }
                }

                $this.find(".a.s").draggable({ containment:$this, helper:"clone", appendTo:$this.find("#code #lines")});
                helpers.addline($this,$this.find("#code #lines"));

                for (var i in settings.bg) {
                    var $clone = $("#background #"+settings.bg[i].type+".hide", settings.svg.root()).clone();
                    $clone.attr("id","bg"+i).attr("class","");
                    for (var j in settings.bg[i].attr) { $clone.attr(j, settings.bg[i].attr[j]); }
                    if (settings.bg[i].type=="text") { $clone.text(settings.bg[i].text); }
                    $clone.appendTo($("#background", settings.svg.root()));
                }

                if (settings.dev) { $this.find("#devmode").show(); }

                if ($.isArray(settings.locale.guide)) {
                    $this.find("#guide").html("");
                    for (var i in settings.locale.guide) { $this.find("#guide").append("<p>"+settings.locale.guide[i]+"</p>"); }
                }
                else { $this.find("#guide").html(settings.locale.guide); }
                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            },
            speed: function($this) {
                var settings = helpers.settings($this);
                var src=["debug","x1","x2","x3"];
                $this.find("#controls #speed img").attr("src","res/img/control/"+src[settings.data.speed]+".svg");
            }
        },
        screen: function($this) {
            var settings = helpers.settings($this);
            var data = [];
            $("#board line", settings.svg.root()).each(function(_index) {
                if ($(this).attr("class")!="hide") {
                    data.push([
                        helpers.round(parseFloat($(this).attr("x1"))),
                        helpers.round(parseFloat($(this).attr("y1"))),
                        helpers.round(parseFloat($(this).attr("x2"))),
                        helpers.round(parseFloat($(this).attr("y2")))]);
                }
            });
            
            for (var i in data) {
                var d=data[i];
                if (d[0]>d[2] || (d[0]==d[2] && d[1]>d[3])) { data[i] = [d[2],d[3],d[0],d[1]]; }
            }
            data.sort(function(a,b) {
                var dd=[a[0]-b[0], a[1]-b[1], a[2]-b[2], a[3]-b[3]];
                return  ( dd[0]>0 ||
                        ( dd[0]==0 && dd[1]>0) ||
                        ( dd[0]==0 && dd[1]==0 && dd[2]>0) ||
                        ( dd[0]==0 && dd[1]==0 && dd[2]==0 && dd[3]>0) ); } );
            var strtmp="";
            for (var i in data) {
                if (strtmp.length) { strtmp+=" "; }
                strtmp+=data[i][0]+","+data[i][1]+","+data[i][2]+","+data[i][3]; }
            console.log(strtmp);
            var crc=helpers.crc32(strtmp);
            console.log("crc: "+crc);
            return crc;
        },
        dropvalue: function($this, $e) {
            var settings = helpers.settings($this);
            $e.find(".d.va").droppable({greedy:true, accept:".v",
                over: function(event, ui) { $(this).addClass("over"); },
                out: function(event, ui) { $(this).removeClass("over"); },
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

                    $this.find("#submit").removeClass("s");
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
                        if ($e.find(".d.op").length) {
                            var $last = $e.find(".line").last();
                            if (!$last.length || $last.html().length) { helpers.addline($this, $e.find(".d.op")); }
                        }

                        $this.find("#submit").removeClass("s");
                    }
                  }
            }});
            if (!$_line) { $elt.append($html); }
        },
        process: {
            color: ["black","red","green","blue","white"],
            line: function($this, _pos) {
                var settings = helpers.settings($this);
                if (settings.data.pencil) {
                    var $line = $("#template", settings.svg.root()).clone().attr("id","");
                    $line.attr("x1", helpers.round(320+settings.data.pos[0]));
                    $line.attr("y1", helpers.round(240+settings.data.pos[1]));
                    $line.attr("x2", helpers.round(320+_pos[0]));
                    $line.attr("y2", helpers.round(240+_pos[1]));
                    $line.attr("class", helpers.process.color[settings.data.color%helpers.process.color.length]);
                    $line.appendTo($("#board", settings.svg.root()));
                }
            },
            turtle: {
                add: function($this, _move, _turn) {
                    var settings = helpers.settings($this);
                    if (_move) {
                        var pos=[0,0];
                        pos[0] = settings.data.pos[0]+helpers.round(_move[0]);
                        pos[1] = settings.data.pos[1]+helpers.round(_move[1]);

                        helpers.process.line($this, pos);

                        settings.data.pos[0] = pos[0];
                        settings.data.pos[1] = pos[1];
                    }
                    settings.data.cap += _turn;
                    this.upd($this);
                },
                equ: function($this, _pos, _cap) {
                    var settings = helpers.settings($this);
                    if (_pos[0]!=settings.data.pos[0] || _pos[1]!=settings.data.pos[1]) { helpers.process.line($this, _pos); }
                    settings.data.pos[0] = _pos[0];
                    settings.data.pos[1] = _pos[1];
                    settings.data.cap = _cap;
                    this.upd($this);
                },
                upd: function($this) {
                    var settings = helpers.settings($this);
                    $("#turtle",settings.svg.root()).attr("transform","translate("+
                        (320+settings.data.pos[0])+","+(240+settings.data.pos[1])+")").
                        attr("class",helpers.process.color[settings.data.color%helpers.process.color.length]);
                    $("#rotturtle",settings.svg.root()).attr("transform","rotate("+(settings.data.cap%360)+")");
                    $("#bg",settings.svg.root()).attr("class",helpers.process.color[settings.data.bg%helpers.process.color.length]);
                }
            },
            value: {
                // $elt IS THE DROPPABLE ZONE
                get: function($this, $elt) {
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
                            case "divint":  ret = Math.floor(this.get($this, $first)/this.get($this, $first.next().next())); break;
                            case "neg":     ret = - this.get($this, $first);                        break;
                            case "pow2":    ret = Math.pow(this.get($this, $first),2);              break;
                            case "cos":     ret = Math.cos(Math.PI*this.get($this, $first)/180);    break;
                            case "sin":     ret = Math.sin(Math.PI*this.get($this, $first)/180);    break;
                            case "tan":     ret = Math.tan(Math.PI*this.get($this, $first)/180);    break;
                            case "int":     ret = Math.floor(this.get($this, $first));              break;
                            case "round":   ret = Math.round(this.get($this, $first));              break;
                            case "sqrt":    ret = Math.sqrt(this.get($this, $first));               break;
                            case "log":     ret = Math.log(this.get($this, $first));                break;
                            case "exp":     ret = Math.exp(this.get($this, $first));                break;
                            case "atan":    ret = 180*Math.atan(this.get($this, $first))/Math.PI;   break;
                            case "rad":     ret = helpers.round(Math.PI*this.get($this, $first)/180); break;
                            case "deg":     ret = helpers.round(180*this.get($this, $first)/Math.PI); break;
                          }
                        }
                        else {
                            if ($current.attr("id") && $current.attr("id").length && $current.attr("id")[0]!='V') {
                                switch($current.attr("id")) {
                                    case "I" : case "J"  : case "X"  : case "Y"  : case "Z"  :
                                        ret = settings.data[$current.text()]; break;
                                    case "PI"       : ret = Math.PI; break;
                                    case "black"    : ret = 0; break;
                                    case "white"    : ret = 4; break;
                                    case "red"      : ret = 1; break;
                                    case "green"    : ret = 2; break;
                                    case "blue"     : ret = 3; break;
                                }
                            }
                            else { ret = parseInt($current.text()); }
                        }
                    }
                    return ret;
                }
            },


            av: function($this, $elt) {
                var settings = helpers.settings($this);
                var value = helpers.process.value.get($this, $elt.find(".d.va").first());
                var move=[ value*Math.sin(settings.data.cap*Math.PI/180), -value*Math.cos(settings.data.cap*Math.PI/180) ];
                this.turtle.add($this, move, 0);
                return true;
            },
            re: function($this, $elt) {
                var settings = helpers.settings($this);
                var value = helpers.process.value.get($this, $elt.find(".d.va").first());
                var move=[ -value*Math.sin(settings.data.cap*Math.PI/180), value*Math.cos(settings.data.cap*Math.PI/180) ];
                this.turtle.add($this, move, 0);
                return true;
            },
            td: function($this, $elt) {
                var settings = helpers.settings($this);
                var value = helpers.process.value.get($this, $elt.find(".d.va").first());
                this.turtle.add($this, 0, value);
                return true;
            },
            tg: function($this, $elt) {
                var settings = helpers.settings($this);
                var value = helpers.process.value.get($this, $elt.find(".d.va").first());
                this.turtle.add($this, 0, -value);
                return true;
            },
            co: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.color = Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first()));
                this.turtle.upd($this);
                return true;
            },
            fo: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.bg= Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first()));
                this.turtle.upd($this);
                return true;
            },
            lc: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.pencil = false;
                $("#pencil", settings.svg.root()).attr("class","disable");
                return true;
            },
            bc: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.pencil = true;
                $("#pencil", settings.svg.root()).attr("class","");
                return true;
            },
            ct: function($this, $elt) {
                var settings = helpers.settings($this);
                $("#rotturtle", settings.svg.root()).attr("class","disable");
                return true;
            },
            mt: function($this, $elt) {
                var settings = helpers.settings($this);
                $("#rotturtle", settings.svg.root()).attr("class","");
                return true;
            },
            or: function($this, $elt) {
                var settings = helpers.settings($this);
                this.turtle.equ($this, [0,0], 0);
                return true;
            },
            ca: function($this, $elt) {
                var settings = helpers.settings($this);
                var value = Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first()));
                value = (90-value)%360;
                this.turtle.equ($this, [settings.data.pos[0],settings.data.pos[1]], value);
                return true;
            },
            po: function($this, $elt) {
                var settings = helpers.settings($this);
                var x = Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first()));
                var y = Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first().next()));
                this.turtle.equ($this, [x,-y], settings.data.cap);
                return true;
            },
            xx: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.X = Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first()));
                return true;
            },
            yy: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.Y = Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first()));
                return true;
            },
            zz: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.Z = Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first()));
                return true;
            },
            ii: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.I = Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first()));
                return true;
            },
            jj: function($this, $elt) {
                var settings = helpers.settings($this);
                settings.data.J = Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first()));
                return true;
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
            call1: function($this, $elt) {
                var settings = helpers.settings($this);
                var ret = ($this.find("#code #fct1").length==1);
                if (ret) {
                    settings.data.stack.push({$elt:$this.find("#code #fct1 .d.op").children().first(),
                                              $first:0, count:0, sav:{X:settings.data.X, Y:settings.data.Y, Z:settings.data.Z} });
                    settings.data.X = 0; settings.data.Y = 0; settings.data.Z = 0;
                }
                return !ret;
            },
            call2: function($this, $elt) {
                var settings = helpers.settings($this);
                var ret = ($this.find("#code #fct2").length==1);
                if (ret) {
                    var valueX = helpers.process.value.get($this, $elt.find(".d.va").first());
                    settings.data.stack.push({$elt:$this.find("#code #fct2 .d.op").children().first(),
                                              $first:0, count:0, sav:{X:settings.data.X, Y:settings.data.Y, Z:settings.data.Z } });
                    settings.data.X = valueX;
                    settings.data.Y = 0;
                    settings.data.Z = 0;
                }
                return !ret;
            },
            call3: function($this, $elt) {
                var settings = helpers.settings($this);
                var ret = ($this.find("#code #fct3").length==1);
                if (ret) {
                    var valueX = helpers.process.value.get($this, $elt.find(".d.va").first());
                    var valueY = helpers.process.value.get($this, $elt.find(".d.va").first().next());
                    settings.data.stack.push({$elt:$this.find("#code #fct3 .d.op").children().first(),
                                              $first:0, count:0, sav:{X:settings.data.X, Y:settings.data.Y, Z:settings.data.Z } });
                    settings.data.X = valueX;
                    settings.data.Y = valueY;
                    settings.data.Z = 0;
                }
                return !ret;
            },
            "break": function($this, $elt) { helpers.popstack($this); return false; },
            cmp: function($this, $elt, _cmp) {
                var settings = helpers.settings($this);
                var v1 = Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first()));
                var v2 = Math.floor(helpers.process.value.get($this, $elt.find(".d.va").first().next().next()));
                var ret = _cmp(v1,v2);
                if (ret) {
                    settings.data.stack.push({$elt:$elt.find(".d.op").children().first(),
                                              $first:$elt.find(".d.op").children().first(),
                                              count:0, sav:0 });
                }
                return !ret;
            },
            gt:  function($this, $elt) { return this.cmp($this, $elt, function(a,b) { return (a>b); }); },
            gte: function($this, $elt) { return this.cmp($this, $elt, function(a,b) { return (a>=b); }); },
            lt:  function($this, $elt) { return this.cmp($this, $elt, function(a,b) { return (a<b); }); },
            lte: function($this, $elt) { return this.cmp($this, $elt, function(a,b) { return (a<=b); }); },
            eq:  function($this, $elt) { return this.cmp($this, $elt, function(a,b) { return (a==b); }); },
            no:  function($this, $elt) { return this.cmp($this, $elt, function(a,b) { return (a!=b); }); },
            if: function($this, $elt) {
                var settings = helpers.settings($this);
                var value = helpers.process.value.get($this, $elt.find(".d.va").first());
                var ret = (settings.data.X<=value || settings.data.stack.length==1);
                if (!ret ) { helpers.popstack($this); }
                return ret;
            }
        },
        init: function($this) {
            var settings = helpers.settings($this);
            settings.data.count = 0;
            settings.data.timer = 0;
            settings.data.X = 0; settings.data.Y = 0; settings.data.Z = 0; settings.data.I = 0; settings.data.J = 0;
            settings.data.stack=[{$elt:$this.find("#code #lines").children().first(), $first:0, count:1, sav:0}];
            settings.data.pos = [0,0];
            settings.data.cap = 0;
            settings.data.color = 0;
            settings.data.pencil = true;
            settings.data.bg = helpers.process.color.length-1;

            $("#board>line", settings.svg.root()).each(function(_index) {
                if ($(this).attr("class")!="hide") { $(this).detach(); } });
            $("#pencil", settings.svg.root()).attr("class","");
            $("#rotturtle", settings.svg.root()).attr("class","");
            helpers.process.turtle.upd($this);

            $this.find("#code #lines .line").removeClass("s");
            $this.find("#submit").removeClass("s");

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
            $this.find(".mask").hide();
            $this.find("#controls").removeClass("running");
            $this.find("#controls #play img").attr("src","res/img/control/play.svg");
            settings.data.running = false;
            settings.data.paused = false;

            if (!_stopped) {
                var good = helpers.check($this);
                
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
                        
                        var screen = helpers.screen($this);
                        var helpid = -1;
                        if (settings.help) for (var i in settings.help) {
                            var help = settings.help[i];
                            if ($.isArray(help.screen)) {
                                for (var j in help.screen) { if (help.screen[j] == screen) { helpid = i; }}
                            }
                            else if (help.screen == screen) { helpid = i; }
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
            }
        },
        clean: function($this) {
            var settings = helpers.settings($this);
            $this.find("#effects").hide();
            $this.find("#effects #wrong").hide();
            $this.find("#continue").hide();
            $this.find("#dialog>div").html("").parent().hide();
            $this.find("#code #lines .line").removeClass("s");

        },
        check: function($this) {
            var settings = helpers.settings($this), ret=true;
            if (settings.result) {
                var c = {}; for (var i in helpers.process.color) { c[helpers.process.color[i]]=i; }
                var nb = $("#board line", settings.svg.root()).length - 1;
                if (nb!=settings.result.nb) { ret = false; }
                
                if (ret) {
                    if (settings.result.crc) {
                        ret = (helpers.screen($this) == settings.result.crc);
                    }
                    else
                    for (var i in settings.result.values) {
                        var found = false;
                        $("#board line", settings.svg.root()).each(function(_index) {
                            if ($(this).attr("class")!="hide") {
                                if ( ( (helpers.round($(this).attr("x1")) == settings.result.values[i][0] ) &&
                                       (helpers.round($(this).attr("y1")) == settings.result.values[i][1] ) &&
                                       (helpers.round($(this).attr("x2")) == settings.result.values[i][2] ) &&
                                       (helpers.round($(this).attr("y2")) == settings.result.values[i][3] ) ) ||
                                     ( (helpers.round($(this).attr("x2")) == settings.result.values[i][0] ) &&
                                       (helpers.round($(this).attr("y2")) == settings.result.values[i][1] ) &&
                                       (helpers.round($(this).attr("x1")) == settings.result.values[i][2] ) &&
                                       (helpers.round($(this).attr("y1")) == settings.result.values[i][3] ) ) ) {
                                    found = true;
                                    if (c[$(this).attr("class")]!=settings.result.values[i][4]) { ret=false; }
                                }
                            }
                        });

                        if (!found) { ret=false; }
                    }

                    if (ret && typeof(settings.result.ct)!="undefined") {
                        var ct = (!$("#rotturtle", settings.svg.root()).attr("class") ||
                                  !$("#rotturtle", settings.svg.root()).attr("class").length)
                        if (ct!=settings.result.ct) { ret = false; }
                    }

                    if (ret && typeof(settings.result.bg)!="undefined") {
                        if ($("#bg",settings.svg.root()).attr("class")!=settings.result.bg) { ret=false; }
                    }

                }
            }
            else { ret = false; }
            return ret;
        }
    };

    // The plugin
    $.fn.logo = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    codeid          : 0,
                    score           : 5,
                    data : {
                        running     : false,
                        paused      : false,
                        random      : [],
                        speed       : 2,
                        count       : 0,
                        timer       : 0,
                        I:0, J:0,
                        X:0, Y:0, Z:0,
                        color       : 0,
                        pos         : [0,0],
                        pencil      : true,
                        cap         : 0,
                        stack       : []
                    },
                    tipid           : 0,
                    wrong           : 0
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
                        if ($settings["class"]) { $this.addClass($settings["class"]); }
                        helpers.settings($this.addClass(defaults.name), $settings);
                        helpers.loader.css($this);
                    }
                });
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = false;
                settings.context.onquit($this,{'status':'abort'});
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
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
            devmode: function() {
                var $this = $(this), settings = helpers.settings($this);
                var svg = "";
                
                if (settings.data.running) {
                    var current = $.extend(true, {}, settings.data);
                    for (var i in current.stack) {
                        if (current.stack[i].$elt)   { current.stack[i].$elt = current.stack[i].$elt.children().first().attr("id"); }
                        if (current.stack[i].$first) { current.stack[i].$first = current.stack[i].$first.children().first().attr("id"); }
                    }
                    svg = JSON.stringify(current);
                }
                    else {
                    var c = {}; for (var i in helpers.process.color) { c[helpers.process.color[i]]=i; }
                    var nb = $("#board line", settings.svg.root()).length - 1;
                    var nbret = 0;
                    var ratio = nb?9/nb:0;
                    var ret = "";
                    var last = [-1, -1, 0];
                    var path = "";
                    var line = "";

                    $("#board line", settings.svg.root()).each(function(_index) {
                        if ($(this).attr("class")!="hide") {
                            if ( (helpers.round($(this).attr("x1")) == last[0]) && (helpers.round($(this).attr("y1")) == last[1]) &&
                                 ($(this).attr("class") == last[2]) )
                            {
                                line="";
                                path+=" L "+ helpers.round($(this).attr("x2"))+ ","+helpers.round($(this).attr("y2"));
                            }
                            else
                            {
                                if (svg.length) { svg+=","; }
                                if (line) { svg+=line; line = ""; }
                                else if (path) {  svg+="{\"id\":\"path\",\"attr\":{\"d\":\""+path+"\"}}"; path = ""; last=[-1,-1, 0]; }

                                path = "M "+helpers.round($(this).attr("x1"))+ ","+helpers.round($(this).attr("y1"))+
                                      " L "+helpers.round($(this).attr("x2"))+ ","+helpers.round($(this).attr("y2"));
                                line = "{\"id\":\"line\",\"attr\":{\"x1\":"+helpers.round($(this).attr("x1"))+ ",\"y1\":"+
                                    helpers.round($(this).attr("y1"))+",\"x2\":"+helpers.round($(this).attr("x2"))+",\"y2\":"+
                                    helpers.round($(this).attr("y2"))+"}}";
                            }
                            last = [ helpers.round($(this).attr("x2")), helpers.round($(this).attr("y2")), $(this).attr("class") ];


                            if (nbret/(_index+1)<ratio) {
                                if (ret.length) { ret+=","; }
                                ret+="["+helpers.round($(this).attr("x1"))+","+helpers.round($(this).attr("y1"))+","+
                                        helpers.round($(this).attr("x2"))+","+helpers.round($(this).attr("y2"))+","+
                                        c[$(this).attr("class")]+"]";
                                nbret++;
                            }
                        }
                    });
                    if (svg.length) { svg+=","; } 
                    if (line) { svg+=line; line = ""; }
                    else if (path) { svg+="{\"id\":\"path\",\"attr\":{\"d\":\""+path+"\"}}"; path = ""; last=[-1,-1, 0]; }

                    svg+="\n\n\"result\":{\"nb\":"+nb+",\"values\":["+ret+"],\"fo\":\""+
                        $("#bg",settings.svg.root()).attr("class")+"\",\"mt\":"+
                        (!$("#rotturtle", settings.svg.root()).attr("class") ||
                        !$("#rotturtle", settings.svg.root()).attr("class").length)+",\"crc\":"+
                        helpers.screen($this)+"}";
                }
                
                $this.find("#devoutput textarea").val(svg).parent().show();
            },
            cont: function() {
                var $this = $(this) , settings = helpers.settings($this);
                
                helpers.clean($this);
                $this.find("#it>div").animate({left:"110%"},1000,function() { 
                    $(this).parent().hide();
                    if (!settings.interactive) { helpers.end($this); }
                });
            },
            board: function() {
                var $this = $(this) , settings = helpers.settings($this);
                    var text = '<?xml version="1.0" ?>'+settings.svg.toSVG(settings.svg.root());
                    var defpos = text.search("/defs");
                    if (text.search(" xmlns")==-1 || text.search(" xmlns")>defpos) {
                        text = text.replace(/<svg/,'<svg xmlns="http://www.w3.org/2000/svg"');
                    }
                    if (text.search("xmlns:svg")==-1 || text.search("xmlns:svg")>defpos) {
                        text = text.replace(/<svg/,'<svg xmlns:svg="http://www.w3.org/2000/svg"');
                    }
                    if (text.search("xmlns:xlink")==-1 || text.search("xmlns:xlink")>defpos) {
                        text = text.replace(/<svg/,'<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
                    }
                    if (text.search("xlink:href")==-1)  { text = text.replace(/href/,'xlink:href'); }
                    text = text.replace(/id="pencil"/, 'id="pencil" style="display:none;"');
                    $(this).find("#export").html("<img title='export' src='data:image/svg+xml;charset=utf-8,"+
                                                  encodeURIComponent(text)+"'/>").show();
                helpers.screen($this);
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
                    settings.score--;
                }
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in logo plugin!'); }
    };
})(jQuery);

