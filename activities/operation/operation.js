(function($) {
    // Activity default parameters
    var defaults = {
        name        : "operation",          // The activity name
        template    : "template.html",      // Activity's html template
        css         : "style.css",          // Activity's css style sheet
        locale      : "fr",                 // Current localization
        number      : 3,                    // Number of exercices
        base        : 10,                   // Base of the exercice
        nbdec       : 0,                    // Number of decimal for division
        withmove    : false,                // Does user need to move the decimal value
        removezero  : true,                 // No space allowed for 0 multiplicator
        ratioerr    : 1,                    // Error ratio
        fontex      : 1,                    // Exercice font
        highlight   : [],                   // Highlight cells
        exercice    : "",                   // Exercice
        hint        : false,                // With hint for division
        background  : "",
        debug       : true                  // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",                  "<b>$1</b>",
        "[*]",                                      "×",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[green\\\]([^\\\[]+)\\\[/green\\\]",    "<span style='color:green'>$1</span>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
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
            settings.context.onquit($this,{'status':'success', 'score':settings.score});
        },
        format: function(_text) {
            for (var j=0; j<2; j++) for (var i=0; i<regExp.length/2; i++) {
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
                if (settings.context.onload) { settings.context.onload($this); }

                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }
                

                // Base and nbdec
                $this.find("#base").toggle(settings.base!=10).find("span").html(settings.base);
                $this.find("#nbdec").toggle(settings.nbdec!=0).find("span").html(settings.nbdec);

                // Keypad
                setTimeout(function() {
                    var nb = Math.min(settings.base,10);
                    var r = settings.base>10?2:1.8;
                    for (var i=0; i<nb; i++) {
                        settings.$keys.push(
                            $this.find("#keypad #key"+i).css("top",(r*Math.pow(nb/10,0.3)*Math.cos(2*Math.PI*(i/nb))-0.5)+"em")
                                .css("left",(r*Math.pow(nb/10,0.3)*Math.sin(2*Math.PI*(i/nb))-0.5)+"em")
                                .addClass(settings.base>10?"small":"normal")
                                .show()
                        );
                    }
                    nb=settings.base - 10;
                    if (nb>0) for (var i=0; i<nb; i++) {
                        settings.$keys.push(
                            $this.find("#keypad #key"+(i+10)).css("top",(1.2*Math.pow(nb/10,0.3)*Math.cos(2*Math.PI*(i/nb))-0.5)+"em")
                                .css("left",(1.2*Math.pow(nb/10,0.3)*Math.sin(2*Math.PI*(i/nb))-0.5)+"em")
                                .addClass(settings.base>10?"small":"normal")
                                .show()
                        );
                    }
                },100);

                // exercice
                if ($.isArray(settings.exercice)) {
                    $this.find("#exercice>div").html("");
                    for (var i in settings.exercice) {
                        $this.find("#exercice>div").append("<p>"+
                            (settings.exercice[i].length?helpers.format(settings.exercice[i]):"&#xA0;")+"</p>"); }
                } else { $this.find("#exercice>div").html(helpers.format(settings.exercice)); }
                $this.find("#exercice>div").css("font-size",settings.fontex+"em");

                // Locale handling

                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }
                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        // PLACE THE OPERANDS ACCORDING TO THE MOVE POSITION
        showop: function($this) {
            var settings = helpers.settings($this);
            $this.find(".value.l1").html("");
            $this.find(".dec.decop").detach();
            for (var i=0; i<settings.op.length; i++) {

                var v=settings.op[i].alpha[0] + settings.op[i].alpha[1];

                for (var j=0; j<v.length; j++) {
                    var elt=settings.cells.get(settings.size[0]*(i+1)+j+settings.op[i].pos);
                    elt.$elt.html("<div>"+v[j]+"</div>");

                    if ( settings.op[i].alpha[1].length && j==settings.op[i].alpha[0].length-1) {
                        $this.find("#data").append($("<div class='dec decop s' style='top:"+elt.pos[1]+"em;left:"+elt.pos[0]+"em;'><div></div></div>"));
                    }

                }
            }
        },
        // Build the response table regarding the question
        build:function($this) {
            var settings = helpers.settings($this);
            var $board = $this.find("#data").html("");
            $this.find("#effects").hide();
            $this.find("#effects>div").hide();
            $this.find("#submit").removeClass("wrong").removeClass("good");

            // Get the operation
            var vOpTmp;
            if (settings.gen) { vOpTmp = eval('('+settings.gen+')')($this,settings,0); }
            else {
                var vNew;
                do  { vNew = settings.values.length==settings.number?settings.count:Math.floor(Math.random()*settings.values.length); }
                    while ((settings.values.length>1)&&(vNew==settings.last));
                    vOpTmp = settings.values[vNew];
                    settings.last = vNew;
            }
            
            // SPLIT THE OPERATION REGARDING THE OPERATION TYPE
            if (vOpTmp.indexOf("*")>=0) { settings.type = "*"; } else
            if (vOpTmp.indexOf("/")>=0) { settings.type = "/"; } else
            if (vOpTmp.indexOf("-")>=0) { settings.type = "-"; } else
                                        { settings.type = "+"; }
            var vReg        = new RegExp("["+settings.type+"]", "g");
            var vOperation  = vOpTmp.split(vReg);
            settings.op     = [];
            settings.max    = [0,0];
            
            for (var i=0; i<vOperation.length; i++) {
                var comma = Math.max(0,vOperation[i].indexOf("."));
                var op = { value: 0,        // Value without comma (last max[1] digits are decimal part)
                           alpha: ["",""],  // Int and dec parts of the value in native base
                           width: 0,        // Width of the integer and decimal part
                           pos  : 0,        // First column position
                           $elt : 0 };      // Graphical element from DOM
                if (comma)  { op.alpha    = [ vOperation[i].substr(0, comma), vOperation[i].substr(comma+1) ]; }
                else        { op.alpha[0] = vOperation[i]; }
                for (j=0; j<2; j++) { settings.max[j]=Math.max(op.alpha[j].length,settings.max[j]); }
                op.width = op.alpha[0].length + op.alpha[1].length;
                settings.op.push(op);
            }
            for (var i in settings.op) {
                var val = settings.op[i].alpha[0] + settings.op[i].alpha[1];
                for (var j=0; j<settings.max[1]-settings.op[i].alpha[1].length; j++) { val+="0"; }
                settings.op[i].value = parseInt(val, settings.base);
            }
            
            // COMPUTE RESULT AND PREPARE BOARD SETTINGS ACCORDING TO THE OPERATION TYPE
            if (settings.type=="/") {
                var nbd = settings.nbdec?settings.nbdec:settings.max[1];
                var v   = Math.floor(Math.pow(settings.base,nbd)*settings.op[0].value/settings.op[1].value);
                var m   = settings.op[0].value*Math.pow(10,settings.nbdec) - v*settings.op[1].value;
                v       = v.toString(settings.base);
                var p   = v.length-nbd;
                settings.size[0]        = settings.max[0]+Math.max(settings.max[1],nbd)+
                                          Math.max(p+nbd,settings.op[1].alpha[0].length+settings.op[1].alpha[1].length);
                settings.size[1]        = 1+2*v.length;
                settings.size[2]        = settings.max[0]+Math.max(settings.max[1],nbd);
                settings.max[0]         = Math.max(op.alpha[1].length, p);
                settings.result.value   = [v.slice(0, p), '.', v.slice(p,p+nbd)].join('');
                settings.result.nbdec   = nbd;
                settings.result.modulo  = Math.floor(m/Math.pow(10,settings.nbdec));
            }
            else if (settings.type=="*") {
                var v   = (settings.op[0].value * settings.op[1].value).toString(settings.base);
                var p   = v.length-(settings.max[1]*2);
                var nbd = settings.op[0].alpha[1].length + settings.op[1].alpha[1].length;
                var tmp = settings.op[1].alpha[0].length+settings.op[1].alpha[1].length;

                settings.size[0]        = p+nbd;
                settings.size[1]        = settings.op.length + (tmp>1?tmp:0) + 1;
                settings.max[0]         = Math.max(settings.max[0], p);
                settings.result.value   = [v.slice(0, p), '.', v.slice(p,p+nbd)].join('');
                settings.result.nbdec   = nbd;
                settings.result.modulo  = 0;
            }
            else {
                var v   = settings.op[0].value;
                for (var i=1; i<settings.op.length; i++) { v+=(settings.type=="+"?1:-1)*settings.op[i].value; }
                v       = v.toString(settings.base);
                var p   = v.length-settings.max[1];
                
                settings.max[0]         = Math.max(settings.max[0], p);
                settings.size[0]        = settings.max[0]+settings.max[1];
                settings.size[1]        = settings.op.length + 1;
                settings.result.value   = [v.slice(0, p), '.', v.slice(p)].join('');
                settings.result.nbdec   = v.length-p;
                settings.result.modulo  = 0;
            }
            
            for (var i in settings.op) {
                settings.op[i].pos = settings.withmove?0:
                    settings.size[0] - settings.max[1] - settings.op[i].alpha[0].length;
            }
            
            if (settings.debug) {
                console.log("[value: "+vOpTmp+"] [operation: "+settings.type+"] ("+JSON.stringify(settings.op));
                console.log("[max: "+settings.max+"]");
                console.log("[result: "+JSON.stringify(settings.result)+"]");
                console.log("[size: "+settings.size[0]+"x"+settings.size[1]+"]"+
                            (settings.size[2]?" ("+settings.size[2]+")":""));
            }

            // BUILD THE TABLE FOR THE DIVISION OPERATION
            var top = 0, left = 0;
            settings.cells.clear();
            
            if (settings.type=="/") {
                
                $board.append("<div class='bg' style='top:-0.1em;left:-0.1em;width:"+(settings.size[2]+0.2)+"em;height:"+(settings.size[1]+0.2)+"em;'></div>");
                $board.append("<div class='bg' style='top:-0.1em;left:"+settings.size[2]+"em;width:"+(settings.size[0]-settings.size[2]+0.2)+"em;height:2.3em;'></div>");

                // LEFT COLUMN
                for (var j=0; j<settings.size[1]; j++) {
                    left    = 0;
                    var o   = settings.op[0];
                    var op  = o.alpha[0]+o.alpha[1];
                    for (var i=0; i<settings.size[2]; i++) {
                        var opclass     = j?(j==settings.size[1]-1?" active modulo":(j%2?" active l3":" active l2")):" l1";
                        var opcontent   = "";
                        var add         = true;
                        var offset      = 0;
                        
                        if (j==0 && i<op.length) { opcontent = op[i]; }
                        if (o.alpha[1].length && i+1==o.alpha[0].length) {
                            $board.append("<div class='dec s' style='top:"+top+"em;left:"+left+"em;'><div></div></div>");
                        }

                        $board.append(settings.cells.push(
                            "<div class='value s"+Math.floor(Math.random()*2)+opclass+"'><div>"+opcontent+"</div></div>",
                            left, top));

                        left+=1;
                    }
                    top+=1;
                }
                // RIGHT COLUMN
                left    = settings.size[2]+0.1;
                var o   = settings.op[1];
                var op  = o.alpha[0]+o.alpha[1];
                for (var i=0; i<settings.size[0]-settings.size[2]; i++) {
                    var opcontent = (i<op.length)?op[i]:"";
                    
                    if (o.alpha[1].length && i+1==o.alpha[0].length) {
                        $board.append("<div class='dec s' style='top0em;left:"+left+"em;'><div></div></div>");
                    }
                    if (settings.nbdec && i<settings.size[0]-settings.size[2]-1) {
                        $board.append("<div class='dec result' style='top:1.1em;left:"+left+"em;'><div></div></div>");
                    }
                    $board.append(settings.cells.push(
                        "<div class='value s"+Math.floor(Math.random()*2)+" l1'><div>"+opcontent+"</div></div>",
                        left, 0));
                    $board.append(settings.cells.push(
                        "<div class='value s"+Math.floor(Math.random()*2)+" result active l2'><div></div></div>",
                        left, 1.1));
                    left+=1;
                }
            }
            // BUILD THE TABLE FOR ALL OPERATIONS BUT DIVISION
            else {

                $board.append("<div class='bg' style='top:-0.1em;left:0.675em;width:"+(settings.size[0]+0.67)+"em;height:"+(settings.size[1]+0.8)+"em;'></div>");
            
                // HEADER
                left+=1; // SPACE FOR LEFT OPERATORS ('+', '-' or '*')
                for (var i=0; i<settings.size[0]; i++) {
                    $board.append(settings.cells.push("<div class='carry active'></div>", left, top));
                    left+=1;
                }
                top+=0.55;

                // DATA
                for (var j=0; j<settings.size[1]; j++) {
                    left = 0;

                    // GET INFORMATION FROM CURRENT LINE (OPERAND, INTERMEDIARY COMPUTATION, RESULT)
                    var optxt = "", opclass=" line"+j, opdec = false;
                    if (j>=0 && j<settings.op.length)
                        { opclass += " l1"; opdec = true; if (j>0) { optxt = settings.type; } }
                    else if (j>=settings.op.length && j<settings.size[1]-1)
                        { opclass += " l2 active"; if (j>settings.op.length) optxt = "+"; }
                    else if (j==settings.size[1]-1)
                        { opclass += " result active"; }

                    if (optxt=="*")                                 { optxt = "×"; }
                    
                    // OPERATOR LABELS
                    $board.append("<div class='op' style='top:"+top+"em;left:"+left+"em;'>"+optxt+"</div>");
                    left+=0.75;

                    var $ml = $("<div class='move' style='top:"+top+"em;left:"+left+"em;'></div>");
                    if (opdec && settings.withmove) {
                        $ml.addClass("ml").attr("id",j).bind("mousedown touchstart", function(event) {
                            $(this).closest('.operation').operation('move', this, true);
                            event.preventDefault();
                        });
                    }
                    $board.append($ml);
                    left+=.25;

                    for (var i=0; i<settings.size[0]; i++) {
                        // ADD A NEW CELL
                        $board.append(settings.cells.push(
                            "<div class='value s"+Math.floor(Math.random()*2)+opclass+"'></div>", left, top));

                        // ADD DECIMAL POINT TO RESULT LINE
                        if (settings.max[1] && i<settings.size[0]-1 && j==settings.size[1]-1) {
                            $board.append("<div id='d"+i+"x"+j+"' class='dec result' style='top:"+top+"em;left:"+left+"em;'><div></div></div>");
                        }
                        left+=1;
                    }

                    var $mr = $("<div class='move' style='top:"+top+"em;left:"+left+"em;'></div>");
                    if (opdec && settings.withmove) {
                        $mr.addClass("mr").attr("id",j).bind("mousedown touchstart", function(event) {
                            $(this).closest('.operation').operation('move', this, false);
                            event.preventDefault();
                        });
                    }
                    $board.append($mr);
                    
                    left+=.25;
                    top +=(j==settings.size[1]-2)?1.05:1;
                }
                
                helpers.showop($this);
            }

            // HIGHLIGHT
            for (var i in settings.highlight) {
                for (var j in settings.highlight[i]) {
                    $($this.find(".cell").get(settings.highlight[i][j])).addClass(i);
                }
            }
            
            // HINT
            if (settings.hint) {
                $this.find("#help").show();
                var hint="";
                for (var i=1; i<10; i++) {
                    hint+="<div class='elt'><div class='label'>"+i+"×"+vOperation[1]+"</div>"+
                          "<div class='result'>"+(i*vOperation[1])+"</div></div>";
                }
                $this.find("#phelp>div").html(hint);
            }

            $this.find(".active").bind("mousedown touchstart", function(event) { helpers.mousedown(this, event, false); });

            $this.bind("mouseup mouseleave touchend touchleave", function(event) {
                var settings = helpers.settings($this), $keypad = $this.find("#keypad"), vVal = "";

                if (settings.key!=-1 && settings.keypad) {
                    vVal = settings.$keys[settings.key].text();
                    settings.keypad.html("<div>"+((settings.keypad.html()==vVal&&settings.keypad.html().length)?"":vVal)+"</div>");

                    $this.find("#fill>div").addClass("running").parent()
                                .css("left",(settings.keypad.offset().left-$this.find("#board").offset().left)+"px")
                                .css("top",(settings.keypad.offset().top-$this.find("#board").offset().top)+"px")
                                .show();
                    setTimeout(function(){ $this.find("#fill>div").removeClass("running").parent().hide(); },500);
                }

                $this.find(".active").removeClass("s");
                $keypad.hide();
                settings.keypad = 0;

                if (vVal && settings.target && settings.targetid<settings.target.length) {
                    var vOk = true;
                    if (settings.target[settings.targetid].block) {
                        if (settings.target[settings.targetid].block != vVal) { vOk = false; }
                    }
                    if (vOk) { settings.targetid++; helpers.target($this, true); }
                }


                event.preventDefault();
            });

            $this.bind("mousemove touchmove", function(event) {
                var settings = helpers.settings($this), $keypad = $this.find("#keypad");
                if (settings.keypad) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches &&
                                  event.originalEvent.touches.length)? event.originalEvent.touches[0]:event;
                    var vTop = vEvent.clientY;
                    var vLeft = vEvent.clientX;
                    var vSize = settings.$keys[0].width();
                    var vAlready = false;
                    settings.key = -1;
                    for (var i in settings.$keys) {
                        settings.$keys[i].removeClass("s");
                        if (!vAlready) {
                            var vOffset = settings.$keys[i].offset();
                            vAlready = ( vTop>=vOffset.top && vLeft>=vOffset.left &&
                                         vTop<vOffset.top+vSize && vLeft<vOffset.left+vSize );
                            if (vAlready) { settings.key = i; settings.$keys[i].addClass("s"); }
                        }
                    }
                }
                event.preventDefault();
            });

            $this.find(".dec.result").bind("mousedown touchstart", function(e) {
                var $this = $(this).closest(".operation") , settings = helpers.settings($this);

                $this.find(".dec.result").removeClass("s");
                $(this).addClass("s");

            });

            // HANDLE SIZE
            var border = (settings.type=="/")?[0,0]:[1,0.2];
            var vFont = Math.floor(100*Math.min(0.9*16/(settings.size[0]+border[0]),
                                                0.7*12/(settings.size[1]+border[1])))/100;
            settings.margin = [ 0.2+(0.9*16-((settings.size[0]+border[0])*vFont))/(2*vFont),
                                0.2+(0.7*12-(settings.size[1]+border[1])*vFont)/(2*vFont) ];
            $board.css("font-size", vFont+"em").css("top", settings.margin[1]+"em").css("left", settings.margin[0]+"em");
            
            if (settings.debug) { console.log("[margin: "+settings.margin+"] [font: "+vFont+"]"); }

            // SET TARGET
            $this.find("#fill").css("font-size",vFont+"em");
            $this.find("#box").css("font-size",vFont+"em");
            if (settings.target) {
                $this.find("#target").css("font-size",vFont+"em");
                helpers.target($this, false);
                $this.find("#target").show()
                    .bind("touchstart mousedown", function(event) {
                        helpers.mousedown(
                            $this.find(".active,.value").get(settings.target[settings.targetid].index),
                            event, true); });

                setTimeout(function() { $this.find("#target>div").addClass("running"); },0);
            }

            settings.interactive = true;

        },
        mousedown: function(_this, event, _fromtarget) {
            var $this = $(_this).closest(".operation") , settings = helpers.settings($this), $keypad = $this.find("#keypad");
            $this.find("#keypad .k").removeClass("s");

            if (settings.target && settings.targetid<settings.target.length && settings.target[settings.targetid].block && !_fromtarget) {
                // Not targeted cell are blocked

            }
            else {

                if (settings.interactive && !$(_this).hasClass("move") ) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches &&
                                event.originalEvent.touches.length)? event.originalEvent.touches[0]:event;
                    var vTop = vEvent.clientY - $this.offset().top;
                    var vLeft = vEvent.clientX - $this.offset().left;

                    settings.keypad = $(_this);
                    settings.key    = -1;

                    var tmp = $this.find("#bg1").height()/1.5;
                    if (vTop<tmp)   { vTop = tmp; }
                    if (vLeft<tmp)  { vLeft = tmp; }
                    if (vTop+tmp>$this.height())    { vTop=$this.height()-tmp; }
                    if (vLeft+tmp>$this.width())    { vLeft=$this.width()-tmp; }
                    $keypad.css("top", vTop+"px").css("left", vLeft+"px").show();
                    settings.elt = _this;

                    $(_this).addClass("s");
                }
            }
            event.preventDefault();
        },
        target: function($this, _anim) {
            var settings = helpers.settings($this);

            if (settings.target && settings.targetid<settings.target.length) {
                var $data = $this.find("#data");

                // TARGET POSITION
                if (typeof settings.target[settings.targetid].index != "undefined") {
                    var elt = settings.cells.get(settings.target[settings.targetid].index);
                    if (elt) {
                        var vTop = (elt.$elt.hasClass("carry"))?0.25:0;
                        $this.find("#target").animate(
                            {    left : (elt.pos[0]+settings.margin[0])+"em",
                                top  : (elt.pos[1]-vTop+settings.margin[1])+"em"}, _anim?500:0 );
                    }
                    else { alert("issue on cell #settings.target[settings.targetid].index"); }
                }

                // BOX POSITION AND SIZE
                if (settings.target[settings.targetid].box) {
                    var c1 = settings.cells.get(settings.target[settings.targetid].box[0]);
                    var c2 = settings.cells.get(settings.target[settings.targetid].box[1]);
                    
                    $this.find("#box")
                        .css("left", (c1.pos[0]+settings.margin[0]-0.1)+"em")
                        .css("top", (c1.pos[1]+settings.margin[1]-0.1)+"em")
                        .css("width",(c2.pos[0]-c1.pos[0]+1)+"em")
                        .css("height",(c2.pos[1]-c1.pos[1]+1)+"em")
                        .css("opacity",1).show();

                }
                else if ($this.find("#box").is(":visible"))
                {
                    $this.find("#box").animate({opacity:0}, 500, function() { $(this).hide(); });
                }

            }
            else
            {
                $this.find("#box,#target").animate({opacity:0}, 500, function() { $(this).hide(); });
            }
        }
    };

    // The plugin
    $.fn.operation = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    last        : -1,
                    size        : [0,0],
                    result      : { value:0, nbdec:0, modulo: 0},
                    cells       : {
                        id        : 0,
                        data    : {},
                        clear    : function() { this.id=0; this.data={}; },
                        push    : function(_html, _left, _top) {
                            var $ret = $(_html);
                            this.data["c"+(this.id++)] = { $elt : $ret, pos  : [ _left, _top] };
                            $ret.addClass("cell").css("top",_top+"em").css("left",_left+"em");
                            return $ret;
                        },
                        get        : function(_id) { return this.data["c"+_id]; }
                    },
                    score       : 5,
                    elt         : 0,
                    keypad      : 0,
                    key         : -1,
                    max            : [0,0],    // Maximum number of digits [integer part, decimal]
                    size        : [0,0],    // Operation table size
                    margin        : [0,0],    // Margin table size
                    $keys       : [],
                    interactive : false,
                    count       : 0,
                    targetid    : 0,
                    type        : '+',
                    op          : []
                };

                // Check the context and send the load
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
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#exercice").show();
                helpers.build($(this));
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.finish = true;
                settings.context.onquit($this,{'status':'abort'});
            },
            move: function(elt, _side) {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    $(elt).addClass("s");
                    setTimeout(function() { $this.find(".move").removeClass("s"); }, 300);
                    var p = settings.op[$(elt).attr("id")].pos;
                    var w = settings.op[$(elt).attr("id")].width;
                    if (_side)  { if (p>0) { p--; } } else { if (p+w<settings.size[0]) { p++; } }
                    settings.op[$(elt).attr("id")].pos = p;
                    helpers.showop($this);
                }
            },
            valid: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    var error = 0;
                    settings.interactive = false;
                    
                    // CHECK WITHMOVE
                    if (settings.withmove) for (var i in settings.op) {
                        if (settings.op[i].pos != settings.size[0] - settings.max[1] - settings.op[i].alpha[0].length) {
                            $(".line"+i).addClass("wrong");
                            error++;
                        }
                    }

                    // CHECK RESULT VALUES
                    var result = settings.result.value.replace('.','');
                    $this.find(".value.result").each(function(_index) {
                        var comma = settings.result.value.indexOf(".");
                        var sint  = comma==-1?settings.result.length:comma;
                        var it    = _index-(settings.max[0]-sint);
                        var isw   = false;
                        var val   = $(this).text();
                        if (it<0 || it>=result.length)  { isw = (val.length && val!="0") }
                        else                            { isw = (result[it]!=val); }
                        
                        if (settings.debug) {
                            console.log("[RESULT "+_index+"] [comma: "+comma+"] [int size: "+sint+"] [it: "+it+"] "+
                                        "[val: "+val+"] "+(isw?"(KO)":"(OK)"));
                        }
                        if (isw) { error++; $(this).addClass("wrong"); }
                    });

                    
                    // CHECK THE DECIMAL POINT
                    var nbdec = $this.find(".dec.result").length;
                    if (nbdec) {
                        var p=nbdec-settings.result.nbdec;
                        $this.find(".dec.result").each(function(_index) {
                            if ($(this).hasClass("s")) {
                                if (_index!=p)       { $(this).removeClass("s").addClass("wrong"); error++; }
                            }
                            else if (_index==p)    { $(this).addClass("wrong"); error++; }
                        });
                    }
                    
                    
                    // CHECK THE MODULO
                    if (settings.type=="/") {
                        var modulo = settings.result.modulo.toString(settings.base);
                        var offset = settings.size[2]-modulo.length;
                        $this.find(".modulo").each(function(_index) {
                            var it    = _index-offset;
                            var isw   = false;
                            var val   = $(this).text();
                            if (it<0)   { isw = (val.length && val!="0") }
                            else        { isw = (modulo[it]!=val); }
                            
                            if (settings.debug) {
                                console.log("[MODULO "+_index+"] [modulo: "+modulo+"] [it: "+it+"] "+
                                            "[val: "+val+"] "+(isw?"(KO)":"(OK)"));
                            }
                            if (isw) { error++; $(this).addClass("wrong"); }
                        });
                    }

                    settings.score-=error*settings.ratioerr;
                    if (settings.score<0) { settings.score = 0; }
                    $this.find("#effects").toggleClass("division", settings.type=="/").show();
                    $this.find("#good").toggle(!error);
                    $this.find("#wrong").toggle(error);
                    $this.find("#submit").addClass(error?"wrong":"good");

                    settings.count++;

                    if (settings.count>=settings.number) { setTimeout(function() { helpers.end($this); }, 1000 ); }
                    else                                 { setTimeout(function() { helpers.build($this);},1000 ); }

                }

            }
        };


        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in operation plugin!'); }
    };
})(jQuery);

