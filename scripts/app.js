/* globals SIP,user,moment, Stopwatch */

var ctxSip;
const params = new URLSearchParams(window.location.search);

// Get specific parameters
const param1 = params.get('param1');
const name = params.get('param2');
const anexo = params.get('param3');
const host = params.get('param4');
const pass = params.get('param5');

$(document).ready(function () {


    if (typeof (user) === 'undefined') {
        user = JSON.parse(localStorage.getItem('SIPCreds'));
    }

    $('#agent').text(name);
    $('#anexo').text(anexo);

    ctxSip = {

        config: {
            password: pass,
            displayName: param1,
            // uri: "sip:" + param1 + "@172.16.200.37",
            uri: "sip:" + param1 + "@" + host,
            // wsServers: "wss://172.16.200.37:8089/ws",
            wsServers: "wss://" + host + ":8089/ws",
            registerExpires: 30,
            traceSip: true,
            log: {
                level: 0,
            }
        },
        ringtone: document.getElementById('ringtone'),
        ringbacktone: document.getElementById('ringbacktone'),
        dtmfTone: document.getElementById('dtmfTone'),

        Sessions: [],
        callTimers: {},
        callActiveID: null,
        callVolume: 1,
        Stream: null,

        /**
         * Parses a SIP uri and returns a formatted US phone number.
         *
         * @param  {string} phone number or uri to format
         * @return {string}       formatted number
         */
        formatPhone: function (phone) {

            var num;

            if (phone.indexOf('@')) {
                num = phone.split('@')[0];
            } else {
                num = phone;
            }

            num = num.toString().replace(/[^0-9]/g, '');

            if (num.length === 10) {
                return '(' + num.substr(0, 3) + ') ' + num.substr(3, 3) + '-' + num.substr(6, 4);
            } else if (num.length === 11) {
                return '(' + num.substr(1, 3) + ') ' + num.substr(4, 3) + '-' + num.substr(7, 4);
            } else {
                return num;
            }
        },

        // Sound methods
        startRingTone: function () {
            try { ctxSip.ringtone.play(); } catch (e) { }
        },

        stopRingTone: function () {
            try { ctxSip.ringtone.pause(); } catch (e) { }
        },

        startRingbackTone: function () {
            try { ctxSip.ringbacktone.play(); } catch (e) { }
        },

        stopRingbackTone: function () {
            try { ctxSip.ringbacktone.pause(); } catch (e) { }
        },

        // Genereates a rendom string to ID a call
        getUniqueID: function () {
            return Math.random().toString(36).substr(2, 9);
        },

        newSession: function (newSess) {

            newSess.displayName = newSess.remoteIdentity.displayName || newSess.remoteIdentity.uri.user;
            newSess.ctxid = ctxSip.getUniqueID();

            var status;

            if (newSess.direction === 'incoming') {
                status = "Llamada entrante: " + newSess.displayName;
                ctxSip.startRingTone();
            } else {
                status = "Intentado: " + newSess.displayName;
                ctxSip.startRingbackTone();
            }

            ctxSip.logCall(newSess, 'ringing');

            ctxSip.setCallSessionStatus(status);

            // EVENT CALLBACKS

            newSess.on('progress', function (e) {
                if (e.direction === 'outgoing') {
                    ctxSip.setCallSessionStatus('Llamando...');
                }
            });

            newSess.on('connecting', function (e) {
                if (e.direction === 'outgoing') {
                    ctxSip.setCallSessionStatus('Conectando...');
                }
            });

            newSess.on('accepted', function (e) {
                // If there is another active call, hold it
                // if (ctxSip.callActiveID && ctxSip.callActiveID !== newSess.ctxid) {
                //     ctxSip.phoneHoldButtonPressed(ctxSip.callActiveID);
                // }

                ctxSip.stopRingbackTone();
                ctxSip.stopRingTone();
                ctxSip.setCallSessionStatus('Contestada');
                ctxSip.logCall(newSess, 'answered');
                ctxSip.callActiveID = newSess.ctxid;
            });

            newSess.on('hold', function (e) {
                ctxSip.callActiveID = null;
                ctxSip.logCall(newSess, 'holding');
            });

            newSess.on('unhold', function (e) {
                ctxSip.logCall(newSess, 'resumed');
                ctxSip.callActiveID = newSess.ctxid;
            });

            newSess.on('muted', function (e) {
                ctxSip.Sessions[newSess.ctxid].isMuted = true;
                ctxSip.setCallSessionStatus("Mute");
            });

            newSess.on('unmuted', function (e) {
                ctxSip.Sessions[newSess.ctxid].isMuted = false;
                ctxSip.setCallSessionStatus("Contestada");
            });
            if (newSess.innerCall) {
                function removeAudioRemoteS2() {
                    var element = document.getElementById('audioRemoteS2');

                    if (element) {
                        // Element found, remove it
                        element.parentNode.removeChild(element);
                        console.log('Element with ID "audioRemoteS2" removed.');
                    } else {
                        // Element not found
                        console.log('Element with ID "audioRemoteS2" not found.');
                    }
                }
                newSess.on('cancel', function (e) {
                    ctxSip.stopRingTone();
                    ctxSip.stopRingbackTone();
                    ctxSip.setCallSessionStatus("Cancelada");
                    ctxSip.logCall(this, 'ended');
                    if (this.direction === 'outgoing') {
                        ctxSip.callActiveID = null;
                        newSess = null;
                    }
                    removeAudioRemoteS2()
                });

                newSess.on('bye', function (e) {
                    ctxSip.stopRingTone();
                    ctxSip.stopRingbackTone();
                    ctxSip.setCallSessionStatus("");
                    ctxSip.callActiveID = null;
                    ctxSip.logCall(newSess, 'ended');
                    newSess = null;
                    removeAudioRemoteS2()
                });

                newSess.on('failed', function (e) {
                    ctxSip.stopRingTone();
                    ctxSip.stopRingbackTone();
                    ctxSip.setCallSessionStatus('Terminada');
                    removeAudioRemoteS2()
                });

                newSess.on('rejected', function (e) {
                    ctxSip.stopRingTone();
                    ctxSip.stopRingbackTone();
                    ctxSip.setCallSessionStatus('Rechazada');
                    ctxSip.callActiveID = null;
                    ctxSip.logCall(this, 'ended');
                    newSess = null;
                    removeAudioRemoteS2()
                });
            } else {
                function removeActiveSessions() {
                    ctxSip.Sessions.forEach(function (session) {
                        // Perform hang-up operation for each session
                        ctxSip.sipHangUp(session.sessionID); // Assuming sessionID is used to identify sessions
                    });
                    ctxSip.Sessions = [];
                }
                newSess.on('cancel', function (e) {
                    ctxSip.stopRingTone();
                    ctxSip.stopRingbackTone();
                    ctxSip.setCallSessionStatus("Cancelada");
                    ctxSip.logCall(this, 'ended');
                    if (this.direction === 'outgoing') {
                        ctxSip.callActiveID = null;
                        newSess = null;
                    }
                    removeActiveSessions()
                    ctxSip.logClear();
                });

                newSess.on('bye', function (e) {
                    ctxSip.stopRingTone();
                    ctxSip.stopRingbackTone();
                    ctxSip.setCallSessionStatus("");
                    ctxSip.callActiveID = null;
                    ctxSip.logCall(newSess, 'ended');
                    newSess = null;
                    removeActiveSessions()
                    ctxSip.logClear();
                });

                newSess.on('failed', function (e) {
                    ctxSip.stopRingTone();
                    ctxSip.stopRingbackTone();
                    ctxSip.setCallSessionStatus('Terminada');
                    removeActiveSessions()
                    ctxSip.logClear();
                });

                newSess.on('rejected', function (e) {
                    ctxSip.stopRingTone();
                    ctxSip.stopRingbackTone();
                    ctxSip.setCallSessionStatus('Rechazada');
                    ctxSip.callActiveID = null;
                    ctxSip.logCall(this, 'ended');
                    newSess = null;
                    removeActiveSessions()
                    ctxSip.logClear();
                });
            }
            ctxSip.Sessions[newSess.ctxid] = newSess;

        },

        // getUser media request refused or device was not present
        getUserMediaFailure: function (e) {
            window.console.error('getUserMedia failed:', e);
            // ctxSip.setError(true, 'Media Error.', 'You must allow access to your microphone.  Check the address bar.', true);
        },

        getUserMediaSuccess: function (stream) {
            ctxSip.Stream = stream;
        },

        /**
         * sets the ui call status field
         *
         * @param {string} status
         */
        setCallSessionStatus: function (status) {
            $('#txtCallStatus').html(status);
        },

        /**
         * sets the ui connection status field
         *
         * @param {string} status
         */
        setStatus: function (status) {
            // i='<span class="rounded-[50%] bg-green-400 p-3">';
            i = '<i class="fa fa-signal text-3xl text-white self-center"></i>';
            $("#status-net").html(i);
            $("#txtRegStatus").html(status);
        },

        /**
         * logs a call to localstorage
         *
         * @param  {object} session
         * @param  {string} status Enum 'ringing', 'answered', 'ended', 'holding', 'resumed'
         */
        logCall: function (session, status) {
            console.log(status)
            var log = {
                clid: session.displayName,
                uri: session.remoteIdentity.uri.toString(),
                id: session.ctxid,
                time: new Date().getTime()
            },
                calllog = JSON.parse(localStorage.getItem('sipCalls'));

            if (!calllog) { calllog = {}; }

            if (!calllog.hasOwnProperty(session.ctxid)) {
                calllog[log.id] = {
                    id: log.id,
                    clid: log.clid,
                    uri: log.uri,
                    start: log.time,
                    flow: session.direction,
                    innerCall: session.innerCall,
                };
            }

            if (status === 'ended') {
                calllog[log.id].stop = log.time;
            }
            if (status === 'answered') {
                calllog[log.id].answered = true;
            }
            if (status === 'ended' && calllog[log.id].status === 'ringing') {
                calllog[log.id].status = 'missed';
            } else {
                calllog[log.id].status = status;
            }

            localStorage.setItem('sipCalls', JSON.stringify(calllog));
            ctxSip.logShow();
        },

        /**
         * adds a ui item to the call log
         *
         * @param  {object} item log item
         */
        logItem: function (item) {

            const duration = moment.duration(item.stop - item.start);
            const formattedDuration = moment.utc(duration.asMilliseconds()).format('mm:ss');
            var callActive = (item.status !== 'ended' && item.status !== 'missed'),
                callLength = (item.status !== 'ended') ? '<span id="' + item.id + '"></span>' : formattedDuration,
                callClass = '',
                callIcon,
                i;

            switch (item.status) {
                case 'ringing':
                    callClass = 'bg-white primary-shadow';
                    callIcon = 'fa-phone';
                    break;

                case 'holding':
                    callClass = 'list-group-item-warning primary-shadow';
                    callIcon = 'fa-pause';
                    break;

                case 'answered':
                case 'resumed':
                    callClass = 'list-group-item-info primary-shadow';
                    callIcon = 'fa-phone-square';
                    break;

            }

            i = '<div class="w-5/6 overflow-hidden border-none list-group-item sip-logitem clearfix ' + callClass + '" data-uri="' + item.uri + '" data-sessionid="' + item.id + '" title="">';
            i += '<div class="w-full px-2 pt-2">';
            if (item.flow === 'incoming' && item.status === 'ringing') {
                i += '<div class="log-title text-2xl border-b-2 mb-3">Llamada entrada</div>';
            } else if (item.flow === 'outgoing' && item.status === 'ringing') {
                if (item.innerCall) {
                    if (item.innerCall == 1) {
                        i += '<div class="log-title text-2xl border-b-2 mb-3">Llamada Transferencia</div>';
                    } else {
                        i += '<div class="log-title text-2xl border-b-2 mb-3">Llamada Conferencia</div>';
                    }
                } else {
                    i += '<div class="log-title text-2xl border-b-2 mb-3">Llamada salida</div>';
                }
            }
            if (item.status === 'resumed' || item.status === 'answered') {
                if (item.innerCall) {
                    if (item.innerCall == 1) {
                        i += '<div class="log-title text-2xl border-b-2 mb-3">Llamada Transferencia en curso</div>';
                    } else {
                        i += '<div class="log-title text-2xl border-b-2 mb-3">Llamada Conferencia en curso</div>';
                    }
                } else {
                    i += '<div class="log-title text-2xl border-b-2 mb-3">Llamada en curso</div>';
                }
            } else if (item.status === 'holding') {
                i += '<div class="log-title text-2xl border-b-2 mb-3">Llamada en espera</div>';
            }
            i += '<div class="clearfix"><div class="pull-left text-2xl">';
            i += '<i class="fa fa-fw ' + callIcon + ' fa-fw"></i> <strong>' + ctxSip.formatPhone(item.uri) + '</strong><br><small>' + moment(item.start).format('MM/DD hh:mm:ss a') + '</small>';
            i += '</div>';
            i += '<div class="pull-right text-right text-2xl"><em>' + item.clid + '</em><br>' + callLength + '</div></div></div>';
            // console.log(item.innerCall)
            if (callActive) {
                i += '<div class="relative h-16"></div>';
                i += '<div class="bg-gray-300 w-full flex justify-end absolute bottom-[0%]">';

                if (item.status === 'ringing' && item.flow === 'incoming') {
                    i += '<button class="btn btn-md btn-success btnCall rounded-none text-4xl" title="Contestar"><i class="fa fa-phone"></i></button>';
                } else {
                    if (item.innerCall) {
                        if (item.innerCall == 1) {
                            i += '<button class="btn btn-md btnSendTransfer rounded-none" title="Completar Transferencia"><i class="fa fa-share"></i></button>';
                        }
                    } else if (item.status === 'answered' | item.status === 'resumed' | item.status === 'holding') {
                        i += '<button class="btn btn-md btnHoldResume rounded-none text-3xl" title="Espera"><i class="fa fa-pause"></i></button>';
                        i += '<button class="btn btn-md btnTransfer rounded-none text-3xl" title="Transferir"><i class="fa fa-random"></i></button>';
                        i += '<button class="btn btn-md btnAddBuddy rounded-none text-3xl" title="Agregar persona"><i class="fa fa-plus"></i></button>';
                        i += '<button class="btn btn-md btnMute rounded-none text-3xl" title="Mutear"><i class="fa fa-fw fa-microphone"></i></button>';
                    }
                }
                i += '<button class="btn btn-md btn-danger btnHangUp rounded-none text-4xl" title="Colgar"><i class="fa fa-phone transform rotate-[138deg]"></i></button>';
                i += '</div>';
                i += '</div>';
                $('#call-section').append(i);
            }
            // else {
            //     $('#sip-logitems').append(i);
            // }



            // Start call timer on answer
            if (item.status === 'answered' | item.status === 'resumed') {
                var tEle = document.getElementById(item.id);
                if (!ctxSip.callTimers[item.id]) {
                    ctxSip.callTimers[item.id] = new Stopwatch(tEle);
                    ctxSip.callTimers[item.id].start();
                } else {
                    ctxSip.callTimers[item.id].setElement(tEle);
                    // ctxSip.callTimers[item.id].start();
                }
            }

            if (callActive && item.status !== 'ringing') {
                ctxSip.callTimers[item.id].start({ startTime: item.start });
            }

            $('#sip-logitems').scrollTop(0);
        },

        /**
         * updates the call log ui
         */
        logShow: function () {

            var calllog = JSON.parse(localStorage.getItem('sipCalls')),
                x = [];

            if (calllog !== null) {

                $('#call-section').empty();
                // $('#sip-logitems').empty();
                // JS doesn't guarantee property order so
                // create an array with the start time as
                // the key and sort by that.

                // Add start time to array
                $.each(calllog, function (k, v) {
                    x.push(v);
                });

                // sort descending
                x.sort(function (a, b) {
                    return b.start - a.start;
                });

                $.each(x, function (k, v) {
                    ctxSip.logItem(v);
                });

            } else {
                // $('#sip-logitems').empty();
            }
        },

        /**
         * removes log items from localstorage and updates the UI
         */
        logClear: function () {

            localStorage.removeItem('sipCalls');
            ctxSip.logShow();
        },

        sipCall: function (target) {
            try {
                var s = ctxSip.phone.invite(target, {
                    media: {
                        stream: ctxSip.Stream,
                        constraints: { audio: true, video: false },
                        render: {
                            remote: $('#audioRemote').get()[0]
                        },
                        RTCConstraints: { "optional": [{ 'DtlsSrtpKeyAgreement': 'true' }] }
                    }
                });
                s.direction = 'outgoing';
                ctxSip.newSession(s);
            } catch (e) {
                throw (e);
            }
        },

        sipTransfer: function (sessionid) {

            var s = ctxSip.Sessions[sessionid],
                target = window.prompt('Ingrese el numero', '');
            if (!target) {
                return;
            }
            s.hold();
            try {
                var remoteRenderS2 = document.createElement('audio');
                remoteRenderS2.autoplay = true;
                remoteRenderS2.id = 'audioRemoteS2'; // Adjust the ID as needed
                document.body.appendChild(remoteRenderS2);
                var s2 = ctxSip.phone.invite(target, {
                    media: {
                        stream: ctxSip.Stream,
                        constraints: { audio: true, video: false },
                        render: {
                            remote: remoteRenderS2
                        },
                        RTCConstraints: { "optional": [{ 'DtlsSrtpKeyAgreement': 'true' }] }
                    }
                });
                s2.direction = 'outgoing';
                s2.innerCall = 1;
                // s2.holdSession = s;
                ctxSip.newSession(s2);
                // console.log(s2);
                // call
                s2.on('accepted', function () {
                    // Once the new call (s2) is accepted, you can proceed with the transfer
                    function handleTransferClick() {
                        try {
                            s2.refer(s);
                            ctxSip.setCallSessionStatus('<i>Transferiendo la llamada...</i>');
                            remoteRenderS2.remove();
                        } catch (error) {
                            console.log(error);
                        }
                    }
                    s2.mute();
                    s2.unmute();
                    $(".btnSendTransfer").one("click", handleTransferClick);
                });
            } catch (e) {
                throw (e);
            }
        },
        addBuddy: function (sessionid) {
            var s = ctxSip.Sessions[sessionid];
            var target = window.prompt('Ingrese el numero para agregar', '');
            if (!target) {
                return;
            }
            var remoteRenderS2 = document.createElement('audio');
            remoteRenderS2.autoplay = true;
            remoteRenderS2.id = 'audioRemoteS2'; // Adjust the ID as needed
            document.body.appendChild(remoteRenderS2);
            s.unhold();
            setTimeout(() => {
                try {
                    // Create a new call session for Call B (the buddy)
                    var s2 = ctxSip.phone.invite(target, {
                        media: {
                            stream: mixAudioStreams(ctxSip.Stream, s.getRemoteStreams()[0]),
                            constraints: { audio: true, video: false },
                            render: {
                                remote: remoteRenderS2
                            },
                            RTCConstraints: { "optional": [{ 'DtlsSrtpKeyAgreement': 'true' }] }
                        }
                    });
                    s2.direction = 'outgoing';
                    s2.innerCall = 2;
                    ctxSip.newSession(s2);
                    s.hold();
                } catch (e) {
                    throw (e);
                }
                s2.on('accepted', function () {
                    console.log(s)
                    // console.log();
                    // console.log(s.getLocalStreams());
                    var newAudioStream = mixAudioStreams(ctxSip.Stream, s2.getRemoteStreams()[0]);
                    var pc = s.mediaHandler.peerConnection;
                    const currentSenders = pc.getSenders();
                    const currentAudioSender = currentSenders.find((s) => s.track.kind === 'audio');
                    currentAudioSender.replaceTrack(newAudioStream.getAudioTracks()[0]);
                    // console.log(pc)
                    s2.mute();
                    s2.unmute();
                });
            },
                1000);

            function mixAudioStreams(stream1, stream2) {
                const audioContext = new AudioContext();

                // Create MediaStreamAudioSourceNode for stream1
                const stream1Source = audioContext.createMediaStreamSource(stream1);

                // Create MediaStreamAudioSourceNode for stream2 (audio from 's' session)
                const stream2Source = audioContext.createMediaStreamSource(stream2);

                // Create a GainNode for mixing
                const mixer = audioContext.createGain();
                mixer.gain.value = 0.5; // Adjust this value to set the mix ratio.

                // Connect sources and mixer
                stream1Source.connect(mixer);
                stream2Source.connect(mixer);

                // Create a new MediaStream from the mixed audio
                const mixedStream = audioContext.createMediaStreamDestination();
                mixer.connect(mixedStream);

                return mixedStream.stream;
            }
        },

        sipHangUp: function (sessionid) {

            var s = ctxSip.Sessions[sessionid];
            // s.terminate();
            if (!s) {
                return;
            } else if (s.startTime) {
                s.bye();
            } else if (s.reject) {
                s.reject();
            } else if (s.cancel) {
                s.cancel();
            }

        },

        sipSendDTMF: function (digit) {

            try { ctxSip.dtmfTone.play(); } catch (e) { }

            var a = ctxSip.callActiveID;
            if (a) {
                var s = ctxSip.Sessions[a];
                s.dtmf(digit);
            }
        },

        phoneCallButtonPressed: function (sessionid) {

            var s = ctxSip.Sessions[sessionid],
                target = $("#numDisplay").val();

            if (!s) {

                $("#numDisplay").val("");
                ctxSip.sipCall(target);

            } else if (s.accept && !s.startTime) {

                s.accept({
                    media: {
                        stream: ctxSip.Stream,
                        constraints: { audio: true, video: false },
                        render: {
                            remote: $('#audioRemote').get()[0]
                        },
                        RTCConstraints: { "optional": [{ 'DtlsSrtpKeyAgreement': 'true' }] }
                    }
                });
            }
        },

        phoneMuteButtonPressed: function (sessionid) {

            var s = ctxSip.Sessions[sessionid];

            if (!s.isMuted) {
                s.mute();

            } else {
                s.unmute();
            }
        },

        phoneHoldButtonPressed: function (sessionid) {

            var s = ctxSip.Sessions[sessionid];

            if (s.isOnHold().local === true) {
                s.unhold();
            } else {
                s.hold();
            }
        },


        setError: function (err, title, msg, closable) {

            // Show modal if err = true
            if (err === true) {
                $("#mdlError p").html(msg);
                $("#mdlError").modal('show');

                if (closable) {
                    var b = '<button type="button" class="close" data-dismiss="modal">&times;</button>';
                    $("#mdlError .modal-header").find('button').remove();
                    $("#mdlError .modal-header").prepend(b);
                    $("#mdlError .modal-title").html(title);
                    $("#mdlError").modal({ keyboard: true });
                } else {
                    $("#mdlError .modal-header").find('button').remove();
                    $("#mdlError .modal-title").html(title);
                    $("#mdlError").modal({ keyboard: false });
                }
                $('#numDisplay').prop('disabled', 'disabled');
            } else {
                $('#numDisplay').removeProp('disabled');
                $("#mdlError").modal('hide');
            }
        },

        /**
         * Tests for a capable browser, return bool, and shows an
         * error modal on fail.
         */
        hasWebRTC: function () {

            if (navigator.webkitGetUserMedia) {
                return true;
            } else if (navigator.mozGetUserMedia) {
                return true;
            } else if (navigator.getUserMedia) {
                return true;
            } else {
                ctxSip.setError(true, 'Unsupported Browser.', 'Your browser does not support the features required for this phone.');
                window.console.error("WebRTC support not found");
                return false;
            }
        }
    };




    // Throw an error if the browser can't hack it.
    if (!ctxSip.hasWebRTC()) {
        return true;
    }

    ctxSip.phone = new SIP.UA(ctxSip.config);

    ctxSip.phone.on('connected', function (e) {
        ctxSip.setStatus("Conectado");
    });

    ctxSip.phone.on('disconnected', function (e) {
        ctxSip.setStatus("Error de conexion");

        // disable phone
        // ctxSip.setError(true, 'Websocket Disconnected.', 'An Error occurred connecting to the websocket.');

        // remove existing sessions
        $("#sessions > .session").each(function (i, session) {
            ctxSip.removeSession(session, 500);
        });
    });

    ctxSip.phone.on('registered', function (e) {

        var closeEditorWarning = function () {
            return 'If you close this window, you will not be able to make or receive calls from your browser.';
        };

        var closePhone = function () {
            // stop the phone on unload
            localStorage.removeItem('ctxPhone');
            ctxSip.phone.stop();
        };

        window.onbeforeunload = closeEditorWarning;
        window.onunload = closePhone;

        // This key is set to prevent multiple windows.
        localStorage.setItem('ctxPhone', 'true');

        $("#mldError").modal('hide');
        ctxSip.setStatus("Listo");

        // Get the userMedia and cache the stream
        if (SIP.WebRTC.isSupported()) {
            SIP.WebRTC.getUserMedia({ audio: true, video: false }, ctxSip.getUserMediaSuccess, ctxSip.getUserMediaFailure);
        }
    });

    ctxSip.phone.on('registrationFailed', function (e) {
        // ctxSip.setError(true, 'Error de registro.', 'Un error ocurrio registrando tu telefono. Consulta con el personal.');
        ctxSip.setStatus("Error: Registro fallido");
    });

    ctxSip.phone.on('unregistered', function (e) {
        // ctxSip.setError(true, 'Error de registro.', 'Un error ocurrio registrando tu telefono. Consulta con el personal.');
        ctxSip.setStatus("Error: Registro fallido");
    });

    ctxSip.phone.on('invite', function (incomingSession) {

        var s = incomingSession;

        s.direction = 'incoming';
        ctxSip.newSession(s);
    });

    // Auto-focus number input on backspace.
    $('#sipClient').keydown(function (event) {
        if (event.which === 8) {
            $('#numDisplay').focus();
        }
    });

    $('#numDisplay').keypress(function (e) {
        // Enter pressed? so Dial.
        if (e.which === 13) {
            ctxSip.phoneCallButtonPressed();
        }
    });

    $('.digit').click(function (event) {
        event.preventDefault();
        var num = $('#numDisplay').val(),
            dig = $(this).data('digit');

        $('#numDisplay').val(num + dig);

        ctxSip.sipSendDTMF(dig);
        return false;
    });

    $('.dropdown-menu').click(function (e) {
        e.preventDefault();
    });

    $('#input-section').delegate('.btnCall', 'click', function (event) {
        ctxSip.phoneCallButtonPressed();
        // to close the dropdown
        return true;
    });

    $('.sipLogClear').click(function (event) {
        event.preventDefault();
        ctxSip.logClear();
    });

    $('#call-section').delegate('.sip-logitem .btnCall', 'click', function (event) {
        var sessionid = $(this).closest('.sip-logitem').data('sessionid');
        ctxSip.phoneCallButtonPressed(sessionid);
        return false;
    });

    $('#call-section').delegate('.sip-logitem .btnHoldResume', 'click', function (event) {
        var sessionid = $(this).closest('.sip-logitem').data('sessionid');
        ctxSip.phoneHoldButtonPressed(sessionid);
        return false;
    });

    $('#call-section').delegate('.sip-logitem .btnHangUp', 'click', function (event) {
        var sessionid = $(this).closest('.sip-logitem').data('sessionid');
        ctxSip.sipHangUp(sessionid);
        return false;
    });

    $('#call-section').delegate('.sip-logitem .btnTransfer', 'click', function (event) {
        var sessionid = $(this).closest('.sip-logitem').data('sessionid');
        ctxSip.sipTransfer(sessionid);
        return false;
    });
    $('#call-section').delegate('.sip-logitem .btnAddBuddy', 'click', function (event) {
        var sessionid = $(this).closest('.sip-logitem').data('sessionid');
        ctxSip.addBuddy(sessionid);
        return false;
    });

    $('#call-section').delegate('.sip-logitem .btnMute', 'click', function (event) {
        var sessionid = $(this).closest('.sip-logitem').data('sessionid');
        var $button = $(this);

        if ($button.hasClass('muted')) {
            // Change the button's color to 'green' when it's in the 'off' state
            $button.removeClass('muted')
        } else {
            // Change the button's color to 'red' when it's in the 'on' state
            $button.addClass('muted')
        }

        ctxSip.phoneMuteButtonPressed(sessionid);
        return false;
    });
    $(document).on('DOMSubtreeModified', '#call-section', function (event) {
        // alert('changed');
        var numChildren = $('#call-section').children().length;
        $('#numDisplay').prop('disabled', numChildren > 0);
        $('.btnTransfer').prop('disabled', numChildren > 1);
        $('.btnAddBuddy').prop('disabled', numChildren > 1);


    });
    // $('#sip-logitems').delegate('.sip-logitem', 'dblclick', function(event) {
    //     event.preventDefault();

    //     var uri = $(this).data('uri');
    //     $('#numDisplay').val(uri);
    //     ctxSip.phoneCallButtonPressed();
    // });

    $('#sldVolume').on('change', function () {

        var v = $(this).val() / 100,
            // player = $('audio').get()[0],
            btn = $('#btnVol'),
            icon = $('#btnVol').find('i'),
            active = ctxSip.callActiveID;

        // Set the object and media stream volumes
        // if (ctxSip.Sessions[active]) {
        //     ctxSip.Sessions[active].player.volume = v;
        //     ctxSip.callVolume                     = v;
        // }

        // Set the others
        $('audio').each(function () {
            $(this).get()[0].volume = v;
        });

        if (v < 0.1) {
            icon.removeClass().addClass('fa fa-fw fa-volume-off text-3xl');
        } else if (v < 0.8) {
            icon.removeClass().addClass('fa fa-fw fa-volume-down text-3xl');
        } else {
            icon.removeClass().addClass('fa fa-fw fa-volume-up text-3xl');
        }
        return false;
    });


    /**
     * Stopwatch object used for call timers
     *
     * @param {dom element} elem
     * @param {[object]} options
     */
    var Stopwatch = function (elem, options) {

        // private functions
        function createTimer() {
            return document.createElement("span");
        }

        var timer = createTimer(),
            offset,
            clock,
            interval;

        // default options
        options = options || {};
        options.delay = options.delay || 1000;
        options.startTime = options.startTime || Date.now();

        // append elements
        elem.appendChild(timer);

        function start() {
            if (!interval) {
                offset = options.startTime;
                interval = setInterval(update, options.delay);
            }
        }

        function stop() {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        }

        function reset() {
            clock = 0;
            render();
        }

        function update() {
            clock += delta();
            render();
        }

        function render() {
            timer.innerHTML = moment(clock).format('mm:ss');
        }

        function delta() {
            var now = Date.now(),
                d = now - offset;

            offset = now;
            return d;
        }
        function setElement(element) {
            element.appendChild(timer);
        }

        // initialize
        reset();

        // public API
        this.start = start; //function() { start; }
        this.stop = stop;
        this.setElement = setElement; //function() { stop; }
    };

});
