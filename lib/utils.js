module.exports.slugify = function slugify(text) {
    if (typeof text !== 'string') {
        return text;
    }
    return text.toString().toLowerCase()
               .replace(/\/+/g, '-')      // Replace all / with single -
               .replace(/\s+/g, '-')      // Replace spaces with -
               .replace(/[^\w\-]+/g, '')  // Remove all non-word chars
               .replace(/\-\-+/g, '-')    // Replace multiple - with single -
               .replace(/^-+/, '')        // Trim - from start of text
               .replace(/-+$/, '');       // Trim - from end of text
};
