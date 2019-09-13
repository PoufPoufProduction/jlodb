(function($) {
	var defaults = {
		name: "jewel",
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
			$this.find("#e_export").val(JSON.stringify(_args.data));
				
			helpers.update($this, _args);
			
			settings.$activity.html("");
			settings.$activity.jlodb({
				onedit:		function($activity, _data) 		{  },
				onstart:    function($activity)       		{ settings.$activity.addClass("nosplash"); },
                onfinish:   function($activity, _hide)		{ },
                onscore:    function($activity, _ret) 		{ return true; },
                onexercice: function($activity, _id, _data)	{ _data.edit = true; } }, _args);
		},
		valid: function($this) {
            var settings = helpers.settings($this);
			var data={
				board: $this.find("#e_board").val().split('\n'),
				pjewels: [],
				specials: [],
				pspecial: $this.find("#eph_proba").val(),
				goals: [ { type:$this.find("#eph_goal").val(), value:$this.find("#eph_value").val() } ]
			};
			$this.find("#e_type .icon").each(function() { data.pjewels.push($(this).hasClass("s")?1:0); });
			$this.find("#e_bonus .icon").each(function() { data.specials.push($(this).hasClass("s")); });
			
			if ($this.find("#eph_score").val()) { data.ref = $this.find("#eph_score").val(); }
			
			if ($this.find("#e_frozen").hasClass("s")) { data.goals.push({type:"frozen"}); }
			
			$this.find("#e_export").val(JSON.stringify(data));
			helpers.import($this, data);
			
		},
		import: function($this, _args) {
            var settings = helpers.settings($this);
			try {
				var args = _args?_args:jQuery.parseJSON($this.find("#e_export").val());
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
			
			$this.find("#e_board").val(_args.data.board.join('\n'));
			if (!_args.data.pjewels) { _args.data.pjewels=[1,1,1,1,1,1,1,0,0]; }
			$this.find("#e_type .icon").removeClass("s");
			for (var i=0; i<_args.data.pjewels.length; i++) {
				if (_args.data.pjewels[i]) { $this.find("#e_type #e_type"+i).addClass("s"); }
			}
			
			if (!_args.data.specials) { _args.data.specials=[true,true,true]; }
			$this.find("#e_bonus .icon").removeClass("s");
			for (var i=0; i<_args.data.specials.length; i++) {
				if (_args.data.specials[i]) { $this.find("#e_bonus #e_bonus"+i).addClass("s"); }
			}
			
			if (typeof(_args.data.pspecial)=="undefined") { _args.data.pspecial = 20; }
			$this.find("#eph_proba").val(_args.data.pspecial);
			
			if (_args.data.ref) { $this.find("#eph_score").val(_args.data.ref); }
			
			$this.find("#e_frozen").removeClass("s");
			for (var i in _args.data.goals) {
				var goal = _args.data.goals[i];
				
				if (goal.type=="survive" || goal.type=="max") {
					$this.find("#eph_goal").val(goal.type);
					$this.find("#eph_value").val(goal.value);
				}
				if (goal.type=="frozen") { $this.find("#e_frozen").addClass("s"); }
			}
			
		}
    };

    // The plugin
    $.fn.jewel_editor = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : true,
					$activity		: 0,				// The activity object
					editpanel		: true,				// Editpanel
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
			}
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in editor plugin!'); }
    };
})(jQuery);

