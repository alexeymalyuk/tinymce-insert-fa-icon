/**
*   Copyright 2017, Unicreo
*   Released under LGPL License.
*   Author: Alexey Malyuk
 *  Contact: alexeymalyuk@gmail.com
*/

tinymce.PluginManager.add('faicon', function (editor, url) {
    function createIconsList(callback) {
        return function () {
            var rawFile = new XMLHttpRequest();
            rawFile.overrideMimeType("application/json");
            rawFile.open("GET", url + '/icons.json', true);
            rawFile.onreadystatechange = function () {
                if (rawFile.readyState === 4 && rawFile.status == "200") {
                    callback(rawFile.responseText);
                }
            }
            rawFile.send(null);
        };
    }

    function showDialog(iconsJSON) {
        var dialogApi, filter, searchStr;
        var icons = tinymce.util.JSON.parse(iconsJSON);

        if (!icons || icons.length === 0) {
            var message = editor.translate('No icons found.');
            editor.notificationManager.open({ text: message, type: 'info' });
            return;
        }

        // Generate html with icons set
        function createIconsHtml(array) {
            gridHtml = '<table id="iconspanel" role="presentation" cellspacing="0" class="mce-charmap"><tbody>';
            var width = Math.min(array.length, 25);
            var height = Math.ceil(array.length / width);

            for (y = 0; y < height; y++) {
                gridHtml += '<tr>';

                for (x = 0; x < width; x++) {
                    var index = y * width + x;
                    if (index < array.length) {
                        var icon = array[index];

                        gridHtml += (
                            '<td title="' + icon.id + '" style="text-align: center; padding: 2px; border: none;">' +
                            '<span class="fa fa-' + icon.id + '" title="' + icon.name + '" style="font-size: 18px;"></span>' +
                            '</td>'
                        );
                    } else {
                        gridHtml += '<td style="border: none;" />';
                    }
                }

                gridHtml += '</tr>';
            }

            gridHtml += '</tbody></table>';

            return gridHtml;
        }

        // Filter icons set by category and by search text
        function filterIcons() {
            var items = icons;

            // Filter by category selector
            if (filter !== undefined && filter !== null && filter !== '') {
                if (filter.length > 3) {
                    items = icons.filter(function (icon) {
                        if (icon.categories.includes(filter)) {
                            return icon;
                        }
                    });
                }
            }

            // Filter by text search
            if (searchStr !== undefined && searchStr !== null && searchStr !== '') {
                items = items.filter(function (icon) {
                    var existInSearchTerms = false;
                    var existInName = false;

                    if (icon.filter !== undefined && icon.filter !== null && icon.filter !== '') {
                        existInSearchTerms = icon.filter.map((a) => { return a.toLowerCase() }).includes(searchStr.toLowerCase())
                    }

                    if (icon.name !== undefined && icon.name !== '' && icon.name.length > 0) {
                        existInName = icon.name.toLowerCase().includes(searchStr.toLowerCase());
                    }

                    if (existInSearchTerms || existInName) {
                        return icon;
                    }
                });
            }

            return createIconsHtml(items);
        }

        // Change icons set on category filter select
        function onCategorySelect(e) {
            filter = e.control.value();
            var iconspanel = dialogApi.find('#iconspanel');
            iconspanel[0].getEl().innerHTML = filterIcons();
        }

        // Change icons set on search text input
        function onSearchInput(e) {
            searchStr = e.control.value();
            var iconspanel = dialogApi.find('#iconspanel');
            iconspanel[0].getEl().innerHTML = filterIcons();
        }

        // Plugin dialog init
        dialogApi = editor.windowManager.open({
            title: 'Insert icon',
            layout: 'flex',
            direction: 'column',
            align: 'stretch',
            padding: 15,
            spacing: 10,
            items: [
                {
                    type: 'form',
                    flex: 0,
                    padding: 0,
                    items: [
                        {
                            type: 'listbox',
                            label: 'Icon categories',
                            name: 'categories',
                            onselect: onCategorySelect,
                            values: [
                                { text: 'All Categories', value: '' },
                                { text: 'Accessibility Icons', value: 'Accessibility Icons' },
                                { text: 'Brand Icons', value: 'Brand Icons' },
                                { text: 'Chart Icons', value: 'Chart Icons' },
                                { text: 'Accessibility Icons', value: 'Accessibility Icons' },
                                { text: 'Currency Icons', value: 'Currency Icons' },
                                { text: 'Directional Icons', value: 'Directional Icons' },
                                { text: 'File Type Icons', value: 'File Type Icons' },
                                { text: 'Form Control Icons', value: 'Form Control Icons' },
                                { text: 'Gender Icons', value: 'Gender Icons' },
                                { text: 'Hand Icons', value: 'Hand Icons' },
                                { text: 'Payment Icons', value: 'Payment Icons' },
                                { text: 'Spinner Icons', value: 'Spinner Icons' },
                                { text: 'Text Editor Icons', value: 'Text Editor Icons' },
                                { text: 'Transportation Icons', value: 'Transportation Icons' },
                                { text: 'Video Player Icons', value: 'Video Player Icons' },
                                { text: 'Web Application Icons', value: 'Web Application Icons' },
                            ]
                        },
                        {
                            type: 'textbox',
                            name: 'icon-name',
                            placeholder: 'Type icon name...',
                            disabled: false,
                            maximized: false,
                            onkeyup: onSearchInput
                        }
                    ]
                },
                {
                    type: 'container',
                    name: 'iconspanel',
                    html: filterIcons(),
                    onclick: function (e) {
                        var target = e.target;
                        target.removeAttribute('title');
                        target.removeAttribute('style');

                        var sel = editor.selection.getNode();
                        if (sel.hasAttribute('contenteditable')) {
                            var contenteditable = sel.getAttribute('contenteditable');

                            if (contenteditable === "false") {
                                target.setAttribute('contenteditable', false);
                            }
                        }

                        insertFaicon(target.outerHTML);

                        if (!e.ctrlKey) {
                            dialogApi.close();
                        }
                    }
                }
            ],
            buttons: [],
            minWidth: 720,
            minHeight: 300
        });
    }

    // Insert selected icon to tinymce editor
    function insertFaicon(html) {
        var sel = editor.selection.getNode();
        if (sel.innerHTML.length == 0) {
            sel.outerHTML = html;
        } else {
            if (editor.selection.getNode().textContent === '') {
                html += '&nbsp;';
            }
            editor.execCommand('mceInsertContent', false, html);
        }
    }

    // Toolbar button
    editor.addButton('faicon', {
        text: 'Insert icon',
        tooltip: 'Insert icon',
        icon: false,
        onclick: createIconsList(showDialog)
    });

    // Menu and right click menu button
    editor.addMenuItem('faicon', {
        icon: 'info',
        text: 'Insert icon',
        onclick: createIconsList(showDialog),
        context: 'insert'
    });
});