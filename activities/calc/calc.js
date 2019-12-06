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
	    size        : 0,	    						// Minimum size
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
        "\\\[br\\\]",                               "<br style='clear:both'/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[green\\\]([^\\\[]+)\\\[/green\\\]",    "<span style='color:green'>$1</span>",
        "\\\[purple\\\]([^\\\[]+)\\\[/purple\\\]",  "<span style='color:purple'>$1</span>",
        "\\\[orange\\\]([^\\\[]+)\\\[/orange\\\]",  "<span style='color:orange'>$1</span>",
        "\\\[strong\\\](.+)\\\[/strong\\\]",        "<div class='strong'>$1</div>",
        "\\\[img\\\]([^\\\[]+)\\\[/img\\\]",        "<div class='image'><img src='$1.svg'/></div>",
        "\\\[img ([^\\\]]+)\\\]([^\\\[]+)\\\[/img\\\]",        "<div class='image' style='background-image:url(\"$1.svg\")'><img src='$2.svg'/></div>",
        "\\\[icon\\\]([^\\\[]+)\\\[/icon\\\]",      "<div class='img'><div class='icon'><img src='$1.svg'/></div></div>",
        "\\\[icon([0-9]+)\\\]([^\\\[]+)\\\[/icon[0-9]*\\\]",    "<div class='icon' style='float:left;font-size:$1em;'><img src='$2.svg'/></div>",
        "\\\[tiny\\\]([^\\\[]+)\\\[/tiny\\\]",    "<span style='font-size:0.5em'>$1</span>"
    ];

    var graphType = {
        pie : { label: ["X"], line: [ false ] },
        bar : { label: ["X"], line: [ true ] },
        fct : { label: ["X"], line: [ true ] },
		fct2: { label: ["X","Y"], line: [ true ] }
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
        end: function($this, _args) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this,_args);
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
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.neditor($this); });
            },
			neditor: function($this) {
				jtools.addon.neditor.init(function() { helpers.loader.build($this); });
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
                $this.find("#ccneditor").neditor({
					onupdate:function($editor, _root) {
					},
                    getnode:function($editor, _val) {
						return _val<settings.cvalues.length?$.extend(true,{},settings.cvalues[_val]):jtools.math.symbology.get(0);
					}
                });
                // Fill math operator
                var isRef = false;
                for (var i in settings.math) {
					var vNode = jtools.math.symbology.get(settings.math[i]);
					var vClass=(vNode.op&&vNode.op[0]?"nedita nedittree":"nedita")+" nedit"+vNode.ty;
					
					if (vNode.va.toString().substr(0,2)=="cc") {
						isRef = true;
						if (!vNode.ccref) { vNode.ccref = settings.reference; }
						vNode.la = (vNode.va[2]=='$'?'$':'')+vNode.ccref[0]+
						           (vNode.va[3]=='$'?'$':'')+vNode.ccref.substr(1);
						vNode.eq = function(_a) {
							var ii = this.ccref.charCodeAt(0)-65;
							var jj = parseInt(this.ccref.substr(1))-1;
							var cell = settings.sheet[jj][ii];
							return helpers.content($this,ii,jj);
						}
						vClass+=" neditref";
					}
					else { vNode.ccref = 0; }
					
					var vLabel = jtools.num.tostr(vNode.la?vNode.la:vNode.va);
					var vLen = vLabel.toString().length;
			
					settings.cvalues.push(vNode);
					
					var $elt=$("<div class='"+vClass+"' id='"+i+"'><div class='neditlabel'>"+vLabel+"</div></div>");
					if (vLen>2) { $elt.find(".neditlabel").css("font-size",(1.5/vLen)+"em").css("padding-top",(Math.pow(vLen,1.6)/15)+"em"); }
					$this.find("#ccmelts").append($elt);
					$elt.draggable({containment:$this, helper:"clone", appendTo:$this.find("#ccneditor")});
					
                }
                if (settings.nocellref || !isRef ) { $this.find("#ccpick").detach(); }

                // handle tabs and panel
                $this.find("#ccpimg").css("font-size",settings.imgsize+"em");
                for (var i in settings.img) {
                    var html="<div id='img"+i+"' class='icon'";
                    html+=' onmousedown=\'$(this).closest(".calc").calc("img",this);\'';
                    html+=' ontouchstart=\'$(this).closest(".calc").calc("img",this);event.preventDefault();\'';
                    html+="><img src='"+settings.imgprefix+settings.img[i]+".svg' alt=''/></div>";
                    $this.find("#ccpimg").append(html);
                }
                $this.find("#ccpanel").draggable({handle:"#ccmove",containment:$this,
					stop: function( event, ui ) {
						// CONVERT PX TO RELATIVE UNITS
						$this.find("#ccpanel").css("width","6em").css("height","8em")
							.css("left",Math.round(100*($this.find("#ccpanel").offset().left-$this.offset().left)/$this.width())+"%")
							.css("top",Math.round(100*($this.find("#ccpanel").offset().top-$this.offset().top)/$this.height())+"%");
					}
				}).css("position","absolute");
                
                $this.find("#ccptxt").css("font-size",settings.txtsize+"em");
                for (var i in settings.txt) {
                    var html="<div id='txt"+i+"' class='"+settings.txtstyle+"'";
                    html+=' onmousedown=\'$(this).closest(".calc").calc("txt",this);\'';
                    html+=' ontouchstart=\'$(this).closest(".calc").calc("txt",this);event.preventDefault();\'';
                    html+=">"+settings.txt[i]+"</div>";
                    $this.find("#ccptxt").append(html);
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
				if (!settings.size) { settings.size = [1,1]; }
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
                    $this.find("#g_instructions").html("");
                    for (var i in settings.exercice) { $this.find("#g_instructions").append(
                        "<p>"+(settings.exercice[i].length?helpers.format(settings.exercice[i]):"&#xA0;")+"</p>"); }
                } else { $this.find("#g_instructions").html(helpers.format(settings.exercice)); }
                $this.find("#g_instructions").css("font-size",(0.4*settings.fontex)+"em");

                if (!$this.find("#g_splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        build: function($this) {
            var settings = helpers.settings($this);
                var $board = $this.find("#cccontent");
                $board.html("").css("font-size", settings.font+"em");
				$this.find("#target").css("font-size", settings.font+"em");
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }
            
                // HANDLE THE TIPS
                if (settings.tips) {
                    $this.find("#g_tbutton>div").html(settings.tips.length).parent().show();
                    $this.find("#g_tip .g_tnum1").addClass("s");
                }
            
                // the bars
                var w       = helpers.value($this,0,0,"width",1.2);
                var h       = helpers.value($this,0,0,"height",1.2);
                var width   = w;
                var height  = h;
                var html    = "";
                
                html = '<div id="c0x0" class="ccelt g" style="width:'+w+'em;height:'+h+'em;top:'+settings.margin[1]+'em;left:'+settings.margin[0]+'em;" ';
                if (settings.edit) {
                    html+='onmousedown=\'$(this).closest(".calc").calc("onedit","all",this);\' ';
                    html+='ontouchstart=\'$(this).closest(".calc").calc("onedit","all",this);event.preventDefault();\' ';
                }
                html+= '></div>';
                $board.append(html);
				width+=settings.sp;
				height+=settings.sp;
                for (var i=0; i<settings.size[0]; i++) {
                    w = helpers.value($this,(i+1),0,"width",2);
                    h = helpers.value($this,(i+1),0,"height",1.2);
                    html = '<div id="c'+(i+1)+'x0" class="ccelt g" style="top:'+settings.margin[1]+'em;left:'+(settings.margin[0]+width)+'em;width:'+w+'em;height:'+h+'em;" ';
                    if (settings.edit) {
                        html+='onmousedown=\'$(this).closest(".calc").calc("onedit","col",this);\' ';
						html+='ontouchstart=\'$(this).closest(".calc").calc("onedit","col",this);event.preventDefault();\' ';
                    }
                    html+= '>'+(settings.withbars?String.fromCharCode(65 + i):"")+'</div>';
                    $board.append(html);
                    width+=w+settings.sp;
                }
                    
                for (var j=0; j<settings.size[1]; j++) {
                    w = helpers.value($this,0,(j+1),"width",1.2);
                    h = helpers.value($this,0,(j+1),"height",1.2);
                    html = '<div id="c0x'+(j+1)+'" class="ccelt g" style="top:'+(settings.margin[1]+height)+'em;left:'+settings.margin[0]+'em;width:'+w+'em;height:'+h+'em;" ';
                    if (settings.edit) {
                        html+='onmousedown=\'$(this).closest(".calc").calc("onedit","row",this);\' ';
						html+='ontouchstart=\'$(this).closest(".calc").calc("onedit","row",this);event.preventDefault();\' ';
                    }
                    html+='>'+(settings.withbars?(j+1):"")+'</div>'
                    $board.append(html);
                    height+=h+settings.sp;
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
						s = settings.sheet[j][i];
                        
                        var type = helpers.value($this,(i+1),(j+1),"type","");
                        if (type.length) { s.type = type; }

                        s.fixed  = helpers.value($this,(i+1),(j+1),"fixed",(type=="free"));
                        s.value  = helpers.value($this,(i+1),(j+1),"value","");
                        s.result = helpers.value($this,(i+1),(j+1),"result","");
                        s.opt    = helpers.value($this,(i+1),(j+1),"opt","");
                        s.bgimg  = helpers.value($this,(i+1),(j+1),"bgimg","");
                        
                        if (s.type=="math" && s.value) {
                            s.value = jtools.math.symbology.get(s.value);
							s.value.ea(function(_n) {
								if (_n.va.toString().substr(0,2)=="cc" && _n.ccref) {
									_n.la = (_n.va[2]=='$'?'$':'')+_n.ccref[0]+
											(_n.va[3]=='$'?'$':'')+_n.ccref.substr(1);
									_n.eq = function(_a) {
										var ii = this.ccref.charCodeAt(0)-65;
										var jj = parseInt(this.ccref.substr(1))-1;
										return helpers.content($this,ii,jj);
									};
								}
							});
                        }
                    }
                }
                
                var height= helpers.value($this,0,0,"height",1.2)+settings.sp;
                for (var j=0; j<settings.size[1]; j++) {
                    var width = helpers.value($this,0,0,"width",1.2)+settings.sp;
                    for (var i=0; i<settings.size[0]; i++) {
                        w = helpers.value($this,(i+1),(j+1),"width",2);
                        h = helpers.value($this,(i+1),(j+1),"height",1.2);
						s = settings.sheet[j][i];

                        if (s.type!="hide") {
                            var vClass="ccelt "+s.type;
                            if (s.opt) { vClass+=" "+s.opt; }
							s.pos = [width,height];
							s.size = [w,h];
                            html = '<div class="'+vClass+'" style="top:'+(settings.margin[1]+height)+'em;left:'+(settings.margin[0]+width)+'em;width:'+w+'em;'+
                                'height:'+h+'em;background-color:'+helpers.value($this,(i+1),(j+1),"background","white")+';'+
                                (s.bgimg?"background-image:url('"+s.bgimg+"');":"")+
                                'color:'+helpers.value($this,(i+1),(j+1),"color","black")+';" ';
                            html+='id="c'+(i+1)+'x'+(j+1)+'" ';
                            if (!s.fixed || settings.edit) {
                                html+='onmousedown=\'$(this).closest(".calc").calc("cell",this);\' ';
                                html+='ontouchstart=\'$(this).closest(".calc").calc("cell",this);event.preventDefault();\' ';
                            }
                            html+='><div></div></div>';
                            $board.append(html);
                        }
                        width+=helpers.value($this,(i+1),0,"width",2)+settings.sp;
                    }
                    height+=helpers.value($this,0,(j+1),"height",1.2)+settings.sp;
                }
				helpers.update($this);
				
				// PANEL PREPARE
				$this.find("#ccpanel").css("top", settings.pospanel[1]+"%").css("left", settings.pospanel[0]+"%");


                // TODO: HANDLE AUTOMATIC SELECT (rebuild)
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

                        $this.find("#ccpanel").hide();

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
								var o = settings.sheet[settings.auto.target[1]+j][settings.auto.target[0]+i];
								c.pos = [o.pos[0], o.pos[1]];

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
        graph: function($this, _val, _ratio) {
			var h48=48, w48=Math.floor(h48*_ratio);
            var ret = "<svg xmlns:svg='http://www.w3.org/2000/svg' xmlns='http://www.w3.org/2000/svg' version='1.0' "+
                    "width='100%' height='100%' viewBox='0 0 "+w48+" "+h48+"' preserveAspectRatio='none' class='ccgraph cc"+_val.type+"'>"+
                    "<def><style>.ccgraph .up {fill:green} .ccgraph .down {fill:red;} "+
                    ".ccgraph path.l {fill:none;stroke:black;stroke-width:0.5px;} .ccgraph path.b {fill:#AEF;} "+
                    ".ccgraph path.d {fill:none;stroke:black;stroke-width:0.5px;} "+
					".ccgraph line.grid {fill:none;stroke:#dd8833;stroke-width:0.1px; opacity:0.5; } "+
					".ccgraph line.grid2 {fill:none;stroke:#dd8833;stroke-width:0.4px; opacity:0.5; } "+
					".ccgraph text {font-size:2px; } "+
                    "</style></def>";

			// GET VALUES (AND COMPUTE THEM IF NECESSARY)
            var value = [];		// NUMERIC VALUES
			var label = [];		// LABEL VALUES
            for (var i=0; i<_val.data.length; i++) {
                var mini = Math.min( _val.data[i][0].charCodeAt(0)-64, _val.data[i][1].charCodeAt(0)-64 );
                var minj = Math.min( parseInt(_val.data[i][0].substr(1)), parseInt(_val.data[i][1].substr(1)) );
                var maxi = Math.max( _val.data[i][0].charCodeAt(0)-64, _val.data[i][1].charCodeAt(0)-64 );
                var maxj = Math.max( parseInt(_val.data[i][0].substr(1)), parseInt(_val.data[i][1].substr(1)) );

                var v = { min:0, max:0, val:[]}, first = true;
				
				if (_val.init && i<_val.init.length) {
					v.min = _val.init[i];
					v.max = _val.init[i];
					first = false;
					v.val.push(_val.init[i]);
				}
				
                for (var jj=minj; jj<=maxj; jj++) for (var ii=mini; ii<=maxi; ii++) {
                    var content = helpers.content($this,ii-1,jj-1);
					
					if (!isNaN(content))
					{
						vv = parseFloat(content);
						if (first || vv<v.min) { v.min = vv; }
						if (first || vv>v.max) { v.max = vv; }
						first = false;
						v.val.push(vv);
					}
					else
					{
						label.push(content);
					}
                }
                value.push(v);
            }
			
			if (_val.max) { value[0].max = _val.max; }
			
			// PREPARE Y-AXIS VALUES
			var nb = value[0].val.length;
			if (value.length==1) {
				var v = { min:0, max:nb-1, val:[]};
				for (var i=0; i<nb; i++) { v.val.push(i); }
				value.push(v);
			}
			else { nb = Math.min(nb,value[1].val.length); }
			
			var v0 = value[0], v1 = value[1];
			if (v0.max>0) { v0.max = v0.max*1.1; }
			if (v0.min<0) { v0.min = v0.min*1.1; }
			var xpos, ypos=0, vh, vw = v1.max-v1.min;
			if (v0.min>0) { vh = v0.max;        xpos = 1; } else
            if (v0.max<0) { vh = -v0.min;       xpos = 0; } else
                          { vh = v0.max-v0.min; xpos = vh?1-Math.abs(v0.min)/vh:1; }
			if (v1.min>0 || v1.max<0) { ypos = -vw; }
			if (v1.min<0 && v1.max>0) { ypos = Math.abs(v1.min)/vw; }
			
			if (vh) {
				// DRAW GRAPH
				switch (_val.type) {
					case "bar":
						for (var i=0; i<nb; i++) {
							var th = Math.abs(value[0].val[i]);
							ret+="<rect class='"+(value[0].val[i]>0?"up":"down")+"' x='"+(w48*i/nb)+"' width='"+(w48/nb)+"' ";
							ret+="y='"+((value[0].val[i]>0?(xpos-th/vh):xpos)*h48)+"' height='"+th*h48/vh+"'/>";
						}
						break;
					case "fct":
					case "fct2":
						var path = [];
						var lastx, lasty;
						for (var i=0; i<nb; i++) {
							var tmpx = w48*(v1.val[i]-v1.min)/(v1.max-v1.min);
							var tmpy = h48*(xpos-(v0.val[i]/vh));
							if (!isNaN(tmpx) && !isNaN(tmpy)) {
								lastx = tmpx;
								lasty = tmpy;
								path.push( lastx+","+ lasty );
							}
						}
						ret+="<path class='b' d='M "+path.join(" ")+" "+lastx+","+(xpos*h48)+" 0,"+(xpos*h48)+"'/>";
						ret+="<path class='l' d='M "+path.join(" ")+"'/>";
						break;
				}
				
				if (_val.grid) {
					if (_val.grid[0]) {
						var xx=Math.floor(v1.min/_val.grid[0] -1)*_val.grid[0];
						for (var i=0; i<(vw/_val.grid[0])+2; i++) {
							var vClass="grid";
							if (_val.grid.length>2 && _val.grid[2] &&
								(jtools.num.round(xx+i*_val.grid[0])%_val.grid[2]==0)) { vClass="grid2"; }
							ret+="<line y1='0' y2='"+h48+"' x1='"+w48*(ypos+(xx+i*_val.grid[0])/vw)+"' "+
								 "x2='"+w48*(ypos+(xx+i*_val.grid[0])/vw)+"' class='"+vClass+"'/>";
						}
					}
					
					if (_val.grid[1]) {
						var yy=Math.floor(v0.min/_val.grid[1] -1)*_val.grid[1];
						for (var i=0; i<(vh/_val.grid[1])+2; i++) {
							var vClass="grid";
							if (_val.grid.length>3 && _val.grid[3] &&
								(jtools.num.round(yy+i*_val.grid[1])%_val.grid[3]==0)) { vClass="grid2"; }
							ret+="<line x1='0' x2='"+w48+"' y1='"+h48*(xpos-(yy+i*_val.grid[1])/vh)+"' "+
								 "y2='"+h48*(xpos-(yy+i*_val.grid[1])/vh)+"' class='"+vClass+"'/>";
						}
					}
				}
				
				
				if (label.length>0) { ret+="<g transform='translate(2,1)'><text transform='rotate(90)'>"+label[0]+"</text></g>"; }
				if (label.length>1) { ret+="<text transform='translate(47,47)' style='text-anchor:end'>"+label[1]+"</text>"; }

				// DRAW AXIS
				ret+="<path class='d' d='m 0,"+(xpos*h48)+" "+w48+",0'/>";
				ret+="<path class='d' d='m "+(ypos*w48)+",0 0,"+h48+"'/>";
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
            switch(type) {
                case "img" :
                    cell.tmp = cell.tmp.toString().length ? "<img src='"+settings.imgprefix+settings.img[cell.tmp]+".svg'/>":"";
                    break;
                case "math":
                    if (cell.tmp.eq) {
						cell.tmp = cell.tmp.eq();
						if (typeof(cell.tmp)=="number" && isNaN(cell.tmp)) { cell.tmp=""; }  }
                    break;
                case "txt":
                    cell.tmp = cell.tmp.toString().length?settings.txt[cell.tmp]:"";
                    break;
                case "free" :
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
				var c = jtools.num.tostr(jtools.num.round(helpers.content($this,i,j)));
                $this.find('#c'+(i+1)+'x'+(j+1)+'>div').html(c);
            }
        },
        // Handle the key input
        key: function($this, value, fromkeyboard) {
            var settings = helpers.settings($this);
			var vLen = settings.calculator.length;
			if (settings.calculator.indexOf(".")!=-1) { vLen--; }
            if (value==".") {
                if (!settings.nodec) {
                    if (settings.calculator.indexOf(".")==-1 && vLen<settings.callen) {
                        settings.calculator+=(vLen?"":"0")+"."; }
                }
            }
            else if (value=="c") { settings.calculator=""; }
            else if (value=="-") {
                if (!settings.noneg) {
                    if (vLen && settings.calculator[0]=='-')
                         { settings.calculator = settings.calculator.substr(1); }
                    else { settings.calculator = '-' + settings.calculator; }
                }
            }
            else if (value<='9'&&value>='0'&&vLen<settings.callen) {
                if (value=="0" && vLen<2 && settings.calculator[0]=='0' && settings.calculator.indexOf(".")==-1) {}
                else {
                    if (settings.calculator.length==1 && settings.calculator[0]=='0') { settings.calculator=""; }
                    settings.calculator+=value.toString();
                }
            }
            var value = settings.calculator;
            if (value.length==0 || (value.length==1&&value[0]=='-')) { value="0"; }
            $this.find("#ccscreen>div").html(value);
        },
        reference: function($this, value) {
            var settings = helpers.settings($this);
            settings.reference=value;
            for (var i in settings.cvalues) {
                var vNode = settings.cvalues[i];
				if (vNode.ccref) {
					vNode.ccref = settings.reference;
					vNode.la = (vNode.va[2]=='$'?'$':'')+settings.reference[0]+
						       (vNode.va[3]=='$'?'$':'')+settings.reference[1];
					var vLen = vNode.la.length;
					var $elt = $this.find("#ccmelts #"+i+" .neditlabel");
					$elt.html(vNode.la);
					if (vLen>2) { $elt.find(".neditlabel").css("font-size",(1.5/vLen)+"em").css("padding-top",(Math.pow(vLen,1.6)/15)+"em"); }
					
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
                    cvalues       : [],
                    wrong           : 0,
                    tipid           : 0,
                    auto            : { origin:[], target:[], sheet:[], size:[] },
					intern			: { id: 0 }
                };

                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);
					
					if (!options.edit) {
						$(document).keypress(function(_e) {
							if (_e.keyCode!=116) { helpers.key($this, String.fromCharCode(_e.which), true); _e.preventDefault(); } });
					}

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
                if (settings.edit) { $this.find("#ccmenu .icon").show(); }
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.end($this,{'status':'abort'});
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
				
				if (_cell && settings.edit) { $this.calc("onedit","cell",_cell); }
				
                var $target = $this.find("#target");
                if (settings.interactive && !$target.hasClass("s")) {
                    if (_cell) {
                        var target=$(_cell).attr("id").match(/c([0-9]*)x([0-9]*)/);
                        if ($this.find("#ccpick").hasClass("s")) {
                            $this.find("#ccpick").removeClass("s");
                            helpers.reference($this, String.fromCharCode(64 + parseInt(target[1]))+target[2]);
                        }
                        else if ($this.find("#ccgvalues .ccref.s").length) {
                            $this.find("#ccgvalues .ccref.s").removeClass("s").html(String.fromCharCode(64 + parseInt(target[1]))+target[2]);
                        }
                        else {
                            var c=settings.sheet[parseInt(target[2]-1)][parseInt(target[1]-1)];
							settings.target=target;

                            $this.find("#ccpimg .icon").removeClass("s");
                            $this.find("#ccptxt>div").removeClass("s");
                            if (c.type!="math") { 
							$this.find("#ccneditor").neditor('clear'); }
                            $this.find("#ccgmenu .icon").removeClass("s");
                            $this.find("#ccgvalues .ccline").hide();
                            helpers.key($this, 'c', false);
                                
                            if (settings.tabs.length) {
                                var tab=settings.tabs[0];

                                switch(c.type) {
                                    case "img":
                                        tab ="img";
                                        $this.find("#ccpimg #img"+c.value).addClass("s");
                                        break;
                                    case "math":
                                        tab ="math";
										var root = 0;
										if (c.value) {
											root = $.extend(true,{},c.value);
											root.ea(function(_n) { if (_n.mtelt) { _n.mtelt.detach(); _n.mtelt = 0; } });
										}
                                        $this.find("#ccneditor").neditor('clear',root);
                                        break;
                                    case "txt":
								        tab = "txt";
										$this.find("#ccptxt #txt"+c.value).addClass("s");
										break;
                                    case "graph" :
                                        tab = "graph";
                                        $this.find("#ccgmenu #g"+c.value.type).addClass("s");
                                        $this.find("#ccgvalues .ccline").each(function(_index) {
                                            if (_index<graphType[c.value.type].label.length) {
                                                $(this).show().find(".cclabel>div").html(graphType[c.value.type].label[_index]);
                                                if (_index<c.value.data.length) {
                                                    $(this).find(".ccref").first().html(c.value.data[_index][0]);
                                                    $(this).find(".ccref").first().next().html(c.value.data[_index][1]);
                                                }
                                            }
                                        });
                                        break;
                                    case "free": tab = 0;
                                        break;
                                    default:
                                        var value = c.value.toString();
                                        if (value.length==0 || (value.length==1&&value[0]=='-')) { value="0"; }
                                        $this.find("#ccscreen>div").html(value);
                                        break;
                                }
                                $this.find("#cctools>div").hide();
                                $this.find("#ccmenu>div").removeClass("s");
						        if (tab) {
									$this.find("#cctools #ccp"+tab).show();
									$this.find("#ccmenu #tab"+tab).addClass("s");
								}
                            }
                            $this.find("#ccmove").css("opacity",c.type=="math"?1:0);
                            $target.show();
							$target.css("left",(settings.margin[0]+c.pos[0])+"em").css("top",(settings.margin[1]+c.pos[1])+"em");
							$target.css("width",c.size[0]+"em").css("height",c.size[1]+"em");
                            $this.find("#ccpanel").show();

                        }
                    }
                    else {
                        $target.hide();
                        $this.find("#ccpanel").hide();
                    }
                }
            },
            tab: function(_tab, _elt) {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#ccmenu>div").removeClass("s");
                $(_elt).addClass("s");
                $this.find("#cctools>div").hide();
                $this.find("#"+_tab).show();
                $this.find("#ccmove").css("opacity",_tab=="pmath"?1:0);
            },
            img: function(_elt) {
                if ($(_elt).hasClass("s")) { $(this).calc("valid"); }
                else {
                    $(this).find("#ccpimg .icon").removeClass("s");
                    $(_elt).addClass("s");
                }
            },
            txt: function(_elt) {
                if ($(_elt).hasClass("s")) { $(this).calc("valid"); }
                else {
                    $(this).find("#ccptxt>div").removeClass("s");
                    $(_elt).addClass("s");
                }
			},
            graph: function(_val) {
                var $this = $(this);
                $this.find("#ccgmenu .icon").removeClass("s");
                $this.find("#ccgmenu #g"+_val).addClass("s");
                $this.find("#ccgvalues .ccline").each(function(_index) {
                    if (_index<graphType[_val].label.length) {
                        $(this).show().find(".cclabel>div").html(graphType[_val].label[_index]);
                    }
                    else { $(this).hide(); }
                });
            },
            key: function(value, _elt) {
                var $this = $(this);
                if (_elt) { $(_elt).addClass("g_ktouch");
                    setTimeout(function() { $(_elt).removeClass("g_ktouch"); }, 50);
                }
                helpers.key($(this), value, false);
            },
			cancel: function() {
                var $this = $(this) , settings = helpers.settings($this);
                //$this.find("#target").hide();
                $this.find("#ccpanel").hide();
				$this.find("#ccpick").removeClass("s");
				$this.find("#ccgvalues .ccref").removeClass("s");
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
                    settings.sheet[j][i].type = "img";
                    settings.sheet[j][i].value = parseInt($this.find("#ccpimg .icon.s").attr("id").replace("img",""));
                }
                else if ($this.find("#tabtxt").hasClass("s")) {
                    settings.sheet[j][i].type = "txt";
                    settings.sheet[j][i].value = parseInt($this.find("#ccptxt>div.s").attr("id").replace("txt",""));
                }
                else if ($this.find("#tabmath").hasClass("s")) {
					var root = $this.find("#ccneditor").neditor("getroot");
					
					if (root && root.isfull()) {
						// CHECK FOR LOOP
						var ref=[],cpt=0;
						root.ea(function(_n) { if (_n.ccref) { ref.push(_n.ccref); } });
						while(ref.length && ok) {
							var r = ref.pop();
							var ii = r.charCodeAt(0)-65;
							var jj = parseInt(r.substr(1))-1;
							if (ii==i && jj==j) {
								ok = false;
								$this.find("#g_effects").addClass("wrong");
								setTimeout(function() { $this.find("#g_effects").removeClass(); }, 1000);
							}
							else {
								var c = settings.sheet[jj][ii];
								if (c.type=="math") {
									c.value.ea(function(_n) { if (_n.ccref) { ref.push(_n.ccref); } });
								}
							}
							if (cpt++>100) { ok = false; }
						}
						
						if (ok) {
							$this.find("#ccneditor").neditor("clear");
							root.ea(function(_n) { if (_n.mtelt) { _n.mtelt = 0; } });
							settings.sheet[j][i].type = "math";
							settings.sheet[j][i].value = root;
						}
                    }
					else { ok = false; }
                }
                else if ($this.find("#tabgraph").hasClass("s")) {
                    ok = false;
                    var g = $this.find("#ccgmenu .icon.s");
                    if (typeof(g.attr("id"))!="undefined") {
                        var v = g.attr("id").substr(1);
                        var val = {type:v, data:[]};
                        ok = true;
                        for (var ii=0; ii<graphType[v].label.length; ii++) {
                            var l = $($this.find("#ccgvalues .ccline").get(ii));
                            var v1 = l.find(".ccref").first().text();
                            var v2 = l.find(".ccref").first().next().text();
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
					$this.find("#ccpick").removeClass("s");
					$this.find("#ccgvalues .ccref").removeClass("s");
                    helpers.update($this);
                    var cell=0;
					var n = settings.toright?[1,0]:[0,1];
                    if (!settings.nonext && i+n[0]<settings.size[0] && j+n[1]<settings.size[1] &&
                        settings.sheet[j+n[1]][i+n[0]].type!="hide" && !settings.sheet[j+n[1]][i+n[0]].fixed) {
                       cell=$this.find("#c"+(parseInt(settings.target[1])+n[0])+"x"+(parseInt(settings.target[2])+n[1]));
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
                        setTimeout(function() { $this.find(".ccelt").removeClass("empty");}, 1000);
                    }
                    else {
                    var error = 0;
                        for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
                            var r = settings.sheet[j][i];
							var resultval = r.result.toString();
                            if (resultval.length) {
                                var uservalue = r.value;
                                if (r.type=="math") {
									uservalue = $this.find("#c"+(i+1)+"x"+(j+1)).text();
									resultval = jtools.num.tostr(jtools.num.round(resultval));
								}
								if (settings.emptyisnull && uservalue.toString().length==0) { uservalue=0; }
								
                                if (resultval!=uservalue.toString()) {
                                    error++;
                                    $this.find("#c"+(i+1)+"x"+(j+1)).addClass("wrong");
                                }
                            }
                        }
						$this.find("#g_submit").addClass(error==0?"good":"wrong");
						$this.find("#g_effects").addClass(error==0?"good":"wrong");

                        settings.score = 5 - error*settings.errratio - settings.wrong;
                        if (settings.score<0) { settings.score = 0; }
                        
                        setTimeout(function() { helpers.end($this, {'status':'success','score':settings.score}); } , 2000);
                    }
                }
            },
            tip: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.tipid<settings.tips.length) {
                    $this.find("#g_tip .g_tnum"+(settings.tipid+1)).removeClass("s").addClass("f")
                         .find(".content").html(helpers.format(settings.tips[settings.tipid]));
                         
                    settings.tipid++;
                    $this.find("#g_tbutton>div").html(settings.tips.length-settings.tipid);
                    if (settings.tipid<settings.tips.length) { $this.find("#g_tip .g_tnum"+(settings.tipid+1)).addClass("s"); }
                    $this.find("#g_tvalid").hide();
                    $this.find("#g_tpop").css("opacity",1).show()
                         .animate({opacity:0},1000,function() { $(this).hide(); });
                    settings.wrong++;
                }
            },
			onedit: function(_type, _elt) {
                var $this = $(this) , settings = helpers.settings($this);
				if (_elt) {
					var type=["all","col","row"];
					var elt={};
					var pos = $(_elt).attr("id").substr(1).split("x");
					pos=[parseInt(pos[0]), parseInt(pos[1]) ];
						
					if (_type=="all") { _type=type[(settings.intern.id++)%type.length]; }
					if (_type=="all") { if (settings[_type]) { elt=settings[_type]; } }
					else {
						var elts = settings[_type+"s"];
						if (elts) {
							var id="c"+pos[0]+"x"+pos[1];
							if (_type=="col") { id="col"+pos[0]; } else
							if (_type=="row") { id="row"+pos[1]; }
							if (elts[id]) { elt = elts[id]; }
						}
					}
					
					if (_type=="cell") {
						var cell = settings.sheet[pos[1]-1][pos[0]-1];
						elt.type = cell.type;
						elt.value = cell.result?cell.result:cell.value;
						elt.fixed = cell.fixed;
						elt.result = (cell.result!=0);
						
						if (elt.type=="graph" ) { elt.value=JSON.stringify(elt.value); }
						if (elt.type=="math" ) { return; }
					}
					
					
					if (settings.context && settings.context.onedit) {
						settings.context.onedit($this, { type:_type, pos:pos, elt:elt});
					}
				}
			}
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in calc plugin!'); }
    };
})(jQuery);

