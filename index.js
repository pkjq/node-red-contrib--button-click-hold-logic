"use strict";

function ClearRepeater(what) {
    const holdRepeatTimer = this[what];

    if (holdRepeatTimer) {
        delete this[what];
        clearInterval(holdRepeatTimer);
    }
}

function ClearHoldTimer() {
    const holdTimer = this.holdTimer;

    if (holdTimer) {
        delete this.holdTimer;
        clearTimeout(holdTimer);
    }
}

module.exports = function(RED) {
    function ClickHoldProcessorLogic(config) {
        RED.nodes.createNode(this, config);

        this.on('input', function(msg) {
            const isPushEvent = (msg.payload.state === 'push');

            if (isPushEvent) {
                if (msg.payload.repeat) {
                    this.HoldGuard = false;
                    return;
                }

                // validate
                if (this.button_state) {
                    this.error('\'PUSH\' event was twice received! Skip it.');
                    this.status({fill:'red', text:"'push' event was twice received! Skip it."});
                    return;
                }
            
                this.status({fill:'green',shape:'ring',text:"push"});
                this.button_state = 'click';
            
                
                this.holdTimer = setTimeout(() => {
                    this.status({fill:'green',shape:'dot',text:"hold"});
                    
                    this.button_state = 'release';
                    delete this.holdTimer;
                    
                    msg.event = 'press';
                    msg.repeat = 0;
                    
                    this.send(msg);
                    
                    if (config.holdRepeatInterval > 0) {
                        this.holdRepeatTimer = setInterval(() => {
                            ++msg.repeat;
                            this.send(msg);
                        }, config.holdRepeatInterval);
                    }
                    
                    if (config.holdRepeatGuard > 0) {
                        function ResetGuardWatchdog() {
                            const guard = this.HoldGuard;
                    
                            if (guard) {
                                this.ClearAllTimers();
                                delete this.button_state;
                                
                                msg.event = 'release';
                                delete msg.repeat;
                                this.send(msg);
                                
                                this.status({fill:'red', shape:'dot', text:"hold not confirmed!"});
                            }
                            else
                                this.HoldGuard = true;
                        }

                        this.holdGuardTimer = setInterval(ResetGuardWatchdog.bind(this), config.holdRepeatGuard);
                    }
                }, config.holdTimeout);
            }
            else {
                this.status({fill:'grey', text:"standby"});
                
                msg.event = this.button_state;
                delete msg.repeat;
                
                this.ClearAllTimers();
                delete this.button_state;
            }

            if (msg.event)
                this.send(msg);
        });

        this.on('close', function(done) {
            this.ClearAllTimers();

            delete this.button_state;
            this.status({fill:'grey', text:"standby"});

            done();
        });


        this.ClearAllTimers = function() {
            ClearHoldTimer.call(this);
            ClearRepeater.call(this, 'holdRepeatTimer');
            ClearRepeater.call(this, 'holdGuardTimer');
        };


        this.status({fill:'grey', text:"standby (pristine)"});
    }

    RED.nodes.registerType("Click-Hold logic", ClickHoldProcessorLogic);
}
