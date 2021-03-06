var ModuleDefinition;
(function (ModuleDefinition) {
    var LocalStorage = (function () {
        function LocalStorage() {
            var _this = this;
            this._LSPrefix = "SGPP_";
            this.containsItem = function (key) {
                return localStorage.getItem(_this._LSPrefix + key) != null;
            };
            this.getItem = function (key, defaultValue) {
                return JSON.parse(localStorage.getItem(_this._LSPrefix + key) || null) || defaultValue;
            };
            this.setItem = function (key, value) {
                localStorage.setItem(_this._LSPrefix + key, JSON.stringify(value));
            };
            this.clear = function () {
                SGPP.log("Removing all SGPP entries from LocalStorage.");
                Object.keys(localStorage).forEach(function (key) {
                    if (key.indexOf(_this._LSPrefix) == 0) {
                        localStorage.removeItem(key);
                    }
                });
            };
        }
        return LocalStorage;
    })();
    ModuleDefinition.LocalStorage = LocalStorage;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var Core = (function () {
        function Core() {
            var _this = this;
            this._debug = true;
            this._settings = new ModuleDefinition.Settings();
            this._storage = new ModuleDefinition.LocalStorage();
            this.modules = {};
            this.log = function (msg) {
                if (_this._debug)
                    console.log("[" + new Date() + "] SGPP - " + msg);
            };
            this.appendCSS = function (css) {
                _this._styleSheet.append(css);
            };
            this.on = function (moduleName, event, callback) {
                if (typeof moduleName === 'string') {
                    _this.addOnCallbackHelper(moduleName, event, callback);
                }
                else {
                    for (var pos in moduleName) {
                        _this.addOnCallbackHelper(moduleName[pos], event, callback);
                    }
                }
            };
            this.style = "";
            this.init = function () {
                _this.log("Steamgifts++ plugin started.");
                var userUrl = $('.nav__button-container a[href^="/user/"]');
                if (userUrl.length)
                    _this._currentUser = userUrl.attr('href').substr("/user/".length);
                _this.resolvePath();
                _this._settings.init(_this._storage);
                _this._styleSheet = $(document.createElement('style')).attr('id', 'SGPP_StyleSheet').appendTo('head');
                _this.appendCSS('/* SGPP Stylesheet */ ');
                _this.appendCSS(_this._settings.style);
            };
            this.resolvePath = function () {
                var hash = "";
                var pageKind = "";
                var code = "";
                var description = "";
                var subpage = "";
                var windowLocation = window.location;
                if (windowLocation.hash.length > 1)
                    hash = windowLocation.hash.substring(1);
                if (windowLocation.pathname == '/') {
                    pageKind = "giveaways";
                }
                else {
                    var split = windowLocation.pathname.split("/").filter(function (a, b, c) {
                        return Boolean(a);
                    });
                    pageKind = split[0] || '';
                    description = split[2] || '';
                    if (split[0] == 'giveaway' || split[0] == 'trade' || split[0] == 'discussion' || split[0] == 'user' || split[0] == 'group') {
                        subpage = (split[3] == 'search' ? '' : split[3]) || '';
                        code = split[1] || '';
                    }
                    else {
                        subpage = split[1] || '';
                    }
                }
                var match, pl = /\+/g, search = /([^&=]+)=?([^&]*)/g, decode = function (s) {
                    return decodeURIComponent(s.replace(pl, " "));
                }, query = windowLocation.search.substring(1);
                var urlParams = {};
                while (match = search.exec(query)) {
                    urlParams[decode(match[1])] = decode(match[2]);
                }
                _this._sgLocation = {
                    pageKind: pageKind,
                    code: code,
                    description: description,
                    subpage: subpage,
                    hash: hash,
                    parameters: urlParams
                };
            };
            this.init();
        }
        Object.defineProperty(Core.prototype, "user", {
            get: function () {
                return this._currentUser;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Core.prototype, "settings", {
            get: function () {
                return this._settings;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Core.prototype, "location", {
            get: function () {
                return this._sgLocation;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Core.prototype, "storage", {
            get: function () {
                return this._storage;
            },
            enumerable: true,
            configurable: true
        });
        Core.prototype.addOnCallbackHelper = function (moduleName, event, callback) {
            if (moduleName in SGPP.modules) {
                SGPP.log("Handler attached on " + moduleName + " (" + event + ")");
                $(SGPP.modules[moduleName]).on(event, callback);
            }
        };
        Core.prototype.name = function () {
            return "Core";
        };
        Core.prototype.shouldRun = function (location) {
            return true;
        };
        Core.prototype.render = function () {
            this._settings.render();
        };
        return Core;
    })();
    ModuleDefinition.Core = Core;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var CommentAndEnter = (function () {
        function CommentAndEnter() {
            this.shouldRun = function (location) { return location.pageKind == 'giveaway' && location.subpage == ''; };
            this.style = "div.SGPP_CommAndEnter {margin: 0 0 0 5px}\n";
            this.init = function () {
            };
            this.render = function () {
                var enterGa = $('.sidebar .sidebar__entry-insert');
                if (enterGa.length === 0)
                    return;
                var leaveGa = $('.sidebar .sidebar__entry-delete');
                var loadGa = $('.sidebar .sidebar__entry-loading');
                var submitBtn = $('.js__submit-form');
                var commLoading = loadGa.clone().addClass('SGPP_CommAndEnter').insertAfter(submitBtn);
                var commAndEnter = enterGa.clone().addClass('SGPP_CommAndEnter').text('Submit + Enter').insertAfter(submitBtn);
                var observer = new MutationObserver(function (mutations) {
                    commAndEnter.toggleClass('is-hidden', enterGa.hasClass('is-hidden'));
                    commLoading.toggleClass('is-hidden', loadGa.hasClass('is-hidden'));
                });
                var observerOptions = { attributes: true, attributeFilter: ['class'] };
                observer.observe(enterGa[0], observerOptions);
                observer.observe(loadGa[0], observerOptions);
                commAndEnter.click(function (e) {
                    enterGa.click();
                    $('textarea.description').prop('disabled', true);
                    var observer = new MutationObserver(function (mutations) {
                        if (!leaveGa.hasClass('is-hidden')) {
                            submitBtn.closest("input[name=do]").val("comment_new");
                            submitBtn.closest("form").submit();
                        }
                    });
                    observer.observe(leaveGa[0], observerOptions);
                });
            };
        }
        CommentAndEnter.prototype.name = function () {
            return "Comment and Enter on Giveaways";
        };
        return CommentAndEnter;
    })();
    ModuleDefinition.CommentAndEnter = CommentAndEnter;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var EntryCommenters = (function () {
        function EntryCommenters() {
            var _this = this;
            this.url = 'http://www.steamgifts.com/giveaway/';
            this.cacheCompleted = false;
            this.isLoading = false;
            this.commenters = {};
            this.pageStart = 1337;
            this.style = ".SGPP_EntryComm {margin: 0 10px}\n" + ".SGPP_EntryComm > i {margin: 0}\n" + ".SGPP_EntryComm:not(.loading) > .fa-spin {display: none}\n" + ".SGPP_EntryComm.loading > .fa-comments-o {display: none}\n" + ".SGPP_EntryComm.active > .fa-comments-o {opacity: 0.7}\n" + ".SGPP_EntryComm:hover > .fa-comments-o {opacity: 1}\n" + "span.SGPP_EntryComm_comment {vertical-align: inherit; text-shadow: none}\n" + ".SGPP_EntryComm_disabled .SGPP_EntryComm_comment {visibility: hidden}\n" + ".SGPP_EntryComm_comment > i.fa.fa-check, .SGPP_EntryComm_comment > i.fa.fa-times {font-size: 0.7em}\n" + ".SGPP_EntryComm_comment > i.fa.fa-check {color: #719A47}\n" + ".SGPP_EntryComm_comment > i.fa.fa-times {color: rgba(166, 93, 92, 0.85)}\n" + '';
            this.render = function () {
                _this.button.appendTo('.page__heading__breadcrumbs').one('click', _this.firstRun);
            };
            this.firstRun = function () {
                if (!_this.cacheCompleted) {
                    if (!_this.isLoading) {
                        _this.button.addClass('loading');
                        _this.isLoading = true;
                        _this.getCommenters();
                    }
                    setTimeout(_this.firstRun, 1000);
                    return;
                }
                _this.button.removeClass('loading');
                $('.table__rows .table__column--width-fill > a').each(_this.main);
                _this.button.addClass('active');
                _this.button.click(_this.toggleState);
                var observer = new MutationObserver(function (mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                        $('.table__rows').toggleClass('SGPP_EntryComm_disabled', !_this.button.hasClass('active'));
                        $(mutations[i].addedNodes).find('.table__column--width-fill > a').each(_this.main);
                    }
                    ;
                });
                observer.observe($('.table')[0], {
                    childList: true,
                    subtree: true
                });
            };
            this.toggleState = function () {
                _this.button.toggleClass('active');
                $('.table__rows').toggleClass('SGPP_EntryComm_disabled', !_this.button.hasClass('active'));
            };
            this.main = function (i, el) {
                var wrapper = $('p.table__column__heading', el);
                if (wrapper.length > 0)
                    el = wrapper[0];
                if (_this.commenters[el.textContent.trim()]) {
                    _this.elements.pos.clone().appendTo(el);
                }
                else {
                    _this.elements.neg.clone().appendTo(el);
                }
            };
            this.getCommenters = function () {
                _this.url += SGPP.location.code + '/' + SGPP.location.description + '/search?page=';
                _this.page = _this.pageStart;
                _this.getCommentPage();
            };
            this.getCommentPage = function () {
                $.ajax({
                    type: 'GET',
                    url: _this.url + _this.page,
                    success: _this.handleCommentPage
                });
            };
            this.handleCommentPage = function (html) {
                var $html = $(html);
                $('.comments .comment__username', $html).each(function (i, el) {
                    _this.commenters[el.textContent.trim()] = true;
                });
                if (_this.page == _this.pageStart) {
                    var pagination = $('a[data-page-number]', $html);
                    _this.page = pagination.length != 0 ? pagination.last().data().pageNumber : 1;
                }
                if (--_this.page > 0)
                    _this.getCommentPage();
                else
                    _this.cacheCompleted = true;
            };
        }
        EntryCommenters.prototype.init = function () {
            var balloons = $(document.createElement('i')).addClass('giveaway__icon fa fa-comments-o').attr('title', 'Check who commented');
            var spinner = $(document.createElement('i')).addClass('giveaway__icon fa fa-refresh fa-spin').attr('title', 'Loading comments...').css('cursor', 'auto');
            this.button = $(document.createElement('span')).addClass('SGPP_EntryComm').append(balloons, spinner);
            var balloon = $(document.createElement('span')).addClass('SGPP_EntryComm_comment fa-stack').append($(document.createElement('i')).addClass('fa fa-comment-o fa-stack-1x'));
            var pos = $(document.createElement('i')).addClass('fa fa-check fa-stack-1x');
            var neg = $(document.createElement('i')).addClass('fa fa-times fa-stack-1x');
            this.elements = {
                pos: balloon.clone().addClass('positive').attr('title', 'Commented').append(pos),
                neg: balloon.clone().addClass('negative').attr('title', 'Did not comment').append(neg),
            };
        };
        EntryCommenters.prototype.name = function () {
            return "Checks if entries/winners commented on Giveaways";
        };
        EntryCommenters.prototype.shouldRun = function (loc) {
            return loc.pageKind == 'giveaway' && (loc.subpage == 'entries' || loc.subpage == 'winners');
        };
        return EntryCommenters;
    })();
    ModuleDefinition.EntryCommenters = EntryCommenters;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var FixedNavbar = (function () {
        function FixedNavbar() {
            this.style = "body.SPGG_FixedNavbar {padding-top: 39px}\n" + "header.SPGG_FixedNavbar {position: fixed; top: 0px; width: 100%; z-index: 100}\n" + ".comment__summary {margin-top: -44px !important; padding-top: 48px !important;}\n" + ".comment__actions__button {position: relative; z-index: 5;}\n" + ".page__heading__breadcrumbs {z-index: 5;}";
            this.shouldRun = function (location) { return true; };
        }
        FixedNavbar.prototype.init = function () {
        };
        FixedNavbar.prototype.render = function () {
            $('body').addClass('SPGG_FixedNavbar');
            $('header').addClass('SPGG_FixedNavbar');
        };
        FixedNavbar.prototype.name = function () {
            return "Fixed Navbar on top";
        };
        return FixedNavbar;
    })();
    ModuleDefinition.FixedNavbar = FixedNavbar;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var FixedFooter = (function () {
        function FixedFooter() {
            this.style = "body.SGPP_FixedFooter {padding-bottom: 45px}\n" + ".footer__outer-wrap.SGPP_FixedFooter_outerWrap {padding: 15px 0px; z-index: 100; bottom: 0px; position: fixed; width: 100%; background: inherit}\n" + ".footer__inner-wrap.SGPP_FixedFooter_innerWrap {margin: 0px 25px}\n";
            this.shouldRun = function (location) { return true; };
        }
        FixedFooter.prototype.init = function () {
        };
        FixedFooter.prototype.render = function () {
            $('body').addClass('SGPP_FixedFooter');
            $('.footer__outer-wrap').addClass('SGPP_FixedFooter_outerWrap');
            $('.footer__inner-wrap').addClass('SGPP_FixedFooter_innerWrap');
        };
        FixedFooter.prototype.name = function () {
            return "Fixed Footer on bottom";
        };
        return FixedFooter;
    })();
    ModuleDefinition.FixedFooter = FixedFooter;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var GridView = (function () {
        function GridView() {
            var _this = this;
            this.shouldRun = function (location) { return location.pageKind == 'giveaways' && ['created', 'entered', 'won'].indexOf(location.subpage) == -1; };
            this.style = ".SGPP__gridView {display: flex; flex-wrap: wrap; justify-content: space-around; margin: 5px;}\n" + ".tile_view_header {font-size: 12px; border-bottom: 1px solid #D2D6E0; box-shadow: 0px 1px 0px rgba(255, 255, 255, 0.3); margin-bottom: 3px; text-align: center}\n" + ".SGPP__gridAvatar_outer {float: right; display: inline-block; margin-left: 5px}\n" + ".SGPP__gridAvatar {height: 27px; width: 27px; padding: 2px}\n" + ".SGPP__gridTile {margin: 5px}\n" + ".SGPP__gridTile > .global__image-outer-wrap--game-medium {position: relative}\n" + ".SGPP__gridTile:not(:hover) .SGPP__gridTileTime {display: none}\n" + ".SGPP__gridTile:hover {opacity: 1}\n" + ".SGPP__gridTile:hover > .global__image-outer-wrap--game-medium {border-radius: 4px 4px 0 0; border-bottom: 1px dotted transparent}\n" + ".SGPP__gridTile:hover > .SGPP__gridTileInfo {display: block; border-radius: 0 0 4px 4px}\n" + ".SGPP__gridTileInfo {display: none; position:absolute; width:184px; border-top: none; z-index: 10}\n" + ".SGPP__gridTileInfo .giveaway__icon {opacity: 0.7}\n" + ".SGPP__gridTileTime {position: absolute; bottom: 5px; left: 5px; height: 16px; text-align: center; background-color: #FFF; border-radius: 0 3px 0 0; padding: 2px 4px}\n" + ".SGPP__gridTileTime i {font-size: inherit; color:inherit}\n" + ".SGPP__gridTileIcons {position: absolute; bottom: 5px; right: 5px}\n" + ".SGPP__gridTileIcons > * {display: inline-block; width: 20px; height: 16px; text-align: center; padding: 2px; border-radius: 3px 0 0; vertical-align: middle}\n" + ".SGPP__gridTileIcons > :not(:last-child) {padding-right: 4px; margin-right: -3px}\n" + ".SGPP__gridTileIcons i {font-size: inherit; color: inherit}\n" + "";
            this.init = function () {
            };
            this.render = function () {
                var esg = $('.pagination').prev();
                SGPP.on("EndlessScrollGiveaways", "afterAddItems", function (event, pageContainer, page, isReload) {
                    _this.updateGridview(pageContainer);
                });
                _this.updateGridview(esg);
            };
            this.updateGridview = function (esg) {
                var giveawaysList = esg.children('.giveaway__row-outer-wrap');
                if (!giveawaysList.length)
                    return;
                var giveaways = $(document.createElement('div')).wrapInner(giveawaysList);
                var gridview = _this.generateGridview(giveaways);
                esg.append(gridview);
            };
            this.generateGridview = function (root) {
                function calcWinChance(copies, entries) {
                    var chance = +(copies / entries) * 100;
                    return chance < 0.01 ? '<0.01' : Math.min(chance, 100).toFixed(2);
                }
                var strong = function (txt) { return '<strong>' + txt + '</strong>'; };
                var floatLeft = function (el) { return $('<div>', { style: 'float: left', append: el }); };
                var floatRight = function (el) { return $('<div>', { style: 'float: right', append: el }); };
                var gridPage = $('<div>', { 'class': 'SGPP__gridView' });
                var gridTile = $('<div>', { 'class': 'SGPP__gridTile' });
                var tileInfo = $('<h2>', { 'class': 'SGPP__gridTileInfo global__image-outer-wrap' });
                var tileIcns = $('<div>', { 'class': 'SGPP__gridTileIcons' });
                root.find('.giveaway__row-inner-wrap').each(function () {
                    var $el = $(this);
                    if ($el.parents('.pinned-giveaways').length != 0)
                        return;
                    var thisTile = gridTile.clone().toggleClass('is-faded', $el.hasClass('is-faded'));
                    var gameImg = $el.children('.global__image-outer-wrap--game-medium').appendTo(thisTile).css('position', 'relative');
                    var gaColumns = $el.find('.giveaway__columns').children();
                    var timeLeft = gaColumns.eq(0).addClass('SGPP__gridTileTime').appendTo(gameImg);
                    timeLeft.find('span').text(function (i, txt) { return txt.match(/\d+(?:\s+)./)[0].replace(' ', ''); });
                    var icons = gaColumns.slice(2);
                    if (icons.length > 0) {
                        icons.filter('.giveaway__column--contributor-level').text(function (i, txt) { return txt.replace('Level ', ''); });
                        tileIcns.clone().append(icons).appendTo(gameImg);
                    }
                    var giveawayName = $el.find('.giveaway__heading__name').text();
                    var avatar = $el.find('.global__image-outer-wrap--avatar-small').addClass('SGPP__gridAvatar');
                    var thinText = $el.find('.giveaway__heading__thin').toArray();
                    var cost = parseInt(thinText.pop().textContent.replace(/\D+/g, ""));
                    var copies = thinText.length == 0 ? 1 : parseInt(thinText.pop().textContent.replace(/\D+/g, ""));
                    var gaLinks = $el.find('.giveaway__links').children();
                    var entries = parseInt(gaLinks.eq(0).text().replace(/\D+/g, ""));
                    var comments = parseInt(gaLinks.eq(1).text().replace(/\D+/g, ""));
                    var winChance = calcWinChance(copies, entries);
                    tileInfo.clone().append($('<div>', { text: giveawayName, 'class': 'giveaway__heading__name tile_view_header' }), $('<div>', { 'class': "SGPP__gridAvatar_outer", title: 'Created ' + gaColumns.eq(1).text(), append: avatar }), $('<div>', { style: 'display: inline-block; width: 145px' }).append(floatLeft(strong(copies) + (copies > 1 ? ' Copies' : ' Copy')), floatRight(strong(cost + 'P')), $('<div>', { style: 'clear: both' }), floatLeft(strong(winChance + '%')).attr('title', 'Probability to win'), floatRight($el.find('.giveaway__icon'))), $('<div>', { style: 'clear: both' }), floatLeft(strong(entries) + ' Entries'), floatRight(strong(comments) + ' Comments')).appendTo(thisTile);
                    gridPage.append(thisTile);
                });
                return gridPage;
            };
        }
        GridView.prototype.name = function () {
            return "GridView";
        };
        return GridView;
    })();
    ModuleDefinition.GridView = GridView;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var LivePreview = (function () {
        function LivePreview() {
            this.style = "";
            this.shouldRun = function (location) { return false; };
        }
        LivePreview.prototype.init = function () {
        };
        LivePreview.prototype.render = function () {
        };
        LivePreview.prototype.name = function () {
            return "LivePreview";
        };
        return LivePreview;
    })();
    ModuleDefinition.LivePreview = LivePreview;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var ScrollingSidebar = (function () {
        function ScrollingSidebar() {
            this.style = "";
            this.shouldRun = function (location) { return true; };
        }
        ScrollingSidebar.prototype.init = function () {
        };
        ScrollingSidebar.prototype.render = function () {
            var side = $('.sidebar');
            var sideOuter = $(document.createElement('div')).addClass(side.attr('class'));
            var sideInner = side.wrapInner(sideOuter).children().first().addClass('SGPP__scrollingSidebar');
            var sideAds = side.find('.adsbygoogle');
            var delayedAdSlider = (function () {
                var timeout;
                return function (up) {
                    clearTimeout(timeout);
                    timeout = setTimeout(function () {
                        if (up)
                            sideAds.stop().slideUp();
                        else
                            sideAds.stop().slideDown();
                    }, 250);
                };
            })();
            var $win = $(window);
            var footerHeight = $('.footer__outer-wrap').outerHeight();
            var $widgetContainer = $('.page__inner-wrap .widget-container');
            var featHeight = $('.featured__container').height();
            var offset = 25;
            var navHeight = 0;
            if (SGPP.modules['FixedNavbar'] !== undefined)
                offset += $('header').outerHeight();
            else
                navHeight += $('header').outerHeight();
            var handleScrolling = function () {
                var winTop = $win.scrollTop();
                if (winTop + sideInner.height() >= $widgetContainer.position().top + $widgetContainer.height()) {
                    sideInner.css({
                        position: 'fixed',
                        top: '',
                        bottom: footerHeight
                    });
                    delayedAdSlider(true);
                }
                else if (winTop <= featHeight + navHeight) {
                    sideInner.css({
                        position: 'static',
                        top: '',
                        left: ''
                    });
                    delayedAdSlider(false);
                }
                else {
                    sideInner.css({
                        position: 'fixed',
                        top: offset,
                        bottom: ''
                    }).show();
                    delayedAdSlider(true);
                }
            };
            $('.featured__inner-wrap .global__image-outer-wrap img').on('load', function () {
                featHeight = $('.featured__container').height();
                handleScrolling();
            });
            handleScrolling();
            $(document).scroll(handleScrolling);
        };
        ScrollingSidebar.prototype.name = function () {
            return "Scrolling Sidebar";
        };
        return ScrollingSidebar;
    })();
    ModuleDefinition.ScrollingSidebar = ScrollingSidebar;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var Settings = (function () {
        function Settings() {
            var _this = this;
            this._lsSettings = {};
            this.style = ".SGPP__settings { cursor: pointer; }\n";
            this.settingsNavIcon = '<a class="nav__row SGPP__settings" target="_blank" href="/sgpp">\n' + '<i class="icon-red fa fa-fw fa-bars"> </i>\n' + '<div class="nav__row__summary">\n' + '<p class="nav__row__summary__name" > SG++ Settings</p>\n' + '<p class="nav__row__summary__description"> Steamgifts++ settings.</p>\n' + '</div>\n' + '</a>\n';
            this.init = function (storage) {
                _this._lsSettings = storage.getItem(ModuleDefinition.Settings.SETTINGS_KEY, {});
                if (window.location.pathname == '/sgpp') {
                    unsafeWindow.window['$'] = $;
                    $('head').html(GM_getResourceText("head"));
                    $('body').html(GM_getResourceText("settings"));
                }
            };
            this.render = function () {
                if (SGPP.location.pageKind != 'sgpp') {
                    $(".nav__absolute-dropdown a[href^='/?logout']").before(_this.settingsNavIcon);
                }
                else {
                    $('.SGPP__form__checkbox').each(function (index, el) {
                        var elem = $(el);
                        var setting = elem.attr('name');
                        if (elem.parent('.SGPP__Module').length) {
                            elem.prop('checked', _this.isModuleEnabled(setting));
                        }
                        else {
                            var module = elem.closest('.form__row').find('.SGPP__Module input').attr('name');
                            elem.prop('checked', _this.getSettingForModule(module, setting) || false);
                        }
                    });
                    $('.SGPP__form__checkbox').on("click", function (e) {
                        var target = $(e.target);
                        var checked = target.prop('checked');
                        if (target.parent('.SGPP__Module').length) {
                            var module = target.attr('name');
                            if (_this._lsSettings.hasOwnProperty(module)) {
                                _this._lsSettings[module].enabled = checked;
                            }
                            else {
                                _this._lsSettings[module] = {
                                    "enabled": checked
                                };
                            }
                        }
                        else {
                            var module = target.closest('.form__row').find('.SGPP__Module input').attr('name');
                            var property = target.attr('name');
                            if (!_this._lsSettings.hasOwnProperty(module)) {
                                _this._lsSettings[module] = {
                                    "enabled": false
                                };
                            }
                            _this._lsSettings[module][property] = checked;
                        }
                        _this.persistSettings();
                    });
                }
            };
            this.shouldRun = function (location) { return true; };
            this.isModuleEnabled = function (module) {
                return _this._lsSettings.hasOwnProperty(module) && _this._lsSettings[module].enabled;
            };
            this.getSettingForModule = function (module, setting) {
                return !_this._lsSettings.hasOwnProperty(module) ? null : _this._lsSettings[module][setting];
            };
            this.persistSettings = function () {
                SGPP.storage.setItem(ModuleDefinition.Settings.SETTINGS_KEY, _this._lsSettings);
            };
        }
        Settings.prototype.name = function () {
            return "Settings";
        };
        Settings.SETTINGS_KEY = "Settings";
        return Settings;
    })();
    ModuleDefinition.Settings = Settings;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var UserHoverInfo = (function () {
        function UserHoverInfo() {
            this.style = '.SGPP_UserInfo_balloon {position: absolute; border: solid 2px black; z-index: 99; min-width: 200px; border-radius: 3px; min-height: 100px; background-color: inherit}\n' + '.SGPP_UserInfo_balloon:after {position: absolute; right: 100%; top: 5px; content: ""; height: 0; width: 0; border-style: solid; border-color: transparent black; border-width: 15px 20px 15px 0px}\n' + '.SGPP_UserInfo_balloon.right:after {right: -20px; border-width: 15px 0 15px 20px}\n' + '.SGPP_UserInfo_balloon .featured__outer-wrap.featured__outer-wrap--user {width: auto; padding: 15px 0}\n' + '.SGPP_UserInfo_balloon .featured__heading i {font-size: inherit}\n' + '.SGPP_UserInfo_balloon .featured__table__column {width: 175px}\n' + '.SGPP_UserInfo_balloon .featured__table .featured__table__row {padding: 5px 0px}\n' + '.SGPP_UserInfo_balloon .featured__table__column:not(:first-child) {margin-left: 15px}\n' + '.SGPP_UserInfo_balloon .featured__outer-wrap .global__image-outer-wrap {float: left; margin: 10px 7px 0px 0px; padding: 2px; width: 48px; height: 48px}\n' + '.SGPP_UserInfo_balloon .SGPP_UserOnline {background: linear-gradient(to bottom, #8FB93B 5%, #6E8C31 95%) repeat scroll 0% 0% transparent}\n' + '.SGPP_UserInfo_balloon .SGPP_UserOffline {background: linear-gradient(to bottom, rgba(106, 106, 106, 0.45) 5%, rgba(85, 85, 85, 1) 95%) repeat scroll 0% 0% transparent}\n' + '.SGPP_UserInfo_balloon .sidebar__shortcut-inner-wrap {width: 130px; color: rgba(255, 255, 255, 0.4)}\n' + '.SGPP_UserInfo_balloon .sidebar__shortcut-inner-wrap > * {line-height: 10px; text-shadow: none; background: none; border: none}\n' + '.SGPP_UserInfo_balloon .sidebar__shortcut-inner-wrap > .is-selected, ' + '.SGPP_UserInfo_balloon .sidebar__shortcut-inner-wrap > :hover, ' + '.SGPP_UserInfo_balloon .sidebar__shortcut-inner-wrap > :active ' + '{background: none; text-shadow: none; box-shadow: none}\n' + '';
            this.shouldRun = function (location) { return true; };
        }
        UserHoverInfo.prototype.init = function () {
        };
        UserHoverInfo.prototype.render = function () {
            function generateBalloonInfo(page) {
                var userHeader = $('.featured__outer-wrap.featured__outer-wrap--user', page);
                var tableCells = $('.featured__table__row', userHeader);
                var username = $('.featured__heading', userHeader).css('display', 'block');
                var avatar = $('.global__image-outer-wrap', userHeader).prependTo(username);
                var status = tableCells.eq(1).children().last().text().trim();
                if (status.toLowerCase().indexOf('online') > -1)
                    avatar.attr('title', status).addClass('SGPP_UserOnline');
                else
                    avatar.attr('title', 'Online ' + status).addClass('SGPP_UserOffline');
                tableCells.eq(1).remove();
                var cv = tableCells.last().children().last();
                cv[0].title = 'Contributor Value: ' + $('span', cv)[0].title;
                $('span', cv).removeAttr('title');
                cv.appendTo(username);
                tableCells.last().remove();
                var sideBtns = $('.sidebar__shortcut-inner-wrap', page).insertAfter(cv);
                sideBtns.children().eq(2).click(function () {
                    $(this).find('form').submit();
                });
                var suspension = $('.sidebar__suspension', page);
                if (suspension.length > 0) {
                    $('<span>', {
                        style: 'color: #B16C86',
                        text: ' (' + suspension.text().trim() + ')',
                        title: $('.sidebar__suspension-time', page).text()
                    }).appendTo(tableCells.eq(0).children().last());
                }
                return userHeader;
            }
            var bubble = $('<div>', { id: 'SGPP_UserInfo_balloon', 'class': 'SGPP_UserInfo_balloon' }).appendTo('body').hide();
            var cacheList = {};
            var loading = $('<div>', { style: 'color: black' }).append($('<i>', {
                'class': 'fa fa-refresh fa-spin fa-4x',
                style: 'margin: 30px 80px; font-size: 4em; color: #6B7A8C'
            }));
            bubble.append(loading);
            bubble.hover(function () {
                bubble.stop(true).fadeIn('fast');
            }, function () {
                delayedBubble.close();
            });
            var delayedBubble = {
                timeout: null,
                run: function (url, style, right) {
                    clearTimeout(this.timeout);
                    this.timeout = setTimeout(function () {
                        bubble.css(style);
                        bubble.children().remove();
                        if (right)
                            bubble.addClass('right');
                        else
                            bubble.removeClass('right');
                        var username = url.match(/\/user\/(.+?)(?:\/|$)/)[1];
                        if (username !== undefined && username in cacheList)
                            bubble.append(cacheList[username]).stop(true).show();
                        else {
                            bubble.append(loading).stop(true).show();
                            $.ajax({
                                url: url,
                                type: 'GET',
                                dataType: 'html',
                                success: function (html) {
                                    var info = generateBalloonInfo(html).data('user', username);
                                    cacheList[username] = info;
                                    bubble.children().remove();
                                    bubble.append(info);
                                }
                            });
                        }
                    }, 1500);
                },
                close: function () {
                    clearTimeout(this.timeout);
                    bubble.stop(true).delay(500).fadeOut('slow');
                }
            };
            $(document).on({
                mouseenter: function (e) {
                    var $el = $(e.target);
                    if ($el.attr('href').split('/').length > 3 || $el.prop('href') == document.URL)
                        return;
                    var pos = $el.offset();
                    var style;
                    var winWidth = $(window).width();
                    var right = e.target.getBoundingClientRect().left > winWidth / 2;
                    if (right) {
                        style = {
                            top: pos.top + ($el.height() / 2) - 25,
                            right: winWidth - pos.left + 20,
                            left: ''
                        };
                    }
                    else {
                        style = {
                            top: pos.top + ($el.height() / 2) - 25,
                            right: '',
                            left: pos.left + $el.width() + 20
                        };
                    }
                    delayedBubble.run($el.attr('href'), style, right);
                },
                mouseleave: function () {
                    delayedBubble.close();
                }
            }, 'a[href^="/user/"]:not(.nav__avatar-outer-wrap)');
        };
        UserHoverInfo.prototype.name = function () {
            return "Show User Profile on Hover";
        };
        return UserHoverInfo;
    })();
    ModuleDefinition.UserHoverInfo = UserHoverInfo;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var UserTagConfig = (function () {
        function UserTagConfig(callback) {
            var _this = this;
            this.background = $('<div>', { 'class': 'SGPP__tagModal_background' }).appendTo('body');
            this.content = $('<div>', { 'class': 'SGPP__tagModal popup' }).appendTo('body');
            this.config = [];
            this.update = function (name, config) {
                _this.$name.text(name);
                for (var i = 0; i < _this.config.length; i++) {
                    _this.config[i].val(config[i]);
                }
                return _this;
            };
            this.show = function () {
                _this.background.show();
                _this.content.show();
                return _this;
            };
            this.hide = function () {
                _this.background.hide();
                _this.content.hide();
                return _this;
            };
            this.save = function () {
                var args = [];
                for (var i = 0; i < _this.config.length; i++)
                    args.push(_this.config[i].val());
                _this.callback(_this.$name.text(), args);
                return _this.hide();
            };
            this.callback = callback;
            $('<i>', { 'class': 'popup__icon fa fa-tag' }).appendTo(this.content);
            $('<p>', { 'class': 'popup__heading', append: [
                'Edit custom tag for ',
                this.$name = $('<span>', { 'class': 'popup__heading__bold' }),
                ':'
            ] }).appendTo(this.content);
            var container = $('<div>', { 'class': 'SGPP__tagOptions' }).appendTo(this.content);
            var optionline = function (optionName, inputType) {
                var input = $('<input>', { type: inputType });
                _this.config.push(input);
                return $('<div>').append($('<span>', { 'class': 'form__heading__text', text: optionName }), input);
            };
            var options = [['Tag text', 'text'], ['Background color', 'color'], ['Text color', 'color']];
            for (var i = 0; i < options.length; i++) {
                container.append(optionline(options[i][0], options[i][1]));
            }
            $('<div>', { 'class': 'popup__actions' }).appendTo(this.content).append($('<span>', { text: 'save', click: this.save }), $('<span>', { text: 'cancel', click: this.hide }));
            this.background.click(this.hide);
            this.hide();
        }
        return UserTagConfig;
    })();
    var UserTags = (function () {
        function UserTags() {
            var _this = this;
            this.style = '.SGPP__tagIcon {margin-left: 5px; transform: rotate(-45deg); opacity: 0.35; cursor: pointer; text-shadow: none}\n' + '.SGPP__tagIcon:hover {opacity: 0.7}\n' + '.comment__username--op .SGPP__tagIcon {color: #FFF}\n' + '.SGPP__userTag {display: inline-block; color: #465670; background-color: #FFF; font-weight: initial; text-shadow: none; padding: 0 4px; border-radius: 3px; border: 1px solid #D2D6E0; line-height: normal; margin-left: 5px; cursor: pointer}\n' + '.SGPP__tagModal_background {position: fixed; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(60, 66, 77, 0.85); cursor: pointer; z-index: 9998}\n' + '.SGPP__tagModal {display: block; position: fixed; top: 50px; left: 50%; width: 300px; margin-left: -250px; z-index: 9999}\n' + '.SGPP__tagModal .popup__icon {width: 48px; text-indent: 5px}\n' + '.SGPP__tagOptions {margin-bottom: 15px}\n' + '.SGPP__tagOptions > div {display: flex; justify-content: space-between}\n' + '.SGPP__tagOptions > div > input {width: 125px; height: auto}\n' + '.SGPP__tagOptions .popup__actions {margin-top: 15px}\n' + '';
            this.render = function () {
                _this.tagConfigModal = new UserTagConfig(_this.updateTags);
                var usersLinks = $('a[href^="/user/"]:not(.global__image-outer-wrap, .nav__avatar-outer-wrap)');
                _this.usertagsCache = SGPP.storage.getItem('createdTags', {});
                usersLinks.each(function (i, el) {
                    var pathSplit = $(el).prop('pathname').split('/');
                    var username = el.textContent.trim();
                    if (pathSplit.length != 3 || pathSplit[2] != username)
                        return;
                    else
                        _this.createTag(username).insertAfter(el);
                });
                $('body').on('click', '.SGPP__tagIcon, .SGPP__userTag', function (e) {
                    var name = $(e.target).siblings('a[href^="/user/"]').text();
                    if (name in _this.usertagsCache) {
                        var config = _this.usertagsCache[name];
                    }
                    else {
                        var config = ['', '#FFFFFF', '#465670'];
                    }
                    _this.tagConfigModal.update(name, config).show();
                });
            };
            this.shouldRun = function (location) { return ['about', 'sales', 'legal', 'roles'].indexOf(location.pageKind) < 0; };
            this.createTag = function (username) {
                if (username in _this.usertagsCache) {
                    var config = _this.usertagsCache[username];
                    return $('<div>', {
                        text: config[0],
                        'class': 'SGPP__userTag',
                        css: { backgroundColor: config[1], color: config[2] }
                    });
                }
                else
                    return $('<i>', { 'class': 'fa fa-tag SGPP__tagIcon' });
            };
            this.updateTags = function (user, config) {
                if (config[0] === '')
                    delete _this.usertagsCache[user];
                else
                    _this.usertagsCache[user] = config;
                SGPP.storage.setItem('createdTags', _this.usertagsCache);
                console.log(1, user);
                $('a[href="/user/' + user + '"]').each(function (i, el) {
                    var tag = $(el).siblings('.SGPP__userTag, .SGPP__tagIcon');
                    if (tag.length === 0)
                        return;
                    else {
                        tag.remove();
                        _this.createTag(user).insertAfter(el);
                    }
                });
            };
        }
        UserTags.prototype.init = function () {
        };
        UserTags.prototype.name = function () {
            return "Custom Tags to Users";
        };
        return UserTags;
    })();
    ModuleDefinition.UserTags = UserTags;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var topicInfo = (function () {
        function topicInfo(topicID) {
            this._isDataStored = false;
            this.localStorageKey = "endless_scroll_" + topicID;
            if (this.localStorageKey in localStorage) {
                this._obj = JSON.parse(localStorage[this.localStorageKey]);
                if (!("numberOfComments" in this._obj)) {
                    this._obj.numberOfComments = 0;
                }
                if (!("lastSeenPage" in this._obj)) {
                    this._obj.lastSeenPage = 0;
                }
                if (!("collapsed" in this._obj)) {
                    this._obj.collapsed = {};
                }
                this._isDataStored = true;
            }
            else {
                this._obj = {
                    lastVisit: Date.now(),
                    lastCommentIDPages: {},
                    collapsed: {},
                    numberOfComments: 0
                };
            }
        }
        Object.defineProperty(topicInfo.prototype, "isDataStored", {
            get: function () {
                return this._isDataStored;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(topicInfo.prototype, "lastVisit", {
            get: function () {
                return this._obj.lastVisit;
            },
            enumerable: true,
            configurable: true
        });
        topicInfo.prototype.getNumComments = function () {
            return this._obj.numberOfComments;
        };
        topicInfo.prototype.setCommentState = function (id, collapsed) {
            if (!collapsed) {
                delete this._obj.collapsed[id];
            }
            else {
                this._obj.collapsed[id] = 1;
            }
            this.save();
        };
        topicInfo.prototype.getCommentState = function (id) {
            return id in this._obj.collapsed;
        };
        topicInfo.prototype.setLastVisit = function () {
            this._obj.lastVisit = Date.now();
            this.save();
        };
        topicInfo.prototype.setLastSeenPage = function (page) {
            this._obj.lastSeenPage = page;
            this.save();
        };
        topicInfo.prototype.setLastCommentID = function (page, commentID, numComments) {
            this._obj.lastCommentIDPages[page] = commentID;
            this._obj.numberOfComments = numComments;
            this.save();
        };
        topicInfo.prototype.isNewComment = function (page, commentID) {
            if (page in this._obj.lastCommentIDPages)
                return (commentID > this._obj.lastCommentIDPages[page]);
            else
                return true;
        };
        topicInfo.prototype.forget = function () {
            if (this.localStorageKey in localStorage) {
                localStorage.removeItem(this.localStorageKey);
            }
        };
        topicInfo.prototype.save = function () {
            localStorage[this.localStorageKey] = JSON.stringify(this._obj);
        };
        return topicInfo;
    })();
    var MarkComments = (function () {
        function MarkComments() {
            this.style = ".endless_new .comment__parent .comment__summary, .endless_new > .comment__child{}" + ".endless_not_new .comment__parent .comment__summary, .endless_not_new > .comment__child{}" + ".endless_not_new:hover .comment__parent .comment__summary, .endless_not_new:hover > .comment__child{}" + ".endless_badge_new, .endless_badge_new_child {border-radius: 4px; margin-left:5px; padding: 3px 5px; background-color: #C50000;text-shadow: none;color: white; font-weight: bold;}" + ".endless_badge_new_child { display: none; }" + ".comment--collapsed .endless_badge_new_child { display: block; }\n" + ".table__row-outer-wrap .markcomments_controls { display: none; }\n" + ".table__row-outer-wrap:hover .markcomments_controls { display: inline; }" + ".markcomments_controls i { opacity: 0.5; cursor: pointer; }\n" + ".markcomments_controls i:hover { opacity: 1; }";
        }
        Object.defineProperty(MarkComments.prototype, "topic", {
            get: function () {
                return this.topicInfo;
            },
            enumerable: true,
            configurable: true
        });
        MarkComments.prototype.getDiscussionId = function (url) {
            var match = /(discussion|trade)\/([^/]+)(\/|$)/.exec(url);
            if (!match)
                throw 'No Discussion ID';
            return match[1] + '_' + match[2];
        };
        MarkComments.prototype.getLatestCommentID = function (root) {
            var id = 0;
            $(root).find('.comment[data-comment-id]').each(function (i, el) {
                var n = parseInt($(el).data('comment-id'));
                if (n > id)
                    id = n;
            });
            return id;
        };
        MarkComments.prototype.shouldRun = function () {
            return true;
        };
        MarkComments.prototype.init = function () {
        };
        MarkComments.prototype.render = function () {
            var _this = this;
            if (SGPP.location.pageKind == 'discussion' || SGPP.location.pageKind == 'trade') {
                this.topicInfo = new topicInfo(this.getDiscussionId(location.pathname));
                var page = 1;
                var currentPageNavEl = $('div.pagination__navigation a.is-selected');
                if (currentPageNavEl.length != 0)
                    page = currentPageNavEl.first().data('page-number');
                this.markComments($(document), page, true);
                this.topicInfo.setLastVisit();
                var m = this;
                $("body").on('click', '.comment__collapse-button', function () {
                    var $this = $(this);
                    var parent = $this.parents('.comment');
                    var comment_id = parseInt(parent.data('comment-id'));
                    m.topicInfo.setCommentState(comment_id, true);
                });
                $("body").on('click', '.comment__expand-button', function () {
                    var $this = $(this);
                    var parent = $this.parents('.comment');
                    var comment_id = parseInt(parent.data('comment-id'));
                    m.topicInfo.setCommentState(comment_id, false);
                });
                if ("EndlessScrollDiscussionReplies" in SGPP.modules) {
                    $(SGPP.modules["EndlessScrollDiscussionReplies"]).on('beforeAddItems', function (event, dom, page, isReload) {
                        _this.markComments(dom, page, true, isReload);
                    });
                }
            }
            else if (SGPP.location.pageKind == 'discussions' || SGPP.location.pageKind == 'trades') {
                this.markTopics($(document));
                var m = this;
                $("body").on('click', '.markcomments_forget', function () {
                    var $this = $(this);
                    var parent = $this.parents('h3');
                    var link = parent.children('a');
                    var tInfo = new topicInfo(m.getDiscussionId(link.attr('href')));
                    tInfo.forget();
                    parent.find('.endless_badge_new').remove();
                    $this.remove();
                });
                if ("EndlessScrollDiscussion" in SGPP.modules) {
                    $(SGPP.modules["EndlessScrollDiscussion"]).on('beforeAddItems', function (event, dom, page, isReload) {
                        _this.markTopics(dom);
                    });
                }
            }
            else if (SGPP.location.pageKind == 'giveaways' && SGPP.location.subpage == '') {
                this.markTopics($('.widget-container').last().prev().prev());
            }
        };
        MarkComments.prototype.checkNewComments = function (dom, page) {
            var _this = this;
            var has_new = false;
            $(dom).find('.comment[data-comment-id]').each(function (i, el) {
                var id = parseInt($(el).data('comment-id'));
                if (_this.topicInfo.isNewComment(page, id)) {
                    has_new = true;
                }
            });
            return has_new;
        };
        MarkComments.prototype.markComments = function (dom, page, markRead, forceMark) {
            var _this = this;
            if (markRead === void 0) { markRead = false; }
            if (forceMark === void 0) { forceMark = false; }
            if (this.topicInfo.isDataStored || forceMark) {
                dom.find('.comment[data-comment-id]').each(function (i, el) {
                    var id = parseInt($(el).data('comment-id'));
                    var is_new = _this.topicInfo.isNewComment(page, id);
                    var collapsed = _this.topicInfo.getCommentState(id);
                    if (collapsed) {
                        $(el).addClass('comment--collapsed');
                    }
                    if (is_new) {
                        $(el).addClass('endless_new');
                        $(el).find('.comment__username').first().after($('<span>').addClass('endless_badge_new').text('New').attr('title', 'New since last visit'));
                    }
                    else {
                        $(el).addClass('endless_not_new');
                    }
                    if (_this.checkNewComments(el, page)) {
                        if (!is_new) {
                            $(el).find('.comment__username').first().after($('<span>').addClass('endless_badge_new_child').text('New replies').attr('title', 'New since last visit'));
                        }
                        $(el).addClass('endless_new_children');
                    }
                    else {
                        $(el).addClass('endless_no_new_children');
                    }
                });
            }
            if (markRead) {
                var numComments = parseInt($('.comments:eq(1)').prev().find('a').text().split(' ')[0]);
                this.topicInfo.setLastCommentID(page, this.getLatestCommentID(dom), numComments);
            }
        };
        MarkComments.prototype.markTopics = function (dom) {
            var _this = this;
            dom.find('.table__row-outer-wrap').each(function (i, el) {
                try {
                    var link = $(el).find('h3 a').first();
                    var tInfo = new topicInfo(_this.getDiscussionId(link.attr('href')));
                    if (SGPP.settings.getSettingForModule("EndlessScrollDiscussionReplies", "reversedDiscussionReplies") || false) {
                        link.attr('href', link.attr('href') + '/search?page=31337');
                    }
                    if (tInfo.isDataStored) {
                        var numComments = parseInt($(el).find('.table__column--width-small a.table__column__secondary-link').text());
                        var lastComments = tInfo.getNumComments();
                        var newComments = numComments - lastComments;
                        if (newComments > 0) {
                            $(el).addClass('endless_new_comments');
                            if (true)
                                link.after($('<span>').addClass('endless_badge_new').text(newComments).attr('title', newComments + ' new comments since last visit'));
                            else
                                $(el).find('.table__column--width-fill > p').first().append(' - <strong>' + newComments + ' new comments</strong>');
                        }
                        else {
                            $(el).addClass('endless_no_new_comments');
                            $(el).find('.table__column--width-fill > p').first().append(' - no new comments</strong>');
                        }
                        $(el).find('h3').first().append('<span class="markcomments_controls pull-right"><i class="fa fa-remove markcomments_forget" title="Forget this topic"></i></span>');
                    }
                }
                catch (err) {
                }
            });
        };
        MarkComments.prototype.name = function () {
            return "Mark Comments";
        };
        return MarkComments;
    })();
    ModuleDefinition.MarkComments = MarkComments;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var MessagesFilterTest = (function () {
        function MessagesFilterTest() {
            this.style = ".message_filter_hidden { display: none; }\n" + ".message_filter_visible { }\n" + ".filterdrop { position: absolute; }\n" + ".filterdrop a { display: block; }\n" + ".message-filters { margin-left: 5px; }\n" + ".message-filter { cursor: pointer; }\n" + ".message-filter i { margin: 0; }";
            this._hideRead = false;
        }
        MessagesFilterTest.prototype.shouldRun = function () {
            return (SGPP.location.pageKind == 'discussion' || SGPP.location.pageKind == 'trade');
        };
        Object.defineProperty(MessagesFilterTest.prototype, "hideRead", {
            get: function () {
                return this._hideRead;
            },
            set: function (v) {
                this._hideRead = v;
                this._filterElement.find('.hideread i').toggleClass('fa-square-o', !v).toggleClass('fa-check-square-o', v);
                this.filterAll();
            },
            enumerable: true,
            configurable: true
        });
        MessagesFilterTest.prototype.init = function () {
        };
        MessagesFilterTest.prototype.filterItem = function (el) {
            var $el = $(el);
            var visible = true;
            var is_new = !$el.hasClass('endless_not_new');
            var has_new_children = !$el.hasClass('endless_no_new_children');
            if (this.hideRead) {
                visible = visible && (is_new || has_new_children);
            }
            $el.toggleClass('message_filter_hidden', !visible);
            $el.toggleClass('message_filter_visible', visible);
        };
        MessagesFilterTest.prototype.filterAll = function () {
            var _this = this;
            $('.comment').each(function (i, el) {
                _this.filterItem(el);
            });
        };
        MessagesFilterTest.prototype.render = function () {
            var _this = this;
            if ("EndlessScrollDiscussionReplies" in SGPP.modules) {
                $(SGPP.modules["EndlessScrollDiscussionReplies"]).on('addItem', function (event, el) {
                    _this.filterItem(el);
                });
            }
            var m = this;
            this._filterElement = $('<span class="message-filters"></span>');
            this._filterElement.append('<span class="message-filter hideread"><i class="fa fa-square-o"></i> Hide Read</span>').click(function () {
                m.hideRead = !m.hideRead;
            });
            $('.comments:eq(1)').prev().find('div').append(this._filterElement);
            this.filterAll();
        };
        MessagesFilterTest.prototype.name = function () {
            return "Hide Read Comments";
        };
        return MessagesFilterTest;
    })();
    ModuleDefinition.MessagesFilterTest = MessagesFilterTest;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var PopupGiveaway = (function () {
        function PopupGiveaway() {
            var _this = this;
            this.style = ".SGPP__popup_giveaway { text-align: justify; width: 90%; max-width: 1000px }\n" + ".SGPP__popup_giveaway .page__outer-wrap { padding-top: 10px; padding-bottom: 10px; padding-left: 20px; padding-right:20px }\n" + ".SGPP__popup_giveaway .comment__parent { margin-top: 10px }\n" + ".SGPP__popup_giveaway .global__image-outer-wrap--avatar-small { margin-right: 5px }\n" + ".SGPP__popup_giveaway .page__description { max-height: 200px; overflow-y: auto }\n" + ".SGPP__popup_giveaway .markdown li { position:relative }\n" + ".SGPP__popup_giveaway .featured__outer-wrap form > * { background-color: #f0f2f5 }\n" + ".SGPP__popup_giveaway .featured__outer-wrap form { margin-top: 5px; }\n";
            this.popupGiveaway = $('<div>', {
                'class': 'SGPP__popup_giveaway is-hidden',
            });
            this.handlePopupCreate = function (dom) {
                $('a[href^="/giveaway/"]:not([href$="/entries"],[href$="/comments"])', dom).on("click", function (e) {
                    e.preventDefault();
                    _this.handlePopup($(e.currentTarget));
                });
            };
            this.headingHelper = function (desc) {
                return '<div class="page__heading"><div class="page__heading__breadcrumbs">' + desc + '</div></div>';
            };
            this.handlePopup = function (self) {
                _this.popupGiveaway.bPopup({
                    onOpen: function () {
                        _this.popupGiveaway.removeClass('is-hidden');
                        $.ajax({ url: self.attr('href') }).done(function (page) {
                            var featured = $('.featured__outer-wrap', page);
                            $('.featured__column--whitelist, .featured__column--group', featured).each(function () {
                                this.childNodes[1].nodeValue = '';
                            });
                            var pageOuterWrap = $('<div>', { 'class': 'page__outer-wrap' });
                            var enterButton = $('.sidebar form', page);
                            if (!enterButton.length)
                                enterButton = $('.sidebar__error', page);
                            var pageDescription = $('.page__description', page);
                            var commentArea = $('.comment--submit .comment__parent', page);
                            commentArea.find('span').addClass('b-close');
                            var commentButton = $('.js__submit-form', commentArea);
                            featured.find('.featured__summary').append(enterButton);
                            if (pageDescription.length) {
                                pageOuterWrap.append(_this.headingHelper("Description"), pageDescription);
                            }
                            pageOuterWrap.append(_this.headingHelper("Reply"), commentArea);
                            _this.popupGiveaway.append(featured, pageOuterWrap);
                            _this.popupGiveaway.css({
                                'top': Math.max(0, (($(window).height() - (208 + pageOuterWrap.outerHeight())) / 2) + $(window).scrollTop()) + "px"
                            });
                            $(".sidebar__entry-insert, .sidebar__entry-delete", featured).on("click", function (e) {
                                var t = $(e.currentTarget);
                                t.addClass("is-hidden"), t.closest("form").find(".sidebar__entry-loading").removeClass("is-hidden"), t.closest("form").find("input[name=do]").val(t.attr("data-do")), $.ajax({
                                    url: '/ajax.php',
                                    type: "POST",
                                    dataType: "json",
                                    data: t.closest("form").serialize(),
                                    success: function (e) {
                                        t.closest("form").find(".sidebar__entry-loading").addClass("is-hidden");
                                        if (e.type === "success") {
                                            if (t.hasClass("sidebar__entry-insert")) {
                                                t.closest("form").find(".sidebar__entry-delete").removeClass("is-hidden");
                                                self.closest('.giveaway__row-inner-wrap, .SGPP__gridTile').addClass('is-faded');
                                            }
                                            else if (t.hasClass("sidebar__entry-delete")) {
                                                t.closest("form").find(".sidebar__entry-insert").removeClass("is-hidden");
                                                self.closest('.giveaway__row-inner-wrap, .SGPP__gridTile').removeClass('is-faded');
                                            }
                                        }
                                        else if (e.type === "error") {
                                            t.closest("form").html("undefined" != typeof e.link && e.link !== !1 ? '<a href="' + e.link + '" class="sidebar__error"><i class="fa fa-exclamation-circle"></i> ' + e.msg + "</a>" : '<div class="sidebar__error is-disabled"><i class="fa fa-exclamation-circle"></i> ' + e.msg + "</div>");
                                        }
                                        if ("undefined" != typeof e.entry_count && e.entry_count !== !1) {
                                            $(".live__entry-count").text(e.entry_count);
                                            $(".nav__points").text(e.points);
                                        }
                                    }
                                });
                            });
                            commentButton.on("click", function (e) {
                                e.preventDefault();
                                var el = $(e.currentTarget);
                                $.ajax({
                                    url: self.attr('href'),
                                    type: 'POST',
                                    dataType: "json",
                                    data: el.closest("form").serialize(),
                                    complete: function (e) {
                                        if (e.getResponseHeader('TM-finalURL')) {
                                            el.closest("form").find("textarea").val("");
                                            el.hide();
                                        }
                                    }
                                });
                            });
                        });
                    },
                    onClose: function () {
                        _this.popupGiveaway.addClass('is-hidden');
                        _this.popupGiveaway.empty();
                    },
                    follow: [true, false]
                });
            };
            this.shouldRun = function (location) { return location.pageKind == 'giveaways'; };
        }
        PopupGiveaway.prototype.init = function () {
            this.popupGiveaway.appendTo('body');
        };
        PopupGiveaway.prototype.render = function () {
            var _this = this;
            this.handlePopupCreate($(document));
            SGPP.on(["EndlessScrollGiveaways", "EndlessScrollLists"], "afterAddItems", function (event, pageContainer, page, isReload) {
                _this.handlePopupCreate(pageContainer);
            });
        };
        PopupGiveaway.prototype.name = function () {
            return "Popup Giveaway";
        };
        return PopupGiveaway;
    })();
    ModuleDefinition.PopupGiveaway = PopupGiveaway;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var EndlessScroll = (function () {
        function EndlessScroll() {
            this._maxPage = 31337;
            this._nextPage = -1;
            this._currentPage = 1;
            this._lastPage = 1;
            this._numberOfPages = -1;
            this._stopped = false;
            this._pages = {};
            this._pagesUrl = {};
        }
        Object.defineProperty(EndlessScroll.prototype, "stopped", {
            get: function () {
                return this._stopped;
            },
            set: function (v) {
                this._stopped = v;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EndlessScroll.prototype, "currentPage", {
            get: function () {
                return this._currentPage;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EndlessScroll.prototype, "lastPage", {
            get: function () {
                return this._numberOfPages;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EndlessScroll.prototype, "reverseItems", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EndlessScroll.prototype, "BaseUrl", {
            get: function () {
                throw 'BaseUrl() not implmented';
            },
            enumerable: true,
            configurable: true
        });
        EndlessScroll.prototype.hasPages = function (dom) {
            return $(dom).find('.pagination__navigation').length != 0;
        };
        EndlessScroll.prototype.getNavigationElement = function (dom) {
            return $(dom).find('.pagination').first();
        };
        EndlessScroll.prototype.createPageContainerElement = function () {
            throw 'createPageContainerElement() not implemented';
        };
        EndlessScroll.prototype.getItemsElement = function (dom) {
            throw 'getItemsElement() not implemented';
        };
        EndlessScroll.prototype.getItems = function (dom) {
            throw 'getItems() not implemented';
        };
        EndlessScroll.prototype.createLoadingElement = function () {
            var el = $('<span class="endless_loading"> - <i class="fa fa-refresh fa-spin"></i> Loading...</span>');
            return el;
        };
        EndlessScroll.prototype.createPageElement = function (page) {
            var _this = this;
            var el = $('<div class="table__heading"><div class="table__column--width-fill"><p><span class="endless_page"></span></p></div></div>');
            var $p = el.find('p');
            this.updatePageElement(el, page);
            var controlContainer = $('<div>').addClass('pull-right').addClass('endless_control_element');
            var controlStartStop = $('<a>').attr('href', '#').append('<i class="fa fa-pause"></i>').attr('title', 'Pause/Resume endless scrolling');
            controlStartStop.click(function () {
                _this.stopped = !_this.stopped;
                $('.endless_control_element a i.fa').toggleClass('fa-pause').toggleClass('fa-play');
                return false;
            });
            controlContainer.append(controlStartStop);
            $p.append(controlContainer);
            return el;
        };
        EndlessScroll.prototype.updatePageElement = function (el, page) {
            var text = '';
            if (page > 0) {
                if (this._numberOfPages > 0)
                    text = 'Page ' + page + ' of ' + this._numberOfPages;
                else
                    text = 'Page ' + page;
            }
            else {
                text = 'Last page ends here';
            }
            el.find('.endless_page').text(text);
        };
        EndlessScroll.prototype.loadNextPage = function () {
            if (this._stopped) {
                return;
            }
            if (this._nextPage > this._lastPage || this._nextPage < 1)
                return;
            this.loadPage(this._nextPage);
        };
        EndlessScroll.prototype.updateNextPage = function (page) {
            if (this.reverseItems) {
                this._nextPage = page - 1;
            }
            else {
                this._nextPage = page + 1;
            }
        };
        EndlessScroll.prototype.loadPage = function (page, force_reload) {
            var _this = this;
            if (force_reload === void 0) { force_reload = false; }
            if (!(page in this._pagesUrl)) {
                throw 'No URL for page ' + this._currentPage;
            }
            if (!(page in this._pages)) {
                var diff = -1;
                var target = -1;
                $.each(this._pages, function (i, el) {
                    var thisDiff = Math.abs(i - page);
                    if (target == -1 || diff > thisDiff) {
                        target = i;
                        diff = thisDiff;
                    }
                });
                var pageContainer = this.createPageContainerElement();
                var loadingElement = this.createLoadingElement();
                var pageHeaderElement = this.createPageElement(page);
                pageHeaderElement.find('p').first().append(loadingElement);
                pageContainer.append(pageHeaderElement);
                this._pages[page] = {
                    element: pageContainer,
                    loaded: false,
                    loading: false,
                    visible: true
                };
                var elPage = this._pages[target].element;
                if ((target < page && !this.reverseItems) || (target > page && this.reverseItems)) {
                    elPage.after(pageContainer);
                }
                else {
                    elPage.before(pageContainer);
                }
            }
            var pg = this._pages[page];
            if (pg.loading) {
                return;
            }
            else if (pg.loaded && !force_reload) {
                if (!pg.visible) {
                    pg.element.show();
                    pg.visible = true;
                }
                if (this._nextPage == page) {
                    this.updateNextPage(page);
                }
            }
            else {
                var url = this._pagesUrl[page];
                this._pages[page].loading = true;
                var isReload = this._pages[page].loaded;
                $.get(url, function (data) {
                    var dom = $.parseHTML(data);
                    if (isReload)
                        pageContainer.children().remove();
                    var newPagination = _this.getNavigationElement(dom);
                    var actualPage = parseInt(newPagination.find('a.is-selected').data('page-number'));
                    var $dom = $(dom);
                    $(_this).trigger('beforeAddItems', [$dom, actualPage, isReload]);
                    var itemsContainer = _this.getItemsElement(dom);
                    _this.parseNavigation(newPagination);
                    _this.addItems(itemsContainer, pageContainer, page);
                    pageContainer.prepend(pageHeaderElement);
                    _this.getNavigationElement(document).html(newPagination.html());
                    $(_this).trigger('afterAddItems', [pageContainer, actualPage, isReload]);
                    _this._pages[page].loaded = true;
                    loadingElement.remove();
                    if (_this._nextPage == page || _this._nextPage == -1) {
                        _this.updateNextPage(actualPage);
                    }
                    if (actualPage != page) {
                        _this.updatePageElement(pageHeaderElement, actualPage);
                        _this._pages[actualPage] = _this._pages[page];
                        delete _this._pages[page];
                    }
                });
            }
        };
        EndlessScroll.prototype.addItems = function (dom, pageContainer, page) {
            var _this = this;
            this.getItems(dom).each(function (i, el) {
                $(_this).trigger('addItem', [el]);
                if (_this.reverseItems) {
                    pageContainer.prepend(el);
                }
                else {
                    pageContainer.append(el);
                }
            });
        };
        EndlessScroll.prototype.parseNavigation = function (dom) {
            var _this = this;
            var elLastPage = dom.find('a').last();
            this._lastPage = parseInt(elLastPage.data('page-number'));
            if (elLastPage.text().trim() != "Next") {
                this._numberOfPages = this._lastPage;
            }
            dom.find('.pagination__navigation a').each(function (i, el) {
                var $el = $(el);
                var page = parseInt($el.data('page-number'));
                _this._pagesUrl[page] = $el.attr('href');
                if (page > _this._lastPage)
                    _this._lastPage = page;
            });
        };
        EndlessScroll.prototype.preparePage = function () {
            var _this = this;
            var nav = this.getNavigationElement(document);
            if (nav.hasClass('pagination--no-results'))
                return;
            if (!this.hasPages(document)) {
                this._currentPage = 1;
                this._lastPage = 1;
                this._numberOfPages = 1;
            }
            else {
                this._currentPage = parseInt(nav.find('a.is-selected').data('page-number'));
                this.parseNavigation(nav);
            }
            var itemsElement = this.getItemsElement(document);
            var pageHeader = this.createPageElement(this.currentPage);
            var isCommentLink = SGPP.location.hash != '';
            this._pages[this.currentPage] = {
                element: itemsElement,
                loaded: true,
                loading: false,
                visible: true
            };
            if (this.reverseItems) {
                this.getItems(itemsElement).each(function (i, el) {
                    itemsElement.prepend(el);
                });
                if (this._currentPage == 1 && this._numberOfPages > 1 && !isCommentLink) {
                    this._nextPage = this._lastPage;
                    this.loadNextPage();
                    this._pages[this.currentPage].visible = false;
                    itemsElement.hide();
                }
                else if (this._currentPage == 1 && this._numberOfPages == -1 && !isCommentLink) {
                    this._pagesUrl[this._maxPage] = this.BaseUrl + '/search?page=' + this._maxPage;
                    this._pages[this.currentPage].visible = false;
                    itemsElement.hide();
                    this.loadPage(this._maxPage);
                }
                else {
                    this._nextPage = this._lastPage - 1;
                }
            }
            else {
                this._nextPage = this._currentPage + 1;
            }
            itemsElement.prepend(pageHeader);
            if (isCommentLink) {
                var linkedComment = $("#" + SGPP.location.hash);
                $(window).scrollTop(linkedComment.offset().top);
            }
            $(window).scroll(function (event) {
                var scrollPos = $(window).scrollTop() + $(window).height();
                if (scrollPos > $('div.pagination').position().top - 200) {
                    _this.loadNextPage();
                }
            });
            $(window).scroll();
        };
        return EndlessScroll;
    })();
    ModuleDefinition.EndlessScroll = EndlessScroll;
})(ModuleDefinition || (ModuleDefinition = {}));
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ModuleDefinition;
(function (ModuleDefinition) {
    var EndlessScrollDiscussion = (function (_super) {
        __extends(EndlessScrollDiscussion, _super);
        function EndlessScrollDiscussion() {
            _super.apply(this, arguments);
            this.style = "";
        }
        EndlessScrollDiscussion.prototype.shouldRun = function () {
            return SGPP.location.pageKind == 'discussions' || SGPP.location.pageKind == 'trades';
        };
        EndlessScrollDiscussion.prototype.init = function () {
        };
        EndlessScrollDiscussion.prototype.render = function () {
            this.preparePage();
        };
        EndlessScrollDiscussion.prototype.createPageContainerElement = function () {
            return $('<div class="table__rows">');
        };
        EndlessScrollDiscussion.prototype.getItemsElement = function (dom) {
            return $(dom).find('.table__rows').first();
        };
        EndlessScrollDiscussion.prototype.getItems = function (dom) {
            return dom.children('.table__row-outer-wrap');
        };
        EndlessScrollDiscussion.prototype.name = function () {
            return "Endless Scroll on Discussions page";
        };
        return EndlessScrollDiscussion;
    })(ModuleDefinition.EndlessScroll);
    ModuleDefinition.EndlessScrollDiscussion = EndlessScrollDiscussion;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var EndlessScrollDiscussionReplies = (function (_super) {
        __extends(EndlessScrollDiscussionReplies, _super);
        function EndlessScrollDiscussionReplies() {
            _super.apply(this, arguments);
            this.style = "";
        }
        EndlessScrollDiscussionReplies.prototype.shouldRun = function () {
            return SGPP.location.pageKind == 'discussion' || SGPP.location.pageKind == 'trade';
        };
        EndlessScrollDiscussionReplies.prototype.init = function () {
        };
        EndlessScrollDiscussionReplies.prototype.render = function () {
            if (true) {
                var addReply = $('.comment--submit').first();
                if (addReply.length == 1) {
                    var elCommentHeader = $('<div id="esc_reply_header" class="page__heading"><div class="page__heading__breadcrumbs">Reply</div></div>');
                    if ($('.poll').length == 0)
                        $('.comments').first().after(elCommentHeader);
                    else
                        $('.poll').first().after(elCommentHeader);
                    $('#esc_reply_header').after(addReply);
                    $('.js__comment-reply-cancel').on('click', function () {
                        setTimeout(function () {
                            addReply.insertAfter('#esc_reply_header');
                        }, 10);
                    });
                }
            }
            this.preparePage();
        };
        Object.defineProperty(EndlessScrollDiscussionReplies.prototype, "BaseUrl", {
            get: function () {
                return '/' + SGPP.location.pageKind + '/' + SGPP.location.code + '/' + SGPP.location.description;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EndlessScrollDiscussionReplies.prototype, "reverseItems", {
            get: function () {
                return SGPP.settings.getSettingForModule("EndlessScrollDiscussionReplies", "reversedDiscussionReplies") || false;
            },
            enumerable: true,
            configurable: true
        });
        EndlessScrollDiscussionReplies.prototype.createPageContainerElement = function () {
            return $('<div class="comments">');
        };
        EndlessScrollDiscussionReplies.prototype.getItemsElement = function (dom) {
            return $(dom).find('.comments:eq(1)');
        };
        EndlessScrollDiscussionReplies.prototype.getItems = function (dom) {
            return dom.children('.comment');
        };
        EndlessScrollDiscussionReplies.prototype.name = function () {
            return "Endless Scroll on Discussion comments";
        };
        return EndlessScrollDiscussionReplies;
    })(ModuleDefinition.EndlessScroll);
    ModuleDefinition.EndlessScrollDiscussionReplies = EndlessScrollDiscussionReplies;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var EndlessScrollGiveawayComments = (function (_super) {
        __extends(EndlessScrollGiveawayComments, _super);
        function EndlessScrollGiveawayComments() {
            _super.apply(this, arguments);
            this.style = "";
        }
        EndlessScrollGiveawayComments.prototype.shouldRun = function () {
            return SGPP.location.pageKind == 'giveaway' && SGPP.location.subpage == '';
        };
        EndlessScrollGiveawayComments.prototype.init = function () {
        };
        EndlessScrollGiveawayComments.prototype.render = function () {
            if (true) {
                var addReply = $('.comment--submit').first();
                var elCommentHeader = $('<div id="esc_reply_header" class="page__heading"><div class="page__heading__breadcrumbs">Reply</div></div>');
                $('.comments').prev().before(elCommentHeader);
                $('#esc_reply_header').after(addReply);
                $('.js__comment-reply-cancel').on('click', function () {
                    setTimeout(function () {
                        addReply.insertAfter('#esc_reply_header');
                    }, 10);
                });
            }
            this.preparePage();
        };
        EndlessScrollGiveawayComments.prototype.createPageContainerElement = function () {
            return $('<div class="comments">');
        };
        Object.defineProperty(EndlessScrollGiveawayComments.prototype, "reverseItems", {
            get: function () {
                return SGPP.settings.getSettingForModule("EndlessScrollGiveawayComments", "reversedGiveawayComments") || false;
            },
            enumerable: true,
            configurable: true
        });
        EndlessScrollGiveawayComments.prototype.getItemsElement = function (dom) {
            return $(dom).find('.comments').first();
        };
        EndlessScrollGiveawayComments.prototype.getItems = function (dom) {
            return dom.children('.comment');
        };
        EndlessScrollGiveawayComments.prototype.name = function () {
            return "Endless Scroll on Giveaway comments";
        };
        return EndlessScrollGiveawayComments;
    })(ModuleDefinition.EndlessScroll);
    ModuleDefinition.EndlessScrollGiveawayComments = EndlessScrollGiveawayComments;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var EndlessScrollGiveaways = (function (_super) {
        __extends(EndlessScrollGiveaways, _super);
        function EndlessScrollGiveaways() {
            _super.apply(this, arguments);
            this._location = 'frontpage';
            this.style = "";
        }
        EndlessScrollGiveaways.prototype.shouldRun = function () {
            if (SGPP.location.pageKind == 'giveaways') {
                return !(SGPP.location.subpage == 'entered' || SGPP.location.subpage == 'created' || SGPP.location.subpage == 'won');
            }
            else if (/^\/user\/[^\/]+(\/giveaways\/won([^\/]+)?)?$/.test(location.pathname)) {
                this._location = 'profile';
                return true;
            }
            return false;
        };
        EndlessScrollGiveaways.prototype.init = function () {
        };
        EndlessScrollGiveaways.prototype.render = function () {
            this.preparePage();
            $(this).on('afterAddItems', function (event, pageContainer, page, isReload) {
                pageContainer.find(".giveaway__hide").click(function () {
                    $(".popup--hide-games input[name=game_id]").val($(this).attr("data-game-id"));
                    $(".popup--hide-games .popup__heading__bold").text($(this).closest("h2").find(".giveaway__heading__name").text());
                });
                pageContainer.find(".trigger-popup").click(function () {
                    $("." + $(this).attr("data-popup")).bPopup({
                        opacity: .85,
                        fadeSpeed: 200,
                        followSpeed: 500,
                        modalColor: "#3c424d"
                    });
                });
            });
        };
        EndlessScrollGiveaways.prototype.createPageContainerElement = function () {
            return $('<div>');
        };
        EndlessScrollGiveaways.prototype.getItemsElement = function (dom) {
            return $(dom).find('.pagination').prev();
        };
        EndlessScrollGiveaways.prototype.getItems = function (dom) {
            return dom.children('.giveaway__row-outer-wrap');
        };
        EndlessScrollGiveaways.prototype.name = function () {
            return "Endless Scroll on Giveaways";
        };
        return EndlessScrollGiveaways;
    })(ModuleDefinition.EndlessScroll);
    ModuleDefinition.EndlessScrollGiveaways = EndlessScrollGiveaways;
})(ModuleDefinition || (ModuleDefinition = {}));
var ModuleDefinition;
(function (ModuleDefinition) {
    var EndlessScrollLists = (function (_super) {
        __extends(EndlessScrollLists, _super);
        function EndlessScrollLists() {
            _super.apply(this, arguments);
            this.style = "";
        }
        EndlessScrollLists.prototype.shouldRun = function () {
            if (SGPP.location.pageKind == 'giveaways') {
                return SGPP.location.subpage == 'entered' || SGPP.location.subpage == 'created' || SGPP.location.subpage == 'won';
            }
            else if (SGPP.location.pageKind == 'bundle-games') {
                return true;
            }
            else if (SGPP.location.pageKind == 'giveaway') {
                return SGPP.location.subpage == 'entries' || SGPP.location.subpage == 'winners' || SGPP.location.subpage == 'groups';
            }
            else if (SGPP.location.pageKind == 'account') {
                return SGPP.location.subpage == 'manage' || SGPP.location.subpage == 'feedback' || SGPP.location.subpage == 'steam';
            }
            console.log(SGPP.location);
            return false;
        };
        EndlessScrollLists.prototype.init = function () {
        };
        EndlessScrollLists.prototype.render = function () {
            this.preparePage();
        };
        EndlessScrollLists.prototype.createPageContainerElement = function () {
            return $('<div class="table__rows">');
        };
        EndlessScrollLists.prototype.getItemsElement = function (dom) {
            return $(dom).find('.table__rows').first();
        };
        EndlessScrollLists.prototype.getItems = function (dom) {
            return dom.children('.table__row-outer-wrap');
        };
        EndlessScrollLists.prototype.afterAddItems = function (dom) {
            $(dom).find(".table__remove-default").click(function () {
                var e = $(this);
                e.addClass("is-hidden");
                e.siblings(".table__remove-loading").removeClass("is-hidden");
                $.ajax({
                    url: "/ajax.php",
                    type: "POST",
                    dataType: "json",
                    data: e.closest("form").serialize(),
                    success: function (t) {
                        e.siblings(".table__remove-loading").addClass("is-hidden");
                        e.siblings(".table__remove-complete").removeClass("is-hidden");
                        e.closest(".table__row-inner-wrap").addClass("is-faded");
                        if (typeof t.points !== "undefined" && t.points !== false) {
                            $(".nav__points").text(t.points);
                        }
                    }
                });
            });
        };
        EndlessScrollLists.prototype.name = function () {
            return "Endless Scroll everywhere else";
        };
        return EndlessScrollLists;
    })(ModuleDefinition.EndlessScroll);
    ModuleDefinition.EndlessScrollLists = EndlessScrollLists;
})(ModuleDefinition || (ModuleDefinition = {}));
var SGPP = new ModuleDefinition.Core();
var modulesNames = new Array("CommentAndEnter", "EntryCommenters", "FixedNavbar", "FixedFooter", "GridView", "ScrollingSidebar", "UserHoverInfo", "UserTags", "MarkComments", "MessagesFilterTest", "PopupGiveaway", "EndlessScrollDiscussion", "EndlessScrollDiscussionReplies", "EndlessScrollGiveaways", "EndlessScrollGiveawayComments", "EndlessScrollLists");
var defaultModules = {
    "FixedNavbar": { "enabled": true },
    "ScrollingSidebar": { "enabled": true }
};
var currentVersion = "0.3.0";
(function ($) {
    if (!SGPP.storage.containsItem("Version")) {
        SGPP.storage.clear();
        SGPP.storage.setItem("Version", currentVersion);
    }
    if (!SGPP.storage.containsItem(ModuleDefinition.Settings.SETTINGS_KEY)) {
        SGPP.storage.setItem(ModuleDefinition.Settings.SETTINGS_KEY, defaultModules);
    }
    for (var pos in modulesNames) {
        var m = new ModuleDefinition[modulesNames[pos]]();
        if (SGPP.settings.isModuleEnabled(modulesNames[pos]) && m.shouldRun(SGPP.location))
            SGPP.modules[modulesNames[pos]] = m;
    }
    for (var module in SGPP.modules) {
        SGPP.log("Module " + module + " append css.");
        SGPP.appendCSS(SGPP.modules[module].style);
        SGPP.log("Module " + module + " init() call.");
        SGPP.modules[module].init();
    }
    $(document).on("DOMContentLoaded", function () {
        SGPP.render();
        for (var module in SGPP.modules) {
            SGPP.log("Module " + module + " render() call.");
            SGPP.modules[module].render();
        }
    });
})(jQuery);
