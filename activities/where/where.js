(function($) {
    // Activity default parameters
    var defaults = {
        name        : "where",                  // The activity name
        template    : "template.html",          // Activity html template
        css         : "style.css",              // Activity css style sheet
        lang        : "fr-FR",                  // Current localization
        number      : 20,                       // Number of questions
        time        : 1,                        // Sequence time reference
        shuffle     : true,                     // Shuffle the questions
        evaluation  : [4,0.8],                  // The evaluation from the score average (4 for A, 3.5 for B, 3 for C, etc.)
        font        : 1,                        // Font size
        fontex      : 1,
        fx     		: true,                     // Display effects
        width       : 640,
        background  : "",
        debug       : true                     // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[small\\\]([^\\\[]+)\\\[/small\\\]",    "<span style='font-size:.6em;'>$1</span>"
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
            if (_text) for (var j=0; j<2; j++) for (var i=0; i<regExp.length/2; i++) {
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
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.svg($this); });
            },
            // Load the svg if require
            svg:function($this) {
                var settings = helpers.settings($this),debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }
                var elt= $("<div id='svg'></div>").appendTo($this.find("#keypad"));
                elt.svg();
                settings.svg = elt.svg('get');
                $(settings.svg).attr("class",settings["class"]);
                settings.svg.load(settings.url + debug,
                    { addTo: true, changeSize: true, onLoad:function() { helpers.loader.build($this); }
                });
            },
            build: function($this) {
                var settings = helpers.settings($this);
                if (settings.context.onload) { settings.context.onload($this); }

                var vWidth = Math.floor($this.find("#values").width());
                $this.find("#values").css("font-size", settings.font+"em");
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }
				
				// HANDLE STATIC TEXT OR IMAGE IN SVG
				if (settings.txt) {
					var txt = settings.txt;
					if (typeof(txt)=="string" && txt.indexOf("function")!=-1) { txt = eval('('+settings.txt+')')($this); }
		
					for (var i in txt) {
						if (txt[i].toString().indexOf(".svg")!=-1) 
						{ 
							$("#"+i,settings.svg.root()).attr("xlink:href",txt[i]).show();
						}
						else
						{
							$("#"+i,settings.svg.root()).text(txt[i]).show();
						}
					}
				}

                // LOCALE HANDLING

                $this.find("#guide").html(settings.guide);
                $this.find("#comment>div").html(helpers.format(settings.comment))
                                          .css("font-size",settings.fontex+"em");
                $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); });

                // BUILD THE CURSORS LIST
                for (var i=0; i<settings.cursor.length; i++)
                {
                    var vCursor = $.extend({
                            constraint  : [0,0],            // The translation constraint
                            step        : -1,               // The proximity step from the target (if -1, we use the radius)
                            steps       : [0,1,2,3,4],      // The linear step mode
                            color       : "blue",           // The color effects
                            opacity     : .2,               // The opacitiy effects
                            init        : [0,0],            // Initial position of the cursor
                            cid         : "cursor",         // Cursor id
                            translate   : [0,0],            // The current position of the cursor
                            boundaries  : 0,                // The translation boundaries
                            targettype  : "circle",         // The target type (circle, rect)
                            effects     : [0,0,0,0],        // Parameter for the effects
                            offset      : [0,0],            // Offset for the effects
                            center      : 0                 // Rotation center
                        }, settings.cursor[i]);
                    settings.cursors[vCursor.cid] = vCursor;

                    // HANDLE THE CURSOR DRAG
                    var $cursor = $("#"+vCursor.cid, settings.svg.root());

                    if (vCursor.center) {
                        if ($.isArray(vCursor.init))        { vCursor.init = vCursor.init[0]; }
                        if ($.isArray(vCursor.constraint))  { vCursor.constraint = vCursor.constraint[0]; }

                        vCursor.translate=vCursor.init;
                        $cursor.show().attr("transform", "rotate("+vCursor.translate+")");
                    }
                    else {
                        vCursor.translate=[vCursor.init[0], vCursor.init[1]];
                        $cursor.show().attr("transform", "translate("+vCursor.translate[0]+" "+vCursor.translate[1]+")");
                    }
                    vCursor.current=vCursor.translate;
                    
                    if (settings.svgclass) { $(settings.svg.root()).attr("class",settings.svgclass); }

                    $cursor.bind('touchstart mousedown', function(event) {
                        var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                event.originalEvent.touches[0]:event;
                                
                        settings.ratio = $this.width()/settings.width;
                
                        if (!settings.timer.id) { settings.timer.id = setTimeout(function() { helpers.timer($this); }, 1000); }
                        if (settings.interactive) {
                            settings.elt = this;
                            var vclass= $(this).attr("class");
                            $(this).attr("class",vclass+" drag");
                            $this.addClass("active");
                            settings.mouse = [ vEvent.clientX, vEvent.clientY];
                            

                            var vCursor = settings.cursors[$(this).attr("id")];
                            if (vCursor.center) {
                                settings.control.center = [ vCursor.center[0]*settings.ratio + $this.offset().left,
                                                            vCursor.center[1]*settings.ratio + $this.offset().top];
                                var vA =  [ settings.mouse[0]-settings.control.center[0],
                                            settings.mouse[1]-settings.control.center[1]];
                                var lA = Math.sqrt(vA[0]*vA[0] + vA[1]*vA[1]);
                                settings.control.begin   = [ vA[0]/lA, vA[1]/lA ];
                                settings.control.current = [ vA[0]/lA, vA[1]/lA ];
                                settings.control.rot     = vCursor.translate;
                            }
                        }
                        event.preventDefault();
                    });
                }
                if (settings.onmove) { eval('('+settings.onmove+')')($this, settings.svg.root(), settings.cursors); }

                $this.bind('touchend touchleave mouseup mouseleave', function() {
                    if (settings.elt) {
                        var vclass=$(settings.elt).attr("class");
                        $(settings.elt).attr("class",vclass.replace(" drag",""));
                        var vCursor = settings.cursors[$(settings.elt).attr("id")];
                        $this.removeClass("active");

                        // RELEASE THE DISPLACEMENT
                        if (vCursor.center) {
                            var reg = new RegExp("[( )]","g");
                            var vSplit = $(settings.elt).attr("transform").split(reg);

                            if (vCursor.constraint>0) {
                                vSplit[1] = vCursor.init+
                                            Math.round((vSplit[1]-vCursor.init)/vCursor.constraint)*vCursor.constraint;
                            }
                            
                            $(settings.elt).attr("transform", "rotate("+vSplit[1]+")");
                            vCursor.translate=parseFloat(vSplit[1]);
                            vCursor.current=vCursor.translate;
                        }
                        else {
                            var reg = new RegExp("[( )]","g");
                            var vSplit = $(settings.elt).attr("transform").split(reg);

                            if (vCursor.constraint[0]>0) {
                                vSplit[1] = vCursor.init[0]+
                                            Math.round((vSplit[1]-vCursor.init[0])/vCursor.constraint[0])*vCursor.constraint[0];
                            }
                            if (vCursor.constraint[1]>0) {
                                vSplit[2] = vCursor.init[1]+
                                            Math.round((vSplit[2]-vCursor.init[1])/vCursor.constraint[1])*vCursor.constraint[1];
                            }
                            $(settings.elt).attr("transform", "translate("+vSplit[1]+" "+vSplit[2]+")");
                            vCursor.translate=[parseFloat(vSplit[1]),parseFloat(vSplit[2])];
                            vCursor.current=vCursor.translate;
                        }
                        if (settings.onmove) { eval('('+settings.onmove+')')($this, settings.svg.root(), settings.cursors); }
                    }
                    settings.elt = 0;
                });
                $this.bind('touchmove mousemove', function(event) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                event.originalEvent.touches[0]:event;

                    if (settings.interactive && settings.elt) {
                        // COMPUTE TRANSLATION_X
                        var vCursor = settings.cursors[$(settings.elt).attr("id")];
                        if (vCursor.center) {
                            var vB = [ vEvent.clientX - settings.control.center[0], vEvent.clientY - settings.control.center[1] ];
                            var lB = Math.sqrt(vB[0]*vB[0] + vB[1]*vB[1]);
                            vB[0] = vB[0]/lB; vB[1] = vB[1]/lB;
                            var det = settings.control.current[0]*vB[1] - settings.control.current[1]*vB[0];
                            var sign = det>0?1:-1;

                            var vValue = settings.control.current[0]*vB[0]+settings.control.current[1]*vB[1];
                            if (vValue<-1) { vValue=-1;} else if (vValue>1)  { vValue=1; }
                            var vRot = settings.control.rot + sign*(Math.acos(vValue)*180/Math.PI);
                            if (vCursor.boundaries && vRot<vCursor.boundaries[0]) { vRot = vCursor.boundaries[0]; }
                            if (vCursor.boundaries && vRot>vCursor.boundaries[1]) { vRot = vCursor.boundaries[1]; }

                            $(settings.elt).attr("transform", "rotate("+vRot+")");
                            vCursor.current=vRot;
                            settings.control.rot = vRot;
                            settings.control.current = [ vB[0],vB[1] ];
                        }
                        else {
                            var vX = vCursor.translate[0];
                            if (vCursor.constraint[0]==0) {
                                vX += (vEvent.clientX-settings.mouse[0])/settings.ratio;
                            }
                            else if (vCursor.constraint[0]>0) {
                                var vValue = ((vEvent.clientX-settings.mouse[0])/settings.ratio)/vCursor.constraint[0];
                                var vStep = Math.round(vValue);
                                var vOffset = Math.pow((vValue-vStep)*2,5)/2;
                                vX += (vStep+vOffset) * vCursor.constraint[0];
                            }
                            // COMPUTE TRANSLATION_Y
                            var vY = vCursor.translate[1];
                            if (vCursor.constraint[1]==0) {
                                vY += (vEvent.clientY-settings.mouse[1])/settings.ratio;
                            }
                            else if (vCursor.constraint[1]>0) {
                                var vValue = ((vEvent.clientY-settings.mouse[1])/settings.ratio)/vCursor.constraint[1]
                                var vStep = Math.round(vValue);
                                var vOffset = Math.pow((vValue-vStep)*2,5)/2;
                                vY += (vStep+vOffset)  * vCursor.constraint[1];
                            }
                            if (vCursor.boundaries && vX<vCursor.boundaries[0]) { vX = vCursor.boundaries[0]; }
                            if (vCursor.boundaries && vY<vCursor.boundaries[1]) { vY = vCursor.boundaries[1]; }
                            if (vCursor.boundaries && vX>vCursor.boundaries[2]) { vX = vCursor.boundaries[2]; }
                            if (vCursor.boundaries && vY>vCursor.boundaries[3]) { vY = vCursor.boundaries[3]; }
                            $(settings.elt).attr("transform", "translate("+vX+" "+vY+")");
                            vCursor.current=[vX,vY];
                        }
                        if (settings.onmove) { eval('('+settings.onmove+')')($this, settings.svg.root(), settings.cursors); }
                    }
                    event.preventDefault();
                });

                var vLen = 0;

                // BUILD THE QUESTIONS
                var vLast = -1, vNew;
                var vRegexp = (settings.regexp)?new RegExp(settings.regexp.from, "g"):0;
                var $ul = $this.find("#values ul").hide();

                // FILL THE UL LIST
                for (var i=0; i<settings.number; i++) {
                    var $li = $("<li></li>").appendTo($ul), vValue;
                    $li.bind('touchstart click', function(event) { helpers.submit($this); event.preventDefault(); });

                    // GET THE QUESTION
                    if (settings.gen) { vValue = eval('('+settings.gen+')')($this, settings, 0); }
                    else {
                        do  {
                            vNew = (settings.shuffle)?Math.floor(Math.random()*settings.values.length):i;
                        }
                        while ((settings.values.length>2)&&(vNew==vLast));
                        vValue = settings.values[vNew];
                    }
                    
                    // FILL THE DOM ELEMENT, USE A REGEXP IF NEEDED
                    if (vRegexp)    { $li.html(vValue[0].replace(vRegexp, settings.regexp.to)); }
                    else            { $li.html(vValue[0]); }

                    // HANDLE THE SIZE
                    vLen=Math.max(vLen, $li.text().length);

                    // STORE THE QUESTION
                    settings.questions.push(vValue);
                    vLast = vNew;
                }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        // Update the timer
        timer:function($this) {
            var settings = helpers.settings($this);
            settings.timer.value++;
            var vS = settings.timer.value%60;
            var vM = Math.floor(settings.timer.value/60)%60;
            var vH = Math.floor(settings.timer.value/3600);
            if (vH>99) { vS=99; vM=99; vH=99; }
            //$this.find("#time").text((vH<10?"0":"")+vH+(vM<10?":0":":")+vM+(vS<10?":0":":")+vS);
            settings.timer.id = setTimeout(function() { helpers.timer($this); }, 1000);
        },
        move: function($this, _anim) {
            var settings = helpers.settings($this);
            var vHeight=0;
            $this.find("#values li").each(function(index) { if (index<settings.it) { vHeight = vHeight - $(this).outerHeight(); } });
            if (_anim)  { $this.find("#values ul").animate({top: vHeight+"px"}, 250, function() { helpers.next($this); }); }
            else        { $this.find("#values ul").css("top", vHeight+"px"); }

            if (settings.it<settings.questions.length && settings.questions[settings.it] && settings.questions[settings.it][2]) {
                for (var i in settings.questions[settings.it][2]) {
                    if (i=="class") { $("#svgclass",settings.svg.root()).attr("class",settings.questions[settings.it][2][i]); }
                    else if (i=="onvalue") {
                        if (settings.onvalue) { eval('('+settings.onvalue+')')($this, settings.svg.root(), settings.cursors, settings.questions[settings.it][2][i]); }
                    }
                    else { $("#"+i,settings.svg.root()).text(settings.questions[settings.it][2][i]); }
                }
            }

        },
        next: function($this) {
            var settings = helpers.settings($this);
            $($this.find("#values li").get(settings.it)).addClass("select");
        },
        createEffects: function($this, value) {
            var settings = helpers.settings($this);
            var $group = $("#effects", settings.svg.root());
            for (var i in settings.cursors) {
                var vCursor = settings.cursors[i];
                if (vCursor.center) {
                    var vX = vCursor.center[2]*Math.sin(Math.PI*vCursor.effects[0]/180);
                    var vY = vCursor.center[2]*Math.cos(Math.PI*vCursor.effects[0]/180);
                    settings.effects.push(settings.svg.line($group,
                            vCursor.center[0],vCursor.center[1],vCursor.center[0]+vX,vCursor.center[1]-vY,
                            {fill:"none",stroke:vCursor.color,opacity:vCursor.opacity,strokeWidth:value*5 }));
                }
                else {
                    if (vCursor.targettype=="circle") {
                        // ADD CIRCLE EFFECT
                        settings.effects.push(settings.svg.circle($group,
                            vCursor.effects[0],vCursor.effects[1],vCursor.effects[2]+vCursor.effects[3]*vCursor.steps[value],
                            {fill:vCursor.color, opacity:vCursor.opacity }));
                    } else {
                        // RECTANGLE EFFECT
                        // WIDTH MAY BE DIFFERENT THAN HEIGHT
                        var vStepX = vCursor.steps[value], vStepY = vCursor.steps[value];
                        if ($.isArray(vCursor.steps[value])) {
                            vStepX = vCursor.steps[value][0];
                            vStepY = vCursor.steps[value][1];
                        }
                        // CONSTRAINT HANDLING
                        var vX = (vCursor.constraint[0]<0)?vCursor.effects[2]:vCursor.effects[2]+vCursor.effects[2]*vStepX;
                        var vY = (vCursor.constraint[1]<0)?vCursor.effects[3]:vCursor.effects[3]+vCursor.effects[3]*vStepY;

                        // ADD RECTANGLE EFFECT
                        settings.effects.push(settings.svg.rect($group,
                            vCursor.effects[0]-vX/2+vCursor.offset[0],
                            vCursor.effects[1]-vY/2+vCursor.offset[1],
                            vX,vY,0,0, {fill:vCursor.color, opacity:vCursor.opacity }));
                    }
                }
            }
        },
        compute: function($this) {
            var settings = helpers.settings($this);

            // REMOVE EFFECTS
            $this.find("#submit>img").hide(); $this.find("#subvalid").show();
            while (settings.effects.length) {
                settings.svg.remove(settings.effects[0]);
                settings.effects.shift();
            };
            $this.find("#values").attr("class","");
            $this.find("#effects>div").hide();
            settings.interactive = true;

            // GO TO NEXT QUESTION IF ANY
            if (++settings.it==settings.number) {
                settings.interactive = false;
                settings.finish = true;
                clearTimeout(settings.timer.id);

                var score = settings.score/(settings.number*settings.cursor.length);
				
                if (score>=settings.evaluation[0]-0*settings.evaluation[1])     { settings.score = 5; } else
                if (score>=settings.evaluation[0]-1*settings.evaluation[1])     { settings.score = 4; } else
                if (score>=settings.evaluation[0]-2*settings.evaluation[1])     { settings.score = 3; } else
                if (score>=settings.evaluation[0]-3*settings.evaluation[1])     { settings.score = 2; } else
                if (score>=settings.evaluation[0]-4*settings.evaluation[1])     { settings.score = 1; } else
                                                                                { settings.score = 0; }
                setTimeout(function() { helpers.end($this); }, 1000);
            }
            helpers.move($this, true);
        },
        submit: function($this) {
            var settings = helpers.settings($this);
            if (settings.interactive && !settings.finish) {
                settings.interactive=false;
                var it=0;
                var vScore = 0;
                for (var i in settings.cursors) {
                    var vResponse;
                    var vCursor = settings.cursors[i];

					// COMPUTE THE RESPONSE
					if (settings.compute) {
						vScore+=eval('('+settings.compute+')')($this, settings, i);
					}
					else {
					
						// GET THE RESPONSE FOR EACH CURSOR
						if (settings.cursor.length>1)   { vResponse = settings.questions[settings.it][1][it]; } else
														{ vResponse = settings.questions[settings.it][1]; }

						if (vCursor.center) {
							var vValue = vCursor.translate;
							if (!vCursor.boundaries) { while(vValue<0) { vValue+=360; } vValue=vValue%360; }
							var vDist = Math.abs(vValue-vResponse);

							if (settings.scorefct) {
								vScore = eval('('+settings.scorefct+')')(vCursor.translate, vResponse);
							}
							else {
								if (vDist<=vCursor.steps[0])  { vScore+=5; } else
								if (vDist<=vCursor.steps[1])  { vScore+=4; } else
								if (vDist<=vCursor.steps[2])  { vScore+=3; } else
								if (vDist<=vCursor.steps[3])  { vScore+=2; } else
								if (vDist<=vCursor.steps[4])  { vScore+=1; }
							}
							vCursor.effects=[vResponse];
						}
						else {
							// NEED TO MOVE THE RESPONSE?
							var vTransX = -9999, vTransY = 0;
							if ($.isArray(vResponse)) { vTransX = vResponse[1]; vTransY = vResponse[2]; vResponse = vResponse[0];  }

							var $response = $("#"+vResponse, settings.svg.root());
							if ($response.attr("r")) {
								// MOVE RESPONSE
								if (vTransX!=-9999) { $response.attr("cx",vTransX); $response.attr("cy",vTransY); }

								// GET VALUES FROM RESPONSE
								var vR  = parseFloat($response.attr("r"));
								var vS  = parseFloat((vCursor.step>=0)?vCursor.step:vR);
								var vCx = $response.attr("cx");
								var vCy = $response.attr("cy");
								var vDist = Math.sqrt((vCx-vCursor.translate[0])*(vCx-vCursor.translate[0]) +
													(vCy-vCursor.translate[1])*(vCy-vCursor.translate[1]));
								if (settings.scorefct) {
									vScore = eval('('+settings.scorefct+')')(vCx-vCursor.translate[0], vCy-vCursor.translate[1]);
								}
								else {
									if (vDist<vR+vS*vCursor.steps[0])  { vScore+=5; } else
									if (vDist<vR+vS*vCursor.steps[1])  { vScore+=4; } else
									if (vDist<vR+vS*vCursor.steps[2])  { vScore+=3; } else
									if (vDist<vR+vS*vCursor.steps[3])  { vScore+=2; } else
									if (vDist<vR+vS*vCursor.steps[4])  { vScore+=1; }
								}

								vCursor.effects=[vCx, vCy, vR, vS];
								vCursor.targettype="circle";
							}
							else {
								// MOVE RESPONSE
								if (vTransX!=-9999) { $response.attr("x",vTransX); $response.attr("y",vTransY); }

								// GET VALUES FROM RESPONSE
								// COMPUTE DISTANCE FROM THE FAREST AXIS
								var vR = [ parseFloat($response.attr("width")), parseFloat($response.attr("height")) ];
								var vC = [ parseFloat($response.attr("x"))+(vR[0]/2), parseFloat($response.attr("y"))+(vR[1]/2) ];
								var vDist = [ Math.sqrt((vC[0]-vCursor.translate[0])*(vC[0]-vCursor.translate[0])),
											Math.sqrt((vC[1]-vCursor.translate[1])*(vC[1]-vCursor.translate[1])) ];
								var k=(vDist[0]/vR[0]>vDist[1]/vR[1])?0:1;
								var vS = parseFloat((vCursor.step>=0)?vCursor.step:vR[k]/2);


								if (settings.scorefct) {
									vScore = eval('('+settings.scorefct+')')(vC[0]-vCursor.translate[0], vC[1]-vCursor.translate[1]);
								}
								else {
									if (vDist[k]<vR[k]+vS*vCursor.steps[0])  { vScore+=5; } else
									if (vDist[k]<vR[k]+vS*vCursor.steps[1])  { vScore+=4; } else
									if (vDist[k]<vR[k]+vS*vCursor.steps[2])  { vScore+=3; } else
									if (vDist[k]<vR[k]+vS*vCursor.steps[3])  { vScore+=2; } else
									if (vDist[k]<vR[k]+vS*vCursor.steps[4])  { vScore+=1; }
								}

								vCursor.effects=[vC[0],vC[1],vR[0],vR[1]];
								vCursor.targettype="rect";
							}
						}
					}
                    it++;
                }

                // NOT NECESSARY ANYMORE
                $this.find("#show").hide();

                // DISPLAY ALERT
                $this.find("#effects>div").hide();
                if (Math.floor(vScore/it)==5) {
                    $this.find("#submit>img").hide(); $this.find("#subgood").show();
                    $this.find("#effects #good").show();
                }
                if (Math.floor(vScore/it)==0) {
                    $this.find("#submit>img").hide(); $this.find("#subwrong").show();
                    $this.find("#effects #wrong").show();
                }

                // COMPUTE SCORE AND SHOW EFFECTS
                settings.score += vScore;

                $this.find("#values").attr("class","nh s"+Math.floor(vScore/it));
				if (settings.fx) {
					setTimeout(function() { helpers.createEffects($this, 4); }, 100 );
					setTimeout(function() { helpers.createEffects($this, 3); }, 250 );
					setTimeout(function() { helpers.createEffects($this, 2); }, 400 );
					setTimeout(function() { helpers.createEffects($this, 1); }, 550 );
					setTimeout(function() { helpers.createEffects($this, 0); }, 700 );
				}
				setTimeout(function() { helpers.compute($this); }, 1500 );
            }
        },
    };

    // The plugin
    $.fn.where = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    it              : 0,                        // Current question index
                    questions       : [],                       // Questions array
                    response        : { value:0, digit: 0 },    // Current response
                    keypadtimer     : 0,                        // Keypadtimer (in case of more than one digit)
                    timer: {                                    // The general timer
                        id      : 0,                            // The timer id
                        value   : 0                             // The timer value
                    },
                    score           : 0,                        // The score
                    interactive     : false,                    // Entry allowed or not
                    finish          : false,                    // Exercice is finished
                    effects         : [],                       // The proximity effects svg objects
                    mouse           : [0,0],                    // The position of the mouse when button down
                    control         : {},                       // Rotation controls
                    cursors         : {},                       // The list of cursors (indexed by id)
                    ratio           : 1,                        // Ratio from mouse to svg
                    elt             : 0                         // The moving svg element (elt.id is the key for cursors)
                };

                 // Check the context and send the load
                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);
                    this.onselectstart = function() { return false; }

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
                var settings = $(this).data("settings");
                $(this).find("#values ul").show();
                settings.interactive=true;
                helpers.move($(this), true);
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.timer.id) { clearTimeout(settings.timer.id); settings.timer.id=0; }
                settings.finish = true;
                settings.context.onquit($this,{'status':'abort'});
            },
            submit: function() { helpers.submit($(this)); }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in where plugin!'); }
    };
})(jQuery);

