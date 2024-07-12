var isCounterClick = false;

function defaultCard() {
    return $('<div/>')
        .addClass("mtg-card")
        .css("background-image", "url('img/backside.jpg')");
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

    if (jQuery.browser.mobile) {
        $('<div/>')
            .addClass("handle")
            .appendTo(cardDiv);
    }

    $('<div/>')
        .addClass("back")
        .addClass("mtg-card-side")
        .addClass(isDoubleFaced(card.layout) ? "mtg-card-preview" : "")
        .css("background-image", "url('" + card.imageUrlBack + "')")
        .appendTo(cardDiv);

    return cardDiv;
}

function isDoubleFaced(layout) {
    switch(layout) {
        case "double-faced":
        case "transform":
        case "modal_dfc":
            return true;
        default:
            return false;
    }
}

/**
 * Get the deck card object based on a DOM node
 * @param {domNode} domNode - DOM node gotten by for example a jQuery selector '$(".mtg-card:hover")[0]'
 * @returns card object
 */
const getCardObject = (domNode) =>
    deck.find((card) => card.goldfishId == domNode.dataset.goldfishid);

function getGoldfishId(selector) {
    return $(selector).attr("data-goldfishid");
}

function getPreviewImage(selector) {
    return $(selector)[0].style.backgroundImage
        .replace(/url\(("|')(.+)("|')\)/gi, '$2')
        .replace("small", "large");
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
            return `<img width="223" height="310" src="${getPreviewImage(this)}" />`;
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

function flip(selector) {
    $(selector).flip('toggle');
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
    
    // Disable context menu
    $(card)
        .on("contextmenu",function(){ return false; })

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

    // Add event listener to delete counter on right click
    $(".counter").on("mousedown", function (event) {
        if (event.which === 3) {
            $(this).remove();
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