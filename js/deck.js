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

async function loadDeck() {
    // Clear any existing deck and sideboard
    libraryList = [];
    sideboardList = [];

    // Mainboard
    libraryList = await parseCardList($("#deck-list").val());

    // Place card on top of library
    var libraryTopCard = createCard(libraryList[0]);
    $("#library-placeholder").html(libraryTopCard);

    // Set start state
    deck = libraryList.slice();
    shuffleDeck();
    draw(7);
    updateTotals();
    bindCardActions();
    setupClickToDraw();

    // Sideboard
    if ($("#sideboard-list").val() != '') {
        sideboardList = await parseCardList($("#sideboard-list").val());

        $("#sideboard-placeholder").html(defaultCard());
        sideboard = sideboardList.slice();
        updateTotals();
        bindCardActions();
    }
}

async function parseCardList(input) {
    var lines = input.trim().split("\n");

    var cards = [];

    lines.forEach((line) => {
        var matches = line.match(/\b(\d+)x?\s+(.*)\b/);

        if (matches === null) {
            return;
        }

        var count = matches[1];
        var name = matches[2];

        cards.push({
            name: name,
            count: count,
        })
    })

    // split in batches of 75 (max batch size for Scryfall Collection API)
    var batches = chunk(cards, 75);

    // use scryfall api to get data
    await Promise.all(batches.map(async (batch) => {
        const response = await fetch("https://api.scryfall.com/cards/collection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifiers: batch }),
        })
        const result = await response.json();

        const scryfallCards = result.data.map((card) => ({
            name: card.name,
            layout: card.layout,
            imageUrl: isDoubleFaced(card.layout) ? card.card_faces[0].image_uris.large : card.image_uris.large,
            imageUrlBack: isDoubleFaced(card.layout) ? card.card_faces[1].image_uris.large : "img/backside.jpg",
            goldfishId: createGoldfishId(),
        }));

        // merge count and scryfall data
        mergeByProperty(cards, scryfallCards, "name");
    }));

    // duplicate cards based on count
    cards.map((card) => {
        for (let index = 0; index < card.count - 1; index++) {
            cards.push(card);
        }
    });

    // return completed card list
    return cards;
}

const chunk = (arr, size) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );

const mergeByProperty = (target, source, prop) => {
        source.forEach(sourceElement => {
            let targetElement = target.find(targetElement => {
            return sourceElement[prop] === targetElement[prop];
            })
            targetElement ? Object.assign(targetElement, sourceElement) : target.push(sourceElement);
        })
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
    if (libraryList.length === 0) {
        return;
    }

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