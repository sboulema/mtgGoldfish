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
                    html += createCard(list[index], "position: relative; top: 0px; margin-bottom: 0px;");
                } else {
                    html += createCard(list[index], "position: relative; top: -130px; margin-bottom: -130px;");
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

    var defaultText = 'Custom counter:';
    
    $('.clickedit').hide()
    .focusout(endEdit)
    .keyup(function (e) {
        if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
            endEdit(e);
            return false;
        } else {
            return true;
        }
    })
    .prev().click(function () {
        $(this).hide();
        $(this).next().show().focus();
    });
}

function endEdit(e) {
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
    $(".mana-pool").mousedown(function (event) {
        var counter = $(this).find(".mana-pool-counter");
        var value = counter.attr('class').match(/\bms-(\d+)\b/)[1]

        if (value === 0 || value === 20) {
            return;
        }

        counter.removeClass("ms-" + value);

        switch (event.which) {
            case 1:
                counter.addClass("ms-" + ++value);
                break;
            case 3:
                counter.addClass("ms-" + --value);
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
        drop: function(event, ui) {
            ui.draggable.detach().appendTo($(this));
        }
    });
    $("#library-placeholder").droppable({
        drop: function(event, ui) {
            $("#library-placeholder").empty();
            libraryList.unshift(getMultiverseId(ui.draggable));
            $("#library-placeholder").append(defaultCard("library-placeholder-card"));
        },
        out: function(event, ui) {
            if (ui.draggable[0].parentElement.id === "library-placeholder") {
                ui.draggable[0].style.backgroundImage = "url('" + createCardImageSrc(libraryList.splice(0, 1)) + "')";
                
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
    $("#hand").empty;
    $("#table").empty;

    // Reset
    $('#life-you').val("20");
    $('#life-opponent').val("20");
    $("#turn-counter").html("1");

    // Start over
    draw(7);
}