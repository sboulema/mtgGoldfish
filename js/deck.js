/**
 * Read a local deck file and populate the mainboard/sideboard textareas.
 * Supports plain text, MTGO format (SB: prefix), and Sideboard: section headers.
 */
function importDeckFromFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var lines = e.target.result.split('\n').map(function(l) { return l.trim(); });
        var mainboardLines = [];
        var sideboardLines = [];
        var inSideboard = false;

        lines.forEach(function(line) {
            if (!line) return;
            // MTGO "SB: 4 Card Name" format
            if (/^SB:\s+/i.test(line)) {
                sideboardLines.push(line.replace(/^SB:\s+/i, ''));
                return;
            }
            // "Sideboard:" section header
            if (/^sideboard\s*:?\s*$/i.test(line)) {
                inSideboard = true;
                return;
            }
            if (inSideboard) {
                sideboardLines.push(line);
            } else {
                mainboardLines.push(line);
            }
        });

        document.getElementById('deck-list').value = mainboardLines.join('\n');
        document.getElementById('sideboard-list').value = sideboardLines.join('\n');

        // Reset the file input so the same file can be re-imported
        document.getElementById('deck-file-input').value = '';
    };
    reader.readAsText(file);
}

async function importMtgStocksDeck(deckId) {
    const response = await fetch(`https://cors.sboulema.nl/https://api.mtgstocks.com/decks/${deckId}`);
    const result = await response.json();

    document.getElementById("deck-list").value =
        result.boards.mainboard.cards
        .map((card) => `${card.quantity} ${card.card.name}`)
        .join("\n");

    if (typeof result.boards.sideboard !== 'undefined') {
        document.getElementById("sideboard-list").value =
            result.boards.sideboard.cards
            .map((card) => `${card.quantity} ${card.card.name}`)
            .join("\n");
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
    });
    const result = await response.json();

    var deck = "";
    var sideboard = "";
    var loadingDeck = true;

    result.data.Line.forEach(function(card) {
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

    document.getElementById("deck-list").value = deck;
    document.getElementById("sideboard-list").value = sideboard;
}

async function loadDeck(onProgress) {
    // Clear any existing deck and sideboard
    libraryList = [];
    sideboardList = [];

    // Mainboard
    var result = await parseCardList(document.getElementById("deck-list").value, onProgress);
    libraryList = result.cards;

    if (!result.success) {
        var alert = document.getElementById("alert-load-deck");
        alert.classList.remove("d-none");
        alert.textContent = result.errorMessage;
    }

    // Set start state
    deck = libraryList.slice();
    shuffleDeck();
    draw(7);

    // Place card on top of library
    var libraryEl = document.getElementById("library-placeholder");
    libraryEl.innerHTML = '';
    if (libraryList.length > 0) {
        libraryEl.appendChild(createCard(libraryList[0]));
        // Flip card to the back side
        flipCard(libraryEl.querySelector('.mtg-card'), true);
    }

    updateTotals();
    bindCardActions();
    setupClickToDraw();

    // Sideboard
    var sideboardVal = document.getElementById("sideboard-list").value;
    if (sideboardVal != '') {
        result = await parseCardList(sideboardVal, onProgress);
        sideboardList = result.cards;

        document.getElementById("sideboard-placeholder").appendChild(defaultCard());
        sideboard = sideboardList.slice();
        updateTotals();
        bindCardActions();
    }

    return result.success;
}

async function parseCardList(input, onProgress) {
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
        });
    });

    // split in batches of 75 (max batch size for Scryfall Collection API)
    var batches = chunk(cardListResult.cards, 75);
    var total = cardListResult.cards.length;
    var loaded = 0;

    // use scryfall api to get data
    await Promise.all(batches.map(async (batch) => {
        const response = await fetch("https://api.scryfall.com/cards/collection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifiers: batch.map((card) => {
                if (card.set && card.collector_number) {
                    return { set: card.set, collector_number: card.collector_number };
                }
                return { name: card.name };
            }) }),
        });
        const result = await response.json();

        if (!result.data) {
            cardListResult.errorMessage = "Failed to fetch cards from Scryfall";
            cardListResult.success = false;
            return;
        }

        if (result.not_found && result.not_found.length > 0) {
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

        loaded += batch.length;
        if (onProgress) onProgress(loaded, total);
    }));

    // duplicate cards based on count
    cardListResult.cards.map((card) => {
        for (var index = 0; index < card.count - 1; index++) {
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

/**
 * Shuffle the library list using Knuth shuffle
 */
function shuffleDeck() {
    window.knuthShuffle(libraryList);
}

/**
 * Put cards in hand back on the library, shuffle, draw 7 new cards
 */
function mulligan() {
    libraryList = deck.slice();
    shuffleDeck();

    document.getElementById("hand-placeholder").innerHTML = '';

    draw(7);
}

/**
 * Draw X cards, remove them from the library and add them to your hand
 * @param {number} amount - Number of cards to draw
 */
function draw(amount) {
    if (libraryList.length === 0) {
        return;
    }

    var handEl = document.getElementById("hand-placeholder");

    libraryList
        .splice(0, amount)
        .forEach(function(card) {
            handList.push(card);
            handEl.appendChild(createCard(card));
        });

    updateTotals();
    bindCardActions();
}

/**
 * Setup click event on the top library card to draw a new card
 */
function setupClickToDraw() {
    var libraryCard = document.querySelector("#library-placeholder .mtg-card");
    if (libraryCard) {
        libraryCard.addEventListener("click", function() {
            draw(1);
        });
    }
}

function startShuffleDeckToCard() {
    var cardName = document.getElementById("shuffle-card-name").value.trim();

    bootstrap.Modal.getOrCreateInstance(document.getElementById('shuffleDeckModal')).hide();

    shuffleDeckToCard(cardName);
}

function shuffleDeckToCard(cardName) {
    handList.length = 0;
    document.getElementById("hand-placeholder").innerHTML = '';

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
 * @param {HTMLElement} htmlElement
 * @param {boolean} onBottom - Put card on the bottom of the library
 */
function putCardOnLibrary(htmlElement, onBottom) {
    if (typeof htmlElement === 'undefined' || htmlElement === null) {
        return;
    }

    // Hide any connected popovers
    var popover = bootstrap.Popover.getInstance(htmlElement);
    if (popover) popover.hide();

    if (onBottom) {
        libraryList.push(getCardObject(htmlElement));
    }

    // Put a card on top of the library or when putting the top card on the bottom
    if (!onBottom || htmlElement.parentElement.id === "library-placeholder") {
        // Put new card on top of the library
        var libraryEl = document.getElementById("library-placeholder");
        libraryEl.innerHTML = '';
        libraryList.unshift(getCardObject(htmlElement));
        libraryEl.appendChild(createCard(libraryList[0]));

        // Flip card to the back side
        flipCard(libraryEl.querySelector('.mtg-card'), true);
    }

    htmlElement.remove();

    setupClickToDraw();
    updateTotals();
    bindCardActions();
}

/**
 * Put a card in a zone placeholder
 * @param {HTMLElement} htmlElement
 * @param {string} selector - CSS selector of the zone placeholder
 * @param {string} id - Title of the zone placeholder
 */
function putCardinPlaceholder(htmlElement, selector, id) {
    if (typeof htmlElement === 'undefined' || htmlElement === null) {
        return;
    }

    var destination = document.querySelector(selector);

    // Clear the placeholder to insert the new card
    destination.innerHTML = '';

    // Hide any connected popovers
    var popover = bootstrap.Popover.getInstance(htmlElement);
    if (popover) popover.hide();

    // Add card to the placeholder
    destination.appendChild(htmlElement);

    // Clean card of any styling/logic received
    htmlElement.style.left = '';
    htmlElement.style.top = '';
    htmlElement.style.position = '';
    htmlElement.style.marginBottom = '';
    htmlElement.style.transform = '';
    flipCard(htmlElement, false);

    // Add card to the correct list
    GetListById(id).push(getCardObject(htmlElement));

    // Update card counts
    updateTotals();

    // Setup card events for the new card in the placeholder
    bindCardActions();
}

function putCardinHand(card) {
    document.getElementById("hand-placeholder").appendChild(card);

    var needle = getGoldfishId(card);
    var index = handList.findIndex(function(element) {
        return element.goldfishId === needle;
    });

    if (index === -1) {
        handList.push(getCardObject(card));
    }

    updateTotals();
}
