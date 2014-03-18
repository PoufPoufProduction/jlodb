jlodbext =  {
    midi: {
        count: 0,
        files: ["js/MIDI/AudioDetect.js","js/MIDI/LoadPlugin.js","js/MIDI/Plugin.js","js/MIDI/Player.js",
                "js/Window/DOMLoader.XMLHttp.js","js/Window/DOMLoader.script.js","inc/Base64.js","inc/base64binary.js"],
        js: function(_callback) {
            if (jlodbext.midi.count==0) {
                jlodbext.midi.count++;
                for (var i in jlodbext.midi.files) {
                    $.getScript('ext/MIDI/'+jlodbext.midi.files[i], function() {
                        if (++jlodbext.midi.count==jlodbext.midi.files.length+1) { _callback(); }
                    });
                }
            }
            else { _callback(); }
        },
        load        : function(_args)                               { MIDI.loadPlugin(_args); },
        setVolume   : function(_channel, _volume)                   { MIDI.setVolume(_channel, _volume); },
        noteOn      : function(_channel, _note, _velocity, _delay)  { MIDI.noteOn(_channel, _note, _velocity, _delay); },
        noteOff     : function(_channel, _note, _delay)             { MIDI.noteOff(_channel, _note, _delay ); }

    }
};


