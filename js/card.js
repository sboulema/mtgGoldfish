function defaultCard() {
    return $('<div/>')
        .addClass("mtg-card")
        .css("background-image", "url('img/card-backside-mint.jpg')");
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
 * @param {HTMLElement} htmlElement - HTML element gotten by for example a jQuery selector '$(".mtg-card:hover")[0]'
 * @returns card object
 */
const getCardObject = (htmlElement) =>
    deck.find((card) => card.goldfishId == htmlElement.dataset.goldfishid);

/**
 * Check if the HTML element has been flipped
 * @param {HTMLElement} htmlElement - HTML element gotten by for example a jQuery selector '$(".mtg-card:hover")[0]'
 * @returns boolean
 */
const isFlipped = (domNode) =>
    $(domNode).data("flip-model").isFlipped;

function getGoldfishId(selector) {
    return $(selector).attr("data-goldfishid");
}

/**
 * Get the high quality preview image of the current shown card face
 * @param {domNode} domNode - Div gotten by for example a jQuery selector '$(".mtg-card:hover")[0]'
 * @returns string
 */
const getPreviewImageUrl = (domNode) =>
    isFlipped(domNode) ? getCardObject(domNode).imageBackPreviewUrl : getCardObject(domNode).imageFrontPreviewUrl;

function bindCardActions() {
    // Tap
    $("#table .mtg-card")
        .off("click")
        .on("click", function() {
            tap(this);
        });

    // Large preview
    $('.mtg-card').popover({
        html: true,
        trigger: 'hover',
        content: function(htmlElement) {
            var card = getCardObject(htmlElement);

            if (!isDoubleFaced(card.layout) && isFlipped(htmlElement)) {
                return null;
            }

            return `<img width="223" height="310" src="${getPreviewImageUrl(htmlElement)}" />`;
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

    // Drag & drop counters
    $("#table .mtg-card-side").droppable({
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

/**
 * Tap/Rotate a card
 *
 * @param {domNode} domNode - Div gotten by for example a jQuery selector '$(".mtg-card:hover")[0]'
 * @param {int} [degree] - Degrees to rotate, if unspecified rotation will be toggled between 0 and 90
 */
const tap = (domNode, degree) => {
    degree ??= domNode.style.transform.includes("90") ? 0 : 90;

    $(domNode).css({
        transition: "transform 0.5s",
        transform: `rotate(${degree}deg)`
    });
}

/**
 * Untap/Rotate all cards on the table
 */
function untapAll() {
    $('#table .mtg-card[style*="transform: rotate(90deg)"]').each(function() {
        tap(this, 0);
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

    // Append counter to the card face
    $(card)
        .children(isFlipped(card) ? ".back" : ".front")
        .append("<label class='ms ms-e ms-3x counter'></label><input class='form-control counter-input' type='text' />");

    // Disable context menu
    $(card)
        .on("contextmenu",function(){ return false; })

    // Clicking a counter should show the input field to change counter icon
    $(".mtg-card .counter")
        .off("click")
        .on("click", function(event) {
            event.stopImmediatePropagation();
            $(this).next().show().trigger("focus");
        })

    // Upon ending entering text into the counter edit field we should update the counter icon
    $('.mtg-card .counter-input')
        .hide()
        .off("keypress focusout")
        .on("keypress focusout", function(event) {
            event.stopImmediatePropagation();

            if (event.key !== "Enter") {
                return;
            }

            // Set class of the counter to the input text
            $(this).prev().removeClass().addClass(`ms ms-counter-${$(this).val()} ms-3x counter`);

            // Hide counter input field
            $(this).hide();
        });

    $(".mtg-card .counter").draggable({
        revert: "invalid"
    });

    // Add event listener to delete counter on right click
    $(".mtg-card .counter")
        .off("mousedown")
        .on("mousedown", function (event) {
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