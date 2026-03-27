var libraryList = [];
var graveyardList = [];
var exileList = [];
var sideboardList = [];
var handList = [];

var deck = [];
var sideboard = [];

var markedList = [];

var settings = {};

// AbortController to prevent duplicate event listeners when init() is called multiple times
var initAbortController = null;

document.addEventListener('DOMContentLoaded', async function() {
    await loadModals();
    init();
});

async function loadModals() {
    // If modals are already inlined (dist build), skip loading
    if (document.getElementById('deckModal')) return;

    var modals = ['deckmodal', 'helpmodal', 'settingsmodal', 'shuffletocardmodal', 'tokenmodal', 'zonemodal'];
    await Promise.all(modals.map(async function(modal) {
        var response = await fetch('modals/' + modal + '.html');
        var html = await response.text();
        var div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div);
    }));
}

async function init() {
    // Abort previous listeners to prevent duplicates when init() is re-called
    if (initAbortController) initAbortController.abort();
    initAbortController = new AbortController();
    var signal = initAbortController.signal;

    bindCardActions();
    setupLifeCounters();
    setupManaPoolCounters(signal);
    setupCustomCounter(signal);
    setupTurnButton(signal);

    setupDragDrop();

    bindZoneModal("#exile-title", "Exile", signal);
    bindZoneModal("#sideboard-title", "Sideboard", signal);
    bindZoneModal("#library-title", "Library", signal);
    bindZoneModal("#graveyard-title", "Graveyard", signal);
    bindZoneModal("#hand-title", "Hand", signal);

    // Keyboard shortcuts
    document.addEventListener("keypress", handleKeypress, { signal: signal });

    // Focus first input when modal is shown
    document.addEventListener('shown.bs.modal', function(event) {
        var firstInput = event.target.querySelector('input:not([type=hidden]):not([disabled])');
        if (firstInput) firstInput.focus();
        var firstTextarea = event.target.querySelector('textarea:not([disabled])');
        if (firstTextarea) firstTextarea.focus();
    }, { signal: signal });

    // Settings modal: retrieve settings when shown
    var settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.addEventListener('shown.bs.modal', function() {
            retrieveSettings();
        }, { signal: signal });
    }

    retrieveSettings();

    // Load deck based on url param
    var url = new URL(window.location);
    var params = new URLSearchParams(url.search.slice(1));

    if (params.has('mtgstocksdeckid')) {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('deckModal')).show();
        await importMtgStocksDeck(params.get('mtgstocksdeckid'));
        await loadDeck();
        bootstrap.Modal.getOrCreateInstance(document.getElementById('deckModal')).hide();
    }

    if (params.has("mtggoldfishdeckid")) {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('deckModal')).show();
        await importMtgGolfdishDeck(params.get('mtggoldfishdeckid'));
        await loadDeck();
        bootstrap.Modal.getOrCreateInstance(document.getElementById('deckModal')).hide();
    }

    setupTokens();
}

function handleKeypress(event) {
    var hoveredCard = document.querySelector(".mtg-card:hover");
    switch (event.which) {
        case 98: // b
            putCardOnLibrary(hoveredCard, true);
            break;
        case 99: // c
            addCounter(hoveredCard);
            break;
        case 100: // d
            draw(1);
            break;
        case 101: // e
            putCardinPlaceholder(hoveredCard, "#exile-placeholder", "Exile");
            break;
        case 102: // f
            if (hoveredCard) flipCard(hoveredCard);
            break;
        case 103: // g
            putCardinPlaceholder(hoveredCard, "#graveyard-placeholder", "Graveyard");
            break;
        case 108: // l
            putCardOnLibrary(hoveredCard);
            break;
        case 109: // m
            if (hoveredCard) markCard(hoveredCard);
            break;
        case 116: // t
            if (hoveredCard) tap(hoveredCard);
            break;
    }
}

function retrieveSettings() {
    settings = localStorage.getItem("mtgGoldfish-settings") !== null
        ? JSON.parse(localStorage.getItem("mtgGoldfish-settings"))
        : {};

    var backgroundUrl = settings.background;

    if (backgroundUrl) {
        document.body.style.backgroundImage = "url('" + backgroundUrl + "')";
        document.getElementById("background-url").value = backgroundUrl;
    } else {
        document.body.style.backgroundImage = "url('../img/playmat.webp')";
    }

    var checkbox = document.getElementById("checkbox-card-backside-lightly-played");
    if (checkbox) checkbox.checked = !!settings.useLightlyPlayedCardBackside;
}

function bindZoneModal(selector, id, signal) {
    document.querySelector(selector).addEventListener("click", function() {
        var zoneRow = document.querySelector('#zoneModal .row');
        zoneRow.innerHTML = '';

        // Set title of the modal to the zone title
        document.querySelector("#zoneModal .modal-title").textContent = id;

        // Show every card in the zone list
        GetListById(id).forEach(function(card) {
            zoneRow.appendChild(createCard(card));
        });

        bindCardActions();
        markAllCards();
    }, { signal: signal });
}

/**
 * Get the correct list of cards based on the id
 * @param {string} id
 * @returns
 */
function GetListById(id) {
    switch (id) {
        case "Library":
            return libraryList;
        case "Graveyard":
            return graveyardList;
        case "Exile":
            return exileList;
        case "Sideboard":
            return sideboardList;
        case "Hand":
            return handList;
    }
}

function setupLifeCounters() {
    var lifeYou = document.getElementById('life-you');
    if (lifeYou.style.textAlign !== "center") {
        bootstrapNumber(lifeYou, { upClass: 'success', downClass: 'danger' });
    }

    var lifeOpponent = document.getElementById('life-opponent');
    if (lifeOpponent.style.textAlign !== "center") {
        bootstrapNumber(lifeOpponent, { upClass: 'success', downClass: 'danger' });
    }
}

/**
 * Setup functionality for the Custom Counter
 */
function setupCustomCounter(signal) {
    var customCounter = document.getElementById('custom-counter');
    if (customCounter.style.textAlign !== "center") {
        bootstrapNumber(customCounter, { upClass: 'success', downClass: 'danger' });
    }

    var label = document.getElementById("custom-counter-label");
    var labelInput = document.getElementById("custom-counter-label-input");
    labelInput.style.display = 'none';

    // Show input field upon clicking the custom counter label
    label.addEventListener("click", function() {
        labelInput.style.display = '';
    }, { signal: signal });

    // Upon enter or leaving focus, save the text as custom counter label
    function handleLabelInput(event) {
        if (event.type === 'keypress' && event.key !== "Enter") return;
        label.textContent = labelInput.value + ":";
        labelInput.style.display = 'none';
    }
    labelInput.addEventListener("keypress", handleLabelInput, { signal: signal });
    labelInput.addEventListener("focusout", handleLabelInput, { signal: signal });
}

function setupTurnButton(signal) {
    document.getElementById("btn-next-turn").addEventListener("click", function() {
        var turnCounter = document.getElementById("turn-counter");
        turnCounter.innerHTML = parseInt(turnCounter.innerHTML) + 1;
        draw(1);
        untapAll();
    }, { signal: signal });
}

/**
 * Parse and load deck entered in the Deck modal
 */
async function startLoadDeck() {
    document.getElementById("btn-load-deck-spinner").classList.remove("d-none");
    document.getElementById("btn-load-deck-text").textContent = "Loading...";

    reset();

    var success = await loadDeck();

    document.getElementById("btn-load-deck-spinner").classList.add("d-none");
    document.getElementById("btn-load-deck-text").textContent = "Load";

    if (success) {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('deckModal')).hide();
    }
}

function setupManaPoolCounters(signal) {
    // Disable context menu on mana pools
    document.body.addEventListener('contextmenu', function(e) {
        if (e.target.closest('.mana-pool')) {
            e.preventDefault();
            return false;
        }
    }, { signal: signal });

    document.querySelectorAll(".mana-pool").forEach(function(pool) {
        pool.addEventListener("mousedown", function(event) {
            var counter = this.querySelector(".mana-pool-counter");
            var match = counter.className.match(/\bms-(\d+)\b/);
            var value = parseInt(match[1]);

            counter.classList.remove("ms-" + value);

            switch (event.which) {
                case 1: // Left button
                    value++;
                    if (value >= 20) value = 20;
                    counter.classList.add("ms-" + value);
                    break;
                case 3: // Right button
                    value--;
                    if (value <= 0) value = 0;
                    counter.classList.add("ms-" + value);
                    break;
            }
        }, { signal: signal });
    });
}

/**
 * Update number of cards in each zone
 */
function updateTotals() {
    document.getElementById("libraryTotal").innerHTML = libraryList.length;
    document.getElementById("graveyardTotal").innerHTML = graveyardList.length;
    document.getElementById("exileTotal").innerHTML = exileList.length;
    document.getElementById("sideboardTotal").innerHTML = sideboardList.length;
    document.getElementById("handTotal").innerHTML = handList.length;
}

/**
 * Helper to handle cleanup when a card is dragged away from a zone
 */
function cleanupDragSource(sourceParent, card) {
    if (!sourceParent) return;
    var sourceId = sourceParent.id;

    if (sourceId === 'hand-placeholder') {
        var gid = card.dataset.goldfishid;
        var idx = handList.findIndex(function(c) { return c.goldfishId === gid; });
        if (idx > -1) handList.splice(idx, 1);
    } else if (sourceId === 'library-placeholder') {
        libraryList.splice(0, 1);
        flipCard(card, false);
        if (libraryList.length > 0) {
            sourceParent.innerHTML = '';
            sourceParent.appendChild(createCard(libraryList[0]));
            flipCard(sourceParent.querySelector('.mtg-card'), true);
            setupClickToDraw();
            bindCardActions();
        }
    } else if (sourceId === 'graveyard-placeholder' || sourceId === 'exile-placeholder' || sourceId === 'sideboard-placeholder') {
        var zoneName = sourceId.replace('-placeholder', '');
        zoneName = zoneName.charAt(0).toUpperCase() + zoneName.slice(1);
        var list = GetListById(zoneName);
        list.splice(-1, 1);
        if (list.length > 0) {
            sourceParent.appendChild(createCard(list[list.length - 1]));
            bindCardActions();
        }
    }
    // For table: no list cleanup needed, just style reset (handled by destination)
}

function setupDropZone(element, onDrop) {
    element.addEventListener('dragover', function(e) {
        if (!currentDragElement) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    element.addEventListener('drop', function(e) {
        e.preventDefault();
        if (!currentDragElement) return;
        onDrop(currentDragElement, e);
    });
}

function setupDragDrop() {
    var tableEl = document.getElementById('table');
    var handEl = document.getElementById('hand-placeholder');
    var libraryEl = document.getElementById('library-placeholder');

    // Table drop zone
    setupDropZone(tableEl, function(card, e) {
        var tableRect = tableEl.getBoundingClientRect();
        var dropX = e.clientX - dragOffsetX - tableRect.left;
        var dropY = e.clientY - dragOffsetY - tableRect.top;

        var sourceParent = card.parentElement;
        if (sourceParent === tableEl) {
            // Repositioning on table
            card.style.position = 'absolute';
            card.style.left = dropX + 'px';
            card.style.top = dropY + 'px';
            return;
        }

        cleanupDragSource(sourceParent, card);

        // Reset styles from previous zone
        card.style.marginBottom = '';

        card.style.left = dropX + 'px';
        card.style.top = dropY + 'px';
        card.style.position = 'absolute';
        tableEl.appendChild(card);

        updateTotals();
        bindCardActions();
    });

    // Hand drop zone
    setupDropZone(handEl, function(card, e) {
        var sourceParent = card.parentElement;
        if (sourceParent === handEl) return;

        cleanupDragSource(sourceParent, card);

        // Reset absolute positioning
        card.style.left = '';
        card.style.top = '';
        card.style.position = '';
        card.style.marginBottom = '';
        card.style.transform = '';

        putCardinHand(card);
        bindCardActions();
    });

    // Library drop zone
    setupDropZone(libraryEl, function(card, e) {
        var sourceParent = card.parentElement;
        if (sourceParent === libraryEl) return;

        cleanupDragSource(sourceParent, card);

        // Reset styles
        card.style.left = '';
        card.style.top = '';
        card.style.position = '';
        card.style.marginBottom = '';
        card.style.transform = '';

        putCardOnLibrary(card);
    });

    // Graveyard, Exile, Sideboard drop zones
    setupDroppablePlaceholder("#graveyard-placeholder", "Graveyard");
    setupDroppablePlaceholder("#exile-placeholder", "Exile");
    setupDroppablePlaceholder("#sideboard-placeholder", "Sideboard");

    // Counter drop on card faces
    tableEl.addEventListener('dragover', function(e) {
        if (currentDragElement && currentDragElement.classList.contains('counter')) {
            e.preventDefault();
        }
    });
    tableEl.addEventListener('drop', function(e) {
        if (currentDragElement && currentDragElement.classList.contains('counter')) {
            var cardSide = e.target.closest('.mtg-card-side');
            if (cardSide) {
                e.preventDefault();
                e.stopPropagation();
                var rect = cardSide.getBoundingClientRect();
                currentDragElement.style.left = (e.clientX - rect.left) + 'px';
                currentDragElement.style.top = (e.clientY - rect.top) + 'px';
                currentDragElement.style.position = 'relative';
                currentDragElement.style.display = 'inline-block';
                cardSide.appendChild(currentDragElement);
            }
        }
    });

    // Tap card on click (event delegation on table)
    // Use mousedown+mouseup instead of click because draggable=true suppresses click in some browsers
    var tapStartTarget = null;
    tableEl.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return; // Only left mouse button
        tapStartTarget = e.target.closest('.mtg-card');
    });
    tableEl.addEventListener('mouseup', function(e) {
        if (e.button !== 0) { tapStartTarget = null; return; } // Only left mouse button
        if (currentDragElement) { tapStartTarget = null; return; }
        var card = e.target.closest('.mtg-card');
        if (card && card === tapStartTarget && !e.target.closest('.counter') && !e.target.closest('.counter-input') && card.parentElement === tableEl) {
            tap(card);
        }
        tapStartTarget = null;
    });
}

/**
 * Setup droppable zone placeholder
 * @param {string} selector CSS selector of the zone placeholder
 * @param {string} id Title of the zone
 */
function setupDroppablePlaceholder(selector, id) {
    var el = document.querySelector(selector);
    setupDropZone(el, function(card, e) {
        var sourceParent = card.parentElement;
        if (sourceParent === el) return;

        // Tokens are destroyed when they change zone
        if (card.classList.contains("token")) {
            card.remove();
            return;
        }

        cleanupDragSource(sourceParent, card);

        // Reset styles
        card.style.left = '';
        card.style.top = '';
        card.style.position = '';
        card.style.marginBottom = '';
        card.style.transform = '';

        putCardinPlaceholder(card, selector, id);
    });
}

/**
 * Reset the game state
 */
async function reset() {
    exileList = [];
    graveyardList = [];
    markedList = [];
    handList = [];
    libraryList = deck.slice();
    sideboardList = sideboard.slice();

    // Empty all zones
    document.querySelectorAll(".card-placeholder").forEach(function(el) { el.innerHTML = ''; });
    document.getElementById("table").innerHTML = '';

    // Reset the sideboard
    if (sideboardList.length > 0) {
        document.getElementById("sideboard-placeholder").appendChild(defaultCard());
    }

    // Shuffle library and set top card
    if (libraryList.length > 0) {
        shuffleDeck();

        var libraryEl = document.getElementById("library-placeholder");
        libraryEl.appendChild(createCard(libraryList[0]));

        // Flip card to the back side
        flipCard(libraryEl.querySelector('.mtg-card'), true);
    }

    // Reset life and turn counter
    var lifeYou = document.querySelector('#life-you') || document.querySelector('[id="life-you"]');
    var lifeYouInput = document.querySelector('#life-you, .input-group input[type="text"]');
    // Find the cloned inputs inside input-groups
    document.querySelectorAll('.input-group input').forEach(function(input) {
        var label = input.closest('.form-group')?.querySelector('label');
        if (label && label.textContent.includes('You:')) {
            input.value = "20";
        }
        if (label && label.textContent.includes('Opponent:')) {
            input.value = "20";
        }
    });

    document.getElementById("turn-counter").innerHTML = "1";

    await init();
}

function restart() {
    reset();

    // Start over
    shuffleDeck();
    draw(7);

    bindCardActions();
}

/**
 * Save settings to local storage
 */
function saveSettings() {
    localStorage.setItem("mtgGoldfish-settings", JSON.stringify({
        background: document.getElementById("background-url").value,
        useLightlyPlayedCardBackside: document.getElementById("checkbox-card-backside-lightly-played").checked,
    }));

    retrieveSettings();

    bootstrap.Modal.getOrCreateInstance(document.getElementById('settingsModal')).toggle();
}
