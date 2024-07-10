function importMtgStocksDeck(deckid) {
    var dfrd1 = $.Deferred();

    $.getJSON("https://cors-anywhere.herokuapp.com/https://api.mtgstocks.com/decks/" + deckid).then(function (data) {
        var deck = "";
        var sideboard = "";

        $.each(data.mainboard, function(key, card) {
            deck += card.quantity + " " + card.card.name + "\n";
        });

        $.each(data.sideboard, function(key, card) {
            sideboard += card.quantity + " " + card.card.name + "\n";
        })

        $("#deck-list").val(deck);
        $("#sideboard-list").val(sideboard);
        dfrd1.resolve();
    });

    return dfrd1.promise();
}

function importMtgGolfdishDeck(deckId) {
    var dfrd1 = $.Deferred();

    $.ajax({
        url: "https://wrapapi.com/use/sboulema/mtggoldfish/deck/0.0.2",
        method: "POST",
        data: {
          "deckId": deckId,
          "wrapAPIKey": "HXhWGELDSQ84wmTd2FYKxtTnqKjeRtQb"
        }
      }).done(function(data) {
        var deck = "";
        var sideboard = "";
        var loadingDeck = true;

        $.each(data.data.Line, function(key, card) {
            if (card.Amount === null) {
                if (card.Header.includes("Sideboard")) {
                    loadingDeck = false;
                }
            } else {
                if (loadingDeck) {
                    deck += card.Amount + " " + card.Name + "\n";
                } else {
                    sideboard += card.Amount + " " + card.Name + "\n";
                }
            }
        });

        $("#deck-list").val(deck);
        $("#sideboard-list").val(sideboard);
        dfrd1.resolve();
      });
      return dfrd1.promise();
}

function loadDeck() {
    var dfrd1 = $.Deferred();

    var lines = $("#deck-list").val().trim().split('\n');

    // Clear any existing deck and sideboard
    libraryList.length = 0;
    sideboardList.length = 0;

    // Mainboard
    $.when.apply($, lines.map(function (line) {
        return lineToCard(line, libraryList);
    })).then(function () {
        $("#library-placeholder").html(defaultCard("library-placeholder-card"));
        deck = libraryList.slice();
        shuffleDeck();
        draw(7);
        updateTotals();
        bindCardActions();
        setupClickToDraw();

        if ($("#sideboard-list").val() === '') {
            dfrd1.resolve();
        }
    });

    // Sideboard
    if ($("#sideboard-list").val() != '') {
        var lines = $("#sideboard-list").val().trim().split('\n');

        $.when.apply($, lines.map(function (line) {
            return lineToCard(line, sideboardList);
        })).then(function () {
            $("#sideboard-placeholder").html(defaultCard());
            sideboard = sideboardList.slice();
            updateTotals();
            bindCardActions();
            dfrd1.resolve();
        });
    }

    $('#deckModal').modal('hide');

    return dfrd1.promise();
}

function lineToCard(line, list) {
    var matches = line.match(/\b(\d+)x?\s+(.*)\b/);
    var count = matches[1];
    var name = matches[2];

    return $.getJSON(`https://api.scryfall.com/cards/named?fuzzy=${name}`)
    .then(function (card) {   
        if (card.layout === "double-faced" ||
            card.layout === "transform" ||
            card.layout === "modal_dfc")
        {
            for (var j = 0; j < count; j++) {
                list.push({
                    name: card.name,
                    layout: card.layout,
                    imageUrl: card.card_faces[0].image_uris.large,
                    imageUrlBack: card.card_faces[1].image_uris.large,
                    goldfishId: createGoldfishId()
                });
            } 
        } else {
            for (var j = 0; j < count; j++) {
                list.push({
                    name: card.name,
                    layout: card.layout,
                    imageUrl: card.image_uris.large,
                    goldfishId: createGoldfishId()
                });
            }
        }
    });
}

function shuffleDeck() {
    window.knuthShuffle(libraryList);
}

function mulligan() {
    libraryList = deck.slice();
    shuffleDeck();

    var handSize = $("#hand-placeholder").children().length;
    $("#hand-placeholder").empty();

    var newHandSize = handSize - 1;

    if (newHandSize === 0) {
        newHandSize = 1;
    }
    
    draw(newHandSize);
    updateTotals();
}

function draw(amount) {
    if (libraryList.length === 0) return;

    for (var index = 0; index < amount; index++) {
        var card = libraryList.splice(0, 1)[0];
        handList.push(card);
        $("#hand-placeholder").append(createCard(card));
    }

    updateTotals();
    bindCardActions();
}

function setupClickToDraw() {
    $(".library-placeholder-card").on("click", function() {
        draw(1);
    });
}

function startShuffleDeckToCard() {
    var cardName = $("#shuffle-card-name").val().trim();

    $('#shuffleDeckModal').modal('hide');

    shuffleDeckToCard(cardName);
}

function shuffleDeckToCard(cardName) {
    handList.length = 0;
    $("#hand-placeholder").empty();

    libraryList = deck.slice();
    shuffleDeck();
    draw(7);

    var index = handList.findIndex(function(element) {
        return element.name === cardName;
    });

    if (index === -1) {
        shuffleDeckToCard(cardName);
    }
}

function putCardOnLibrary(card, onBottom) {
    if (typeof card === 'undefined') {
        return;
    }

    $('.popover').popover('hide');

    if (onBottom) {
        libraryList.push(getCardObject(card))
    } else {
        $("#library-placeholder").empty();
        libraryList.unshift(getCardObject(card));
        $("#library-placeholder").append(defaultCard("library-placeholder-card"));
    }

    $(card).trigger("mouseout");
    $(card).remove();

    setupClickToDraw();
    updateTotals();
    bindCardActions();
} 

function putCardinPlaceholder(card, selector, list) {
    if(typeof card === 'undefined') {
        return;
    }

    $('.popover').popover('hide');

    $(selector).empty();
    $(card).detach().appendTo($(selector));

    $(card)
        .css('left', "")
        .css('top', "")
        .css('position', "")
        .css("margin-bottom", "")
        .css("transform", "")
        .off("click")
        .flip(false);

    list.push(getCardObject(card));

    updateTotals();
    bindCardActions();
}

function putCardinHand(card) {
    card.detach().appendTo($("#hand-placeholder"));
    
    var needle = getGoldfishId(card);
    var index = handList.findIndex(function(element) {
        return element.goldfishId === needle;
    });

    if (index === -1) {
        handList.push(getCardObject(card));
    }
    
    updateTotals();
}