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

function createCard(card, style) {
    var cardDiv = $('<div/>')
    .addClass("mtg-card");

    if (typeof style !== 'undefined') {
        cardDiv.attr("style", cardDiv.attr("style") + "; " + style);
    }

    var front = $('<div/>')
        .addClass("front")
        .addClass("mtg-card-side")
        .addClass("mtg-card-preview")
        .css("background-image", "url('" + createCardImageSrc(card.multiverseId) + "')")
        .data("multiverseId", card.multiverseId)
        .appendTo(cardDiv);

    if (card.layout === "double-faced") {
        var back = $('<div/>')
            .addClass("back")
            .addClass("mtg-card-side")
            .addClass("mtg-card-preview")
            .css("background-image", "url('" + createCardImageSrc(card.multiverseIdBack) + "')")
            .data("multiverseId", card.multiverseIdBack)
            .appendTo(cardDiv);
    } else {
        var back = $('<div/>')
            .addClass("back")
            .addClass("mtg-card-side")
            .css("background-image", "url('img/backside.jpg')")
            .appendTo(cardDiv);
    }

    return cardDiv;
}

function createCardImageSrc(multiverseId) {
    return "http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" + multiverseId + "&type=card";
}

function getMultiverseId(el) {
    return el[0].style.backgroundImage.slice(5, -2).substr(61).slice(0, -10);
}

function bindCardActions() {
    $("#table .mtg-card").rotate({
        bind: {
            click: function (event) {
                if (isCounterClick) {
                    isCounterClick = false;
                } else {
                    tap(this);
                }               
            }
        }
    });

    $('.mtg-card-preview').popover({
        html: true,
        trigger: 'hover',
        content: function () { 
            return '<img src="' + $(this)[0].style.backgroundImage.slice(5, -2) + '" />'; 
        }
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

    $(".mtg-card").flip({trigger: "manual"});
}

function tap(card) {
    if (!$(card).hasClass("tapped")) {
        $(card).rotate({
            angle: 0,
            animateTo: 90
        })
        $(card).addClass("tapped");
    } else {
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
    $(card).flip('toggle');
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

function addCounter(card) {
    $(card).append("<label class='ms ms-e ms-3x counter'></label><input class='form-control clickedit' type='text' />");
    
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
}