$(document).ready(function() {

    var tag = location.hash.substring(1) || '',
        offlineTime = 120;

    document.title = 'Smart Citizen @ ' + tag;

    $('body').append($('<h1>').text(tag)).append('<h3>').append($('<div>', {
        'class': 'devices'
    }).html('<div class="loader"><div class = "l l-1"></div><div class="l l-2"></div><div class="l l-3"></div></div>'));

    io.connect('wss://ws.smartcitizen.me').on('data-received', function(device) {
        if (tag == '' || device.data.user_tags.includes(tag)) {
            $('*[data-device="' + device.device_id + '"]')
                .data('lastUpdate', device.data.last_reading_at)
                .data('batteryStatus', {
                    last: device.readings.bat[1],
                    prev: device.readings.bat[2]
                })
                .removeClass('offline')
                .addClass('online')
                .animateCss('flipInY');
        }
    });

    $.getJSON('https://api.smartcitizen.me/v0/devices/world_map', function(devices) {

        $('.devices').empty();

        devices.filter(function(device) {
            if (tag == '') return true;
            return device && device.user_tags && device.user_tags.includes(tag);
        }).sort(function(a, b) {
            return new Date(b.last_reading_at) - new Date(a.last_reading_at);
        }).forEach(function(device) {
            $('.devices').append(
                $('<div>', {
                    'class': 'device offline',
                    'data-device': device.id
                })
                .data('lastUpdate', device.last_reading_at)
                // .data('batteryStatus', {
                //     last: null,
                // })
                .click(function() {
                    window.open('https://smartcitizen.me/kits/' + device.id, '_blank');
                })
                .html(device.name + ' <span> de ' + device.owner_username + '</span>').append(
                    $('<div>', {'class': 'status'}) 
                    .text(sentences['HAS_NOT_PUBLISHED']))
            );
        });
    });

    var update = function () {

        $('.device').each(function(device) {
            var lastDeviceUpdate = $(this).data('lastUpdate');

            if (lastDeviceUpdate) {

                var batteryStatus = $(this).data('batteryStatus');
                var $status = $(this).find('.status');

                $status.html(sentences['LAST_UPDATE'] + moment(lastDeviceUpdate).fromNow());

                var isOnline = true;

                if (new Date() - new Date(lastDeviceUpdate) > 2000 * offlineTime) {
                    isOnline = false;
                }

                if (batteryStatus && (batteryStatus.last || batteryStatus.last == 0)) {
                    if (batteryStatus.last == 0) {
                        if (isOnline) {
                            $status.append(sentences['DISCHARGED']);
                        } else {
                            $status.append(sentences['WAS_DISCHARGED']);
                        }
                    } else if (batteryStatus.last >= 100) {
                        if (isOnline) {
                            $status.append(sentences['CHARGED']);
                        } else {
                            $status.append(sentences['WAS_CHARGED']);
                        }
                    } else {
                        if (isOnline) {
                            $status.append(sentences['CHARGING'] + batteryStatus.last + '%');
                        } else {
                            $status.append(sentences['WAS_CHARGING'] + batteryStatus.last + '%');
                        }
                    }
                }

                if (isOnline) {
                    $(this).removeClass('offline').addClass('online');
                } else {
                    $(this).removeClass('online').addClass('offline');
                }

            }
        });

        var online = Math.ceil(($('.online').length / $('.device').length) * 100);

        online = (isNaN(online)) ? '' : ' (' + online + ' %)';

        $('h3').text($('.online').length + sentences['INTRO'] + $('.device').length + ' ' + online);

    }

    $.fn.extend({
        animateCss: function(animationName) {
            var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
            this.addClass('animated ' + animationName).one(animationEnd, function() {
                $(this).removeClass('animated ' + animationName);
            });
        }
    });

    moment.updateLocale('en', {
        relativeTime: {
            future: 'in %s',
            past: 'was %s',
            s: function(number, withoutSuffix, key, isFuture) {
                return (number > 1) ? number + ' seconds' : number + ' second';
            },
            m: '1 minut',
            mm: function(number, withoutSuffix, key, isFuture) {
                return (number > 1) ? number + ' minutes' : number + ' minute';
            },
            h: 'one hour',
            hh: '%d hours',
            d: 'one day',
            dd: '%d days',
            M: 'a month',
            MM: '%d months',
            y: 'one year',
            yy: '%d years'
        }
    });

    var sentences = {
        "INTRO": " Kits connected from a total of ",
        "HAS_NOT_PUBLISHED": "Waiting to publish data...",
        "LAST_UPDATE": "Last publication ",
        "DISCHARGED": ", battery is fully discharged",
        "WAS_DISCHARGED": ", battery was lodaded",
        "CHARGED": ", batery is fully charged",
        "WAS_CHARGED": ", battery was fully charged",
        "CHARGING": ", battery is at ",
        "WAS_CHARGING": ", battery was at "
    };

    update();

    setInterval(function() {
        update();
    }, 500);

});
