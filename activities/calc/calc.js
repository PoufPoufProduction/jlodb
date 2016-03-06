(function($) {
    // Activity default options
    var defaults = {
        name        : "calc",                           // The activity name
        label       : "Calc",                           // The activity label
        template    : "template.html",                  // Activity's html template
        css         : "style.css",                      // Activity's css style sheet
        lang        : "en-US",                          // Current localization
        exercice    : [],                               // Exercice
        withbars    : true,                             // Add the bars A,B,C,D,... 1,2,3,4,...
        sp          : 0.1,                              // space between cells
        font        : 1,                                // font size of cell
        tabs        : ["calc","img","math","txt"],            // authorized tabs
        withtabs    : false,                            // display the tabs
        imgsize     : 2,                                // img tab font-size in em
        imgprefix   : "res/img/clipart/animal/",        // img prefix
        img         : [],                               // img filename
		txtsize		: 1,								// text tab font-size em
		txt			: [],								// text values
        errratio    : 1,                                // ratio error
        noneg       : false,                            // no negative number
        nodec       : false,                            // no decimal number
        nonext      : false,                            // no next cell after validing
        callen      : 6,                                // calculator length
        checkempty  : false,                            // Do not valid if empty cells
        reference   : "A1",                             // reference value
        debug       : true                              // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
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
            $this.unbind("mouseup mousedown mousemove mouseout touchstart touchmove touchend touchleave");
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

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }

                $this.css("font-size", Math.floor($this.height()/12)+"px");
                $this.find("#board>div").css("font-size", settings.font+"em");

                if (settings.nodec) { $this.find("#paddec").addClass("graykeypad"); }
                if (settings.noneg) { $this.find("#padneg").addClass("graykeypad"); }

                // handle math editor
                $this.find("#editor").editor({
                    onclick:function($editor, _event) {
                        if (settings.timers.clear) { clearTimeout(settings.timers.clear); }
                        else { $this.find("#eclear").css("opacity",0).show().animate({opacity:1},500); }
                        settings.timers.clear = setTimeout(function() { $this.find("#eclear")
                            .animate({opacity:0},500, function() { $(this).hide(); settings.timers.clear=0; }); }, 2000);
                    },
                    newnode:function($editor, $elt) {
                        var ret = { type:"value", subtype:$elt.attr("id"), abstract:$elt.text(), value:settings.reference,
                            process:function() {
                                return helpers.content($this,this.value.charCodeAt(0)-65,parseInt(this.value[1])-1);
                            },
                            p:function() {
                                var cell = settings.sheet[parseInt(this.value[1])-1][this.value.charCodeAt(0)-65];
                                return (cell&&(cell.type=="img"||cell.type=="txt"))?nodemathtype.rootonly:0;
                            }
                        };
                        return ret;
                    }
                });
                helpers.reference($this, settings.reference);
                $this.find(".ea").draggable({containment:$this, helper:"clone", appendTo:$this});


                // handle tabs and panel
                $this.find("#pimg").css("font-size",settings.imgsize+"em");
                for (var i in settings.img) {
                    var html="<div id='img"+i+"' class='icon'";
                    html+='onmousedown=\'$(this).closest(".calc").calc("img",this);\' ';
                    html+='ontouchstart=\'$(this).closest(".calc").calc("img",this);event.preventDefault();\' ';
                    html+="><img src='"+settings.imgprefix+settings.img[i]+".svg'/></div>";
                    $this.find("#pimg").append(html);
                }
                $this.find("#panel").draggable({handle:"#escreen"}).css("position","absolute");
                
                $this.find("#ptxt").css("font-size",settings.txtsize+"em");
                for (var i in settings.txt) {
                    var html="<div id='txt"+i+"' ";
                    html+='onmousedown=\'$(this).closest(".calc").calc("txt",this);\' ';
                    html+='ontouchstart=\'$(this).closest(".calc").calc("txt",this);event.preventDefault();\' ';
                    html+=">"+settings.txt[i]+"</div>";
                    $this.find("#ptxt").append(html);
					
				}

                // Locale handling
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                // GEN
                if (settings.gen) {
                    var gen = eval('('+settings.gen+')')();
                    if (gen.cells) { settings.cells = gen.cells; }
                }

                // Build the grid
                var $board = $this.find("#board>div");
                for (var i in settings.cells) {
                    var m = i.match(/c([0-9]*)x([0-9]*)/);
                    if (parseInt(m[1])>settings.size[0]) { settings.size[0] = parseInt(m[1]); }
                    if (parseInt(m[2])>settings.size[1]) { settings.size[1] = parseInt(m[2]); }
                }
                for (var i in settings.cols) {
                    var m = i.match(/col([0-9]*)/); if (parseInt(m[1])>settings.size[0]) { settings.size[0] = parseInt(m[1]); }
                }
                for (var i in settings.rows) {
                    var m = i.match(/row([0-9]*)/); if (parseInt(m[1])>settings.size[1]) { settings.size[1] = parseInt(m[1]); }
                }
                // the bars
                var w       = helpers.value($this,0,0,"width",1.2);
                var h       = helpers.value($this,0,0,"height",1.2);
                var width   = w;
                var height  = h;
                $board.append('<div class="cell g" style="width:'+(w-settings.sp)+'em;height:'+(h-settings.sp)+'em;"></div>');
                for (var i=0; i<settings.size[0]; i++) {
                    w = helpers.value($this,(i+1),0,"width",2);
                    h = helpers.value($this,(i+1),0,"height",1.2);
                    $board.append('<div class="cell g" style="left:'+width+'em;width:'+(w-settings.sp)+'em;height:'+(h-settings.sp)+'em;">'+
                        (settings.withbars?String.fromCharCode(65 + i):"")+'</div>');
                    width+=w;
                }
                    
                for (var j=0; j<settings.size[1]; j++) {
                    w = helpers.value($this,0,(j+1),"width",1.2);
                    h = helpers.value($this,0,(j+1),"height",1.2);
                    $board.append('<div class="cell g" style="top:'+height+'em;width:'+(w-settings.sp)+'em;height:'+(h-settings.sp)+'em;">'+
                        (settings.withbars?(j+1):"")+'</div>');
                    height+=h;
                }

                // Copy the grid initialization into settings.sheet[];
                settings.sheet=[];
                for (var j=0;j<settings.size[1];j++) {
                    var row = [];
                    for (var i=0;i<settings.size[0];i++) { row.push({}); }
                    settings.sheet.push(row);
                }

                // HIDE CELL
                if (settings.hide) for (var s in settings.hide) {
                    var w=1,h=1;
                    if (settings.hide[s].length>2) { w = settings.hide[s][2]; }
                    if (settings.hide[s].length>3) { h = settings.hide[s][3]; }
                    for (var i=0; i<w; i++) for (var j=0; j<h; j++) {
                        settings.sheet[settings.hide[s][1]+j-1][settings.hide[s][0]+i-1].type="hide";
                    }
                }

                var height= helpers.value($this,0,0,"height",1.2);
                for (var j=0; j<settings.size[1]; j++) {
                    var width = helpers.value($this,0,0,"width",1.2);
                    for (var i=0; i<settings.size[0]; i++) {
                        w = helpers.value($this,(i+1),(j+1),"width",2);
                        h = helpers.value($this,(i+1),(j+1),"height",1.2);

                        var type = helpers.value($this,(i+1),(j+1),"type","");
                        if (type.length) { settings.sheet[j][i].type = type; }

                        settings.sheet[j][i].fixed = helpers.value($this,(i+1),(j+1),"fixed",(type=="fixed"));
                        settings.sheet[j][i].value = helpers.value($this,(i+1),(j+1),"value","");
                        settings.sheet[j][i].result = helpers.value($this,(i+1),(j+1),"result","");
                        settings.sheet[j][i].opt = helpers.value($this,(i+1),(j+1),"opt","");

                        if (settings.sheet[j][i].type!="hide") {
                            var vClass="cell "+settings.sheet[j][i].type;
                            if (settings.sheet[j][i].opt) { vClass+=" "+settings.sheet[j][i].opt; }
                            var html = '<div class="'+vClass+'" style="top:'+height+'em;left:'+width+'em;width:'+(w-settings.sp)+'em;'+
                                'height:'+(h-settings.sp)+'em;background-color:'+helpers.value($this,(i+1),(j+1),"background","white")+';'+
                                'color:'+helpers.value($this,(i+1),(j+1),"color","black")+';" ';
                            html+='id="c'+(i+1)+'x'+(j+1)+'" ';
                            if (!settings.sheet[j][i].fixed) {
                                html+='onmousedown=\'$(this).closest(".calc").calc("cell",this);\' ';
                                html+='ontouchstart=\'$(this).closest(".calc").calc("cell",this);event.preventDefault();\' ';
                            }
                            html+='>'+helpers.content($this,i,j)+'</div>';
                            $board.append(html);
                        }
                        width+=helpers.value($this,(i+1),0,"width",2);
                    }
                    height+=helpers.value($this,0,(j+1),"height",1.2);
                }



                // Exercice
                if ($.isArray(settings.exercice)) {
                    $this.find("#exercice>div").html("");
                    for (var i in settings.exercice) { $this.find("#exercice>div").append(
                        "<p>"+(settings.exercice[i].length?helpers.format(settings.exercice[i]):"&nbsp;")+"</p>"); }
                } else { $this.find("#exercice>div").html(helpers.format(settings.exercice)); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        ref: {
            // Get all the reference from a cell
            fromcell: function(_node) {
                var ret = [];
                if (_node.type=="value"&&_node.subtype.substr(0,3)=="ref") {
                    ret.push(_node.value);
                }
                for (var i in _node.children) { ret = ret.concat(helpers.ref.fromcell(_node.children[i])); }
                return ret;
            },
            // Check if loop
            loop: function($this, _ref,_node) {
                var settings = helpers.settings($this)
                var ret = false;
                var ref = helpers.ref.fromcell(_node);
                while(ref.length && !ret) {
                    var elt = ref.pop();
                    if (elt==_ref) { ret = true; }
                    else {
                        var cell = settings.sheet[parseInt(elt[1])-1][elt.charCodeAt(0)-65];
                        if (cell.type=="math") { ref = ref.concat(helpers.ref.fromcell(cell.value)); }
                    }
                };
                return ret;
            }
        },
        content: function($this, _i, _j) {
            var settings = helpers.settings($this);
            var type = settings.sheet[_j][_i].type;
            var ret = settings.sheet[_j][_i].value;
            switch(type) {
                case "img" :
                    if (ret.toString().length) { ret = "<img src='"+settings.imgprefix+settings.img[ret]+".svg'/>"; }
                    break;
                case "math":
                    if (!settings.sheet[_j][_i].update) { settings.sheet[_j][_i].tmp = ret.process(); }
                    ret = settings.sheet[_j][_i].tmp;
                    break;
                case "txt":
					if (ret.toString().length) { ret = settings.txt[ret]; }
					break;
                case "fixed" :
                    if (settings.po && settings.po[ret]) { ret = helpers.format(settings.po[ret]); }
                    ret="<span>"+ret+"</span>";
                    break;
            }
            settings.sheet[_j][_i].update = true;
            return ret;
        },
        value: function($this, _i, _j, _attr, _default) {
            var settings = helpers.settings($this);
            var ret = _default;
            if (settings.all&&typeof(settings.all[_attr])!="undefined") {
                ret = settings.all[_attr];
            }
            if (settings.cols&&settings.cols["col"+_i]&&typeof(settings.cols["col"+_i][_attr])!="undefined") {
                ret = settings.cols["col"+_i][_attr];
            }
            if (settings.rows&&settings.rows["row"+_j]&&typeof(settings.rows["row"+_j][_attr])!="undefined") {
                ret = settings.rows["row"+_j][_attr];
            }
            if (settings.cells&&settings.cells["c"+_i+"x"+_j]&&typeof(settings.cells["c"+_i+"x"+_j][_attr])!="undefined") {
                ret = settings.cells["c"+_i+"x"+_j][_attr];
            }
            return ret;
        },
        // Update the grid
        update:function($this) {
            var settings = helpers.settings($this);
            for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
                settings.sheet[j][i].update = false;
            }
            for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
                $this.find('#c'+(i+1)+'x'+(j+1)).html(helpers.content($this,i,j));
            }
        },
        // Handle the key input
        key: function($this, value, fromkeyboard) {
            var settings = helpers.settings($this);
            if (value==".") {
                if (!settings.nodec) {
                    if (settings.calculator.indexOf(".")==-1 && settings.calculator.length<settings.callen-1) {
                        settings.calculator+=(settings.calculator.length?"":"0")+"."; }
                }
            }
            else if (value=="c") { settings.calculator=""; }
            else if (value=="-") {
                if (!settings.noneg) {
                    if (settings.calculator.length &&settings.calculator[0]=='-')
                         { settings.calculator = settings.calculator.substr(1); }
                    else { settings.calculator = '-' + settings.calculator; }
                }
            }
            else if (settings.calculator.length<settings.callen) {
                if (value=="0" && settings.calculator.length<2 && settings.calculator[0]=='0') {}
                else {
                    if (settings.calculator.length==1 && settings.calculator[0]=='0') { settings.calculator=""; }
                    settings.calculator+=value.toString();
                }
            }
            var value = settings.calculator;
            if (value.length==0 || (value.length==1&&value[0]=='-')) { value="0"; }
            $this.find("#screen").html(value);
        },
        reference: function($this, value) {
            var settings = helpers.settings($this);
            settings.reference=value;
            $this.find("#ref1 span").html(value[0]+value[1]);
            $this.find("#ref2 span").html(value[0]+"$"+value[1]);
            $this.find("#ref3 span").html("$"+value[0]+value[1]);
            $this.find("#ref4 span").html("$"+value[0]+"$"+value[1]);
        },
        loop: function($this, _ref, _value) {
        }
    };

    // The plugin
    $.fn.calc = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    size            : [0,0],
                    sheet           : [],
                    calculator      : "",
                    timers          : { clear:0 },
                    target          : 0
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
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
                if (settings.withtabs && settings.tabs.length>1) {
                    for (var i in settings.tabs) { $this.find("#tab"+settings.tabs[i]).show(); } }
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            },
            cell: function(_cell) {
                var $this = $(this) , settings = helpers.settings($this);
                var $target = $this.find("#target");
                if (settings.interactive) {
                    if (_cell) {
                        var target=$(_cell).attr("id").match(/c([0-9]*)x([0-9]*)/);
                        if ($this.find("#echange").hasClass("s")) {
                            $this.find("#echange").removeClass("s");
                            helpers.reference($this, String.fromCharCode(64 + parseInt(target[1]))+target[2]);
                        }
                        else {
                            if (settings.target[0]!=target[0]) {
                                var c=settings.sheet[parseInt(target[2]-1)][parseInt(target[1]-1)];
                                settings.target=target;

                                $this.find("#pimg .icon").removeClass("s");
                                $this.find("#ptxt>div").removeClass("s");
                                $this.find("#editor").editor('clear');
                                helpers.key($this, 'c', false);

                                if (settings.tabs.length) {
                                    var tab=settings.tabs[0];

                                    switch(c.type) {
                                        case "img":
                                            tab ="img";
                                            $this.find("#pimg #img"+c.value).addClass("s");
                                            break;
                                        case "math":
                                            tab ="math";
                                            $this.find("#editor").editor('value',c.value);
                                            break;
                                        case "txt":
											tab = "txt";
											$this.find("#ptxt #txt"+c.value).addClass("s");
											break;
                                        default:
                                            var value = c.value.toString();
                                            if (value.length==0 || (value.length==1&&value[0]=='-')) { value="0"; }
                                            $this.find("#screen").html(value);
                                            break;
                                    }
                                    $this.find("#ppanel>div").hide();
                                    $this.find("#ppanel #p"+tab).show();
                                    $this.find("#pmenu>div").removeClass("s");
                                    $this.find("#pmenu #tab"+tab).addClass("s");
                                }
                                $this.find("#escreen").css("opacity",c.type=="math"?1:0);
                            }
                            $target.show();
                            $target.width($(_cell).width()).height($(_cell).height())
                                   .offset({top:$(_cell).offset().top-4, left:$(_cell).offset().left-4});
                            $this.find("#panel").show();
                        }
                    }
                    else {
                        $target.hide();
                        $this.find("#panel").hide();
                    }
                }
            },
            tab: function(_tab, _elt) {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#pmenu>div").removeClass("s");
                $(_elt).addClass("s");
                $this.find("#ppanel>div").hide();
                $this.find("#"+_tab).show();
                $this.find("#escreen").css("opacity",_tab=="pmath"?1:0);
            },
            img: function(_elt) {
                if ($(_elt).hasClass("s")) { $(this).calc("valid"); }
                else {
                    $(this).find("#pimg .icon").removeClass("s");
                    $(_elt).addClass("s");
                }
            },
            txt: function(_elt) {
                if ($(_elt).hasClass("s")) { $(this).calc("valid"); }
                else {
                    $(this).find("#ptxt>div").removeClass("s");
                    $(_elt).addClass("s");
                }
			},
            key: function(value, _elt) {
                var $this = $(this);
                if (_elt) { $(_elt).addClass("touch");
                    setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
                }
                helpers.key($(this), value, false);
            },
            valid: function() {
                var $this = $(this) , settings = helpers.settings($this), ok = true;
                var i = parseInt(settings.target[1])-1;
                var j = parseInt(settings.target[2])-1;
                if ($this.find("#tabcalc").hasClass("s")) {
                    settings.sheet[j][i].type = "value";
                    settings.sheet[j][i].value = parseFloat(settings.calculator.length?settings.calculator:"0");
                }
                else if ($this.find("#tabimg").hasClass("s")) {
                    if (settings.sheet[j][i].type!="img") {
                        var name = String.fromCharCode(65 + i)+(j+1);
                        for (var jj=0; jj<settings.size[1]; jj++) for (var ii=0; ii<settings.size[0]; ii++) {
                            var cc=settings.sheet[jj][ii];
                            if (cc.type=="math"&& $.inArray(name,helpers.ref.fromcell(cc.value))!=-1) { ok=false; }
                        }
                    }
                    if (ok) {
                        settings.sheet[j][i].type = "img";
                        settings.sheet[j][i].value = parseInt($this.find("#pimg .icon.s").attr("id").replace("img",""));
                    }
                }
                else if ($this.find("#tabtxt").hasClass("s")) {
                    if (settings.sheet[j][i].type!="txt") {
                        var name = String.fromCharCode(65 + i)+(j+1);
                        for (var jj=0; jj<settings.size[1]; jj++) for (var ii=0; ii<settings.size[0]; ii++) {
                            var cc=settings.sheet[jj][ii];
                            if (cc.type=="math"&& $.inArray(name,helpers.ref.fromcell(cc.value))!=-1) { ok=false; }
                        }
                    }
                    if (ok) {
                        settings.sheet[j][i].type = "txt";
                        settings.sheet[j][i].value = parseInt($this.find("#ptxt>div.s").attr("id").replace("txt",""));
                    }
                }
                else if ($this.find("#tabmath").hasClass("s")) {
                    ok = $this.find("#editor").editor('filled');

                    if (ok) {
                        var val = $this.find("#editor").editor('value');
                        val.detach();
                        ok = !helpers.ref.loop($this,String.fromCharCode(65 + i)+(j+1),val);
                        if (ok) {
                            settings.sheet[j][i].type = "math";
                            settings.sheet[j][i].value = val;
                        }
                        else { $this.find("#editor").editor('value',val); }
                    }
                }

                if (ok) {
                    helpers.update($this);

                    var cell=0;
                    if (!settings.nonext && j+1<settings.size[1] && settings.sheet[j+1][i].type!="hide" && !settings.sheet[j+1][i].fixed) {
                        cell=$this.find("#c"+settings.target[1]+"x"+(parseInt(settings.target[2])+1));
                    }
                    $this.calc("cell",cell);
                }
            },
            submit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    settings.interactive = false;
                    $this.calc("cell",0);

                    var empty = 0;
                    if (settings.checkempty) {
                        for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
                            var r = settings.sheet[j][i];
                            if (r.result.toString().length && !r.value.toString().length) {
                                $this.find("#c"+(i+1)+"x"+(j+1)).addClass("empty");
                                empty++;
                            }
                        }
                    }

                    if (empty) {
                        settings.interactive = true;
                        setTimeout(function() { $this.find(".cell").removeClass("empty");}, 1000);
                    }
                    else {
                    var error = 0;
                        for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
                            var r = settings.sheet[j][i];
                            if (r.result.toString().length) {
                                if (r.result.toString()!=r.value.toString()) {
                                    error++;
                                    $this.find("#c"+(i+1)+"x"+(j+1)).addClass("wrong");
                                }
                            }
                        }
                        $this.find("#subvalid").hide();
                        $this.find("#sub"+(error?"wrong":"good")).show();

                        settings.score = 5 - error*settings.errratio;
                        if (settings.score<0) { settings.score = 0; }
                        setTimeout(function() { helpers.end($this); } , 2000);
                    }
                }
            },
            clear:function() { $(this).find("#editor").editor('clear'); }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in calc plugin!'); }
    };
})(jQuery);

