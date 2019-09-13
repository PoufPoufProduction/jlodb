(function($) {
	var defaults = {
		name: "calc",
		args: {},				// activity arguments
		validation: false,
		debug: true
	};
   

    // private methods
    var helpers = {
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },
        load: function($this, _args) {
            var settings = helpers.settings($this), debug = "";
            if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

            var templatepath = "editors/"+settings.name+"/template.html"+debug;
            $this.load( templatepath, function(response, status, xhr) {
				settings.$activity = $this.find("#e_screen>div");
				if (!settings.validation) { $this.find("#e_submit").hide(); }
				
				if (_args.locale.editor) { $.each(_args.locale.editor, function(id,value) {
					if($.type(value) === "string") {
						if (id.indexOf("eph")==-1) { $this.find("#"+id).html(value); }
						else					   { $this.find("#"+id).attr("placeholder",value); }
					}
                }); }
				
				helpers.launch($this, _args);
			});
        },
		launch: function($this, _args) {
            var settings = helpers.settings($this);
			settings.locale = _args.locale;
			settings.data = _args.data;
			
			$this.find("#e_export").val(JSON.stringify(_args.data));
			
			helpers.update($this, _args);
			
			settings.$activity.html("");
			settings.$activity.jlodb({
				onedit:		function($activity, _data) 		{ helpers.onedit($this, _data);  },
				onstart:    function($activity)       		{ settings.$activity.addClass("nosplash"); },
                onfinish:   function($activity, _hide)		{ },
                onscore:    function($activity, _ret) 		{ return true; },
                onexercice: function($activity, _id, _data)	{ _data.edit = true; } }, _args);
		},
		onedit: function($this, _data) {
            var settings = helpers.settings($this);
			
			$this.find("#e_cell").html(_data.type+" ["+_data.pos.join(",")+"]");
			settings.cell = _data;
			
			$this.find("#eph_ccolor").val(_data.elt.color?_data.elt.color:"");
			$this.find("#eph_cbg").val(_data.elt.background?_data.elt.background:"");
			$this.find("#eph_cwidth").val(_data.elt.width?_data.elt.width:"");
			$this.find("#eph_cheight").val(_data.elt.height?_data.elt.height:"");
			
			$this.find("#e_type").val(_data.elt.type?_data.elt.type:"value");
			$this.find("#eph_value").val(_data.elt.value?_data.elt.value:"");
			
			$this.find("#e_cfixed").attr("class",_data.elt.fixed?"":"s");
			$this.find("#e_cresult").attr("class",_data.elt.result?"":"s");
			
			$this.find("#eph_bgimg").val(_data.elt.bgimg?_data.elt.bgimg:"");
			
			
		},
		valid: function($this) {
            var settings = helpers.settings($this);

			var imgs = $this.find("#e_images").val().split('\n');
			var nb = 0, end = false;
			while (!end) {
				var ok = true;
				for (var i in imgs) { if (nb>=imgs[i].length || imgs[i][nb]!=imgs[0][nb]) { ok = false; }}
				if (ok) { nb++; } else { end = true; }
			}
			var imgprefix = "";
			if (nb>5) {
				imgprefix = imgs[0].substr(0,nb);
				for (var i in imgs) { imgs[i] = imgs[i].substr(nb); }
			}
			
			var data = {
				exercice: 	$this.find("#e_exercice").val(),
				imgprefix:	imgprefix,
				img:		imgs,
				txt: 		$this.find("#e_texts").val().split('\n'),
				noneg: 		$this.find("#e_neg").hasClass("s"),
				nodec: 		$this.find("#e_dec").hasClass("s"),
				withbars:	!$this.find("#e_withbars").hasClass("s"),
				withauto:	!$this.find("#e_withauto").hasClass("s"),
				callen:		$this.find("#e_len").html().length
			};
			
			if ($this.find("#eph_size").val().length) { data.size=$this.find("#eph_size").val().split("*"); }
			if ($this.find("#eph_font").val().length) { data.font=parseFloat($this.find("#eph_font").val()); }
			if ($this.find("#eph_sp").val().length)   { data.sp=parseFloat($this.find("#eph_sp").val()); }
			if ($this.find("#eph_pospanel").val().length) { data.pospanel=$this.find("#eph_pospanel").val().split(","); }
			if ($this.find("#eph_size").val().length) { 
				var vSize=$this.find("#eph_size").val().split("*");
				data.size = [ parseInt(vSize[0]), parseInt(vSize[1]) ];
			}
			
			try {
				if ($this.find("#eph_gg").val().length) { data.gg=eval($this.find("#eph_gg").val()); }
			} catch(e) { alert(e.message); }
			if ($this.find("#eph_gen").val().length) { data.gen=$this.find("#eph_gen").val(); }
			
			if ($this.find("#eph_hide").val().length) {
				var hides = $this.find("#eph_hide").val().split('\n');
				data.hide=[];
				for (var i in hides) {
					var ll=hides[i].split(',');
					var line=[];
					for (var j in ll) { line.push(parseInt(ll[j])); }
					data.hide.push(line);
				}
			}
			
			var e_class=[];
			if (!$this.find("#e_largepanel").hasClass("s")) { e_class.push("largepanel"); }
			if (e_class.length) { data["class"] = e_class.join(" "); }
			
			if (settings.cell) {
				var elt = {}
				
				if ($this.find("#eph_cbg").val().length) 		{ elt.background = $this.find("#eph_cbg").val(); }
				if ($this.find("#eph_ccolor").val().length) 	{ elt.color = $this.find("#eph_ccolor").val(); }
				if ($this.find("#eph_cwidth").val().length) 	{ elt.width = parseFloat($this.find("#eph_cwidth").val()); }
				if ($this.find("#eph_cheight").val().length) 	{ elt.height = parseFloat($this.find("#eph_cheight").val()); }

				var t = {};
				
				
				switch (settings.cell.type) {
					case "all": settings.data.all = elt; break;
					case "col": if (!settings.data.cols) { settings.data.cols={}; }
								settings.data.cols["col"+settings.cell.pos[0]]=elt;
								break;
					case "row": if (!settings.data.rows) { settings.data.rows={}; }
								settings.data.rows["row"+settings.cell.pos[1]]=elt;
								break;
					default:	
						elt.type = $this.find("#e_type").val();
						var value = $this.find("#eph_value").val();
						if (elt.type=="graph") { value = JSON.parse(value); }
						
						if ($this.find("#e_cresult").hasClass("s")) { elt.value = value; } else { elt.result = value; }
						if (!$this.find("#e_cfixed").hasClass("s")) { elt.fixed = true; }
						
						if ($this.find("#eph_bgimg").val()) { elt.bgimg = $this.find("#eph_bgimg").val(); }
						
						if (!settings.data.cells) { settings.data.cells={}; }
						settings.data.cells["c"+settings.cell.pos[0]+"x"+settings.cell.pos[1]]=elt;
								
						break;
				}
				
			}
			
			data = $.extend({},settings.data,data);
			
			$this.find("#e_export").val(JSON.stringify(data));
			helpers.import($this, data);
			
		},
		import: function($this, _args) {
            var settings = helpers.settings($this);
			try {
				var args = _args;
				if (!args) {
					args = $.parseJSON($this.find("#e_export").val());
					settings.data = $.extend({},args);
				}
				
				args.edit = true;
				args.highlight = settings.highlight;
				args.context = { 
					onedit:		function($activity, _data) { helpers.onedit($this, _data); },
					onquit:		function() { },
					onload:		function($t) { $t.addClass("nosplash"); } };
				args.locale = settings.locale;
				helpers.update($this, {data: args });
				settings.$activity[settings.name](args);
			}
			catch (e) { alert(e.message); return; }
					
		},
		update: function($this, _args) {
            var settings = helpers.settings($this);
			
			$this.find("#e_exercice").val(_args.data.exercice);
			$this.find("#e_texts").val(_args.data.txt?_args.data.txt.join('\n'):"");
			$this.find("#e_neg").attr("class",_args.data.noneg?"s":"");
			$this.find("#e_dec").attr("class",_args.data.nodec?"s":"");
			
			var val="", nb=_args.data.callen?_args.data.callen:6;
			while (val.length<nb) { val+="9"; }
			$this.find("#e_len").html(val);
			
			var imgs  = [];
			if (_args.data.img) for (var i in _args.data.img) { imgs.push(_args.data.imgprefix+_args.data.img[i]); }
			$this.find("#e_images").val(imgs.join('\n'));
			
			$this.find("#eph_size").val(_args.data.size?_args.data.size.join('*'):"");
			$this.find("#eph_font").val(_args.data.font?_args.data.font:"");
			$this.find("#eph_sp").val(_args.data.sp?_args.data.sp:"");
			$this.find("#eph_pospanel").val(_args.data.pospanel?_args.data.pospanel.join(','):"");
			
			$this.find("#e_withbars").attr("class",(typeof(_args.data.withbars)!="undefined"&&!_args.data.withbars)?"s":"");
			$this.find("#e_withauto").attr("class",_args.data.withauto?"":"s");
			$this.find("#e_largepanel").attr("class",(_args.data["class"]&&_args.data["class"].indexOf("largepanel")!=-1)?"":"s");
			
			var hide=[];
			for (var i in _args.data.hide) { hide.push(_args.data.hide[i].join(',')); }
			$this.find("#eph_hide").val(hide.join('\n'));
			
			$this.find("#eph_tips").val(_args.data.tips?_args.data.tips.join('\n'):"");
			
			
			$this.find("#eph_gg").val(_args.data.gg?JSON.stringify(_args.data.gg):"");
			$this.find("#eph_gen").val(_args.data.gen?_args.data.gen:"");
		}
    };

    // The plugin
    $.fn.calc_editor = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : true,
					$activity		: 0,				// The activity object
					editpanel		: true,
					data			: {},				// Exercice data
					cell			: 0,				// Current cell
					locale			: ""				// Locale object for relaunch
                };

                return this.each(function() {
                    var $this = $(this);

                    var $settings = $.extend({}, defaults, options, settings);
                    $this.removeClass();
                    helpers.settings($this.addClass(defaults.name+"_editor").addClass("j_editor"), $settings);
                    helpers.load($this, options.args);
                });
            },
			valid: function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
				
				if (settings.interactive)
				{
					settings.interactive = false;
					$(_elt).addClass("touch");
					setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
					setTimeout(function() { settings.interactive = true; }, 800);
					helpers.valid($this);
				}
			},
			import:function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
				
				if (settings.interactive)
				{
					settings.interactive = false;
					$(_elt).addClass("touch");
					setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
					setTimeout(function() { settings.interactive = true; }, 800);
					
					helpers.import($this,0);
				}
			},
			edit:function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
				var l = settings.args.locale.editor;
				
				if (settings.interactive)
				{
					var anim = true;
					switch($(_elt).attr("id")) {
						case 'e_cell':
							if ($(_elt).html().length) {
								$this.find('#e_tabs>div').removeClass('s');
								$this.find('#ee_tabx').addClass('s');
								$this.find('.e_tab').hide();
								$this.find('#e_tabx').show();
							}
							break;
						case 'e_import':
							if (settings.editpanel) {
								settings.editpanel = false;
								
								$this.find("#e_menu #e_import").html(l.e_toedit);
								$this.find("#e_editor").hide();
								$this.find("#e_control").show();
							}
							else {
								settings.editpanel = true;
								$this.find("#e_menu #e_import").html(l.e_import);
								$this.find("#e_editor").show();
								$this.find("#e_control").hide();
							}
							break;
						case "e_submit":
							if (settings.validation) { settings.validation($this.find("#e_export").val()); }
							break;
					}
					
					if (anim) {
						settings.interactive = false;
						$(_elt).addClass("touch");
						setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
						setTimeout(function() { settings.interactive = true; }, 500);
					}
				}
			}
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in editor plugin!'); }
    };
})(jQuery);

