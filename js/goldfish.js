var libraryList = [];
var graveyardList = [];
var exileList = [];
var sideboardList = [];

var deck = [];
var sideboard = [];

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

    $("body").keypress(function(e) {
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
            putCardOnLibrary($(".mtg-card:hover")[0])
        }
        if (e.keyCode == 98) { // b
            putCardOnLibrary($(".mtg-card:hover")[0], true)
        }
        e.preventDefault();
    });

    $(document).on('shown.bs.modal', function(e) {
        $('input:visible:enabled:first', e.target).focus();
        $('textarea:visible:enabled:first', e.target).focus();
    });

    retrieveSettings();
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
            var html = "<div id='" + id + "' style='max-height: 600px; width: 125px;'>";
            for (var index = 0; index < list.length; index++) {
                if (index === 0) {
                    html += createCard(list[index], "position: relative; top: 0px; margin-bottom: 0px;")[0].outerHTML;
                } else {
                    html += createCard(list[index], "position: relative; top: -130px; margin-bottom: -130px;")[0].outerHTML;
                }
            }
            return html += "</div>";
        }
    });

    $(selector).on('shown.bs.popover', function () {
        bindCardActions();
    });
}

function setupLifeCounters() {
    $('#life-you').bootstrapNumber({
        upClass: 'success',
        downClass: 'danger'
    });
    $('#life-opponent').bootstrapNumber({
        upClass: 'success',
        downClass: 'danger'
    });
}

function setupCustomCounters() {
    $('#custom-counter').bootstrapNumber({
        upClass: 'success',
        downClass: 'danger'
    });

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
    $("#btn-next-turn").click(function (event) {
        $("#turn-counter").html(parseInt($("#turn-counter").html()) + 1);
        untapAll();
        draw(1);
    });
}

function setupManaPoolCounters() {
	$('body').on('contextmenu', '.mana-pool', function(e){ return false; });
	
    $(".mana-pool").mousedown(function (event) {
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
    $("#hand").droppable({
        accept: ".mtg-card",
        drop: function(event, ui) {
            ui.draggable.detach().appendTo($(this));
        }
    });
    $("#library-placeholder").droppable({
        accept: ".mtg-card",
        drop: function(event, ui) {
            putCardOnLibrary(ui.draggable[0]);
        },
        out: function(event, ui) {
            if (ui.draggable[0].parentElement.id === "library-placeholder") {
                var multiverseId = libraryList.splice(0, 1);
                ui.draggable[0].style.backgroundImage = "url('" + createCardImageSrc(multiverseId) + "')";
                $(ui.draggable[0]).data("multiverseId", multiverseId);

                if (libraryList.length > 0) {
                    $("#library-placeholder").append(defaultCard("library-placeholder-card"))
                }
            }
        }
    });

    setupDroppablePlaceholder("#graveyard-placeholder", graveyardList);
    setupDroppablePlaceholder("#exile-placeholder", exileList);
    setupDroppablePlaceholder("#sideboard-placeholder", sideboardList);

    setupDroppableZones("#library", libraryList);
    setupDroppableZones("#graveyard", graveyardList);
    setupDroppableZones("#exile", exileList);
    setupDroppableZones("#sideboard", sideboardList);
}

function setupDroppablePlaceholder(selector, list) {
    $(selector).droppable({
        accept: ".mtg-card",
        drop: function(event, ui) {
            if ($(selector).children().length != 0) {
                $($(selector).children()[0]).popover('hide')
            }
            
            $(selector).empty();        

            ui.draggable.detach().appendTo($(this));

            list.push(getMultiverseId(ui.draggable));
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

function setupDroppableZones(selector, list) {
    $(selector).droppable({
        accept: ".mtg-card",
        out: function(event, ui) {
            list.splice(list.indexOf(getMultiverseId(ui.draggable)), 1);
        }
    });  
}

function restart() {
    // Clear all
    exileList = [];
    graveyardList = [];
    libraryList = deck.slice();
    sideboardList = sideboard.slice();
    $(".card-placeholder").empty();
    $("#table").empty();

    // Reset
    $('#life-you').val("20");
    $('#life-opponent').val("20");
    $("#turn-counter").html("1");

    // Start over
    $("#library-placeholder").html(defaultCard("library-placeholder-card"));
    shuffleDeck();
    draw(7);

    bindCardActions();
}

function saveSettings() {
    localStorage.setItem("background", $("#background-url").val());

    retrieveSettings();

    $('#settingsModal').modal('toggle');
}