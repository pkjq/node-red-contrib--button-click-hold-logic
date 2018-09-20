module.exports = function(RED) {
    "use strict";

    function ClickHoldProcessorLogic(config) {
        RED.nodes.createNode(this, config);

        var node = this;
        //var config = config_;

        node.on('input', function(msg) {
            const isPushEvent = (msg.payload.state === 'push');

            function ClearRepeater(what) {
                const holdRepeatTimer = node[what];
                if (holdRepeatTimer) {
                    delete node[what];
                    clearInterval(holdRepeatTimer);
                }
            }
            
            function ClearHoldTimer() {
                const holdTimer = node.holdTimer;
                if (holdTimer) {
                    delete node.holdTimer;
                    clearTimeout(holdTimer);
                }
            }
    
            function ResetGuardWatchdog() {
                const guard = node.HoldGuard;
    
                if (guard) {
                    ClearHoldTimer();
                    ClearRepeater('holdRepeatTimer');
                    ClearRepeater('holdGuardTimer');
                    
                    delete node.button_state;
                    
                    msg.event = 'release';
                    node.send(msg);
                    
                    node.status({fill:'red',shape:'dot',text:"hold not confirmed!"});
                }
                else
                    node.HoldGuard = true;
            }


            if (isPushEvent) {
                if (msg.payload.repeat) {
                    node.HoldGuard = false;
                    return;
                }
            
                { // validate
                    const holdTimer = node.holdTimer;
                    const holdRepeatTimer = node.holdRepeatTimer;
                    if (holdTimer || holdRepeatTimer) {
                        node.error('\'PUSH\' event was twice received! Skip it.');
                        node.status({fill:'red'});
                        return;
                    }
                }
            
                node.status({fill:'green',shape:'ring',text:"push"});
                node.button_state = 'click';
            
                
                const holdTimer = setTimeout(function() {
                    node.status({fill:'green',shape:'dot',text:"hold"});
                    
                    node.button_state = 'release';
                    delete node.holdTimer;
                    
                    msg.event = 'press';
                    msg.repeat = 0;
                    
                    node.send(msg);
                    
                    const holdRepeatTimer = setInterval(function() {
                        ++msg.repeat;
                        node.send(msg);
                    }, config.holdRepeatInterval);
                    node.holdRepeatTimer = holdRepeatTimer;
                    
                    if (config.holdRepeatGuard) {
                        const holdGuardTimer = setInterval(ResetGuardWatchdog, config.holdRepeatGuard);
                        node.holdGuardTimer = holdGuardTimer;
                    }
                }, config.holdTimeout);

                node.holdTimer = holdTimer;
            }
            else {
                node.status({fill:'grey', text:"standby"});
                
                msg.event = node.button_state;
                delete node.button_state;
                { // clear timers
                    ClearHoldTimer();
                    ClearRepeater('holdRepeatTimer');
                    ClearRepeater('holdGuardTimer');
                }
            }

            msg.buttonId = config.buttonId;

            if (msg.event)
                node.send(msg);
        });
    }

    RED.nodes.registerType("sd-click-hold-processor", ClickHoldProcessorLogic);
}


/*const HoldTimeout           = 350; //ms
const HoldRepeatInterval    = 800; //ms
const HoldRepeatGuard       = 800; //ms*/


/*
Events:
1. click
2. press(repeat:0)...press(repeat:1)...release
*/


/*const isPushEvent = (msg.payload.state === 'push');


function ClearRepeater(what) {
    const holdRepeatTimer = context.get(what);
    if (holdRepeatTimer) {
        context.set(what, null);
        clearInterval(holdRepeatTimer);
    }  
}

function ClearHoldTimer() {
    const holdTimer = context.get('holdTimer');
    if (holdTimer) {
        context.set('holdTimer', null);
        clearTimeout(holdTimer);
    }
}

function ResetGuardWatchdog() {
    const guard = context.get('HoldGuard');
//node.warn('ResetGuardWatchdog: ' + guard);
    if (guard) {
        ClearHoldTimer();
        ClearRepeater('holdRepeatTimer');
        ClearRepeater('holdGuardTimer');
        
        context.set('button_state', null);
        
        msg.event = 'release';
        node.send(msg);
        
        node.status({fill:'red',shape:'dot',text:"hold not confirmed!"});
    }
    else
        context.set('HoldGuard', true);
}


if (isPushEvent) {
    if (msg.payload.repeat) {
        context.set('HoldGuard', null);
        return;
    }

    { // validate
        const holdTimer = context.get('holdTimer');
        const holdRepeatTimer = context.get('holdRepeatTimer');
        if (holdTimer || holdRepeatTimer) {
            node.error('\'PUSH\' event was twice received! Skip it.');
            node.status({fill:'red'});
            return;
        }
    }

    node.status({fill:'green',shape:'ring',text:"push"});
    context.set('button_state', 'click');

    
    const holdTimer = setTimeout(function() {
        node.status({fill:'green',shape:'dot',text:"hold"});
        
        context.set('button_state', 'release');
        context.set('holdTimer', null);
        
        msg.event = 'press';
        msg.repeat = 0;
        
        node.send(msg);
        
        const holdRepeatTimer = setInterval(function() {
            ++msg.repeat;
            node.send(msg);
        }, HoldRepeatInterval);
        context.set('holdRepeatTimer', holdRepeatTimer);
        
        if (HoldRepeatGuard) {
            const holdGuardTimer = setInterval(ResetGuardWatchdog, HoldRepeatGuard);
            context.set('holdGuardTimer', holdGuardTimer);
        }
    }, HoldTimeout);
    context.set('holdTimer', holdTimer);
}
else {
    node.status({fill:'grey', text:"standby"});
    
    msg.event = context.get('button_state');
    context.set('button_state', null);
    { // clear timers
        ClearHoldTimer();
        ClearRepeater('holdRepeatTimer');
        ClearRepeater('holdGuardTimer');
    }
}

if (msg.event)
    return msg;
*/