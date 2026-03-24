window.addEventListener('beforeunload', function(e) {
    return 'By leaving this page you will lose the data you have entered here.';
});

document.addEventListener('DOMContentLoaded', function() {
    if (isMobileBrowser) {
        document.querySelectorAll(".life-counter").forEach(function(el) {
            el.disabled = true;
        });
    }
});
