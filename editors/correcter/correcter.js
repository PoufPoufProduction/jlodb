(function($) {
	var defaults = {
		name: "correcter",
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
				onedit:		function($activity, _data) 		{ helpers.word($this, _data); },
				onstart:    function($activity)       		{ settings.$activity.addClass("nosplash"); },
                onfinish:   function($activity, _hide)		{ },
                onscore:    function($activity, _ret) 		{ return true; },
                onexercice: function($activity, _id, _data)	{ _data.edit = true; } }, _args);
		},
		valid: function($this) {
            var settings = helpers.settings($this);
			var text = $this.find("#eph_text").val();

			if (settings.word) {
				var hascandidate = $this.find("#eph_candidates").val().length;
				var local 	= hascandidate && ($this.find("#eph_local").val()=="0");
				var newword = settings.word.real;
				if (local && settings.word.real==settings.word.word) {
					newword = settings.word.word+"_"+(settings.reference++);
				}
				else if (!local && settings.word.real!=settings.word.word) {
					settings.dictionary[settings.word.real]=[];
					newword = settings.word.word;
				}

				// FIND POSITION OF THE WORD IN THE Textarea
				if (newword!=settings.word.real)
				{
					var pos = 0;
					for (var i=0; i<=settings.word.index; i++) {
						if (pos!=-1) { pos = text.indexOf(settings.word.words[i], pos); }
					}					
					if (pos!=-1) {
						var newtext = text.substr(0,pos);
						newtext+=newword+text.substr(pos+settings.word.real.length);
						text=newtext;
					}
					settings.word.words[settings.word.index]=newword;
				}
				if (hascandidate) {
					settings.dictionary[newword]=$this.find("#eph_candidates").val().split(",");
				}
				else { settings.dictionary[newword]=[]; }
			}
			
			// CLEAN THE DICTIONARY;
			var newdictionary=[];
			for (var i in settings.dictionary) {
				if (settings.dictionary[i].length) {
					newdictionary[i] = settings.dictionary[i];
				}
			}
			settings.dictionary=$.extend({},newdictionary);
			
			var data = {
				text: text.split('\n'),
				dictionary: settings.dictionary,
				proba: $this.find("#eph_proba").val(),
				style: $this.find("#eph_style").val(),
				first: ($this.find("#eph_first").val()=="1"),
				font: $this.find("#eph_size").val()
			};
			
			if ($this.find("#eph_exercice").val().length) {
				data.exercice = $this.find("#eph_exercice").val();
			}
			
			$this.find("#e_word").hide();
			settings.word=0;
			data = $.extend(true,{}, settings.data, data);
			
			$this.find("#e_export").val(JSON.stringify(data));
			helpers.import($this, data);
			
		},
		import: function($this, _args) {
            var settings = helpers.settings($this);
			try {
				var args = _args;
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
			
			settings.dictionary = _args.data.dictionary;
			
			settings.reference = 1;
			for (var i in settings.dictionary) {
				if (i.indexOf("_")!=-1) { settings.reference=Math.max(settings.reference,1+parseInt(i.substr(i.indexOf("_")+1))); }
			}
			
			var text = _args.data.text.join('\n');
			$this.find("#eph_text").val(text);
			
			$this.find("#eph_size").val(_args.data.font);
			$this.find("#eph_proba").val(_args.data.proba);
			$this.find("#eph_style").val(_args.data.style);
			$this.find("#eph_first").val(_args.data.first?"1":"0");
			$this.find("#eph_exercice").val(_args.data.exercice);
		},
		word: function($this, _args) {
			var settings = helpers.settings($this);
			
			if (!settings.haschanged) {
				var l = settings.args.locale.editor;
				
				if (!settings.editpanel) {
					settings.editpanel = true;
					$this.find("#e_menu #e_import").html(l.e_import);
					$this.find("#e_editor").show();
					$this.find("#e_control").hide();
				}
				
				$this.find("#eph_word").val(_args.word);
				$this.find("#eph_candidates").val(_args.glossary);
				$this.find("#eph_local").val(_args.word==_args.real?"1":"0");
				$this.find("#e_word").show();
				
				settings.word=_args;
			}
		}
    };

    // The plugin
    $.fn.correcter_editor = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : true,
					$activity		: 0,				// The activity object
					reference		: 1,				// First reference
					editpanel		: true,
					highlight		: false,
					dictionary		: [],
					haschanged		: false,
					word			: 0,				// Current word
					data			: {},				// Exercice data
					locale			: ""				// Locale object for relaunch
                };

                return this.each(function() {
                    var $this = $(this);

                    var $settings = $.extend({}, defaults, options, settings);
                    $this.removeClass();
                    helpers.settings($this.addClass(defaults.name+"_editor").addClass("jlodb_editor"), $settings);
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
						case 'e_display':
							settings.highlight = !settings.highlight;
							settings.$activity[settings.name]("e_highlight",settings.highlight);
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
			},
			onchange: function($this) {
                var $this = $(this) , settings = helpers.settings($this);
				$this.find("#e_word").hide();
				settings.word=0;
				settings.haschanged = true;
			}
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in editor plugin!'); }
    };
})(jQuery);

