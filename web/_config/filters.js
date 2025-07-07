const CleanCSS = require("clean-css");
const {DateTime} = require("luxon");

const zoneCache = {};

const countZones = value => {
    if (zoneCache[value]) {
        return zoneCache[value];
    }

    const result = value
        .split(',')
        .map(x => x.trim())
        .filter(x => x !== '')
        .length;

    zoneCache[value] = result;
    return result;
}

const minifyCss = code => new CleanCSS({}).minify(code).styles;

const formatDate = (date) => { return DateTime.fromJSDate(date).setLocale('en').toFormat('dd LLLL yyyy') };

const htmlDateString = (date) => { return DateTime.fromJSDate(date, {zone: 'utc'}).toFormat('yyyy-LL-dd') };

const joinWithAnd = (s) => {
    const replaced = String(s).replace(/,/g, ' and ');
    return replaced;
};

const limitItems = (value, n = 2, sep = ',') => {
  if (!value) return '';
 
  const arr = Array.isArray(value)
    ? value
    : String(value).split(sep).map(s => s.trim()).filter(Boolean);

    let result = arr.slice(0, n).join(`${sep} `);
    //  console.log(result);
    return result;
};



module.exports = {
    countZones,
    minifyCss,
    formatDate,
    htmlDateString,
    joinWithAnd,
    limitItems
};
