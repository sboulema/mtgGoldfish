function defaultCard() {
    var div = document.createElement('div');
    div.className = 'mtg-card';
    div.style.backgroundImage = "url('img/card-backside-mint.jpg')";
    return div;
}

function createCard(card) {
    var cardDiv = document.createElement('div');
    cardDiv.className = 'mtg-card';
    if (card.layout) cardDiv.classList.add(card.layout);
    if (card.goldfishId) cardDiv.setAttribute('data-goldfishid', card.goldfishId);
    if (card.layout) cardDiv.setAttribute('data-layout', card.layout);

    var front = document.createElement('div');
    front.className = 'front mtg-card-side';
    front.style.backgroundImage = "url(" + (typeof card.backgroundImage !== 'undefined' ? card.backgroundImage : card.imageUrl) + ")";
    cardDiv.appendChild(front);

    if (isMobileBrowser) {
        var handle = document.createElement('div');
        handle.className = 'handle';
        cardDiv.appendChild(handle);
    }

    var back = document.createElement('div');
    back.className = 'back mtg-card-side';
    back.style.backgroundImage = "url('" + card.imageUrlBack + "')";
    cardDiv.appendChild(back);

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
 * @param {HTMLElement} htmlElement
 * @returns card object
 */
const getCardObject = (htmlElement) =>
    deck.find((card) => card.goldfishId == htmlElement.dataset.goldfishid);

/**
 * Check if the HTML element has been flipped
 * @param {HTMLElement} domNode
 * @returns boolean
 */
const isFlipped = (domNode) =>
    domNode.classList.contains('flipped');

function getGoldfishId(el) {
    return el.dataset.goldfishid;
}

/**
 * Get the high quality preview image of the current shown card face
 * @param {HTMLElement} domNode
 * @returns string
 */
const getPreviewImageUrl = (domNode) =>
    isFlipped(domNode) ? getCardObject(domNode).imageBackPreviewUrl : getCardObject(domNode).imageFrontPreviewUrl;

/**
 * Flip a card element
 * @param {HTMLElement} el - Card element
 * @param {boolean|undefined} state - true=flip to back, false=flip to front, undefined=toggle
 */
function flipCard(el, state) {
    if (typeof state === 'undefined') {
        el.classList.toggle('flipped');
    } else if (state) {
        el.classList.add('flipped');
    } else {
        el.classList.remove('flipped');
    }
}

// Global drag state
var currentDragElement = null;
var dragOffsetX = 0;
var dragOffsetY = 0;

function handleDragStart(e) {
    currentDragElement = this;
    var rect = this.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    this.style.opacity = '0.5';
}

function handleDragEnd(e) {
    this.style.opacity = '';
    currentDragElement = null;
}

function bindCardActions() {
    document.querySelectorAll('.mtg-card:not([data-initialized])').forEach(function(card) {
        card.setAttribute('data-initialized', 'true');

        // Make draggable
        card.draggable = true;
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);

        // Large preview popover
        if (card.dataset.goldfishid) {
            var existingPopover = bootstrap.Popover.getInstance(card);
            if (existingPopover) existingPopover.dispose();

            new bootstrap.Popover(card, {
                html: true,
                trigger: 'hover',
                content: function() {
                    var cardObj = getCardObject(card);
                    if (!cardObj) return '';
                    if (!isDoubleFaced(cardObj.layout) && isFlipped(card)) return '';
                    return '<img width="223" height="310" src="' + getPreviewImageUrl(card) + '" />';
                }
            });
        }
    });
}

/**
 * Tap/Rotate a card
 * @param {HTMLElement} domNode
 * @param {number} [degree] - Degrees to rotate, if unspecified rotation will be toggled between 0 and 90
 */
const tap = (domNode, degree) => {
    degree ??= domNode.style.transform.includes("90") ? 0 : 90;

    domNode.style.transition = "transform 0.5s";
    domNode.style.transform = "rotate(" + degree + "deg)";
}

/**
 * Untap/Rotate all cards on the table
 */
function untapAll() {
    document.querySelectorAll('#table .mtg-card[style*="transform: rotate(90deg)"]').forEach(function(card) {
        tap(card, 0);
    });
}

function flip(selector) {
    var el = (typeof selector === 'string') ? document.querySelector(selector) : selector;
    flipCard(el);
}

function flipHand() {
    Array.from(document.getElementById('hand-placeholder').children).forEach(function(child) {
        flipCard(child);
    });
}

function shuffleHand() {
    var handEl = document.getElementById('hand-placeholder');
    var cards = Array.from(handEl.children);
    window.knuthShuffle(cards);
    cards.forEach(function(card) { handEl.appendChild(card); });
}

function addCounter(card) {
    if (typeof card === 'undefined') {
        return;
    }

    var face = card.querySelector(isFlipped(card) ? ".back" : ".front");

    var label = document.createElement('label');
    label.className = 'ms ms-e ms-3x counter';

    var input = document.createElement('input');
    input.className = 'form-control counter-input';
    input.type = 'text';
    input.style.display = 'none';

    face.appendChild(label);
    face.appendChild(input);

    // Disable context menu
    card.addEventListener("contextmenu", function(e) { e.preventDefault(); return false; });

    // Clicking a counter should show the input field
    label.addEventListener("click", function(event) {
        event.stopImmediatePropagation();
        input.style.display = '';
        input.focus();
    });

    // Upon ending entering text into the counter edit field we should update the counter icon
    function handleCounterInput(event) {
        event.stopImmediatePropagation();
        if (event.key !== "Enter") return;
        label.className = 'ms ms-counter-' + input.value + ' ms-3x counter';
        input.style.display = 'none';
    }
    input.addEventListener("keypress", handleCounterInput);
    input.addEventListener("focusout", handleCounterInput);

    // Make counter draggable
    label.draggable = true;
    label.addEventListener('dragstart', function(e) {
        currentDragElement = label;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
    });

    // Delete counter on right click
    label.addEventListener("mousedown", function(event) {
        if (event.which === 3) {
            label.remove();
            input.remove();
        }
    });
}

function markCard(card) {
    var goldfishId = card.dataset.goldfishid;
    var index = markedList.indexOf(goldfishId);

    if (index > -1) {
        markedList.splice(index, 1);
    } else {
        markedList.push(goldfishId);
    }

    card.classList.toggle("marked");
}

function markAllCards() {
    markedList.forEach(function(goldfishId) {
        var el = document.querySelector(".mtg-card[data-goldfishid='" + goldfishId + "']");
        if (el) el.classList.toggle("marked");
    });
}

function createGoldfishId() {
    var id = Date.now() + Math.random();
    return id.toString();
}
