(function($) {
	var defaults = {
		name: "sorting",
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
				onedit:		function($activity, _data) 		{  },
				onstart:    function($activity)       		{
					settings.$activity.addClass("nosplash");
					if (_args.data.gen) {
						$this.find("#e_import").hide();
						$this.find("#e_editor").hide();
						$this.find("#e_control").show();
					}
				},
                onfinish:   function($activity, _hide)		{ },
                onscore:    function($activity, _ret) 		{ return true; },
                onexercice: function($activity, _id, _data)	{ _data.edit = true; } }, _args);
		},
		valid: function($this) {
            var settings = helpers.settings($this);
			var data={
				exercice: $this.find("#eph_exercice").val(),
				font:     $this.find("#eph_size").val(),
				len:      $this.find("#eph_space").val(),
				number:   $this.find("#eph_nbpages").val(),
				nbvalues: $this.find("#eph_nbelts").val(),
				type:     $this.find("#eph_mode").val(),
				values:	  []
			};
			
			for (var i=0; i<6; i++) {
				var content = $this.find("#e_pages #e_page"+(i+1)).val();
				if (content.length) {
					var page = content.split('\n');
					if (data.type=="swap") { for (var l in page) { page[l] = page[l].split('|'); } }
					
					data.values.push(page);
				}
			}
			data = $.extend({}, settings.data, data);
			
			$this.find("#e_export").val(JSON.stringify(data));
			helpers.import($this, data);
		},
		import: function($this, _args) {
            var settings = helpers.settings($this);
			try {
				var args=_args;
				if (!args) {
					args = jQuery.parseJSON($this.find("#e_export").val());
					settings.data = $.extend(true,{},args);
				}
				args.edit = true;
				args.highlight = settings.highlight;
				args.context = { 
					onedit:		function($activity, _data) { helpers.word($this, _data); },
					onquit:		function() { },
					onload:		function($t) { $t.addClass("nosplash"); } };
				args.locale = settings.locale;
				helpers.update($this, {data: args });
				settings.$activity[settings.name](args);
				settings.haschanged = false;
			}
			catch (e) { alert(e.message); return; }
					
		},
		update: function($this, _args) {
            var settings = helpers.settings($this);
			if (_args.data.gen) { return; }
			
			var type = _args.data.type?_args.data.type:"swap";
			
			$this.find("#eph_exercice").val(_args.data.exercice);
			$this.find("#eph_size").val(_args.data.font);
			$this.find("#eph_space").val(_args.data.len);
			$this.find("#eph_nbpages").val(_args.data.number);
			$this.find("#eph_nbelts").val(_args.data.nbvalues);
			$this.find("#eph_mode").val(type);
			
			helpers.tabs($this, settings.pageid);
			
			
			$this.find("#e_pages textarea").val("");
			var values =  _args.data.values;
			if (type=="swap" && !$.isArray(_args.data.values[0][0])) { values = [_args.data.values]; }
			
			for (var i=0; i<values.length; i++) {
				var content = [];
				for (var l in values[i]) {
					if ($.isArray(values[i][l])) { content.push(values[i][l].join('|')); }
					else						 { content.push(values[i][l]); }
				}
				$this.find("#e_pages #e_page"+(i+1)).val(content.join('\n'));
			}
			
		},
		tabs: function($this, _id) {
            var settings = helpers.settings($this);
			
			settings.pageid=_id;
			$this.find("#e_pages textarea").hide();
			$this.find("#e_pages #e_page"+(_id+1)).show();
			
			$this.find("#e_tabs>div").removeClass("s");
			$this.find("#e_tabs #e_tab"+(_id+1)).addClass("s");
		}
    };

    // The plugin
    $.fn.sorting_editor = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : true,
					$activity		: 0,				// The activity object
					editpanel		: true,				// Editpanel
					pageid			: 0,
					data			: {},				// Exercice data
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
			},
			tab:function(_elt) { helpers.tabs($(this),parseInt($(_elt).html())-1); }
			
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in editor plugin!'); }
    };
})(jQuery);

