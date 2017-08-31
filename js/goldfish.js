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
    setupDragula();

    $(document).mousemove(function (e) {
        window.x = e.pageX;
        window.y = e.pageY;
    });

    bindPlaceholderPopover("#exile-title", "exile", exileList);
    bindPlaceholderPopover("#sideboard-title", "sideboard", sideboardList);
    bindPlaceholderPopover("#library-title", "library", libraryList);
    bindPlaceholderPopover("#graveyard-title", "graveyard", graveyardList);

    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
      })
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
        setupDragula();
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
    $("#handTotal").html($("#hand").children().length);
}

function setupDragula() {
    dragula([document.querySelector('#table'),
    document.querySelector('#hand'),
    document.querySelector('#library'),
    document.querySelector('#library-placeholder'),
    document.querySelector('#graveyard-placeholder'),
    document.querySelector('#exile-placeholder'),
    document.querySelector('#sideboard-placeholder')])
        .on('drop', function (el, target, source) {

            // Cleanup any style properties on the card
            $(el).css("left", "");
            $(el).css("margin-bottom", "");
            $(el).css("position", "");
            $(el).css("top", "");

            if (source.id === 'library-placeholder') {
                el.style.backgroundImage = "url('" + createCardImageSrc(libraryList.splice(0, 1)) + "')";

                if (libraryList.length > 0) {
                    $("#library-placeholder").append(defaultCard("library-placeholder-card"))
                }
            }

            if (source.id === 'table') {
                $(el).css("left", "");
                $(el).css("top", "");
                $(el).css("position", "");
            }

            dragFromZone("#library", el, libraryList, source)
            dragFromZone("#graveyard", el, graveyardList, source)
            dragFromZone("#exile", el, exileList, source)
            dragFromZone("#sideboard", el, sideboardList, source)

            dragFromPlaceholder("#graveyard-placeholder", graveyardList, source);
            dragFromPlaceholder("#exile-placeholder", exileList, source);
            dragFromPlaceholder("#sideboard-placeholder", sideboardList, source);

            dragToPlaceholder("#graveyard-placeholder", el, graveyardList, target);
            dragToPlaceholder("#exile-placeholder", el, exileList, target);
            dragToPlaceholder("#sideboard-placeholder", el, sideboardList, target);

            if (target.id === 'library-placeholder') {
                $("#library-placeholder").empty();
                libraryList.unshift(getMultiverseId(el));
                $("#library-placeholder").append(defaultCard("library-placeholder-card"));
            }

            if (target.id === 'table') {
                $(el).css("left", x);
                $(el).css("top", y - 50);
                $(el).css("position", "absolute");
            }

            // Update Game State
            updateTotals();
            bindCardActions();
        });
}

function dragFromPlaceholder(selector, list, source) {
    if (source.id === selector.substr(1)) {
        list.splice(-1, 1);

        if (list.length > 0) {
            $(selector).append(createCard(list[list.length - 1], ""));
        }
    }
}

function dragToPlaceholder(selector, el, list, target) {
    if (target.id === selector.substr(1)) {
        // Updating game state
        $(selector).empty();
        list.push(getMultiverseId(el));
        $(selector).append(el);
    }
}

function dragFromZone(selector, el, list, source) {
    if (source.id === selector.substr(1)) {
        list.splice(list.indexOf(getMultiverseId(el)), 1);
    }
}