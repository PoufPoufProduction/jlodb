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
		withauto	: false,							// Show auto filler with target
	    size        : [1,1],							// Minimum size
        sp          : 0.1,                              // space between cells
        font        : 1,                                // cell font size
        fontex      : 1,                                // exercice font size
		pospanel	: [60,5],							// Initial panel position
		margin		: [0.05,0.2],							// Board margin
        imgsize     : 2,                                // img tab font-size in em
        imgprefix   : "res/img/clipart/animal/",        // img prefix
        img         : [],                               // img filename
		txtsize		: 1,								// text tab font-size em
		txt			: [],								// text values
        txtstyle    : "default",                        // default, small or inline
        errratio    : 1,                                // ratio error
        noneg       : false,                            // no negative number
        nodec       : false,                            // no decimal number
        nonext      : false,                            // no next cell after validing
        callen      : 6,                                // calculator length
        checkempty  : false,                            // Do not valid if empty cells
        reference   : "A1",                             // reference value
        po          : {},                               // localisation
        nocellref   : false,                            // Cell pointer
        background  : "",                               // Background image
		toright		: false,							// Automatic move to right
		emptyisnull	: false,							// An empty value is dealt as 0
        debug       : true                              // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[green\\\]([^\\\[]+)\\\[/green\\\]",    "<span style='color:green'>$1</span>",
        "\\\[purple\\\]([^\\\[]+)\\\[/purple\\\]",  "<span style='color:purple'>$1</span>",
        "\\\[orange\\\]([^\\\[]+)\\\[/orange\\\]",  "<span style='color:orange'>$1</span>",
        "\\\[strong\\\](.+)\\\[/strong\\\]",        "<div class='strong'>$1</div>",
        "\\\[img\\\]([^\\\[]+)\\\[/img\\\]",        "<div class='image'><img src='$1.svg'/></div>",
        "\\\[img ([^\\\]]+)\\\]([^\\\[]+)\\\[/img\\\]",        "<div class='image' style='background-image:url(\"$1.svg\")'><img src='$2.svg'/></div>",
        "\\\[icon\\\]([^\\\[]+)\\\[/icon\\\]",      "<div class='img'><div class='icon'><img src='$1.svg'/></div></div>",
        "\\\[icon2\\\]([^\\\[]+)\\\[/icon2\\\]",    "<div class='icon' style='float:left;font-size:2em;'><img src='$1.svg'/></div>",
        "\\\[small\\\]([^\\\[]+)\\\[/small\\\]",    "<span style='font-size:0.5em'>$1</span>"
    ];

    var graphType = {
        pie : { label: ["X"], line: [ false ] },
        bar : { label: ["Y"], line: [ true ] },
        fct : { label: ["Y"], line: [ true ] }
    };

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

                if (settings.nodec) { $this.find("#paddec").addClass("graykeypad"); }
                if (settings.noneg) { $this.find("#padneg").addClass("graykeypad"); }
				if (settings.withauto) { $this.find("#target>div").show(); }

                // handle math editor
                helpers.reference($this, settings.reference);
                $this.find("#editor").editor({
                    onclick:function($editor, _event) {
                        if (settings.timers.clear) { clearTimeout(settings.timers.clear); }
                        else { $this.find("#eclear").css("opacity",0).show().animate({opacity:1},500); }
                        settings.timers.clear = setTimeout(function() { $this.find("#eclear")
                            .animate({opacity:0},500, function() { $(this).hide(); settings.timers.clear=0; }); }, 2000);
                    },
                    getnode:function($editor, _val) {
                        var ret =0;
                        if (typeof(_val)=="object") {
                            var reference = _val.abstract?_val.abstract:settings.reference;
                            ret = { type:"value", id:_val.id, subtype:"ref",
                                    abstract:helpers.ref.format(reference,_val.id[3]), value:reference,
                                process:function() {
                                    var i = this.value.charCodeAt(0)-65, j = parseInt(this.value.substr(1))-1;
                                    return helpers.content($this,i,j);
                                },
                                p:function() {
                                    var cell = settings.sheet[parseInt(this.value.substr(1))-1][this.value.charCodeAt(0)-65];
                                    return (cell&&(cell.type=="img"||cell.type=="txt"||cell.type=="graph"))?nodemathtype.rootonly:0;
                                }
                            };
                        }
                        else { ret = settings.mathnodes[_val]; }
                        return ret;
                    }
                });
                // Fill math operator
                var isRef = false;
                for (var i in settings.math) {
                    var vNode = $this.find("#editor").editor("tonode", settings.math[i]);
                    settings.mathnodes.push(vNode);
                    var vClass="ea";
                    if (vNode.subtype=="ref") { vClass+=" "+vNode.id; isRef = true;}
                    $this.find("#esource").append("<div class='"+vClass+" "+vNode.type+"' id='"+i+"'><div class='label'>"+vNode.label()+"</div></div>");
                }
                if (settings.nocellref) { $this.find("#echange").detach(); }
                $this.find(".ea").draggable({containment:$this, helper:"clone", appendTo:$this});


                // handle tabs and panel
                $this.find("#pimg").css("font-size",settings.imgsize+"em");
                for (var i in settings.img) {
                    var html="<div id='img"+i+"' class='icon'";
                    html+=' onmousedown=\'$(this).closest(".calc").calc("img",this);\'';
                    html+=' ontouchstart=\'$(this).closest(".calc").calc("img",this);event.preventDefault();\'';
                    html+="><img src='"+settings.imgprefix+settings.img[i]+".svg' alt=''/></div>";
                    $this.find("#pimg").append(html);
                }
                $this.find("#panel").draggable({handle:"#escreen",containment:$this,
					stop: function( event, ui ) {
						// BUG: After drag, size becomes in px.
						$this.find("#panel").css("width","6em").css("height","8em");
					}
				}).css("position","absolute");
                
                $this.find("#ptxt").css("font-size",settings.txtsize+"em");
                for (var i in settings.txt) {
                    var html="<div id='txt"+i+"' class='"+settings.txtstyle+"'";
                    html+=' onmousedown=\'$(this).closest(".calc").calc("txt",this);\'';
                    html+=' ontouchstart=\'$(this).closest(".calc").calc("txt",this);event.preventDefault();\'';
                    html+=">"+settings.txt[i]+"</div>";
                    $this.find("#ptxt").append(html);
				}


                // LOCALE HANDLING
                if (settings.locale) { $.each(settings.locale, function(id,value) {
					if($.type(value) === "string") { $this.find("#"+id).html(value); }
                }); }

                // GEN
                if (settings.gen) {
                    var gen = eval('('+settings.gen+')')($this,settings,0);
                    if (gen.cells) { settings.cells = $.extend(true, settings.cells, gen.cells); }
                }
          
                // Compute the size regarding the filled cells
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
                for (var i in settings.fill) {
                    for (var j=0; j<2; j++) {
                        if (settings.fill[i].cell[j]+settings.fill[i].cell[2+j]-1>settings.size[j]) {
                            settings.size[j] = settings.fill[i].cell[j]+settings.fill[i].cell[2+j]-1;
                        }
                    }
                }
                
                helpers.build($this);

                // Exercice
                if ($.isArray(settings.exercice)) {
                    $this.find("#exercice>div").html("");
                    for (var i in settings.exercice) { $this.find("#exercice>div").append(
                        "<p>"+(settings.exercice[i].length?helpers.format(settings.exercice[i]):"&#xA0;")+"</p>"); }
                } else { $this.find("#exercice>div").html(helpers.format(settings.exercice)); }
                $this.find("#exercice>div").css("font-size",settings.fontex+"em");

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        build: function($this) {
            var settings = helpers.settings($this);
                var $board = $this.find("#board>div#cc_content");
                $board.html("").css("font-size", settings.font+"em");
				$this.find("#target").css("font-size", settings.font+"em");
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }
            
                // HANDLE THE TIPS
                if (settings.tips) {
                    $this.find("#tip>div").html(settings.tips.length).parent().show();
                    $this.find("#ptip .tip1").addClass("s");
                }
            
                // the bars
                var w       = helpers.value($this,0,0,"width",1.2);
                var h       = helpers.value($this,0,0,"height",1.2);
                var width   = w;
                var height  = h;
                var html    = "";
                
                html = '<div id="c0x0" class="cell g" style="width:'+(w-settings.sp)+'em;height:'+(h-settings.sp)+'em;top:'+settings.margin[1]+'em;left:'+settings.margin[0]+'em;" ';
                if (settings.edit) {
                    html+='onmousedown=\'$(this).closest(".calc").calc("onedit","all",this);\' ';
                    html+='ontouchstart=\'$(this).closest(".calc").calc("onedit","all",0);event.preventDefault();\' ';
                }
                html+= '></div>';
                $board.append(html);
                for (var i=0; i<settings.size[0]; i++) {
                    w = helpers.value($this,(i+1),0,"width",2);
                    h = helpers.value($this,(i+1),0,"height",1.2);
                    html = '<div id="c'+i+'x0" class="cell g" style="top:'+settings.margin[1]+'em;left:'+(settings.margin[0]+width)+'em;width:'+(w-settings.sp)+'em;height:'+(h-settings.sp)+'em;" ';
                    if (settings.edit) {
                        html+='onmousedown=\'$(this).closest(".calc").calc("onedit","col",this);\' ';
						html+='ontouchstart=\'$(this).closest(".calc").calc("onedit","col",this);event.preventDefault();\' ';
                    }
                    html+= '>'+(settings.withbars?String.fromCharCode(65 + i):"")+'</div>';
                    $board.append(html);
                    width+=w;
                }
                    
                for (var j=0; j<settings.size[1]; j++) {
                    w = helpers.value($this,0,(j+1),"width",1.2);
                    h = helpers.value($this,0,(j+1),"height",1.2);
                    html = '<div id="c0x'+j+'" class="cell g" style="top:'+(settings.margin[1]+height)+'em;left:'+settings.margin[0]+'em;width:'+(w-settings.sp)+'em;height:'+(h-settings.sp)+'em;" ';
                    if (settings.edit) {
                        html+='onmousedown=\'$(this).closest(".calc").calc("onedit","row",this);\' ';
						html+='ontouchstart=\'$(this).closest(".calc").calc("onedit","row",this);event.preventDefault();\' ';
                    }
                    html+='>'+(settings.withbars?(j+1):"")+'</div>'
                    $board.append(html);
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
                        var ii = settings.hide[s][0]+i-1, jj = settings.hide[s][1]+j-1;
                        if (ii<settings.size[0] && jj<settings.size[1]) settings.sheet[jj][ii].type="hide";
                    }
                }

                 for (var j=0; j<settings.size[1]; j++) {
                    for (var i=0; i<settings.size[0]; i++) {
                        
                        var type = helpers.value($this,(i+1),(j+1),"type","");
                        if (type.length) { settings.sheet[j][i].type = type; }

                        settings.sheet[j][i].fixed  = helpers.value($this,(i+1),(j+1),"fixed",(type=="fixed"));
                        settings.sheet[j][i].value  = helpers.value($this,(i+1),(j+1),"value","");
                        settings.sheet[j][i].result = helpers.value($this,(i+1),(j+1),"result","");
                        settings.sheet[j][i].opt    = helpers.value($this,(i+1),(j+1),"opt","");
                        settings.sheet[j][i].bgimg  = helpers.value($this,(i+1),(j+1),"bgimg","");
                        
                        if (settings.sheet[j][i].type=="math" && settings.sheet[j][i].value) {
                            settings.sheet[j][i].value = $this.find("#editor").editor("tonode", settings.sheet[j][i].value);
                        }
                    }
                }
                
                var height= helpers.value($this,0,0,"height",1.2);
                for (var j=0; j<settings.size[1]; j++) {
                    var width = helpers.value($this,0,0,"width",1.2);
                    for (var i=0; i<settings.size[0]; i++) {
                        w = helpers.value($this,(i+1),(j+1),"width",2);
                        h = helpers.value($this,(i+1),(j+1),"height",1.2);

                        if (settings.sheet[j][i].type!="hide") {
                            var vClass="cell "+settings.sheet[j][i].type;
                            if (settings.sheet[j][i].opt) { vClass+=" "+settings.sheet[j][i].opt; }
							settings.sheet[j][i].pos = [width,height];
							settings.sheet[j][i].size = [w-settings.sp,h-settings.sp];
                            html = '<div class="'+vClass+'" style="top:'+(settings.margin[1]+height)+'em;left:'+(settings.margin[0]+width)+'em;width:'+(w-settings.sp)+'em;'+
                                'height:'+(h-settings.sp)+'em;background-color:'+helpers.value($this,(i+1),(j+1),"background","white")+';'+
                                (settings.sheet[j][i].bgimg?"background-image:url('"+settings.sheet[j][i].bgimg+"');":"")+
                                'color:'+helpers.value($this,(i+1),(j+1),"color","black")+';" ';
                            html+='id="c'+(i+1)+'x'+(j+1)+'" ';
                            if (!settings.sheet[j][i].fixed || settings.dev) {
                                html+='onmousedown=\'$(this).closest(".calc").calc("cell",this);\' ';
                                html+='ontouchstart=\'$(this).closest(".calc").calc("cell",this);event.preventDefault();\' ';
                            }
                            html+='><div></div></div>';
                            $board.append(html);
                        }
                        width+=helpers.value($this,(i+1),0,"width",2);
                    }
                    height+=helpers.value($this,0,(j+1),"height",1.2);
                }
				helpers.update($this);
				
				// PANEL PREPARE
				$this.find("#panel").css("top", settings.pospanel[1]+"%").css("left", settings.pospanel[0]+"%");


                // HANDLE AUTOMATIC SELECT
                settings.spinpx = $board.children().first().next().offset().left -
                                  $board.children().first().offset().left - $board.children().first().width();
                $this.bind("mouseup mouseleave touchend touchleave", function() {
                    var $target = $this.find("#target");
                    if ($target.hasClass("s")) {
                        $target.removeClass("s").hide();
                        for (var i=0;i<=settings.auto.size[0];i++) for (var j=0;j<=settings.auto.size[1];j++) {
                            var ii=settings.auto.target[0]+i, jj=settings.auto.target[1]+j;
                            if (settings.auto.sheet[jj][ii]) {settings.sheet[jj][ii]=settings.auto.sheet[jj][ii]; }
                        }
                        settings.auto.sheet=[];
                        helpers.update($this);
                    }
                });

                $this.bind("mousemove touchmove", function(event) {
                    var $target = $this.find("#target");
                    if ($target.hasClass("s")) {
                        var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                  event.originalEvent.touches[0]:event;
                        var diffi=vEvent.clientX - settings.auto.origin[0], diffj = vEvent.clientY - settings.auto.origin[1];
                        var nbi = 0, nbj = 0, sizei = 0, sizej = 0, vOk = true;

                        $this.find("#panel").hide();

                        while (vOk && diffi>0) {
                            if (settings.auto.target[0]+2+nbi>settings.size[0]) { diffi = 0; }
                            else {
                                var $elt = $("#c"+(settings.auto.target[0]+2+nbi)+"x"+(settings.auto.target[1]+1));
                                if ($elt && $elt.width()) {
                                    var w = $elt.width() + settings.spinpx;
                                    diffi-=w; if (diffi>=0) { sizei+=w; nbi++; }
                                } else { vOk = false; }
                            }
                        }

                        while (vOk && diffj>0) {
                            if (settings.auto.target[1]+2+nbj>settings.size[1]) { diffj = 0; }
                            else {
                                var $elt = $("#c"+(settings.auto.target[0]+1)+"x"+(settings.auto.target[1]+2+nbj));
                                if ($elt && $elt.height()) {
                                    var w = $elt.height() + settings.spinpx;
                                    diffj-=w; if (diffj>=0) { sizej+=w; nbj++; }
                                } else { vOk = false; }
                            }
                        }

                        for (var i=0;i<=nbi&&vOk;i++) for (var j=0;j<=nbj&&vOk;j++) {
                            if (!settings.auto.sheet[settings.auto.target[1]+j][settings.auto.target[0]+i]) {
                                settings.auto.sheet[settings.auto.target[1]+j][settings.auto.target[0]+i] =
                                    helpers.clone(settings.auto.sheet[settings.auto.target[1]][settings.auto.target[0]]);
                                var c = settings.auto.sheet[settings.auto.target[1]+j][settings.auto.target[0]+i];
                                switch (c.type) {
                                    case "value" : c.value+=j+i; break;
                                    case "math"  : helpers.ref.update(c.value,i,j);
                                                   vOk =  helpers.ref.inside($this, c.value) &&
                                                          helpers.ref.checkonlyroot($this, c.value) && 
                                                          !helpers.ref.loop($this,String.fromCharCode(65 + settings.auto.target[0]+i)+
                                                                                (settings.auto.target[1]+j+1),c.value);
                                                    break;
                                };
                            }
                        }

                        if (vOk && ( settings.auto.size[0]!=nbi || settings.auto.size[1]!=nbj)) {
                            settings.auto.size=[nbi,nbj];
                            helpers.update($this);
                        }

                        if (vOk) {
                            $target.width($("#c"+(settings.auto.target[0]+1)+"x"+(settings.auto.target[1]+1)).width()+sizei)
                                .height($("#c"+(settings.auto.target[0]+1)+"x"+(settings.auto.target[1]+1)).height()+sizej);
                        } else { $target.removeClass("s").hide(); settings.auto.sheet=[]; helpers.update($this); }
                    }
                });
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
            },
            // check only root
            checkonlyroot: function($this, _node, _notroot) {
                var settings = helpers.settings($this), ret = true;                
                if (_node.children) { for (var i in _node.children) { ret = ret && helpers.ref.checkonlyroot($this,_node.children[i],true); } }

                if (_notroot && _node.subtype=="ref") {
                    var t = settings.sheet[parseInt(_node.value.substr(1))-1][_node.value.charCodeAt(0)-65].type;
                    if (t=="graph" || t=="txt" || t=="img") { ret = false; }
                }

                return ret;
            },
            inside: function($this, _node) {
                var settings = helpers.settings($this)
                var ret = true;
                if (_node.children) { for (var i in _node.children) { if (!helpers.ref.inside($this,_node.children[i])) { ret = false; } } }
                if (_node.subtype=="ref" &&
                    ( _node.value.charCodeAt(0)-65>=settings.size[0] ||
                    ( parseInt(_node.value.substr(1))-1>=settings.size[1]) ) ) { ret = false; }
                return ret;
            },
            format : function(_ref, _val) {
                var ret;
                switch (parseInt(_val)) {
                    case 2 : ret = _ref[0]+"$"+_ref[1];         break;
                    case 3 : ret = "$"+_ref[0]+_ref[1];         break;
                    case 4 : ret = "$"+_ref[0]+"$"+_ref[1];     break;
                    default: ret = _ref;
                }
                return ret;
            },
            update : function(_node, _i, _j) {
                if (_node.children) { for (var i in _node.children) { helpers.ref.update(_node.children[i],_i,_j); } }
                if (_node.subtype=="ref") {
                    var ref = [ _node.value.charCodeAt(0)-65, parseInt(_node.value.substr(1)) ];
                    switch (parseInt(_node.id[3])) {
                        case 1 : ref[0]+=_i; ref[1]+=_j; break;
                        case 2 : ref[0]+=_i; break;
                        case 3 : ref[1]+=_j; break;
                        default: break;
                    }
                    _node.value     = String.fromCharCode(65+ref[0])+ref[1];
                    _node.abstract  = helpers.ref.format(_node.value,_node.id[3])
                }
            }
        },
        graph: function($this, _val, _ratio) {
			var hh=48, ww=Math.floor(48*_ratio);
            var ret = "<svg xmlns:svg='http://www.w3.org/2000/svg' xmlns='http://www.w3.org/2000/svg' version='1.0' "+
                    "width='100%' height='100%' viewBox='0 0 "+ww+" "+hh+"' preserveAspectRatio='none' class='graph "+_val.type+"'>"+
                    "<def><style>.graph .up {fill:green} .graph .down {fill:red;} "+
                    ".graph path.l {fill:none;stroke:black;stroke-width:0.5px;} .graph path.b {fill:#AEF;} "+
                    ".graph path.d {fill:none;stroke:black;stroke-width:1px;} "+
					".graph line.grid {fill:none;stroke:#dd8833;stroke-width:0.2px; } "+
                    "</style></def>";

			// GET VALUES (AND COMPUTE THEM IF NECESSARY)
            var value = [];		// NUMERIC VALUES
			var label = [];		// LABEL VALUES
            for (var i in _val.data) {
                var mini = Math.min( _val.data[i][0].charCodeAt(0)-64, _val.data[i][1].charCodeAt(0)-64 );
                var minj = Math.min( parseInt(_val.data[i][0].substr(1)), parseInt(_val.data[i][1].substr(1)) );
                var maxi = Math.max( _val.data[i][0].charCodeAt(0)-64, _val.data[i][1].charCodeAt(0)-64 );
                var maxj = Math.max( parseInt(_val.data[i][0].substr(1)), parseInt(_val.data[i][1].substr(1)) );

                var v = { min:0, max:0, sum:0, val:[]}, first = true;
                for (var jj=minj; jj<=maxj; jj++) for (var ii=mini; ii<=maxi; ii++) {
                    var content = helpers.content($this,ii-1,jj-1);
                    $this.find("#c"+ii+"x"+jj+">div").html(content);
					
					if (typeof(content) == "number")
					{
						vv = parseFloat(content);
						vv = isNaN(vv)?0:vv;
						if (first || vv<v.min) { v.min = vv; }
						if (first || vv>v.max) { v.max = vv; }
						first = false;
						v.sum+=vv;
						v.val.push(vv);
					}
					else
					{
						label.push(content);
					}
                }
                value.push(v);
            }

			// PREPARE GRAPH (h is the height, a is the x-axis ratio position, nb is the number of values )
			if (v.max>0) { v.max = v.max*1.1; } else { v.max = v.max/1.1; }
            var v = value[0], h, a, nb=v.val.length;
            if (v.min>0) { h = v.max;       a = 0; } else
            if (v.max<0) { h = -v.min;      a = 1; } else
                         { h = v.max-v.min; a = h?Math.abs(v.min)/h:0; }
			if (h) {
				if (_val.grid) {
					if (_val.grid[0]) { }
					else
					if (_val.grid[1]) {
						var yy=Math.floor(v.min/_val.grid[1] -1)*_val.grid[1];
						for (var i=0; i<h/_val.grid[1]+2; i++) {
							ret+="<line x1='0' x2='"+ww+"' y1='"+hh*(1-a-(yy+i*_val.grid[1])/h)+"' "+
								 "y2='"+hh*(1-a-(yy+i*_val.grid[1])/h)+"' class='grid'/>";
						}
					}
				}

				// DRAW GRAPH
				switch (_val.type) {
					case "bar":
						for (var i=0; i<nb; i++) {
							var th = Math.abs(v.val[i]);
							ret+="<rect class='"+(v.val[i]>0?"up":"down")+"' x='"+(ww*i/nb)+"' width='"+(ww/nb)+"' ";
							ret+="y='"+((v.val[i]>0?(1-a-th):(1-a))*hh/h+hh)+"' height='"+th*hh/h+"'/>";
						}
						break;
					case "fct":
						var path = [];
						for (var i=0; i<nb; i++) {
							path.push([ww*i/(nb-1), hh*(1-a-(v.val[i]/h))]);
						}
						ret+="<path class='b' d='M ";
						for (var i in path) { ret+=path[i][0]+","+path[i][1]+" "; }
						ret+=" "+ww+","+((1-a)*hh)+" 0,"+((1-a)*hh)+"'/>";
						ret+="<path class='l' d='M ";
						for (var i in path) { ret+=path[i][0]+","+path[i][1]+" "; }
						ret+="'/>";
						break;
				}

				// DRAW AXIS
				ret+="<path class='d' d='M 0,"+((1-a)*hh)+" "+ww+","+((1-a)*hh)+"'/>";
				ret+="<path class='d' d='M 0,0 0,"+hh+"'/>";
			}

            ret+="</svg>";
            return ret;
        },
        content: function($this, _i, _j) {
            var settings = helpers.settings($this);
            var cell = settings.sheet[_j][_i];

            if ($this.find("#target").hasClass("s") &&
                _i>=settings.auto.target[0] && _i<=settings.auto.target[0]+settings.auto.size[0] &&
                _j>=settings.auto.target[1] && _j<=settings.auto.target[1]+settings.auto.size[1] &&
                settings.auto.sheet[_j][_i] ) {
                cell = settings.auto.sheet[_j][_i];
            }
            var type = cell.type;
            cell.tmp = cell.value;
            if (settings.dev&&typeof(cell.result)!="undefined"&&cell.result.toString().length) { cell.tmp = cell.result; }
            switch(type) {
                case "img" :
                    cell.tmp = cell.tmp.toString().length ? "<img src='"+settings.imgprefix+settings.img[cell.tmp]+".svg'/>":"";
                    break;
                case "math":
                    if (cell.tmp.process) { cell.tmp = cell.tmp.process(); }
                    break;
                case "txt":
                    cell.tmp = cell.tmp.toString().length?settings.txt[cell.tmp]:"";
                    break;
                case "fixed" :
                    if (settings.po && settings.po[cell.tmp]) { cell.tmp = settings.po[cell.tmp]; }
                    cell.tmp =helpers.format(cell.tmp.toString());
                    break;
                case "graph" :
                    cell.tmp = helpers.graph($this,cell.tmp,cell.size[0]/cell.size[1]);
                    break;
            }
            cell.update = true;
            return cell.tmp;
        },
        value: function($this, _i, _j, _attr, _default) {
            var settings = helpers.settings($this);
            var ret = _default;
            if (settings.all&&typeof(settings.all[_attr])!="undefined") {
                ret = settings.all[_attr];
            }
            if (settings.rows&&settings.rows["row"+_j]&&typeof(settings.rows["row"+_j][_attr])!="undefined") {
                ret = settings.rows["row"+_j][_attr];
            }
            if (settings.cols&&settings.cols["col"+_i]&&typeof(settings.cols["col"+_i][_attr])!="undefined") {
                ret = settings.cols["col"+_i][_attr];
            }

            for (var i in settings.fill) {
                var elt = settings.fill[i];
                if (typeof(elt[_attr])!="undefined"&&
                    _i>=elt.cell[0]&&_i<elt.cell[0]+elt.cell[2]&&_j>=elt.cell[1]&&_j<elt.cell[1]+elt.cell[3]) {
                    if ($.isArray(elt[_attr])) {
                        var index = ((_i-elt.cell[0])+(_j-elt.cell[1])*elt.cell[2])%elt[_attr].length;
                        ret = elt[_attr][index];
                    }
                    else {
                        ret = elt[_attr];
                    }
                }
            }
            if (settings.cells&&settings.cells["c"+_i+"x"+_j]&&typeof(settings.cells["c"+_i+"x"+_j][_attr])!="undefined") {
                ret = settings.cells["c"+_i+"x"+_j][_attr];
            }
            return ret;
        },
        // Clone a cell value
        clone: function(_cell) {
            var ret = $.extend(true,{},_cell);
            if (ret.type=="math") { ret.value = ret.value.clone(); }
            return ret;
        },
        // Update the grid
        update:function($this) {
            var settings = helpers.settings($this);
            var auto = $this.find("#target").hasClass("s");
            for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
                settings.sheet[j][i].update = false;
                if (auto && settings.auto.sheet[j][i]) { settings.auto.sheet[j][i].update = false; }
            }
            for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
                $this.find('#c'+(i+1)+'x'+(j+1)+'>div').html(helpers.content($this,i,j));
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
            $this.find("#screen>div").html(value);
        },
        reference: function($this, value) {
            var settings = helpers.settings($this);
            settings.reference=value;
            for (var i in settings.mathnodes) {
                var n = settings.mathnodes[i];
                if (n.subtype=="ref") {
                    n.value     = value;
                    n.abstract  = helpers.ref.format(value, n.id[3]);
                    $this.find("."+n.id+" .label").html(n.label());
                }
            }
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
                    sheet           : [],       // take care : sheet[0][0] and cells["c1x1"] are A1.
					tabs       		: ["calc","img","math","txt","graph"],
                    calculator      : "",
                    countbar        : 0,
                    timers          : { clear:0 },
                    target          : 0,
                    mathnodes       : [],
                    wrong           : 0,
                    tipid           : 0,
                    auto            : { origin:[], target:[], sheet:[], size:[] },
					edit			: { id: 0 }
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
                if (settings.edit) {
                    for (var i in settings.tabs) { $this.find("#tab"+settings.tabs[i]).show(); } }
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            },
            auto: function(event) {
                var $this = $(this) , settings = helpers.settings($this);
                var target = settings.sheet[parseInt(settings.target[2]-1)][parseInt(settings.target[1]-1)];

                if (typeof(target.value)!="undefined" && target.value.toString().length) {
                    var $target = $this.find("#target").addClass("s");

                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                  event.originalEvent.touches[0]:event;
                    settings.auto.origin = [ vEvent.clientX, vEvent.clientY ];
                    settings.auto.target = [ parseInt(settings.target[1]-1), parseInt(settings.target[2]-1) ];
                    settings.auto.sheet = new Array(settings.size[1]);
                    for (var i=0; i<settings.size[1]; i++) { settings.auto.sheet[i]=new Array(settings.size[0]); }
                    settings.auto.sheet[settings.auto.target[1]][settings.auto.target[0]]=helpers.clone(target);
                }
            },
            cell: function(_cell) {
                var $this = $(this) , settings = helpers.settings($this);
				
				if (_cell && settings.edit) {
                    $this.calc("onedit","cell",_cell);
				}
				
                var $target = $this.find("#target");
                if (settings.interactive && !$target.hasClass("s")) {
                    if (_cell) {
                        var target=$(_cell).attr("id").match(/c([0-9]*)x([0-9]*)/);
                        if ($this.find("#echange").hasClass("s")) {
                            $this.find("#echange").removeClass("s");
                            helpers.reference($this, String.fromCharCode(64 + parseInt(target[1]))+target[2]);
                        }
                        else if ($this.find("#graphvalues .ref.s").length) {
                            $this.find("#graphvalues .ref.s").removeClass("s").html(String.fromCharCode(64 + parseInt(target[1]))+target[2]);
                        }
                        else {
                            var c=settings.sheet[parseInt(target[2]-1)][parseInt(target[1]-1)];
                            if (settings.target[0]!=target[0] || settings.dev) {
                                settings.target=target;

                                $this.find("#pimg .icon").removeClass("s");
                                $this.find("#ptxt>div").removeClass("s");
                                $this.find("#editor").editor('clear');
                                $this.find("#graphmenu .icon").removeClass("s");
                                $this.find("#graphvalues .line").hide();
                                helpers.key($this, 'c', false);
                                
                                if (settings.dev) {
                                    helpers.devcell($this, target[1], target[2], settings.cells?settings.cells["c"+target[1]+"x"+target[2]]:0); }

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
                                        case "graph" :
                                            tab = "graph";
                                            $this.find("#graphmenu #g"+c.value.type).addClass("s");
                                            $this.find("#graphvalues .line").each(function(_index) {
                                                if (_index<graphType[c.value.type].label.length) {
                                                    $(this).show().find(".label").html(graphType[c.value.type].label[_index]);
                                                    if (_index<c.value.data.length) {
                                                        $this.find(".ref").first().html(c.value.data[_index][0]);
                                                        $this.find(".ref").first().next().html(c.value.data[_index][1]);
                                                    }
                                                }
                                            });
                                            break;
                                        case "fixed":
                                            break;
                                        default:
                                            var value = c.value.toString();
                                            if (value.length==0 || (value.length==1&&value[0]=='-')) { value="0"; }
                                            $this.find("#screen>div").html(value);
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
							
						
							
							$target.css("left",(settings.margin[0]+c.pos[0])+"em").css("top",(settings.margin[1]+c.pos[1])+"em");
							
							
							$target.css("width",c.size[0]+"em").css("height",c.size[1]+"em");
							
							
                            $this.find("#panel").show();

                        }
                    }
                    else {
                        $target.hide();
                        $this.find("#panel").hide();
                        if (settings.dev) { $this.find("#detail .detdiv").hide(); }
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
            graph: function(_val) {
                var $this = $(this);
                $this.find("#graphmenu .icon").removeClass("s");
                $this.find("#graphmenu #g"+_val).addClass("s");
                $this.find("#graphvalues .line").each(function(_index) {
                    if (_index<graphType[_val].label.length) {
                        $(this).show().find(".label").html(graphType[_val].label[_index]);
                    }
                    else { $(this).hide(); }
                });
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
                else if ($this.find("#tabgraph").hasClass("s")) {
                    ok = false;
                    var g = $this.find("#graphmenu .icon.s");
                    if (typeof(g.attr("id"))!="undefined") {
                        var v = g.attr("id").substr(1);
                        var val = {type:v, data:[]};
                        ok = true;
                        for (var ii=0; ii<graphType[v].label.length; ii++) {
                            var l = $($this.find("#graphvalues .line").get(ii));
                            var v1 = l.find(".ref").first().text();
                            var v2 = l.find(".ref").first().next().text();
                            if (!v1.length || !v2.length) { ok = false; }
                            if (graphType[v].line[ii] && v1[0]!=v2[0] && v1[1]!=v2[1]) { ok = false; }
                            val.data.push([v1,v2]);
                        }
                        if (ok) {
                            settings.sheet[j][i].type = "graph";
                            settings.sheet[j][i].value = val;
                        }
                    }
                }

                if (ok) {
                    helpers.update($this);

                    if (settings.dev) { helpers.devcell($this, i+1,j+1,settings.sheet[j][i], true); }
                    else {
                        var cell=0;
						var n = settings.toright?[1,0]:[0,1];
                        if (!settings.nonext && i+n[0]<settings.size[0] && j+n[1]<settings.size[1] &&
                             settings.sheet[j+n[1]][i+n[0]].type!="hide" && !settings.sheet[j+n[1]][i+n[0]].fixed) {
                            cell=$this.find("#c"+(parseInt(settings.target[1])+n[0])+
											"x"+(parseInt(settings.target[2])+n[1]));
                        }
                        $this.calc("cell",cell);
                    }
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
                                var uservalue = r.value;
                                if (r.type=="math") { uservalue = $this.find("#c"+(i+1)+"x"+(j+1)).text(); }
								if (settings.emptyisnull && uservalue.toString().length==0) { uservalue=0; }
								
                                if (r.result.toString()!=uservalue.toString()) {
                                    error++;
                                    $this.find("#c"+(i+1)+"x"+(j+1)).addClass("wrong");
                                }
                            }
                        }
                        $this.find("#subvalid").hide();
                        $this.find("#sub"+(error?"wrong":"good")).show();

                        settings.score = 5 - error*settings.errratio - settings.wrong;
                        if (settings.score<0) { settings.score = 0; }
                        $this.find(error==0?"#good":"#wrong").show();
                        setTimeout(function() { helpers.end($this); } , 2000);
                    }
                }
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
            },
			onedit: function(_type, _elt) {
                var $this = $(this) , settings = helpers.settings($this);
				if (_elt) {
					var type=["all","col","row"];
					if (_type=="all") { _type=type[(settings.edit.id++)%type.length]; }
					if (settings.context && settings.context.onedit) {
						settings.context.onedit($this, { type:_type, pos:$(_elt).attr("id").substr(1).split("x")});
					}
				}
			}
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in calc plugin!'); }
    };
})(jQuery);

