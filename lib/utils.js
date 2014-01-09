var urllib = require('url');

var _ = require('lodash');
var cheerio = require('cheerio');
var request = require('request');


module.exports.parseIconsFromURL = parseIconsFromURL = function parseIconsFromURL(url) {
    request.get(url, function getPageResponse(err, response, body) {
        console.log('Processing URL:', DATA.url);
        if (err || response.statusCode !== 200) {
            return console.error('Could not fetch URL: ' + url + '\n', err);
        }
        return parseIconsFromBody(url, body);
    });
};

module.exports.parseIconsFromBody = parseIconsFromBody = function parseIconsFromBody(url, body) {
    var $ = cheerio.load(body);

    function getIcon(el) {
        var $el = $(el);
        var data = {
            url: urllib.resolve(url,
                                $el.attr('href') || $el.attr('content'))
        };
        var size = $el.attr('sizes');
        if (size) {
            size = size.split('x');
            data.width = parseInt(size[0], 10) || null;
            data.height = parseInt(size[1], 10) || null;
        }
        return data;
    }

    function $map(selector, cb) {
        var $el = $(selector);
        return $el.length ? _.map($el, cb) : [];
    }

    var parsedUrl = urllib.parse(url);
    var origin = parsedUrl.protocol + '//' + parsedUrl.host;
    var faviconURI = urllib.resolve(origin, '/favicon.ico');

    var icons = {
        favicons: faviconURI ? [{'url': faviconURI}] : null,
        shortcutIcons: $map('link[rel="shortcut icon"]', getIcon) || null,
        icons: $map('link[rel="icon"]', getIcon) || null,
        appleTouchIcons: $map('link[rel="apple-touch-icon"]', getIcon) || null,
        appleTouchIconsPrecomposed: $map(
            'link[rel="apple-touch-icon-precomposed"]', getIcon) || null,
        ogImages: $map('link[rel="og:image"]', getIcon).concat(
                $map('meta[property="og:image"]', getIcon)
            ) || null
    };

    return icons;
};

module.exports.getBestIcons = getBestIcons = function getBestIcons(url, body) {
    if (_.isObject(url)) {
        var icons = url;
    } else {
        var icons = parseIconsFromBody(url, body);
    }

    var largest = {};

    _.keys(icons).map(function(key) {
        if (_.isEmpty(icons[key])) {
            return largest[key] = [];
        }
        largest[key] = _.max(icons[key], function(icon) {
            return (icon.width || 1) + (icon.height || 1);
        });
    });

    return largest;
};

module.exports.getBestIcon = getBestIcon = function getBestIcon(url, body) {
    if (_.isObject(url)) {
        var icons = url;
    } else {
        var icons = getBestIcons(url, body);
    }

    var order = [
        'appleTouchIcons',
        'appleTouchIconsPrecomposed',
        'ogImages',
        'icons',
        'shortcutIcons',
        'favicons'
    ];

    // TODO: Consider actually downloading each image and checking dimensions.

    var largest = {};

    _.each(order, function(v) {
        if (!_.isEmpty(icons[v])) {
            largest = icons[v];
            return false;
        }
    });

    return largest;
};
