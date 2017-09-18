var libraryList = [];
var graveyardList = [];
var exileList = [];
var sideboardList = [];
var handList = [];

var deck = [];
var sideboard = [];

var markedList = [];

$(document).ready(function(){
    init();
});

function init() {
    bindCardActions();
    setupLifeCounters();
    setupManaPoolCounters();
    setupCustomCounters();
    setupTurnButton();

    setupDragDrop();

    bindPlaceholderPopover("#exile-title", "exile", exileList);
    bindPlaceholderPopover("#sideboard-title", "sideboard", sideboardList);
    bindPlaceholderPopover("#library-title", "library", libraryList);
    bindPlaceholderPopover("#graveyard-title", "graveyard", graveyardList);
    bindPlaceholderPopover("#hand-title", "hand", handList);

    $("body").unbind('keypress').keypress(function(e) {
        if (e.keyCode == 102) { // f   
            flip($(".mtg-card:hover")[0]);          
        }
        if (e.keyCode == 99) { // c   
            addCounter($(".mtg-card:hover")[0]);
        }
        if (e.keyCode == 116) { // t   
            tap($(".mtg-card:hover")[0]);
        }
        if (e.keyCode == 100) { // d 
            draw(1);
        }
        if (e.keyCode == 108) { // l 
            putCardOnLibrary($(".mtg-card:hover")[0]);
        }
        if (e.keyCode == 98) { // b
            putCardOnLibrary($(".mtg-card:hover")[0], true);
        }
        if (e.keyCode == 103) { // g
            putCardinPlaceholder($(".mtg-card:hover"), "#graveyard-placeholder", graveyardList);
        }
        if (e.keyCode == 101) { // e
            putCardinPlaceholder($(".mtg-card:hover"), "#exile-placeholder", exileList);
        }
        if (e.keyCode == 109) { // m
            markCard($(".mtg-card:hover")[0]);
        }
    });

    $(document).on('shown.bs.modal', function(e) {
        $('input:visible:enabled:first', e.target).focus();
        $('textarea:visible:enabled:first', e.target).focus();
    });

    retrieveSettings();

    // Load deck based on url param
    var url = new URL(window.location);  
    var params = new URLSearchParams(url.search.slice(1));
    if (params.has('mtgstocksdeckid')) {
        $('#loadingModal').modal('show');
        importMtgStocksDeck(params.get('mtgstocksdeckid')).done(function() {
            loadDeck().done(function () {
                $('#loadingModal').modal('hide');
            });           
        });        
    }
    if (params.has("mtggoldfishdeckid")) {
        $('#loadingModal').modal('show');     
        importMtgGolfdishDeck(params.get('mtggoldfishdeckid')).done(function() {
            loadDeck().done(function () {
                $('#loadingModal').modal('hide');
            });           
        });   
    }
    
    setupTokens();
}

function retrieveSettings() {
    var backgroundUrl = localStorage.getItem("background");
    if (backgroundUrl === null || backgroundUrl === "") {
        $("#table").css("background-image", "url('http://i.imgur.com/1UjtE9j.jpg')");
    } else {
        $("#table").css("background-image", "url('" + backgroundUrl + "')");
        $("#background-url").val(backgroundUrl);
    } 
}

function bindPlaceholderPopover(selector, id, list) {
    $(selector).popover({
        html: true,
        trigger: 'click',
        placement: 'top',
        content: function () {
            var cardList = $('<div/>')
                .attr('id', id)
                .css("max-height", "600px")
                .css("width", "125px");

            var list;

            switch (id) {
                case "library":
                    list = libraryList;
                    break;
                case "graveyard":
                    list = graveyardList;
                    break;  
                case "exile":
                    list = exileList;
                    break;
                case "sideboard":
                    list = sideboardList;
                    break;   
                case "hand":
                    list = handList;
                    break;            
                default:
                    break;
            }

            for (var index = 0; index < list.length; index++) {
                if (index === 0) {
                    cardList.append(createCard(list[index], "position: relative; top: 0px; margin-bottom: 0px;"));
                } else {
                    cardList.append(createCard(list[index], "position: relative; top: -130px; margin-bottom: -130px;"))
                }
            }
            return cardList[0].outerHTML;
        }
    });

    $(selector).unbind('shown.bs.popover').on('shown.bs.popover', function () {
        setupDroppableZone(selector.slice(0, -6), list);
        bindCardActions();
        markAllCards();
    });
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
    $("#btn-next-turn").unbind("click").click(function (event) {
        $("#turn-counter").html(parseInt($("#turn-counter").html()) + 1);     
        draw(1);
        untapAll();
    });
}

function startLoadDeck() {
    $('#loadingModal').modal('show');
    reset();
    loadDeck().done(function() {
        $('#loadingModal').modal('hide');
    });
}

function setupManaPoolCounters() {
	$('body').on('contextmenu', '.mana-pool', function(e){ return false; });
	
    $(".mana-pool").unbind("mousedown").mousedown(function (event) {
        var counter = $(this).find(".mana-pool-counter");
        var value = parseInt(counter.attr('class').match(/\bms-(\d+)\b/)[1]);

        counter.removeClass("ms-" + value);
		
        switch (event.which) {
            case 1:
				value++;
				if (value >= 20) value = 20;
                counter.addClass("ms-" + value);
                break;
            case 3:
				value--;
				if (value <= 0) value = 0;
                counter.addClass("ms-" + value);
                break;
            default:
                break;
        }
    });
}

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
        drop: function(event, ui) {
            ui.draggable.detach()
                .css('left', ui.offset.left)
                .css('top', ui.offset.top - 60)
                .css('position', "absolute")
                .css("margin-bottom", "")
                .appendTo($(this));
        },
        out: function(event, ui) {
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
        drop: function(event, ui) {
            putCardinHand(ui.draggable);
        },
        out: function(event, ui) {
            var needle = getGoldfishId(ui.draggable);
            var index = handList.findIndex(function(element) { 
                return element.goldfishId === needle;
            });
            handList.splice(index, 1);

            updateTotals();
        }
    });
    $("#library-placeholder").droppable({
        accept: ".mtg-card",
        drop: function(event, ui) {
            putCardOnLibrary(ui.draggable);
        },
        out: function(event, ui) {
            if (ui.draggable[0].parentElement.id === "library-placeholder") {
                var card = libraryList.splice(0, 1)[0];

                $(ui.draggable[0])
                    .html(createCard(card)[0].innerHTML)
                    .removeClass("library-placeholder-card")
                    .removeData("flip-model")
                    .css("background-image", "")
                    .attr("data-goldfishid", card.goldfishId)
                    .attr("data-layout", card.layout)
                    .flip({trigger:"manual"})
                    .unbind("click");

                if (libraryList.length > 0) {
                    $("#library-placeholder").append(defaultCard("library-placeholder-card"))
                    setupClickToDraw();
                }
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
        drop: function(event, ui) {
            $('.popover').popover('hide');

            if(!$(ui.draggable).hasClass("token")) {
                putCardinPlaceholder(ui.draggable, selector, list);
            } else {
                $(ui.draggable).remove();
            }
        },
        out: function(event, ui) {
            if (ui.draggable[0].parentElement.id === selector.substr(1)) {
                list.splice(-1, 1);
                
                if (list.length > 0) {
                    $(selector).append(createCard(list[list.length - 1], ""));
                }
            }
        }
    });   
}

function setupDroppableZone(selector, list) {
    $(selector).droppable({
        accept: ".mtg-card",
        out: function(event, ui) {
            var needle = getGoldfishId(ui.draggable);
            var index = list.findIndex(function(element) { 
                return element.goldfishId === needle;
            });
            list.splice(index, 1);

            $(selector + "-placeholder").empty();
            if (list.length === 0) {               
                $('.popover').popover('hide');
            } else {
                $(selector + "-placeholder").append(createCard(list[list.length - 1], ""));
            }
        }
    });  
}

function reset() {
    // Clear all
    exileList.length = 0;
    graveyardList.length = 0;
    markedList.length = 0;
    libraryList = deck.slice();
    sideboardList = sideboard.slice();
    $(".card-placeholder").empty();
    $("#table").empty();

    // Reset
    if (sideboardList.length > 0) {
        $("#sideboard-placeholder").html(defaultCard());
    }
    if (libraryList.length > 0) {
        $("#library-placeholder").html(defaultCard("library-placeholder-card"));
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
    localStorage.setItem("background", $("#background-url").val());

    retrieveSettings();

    $('#settingsModal').modal('toggle');
}