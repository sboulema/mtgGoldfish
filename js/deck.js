function loadDeck() {
    var lines = $("#deck-list").val().split('\n');

    // Mainboard
    $.when.apply($, lines.map(function (line) {
        var matches = line.match(/\b(\d+)\s+(.*)\b/);
        var count = matches[1];
        var name = matches[2];

        return $.getJSON("https://api.magicthegathering.io/v1/cards?rarity=Common|Uncommon|Rare|Mythic Rare|Basic Land&name=" + name).then(function (data) {
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
    
            return $.getJSON("https://api.magicthegathering.io/v1/cards?rarity=Common|Uncommon|Rare|Mythic Rare|Basic Land&name=" + name).then(function (data) {
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
    updateTotals();
}

function setupClickToDraw() {
    $(".library-placeholder-card").click(function (event) {
        draw(1);
    });
}