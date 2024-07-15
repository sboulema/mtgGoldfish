async function importMtgStocksDeck(deckId) {
    const response = await fetch(`https://cors.sboulema.nl/https://api.mtgstocks.com/decks/${deckId}`)
    const result = await response.json();

    $("#deck-list")
        .val(
            result.boards.mainboard.cards
            .map((card) => `${card.quantity} ${card.card.name}`)
            .join("\n")
        );

    if (typeof result.boards.sideboard !== 'undefined') {
        $("#sideboard-list")
        .val(
            result.boards.sideboard.cards
            .map((card) => `${card.quantity} ${card.card.name}`)
            .join("\n")
        );
    }
}

async function importMtgGolfdishDeck(deckId) {
    const response = await fetch("https://wrapapi.com/use/sboulema/mtggoldfish/deck/0.0.2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            "deckId": deckId,
            "wrapAPIKey": "HXhWGELDSQ84wmTd2FYKxtTnqKjeRtQb"
        }),
    })
    const result = await response.json();

    var deck = "";
    var sideboard = "";
    var loadingDeck = true;

    $.each(result.data.Line, function(key, card) {
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
}

async function loadDeck() {
    // Clear any existing deck and sideboard
    libraryList = [];
    sideboardList = [];

    // Mainboard
    var result = await parseCardList($("#deck-list").val());
    libraryList = result.cards;

    if (!result.success) {
        $("#alert-load-deck")
            .removeClass("d-none")
            .text(result.errorMessage);
    }

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
        result = await parseCardList($("#sideboard-list").val());
        sideboardList = result.sideboardList;

        $("#sideboard-placeholder").html(defaultCard());
        sideboard = sideboardList.slice();
        updateTotals();
        bindCardActions();
    }

    return result.success;
}

async function parseCardList(input) {
    var lines = input.trim().split("\n");

    var cardListResult = {
        cards: [],
        success: true,
        errorMessage: "",
    }

    lines.forEach((line) => {
        var matches = line.match(/(\d+)x?\s+([^(]*)(?:\((.*)\))?(?:\s+(\d+))?/);

        if (matches === null) {
            return;
        }

        cardListResult.cards.push({
            name: matches[2].split("/")[0].trim(), // Take single name for split cards like "Commit / Memory"
            count: matches[1],
            set: matches[3],
            collector_number: matches[4],
        })
    })

    // split in batches of 75 (max batch size for Scryfall Collection API)
    var batches = chunk(cardListResult.cards, 75);

    // use scryfall api to get data
    await Promise.all(batches.map(async (batch) => {
        const response = await fetch("https://api.scryfall.com/cards/collection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifiers: batch.map((card) => ({
                name: typeof card.set !== "undefined" ? undefined: card.name,
                set: card.set,
                collector_number: card.collector_number
            })) }),
        })
        const result = await response.json();

        if (result.not_found.length > 0) {
            cardListResult.errorMessage = `The following cards could not be found: ${result.not_found.map((card) => card.name).join(", ")}`;
            cardListResult.success = false;
        }

        const scryfallCards = result.data.map((card) => ({
            name: card.name,
            layout: card.layout,
            imageUrl: isDoubleFaced(card.layout) ? card.card_faces[0].image_uris.small : card.image_uris.small,
            imageFrontPreviewUrl: isDoubleFaced(card.layout) ? card.card_faces[0].image_uris.png : card.image_uris.png,
            imageUrlBack: isDoubleFaced(card.layout) ? card.card_faces[1].image_uris.small : settings.useLightlyPlayedCardBackside ? "img/card-backside-lightly-played.png" : "img/card-backside-mint.jpg",
            imageBackPreviewUrl: isDoubleFaced(card.layout) ? card.card_faces[1].image_uris.png : settings.useLightlyPlayedCardBackside ? "img/card-backside-lightly-played.png" : "img/card-backside-mint.jpg",
            goldfishId: createGoldfishId(),
        }));

        // merge count and scryfall data
        mergeByProperty(cardListResult.cards, scryfallCards, "name");
    }));

    // duplicate cards based on count
    cardListResult.cards.map((card) => {
        for (let index = 0; index < card.count - 1; index++) {
            cardListResult.cards.push(card);
        }
    });

    // return completed card list
    return cardListResult;
}

const chunk = (arr, size) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );

/**
 * Merge two lists based on a matching property
 * 
 * Remarks:
 * - Properties should match or match the first part of a split card
 * - Objects in the source list that do not match a target object will be appended to the target list
 * @param {Object[]} target - The list that will hold the merged set of lists.
 * @param {Object[]} source - the list to merge with the target list.
 * @param {string} prop - The name of the property to match on.
 */
const mergeByProperty = (target, source, prop) => {
        source.forEach(sourceElement => {
            let targetElement = target.find(targetElement => {
                return sourceElement[prop] === targetElement[prop] ||
                       sourceElement[prop].split("//")[0].trim() === targetElement[prop];
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

/**
 * Setup click event on the top library card to draw a new card
 */
function setupClickToDraw() {
    $("#library-placeholder .mtg-card").on("click", function() {
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

/**
 * Put a card on the library
 * 
 * Remarks:
 * - By default the card will be put on top of the library
 * - When putting on top of the library, the card will be flipped to the back 
 * @param {HTMLElement} htmlElement - HTML element gotten by for example a jQuery selector '$(".mtg-card:hover")[0]'
 * @param {boolean} onBottom - Put card on the bottom of the library
 * @returns 
 */
function putCardOnLibrary(htmlElement, onBottom) {
    if (typeof htmlElement === 'undefined') {
        return;
    }

    $('.popover').popover('hide');

    if (onBottom) {
        libraryList.push(getCardObject(htmlElement))
    } else {
        $("#library-placeholder").empty();
        libraryList.unshift(getCardObject(htmlElement));
        $("#library-placeholder").html(createCard(libraryList[0]));

        // Flip card to the back side
        $("#library-placeholder .mtg-card").flip({trigger: "manual"});
        $("#library-placeholder .mtg-card").flip(true);
    }

    $(htmlElement).trigger("mouseout");
    $(htmlElement).remove();

    setupClickToDraw();
    updateTotals();
    bindCardActions();
} 

/**
 * Put a card in a zone placeholder
 * 
 * @param {HTMLElement} htmlElement - HTML element gotten by for example a jQuery selector '$(".mtg-card:hover")[0]'
 * @param {string} selector - CSS selector of the zone placeholder
 * @param {string} id - Title of the zone placeholder
 * @returns 
 */
function putCardinPlaceholder(htmlElement, selector, id) {
    if(typeof htmlElement === 'undefined') {
        return;
    }

    $('.popover').popover('hide');

    $(selector).empty();
    $(htmlElement).detach().appendTo($(selector));

    $(htmlElement)
        .css('left', "")
        .css('top', "")
        .css('position', "")
        .css("margin-bottom", "")
        .css("transform", "")
        .off("click")
        .flip(false);

    GetListById(id).push(getCardObject(htmlElement));

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