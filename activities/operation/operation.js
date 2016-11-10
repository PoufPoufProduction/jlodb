(function($) {
    // Activity default parameters
    var defaults = {
        name        : "operation",          // The activity name
        template    : "template.html",      // Activity's html template
        css         : "style.css",          // Activity's css style sheet
        locale      : "fr",                 // Current localization
        number      : 4,                    // Number of exercices
        base        : 10,                   // Base of the exercice
        nbdec       : 0,                    // Number of decimal for division
        withmove    : true,                 // Does user need to move the decimal value
        removezero  : true,                 // No space allowed for 0 multiplicator
        time        : 1,                    // Perfect time to solve the operation
        ratioerr    : 1,                    // Error ratio
        fontex      : 1,                    // Exercice font
        highlight   : [],                   // Highlight cells
        exercice    : "",                   // Exercice
        debug       : false                 // Debug mode
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

                // Generic resize
                $this.css("font-size", Math.floor($this.height()/12)+"px");

                // Base and nbdec
                $this.find("#base").toggle(settings.base!=10).find("span").html(settings.base);
                $this.find("#nbdec").toggle(settings.nbdec!=0).find("span").html(settings.nbdec);

                // Keypad
                var nb = Math.min(settings.base,10);
                var r = settings.base>10?1.8:1.5;
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

                // exercice
                if ($.isArray(settings.exercice)) {
                    $this.find("#exercice>div").html("");
                    for (var i in settings.exercice) {
                        $this.find("#exercice>div").append("<p>"+
                            (settings.exercice[i].length?helpers.format(settings.exercice[i]):"&#xA0;")+"</p>"); }
                } else { $this.find("#exercice>div").html(helpers.format(settings.exercice)); }
                $this.find("#exercice>div").css("font-size",settings.fontex+"em");

                // Locale handling
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }
                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        showop: function($this) {
            var settings = helpers.settings($this);
            $this.find(".value.l1").html("");
            for (var i=0; i<settings.op.length; i++) {

                var v=(settings.type=="*")?settings.op[i].value.toString(settings.base):
                        settings.op[i].value[0].toString(settings.base) + 
                        settings.op[i].value[1].toString(settings.base).substr(0, settings.op[i].dec);

                if (settings.type=="*") { while(v.length<=settings.op[i].dec) { v = "0"+v; } }

                for (var j=0; j<v.length; j++) {
                    var $cell = $this.find("#c"+(j+settings.size[0]-v.length-settings.op[i].pos)+"x"+i).html(v[j]);

                    if (settings.op[i].dec && j==v.length-settings.op[i].dec-1) {
                        if (settings.op[i].$elt) { settings.op[i].$elt.detach(); }
                        settings.op[i].$elt =
                            $("<div class='dec s' style='top:"+$cell.css("top")+";left:"+$cell.css("left")+";'><div></div></div>");
                        $this.find("#data").append(settings.op[i].$elt);
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
            if (settings.gen) {
                vOpTmp = eval('('+settings.gen+')')();
            }
            else {
                var vNew;
                do  { vNew = settings.values.length==settings.number?settings.count:Math.floor(Math.random()*settings.values.length); }
                    while ((settings.values.length>1)&&(vNew==settings.last));
                    vOpTmp = settings.values[vNew];
                    settings.last = vNew;
            }

            // Split the operation regarding the operation type
            if (vOpTmp.indexOf("*")>=0) { settings.type = "*"; } else
            if (vOpTmp.indexOf("/")>=0) { settings.type = "/"; } else
            if (vOpTmp.indexOf("-")>=0) { settings.type = "-"; } else
                                        { settings.type = "+"; }
            var vReg = new RegExp("["+settings.type+"]", "g");
            var vOperation = vOpTmp.split(vReg);
            settings.op=[];

            // Compute the size of the table
            var height = 0 , width = 0;         // HEIGHT AND WIDTH OF THE TABLE
            var dec = false;                    // DOES THE RESULT HAS DECIMAL
            var wtmp = [0,0];                   // temporary width : unit width, decimal width
            if (settings.type=="*") {
                for (var i=0; i<2; i++) {
                    var comma = vOperation[i].indexOf(".");
                    var op = { value:0, dec:0, pos:0, $elt:0 };
                    if (comma!=-1) {
                        var tmp = vOperation[i].substr(0,comma)+vOperation[i].substr(comma+1);
                        op.value = parseInt(tmp, settings.base);
                        op.dec = vOperation[i].length-comma-1;
                        dec = true;
                    }
                    else { op.value = parseInt(vOperation[i], settings.base); }
                    settings.op.push(op);
                }

                settings.withmove = false;
                settings.result = (settings.op[0].value * settings.op[1].value).toString(settings.base);
                settings.dec    = settings.op[0].dec+settings.op[1].dec;
                while (settings.result.length<=settings.dec) { settings.result="0"+settings.result; }
                width = settings.result.length;
                var tmp = Math.max(settings.op[1].value.toString(settings.base).length,settings.op[1].dec);
                height = 2+ (tmp>1?tmp:0) + 1;
            }
            else if (settings.type=="/") {
                for (var i=0; i<2; i++) {
                    var comma = vOperation[i].indexOf(".");
                    var op = { value:0, dec:0, pos:0, $elt:0 };
                    if (comma!=-1) {
                        var tmp = vOperation[i].substr(0,comma)+vOperation[i].substr(comma+1);
                        op.value = parseInt(tmp, settings.base);
                        op.dec = vOperation[i].length-comma-1;
                        dec = true;
                    }
                    else { op.value = parseInt(vOperation[i], settings.base); }
                    settings.op.push(op);
                }

                settings.withmove = false;
                var tmp = (settings.op[0].value/settings.op[1].value).toString(settings.base);
                var comma = tmp.indexOf(".");
                if (comma!=-1) { tmp = tmp.substr(0,comma)+tmp.substr(comma+1); } else { comma = tmp.length; }

                var delta = settings.op[0].dec-settings.op[1].dec;
                if (delta>0)      { for (var i=0; i<delta; i++) { if (comma>1) { comma--; } else { tmp = "0"+tmp; } } }
                else if (delta<0) { for (var i=0; i<-delta;i++) { if (tmp[0]=='0') { tmp=tmp.substr(1);} else
                                                                  if (comma<tmp.length) { comma++; } else { tmp+="0"; comma++;} } }
                settings.dec = Math.min(tmp.length-comma, settings.nbdec);
                settings.result = tmp.substr(0,comma+settings.dec);
                if (settings.dec>0) { dec=true; }

                var op2 = parseInt(settings.result, settings.base)*settings.op[1].value;
                var dec2= settings.dec+settings.op[1].dec;
                var op1 = settings.op[0].value;
                var dec1= settings.op[0].dec;
                if (dec2>dec1) { for (var i=dec1; i<dec2; i++) { op1*=10; } }
                settings.modulo = (op1-op2).toString(settings.base);

                wtmp[0] = settings.op[0].value.toString(settings.base).length + settings.nbdec - settings.op[0].dec + settings.op[1].dec;
                wtmp[1] = Math.max(settings.op[1].value.toString(settings.base).length, settings.result.length);

                width = wtmp[0] + wtmp[1];

                height = (settings.result.length - (settings.removezero?settings.result.split("0").length:0) )*2+3;
            }
            else {
                var rtmp = [0,0]; // temporary result: settings.base^0 (units), settings.base^-10 decimals
                settings.dec = 0;
                for (var i=0; i<vOperation.length; i++) {
                    var comma = vOperation[i].indexOf(".");
                    var op = { value:[0,0], dec:0, pos:0, $elt:0 };
                    if (comma!=-1) {
                        var zero = ""; for (var j=(vOperation[i].length-comma); j<10; j++) { zero+="0"; }
                        op.value[0] = parseInt(vOperation[i].substr(0, comma),settings.base);
                        op.value[1] = parseInt(vOperation[i].substr(comma+1)+zero, settings.base);
                        op.dec = vOperation[i].length-comma-1;
                        if (op.dec>settings.dec) { settings.dec = op.dec; }
                        dec = true;
                    }
                    else { op.value[0] = parseInt(vOperation[i], settings.base); comma = vOperation[i].length; }

                    wtmp[0] = Math.max(wtmp[0], comma);
                    wtmp[1] = Math.max(wtmp[1], op.dec);

                    if (settings.type=="+") {             rtmp = [rtmp[0]+op.value[0],rtmp[1]+op.value[1]]; } else
                    if (settings.type=="-") { if (i==0) { rtmp = [op.value[0], op.value[1]];}
                                              else      { rtmp = [rtmp[0]-op.value[0],rtmp[1]-op.value[1]];}}
                    settings.op.push(op);
                }

                if (!settings.withmove) for (var i in settings.op) { settings.op[i].pos = settings.dec - settings.op[i].dec; }

                // handle the decimal part and the carry
                var decimal = rtmp[1].toString(settings.base);
                if (decimal[0]=='-') {
                    while(decimal[0]=='-') {
                        rtmp[0]--;
                        rtmp[1]+=parseInt("1000000000",settings.base);
                        decimal = rtmp[1].toString(settings.base);
                    }
                }
                else
                while (decimal.length>9) {
                    rtmp[0]++;
                    rtmp[1]-=parseInt("1000000000",settings.base);
                    decimal = rtmp[1].toString(settings.base);
                }
                decimal = rtmp[1].toString(settings.base);
                while (decimal.length<9) { decimal = "0"+decimal; }

                // build the real result;
                settings.result = rtmp[0].toString(settings.base) + decimal.substr(0,settings.dec);
                wtmp[0] = Math.max(wtmp[0], rtmp[0].toString(settings.base).length);
                wtmp[1] = Math.max(wtmp[1], rtmp[1].toString(settings.base).substr(0,settings.dec).length);
                width = wtmp[0]+wtmp[1];
                height = vOperation.length+1;

                settings.offset = wtmp[0] - rtmp[0].toString(settings.base).length;
            }

            // BUILD THE TABLE FOR THE DIVISION OPERATION
            var html = "", top = 0, left = 0;
            if (settings.type=="/") {
                for (var j=0; j<height; j++) {
                    left = 0;

                    for (var i=0; i<width; i++) {
                        var opclass="";
                        var opcontent = "";
                        var add = true;
                        var offset = 0;

                        // TYPE AND CONTENT OF THE CELL
                        if (j==0) {
                            if (i<settings.op[0].value.toString(settings.base).length) {
                                opcontent = settings.op[0].value.toString(settings.base)[i]; }
                            else if (i>=wtmp[0] && i-wtmp[0]<settings.op[1].value.toString(settings.base).length) {
                                opcontent = settings.op[1].value.toString(settings.base)[i-wtmp[0]]; }
                        }
                        if (i<wtmp[0]) { opclass=j?(j%2?" active l3":" active l2"):" l1"; }
                        else { if (j>1) { add = false; } else { opclass=j?" result active l2":" l1"; offset=j?0.1:0; } }

                        // BUILD THE CELL
                        if (add) {
                            html+="<div id='c"+i+"x"+j+"' class='value s"+Math.floor(Math.random()*2)+opclass+
                                "' style='top:"+(top+offset)+"em;left:"+left+"em;'>"+opcontent+"</div>";
                        }

                        // STATIC COMMA IF NEEDED
                        if (j==0) {
                            if (settings.op[0].dec && i==settings.op[0].value.toString(settings.base).length-settings.op[0].dec-1) {
                                html+="<div class='dec s' style='top:"+top+"em;left:"+left+"em;'><div></div></div>";
                            }
                            if (settings.op[1].dec &&
                                i-wtmp[0]== settings.op[1].value.toString(settings.base).length-settings.op[1].dec-1) {
                                html+="<div class='dec s' style='top:"+top+"em;left:"+left+"em;'><div></div></div>";
                            }
                        }

                        // DYNAMIC COMMA
                        if (j==1 && i>=wtmp[0] && dec && i<width-1) {
                            html+="<div class='dec result' style='top:"+top+"em;left:"+left+"em;'><div></div></div>";
                        }


                        left+=1;
                        if (i==wtmp[0]-1) { left+=0.1; }
                    }
                    top+=1;
                }
                // BG
                html+="<div class='bg' style='top:-0.1em;left:-0.1em;width:"+(wtmp[0]+0.2)+"em;height:"+(top+0.2)+"em;'></div>";
                html+="<div class='bg' style='top:-0.1em;left:"+(wtmp[0]-0.95)+"em;width:"+(wtmp[1]+1.15)+"em;height:2.3em;'></div>";
            }
            // BUILD THE TABLE FOR ALL OPERATIONS BUT DIVISION
            else {

                // HEADER
                left+=0.75;
                html+="<div class='corner' style='top:"+top+"em;left:"+left+"em;'></div>"; left+=.25;
                for (var i=0; i<width; i++) {
                    html+="<div class='carry' style='top:"+top+"em;left:"+left+"em;'><div class='active'></div></div>";
                    left+=1;
                }
                html+="<div class='corner' style='top:"+top+"em;left:"+left+"em;'></div>"; left+=.25;
                top+=0.55;

                // DATA
                for (var j=0; j<height; j++) {
                    left = 0;

                    // UPDATE DATA
                    var optxt = "", opclass="", opdec = false;
                    if (j>=0 && j<settings.op.length)               { opclass = " l1"; opdec = true; if (j>0) { optxt = settings.type; } }
                    else if (j>=settings.op.length && j<height-1)   { opclass = " l2 active"; if (j>settings.op.length) optxt = "+"; }
                    else if (j==height-1)                           { opclass = " result active"; }

                    if (optxt=="*")                                 { optxt = "×"; }

                    html+="<div class='op' style='top:"+top+"em;left:"+left+"em;'>"+optxt+"</div>";
                    left+=0.75;

                    if (dec && settings.withmove && opdec) {
                        html+="<div id='"+j+"' class='move"+opclass+"' style='top:"+top+"em;left:"+left+"em;' ";
                        html+="onclick=\"$(this).closest('.operation').operation('move', this, true);\" ";
                        html+="ontouchstart=\"$(this).closest('.operation').operation('move', this, true);event.preventDefault();\" ";
                        html+="><img src='res/img/generic/futoshiki05.svg'/></div>";
                    }
                    else {
                        html+="<div class='move' style='top:"+top+"em;left:"+left+"em;'>";
                        html+="<img src='res/img/generic/futoshiki04.svg'/></div>";
                    }
                    left+=.25;

                    for (var i=0; i<width; i++) {
                        html+="<div id='c"+i+"x"+j+"' class='value s"+Math.floor(Math.random()*2)+opclass+
                              "' style='top:"+top+"em;left:"+left+"em;'></div>";

                        if (dec && i<width-1 && j==height-1) {
                            html+="<div id='d"+i+"x"+j+"' class='dec result' style='top:"+top+"em;left:"+left+"em;'><div></div></div>";
                        }
                        left+=1;
                    }

                    if (dec && settings.withmove && opdec) {
                        html+="<div id='"+j+"' class='move"+opclass+"' style='top:"+top+"em;left:"+left+"em;' ";
                        html+="onclick=\"$(this).closest('.operation').operation('move', this, false);\" ";
                        html+="ontouchstart=\"$(this).closest('.operation').operation('move', this, false);event.preventDefault();\" ";
                        html+="><img src='res/img/generic/futoshiki06.svg'/></div>";
                    }
                    else {
                        html+="<div class='move' style='top:"+top+"em;left:"+left+"em;'>";
                        html+="<img src='res/img/generic/futoshiki04.svg'/></div>";
                    }
                    left+=.25;

                    top+=1;
                    if (j==height-2) { top+=0.05; }
                    if (j==settings.op.length-1) { top+=0.05; }
                }

                // BG
                html+="<div class='bg' style='top:-0.1em;left:0.675em;width:"+(width+0.67)+"em;height:"+(top+0.15)+"em;'></div>";
            }
            $board.append(html);

            for (var i in settings.highlight) {
                for (var j in settings.highlight[i]) {
                    $($this.find(".active,.value").get(settings.highlight[i][j])).addClass(i);
                }
            }

            $this.find(".corner").bind("mousedown touchstart", function(event) {
                $this.find(".carry .active").html(""); event.preventDefault();
            });

            $this.find(".active").bind("mousedown touchstart", function(event) { helpers.mousedown(this, event, false); });

            $this.bind("mouseup mouseleave touchend touchleave", function(event) {
                var settings = helpers.settings($this), $keypad = $this.find("#keypad"), vVal = "";

                if (settings.key!=-1 && settings.keypad) {
                    vVal = settings.$keys[settings.key].text();
                    settings.keypad.html((settings.keypad.html()==vVal&&settings.keypad.html().length)?"":vVal);
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

            // Resize
            settings.size= [width, height];
            var off = (settings.type=="/")?[0,0]:[1,0.5];

            var vFont = Math.floor(0.9*Math.min($board.width()/(width+off[0]), $board.height()/(height+off[1])));
            vFont = Math.floor(vFont/4)*4;
            $board.css("font-size", vFont+"px")
                  .css("top", Math.floor(($board.height()-(height+off[1])*vFont)/2)+"px")
                  .css("left", Math.floor(($board.width()-((width+off[0])*vFont))/2)+"px");
            if (settings.type!="/") helpers.showop($this);

            if (settings.target) {
                var vTargetFont = 1.2*vFont*12/$this.height();
                vTargetFont = Math.floor($this.height()/12*vTargetFont)/($this.height()/12);
                $this.find("#target").css("font-size",vTargetFont+"em");
                helpers.target($this, false);
                $this.find("#target").show();

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

                if (typeof settings.target[settings.targetid].id != "undefined") {
                    var $cell = $($this.find(".active,.value").get(settings.target[settings.targetid].id));
                    var vCarry = 0;
                    if ($cell.parent().hasClass("carry")) { $cell = $cell.parent(); vCarry = $cell.height()/2; }
                    var $target = $this.find("#target");
                    var offset = Math.floor($target.width()-$cell.width())/2;
                    $target.animate({left : ($cell.position().left+$data.position().left-offset)+"px",
                                     top  : ($cell.position().top+$data.position().top-offset-vCarry)+"px" },
                                    _anim?500:0 );
                }

                if (settings.target[settings.targetid].box) {
                    var $cell1 = $($this.find(".active,.value").get(settings.target[settings.targetid].box[0]));
                    var $cell2 = $($this.find(".active,.value").get(settings.target[settings.targetid].box[1]));
                    if ($cell1.parent().hasClass("carry")) { $cell1 = $cell1.parent(); }
                    if ($cell2.parent().hasClass("carry")) { $cell2 = $cell2.parent(); }

                    var x1 = $cell1.position().left+$data.position().left;
                    var y1 = $cell1.position().top+$data.position().top;
                    var x2 = $cell2.position().left+$data.position().left+$cell2.width();
                    var y2 = $cell2.position().top+$data.position().top+$cell2.height();
                    $this.find("#box").css("left",x1+"px").css("top",y1+"px")
                                      .css("width",(x2-x1-10)+"px").css("height",(y2-y1-10)+"px")
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
                    result      : 0,
                    offset      : 0,
                    dec         : 0,
                    modulo      : 0,
                    score       : 5,
                    elt         : 0,
                    keypad      : 0,
                    key         : -1,
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
            move: function(elt, side) {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    var op = settings.op[$(elt).attr("id")];
                    var val = op.value[0].toString(settings.base) + op.value[1].toString(settings.base).substr(0, op.dec);
                    if (side)   { if (op.pos+val.length<settings.size[0]) { settings.op[$(elt).attr("id")].pos++; } }
                    else        { if (op.pos>0) { settings.op[$(elt).attr("id")].pos--; }
                    }
                    helpers.showop($this);
                }
            },
            target: function(event) {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.mousedown($this.find(".active,.value").get(settings.target[settings.targetid].id), event, true);
            },
            valid: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    var error = 0;
                    settings.interactive = false;

                    $this.find(".value.result").each(function(_index) {
                        var it = _index-settings.offset;
                        if (it>=0 && it<settings.result.length && settings.result[it]!=$(this).html()) {
                            error++; $(this).addClass("wrong"); }
                    });

                    var indexdec = settings.type=="/"?settings.result.length-settings.dec-1:settings.size[0]-settings.dec-1;
                    $this.find(".dec.result").each(function(_index) {
                        if ($(this).hasClass("s")) {
                            if (_index!=indexdec)       { $(this).removeClass("s").addClass("wrong"); error++; }
                        } else if (_index==indexdec)    { $(this).addClass("wrong"); }
                    });

                    if (settings.type=="/" && settings.nbdec == 0) {
                        var k = settings.modulo.length-1;
                        for (var i=settings.size[0]; i>=0; i--) {
                            $elt = this.find("#c"+i+"x"+(settings.size[1]-1));
                            if ($elt.length) {
                                if (k>=0){ if ($elt.html()!=settings.modulo[k]) { $elt.addClass("wrong"); error++; } }
                                else     { if ($elt.html().length) { $elt.addClass("wrong"); error++; } }
                                k--;
                            }
                        }
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

