// SPECIAL STUFF
document.ontouchmove = function(e) { e.preventDefault(); }

// IS A CSS ALTERNATIVE POSSIBLE ?
$(window).resize(function() {
    var x    = $(window).width()/16;
    var y    = $(window).height()/12;
    var r    = 0.1;
    var font = Math.floor(Math.min(x,y)/r)*r;
	var current = $("body").css("font-size");
	current = parseFloat(current.substr(0, current.length-2));
	if (font && font!=current) {
		$("body").css("font-size", font+"px");
		$("body>div").css("margin-top", Math.floor(($(window).height()-$("body>div").height())/2-2)+"px");
	}
});

shuffle = function(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
pick = function(a) { return a&&a.length?a[Math.floor(Math.random()*a.length)]:0; }
isNN = function(_a) { return isNaN(_a) || (_a.toString().length==0); }

jlo = {
	numperclass    : 3,
	comma          : ',',
	mult           : '×',
	div            : '÷'
};

jtools = {
	addon: {
		midi: {
			count : 0,
			already : false,
			files: ["js/MIDI/AudioDetect.js","js/MIDI/LoadPlugin.js","js/MIDI/Plugin.js","js/MIDI/Player.js",
					"js/Window/DOMLoader.XMLHttp.js","js/Window/DOMLoader.script.js","inc/Base64.js","inc/base64binary.js"],
			init: function(_callback) {
				if (!jtools.addon.midi.already) {
					jtools.addon.midi.already = true;
					for (var i in jtools.addon.midi.files) {
						$.getScript('ext/MIDI/'+jtools.addon.midi.files[i], function() {
							if (++jtools.addon.midi.count==jtools.addon.midi.files.length) { _callback(); }
						});
					}
				}
				else { _callback(); }
			},
			load        : function(_args)                               { MIDI.loadPlugin(_args); },
			setVolume   : function(_channel, _volume)                   { MIDI.setVolume(_channel, _volume); },
			noteOn      : function(_channel, _note, _velocity, _delay)  { MIDI.noteOn(_channel, _note, _velocity, _delay); },
			noteOff     : function(_channel, _note, _delay)             { MIDI.noteOff(_channel, _note, _delay ); }
		},
		neditor: {
			init: function(_callback) {
				$.getScript("addon/neditor/neditor.js", function() {
					$("head").append("<link></link>");
                    var css = $("head").children(":last");
					css.attr({ rel:  "stylesheet", type: "text/css", href: "addon/neditor/neditor.css?id="+Math.random() }).ready(_callback);
				});
			}
		}
	},
	format: function(_text, _regexp) {
		var vRegExp = _regexp || [
            "[*]",                                                          jlo.mult,
			"\\\[b\\\]([^\\\[]+)\\\[/b\\\]",                                "<b>$1</b>",
            "\\\[bb\\\](.+)\\\[/bb\\\]",                                    "<b>$1</b>",
			"\\\[i\\\]([^\\\[]+)\\\[/i\\\]",                                "<i>$1</i>",
			"\\\[br\\\]",                                                   "<br/>",
			"\\\[clear\\\]",                                                "<div style='clear:both'></div>",
			"\\\[op[ ]*([^\\\]]+)]([^\\\[]+)\\\[/op([^\\\]]*)\\\]",         "<span style='opacity:$1;'>$2</span>",
			"\\\[tiny\\\]([^\\\[]+)\\\[/tiny\\\]",                          "<span class='t_tiny'>$1</span>",
			"\\\[small\\\]([^\\\[]+)\\\[/small\\\]",                        "<span class='t_small'>$1</span>",
			"\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",                          "<span style='color:blue'>$1</span>",
			"\\\[red\\\]([^\\\[]+)\\\[/red\\\]",                            "<span style='color:red'>$1</span>",
			"\\\[green\\\]([^\\\[]+)\\\[/green\\\]",                        "<span style='color:green'>$1</span>",
			"\\\[purple\\\]([^\\\[]+)\\\[/purple\\\]",                      "<span style='color:purple'>$1</span>",
			"\\\[orange\\\]([^\\\[]+)\\\[/orange\\\]",                      "<span style='color:orange'>$1</span>",
			"\\\[svg\\\]([^\\\[]+)\\\[/svg\\\]",                            "<div class='t_svg'><div><svg width='100%' height='100%' viewBox='0 0 32 32'><rect x='0' y='0' width='32' height='32' style='fill:black'/>$1</svg></div></div>",
			"\\\[img\\\]([^\\\[]+)\\\[/img\\\]",                            "<div class='img'><img src='$1'/></div>",
			"\\\[size[ ]*([\\\.0-9]+)]([^\\\[]+)\\\[/size([^\\\]]*)\\\]",   "<div style='font-size:$1em'>$2</div>",
			"\\\[char\\\]([^\\\[]+)\\\[/char\\\]",                          "<div class='char'><img src='$1'/></div>",
			"\\\[char[ ]*([\\\.0-9]+)]([^\\\[]+)\\\[/char([^\\\]]*)\\\]",   "<div class='char' style='font-size:$1em'><img src='$2'/></div>",
			"\\\[char[ ]+([^\\\.]+\\\.svg)\\\]([^\\\[]+)\\\[/char\\\]",     "<div class='char' style='background-image:url(\"$1\")'><img src='$2'/></div>",
			"\\\[icon\\\]([^\\\[]+)\\\[/icon\\\]",                          "<div class='icon'><img src='$1'/></div>",
		    "\\\[icon[ ]*([\\\.0-9]+)\\\]([^\\\[]+)\\\[/icon([^\\\]]*)\\\]",   "<div class='icon' style='font-size:$1em'><img src='$2'/></div>",
			"\\\[icon[ ]+([^\\\.]+\\\.svg)\\\]([^\\\[]+)\\\[/icon\\\]",     "<div class='icon' style='background-image:url(\"$1\")'><img src='$2'/></div>",
			"\\\[code\\\](.+)\\\[/code\\\]",                                "<div class='t_code'>$1</div>",
			"\\\[strong\\\](.+)\\\[/strong\\\]",                            "<div class='t_strong'>$1</div>",
			"\\\[user\\\](.+)\\\[/user\\\]",                                "<div class='user'>$1</div>"
		];
		var vTxt = _text?_text.toString():"";
		if (vTxt.length) {
			for (var j=0; j<3; j++) for (var i=0; i<vRegExp.length/2; i++) {
				var vReg = new RegExp(vRegExp[i*2],"g");
				vTxt = vTxt.replace(vReg,vRegExp[i*2+1]);
			}
		}
		
		var vRatio = 5;
		var vValue = "";
		
		var vMath = RegExp("\\\[math\\\]([^\\\[]+)\\\[/math\\\]","g");
		var val = vMath.exec(vTxt);
		if (val) { vValue = val[1]; }
		else {
			vMath = RegExp("\\\[math[ ]*([\\\.0-9]+)\\\]([^\\\[]+)\\\[/math([^\\\]]*)\\\]","g");
			val = vMath.exec(vTxt);
			if (val) { vRatio=val[1]; vValue = val[2]; }
		}
		
		
		if (vValue) {
			var tree = jtools.math.pol2tree(vValue);
			var svg = jtools.math.tree2svg(tree);
			var ratio = (1*svg.size[0])/(vRatio*svg.size[1]);
			vTxt = vTxt.replace(vMath,"<div class='t_svg'><div style='height:100%;width:"+Math.min(100,ratio*100)+"%'>"+svg.svg+"</div></div>");
		}
		
        return vTxt;
    },
	instructions: function(_txt) {
		var vRet = "";
		if ($.isArray(_txt)) {
            for (var i in _txt) { vRet+="<p>"+jtools.format(_txt[i])+"</p>"; }
        } else { vRet = "<p>"+jtools.format(_txt)+"<p>"; }
		return vRet;
	},
	math: {
		svg: { font: [7,12], y: 9.5 },
		symbology : {
			".nop" : { ty:"op", pr:5, va:"?", tt:"$1?$2", op:[null,null], eq:function(_a) { return NaN; } },
			".mar" : { ty:"op", pr:9, va:"", tt:" $1 ", op:[null], eq:function(_a) { return this._eq(_a)[0];},
				svg:function() {
					var svg = this.op[0]?this.op[0].svg():{si:[2, 0.5, 0.5], svg:"<text y='"+jtools.math.svg.y+"'>$1</text>", pr:1};
					svg.svg="<g transform='translate("+(0.5*jtools.math.svg.font[0])+",0)'>"+svg.svg+"</g>";
					svg.si[0]=svg.si[0]+1;
					return svg;
			}}, 
			"abs" : { ty:"op", pr:2, va:"abs",	 tt:"|$1|",     op:[null],           eq: function(_a) { var r=this._eq(_a); return isNN(r[0])?NaN:Math.abs(r[0]);} },
			"//" : { ty:"op", pr:5, va:"//",    tt:"$1//$2",   op:[null,null],      co: true, as:true, fi:true },
			"⊥" : { ty:"op", pr:5, va:"⊥",     tt:"$1⊥$2",    op:[null,null], co:true, fi:true },
			"cos" : { ty:"op", pr:0, va:"cos",   tt:"cos$1",    op:[null],           eq: function(_a) { var r=this._eq(_a); return isNN(r[0])?NaN:Math.cos(r[0]);} },
			"sin" : { ty:"op", pr:0, va:"sin",   tt:"sin$1",    op:[null],           eq: function(_a) { var r=this._eq(_a); return isNN(r[0])?NaN:Math.sin(r[0]);} },
			"+"   : { ty:"op", pr:5, va:"+",     tt:"$1+$2",    op:[null,null],      eq: function(_a) { var r=this._eq(_a);  return (isNN(r[0])||isNN(r[1]))?NaN:(r[0]+r[1]);}, co:true, as:true },
			"-"   : { ty:"op", pr:5, va:"-",     tt:"$1-$2",    op:[null,null],      eq: function(_a) { var r=this._eq(_a); return (isNN(r[0])||isNN(r[1]))?NaN:(r[0]-r[1]);} },
			"neg" : { ty:"op", pr:2, va:"-",     tt:"-$1",      op:[null],           eq: function(_a) { var r=this._eq(_a); return isNN(r[0])?NaN:-r[0];} },
			"id"  : { ty:"po", pr:9, va:"",      tt:"$1",       op:[null],           eq: function(_a) { var r=this._eq(_a); return isNN(r[0])?NaN:r[0];} },
			"="   : { ty:"op", pr:9, va:"=",     tt:"$1=$2",    op:[null,null],      eq: function(_a) { var r=this._eq(_a); return (isNN(r[0])||isNN(r[1]))?NaN:(r[0]==r[0]?1:0);}, co:true, as:true },
			"*"   : { ty:"op", pr:3, va:jlo.mult,     tt:"$1"+jlo.mult+"$2",    op:[null,null],      eq: function(_a) { var r=this._eq(_a); return (isNN(r[0])||isNN(r[1]))?NaN:(r[0]*r[1]);}, co:true, as:true },
			"×"   : { ty:"op", pr:3, va:jlo.mult,     tt:"$1"+jlo.mult+"$2",    op:[null,null],      eq: function(_a) { var r=this._eq(_a); return (isNN(r[0])||isNN(r[1]))?NaN:(r[0]*r[1]);}, co:true, as:true },
			"/"   : { ty:"op", pr:3, va:"/",     tt:"$1/$2",    op:[null,null],      eq: function(_a) { var r=this._eq(_a); return (isNN(r[0])||isNN(r[1]))?NaN:(r[1]==0?NaN:(r[0]/r[1]));}, as:true,
				svg : function() {
					var s   = [];
					var max = [0,1];
					var svg = "";
					var sp = 0.1;
					for (var i=1; i>=0; i--) { s.push(this.op[i]?this.op[i].svg():{si:[2,0.5,0.5],svg:"<text y='"+jtools.math.svg.y+"'>$"+(i+1)+"</text>"}); }
					for (var i in s) for (var j=0; j<2; j++) { max[j] = Math.max(max[j], s[i].si[j]); }
					svg += "<g transform='translate("+(((max[0]-s[1].si[0])/2)*jtools.math.svg.font[0])+",0)'>"+s[1].svg+"</g>";
					svg += "<path d='m 0,"+ ((s[1].si[1]+s[1].si[2]+sp)*jtools.math.svg.font[1])+" l "+(max[0]*jtools.math.svg.font[0])+",0'/>";
					svg += "<g transform='translate("+(((max[0]-s[0].si[0])/2)*jtools.math.svg.font[0])+","+((s[1].si[1]+s[1].si[2]+2*sp)*jtools.math.svg.font[1])+")'>"+s[0].svg+"</g>";
					return { si:[max[0], s[1].si[1]+s[1].si[2]+sp, s[0].si[1]+s[0].si[2]+sp], svg:svg, pr:this.pr};
				}},
			"sqrt": { ty:"op", pr:0, va:"√",     tt:"√$1",      op:[null],           eq: function(_a) { var r=this._eq(_a); return isNN(r[0])?NaN:Math.sqrt(r[0]);},
				svg: function() {
					var op = this.op[0]?this.op[0].svg():{si:[2,0.5,0.5],svg:"<text y='"+jtools.math.svg.y+"'>$"+(i+1)+"</text>"};					
					var svg = "";
					var sp = 0.1;
					var mg = 0.1
					svg+= "<path d='M "+(mg*jtools.math.svg.font[0])+","+((sp+mg)*jtools.math.svg.font[1])+" "+
					      (0.5*jtools.math.svg.font[0])+","+((op.si[1]+op.si[2]+sp)*jtools.math.svg.font[1])+" "+
					      jtools.math.svg.font[0]+","+(mg*jtools.math.svg.font[1])+" "+
						  ((1+op.si[0])*jtools.math.svg.font[0])+","+(mg*jtools.math.svg.font[1])+" "+
						  ((1+op.si[0])*jtools.math.svg.font[0])+","+(mg+sp*3*jtools.math.svg.font[1])+"'/>";
					svg+= "<g transform='translate("+jtools.math.svg.font[0]+","+(sp*jtools.math.svg.font[1])+")'>"+op.svg+"</g>";
					return { si:[op.si[0]+1+mg, op.si[1]+sp+mg, op.si[2]], svg:svg, pr:this.pr};
					
				}},
			"pow":  { ty:"op", pr:2, va:"^",     tt:"$1^$2",    op:[null,null],      eq: function(_a) { var r=this._eq(_a); return (isNN(r[0])||isNN(r[1]))?NaN:(r[0]^r[1]);}, as:true,
				svg: function() {
					var svgs= [];
					var offx = 0;
					var svg = "";

					for (var i=0; i<this.op.length; i++) { svgs.push(this.op[i]?this.op[i].svg():{si:[2, 0.5, 0.5], svg:"<text y='"+jtools.math.svg.y+"'>$"+(i+1)+"</text>", pr:1}); }
					
					var tmp = this._svg(svgs[0], svgs[0].si[1]-0.5);
					svg+="<g transform='translate(0,"+((svgs[1].si[1]/2)*jtools.math.svg.font[1])+")'>"+tmp.svg+"</g>";
					offx+=tmp.offx;
							
					svg+="<g transform='translate("+(offx*jtools.math.svg.font[0])+",0)'>"+
						"<g transform='scale(0.6)'>"+
						svgs[1].svg+"</g></g>";
					offx+=svgs[1].si[0]/2;
					offx+=0.2;
					
					return { si:[offx, svgs[0].si[1]+svgs[1].si[1]/2, svgs[0].si[2]], svg:svg, pr:this.pr };
				}
			},
			"pi"  : { ty:"va", pr:1, va:"π",     tt:"π",        op:[],               eq: function(_a) { return Math.PI; } },
			
			get : function(_v) {
				var ret;
				var base = {
					em: false, fi:false, ro:false,
					co: false, as: false,
					ea: function(_c) { _c(this); for (var i in this.op) { if (this.op[i]) { this.op[i].ea(_c); }} },
					_eq : function(_a) { var ret=[]; for (var i in this.op) { ret.push(this.op[i]?this.op[i].eq(_a):NaN); } return ret; },
					eq  : function(_a) { return NaN; },
					isfull : function() {
						var ret = true;
						for (var i=0;i<this.op.length;i++) {
							if (!this.op[i] || this.op[i].em || !this.op[i].isfull()) { ret = false; }
						}
						return ret;
					},
					out : function() {
						var ret=this.tt;
						for (var i=0;i<this.op.length;i++) {
							if (this.op[i]) {
								var v=this.op[i].out();
								if (this.va!=this.op[i].va && this.pr<=this.op[i].pr) { v = "("+v+")"; }
								ret=ret.replace("$"+(i+1),v);
							}
						}
						return ret.toString();
					},
					cmp: function(_node, _level) {
						if (!_level)   { _level = 5; }
						if (_level<1)  { _level = 1; }
						var d = 0;
						if (!_node || this.va!=_node.va) { d+=_level; } else
						if (this.op.length==2 && this.co) {
							var dd = [0,0];
							var oo = [[0,1],[1,0]];
							
							for (var j=0; j<2; j++) {
								for (var i=0; i<this.op.length; i++) {
									if (this.op[i] && _node.op[oo[j][i]]) { dd[j]+=this.op[i].cmp(_node.op[oo[j][i]], _level-1); }
									else { dd[j]++; }
								}
							}
							d+=Math.min(dd[0], dd[1]);
						} else
						if (this.op.length) {
							for (var i=0; i<this.op.length; i++) {
								if (this.op[i] && _node.op[i]) { d+=this.op[i].cmp(_node.op[i], _level-1); }
								else { d++; }
							}
						}
						
						return d;
					},
					_svg: function(_op, _offy) {
						var ret = { svg:"", offx:0 };
						if (this.pr<_op.pr) { ret.svg  += "<g transform='translate("+((ret.offx++)*jtools.math.svg.font[0])+","+(_offy*jtools.math.svg.font[1])+")'><text y='"+jtools.math.svg.y+"'>(</text></g>"; }
						ret.svg += "<g transform='translate("+(ret.offx*jtools.math.svg.font[0])+",0)'>"+_op.svg+"</g>";
						ret.offx += _op.si[0];
						if (this.pr<_op.pr) { ret.svg  += "<g transform='translate("+((ret.offx++)*jtools.math.svg.font[0])+","+(_offy*jtools.math.svg.font[1])+")'><text y='"+jtools.math.svg.y+"'>)</text></g>"; }
						return ret;
					},
					svg : function() {
						var svgs= [];
						var max = [0,0.5,0.5];
						var offx = 0;
						var svg = "";
						
						for (var i=0; i<this.op.length; i++) { svgs.push(this.op[i]?this.op[i].svg():{si:[2, 0.5, 0.5], svg:"<text y='"+jtools.math.svg.y+"'>$"+(i+1)+"</text>", pr:1}); }
						for (var i in svgs) for (var j=0; j<3; j++) { max[j] = Math.max(max[j], svgs[i].si[j]); }
						
						if (this.op.length>=1) {
							var tmp = this._svg(svgs[0], max[1]-0.5);
							svg+="<g transform='translate("+offx*jtools.math.svg.font[0]+","+((max[1]-svgs[0].si[1])*jtools.math.svg.font[1])+")'>"+tmp.svg+"</g>";
							offx+=tmp.offx;
						}
						var va = jtools.num.tostr((this.ty=="va"&&this.la)?this.la:this.va);
						svg  += "<text y='"+jtools.math.svg.y+"' transform='translate("+(offx*jtools.math.svg.font[0])+","+((max[1]-0.5)*jtools.math.svg.font[1])+")'>"+va+"</text>";
						offx += va.toString().length;

						if (this.op.length>=2) {
							var tmp = this._svg(svgs[1], max[1]-0.5);
							svg+="<g transform='translate("+offx*jtools.math.svg.font[0]+","+((max[1]-svgs[1].si[1])*jtools.math.svg.font[1])+")'>"+tmp.svg+"</g>";
							offx+=tmp.offx;
						}
						
						return { si:[offx, max[1], max[2]], svg:svg, pr:this.pr };
					}
				};
				
				// BUILD NODE FROM BASE AND REFERENCE
				var ref = (typeof(_v)=="object"?_v.va:_v);
				if (jtools.math.symbology[ref]) { ret = jtools.math.symbology[ref];	}
				else { ret = { ty:"va", pr:1, va:ref, tt:ref, op:[], eq:function(_a) { return isNaN(this.va)?((_a&&_a[this.va])?_a[this.va]:this.va):parseFloat(this.va); } }; }
				var node;
				if (typeof(_v)=="object") {
					node = $.extend(true, {}, base, ret, _v);
					node.va = ret.va; // Do not overwrite va field
				}
				else { node =  $.extend(true, {}, base, ret); }
				
				// HANDLE CHILDREN
				for (var n in node.op) { if (node.op[n]) { node.op[n] = jtools.math.symbology.get(node.op[n]); } }
				
				return node;
			}
		},
		pol2tree: function(_txt) {
			var ret = [];
			if (typeof(_txt)=="string") { _txt=_txt.split(" "); }
			for (var elt in _txt) {
				var newElt = jtools.math.symbology.get(_txt[elt]);
				for (var i=0; i<newElt.op.length; i++) { if (ret.length) { newElt.op[newElt.op.length-i-1]=ret.pop(); } }
				ret.push(newElt);
			}
			return ret[0];
		},
		tree2svg: function(_node,_args) {
			var svg = _node.svg();
			var size = [ svg.si[0]*jtools.math.svg.font[0], (svg.si[1]+svg.si[2])*jtools.math.svg.font[1] ];
			var id = (_args&&_args.id)?_args.id:"jmath";
			return { size:size,
				svg: "<svg xmlns:xlink='http://www.w3.org/1999/xlink' width='100%' height:'100%' "+
					"viewBox='0 0 "+size[0]+" "+size[1]+"' id='"+id+"'>"+
					"<def><style>"+
						"svg#"+id+" text { font-family: monospace; font-size:"+jtools.math.svg.font[1]+"px; }"+
						"svg#"+id+" path { fill:none; stroke-width:0.75; stroke:black; }"+
					"</style></def>"+
					(_args&&_args.bg ?"<rect x='0' y='0' width='"+size[0]+"' height='"+size[1]+"' style='fill:"+_args.bg+";'/>":"")+
					svg.svg+
					"</svg>" };
		}
	},
	gen: {
		maze: function(_args) {
		}
	},
	num: {
		round: function(_val, _p) {
			var ret = _val;
			if (!isNaN(_val) && _val.toString().length) {
				if (!_p) { _p=5; }
				var pp=Math.pow(10,_p);
				ret = Math.round(_val*pp)/pp;
			}
			return ret;
		},
		tostr: function(_val) {
			var ret = _val.toString();
			if (!isNaN(_val)) {
				var neg=(ret[0]=="-");
				if (neg) { ret=ret.substr(1);}
				var i=ret, d="", p=ret.indexOf(".");
				if (p!=-1) { i=ret.substr(0,p); d=ret.substr(p+1); }
				ret = neg?"-":"";
				for (var j=0; j<i.length; j++) {
					if (j&&((i.length-j)%jlo.numperclass)==0) { ret+=" "; }
					ret+=i[j];
				}
				if (p!=-1) {
					ret+=jlo.comma;
					for (var j=0;j<d.length; j++) {
						if (j&&(j%jlo.numperclass==0)) { ret+=" "; }
						ret+=d[j];
					}
				}
			}
			else {
				switch(ret) {
					case "*" : ret = jlo.mult; break;
				}
			}
			return ret;
		},
		tonum: function(_val) {
			ret=_val.toString();
			var regs=[[" ",""], [jlo.comma,"."], [jlo.mult,"*"]];
			for (var r in regs) {
				var rr=new RegExp(regs[r][0],"g");
				ret = ret.replace(rr, regs[r][1]);
			}
			return eval(ret);
			
		}
		
	},
	time: {
		seconds2hhmmss: function(_seconds) {
			_seconds=Math.abs(_seconds);
			var h=Math.floor(_seconds/3600);
			var m=Math.floor(_seconds/60)%60;
			var s=_seconds%60;
			return (h<10?"0":"")+h+":"+(m<10?"0":"")+m+":"+(s<10?"0":"")+s;
		},
		milli2mmssmm: function(_val) {
            _val=Math.floor(_val/100);
            var vMS = _val%10;
            var vS  = Math.floor(_val/10)%100;
            var vM  = Math.floor(_val/1000);
            if (vM>59) { vMS=9; vS=99; vM=59; }
            return (vM<10?"0":"")+vM+(vS<10?":0":":")+vS+"."+vMS;
        },
	}
}

//================
// JLODB TOOLS
//================

jlodbmaze = function(options) { if (options) for (var p in options) { this[p] = options[p]; } };
jlodbmaze.prototype = {
    constructor     : jlodbmaze,
    x               : 10,
    y               : 10,
    horiz           : [],
    verti           : [],
    gen             : function() {
        var n=this.x*this.y-1;
        for (var j= 0; j<this.x+1; j++) { this.horiz[j]= []; this.verti[j]= []; }
        var here= [Math.floor(Math.random()*this.x), Math.floor(Math.random()*this.y)];
        var path= [here];
        var unvisited= [];
        for (var j= 0; j<this.x+2; j++) {
            unvisited[j]= [];
            for (var k=0; k<this.y+2; k++)
                unvisited[j].push(j>0 && j<this.x+1 && k>0 && k<this.y+1 && (j != here[0]+1 || k != here[1]+1));
        }
        while (0<n) {
            var potential= [[here[0]+1, here[1]], [here[0],here[1]+1], [here[0]-1, here[1]], [here[0],here[1]-1]];
            var neighbors= [];
            for (var j= 0; j < 4; j++)
                if (unvisited[potential[j][0]+1][potential[j][1]+1])
                    neighbors.push(potential[j]);
            if (neighbors.length) {
                n= n-1;
                next= neighbors[Math.floor(Math.random()*neighbors.length)];
                unvisited[next[0]+1][next[1]+1]= false;
                if (next[0] == here[0])
                    this.horiz[next[0]][(next[1]+here[1]-1)/2]= true;
                else {
                    this.verti[(next[0]+here[0]-1)/2][next[1]]= true;
                }
                path.push(here= next);
            } else  { here= path.pop(); }
        }
        return this;
    },
    get : function(_from, _to) {
        var ret= [];
        for (var j= 0; j<this.x*2+1; j++) {
            var line= [];
            if (0 == j%2)
                for (var k=0; k<this.y*2+1; k++)
                    if (0 == k%2)   { line[k]= 'x'; }
                    else            { line[k]= (j>0 && this.verti[j/2-1][Math.floor(k/2)])?' ':'x'; }
            else
                for (var k=0; k<this.y*2+1; k++)
                    if (0 == k%2)   { line[k]= (k>0 && this.horiz[(j-1)/2][k/2-1])?' ':'x'; }
                    else            { line[k]= ' '; }
            ret.push(line);
        }
        return ret;
    }
};  


//================
// JLODB PLUGIN
//================

(function($) {

    var defaults = {
        debug       : false,
        standalone  : false,
        // OVERWRITABLE METHODS
        onevent     : function($this, _begin, _hide)   { if (_begin) { helpers.settings($this).onstart($this); }
                                                         else        { helpers.settings($this).onfinish($this, _hide); } },
        onstart     : function($this)           		{ /** START THE ACTIVITY */ },
        onfinish    : function($this)           		{ /** FINISH THE ACTIVITY */ },
        onscore     : function($this, _ret)     		{ /** HANDLE THE SCORE */ return false; },
        onexercice  : function($this, _id, _args)     	{ /** GET ID AND ARGS OF THE EXERCICE */ },
		onsettings	: function($this, _args)			{ /** GET WHOLE SETTINGS OF THE EXERCICE */ },
		onedit		: function($this, _args)			{ /** EDIT CALLBACK */ }

    };

    // private methods
    var helpers = {
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("jlodb", _val); } return $this.data("jlodb"); },

        rerun       : function($this) {
            var settings = helpers.settings($this);
            helpers.run($this, settings.last, settings.args);
        },

        // RUN THE EXERCICE REGARDING THE ACTIVITY NAME AND ITS ARGUMENTS
        run         : function($this, _name, _args) {
            var settings = helpers.settings($this);
            
            // HANDLE BASE/RELATION
            if (_args.dataex) { _args=$.extend({}, _args, _args.dataex); _args.dataex=0; }

            // SAVE ARGS FOR RERUN
            settings.last = _name;
            settings.args = $.extend(true, {},_args);

            // ADD CONTEXT
            var args = $.extend({ 'context': settings.context } , _args);
            args.context = settings.context;
            
            // LAUNCH EXERCICE
            if (typeof($this[_name])=='undefined')  { $.getScript('activities/'+_name+'/'+_name+'.js', function() { $this[_name](args); }); }
            else                                    { $this[_name](args); }
        },

        // FORCE QUIT FROM THE CURRENT EXERCICE
        quit        : function($this) {
            var settings = helpers.settings($this);
            $this[settings.last]('quit');
        },

        onexercice  : function($this, data) {
            var settings = helpers.settings($this);
            if (data.status=="error" || data.nb==0) { helpers.exercice($this, {id:"nlx"}); }
            else {
                var d = data.exercices[0].data;
                if (data.exercices[0].locale) {
                    if (d.locale) { d.locale = $.extend(d.locale, data.exercices[0].locale); }
                    else { d.locale = data.exercices[0].locale; } }
                if (settings.onexercice) { settings.onexercice($this, data.exercices[0].id, d); }
				if (settings.onsettings) { settings.onsettings($this, data.exercices[0]); }

                if (data.exercices[0].ext && jtools.addon && jtools.addon[data.exercices[0].ext]) {
                    jtools.addon[data.exercices[0].ext].js(function() {
						helpers.run($this,data.exercices[0].activity, d); });
                }
                else { helpers.run($this,data.exercices[0].activity, d); }
            }
        },
            // GET EXERCICE AND LAUNCH
        exercice    : function($this, _args) {
            var settings = helpers.settings($this);
            if (settings.standalone) {
				if (_args.id) {
					$.getJSON("standalone/exercice/"+_args.id+".json", function (exercice) {
						$.getJSON("standalone/activity/"+exercice.activity+".json", function (activity) {
							exercice.locale=activity;
							exercice.id=_args.id;
							var data={exercices:[exercice]};
							helpers.onexercice($this, data);
						});
					});
				}
				else { console.log("Id is mandatory on standalone mod"); }
            }
            else {
                var tmp     = new Date();
                var args    = "?limit=1&order=rand&detail&debug="+tmp.getTime();
                for (var i in _args) { args+="&"+i+"="+_args[i]; }
                var url     = "api/exercice.php"+args;
                $.getJSON(url, function (data) { helpers.onexercice($this, data); });
            }
            
        },

        // CLOSE THE EXERCICE
        end: function($this, _hide) {
            var settings = helpers.settings($this);
            if (_hide) { $this.html("").hide(); }
            settings.onevent($this,false,_hide);
        }
    };

    // The plugin
    $.fn.jlodb = function(method) {

        // public methods
        var methods = {
            init: function(options, args) {
                // The settings
                var settings = {
                    last        : "",
                    args        : "",
                    context     : {
                        onquit : function($this, _ret) {
                            var settings = helpers.settings($this);
                            if (_ret.status!="success" || !settings.onscore($this, _ret)) { helpers.end($this, true); }
                        },
                        onload: function($this) {
                            var settings = helpers.settings($this);
                            if (!$this.is(":visible")) { $this.css("opacity",0).show().animate({opacity:1},1000); }
                            settings.onevent($this,true);
                        },
						onedit: function($this, _args) {
                            var settings = helpers.settings($this);
							settings.onedit($this, _args);
						}
                    }
                };

                return this.each(function() {
                    var $this = $(this);

                    var $settings = $.extend(true, {}, defaults, options, settings);
                    helpers.settings($this, $settings);
                    
                    // LAUNCH EXERCICE DIRECTLY WITH PROVIDEN ARGUMENTS OR GET IT FROM DATABASE
                    if (args && args.activity && args.args) { helpers.run($this, args.activity, args.args); }
                    else                                    { helpers.exercice($this, args); }
                });
            },
            quit: function() { helpers.quit($(this)); return $(this);},
            close: function(_hide) { helpers.end($(this), _hide); return $(this); },
            reload: function() { helpers.end($(this), false); helpers.rerun($(this)); return $(this); }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in jlodb plugin!'); }
    };
})(jQuery);

//================
// SCORE PLUGIN
//================

(function($) {

    // JLODB PLUGIN 

    var defaults = {
        debug       : false,
        onreload    : false,
        onmenu      : false,
        onnext      : false
    };

    // private methods
    var helpers = {
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },

        // Build the score panel
        build         : function($this) {
            var settings = helpers.settings($this);
            $this.html("");
            
            $this.append("<div class='g_svalue'></div>");
            
            $this.append("<div id='g_sstar1' class='g_sstar g_anim12 g_anoloop'><div><img src='res/img/default/anim/star01.svg'/></div></div>");
            $this.append("<div id='g_sstar2' class='g_sstar g_anim12 g_anoloop'><div><img src='res/img/default/anim/star02.svg'/></div></div>");
            $this.append("<div id='g_sstar3' class='g_sstar g_anim12 g_anoloop'><div><img src='res/img/default/anim/star03.svg'/></div></div>");
            
            
            $this.append("<div id='g_sfire1' class='g_sfire g_anim12'><div><img src='res/img/default/anim/fireworks01.svg'/></div></div>");
            $this.append("<div id='g_sfire2' class='g_sfire g_anim12'><div><img src='res/img/default/anim/fireworks02.svg'/></div></div>");
            $this.append("<div id='g_sfire3' class='g_sfire g_anim12'><div><img src='res/img/default/anim/fireworks01.svg'/></div></div>");
            
            if (settings.onreload) {
                var $reload = $("<div class='icon' id='g_sreload'><img src='res/img/default/icon/action_reload01.svg' alt=''/></div>");
                $reload.bind("touchstart mousedown", function(_event) { $this.score("reload"); _event.preventDefault(); });
                $this.append($reload);
            }
            
            if (settings.onmenu) {
                var $menu = $("<div class='icon' id='g_smenu'><img src='res/img/default/icon/action_menu01.svg' alt=''/></div>");
                $menu.bind("touchstart mousedown", function(_event) { $this.score("menu"); _event.preventDefault(); });
                $this.append($menu);
            }
            
            if (settings.onnext) {
                var $next = $("<div class='icon' id='g_snext'><img src='res/img/default/icon/action_next01.svg' alt=''/></div>");
                $next.bind("touchstart mousedown", function(_event) { $this.score("next"); _event.preventDefault(); });
                $this.append($next);
            }
        }
    };

    // The plugin
    $.fn.score = function(method) {

        // public methods
        var methods = {
            init: function(options, args) {
                // The settings
                var settings = {
                    interactive : false,
                    last        : "",
                    args        : "",
                    context     : {
                        onquit : function($this) {}
                    }
                };

                return this.each(function() {
                    var $this = $(this);

                    var $settings = $.extend(true, {}, defaults, options, settings);
                    helpers.settings($this, $settings);
                    
                    helpers.build($this);
                });
            },
            reload: function() {
                var $this=$(this), settings = helpers.settings($this);
                if (settings.onreload && settings.interactive) { settings.onreload($this); }
            },
            menu: function() {
                var $this=$(this), settings = helpers.settings($this);
                if (settings.onmenu && settings.interactive) { settings.onmenu($this); }
            },
            next: function() {
                var $this=$(this), settings = helpers.settings($this);
                if (settings.onnext && settings.interactive) { settings.onnext($this); }
            },
            hide: function(_args) {
                var $this=$(this), settings = helpers.settings($this);
                for (var i=0; i<10; i++) { $this.removeClass("s"+i); }
                $this.find(".g_sstar>div").removeClass("g_arunning").parent().hide();
                $this.find(".g_sfire>div").removeClass("g_arunning").parent().hide();
                $this.hide();
            },
            show: function(_score, _args) {
                var $this=$(this), settings = helpers.settings($this);
                var time = 100;
                settings.interactive = false;
                $this.find(".g_sstar>div").removeClass("g_arunning").parent().hide();
                $this.find(".g_sfire>div").removeClass("g_arunning").parent().hide();
                $this.show();
                if (_score>2) { setTimeout(function() { $this.find("#g_sstar1>div").addClass("g_arunning").parent().show(); }, time); time+=300; }
                if (_score>3) { setTimeout(function() { $this.find("#g_sstar2>div").addClass("g_arunning").parent().show(); }, time); time+=300; }
                if (_score>4) { setTimeout(function() { $this.find("#g_sstar3>div").addClass("g_arunning").parent().show(); }, time); time+=300; }
                setTimeout(function() {
                    $this.attr("class","g_s"+_score);
                    settings.interactive=true;
                    
                    if (_score==5) {
                        setTimeout(function() { $this.find("#g_sfire1>div").addClass("g_arunning").parent().show(); }, 100);
                        setTimeout(function() { $this.find("#g_sfire2>div").addClass("g_arunning").parent().show(); }, 300);
                        setTimeout(function() { $this.find("#g_sfire3>div").addClass("g_arunning").parent().show(); }, 500);
                    }
                }, time);
                
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in score plugin!'); }
    };
})(jQuery);

