var cheerio = require('cheerio');
var parserUtil = require('./parserUtil');

module.exports = new (function() {
    this.parse = function(html) {

        var $ = cheerio.load(html);

        var menu = new Array();
        var todayNameRegex = new RegExp("^\\s*" + global.todaysDate.format("dddd"), "i");

        $('td.cnt', '#contentBox').children('table').each(function() {
            var precedingText = "";
            $(this).prevUntil('table').each(function() {
                precedingText = $(this).text() + precedingText;
            });
            if (todayNameRegex.test(precedingText))
            {
                menu = parseMenu($(this), precedingText);
                return false;
            }
        });

        return menu;

        function parseMenu(table, mixedText) {
            var temp = [];
            if (mixedText.match(/zatvorené/i))
            {
                temp.push({ isSoup: false, text: "Dnes nie je menu", price: NaN });
                return temp;
            }
            table.find('tr').each(function() {
                var txt = normalize($(this).text());
                var priced = parserUtil.parsePrice(txt);
                if (txt) temp.push({ isSoup: false, text: priced.text, price: priced.price });
            });

            var m = /Polievk.*:(.+)Špec.*:(.+)delená.*:(.+)$/i.exec(mixedText);
            if (m)
            {
                for (var i = 3; i > 1; i--)
                {
                    var txt = normalize(normalize(m[i]));
                    var priced = parserUtil.parsePrice(txt);
                    temp.unshift({ isSoup: false, text: priced.text, price: priced.price });
                }
                //soups (group 1)
                var soups = m[1].split(/€ ?,/);
                for (var i = soups.length - 1; i >= 0; i--)
                {
                    var txt = normalize(soups[i] + (i !== soups.length - 1 ? "€" : "")); //add back € to all items except last
                    var priced = parserUtil.parsePrice(txt);
                    temp.unshift({ isSoup: true, text: priced.text, price: priced.price });
                }
            }
            return temp;
        }

        function normalize(str) {
            return str.trim()
                .removeDoubleWhitespace()
                .removeItemNumbering()
                .removeMetrics()
                .toLowerCase()
                .capitalizeFirstLetter();
        }
    };
})();
