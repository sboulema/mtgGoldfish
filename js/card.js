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
    .addClass("mtg-card")
    .addClass(card.layout)
    .attr("data-goldfishid", card.goldfishId)
    .attr("data-layout", card.layout);

    if (typeof style !== 'undefined') {
        cardDiv.attr("style", cardDiv.attr("style") + "; " + style);
    }

    var front = $('<div/>')
        .addClass("front")
        .addClass("mtg-card-side")
        .addClass("mtg-card-preview")
        .css("background-image", "url('" + createCardImageSrc(card.multiverseId) + "')")
        .attr("data-multiverseid", card.multiverseId)
        .appendTo(cardDiv);

    if (card.layout === "double-faced") {
        var back = $('<div/>')
            .addClass("back")
            .addClass("mtg-card-side")
            .addClass("mtg-card-preview")
            .css("background-image", "url('" + createCardImageSrc(card.multiverseIdBack) + "')")
            .attr("data-multiverseid", card.multiverseId)
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

function getCardObject(el) {
    return {
        multiverseId: $(el[0]).children(".front").attr('data-multiverseid'),
        multiverseIdBack: $(el[0]).children(".back").attr("data-multiverseid"),
        goldfishId: $(el[0]).attr("data-goldfishid"),
        layout: $(el[0]).attr("data-layout")
    };
}

function getFrontMultiverseId(el) {
    return $(el).children(".front").attr("data-multiverseid");
}

function getGoldfishId(el) {
    return parseInt($(el).attr("data-goldfishid"));
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

    $("#table .mtg-card-side.mtg-card-preview").droppable({
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
    if (!$(card).hasClass("tapped") || $(card).getRotateAngle() == 0) {
        $(card).addClass("tapped");
        $(card).rotate({
            angle: 0,
            animateTo: 90
        })       
    } else {
        untap(card);
    }
}

function untap(card) {
    $(card).removeClass("tapped");
    $(card).rotate({
        angle: 90,
        animateTo: 0
    }) 
}

function untapAll() {
    $("#table .mtg-card.tapped").each(function(index) {
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
    var flip = $(card).data("flip-model");

    $(card).children((flip.isFlipped ? ".back" : ".front"))
        .append("<label class='ms ms-e ms-3x counter'></label><input class='form-control clickedit' type='text' />");
    
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

function markCard(card) {
    var goldfishId = $(card).attr("data-goldfishid");
    var index = $.inArray(goldfishId, markedList)
    if (index > -1) {
        markedList.slice(index, 1);
    } else {
        markedList.push(goldfishId);
    }   
    $(card).toggleClass("marked");
}

function markAllCards() {
    $.each(markedList, function(key, goldfishId) {
        $(".mtg-card[data-goldfishid='" + goldfishId + "']").toggleClass("marked");
    });
}

function createGoldfishId() {
    return Date.now() + Math.random();
}