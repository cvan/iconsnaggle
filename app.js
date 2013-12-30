var url = require('url');

var cheerio = require('cheerio');
var imagesize = require('imagesize');
var request = require('request');

var server = require('./server');
var utils = require('./lib/utils');


function getIconsView(req, res) {
    var DATA = req.params;
    console.log('\n' + new Date(), '[' + req.method + ']', req.url);

    var uri = url.parse(DATA.url);
    var origin = uri.protocol + '//' + uri.host;
    var faviconURI = url.resolve(origin, '/favicon.ico');

    var $;

    function icon() {
        var $this = $(this);
        var size = $this.attr('sizes') || '';
        var data = {url: url.resolve(origin, $this.attr('href'))};
        if (size = size.split('x')) {
            data.width = size[0];
            data.height = size[1];
        }
        return data;
    }

    request.get(DATA.url, function getPageResponse(err, response, body) {
        console.log('Processing URL:', DATA.url);

        if (err || response.statusCode !== 200) {
            console.error('Could not fetch URL: ' + DATA.url + '\n', err);
            return res.error(400, err);
        }

        $ = cheerio.load(body);

        var icons = {
            favicons: [],
            shortcutIcons: $('link[rel="shortcut icon"]').map(icon),
            icons: $('link[rel="icon"]').map(icon),
            appleTouchIcons: $('link[rel="apple-touch-icon"]').map(icon),
            appleTouchIconsPrecomposed: $(
                'link[rel="apple-touch-icon-precomposed"]').map(icon),
            ogImages: $('link[rel="og:image"]').map(icon)
        };

        request.get(faviconURI).pipe(function(favErr, favResponse, favBody) {
            console.log(favErr, favResponse, favBody)
            if (favErr || favResponse.statusCode !== 200) {
                console.log(
                    'Could not fetch favicon:', faviconURI + '\n', err);
                res.json(icons);
            } else {
                // TODO: Get size of favicon.
                icons.favicons = [
                    {url: faviconURI}
                ];
                console.log('Found favicon:', faviconURI);

var obj = new Image();
obj.width = 'imglocation.png';

                imagesize(favBody, function (imgErr, imgResult) {
                    console.log('->', imgErr, imgResult)
                    if (imgResult.width) {
                        icons.favicons[0].width = imgResult.width;
                    }
                    if (imgResult.height) {
                        icons.favicons[0].height = imgResult.height;
                    }
                    res.json(icons);
                    // req.abort();
                });
            }
        });
    });
}


server.get({
    url: '/icons',
    validation: {
        url: {
            description: 'Website URL (http/https)',
            isUrl: true
        }
    }
}, getIconsView);


server.get({
    url: '/best-icon',
    validation: {
        url: {
            description: 'Website URL (http/https)',
            isUrl: true
        },
        min_width: {
            description: 'Min width (in px); default: 16',
            isNumeric: true,
            isRequired: false
        },
        min_height: {
            description: 'Min height (in px); default: 16',
            isNumeric: true,
            isRequired: false
        },
    }
}, getIconsView);


server.listen(process.env.PORT || 5000, function() {
    console.log('%s listening at %s', server.name, server.url);
});
