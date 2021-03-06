var App = {
    init: function() {
        var self = this;

        Quagga.init(this.state, function(err) {
            if (err) {
                return self.handleError(err);
            }
            //Quagga.registerResultCollector(resultCollector);
            App.attachListeners();
            App.checkCapabilities();
            Quagga.start();
        });
    },
    handleError: function(err) {
        console.log(err);
    },
    checkCapabilities: function() {
        var track = Quagga.CameraAccess.getActiveTrack();
        var capabilities = {};
        if (typeof track.getCapabilities === 'function') {
            capabilities = track.getCapabilities();
        }
        this.applySettingsVisibility('zoom', capabilities.zoom);
        this.applySettingsVisibility('torch', capabilities.torch);
    },
    updateOptionsForMediaRange: function(node, range) {
        console.log('updateOptionsForMediaRange', node, range);
        var NUM_STEPS = 6;
        var stepSize = (range.max - range.min) / NUM_STEPS;
        var option;
        var value;
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
        for (var i = 0; i <= NUM_STEPS; i++) {
            value = range.min + (stepSize * i);
            option = document.createElement('option');
            option.value = value;
            option.innerHTML = value;
            node.appendChild(option);
        }
    },
    applySettingsVisibility: function(setting, capability) {
        // depending on type of capability
        if (typeof capability === 'boolean') {
            var node = document.querySelector('input[name="settings_' + setting + '"]');
            if (node) {
                node.parentNode.style.display = capability ? 'block' : 'none';
            }
            return;
        }
        if (window.MediaSettingsRange && capability instanceof window.MediaSettingsRange) {
            var node = document.querySelector('select[name="settings_' + setting + '"]');
            if (node) {
                this.updateOptionsForMediaRange(node, capability);
                node.parentNode.style.display = 'block';
            }
            return;
        }
    },
    initCameraSelection: function(){
        var streamLabel = Quagga.CameraAccess.getActiveStreamLabel();

        return Quagga.CameraAccess.enumerateVideoDevices()
        .then(function(devices) {
            function pruneText(text) {
                return text.length > 30 ? text.substr(0, 30) : text;
            }
            var $deviceSelection = document.getElementById("deviceSelection");
            while ($deviceSelection.firstChild) {
                $deviceSelection.removeChild($deviceSelection.firstChild);
            }
            devices.forEach(function(device) {
                var $option = document.createElement("option");
                $option.value = device.deviceId || device.id;
                $option.appendChild(document.createTextNode(pruneText(device.label || device.deviceId || device.id)));
                $option.selected = streamLabel === device.label;
                $deviceSelection.appendChild($option);
            });
        });
    },
    attachListeners: function() {
        var self = this;

        self.initCameraSelection();
        $(".controls").on("click", "button.stop", function(e) {
            e.preventDefault();
            Quagga.stop();
            self._printCollectedResults();
        });

        $(".controls .reader-config-group").on("change", "input, select", function(e) {
            e.preventDefault();
            var $target = $(e.target),
                value = $target.attr("type") === "checkbox" ? $target.prop("checked") : $target.val(),
                name = $target.attr("name"),
                state = self._convertNameToState(name);

            console.log("Value of "+ state + " changed to " + value);
            self.setState(state, value);
        });
    },
}

App.init();