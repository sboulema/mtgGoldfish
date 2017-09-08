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
        url: "https://wrapapi.com/use/sboulema/mtggoldfish/deck/0.0.1",
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

    return $.getJSON("https://api.magicthegathering.io/v1/cards?orderBy=name&rarity=Common|Uncommon|Rare|Mythic Rare|Basic Land&name=" + name).then(function (data) {   
        var result = data.cards.find(function(element) { return (typeof element.multiverseid != 'undefined') && (element.name === name)});

        var card = {};
        card.name = result.name;
        card.layout = result.layout;
        card.multiverseId = result.multiverseid;    
        card.goldfishId = createGoldfishId();

        if (card.layout === "double-faced") {
            return $.getJSON("https://api.magicthegathering.io/v1/cards?orderBy=name&rarity=Common|Uncommon|Rare|Mythic Rare|Basic Land&name=" + data.cards[0].names[1]).then(function (data) {
                var result = data.cards.find(function(element) { return (typeof element.multiverseid != 'undefined') && (element.name === name)}); 
                card.multiverseIdBack = result.multiverseid;
                for (var j = 0; j < count; j++) {
                    list.push(card);
                } 
            });
        } else {
            for (var j = 0; j < count; j++) {
                list.push(card);
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

    var handSize = $("#hand").children().length;
    $("#hand").empty();

    var newHandSize = handSize - 1;
    if (newHandSize === 0) newHandSize = 1;
    
    draw(newHandSize);
    updateTotals();
}

function draw(amount) {
    for (var index = 0; index < amount; index++) {
        $("#hand").append(createCard(libraryList.splice(0, 1)[0]));      
    }
    updateTotals();
    bindCardActions();
}

function setupClickToDraw() {
    $(".library-placeholder-card").click(function (event) {
        draw(1);
    });
}

function startShuffleDeckToCard() {
    var cardName = $("#shuffle-card-name").val().trim();   

    $('#shuffleDeckModal').modal('hide');

    $.getJSON("https://api.magicthegathering.io/v1/cards?orderBy=name&rarity=Common|Uncommon|Rare|Mythic Rare|Basic Land&name=" + cardName).then(function (data) {
        shuffleDeckToCard(data.cards[0].multiverseid);
    });  
}

function shuffleDeckToCard(multiverseId) {
    var found = false;

    $("#hand").empty();
    libraryList = deck.slice();

    shuffleDeck();
    draw(7);

    $.when.apply($, $("#hand").children().map(function (index, card) {
        if (parseInt($(card).attr('data-multiverseid')) === multiverseId) {
            return found = true;
        }
    })).then(function () {
        if (!found) {
            shuffleDeckToCard(multiverseId);
        }
    });
}

function putCardOnLibrary(card, onBottom) {
    if (onBottom) {
        libraryList.push($(card).attr('data-multiverseid'))
    } else {
        $("#library-placeholder").empty();
        libraryList.unshift($(card).attr('data-multiverseid'));
        $("#library-placeholder").append(defaultCard("library-placeholder-card"));
    }

    $(card).mouseout();
    $(card).remove();

    setupClickToDraw();
    updateTotals();
    bindCardActions();
} 

function putCardinPlaceholder(card, selector, list) {
    $('.popover').popover('hide');

    $(selector).empty();  
    $(card).detach().appendTo($(selector));

    $(card)
        .css('left', "")
        .css('top', "")
        .css('position', "")
        .css("margin-bottom", "")
        .css("transform", "")
        .unbind("click");

    list.push(getCardObject(card));

    updateTotals();
    bindCardActions();
}