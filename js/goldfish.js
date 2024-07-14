var libraryList = [];
var graveyardList = [];
var exileList = [];
var sideboardList = [];
var handList = [];

var deck = [];
var sideboard = [];

var markedList = [];

var settings = {};

$(function() {
    init();
});

async function init() {
    bindCardActions();
    setupLifeCounters();
    setupManaPoolCounters();
    setupCustomCounters();
    setupTurnButton();

    setupDragDrop();

    bindZoneModal("#exile-title", "Exile");
    bindZoneModal("#sideboard-title", "Sideboard");
    bindZoneModal("#library-title", "Library");
    bindZoneModal("#graveyard-title", "Graveyard");
    bindZoneModal("#hand-title", "Hand");

    $(document).off("keypress").on("keypress", function(event) {
        switch (event.which) {
            case 98: // b
                putCardOnLibrary($(".mtg-card:hover")[0], true);
                break;
            case 99: // c
                addCounter($(".mtg-card:hover")[0]);
                break;
            case 100: // d
                draw(1);
                break;
            case 101: // e
                putCardinPlaceholder($(".mtg-card:hover"), "#exile-placeholder", exileList);
                break;
            case 102: // f
                flip($(".mtg-card:hover")[0]);
                break;
            case 103: // g
                putCardinPlaceholder($(".mtg-card:hover"), "#graveyard-placeholder", graveyardList);
                break;
            case 108: // l
                putCardOnLibrary($(".mtg-card:hover")[0]);
                break;
            case 109: // m
                markCard($(".mtg-card:hover")[0]);
                break;
            case 116: // t
                tap($(".mtg-card:hover")[0]);
                break;
        }
    });

    $(document).on('shown.bs.modal', function(event) {
        $('input:visible:enabled:first', event.target).trigger("focus");
        $('textarea:visible:enabled:first', event.target).trigger("focus");
    });

    retrieveSettings();

    // Load deck based on url param
    var url = new URL(window.location);
    var params = new URLSearchParams(url.search.slice(1));

    if (params.has('mtgstocksdeckid')) {
        $('#deckModal').modal('show');

        await importMtgStocksDeck(params.get('mtgstocksdeckid'));

        await loadDeck();

        $('#deckModal').modal('hide');
    }

    if (params.has("mtggoldfishdeckid")) {
        $('#deckModal').modal('show');

        await importMtgGolfdishDeck(params.get('mtggoldfishdeckid'));

        await loadDeck();

        $('#deckModal').modal('hide');
    }
    
    setupTokens();
}

function retrieveSettings() {
    settings = JSON.parse(localStorage.getItem("mtgGoldfish-settings"));

    var backgroundUrl = settings.background;

    if (backgroundUrl === null ||
        backgroundUrl === "")
    {
        $("body").css("background-image", "url('../img/playmat.jpg')");
    } else {
        $("body").css("background-image", `url('${backgroundUrl}')`);
        $("#background-url").val(backgroundUrl);
    }

    $("#checkbox-card-backside-lightly-played").prop("checked", settings.useLightlyPlayedCardBackside);
}

function bindZoneModal(selector, id) {
    $(selector).on("click", function() {
        $('#zoneModal .row').empty();

        // Set title of the modal to the zone title
        document.querySelector("#zoneModal .modal-title").textContent = id;

        // Show every card in the zone list
        GetListById(id).forEach((card) => $("#zoneModal .row").append(createCard(card)));

        setupDroppableZoneModal("#zoneModal .row", id);
        bindCardActions();
        markAllCards();
    });
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
    if($('#life-you')[0].style.textAlign !== "center") {
        $('#life-you').bootstrapNumber({
            upClass: 'success',
            downClass: 'danger'
        });
    }

    if($('#life-opponent')[0].style.textAlign !== "center") {
        $('#life-opponent').bootstrapNumber({
            upClass: 'success',
            downClass: 'danger'
        });
    }
}

function setupCustomCounters() {
    if($('#custom-counter')[0].style.textAlign !== "center") {
        $('#custom-counter').bootstrapNumber({
            upClass: 'success',
            downClass: 'danger'
        });
    }

    setupEditable();
}

function setupEditable() {
    $('.clickedit').hide()
    .focusout(endEdit)
    .keyup(function (e) {
        var defaultText = 'Custom counter:';
        if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
            endEdit(e, defaultText);
            return false;
        } else {
            return true;
        }
    })
    .prev().click(function (event) {
        $(this).hide();
        $(this).next().show().focus();
    });
}

function endEdit(e, defaultText) {
    var input = $(e.target),
        label = input && input.prev();

    label.text(input.val() === '' ? defaultText : input.val());
    input.hide();
    label.show();
}

function setupTurnButton() {
    $("#btn-next-turn")
        .off("click")
        .on("click", function() {
            $("#turn-counter").html(parseInt($("#turn-counter").html()) + 1);
            draw(1);
            untapAll();
        });
}

async function startLoadDeck() {
    $("#btn-load-deck-spinner").removeClass("d-none");
    $("#btn-load-deck-text").text("Loading...");

    reset();

    var success = await loadDeck();

    $("#btn-load-deck-spinner").addClass("d-none");
    $("#btn-load-deck-text").text("Load");

    flip($("#library-placeholder .mtg-card")[0]);

    if (success) {
        $('#deckModal').modal('hide');
    }
}

function setupManaPoolCounters() {
    // Disable context menu
	$('body').on('contextmenu', '.mana-pool', function() {
        return false;
    });
	
    $(".mana-pool")
        .off("mousedown")
        .on("mousedown", function (event) {
            var counter = $(this).find(".mana-pool-counter");
            var value = parseInt(counter.attr('class').match(/\bms-(\d+)\b/)[1]);

            counter.removeClass("ms-" + value);

            switch (event.which) {
                case 1: // Right button
                    value++;
                    if (value >= 20) {
                        value = 20;
                    }
                    counter.addClass("ms-" + value);
                    break;
                case 3: // Left button
                    value--;
                    if (value <= 0) {
                        value = 0;
                    }
                    counter.addClass("ms-" + value);
                    break;
                default:
                    break;
            }
        });
}

/**
 * Update number of cards in each zone
 */
function updateTotals() {
    $("#libraryTotal").html(libraryList.length);
    $("#graveyardTotal").html(graveyardList.length);
    $("#exileTotal").html(exileList.length);
    $("#sideboardTotal").html(sideboardList.length);
    $("#handTotal").html(handList.length);
}

function setupDragDrop() {
    $("#table").droppable({
        accept: ".mtg-card",
        drop: function(_, ui) {
            ui.draggable.detach()
                .css('left', ui.offset.left)
                .css('top', ui.offset.top - 60)
                .css('position', "absolute")
                .css("margin-bottom", "")
                .appendTo($(this));
        },
        out: function(_, ui) {
            ui.draggable
                .css('left', "")
                .css('top', "")
                .css('position', "")
                .css("margin-bottom", "")
                .css("transform", "")
        }
    });
    
    $("#hand-placeholder").droppable({
        accept: ".mtg-card",
        drop: function(_, ui) {
            putCardinHand(ui.draggable);
        },
        out: function(_, ui) {
            var goldfishId = getGoldfishId(ui.draggable);
            var index = handList.findIndex((card) => card.goldfishid === goldfishId);
            handList.splice(index, 1);

            updateTotals();
        }
    });

    $("#library-placeholder").droppable({
        accept: ".mtg-card",
        drop: function(_, ui) {
            putCardOnLibrary(ui.draggable[0]);
        },
        out: function(_, ui) {
            // Remove card from the Library list
            libraryList.splice(0, 1);

            // Flip card to the front side
            $(ui.draggable[0]).flip(false);

            // If there are still cards in the library, show a new top card
            if (libraryList.length > 0) {
                $("#library-placeholder").html(createCard(libraryList[0]));

                // Flip card to the back side
                $("#library-placeholder .mtg-card").flip({trigger: "manual"});
                $("#library-placeholder .mtg-card").flip(true);
                
                setupClickToDraw();
            }
        }
    });

    setupDroppablePlaceholder("#graveyard-placeholder", graveyardList);
    setupDroppablePlaceholder("#exile-placeholder", exileList);
    setupDroppablePlaceholder("#sideboard-placeholder", sideboardList);
}

function setupDroppablePlaceholder(selector, list) {
    $(selector).droppable({
        accept: ".mtg-card",
        drop: function(_, ui) {
            $('.popover').popover('hide');

            if(!$(ui.draggable).hasClass("token")) {
                putCardinPlaceholder(ui.draggable, selector, list);
            } else {
                $(ui.draggable).remove();
            }
        },
        out: function(_, ui) {
            list.splice(-1, 1);
                
            if (list.length > 0) {
                $(selector).append(createCard(list[list.length - 1]));
            }
        }
    });   
}

function setupDroppableZoneModal(selector, id) {
    $(selector).droppable({
        accept: ".mtg-card",
        drop: function(_, ui) {
            
        },
        out: function(_, ui) {
            var list = GetListById(id);

            // Remove card from card list
            var goldfishId = getGoldfishId(ui.draggable);
            var index = list.findIndex((card) => card.goldfishId === goldfishId);
            list.splice(index, 1);

            // Update number of cards in each zone
            updateTotals();
        }
    });  
}

function reset() {
    // Clear all
    exileList.length = 0;
    graveyardList.length = 0;
    markedList.length = 0;
    handList.length = 0;
    libraryList = deck.slice();
    sideboardList = sideboard.slice();
    $(".card-placeholder").empty();
    $("#table").empty();
    $("hand-placeholder").empty();

    // Reset
    if (sideboardList.length > 0) {
        $("#sideboard-placeholder").html(defaultCard());
    }
    if (libraryList.length > 0) {
        $("#library-placeholder").html(createCard(libraryList[0]));
    }
    $('#life-you').val("20");
    $('#life-opponent').val("20");
    $("#turn-counter").html("1");

    init();
}

function restart() {
    reset();

    // Start over
    shuffleDeck();
    draw(7);

    bindCardActions();
}

function saveSettings() {
    localStorage.setItem("mtgGoldfish-settings", JSON.stringify({
        background: $("#background-url").val(),
        useLightlyPlayedCardBackside: $("#checkbox-card-backside-lightly-played").is(":checked"),
    }))

    retrieveSettings();

    $('#settingsModal').modal('toggle');
}