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

function createCard(card) {
    var cardDiv = $('<div/>')
        .addClass("mtg-card")
        .addClass(card.layout)
        .attr("data-goldfishid", card.goldfishId)
        .attr("data-layout", card.layout);

    $('<div/>')
        .addClass("front")
        .addClass("mtg-card-side")
        .addClass("mtg-card-preview")
        .css("background-image", `url(${typeof card.backgroundImage !== 'undefined' ? card.backgroundImage : card.imageUrl})`)
        .appendTo(cardDiv);

    $('<div/>')
        .addClass("handle")
        .appendTo(cardDiv);

    if (card.layout === "double-faced" ||
        card.layout === "transform" ||
        card.layout === "modal_dfc")
    {
        $('<div/>')
            .addClass("back")
            .addClass("mtg-card-side")
            .addClass("mtg-card-preview")
            .css("background-image", "url('" + card.imageUrlBack + "')")
            .appendTo(cardDiv);
    } else {
        $('<div/>')
            .addClass("back")
            .addClass("mtg-card-side")
            .css("background-image", "url('img/backside.jpg')")
            .appendTo(cardDiv);
    }

    return cardDiv;
}

function getCardObject(selector) {
    return {
        goldfishId: $(selector[0]).attr("data-goldfishid"),
        layout: $(selector[0]).attr("data-layout"),
        imageUrl: $(selector[0])[0].querySelector(".front.mtg-card-side.mtg-card-preview").style["background-image"].replace(/url\(("|')(.+)("|')\)/gi, '$2'),
    };
}

function getGoldfishId(selector) {
    return $(selector).attr("data-goldfishid");
}

function bindCardActions() {
    // Tap
    $("#table .mtg-card").rotate({
        bind: {
            click: function() {
                if (isCounterClick) {
                    isCounterClick = false;
                } else {
                    tap(this);
                }
            }
        }
    });

    // Large preview
    $('.mtg-card-preview').popover({
        html: true,
        trigger: 'hover',
        content: function() { 
            return '<img width="223" height="310" src="' + $(this)[0].style.backgroundImage.slice(5, -2) + '" />'; 
        }
    });

    // Drag & drop
    $(".mtg-card").draggable({
        helper: "clone",
        stop: function() {
            updateTotals();
            bindCardActions();
        }
    });

    if (jQuery.browser.mobile) {
        $(".mtg-card").draggable("option", "handle", ".handle");
    }

    $("#table .mtg-card-side.mtg-card-preview").droppable({
        accept: ".counter",
        drop: function(_, ui) {
            ui.draggable.detach()
            .css('left', ui.offset.left - $(this).offset().left)
            .css('top', ui.offset.top - $(this).offset().top)
            .css('position', "relative")
            .css('display', "inline-block")
            .appendTo($(this));
        }
    });

    // Flip card
    $(".mtg-card").flip({trigger: "manual"});
}

function tap(card) {
    if (!$(card).hasClass("tapped") || $(card).getRotateAngle() == 0)
    {
        $(card).addClass("tapped");
        $(card).rotate({ angle: 0, animateTo: 90 });
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
    $("#table .mtg-card.tapped").each(function() {
        untap(this);
    });
}

function flip(card) {
    $(card).flip('toggle');
}

function flipHand() {
    $("#hand-placeholder").children().each(function() {
        flip(this);
    });
}

function shuffleHand() {
    var cards = window.knuthShuffle($("#hand-placeholder").children()).slice();
    $("#hand-placeholder").append(cards);
}

function addCounter(card) {
    if (typeof card === 'undefined') {
        return;
    }

    var flip = $(card).data("flip-model");

    $(card)
        .children((flip.isFlipped ? ".back" : ".front"))
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

    $(".counter").on("mousedown", function (event) {
        switch (event.which) {
            case 3: // right button
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
    $.each(markedList, function(_, goldfishId) {
        $(`.mtg-card[data-goldfishid='${goldfishId}']`).toggleClass("marked");
    });
}

function createGoldfishId() {
    var id = Date.now() + Math.random();
    return id.toString();
}