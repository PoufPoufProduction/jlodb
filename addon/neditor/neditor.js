(function($) {
	// private methods
    var helpers = {
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },
        update: function($this, _node) {
            var settings = helpers.settings($this);
			
			if (!_node) { _node = jtools.math.symbology.get(0); _node.em=true; _node.va=""; }
			
            if (!_node.mtelt) {
				_node.mtid = ++settings.counter;
				_node.mtfi = function(_id) {
					if (this.op) for (var i=0; i<this.op.length; i++) { 
						if (this.op[i] && this.op[i].mtid==_id) { return [ this, i ]; } 
						var r = this.op[i].mtfi(_id);
						if (r) { return r; }
					}
					return 0;
				};
				_node.mtde = function() { _node.ea(function(_e) { if (_e.mtelt) { _e.mtelt.detach(); }}); };
				_node.mtelt = $("<div id='n"+_node.mtid+"' class='neditd nedit"+_node.ty+"'></div>");
				
				settings.$tree.append(_node.mtelt);
				
				_node.mtelt.droppable({accept:".nedita", greedy:true,
					over: function(event, ui) { $(this).addClass("over"); },
					out: function(event, ui) { $(this).removeClass("over"); },
					drop:function(event, ui) {
						$this.find(".over").removeClass("over");
						var vPar = settings.root.mtfi($(this).attr("id").substr(1));
						var vNew = settings.getnode($this, $(ui.draggable).attr("id"));
						
						if (vNew) {
							if ((vPar&&vPar[0]&&vPar[0].fi&&vNew.ty!="va") || (vNew.ro)) {  }
							else {
								if (vPar) {
									vPar[0].op[vPar[1]].mtde();
									vPar[0].op[vPar[1]] = vNew;
								} else { settings.root.mtde(); settings.root = vNew; }
								helpers.update($this, vNew); helpers.display($this);
							}
						}
					}
				});
					
				if (_node.op) {	for (var i in _node.op) { _node.op[i] = helpers.update($this, _node.op[i]); } }
				
				if (!_node.em) {
					var vClass="nedita nedit"+_node.ty;
					var vLabel = (_node.ty=="va"&&_node.la)?_node.la.toString():_node.va.toString();
					var vLen = vLabel.length;
                    var $elt=$("<div class='"+vClass+"'><div class='neditlabel'>"+vLabel+"</div></div>");
					if (vLen>2) {
						$elt.find(".neditlabel").css("font-size",(1.5/vLen)+"em")
						                        .css("padding-top",(vLen/8)+"em"); }
					_node.mtelt.html($elt);
				}
					
			}
			return _node;
        },
		display: function($this, _node, _level, _left) {
			var settings = helpers.settings($this);
            if (!_node) { $this.find(".neditlink").detach(); _node=settings.root; _level=0; _left=0; }

			if (_level==0) { settings.$tree.css("font-size", settings.font+"em"); }
			if (_node) {
			
				var width    = 0;
				var offset   = 0;
				var links    = "";
				var maxlevel = _level;
				var minoff   = -1;
				var maxoff   = 0;
				
				// BUILD LINKS AND MOVE NODES
				if (_node.op && _node.op.length) {
					for (var i in _node.op) {
						var r = helpers.display($this,_node.op[i], _level+1, _left+width);
						maxlevel = Math.max(maxlevel, r.maxlevel);
						if (minoff<0) { minoff=r.offset+width; }
						maxoff = r.offset+width;
						offset+= maxoff;
						
						settings.$tree.append("<div class='neditlink' style='top:"+(_level*1.75+1.55)+"em;"+
						   "left:"+(r.offset+width+_left)+"em;width:0em;height:0.15em;'></div>");
						
						width += r.width;
						width += 0.5;
					}
					width -= 0.5;
					offset = offset/_node.op.length;
					
					settings.$tree.append("<div class='neditlink' style='top:"+(_level*1.75+1.35)+"em;"+
						   "left:"+(offset+_left)+"em;width:0em;height:0.15em;'></div>");
					settings.$tree.append("<div class='neditlink' style='top:"+(_level*1.75+1.55)+"em;"+
						   "left:"+(minoff+_left)+"em;width:"+(maxoff-minoff)+"em;height:0;'></div>");
				}
				else { width = 1.2; offset = 0.6; }
				
				_node.mtelt.css("top",(_level*1.75+0.6)+"em").css("left",(offset+_left)+"em");
				
				// HANDLE GENERAL SIZE AND POSITION
				if (_level==0) {
					// SIZE
					var eltwidth = _node.mtelt.width();
					var pixelperem   = eltwidth/(1.2*settings.font);
					var height = maxlevel*1.75+1.2;
					var w = ((width+0.2) *pixelperem)*1.1;
					var h = ((height+0.2)*pixelperem)*1.1;
					settings.font = Math.min(3,Math.round(10*Math.min($this.width()/w, $this.height()/h))/10);
					
					// OFFSET
					eltwidth = pixelperem*settings.font;
					w = ((width+0.2) *eltwidth);
					h = ((height+0.2)*eltwidth);
					var offw = Math.max(0,($this.width()-w)/2);
					var offh = Math.max(0,($this.height()-h)/2);
					
					settings.$tree.css("font-size",settings.font+"em")
								  .css("left",offw+"px").css("top",offh+"px"); // TODO: convert into em
					
					if (settings.onupdate) { settings.onupdate($this, settings.root); }
				}
				
				return { width: width, offset: offset, maxlevel: maxlevel };
			}
		},
		init: function($this) {
			var settings = helpers.settings($this);
			
			settings.$tree =$("<div id='nedittree'></div>");
			var $clear = $("<div id='neditclear'>C</div>");
			$clear.bind("mousedown touchstart", function(_event) {
				helpers.clear($this);
				_event.preventDefault(); _event.stopPropagation();
			});
			$this.html(settings.$tree)
			     .append($clear)
				 .append("<div id='neditmask'></div>");

            $this.bind("mousedown touchstart", function(_event) {
				$this.find("#neditclear").css("opacity",1).show();
				if (settings.clearId) { clearTimeout(settings.clearId); }
				settings.clearId = setTimeout(function() {
					$this.find("#neditclear").animate({opacity:0}, 500, function() { $(this).hide()}); settings.clearId=0;}, 2000);
				_event.preventDefault(); _event.stopPropagation();
            });

            $this.droppable({accept:".nedita",
                drop:function(event, ui) {
					var vNew = settings.getnode($this, $(ui.draggable).attr("id"));
					if (vNew) {
						if (settings.root!=0) {
							if ( vNew.op && vNew.op.length && !vNew.op[0] && !settings.root.ro) { 
								vNew.op[0] = settings.root;
							}
							else { settings.root.mtde(); }
						}
						settings.root = vNew;
						helpers.update($this, vNew); 
						helpers.display($this); }
				}
            });
		},
		clear: function($this, _newroot) {
			var settings = helpers.settings($this);
			$this.find("#neditmask").css("opacity",1).show();
			if (settings.root) { settings.root.mtde(); }
			settings.root = 0;
			if (_newroot) {
				helpers.update($this, _newroot);
				settings.root = _newroot;
			}
			helpers.display($this);
			settings.onupdate($this, settings.root);
			if (settings.clearId) { clearTimeout(settings.clearId); settings.clearId = 0; }
			$this.find("#neditclear").hide();
			$this.find("#neditmask").animate({opacity:0}, 500, function() { $(this).hide()});
		}
	};
	
    // The plugin
    $.fn.neditor = function(method) {

        // public methods
        var methods = {
            init: function(options) {
				var defaults = {
					getnode: function($this, _id) { return jtools.math.symbology.get(0); }
				};
				
                var settings = {
					root    : 0,
					clearid : 0,
					counter : 0,
					$tree	: 0,
					font	: 1
                };

                return this.each(function() {
                    var $this = $(this);

                    var $settings = $.extend(true, {}, defaults, options, settings);
                    helpers.settings($this, $settings);
                    $this.addClass("neditor");

                    helpers.init($this);
                });
            },
            clear: function(_newroot) { helpers.clear($(this),_newroot); },
			getroot: function() { return helpers.settings($(this)).root; } 
            
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in editor plugin!'); }
    };
})(jQuery);

