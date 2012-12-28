//Title: Custom DropDown Scroll plugin
//Documentation:
//Author: 
//Website: 
//Twitter: 

(function ($) {

    $.fn.fescroll = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exists.');
        }
    };

    var methods = {},

    //Set defauls for the control
    defaults = {
        data: [],
        selectedItems: [],
        keepJSONItemsOnTop: false,
        width: 260,
        height: null,
        background: "#eee",
        selectText: "",
        defaultSelectedIndex: null,
        truncateDescription: true,
        imagePosition: "left",
        clickOffToClose: true,
        onSelected: function () { }
    },

    ddSelectHtml = '<div class="dd-select"><input class="dd-selected-value" type="hidden" /><a class="dd-selected"></a>' +
        '<span class="dd-pointer dd-pointer-down"></span></div>',
    ddOptionsHtml = '<ul class="dd-options"></ul>',

    //CSS for feScroll
    fescrollCSS = '<style id="css-fescroll" type="text/css">' +
                '.dd-select { border-radius:2px; border:solid 1px #ccc; position:relative; cursor:pointer; }' +
                '.dd-desc { color:#999; display:block; overflow: hidden; font-weight:normal; line-height: 1.4em; }' +
                '.dd-selected { overflow:hidden; display:block; padding:10px; font-weight:bold; }' +
                '.dd-pointer { width:0; height:0; position:absolute; right:10px; top:50%; margin-top:-3px; }' +
                '.dd-pointer-down { border:solid 5px transparent; border-top:solid 5px #000; }' +
                '.dd-pointer-up { border:solid 5px transparent !important; border-bottom:solid 5px #000 !important; margin-top:-8px; }' +
                '.dd-options{ border:solid 1px #ccc; border-top:none; list-style:none; box-shadow:0px 1px 5px #ddd; display:none; ' +
                    'position:absolute; z-index:2000; margin:0; padding:0;background:#fff; overflow:auto; }' +
                '.dd-option{ padding:10px; display:block; border-bottom:solid 1px #ddd; overflow:hidden; text-decoration:none; color:#333;' +
                    ' cursor:pointer;-webkit-transition: all 0.25s ease-in-out; -moz-transition: all 0.25s ease-in-out;' +
                    '-o-transition: all 0.25s ease-in-out;-ms-transition: all 0.25s ease-in-out; font-weight:bold; }' +
                '.dd-options > li:last-child > .dd-option{ border-bottom:none; }' +
                '.dd-selected-description-truncated { text-overflow: ellipsis; white-space:nowrap; }' +
                '.dd-option-selected { background:#6f6f6f; color:#fff; font-weight:bold; }' +
                '.dd-option-selected .dd-desc { color: #ccc; }' +
                '.dd-option-table { display:table; width:100%; }' +
                '.dd-option-table-leftcell { display:table-cell; vertical-align:middle; width:20px; }' +
                '.dd-option-table-rightcell { display:table-cell; padding-left:10px }' +
                '.dd-option-image, .dd-selected-image { vertical-align:middle; float:left; margin-right:5px; max-width:64px;}' +
                '.dd-image-right { float:right; margin-right:15px; margin-left:5px; }' +
                '.dd-container { position:relative;}​ .dd-selected-text { font-weight:bold }​</style>';

    //CSS styles are only added once.
    if ($('#css-fescroll').length <= 0) {
        $(fescrollCSS).appendTo('head');
    }

    //Public methods 
    methods.init = function (options) {
        //Preserve the original defaults by passing an empty object as the target
        var options = $.extend({}, defaults, options);
        var KEYCODE_LEFT = 37,
            KEYCODE_UP = 38,
            KEYCODE_RIGHT = 39,
            KEYCODE_DOWN = 40,
            KEYCODE_HOME = 36,
            KEYCODE_PGUP = 33,
            KEYCODE_PGDN = 34,
            KEYCODE_END = 35;

        //Apply on all selected elements
        return this.each(function () {
            var obj = $(this),
                data = obj.data('fescroll'),
                original = obj,
                placeholder = $('<div id="' + obj.attr('id') + '"></div>'),
                ddSelect = [],
                ddJson = options.data,
                ddOptions,
                indexValue,
                index,
                currentIndex,
                ulObject,
                totalOptions,
                offsetGap,
                listHeight,
                visibleItems,
                elemTop,
                elemBottom,
                pluginData = {
                    settings: options,
                    original: original,
                    selectedIndex: -1,
                    selectedItem: null,
                    selectedData: null
                };

            //If the plugin has not been initialized yet
            if (!data) {
                //Get data from HTML select options
                obj.find('option').each(function () {
                    var $this = $(this),
                        thisData = $this.data();

                    ddSelect.push({
                        text: $.trim($this.text()),
                        value: $this.val(),
                        selected: $this.is(':selected'),
                        checkbox: thisData.checkbox,
                        description: thisData.description,
                        imageSrc: thisData.imagesrc //keep it lowercase for HTML5 data-attributes
                    });
                });

                //Update Plugin data merging both HTML select data and JSON data for the dropdown
                if (options.keepJSONItemsOnTop) {
                    $.merge(options.data, ddSelect);
                }
                else {
                    options.data = $.merge(ddSelect, options.data);
                }

                //Replace HTML select with empty placeholder, keep the original
                obj.replaceWith(placeholder);
                obj = placeholder;

                //Add classes and append ddSelectHtml & ddOptionsHtml to the container
                obj.addClass('dd-container').append(ddSelectHtml).append(ddOptionsHtml);

                //Get newly created ddOptions and ddSelect to manipulate
                ddSelect = obj.find('.dd-select'),
                ddOptions = obj.find('.dd-options');

                //Set widths
                ddOptions.css({ width: options.width });
                ddSelect.css({ width: options.width, background: options.background });
                obj.css({ width: options.width });

                //Set height
                if (options.height != null) {
                    ddOptions.css({ height: options.height, overflow: 'auto' });
                }

                //Add ddOptions to the container. Replace with template engine later.
                indexValue = 0;
                $.each(options.data, function (index, item) {
                    if (item.selected) {
                        options.defaultSelectedIndex = index;
                    }
                    indexValue = indexValue + 1;
                    ddOptions.append('<li>' +
                        '<a class="dd-option" tabindex="' + indexValue + '">' +
                            '<div class="dd-option-table"><div class="dd-option-table-leftcell">' +
                            (item.checkbox ? '<input type="checkbox" class="dd-option-checkbox" value="">' : '') +
                            '</div> <div class="dd-option-table-rightcell">' +
                            (item.value ? ' <input class="dd-option-value" type="hidden" value="' + item.value + '" />' : '') +
                            (item.imageSrc ? ' <img class="dd-option-image' + (options.imagePosition == "right" ? 
                                ' dd-image-right' : '') + '" src="' + item.imageSrc + '" />' : '') +
                            (item.text ? ' <label class="dd-option-text">' + item.text + '</label>' : '') +
                            (item.description ? ' <small class="dd-option-description dd-desc">' + item.description + '</small>' : '') +
                            '</div></div>' +
                        '</a>' + '</li>'
                    );
                });

                //Save plugin data.
                obj.data('fescroll', pluginData);

                //Check if needs to show the select text, otherwise show selected or default selection
                if (options.selectText.length > 0 && options.defaultSelectedIndex == null) {
                    obj.find('.dd-selected').html(options.selectText);
                }
                else {
                    index = (options.defaultSelectedIndex != null && options.defaultSelectedIndex >= 0 && 
                                options.defaultSelectedIndex < options.data.length)
                            ? options.defaultSelectedIndex
                            : 0;
                    selectIndex(obj, index);
                }

                //EVENTS
                //Displaying options
                obj.find('.dd-select').on('click.fescroll', function () {
                    open(obj);
                });

                //Selecting an option
                obj.find('.dd-option').on('click.fescroll', function () {
                    selectIndex(obj, $(this).closest('li').index());
                });

                obj.find('.dd-option').on('keydown', function(event) {
                    currentIndex = $(this).closest('li').index();
                    ulObject = obj.find('.dd-options');
                    totalOptions = obj.find('.dd-option');
                    offsetGap = ulObject.offset().top;
                    listHeight = ulObject.height();

                    switch (event.keyCode) {
                        case KEYCODE_DOWN:
                            if(currentIndex < totalOptions.length - 1) {
                                currentIndex = currentIndex + 1;
                                selectIndex(obj, currentIndex);
                                totalOptions.get(currentIndex).focus();
                            }
                            break;
                        case KEYCODE_UP:
                            if (currentIndex > 0) {
                                currentIndex = currentIndex - 1;
                                selectIndex(obj, currentIndex);
                                totalOptions.get(currentIndex).focus();
                            }
                            break;
                        case KEYCODE_PGDN:
                            visibleItems = [];
                            totalOptions.each( function (ind) {
                                elemTop = $(totalOptions.get(ind)).offset().top;
                                elemBottom = elemTop + $(totalOptions.get(ind)).height();
                                if ( ( elemTop - offsetGap >= 0 ) && ( elemBottom - offsetGap <= listHeight ) ) {
                                    visibleItems.push(ind);
                                }
                            });
                            event.preventDefault();

                            if (currentIndex < visibleItems[visibleItems.length - 1]) {
                                currentIndex = visibleItems[visibleItems.length - 1];
                            }
                            else {
                                currentIndex = currentIndex + 3;
                                if (currentIndex > (totalOptions.length - 1)) {
                                    currentIndex = totalOptions.length - 1;
                                }
                                ulObject.scrollTo( 'li:eq(' + currentIndex + ')', 800 );
                            }
                            selectIndex(obj, currentIndex);
                            totalOptions.get(currentIndex).focus();
                            break;
                        case KEYCODE_PGUP:
                            visibleItems = [];
                            totalOptions.each( function (ind) {
                                elemTop = $(totalOptions.get(ind)).offset().top;
                                elemBottom = elemTop + $(totalOptions.get(ind)).height();
                                if ( ( elemTop - offsetGap >= 0 ) && ( elemBottom - offsetGap <= listHeight ) ) {
                                    visibleItems.push(ind);
                                }
                            });
                            if (currentIndex > visibleItems[0]) {
                                event.preventDefault();
                                currentIndex = visibleItems[0];
                            }
                            else {
                                currentIndex = currentIndex - 3;
                                if (currentIndex < 0) {
                                    currentIndex = 0;
                                }
                                ulObject.scrollTo( 'li:eq(' + currentIndex + ')', 800 );
                            }
                            selectIndex(obj, currentIndex);
                            totalOptions.get(currentIndex).focus();
                            break;
                    }
                });

                //Open the list by deault
                obj.find('.dd-select').trigger('click.fescroll');

                //Click anywhere to close
                if (options.clickOffToClose) {
                    ddOptions.addClass('dd-click-off-close');
                    obj.on('click.fescroll', function (e) { e.stopPropagation(); });
                    /*
                    $('body').on('click', function () {
                        $('.dd-click-off-close').slideUp(50).siblings('.dd-select').find('.dd-pointer').removeClass('dd-pointer-up');
                    });
                    */
                }
            }
        });
    };

    //Public method to select an option by its index
    methods.select = function (options) {
        return this.each(function () {
            if (options.index) {
                selectIndex($(this), options.index);
            }
        });
    }

    //Public method to open drop down
    methods.open = function () {
        return this.each(function () {
            var $this = $(this),
                pluginData = $this.data('fescroll');

            //Check if plugin is initialized
            if (pluginData) {
                open($this);
            }
        });
    };

    //Public method to close drop down
    methods.close = function () {
        return this.each(function () {
            var $this = $(this),
                pluginData = $this.data('fescroll');

            //Check if plugin is initialized
            if (pluginData) {
                close($this);
            }
        });
    };

    //Public method to destroy. Unbind all events and restore the original Html select/options
    methods.destroy = function () {
        return this.each(function () {
            var $this = $(this),
                pluginData = $this.data('fescroll');

            //Check if already destroyed
            if (pluginData) {
                var originalElement = pluginData.original;
                $this.removeData('fescroll').unbind('.fescroll').replaceWith(originalElement);
            }
        });
    }

    //Private: Select index
    function selectIndex(obj, index) {

        //Get plugin data
        var pluginData = obj.data('fescroll');

        //Get required elements
        var ddSelected = obj.find('.dd-selected'),
            ddSelectedValue = ddSelected.siblings('.dd-selected-value'),
            ddOptions = obj.find('.dd-options'),
            ddPointer = ddSelected.siblings('.dd-pointer'),
            selectedOption = obj.find('.dd-option').eq(index),
            selectedLiItem = selectedOption.closest('li'),
            settings = pluginData.settings,
            selectedData = pluginData.settings.data[index];

        //Highlight selected option
        obj.find('.dd-option').removeClass('dd-option-selected');
        obj.find('.dd-option-checkbox').attr('checked', false);
        selectedOption.addClass('dd-option-selected');
        selectedOption.find('.dd-option-checkbox').attr('checked', true);

        //Update or Set plugin data with new selection
        pluginData.selectedIndex = index;
        pluginData.selectedItem = selectedLiItem;
        pluginData.selectedData = selectedData;

        //Updating selected option value
        ddSelectedValue.val(selectedData.value);

        //BONUS! Update the original element attribute with the new selection
        pluginData.original.val(selectedData.value);
        obj.data('fescroll', pluginData);

        //Close options on selection
        //close(obj);

        //Adjust appearence for selected option
        adjustSelectedHeight(obj);

        //Callback function on selection
        if (typeof settings.onSelected == 'function') {
            settings.onSelected.call(this, pluginData);
        }
    }

    //Private: Close the drop down options
    function open(obj) {

        var $this = obj.find('.dd-select'),
            ddOptions = $this.siblings('.dd-options'),
            ddPointer = $this.find('.dd-pointer'),
            wasOpen = ddOptions.is(':visible');

        //Close all open options (multiple plugins) on the page
        $('.dd-click-off-close').not(ddOptions).slideUp(50);
        $('.dd-pointer').removeClass('dd-pointer-up');

        if (wasOpen) {
            ddOptions.slideUp('fast');
            ddPointer.removeClass('dd-pointer-up');
        }
        else {
            ddOptions.slideDown('fast');
            ddPointer.addClass('dd-pointer-up');

            //Automatically focus on the first option
            ddOptions.find('.dd-option')[0].focus();
        }

        //Fix text height (i.e. display title in center), if there is no description
        adjustOptionsHeight(obj);
    }

    //Private: Close the drop down options
    function close(obj) {
        //Close drop down and adjust pointer direction
        obj.find('.dd-options').slideUp(50);
        obj.find('.dd-pointer').removeClass('dd-pointer-up').removeClass('dd-pointer-up');
    }

    //Private: Adjust appearence for selected option (move title to middle), when no desripction
    function adjustSelectedHeight(obj) {

        //Get height of dd-selected
        var lSHeight = obj.find('.dd-select').css('height');

        //Check if there is selected description
        var descriptionSelected = obj.find('.dd-selected-description');
        var imgSelected = obj.find('.dd-selected-image');
        if (descriptionSelected.length <= 0 && imgSelected.length > 0) {
            obj.find('.dd-selected-text').css('lineHeight', lSHeight);
        }
    }

    //Private: Adjust appearence for drop down options (move title to middle), when no desripction
    function adjustOptionsHeight(obj) {
        obj.find('.dd-option').each(function () {
            var $this = $(this),
                lOHeight = $this.css('height'),
                descriptionOption = $this.find('.dd-option-description'),
                imgOption = obj.find('.dd-option-image');

            if (descriptionOption.length <= 0 && imgOption.length > 0) {
                $this.find('.dd-option-text').css('lineHeight', lOHeight);
            }
        });
    }

    function isScrolledIntoView(elem)
    {
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();

        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(elem).height();

        return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
    }

})(jQuery);