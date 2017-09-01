var isLongPress = false;
var isCounterClick = false;

function defaultCard(cssClass) {
    var card = $('<div/>')
        .addClass("mtg-card")
        .css("background-image", "url('img/backside.jpg')");

    if (typeof cssClass !== 'undefined') {
        card.addClass(typeof cssClass !== 'undefined' ? cssClass : "")
    }

    return card;
}

function createCard(multiverseId, style) {
    var card = $('<div/>')
        .addClass("mtg-card")
        .addClass("mtg-card-preview")
        .css("background-image", "url('" + createCardImageSrc(multiverseId) + "')")
        .data("multiverseId", multiverseId);

    if (typeof style !== 'undefined') {
        card.css(style);
    }

    return card;
}

function createCardImageSrc(multiverseId) {
    return "http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" + multiverseId + "&type=card";
}

function getMultiverseId(el) {
    return el[0].style.backgroundImage.slice(5, -2).substr(61).slice(0, -10);
}

function bindCardActions() {
    $("#table .mtg-card").longpress(function(event) {
        $(this).append("<label class='ms ms-e ms-3x counter'></label><input class='form-control clickedit' type='text' />");
        
        $('.mtg-card .clickedit').hide()
        .focusout(endEdit)
        .keyup(function (e) {
            var defaultText = '';
            if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
                endEdit(e, defaultText);
                return false;
            } else {
                return true;
            }
        })
        .prev().click(function (event) {
            $(this).hide();
            $(this).next().show().focus();
            isCounterClick = true;
        });

        $(".counter").draggable({
            revert: "invalid"
        });

        $(".counter").mousedown(function (event) {
            switch (event.which) {
                case 3:
                    $(this).remove();
                    break;
                default:
                    break;
            }
        });

        isLongPress = true;
    });

    $("#table .mtg-card").rotate({
        bind: {
            click: function (event) {
                if (isLongPress || isCounterClick) {
                    isLongPress = false;
                    isCounterClick = false;
                } else {
                    tapUntap(this);
                }               
            }
        }
    });

    $('.mtg-card-preview').popover({
        html: true,
        trigger: 'hover',
        content: function () { return '<img src="' + this.style.backgroundImage.slice(5, -2) + '" />'; }
    });

    $(".mtg-card").draggable({
        helper: "clone",
        stop: function(event, ui) {
            updateTotals();
            bindCardActions();
        }
    });

    $(".mtg-card").droppable({
        accept: ".counter",        
        drop: function(event, ui) {
            ui.draggable.detach()
            .css('left', ui.offset.left - $(this).offset().left)
            .css('top', ui.offset.top - $(this).offset().top)
            .css('position', "relative")
            .css('display', "inline-block")
            .appendTo($(this));
        }
    });

    $("body").keypress(function(e) {
        if (e.keyCode == 102) { // f   
             flip($(".mtg-card:hover")[0]);
             e.preventDefault();
        }
    });
}

function tapUntap(card) {
    if ($(card).getRotateAngle() == 0) {
        tap(card);
    } else {
        untap(card);
    }
}

function tap(card) {
    if (!$(card).hasClass("tapped")) {
        $(card).rotate({
            angle: 0,
            animateTo: 90
        })
        $(card).addClass("tapped");
    }
}

function untap(card) {
    if ($(card).hasClass("tapped")) {
        $(card).rotate({
            angle: 90,
            animateTo: 0
        })
        $(card).removeClass("tapped");
    }
}

function untapAll() {
    $("#table .mtg-card").each(function(index) {
        untap(this);
    });
}

function flip(card) {
    if ($(card).hasClass("flipped")) {
        card.style.backgroundImage = "url('" + createCardImageSrc($(card).data("multiverseId")) + "')";
        $(card).removeClass("flipped");
    } else {
        card.style.backgroundImage = "url('img/backside.jpg')";
        $(card).addClass("flipped");
    }
}

function flipHand() {
    $("#hand").children().each(function(index) {
        flip(this);
    });
}

function shuffleHand() {
    var cards = window.knuthShuffle($("#hand").children()).slice();
    $("#hand").append(cards);
}