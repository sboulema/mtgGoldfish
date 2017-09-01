function loadDeck() {
    var lines = $("#deck-list").val().trim().split('\n');

    // Mainboard
    $.when.apply($, lines.map(function (line) {
        var matches = line.match(/\b(\d+)\s+(.*)\b/);
        var count = matches[1];
        var name = matches[2];

        return $.getJSON("https://api.magicthegathering.io/v1/cards?orderBy=name&rarity=Common|Uncommon|Rare|Mythic Rare|Basic Land&name=" + name).then(function (data) {
            for (var j = 0; j < count; j++) {
                libraryList.push(data.cards[0].multiverseid);
            }
        });
    })).then(function () {
        $("#library-placeholder").html(defaultCard("library-placeholder-card"));
        deck = libraryList.slice();
        shuffleDeck();
        draw(7);
        updateTotals();
        bindCardActions();
        setupClickToDraw();
    });

    // Sideboard
    if ($("#sideboard-list").val() != '') {
        var lines = $("#sideboard-list").val().split('\n');

        $.when.apply($, lines.map(function (line) {
            var matches = line.match(/\b(\d+)\s+(.*)\b/);
            var count = matches[1];
            var name = matches[2];
    
            return $.getJSON("https://api.magicthegathering.io/v1/cards?orderBy=name&rarity=Common|Uncommon|Rare|Mythic Rare|Basic Land&name=" + name).then(function (data) {
                for (var j = 0; j < count; j++) {
                    sideboardList.push(data.cards[0].multiverseid);
                }
            });
        })).then(function () {
            $("#sideboard-placeholder").html(defaultCard());
            sideboard = sideboardList.slice();
            updateTotals();
            bindCardActions();
        });       
    }

    $('#deckModal').modal('toggle');
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
        $("#hand").append(createCard(libraryList.splice(0, 1)));      
    }
    $(".mtg-card").draggable({helper: "clone"});
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
        if (parseInt($(card).data("multiverseId")) === multiverseId) {
            return found = true;
        }
    })).then(function () {
        if (!found) {
            shuffleDeckToCard(multiverseId);
        }
    });
}