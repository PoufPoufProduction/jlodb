(function($) {
    // Activity default options
    var defaults = {
        name        : "mathcraft",                            // The activity name
        label       : "Mathcraft",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        clean       : true,                                     // Clean board between exercices
        font        : 1,                                        // Exerice font
        errratio    : 1,                                        // Error weight
        number      : 1,                                        // number of exercices
        debug       : true                                      // Debug mode
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
            for (var i=0; i<21; i++) {
                var vReg = new RegExp("\\\["+(i+1)+"\\\](.+)\\\[/"+(i+1)+"\\\]", "g");
                _text = _text.replace(vReg,"<span class='mtdata' id='d"+i+"'>$1</span>");
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

                // Build panel droppable
                $this.find("#mteditor").neditor({
                    onupdate:function($editor, _root) {
						$this.find("#mtsave").removeClass("s");
						if (_root) {
							svg = jtools.math.tree2svg(_root);
							var ratio = ($("#mtscreen").height()*svg.size[0])/($("#mtscreen").width()*svg.size[1]);
							$("#mtscreen>div").css("width",Math.min(100,ratio*100)+"%").html(svg.svg);
							$this.find("#mtsubmit").toggleClass("s",_root.isfull());
							$this.find("#mtexec").toggleClass("s",_root.isfull()&&_root.ty=="de");
						}
						else {
							$("#mtscreen>div").html("");
							$this.find("#mtsubmit").removeClass("s");
							$this.find("#mtexec").removeClass("s");
						}
                    },
                    getnode:function($editor, _val) { return _val<settings.cvalues.length?$.extend(true,{},settings.cvalues[_val]):jtools.math.symbology.get(0); }
					
                });

                if (settings.data) { settings.number = settings.data.length; }
                if (settings.gen) {
                    settings.data = [];
                    for (var i=0; i<settings.number; i++) { settings.data.push(eval('('+settings.gen+')')($this,settings,i)); }
                }
				
                // Locale handling

                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
                helpers.build($this);
            }
        },
		node: function(_id) {
			
			var getsameop = function(_n1, _n2) {
				var ops=[[0,0],[0,1],[1,0],[1,1]];
				var ret=0;
				for (var i in ops) {
					var ii = ops[i];
					if (_n1.op[ii[0]].cmp(_n2.op[ii[1]]) == 0 &&
						_n1.op[1-ii[0]].cmp(_n2.op[1-ii[1]]) != 0 ) { ret = ii; }
				}
				return ret;
			}
			
			
			var vret =  { ty:"de", ro:true, op:[null,null], va:_id, tt:_id, "mtla":"unknown",
				svg:function() {
					var svg = "<text y='"+jtools.math.svg.y+"' style='fill:red;'>"+this.mtla+"</text>";
					return { si:[this.mtla.length*1.1, 1, 0.5], svg:svg, pr:1 }; },
				mtpr: function() { return 0; }
			};
			
			var vmath = {
				"//2" : { mtla:"d1⊥d3 + d2⊥d3 => d1//d2",
						  mtpr: function() {
					var ret = 0;
					if (this.isfull() && this.op[0].va=="⊥" && this.op[1].va=="⊥") {
						var same = getsameop(this.op[0], this.op[1]);
						if (same) {
							ret = jtools.math.symbology.get({va:"//"});
							ret.op[0] = $.extend({},this.op[0].op[1-same[0]],{mtelt:0});
							ret.op[1] = $.extend({},this.op[1].op[1-same[1]],{mtelt:0});
						}
					}
					return ret;
				} },
				"//3" : { mtla:"d1//d3 + d2//d3 => d1//d2",
						  mtpr: function() {
					var ret = 0;
					if (this.isfull() && this.op[0].va=="//" && this.op[1].va=="//") {
						var same = getsameop(this.op[0], this.op[1]);
						if (same) {
							ret = jtools.math.symbology.get({va:"//"});
							ret.op[0] = $.extend({},this.op[0].op[1-same[0]],{mtelt:0});
							ret.op[1] = $.extend({},this.op[1].op[1-same[1]],{mtelt:0});
						}
					}
					return ret;
				} },
				"⊥//" : { mtla:"d1⊥d3 + d2//d3 => d1⊥d2",
						  mtpr: function() {
					var ret = 0;
					if (this.isfull() && this.op[0].va=="⊥" && this.op[1].va=="//") {
						var same = getsameop(this.op[0], this.op[1]);
						if (same) {
							ret = jtools.math.symbology.get({va:"⊥"});
							ret.op[0] = $.extend({},this.op[0].op[1-same[0]],{mtelt:0});
							ret.op[1] = $.extend({},this.op[1].op[1-same[1]],{mtelt:0});
						}
					}
					return ret;
				} }
			};
			
			return $.extend(true, {}, vret, vmath[_id]?vmath[_id]:{});

		},
        build: function($this) {
            var settings = helpers.settings($this);
            var data        = (settings.data?settings.data[settings.dataid]:settings);
            var values      = (settings.data&&settings.data[settings.dataid].values?settings.data[settings.dataid].values:settings.values);
            var exercice    = (settings.data&&$.isArray(settings.exercice)?
                                 settings.exercice[settings.dataid%settings.exercice.length]:settings.exercice);
            var figure      = (settings.data&&settings.data[settings.dataid].figure?settings.data[settings.dataid].figure:settings.figure);

            settings.cvalues = [];
			
			if (settings.clean && $this.find("#mteditor").neditor("getroot")) {
				$this.find("#mteditor").neditor("clear");
			}
			
			$this.find("#g_effects").removeClass();

            if (figure) {
                if (figure.url)        { $this.find("#figure").html("<img src='"+figure.url+"'/>"); } else
                if (figure.content)    {
                    switch(figure.type){
                    case "svg":
                        var svgContent = "<svg xmlns:svg='http://www.w3.org/2000/svg' xmlns='http://www.w3.org/2000/svg' "+
                            " width='100%' height='100%' viewBox='0 0 640 480'><def><style>"+
                            ".a { stroke-dasharray:8,8; }"+
                            ".l { fill:none; stroke:black; stroke-width:4px; stroke-linecap:round; }"+
                            ".s { fill:none; stroke:black; stroke-width:2px; stroke-linecap:round; }"+
                            ".p { fill:black; stroke:none; }"+
                            ".l.d { stroke:#dd8833; } .s.d { stroke:#dd8833; } .p.d { fill:#dd8833; }"+
                            ".blue { fill:#00F; } .red { fill:#F00; }"+
                            ".l.hl { stroke:red; stroke-width:6px !important; }"+
                            ".s.hl { stroke:red; stroke-width:3px !important; }"+
                            ".p.hl { fill:red !important; stroke:red; stroke-width:1px; }"+
                            "text { font-size:30px;} text.dd { fill:#dd8833} "+
                            "text.hl { fill:red !important; }"+
                            "</style></def><rect x='0' y='0' width='640' height='480' style='fill:white;'/>"+
                            figure.content+"</svg>";
                        var $figure = $this.find("#figure");

                        $figure.svg();
                        settings.svg = $figure.svg('get');
                        settings.svg.load(svgContent, { addTo: false, changeSize: true});
                    break;
                    case "txt":
                        $this.find("#figure").html(jtools.format(figure.content));
                    break;
                    default:
                        $this.find("#figure").html(figure.content);
                    break;
                    }
                }
            }

			$this.find("#exercice>div").html(helpers.format(jtools.instructions(exercice)));

			for (var i in values) {
				var vNode = jtools.math.symbology.get(values[i]);
				if (vNode.va.toString().substr(0,2)=="mt") {
					vNode = $.extend({}, vNode, helpers.node(vNode.va.toString().substr(2)));
				}
				helpers.pushelt($this, vNode);
            }
            
        },
		pushelt: function($this, _node) {
            var settings = helpers.settings($this);
			settings.cvalues.push(_node);
			var vId = settings.cvalues.length-1;
            var vClass=(_node.op&&_node.op[0]?"nedita nedittree":"nedita")+" nedit"+_node.ty;
			var vLabel = _node.la?_node.la:_node.va;
			var vLen = vLabel.toString().length;
            var $elt=$("<div class='"+vClass+"' id='"+vId+"'><div class='neditlabel'>"+vLabel+"</div></div>");
			if (vLen>2) { $elt.find(".neditlabel").css("font-size",(1.5/vLen)+"em").css("padding-top",(Math.pow(vLen,1.6)/15)+"em"); }
			
			$($this.find("#mtinventory .z").get(vId)).html($elt);
            helpers.draggable($this,$elt);
		},
        draggable: function($this, $elt) {
            var settings = helpers.settings($this);
			
            $elt.draggable({containment:$this, appendTo: $this.find("#mteditor #nedittree"), helper:"clone", 
                start:function( event, ui) {
                    $("#exercice .mtdata#d"+$(this).attr("id")).addClass("mthl");
                    if (settings.svg) {
                        $(".p"+(parseInt($(this).attr("id"))+1),settings.svg.root()).each(function() {
                            var vClass = $(this).attr("class");
                            $(this).attr("class",vClass+" hl");
                        });
                    }
                },
                stop: function( event, ui) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                    event.originalEvent.touches[0]:event;
                    $("#exercice .mtdata").removeClass("mthl");
                    
                    if (settings.svg) {
                        $(".hl",settings.svg.root()).each(function() {
                            var vClass = $(this).attr("class");
                            $(this).attr("class",vClass.replace(" hl",""));
                        });
                    }

                }
			});
        },
        levenshtein: function (a,b) {
            var n = a.length, m = b.length, matrice = [];
            for(var i=-1; i < n; i++) { matrice[i]=[]; matrice[i][-1]=i+1; }
            for(var j=-1; j < m; j++) { matrice[-1][j]=j+1; }
            for(var i=0; i < n; i++) {
                for(var j=0; j < m; j++) {
                    var cout = (a.charAt(i) == b.charAt(j))? 0 : 1;
                    matrice[i][j] = Math.min(1+matrice[i][j-1], 1+matrice[i-1][j], cout+matrice[i-1][j-1]);
                }
            }
            return matrice[n-1][m-1];
        }
    };

    // The plugin
    $.fn.mathcraft = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    dataid          : 0,                                    // data index
                    root            : {},                                   // build tree
                    wrongs          : 0,                                    // wrongs value
                    mathmlup        : { ratio: 1, timerid: 0, action:0 },   // ratio of the mathml output
                    timers          : { clear: 0 },                         // Timers id
                    cvalues         : 0,                                    // current values
                    booknode        : {},                                   // book page editor node
                    svg             : 0                                     // figure as svg
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
                $this.find("#splash").hide();
                settings.interactive = true;
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.end($this,{'status':'abort'});
            },
            valid: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive && $this.find("#mtsubmit").hasClass("s")) {
                    settings.interactive = false;
                    var result = (settings.data?settings.data[settings.dataid].result:settings.result);
                    if (!$.isArray(result)) { result = [ result ]; }
                    settings.dataid++;

					var root = $this.find("#mteditor").neditor("getroot");
					var min = 5;
					
					if (root) {
						for (var i=0; i<result.length; i++) {
							var r = result[i];
							if (r.indexOf(" ")!=-1) {
								var tree = jtools.math.pol2tree(r);
								min = Math.min (min, tree.cmp(root));
							}
							else { min = Math.min (min,helpers.levenshtein(r, root.out())); }
						}
					}
					
                    min = Math.min(5,min*settings.errratio);
                    $this.find("#mtscreen").addClass("s"+min);

                    settings.wrongs+=min;
					
					$this.find("#g_effects").addClass(min?"wrong":"good");

                    if (settings.dataid<settings.number) {
                        setTimeout(function(){
                            $this.find("#mtscreen").removeClass();
                            settings.interactive = true;
                            helpers.build($this);
                        }, 1000);
                    }
                    else {
                        settings.score = 5 - settings.wrongs;
                        if (settings.score<0) { settings.score = 0; }
                        setTimeout(function(){helpers.end($this, {'status':'success','score':settings.score});}, 1000);
                    }
                }
            },
            toinventory: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive && $this.find("#mtsave").hasClass("s")) {
                    var vIndex = settings.cvalues.length;
					var root = $this.find("#mteditor").neditor("getroot");
					
                    if (vIndex<21 && root) {
						root.ea(function(_n) { if (_n.mtelt) { _n.mtelt.detach(); _n.mtelt = 0; } });
						root.la=root.out();
						helpers.pushelt($this,root);
						$this.find("#mteditor").neditor("clear");
                    }

                }
            },
            execute: function() {
                var $this = $(this), settings = helpers.settings($this);
                if (settings.interactive && $this.find("#mtexec").hasClass("s")) {
					var root = $this.find("#mteditor").neditor("getroot");
                   
				    if (root && root.ty=="de" && root.isfull()) {
						var newroot = root.mtpr();
						$this.find("#mteditor").neditor("clear",newroot);
						$this.find("#mtsave").toggleClass("s", (newroot!=0));
					}

                    
                }
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in mathcraft plugin!'); }
    };
})(jQuery);

