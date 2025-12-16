const htmlmin = require("html-minifier");
const tocPlugin = require("eleventy-plugin-toc");
const Image = require("@11ty/eleventy-img");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const path = require("path");
const fs = require("fs");
const { DateTime } = require("luxon");

const markdownLib = require("./web/_config/plugins/markdown.js");

const {
    countZones,
    minifyCss,
    formatDate,
    htmlDateString,
    joinWithAnd,
    limitItems,
} = require("./web/_config/filters.js");

function wrapImageInFigure(image, caption, style = "") {
    if (caption === "missing") {
        return `<figure style="${style}">${image}</figure>`;
    } else if (caption === "") {
        return `<figure style="${style}">${image}</figure>`;
    } else {
        return `<figure style="${style}">${image}
        <span class="image-attribution rounded">${caption}</span></figure>`;
    }
}

async function coverImageShortcode(noteUrl, noteTitle, sizes = "") {
    fullSrc = "." + noteUrl + "cover.png"; // the full url e.g. src/notes/chess-engine/default-board.png
    console.log(`Optimizing image: ${fullSrc}`);

    const metadata = await Image(fullSrc, {
        formats: ["webp", "jpeg"],
        widths: [100, 200, 400, 800, "auto"],
        outputDir: "build/" + noteUrl,
        urlPath: `${noteUrl}`,
        filenameFormat: function (id, fullSrc, width, format, options) {
            return `cover-${width}w.${format}`;
        },
    });

    const imageAttributes = {
        alt: `Cover image for ${noteTitle}.`,
        sizes,
        loading: "lazy",
        decoding: "async",
    };

    // Generate image.
    return Image.generateHTML(metadata, imageAttributes, {
        whitespaceMode: "inline",
    });
}

async function imageShortcode(src, alt, sizes = "", caption = "", width = "") {
    const url = this.page.url; // the page url e.g. /notes/chess-engine

    const fullSrc = "./web" + url + src + ".png"; // the full url e.g. src/notes/chess-engine/default-board.png
    console.log(`Optimizing image: ${fullSrc}`);

    // Validation checks.
    if (alt === undefined) {
        throw new Error(`Missing \`alt\` on image: ${fullSrc}`);
    }

    const imgPath = url ? url : "img";
    // console.log(`imgPath [${imgPath}]`)

    // Set image generation metadata.
    const metadata = await Image(fullSrc, {
        formats: ["webp", "png"],
        widths: [200, 400, 800, 1200, "auto"],
        outputDir: "build/" + imgPath,
        urlPath: ".",
        filenameFormat: function (id, fullSrc, width, format, options) {
            return `${src}-${width}w.${format}`;
        },
    });

    const imageAttributes = {
        class: "fit-image",
        alt,
        sizes,
        style: `width:${width};`,
        loading: "lazy",
        decoding: "async",
        pagefindSrc: `../..${url}${src}-200w.webp`,
        pageFindAlt: `${src}`,
        "data-pagefind-meta": `image[pagefindSrc]`,
    };

    // Generate image.
    const html = Image.generateHTML(metadata, imageAttributes, {
        whitespaceMode: "inline",
    });

    return wrapImageInFigure(html, caption);
}

async function galleryShortcode(speciesName, caption = "") {
    const path = `data/species/${speciesName}`;
    let imageFiles;
    let attributionMetadata = {};

    // ✅ Safely attempt to read the directory
    try {
        imageFiles = fs.readdirSync(path)
            .filter((file) => /\.(jpg|png)$/i.test(file));
    } catch (err) {
        return "";
    }

    // Read metadata if exists
    const metadataPath = `${path}/metadata.json`;
    if (fs.existsSync(metadataPath)) {
        try {
            const raw = fs.readFileSync(metadataPath, "utf-8");
            attributionMetadata = JSON.parse(raw);
        } catch (err) {
            console.warn(`Error reading metadata for ${speciesName}:`, err);
        }
    }

    if (imageFiles.length === 0) {
        return "";
    }

    const html = await Promise.all(
        imageFiles.map(async function (file, index, arr) {
            const fileName = file.replace(/\.[^/.]+$/, "");
            const fullSrc = `${path}/${file}`;
            const meta = attributionMetadata[file] || {};
            const imageTitle = meta.title || "";
            const imageAttribution = meta.attribution || caption;

            const metadata = await Image(fullSrc, {
                formats: ["webp", "jpeg"],
                widths: [200, 400, 800, 1200, "auto"],
                outputDir: `build/plants/species/${speciesName}`,
                urlPath: `/plants/species/${speciesName}`,
                filenameFormat: function (id, fullSrc, width, format, options) {
                    return `${fileName}-${width}w.${format}`;
                },
            });

            const imageAttributes = {
                class: "fit-image",
                alt: `${speciesName}`,
                sizes: "(min-width: 30em) 50vw",
                loading: "lazy",
                decoding: "async",
                pagefindSrc:
                    `/plants/species/${speciesName}/${speciesName}-200w.webp`,
                pageFindAlt: `${speciesName}`,
                "data-pagefind-meta": `image[pagefindSrc]`,
            };

            const imageHtml = Image.generateHTML(metadata, imageAttributes, {
                whitespaceMode: "inline",
            });

            const imageHtmlWithCaption = wrapImageInFigure(
                imageHtml,
                imageTitle
                    ? `${imageTitle}<br>${imageAttribution}`
                    : imageAttribution,
                "width: 100%;",
            );

            // const imageHtmlWithCaption = wrapImageInFigure(imageHtml, caption, 'width: 100%;');

            return `<div class="slide fade" style="display: flex; width: 100%;">
            <span class="carousel__index rounded">${
                index + 1
            } / ${arr.length}</span>
            ${imageHtmlWithCaption}
        </div>`;
        }),
    );

    if (imageFiles.length === 1) {
        return html.join("\n");
    } else {
        return html.join("\n") +
            '<a class="prev" onclick="plusSlides(-1)">&#10094;</a>\n' +
            '<a class="next" onclick="plusSlides(1)">&#10095;</a>';
    }
}
async function speciesImageShortCode(
    speciesName,
    alt,
    sizes = "",
    caption = "",
    width = "",
) {
    const baseDir = path.join("data/species", speciesName);
    const jpgPath = path.join(baseDir, `${speciesName}.jpg`);
    const pngPath = path.join(baseDir, `${speciesName}.png`);
    const placeholderSrc = "https://placehold.co/600x400?text=No%20image%20yet";
    console.log(`Checking species image: ${jpgPath} or ${pngPath}`);
    if (alt === undefined) {
        throw new Error(`Missing \`alt\` on image: ${fullSrc}`);
    }

    let fullSrc;
    if (fs.existsSync(jpgPath)) {
        fullSrc = jpgPath;
    } else if (fs.existsSync(pngPath)) {
        fullSrc = pngPath;
    } else {
        console.warn(
            `Image not found: ${jpgPath} or ${pngPath}, using placeholder.`,
        );
        const html =
            `<img src="${placeholderSrc}" alt="${alt}" style="width:${width};" loading="lazy" decoding="async" class="fit-image">`;
        return wrapImageInFigure(html, caption);
    }

    const metadata = await Image(fullSrc, {
        formats: ["webp", "jpeg"],
        widths: [200, 400, 800, 1200, "auto"],
        outputDir: path.join("build/plants/species", speciesName),
        urlPath: `/plants/species/${speciesName}`,
        filenameFormat: function (id, src, width, format, options) {
            return `${speciesName}-${width}w.${format}`;
        },
    });

    const imageAttributes = {
        class: "fit-image",
        alt,
        sizes,
        style: width ? `width:${width};` : undefined,
        loading: "lazy",
        decoding: "async",
        pagefindSrc: `/plants/species/${speciesName}/${speciesName}-200w.webp`,
        pageFindAlt: speciesName,
        "data-pagefind-meta": `image[pagefindSrc]`,
    };

    const html = Image.generateHTML(metadata, imageAttributes, {
        whitespaceMode: "inline",
    });

    return wrapImageInFigure(html, caption);
}

async function speciesThumbnailShortCode(
    speciesName,
    alt,
    sizes = "",
    caption = "",
    width = "",
) {
    const fullSrc = `data/species/${speciesName}/${speciesName}.jpg`;
    const placeholderSrc = "https://placehold.co/600x400?text=No%20image%20yet";
    console.log(`Optimizing species image: ${fullSrc}`);

    if (alt === undefined) {
        throw new Error(`Missing \`alt\` on image: ${fullSrc}`);
    }

    try {
        const metadata = await Image(fullSrc, {
            formats: ["webp", "jpeg"],
            widths: [400, 800, 1200, "auto"],
            outputDir: `build/plants/species/${speciesName}`,
            urlPath: `/plants/species/${speciesName}`,
            filenameFormat: function (id, fullSrc, width, format, options) {
                return `${speciesName}-${width}w.${format}`;
            },
        });

        const imageAttributes = {
            class: "fit-image",
            alt,
            sizes,
            style: `width:${width};`,
            loading: "lazy",
            decoding: "async",
        };

        const html = Image.generateHTML(metadata, imageAttributes, {
            whitespaceMode: "inline",
        });

        return wrapImageInFigure(html, caption);
    } catch (error) {
        console.warn(
            `Image not found for species "${speciesName}", using placeholder.`,
        );

        // Return basic fallback image HTML
        const html =
            `<img src="${placeholderSrc}" alt="${alt}" style="width:${width};" loading="lazy" decoding="async" class="fit-image">`;

        return wrapImageInFigure(html, caption);
    }
}

async function genusImageShortCode(
    genusName,
    alt,
    sizes = "",
    caption = "",
    width = "",
) {
    const fullSrc = "data/genera/" + genusName + "/" + genusName + ".jpg";
    console.log(`Optimizing genus image: ${fullSrc}`);

    // Validation checks.
    if (alt === undefined) {
        throw new Error(`Missing \`alt\` on image: ${fullSrc}`);
    }

    // Set image generation metadata.
    const metadata = await Image(fullSrc, {
        formats: ["webp", "jpeg"],
        widths: [200, 400, 800, 1200, "auto"],
        outputDir: "build/plants/genera/" + genusName,
        urlPath: `/plants/genera/${genusName}`,
        filenameFormat: function (id, fullSrc, width, format, options) {
            return `${genusName}-${width}w.${format}`;
        },
    });

    const imageAttributes = {
        class: "fit-image",
        alt,
        sizes,
        style: `width:${width};`,
        loading: "lazy",
        decoding: "async",
        pagefindSrc: `/plants/genera/${genusName}/${genusName}-200w.webp`,
        pageFindAlt: `${genusName}`,
        "data-pagefind-meta": `image[pagefindSrc]`,
    };

    // Generate image.
    const html = Image.generateHTML(metadata, imageAttributes, {
        whitespaceMode: "inline",
    });

    return wrapImageInFigure(html, caption);
}

async function familiaImageShortCode(
    familiaName,
    alt,
    sizes = "",
    caption = "",
    width = "",
) {
    const fullSrc = "data/familiae/" + familiaName + "/" + familiaName + ".jpg";
    console.log(`Optimizing familia image: ${fullSrc}`);

    // Validation checks.
    if (alt === undefined) {
        throw new Error(`Missing \`alt\` on image: ${fullSrc}`);
    }

    // Set image generation metadata.
    const metadata = await Image(fullSrc, {
        formats: ["webp", "jpeg"],
        widths: [200, 400, 800, 1200, "auto"],
        outputDir: "build/plants/familiae/" + familiaName,
        urlPath: `/plants/familiae/${familiaName}`,
        filenameFormat: function (id, fullSrc, width, format, options) {
            return `${familiaName}-${width}w.${format}`;
        },
    });

    const imageAttributes = {
        class: "fit-image",
        alt,
        sizes,
        style: `width:${width};`,
        loading: "lazy",
        decoding: "async",
        pagefindSrc: `/plants/familiae/${familiaName}/${familiaName}-200w.webp`,
        pageFindAlt: `${familiaName}`,
        "data-pagefind-meta": `image[pagefindSrc]`,
    };

    // Generate image.
    const html = Image.generateHTML(metadata, imageAttributes, {
        whitespaceMode: "inline",
    });

    return wrapImageInFigure(html, caption);
}

async function absoluteImageShortcode(
    src,
    name,
    alt,
    sizes = "",
    caption = "",
    width = "",
) {
    fullSrc = "web" + src; // the full url e.g. src/notes/chess-engine/default-board.png
    console.log(`Optimizing image: ${fullSrc}`);

    // Validation checks.
    if (alt === undefined) {
        throw new Error(`Missing \`alt\` on image: ${fullSrc}`);
    }

    // Set image generation metadata.
    const metadata = await Image(fullSrc, {
        formats: ["webp", "jpeg"],
        widths: [400, 800, 1200, "auto"],
        outputDir: `build/${name}`,
        urlPath: `${name}`,
        filenameFormat: function (id, name, width, format) {
            return `${width}w.${format}`;
        },
    });

    const imageAttributes = {
        class: "fit-image",
        alt,
        sizes,
        style: `width:${width};`,
        loading: "lazy",
        decoding: "async",
    };

    // Generate image.
    const html = Image.generateHTML(metadata, imageAttributes, {
        whitespaceMode: "inline",
    });

    return wrapImageInFigure(html, caption);
}

module.exports = (eleventyConfig) => {
    // const nunjucksEnvironment = new Nunjucks.Environment(
    //     new Nunjucks.FileSystemLoader("src/_includes")
    // );
    // eleventyConfig.setLibrary("njk", nunjucksEnvironment);

    // Plugins.
    eleventyConfig.addPlugin(pluginRss);
    eleventyConfig.addPlugin(tocPlugin, {
        tags: ["h2", "h3"],
        wrapper: "",
        ul: true,
        flat: false,
    });
    eleventyConfig.setLibrary("md", markdownLib);

    // Custom filters.
    eleventyConfig.addFilter("zonecount", countZones);
    eleventyConfig.addFilter("cssmin", minifyCss);
    eleventyConfig.addFilter("prettydate", formatDate);
    eleventyConfig.addFilter("htmlDateString", htmlDateString);
    eleventyConfig.addFilter("joinWithAnd", joinWithAnd);
    eleventyConfig.addFilter("limitItems", limitItems);

    eleventyConfig.addFilter("limit", function (array, limit) {
        return array.slice(0, limit);
    });

    eleventyConfig.addFilter("length", function (value) {
        if (Array.isArray(value)) {
            return value.length;
        } else if (typeof value === "string") {
            return value.length;
        }
        return 0; // Return 0 for non-array or non-string values
    });

    eleventyConfig.addNunjucksFilter(
        "limit",
        (arr, limit) => arr.slice(0, limit),
    );

    eleventyConfig.addNunjucksAsyncFilter("jsmin", async function (
        code,
        callback,
    ) {
        try {
            const minified = await minify(code);
            callback(null, minified.code);
        } catch (err) {
            console.error("Terser error: ", err);
            // Fail gracefully.
            callback(null, code);
        }
    });

    eleventyConfig.addTransform("htmlmin", function (content) {
        // Prior to Eleventy 2.0: use this.outputPath instead
        if (this.page.outputPath && this.page.outputPath.endsWith(".html")) {
            try {
                let minified = htmlmin.minify(content, {
                    useShortDoctype: true,
                    removeComments: true,
                    collapseWhitespace: true,
                });
                return minified;
            } catch (err) {
                console.error("error: ", err);
            }
        }
        return content;
    });

    // Short codes.
    eleventyConfig.addAsyncShortcode("image", imageShortcode);
    eleventyConfig.addAsyncShortcode("speciesImage", speciesImageShortCode);
    eleventyConfig.addAsyncShortcode(
        "speciesThumbnail",
        speciesThumbnailShortCode,
    );
    eleventyConfig.addAsyncShortcode("genusImage", genusImageShortCode);
    eleventyConfig.addAsyncShortcode("familiaImage", familiaImageShortCode);
    eleventyConfig.addAsyncShortcode("absoluteimage", absoluteImageShortcode);
    eleventyConfig.addAsyncShortcode("coverImage", coverImageShortcode);

    eleventyConfig.addShortcode("today", () => `${new Date()}`);
    eleventyConfig.addFilter("parseDate", (dateObj) => {
        return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
    });

    eleventyConfig.addAsyncShortcode("gallery", galleryShortcode);

    // Collections.
    eleventyConfig.addCollection("species", (collection) => {
        return collection.getFilteredByGlob("./data/species/**/*.md");
    });
    eleventyConfig.addCollection("genera", (collection) => {
        return collection.getFilteredByGlob("./data/genera/**/*.md");
    });
    eleventyConfig.addCollection("familiae", (collection) => {
        return collection.getFilteredByGlob("./data/familiae/**/*.md");
    });
    eleventyConfig.addCollection("amendments", (collection) => {
        return collection.getFilteredByGlob("**/amendments/**/*.md");
    });

    // Hot reload.
    eleventyConfig.addWatchTarget("./web/assets");
    eleventyConfig.addWatchTarget("./web/pages");
    eleventyConfig.addWatchTarget("./data/species");
    eleventyConfig.addWatchTarget("./web/_includes");

    // Files to output directly.
    let outputFiles = ["./web/assets/**/*", "./web/**/*.{jpg}"];
    outputFiles.forEach((file) => {
        eleventyConfig.addPassthroughCopy(file);
    });

    eleventyConfig.addPassthroughCopy("CNAME");
    eleventyConfig.addPassthroughCopy("robots.txt");
    eleventyConfig.addPassthroughCopy("./web/assets/icons/favicon.png");

    eleventyConfig.addPassthroughCopy("web/favicon");
    // eleventyConfig.addPassthroughCopy("README.md");

    // Define a filter to check if the image exists
    eleventyConfig.addFilter("checkFamiliaImage", function (name) {
        const fs = require("fs");
        const path = require("path");

        // Path where images are stored
        const imagePath = path.join(
            __dirname,
            "data/familiae/",
            `${name}/`,
            `${name}.jpg`,
        );

        // Check if the image exists
        return fs.existsSync(imagePath);
    });

    // Define a filter to check if the image exists
    eleventyConfig.addFilter("checkSpeciesImage", function (name) {
        const fs = require("fs");
        const path = require("path");

        // Base path where images are stored
        const basePath = path.join(__dirname, "data/species", name);
        const jpgPath = path.join(basePath, `${name}.jpg`);
        const pngPath = path.join(basePath, `${name}.png`);

        // Check if either JPG or PNG image exists
        return fs.existsSync(jpgPath) || fs.existsSync(pngPath);
    });

    eleventyConfig.addFilter("emphasizeQuotes", function (text) {
        if (!text) return text;
        return text.replace(/(['"])(.*?)\1/g, "<em>$2</em>");
    });

    eleventyConfig.addFilter("linkify", function (text) {
        if (!text) return text;
        return text.replace(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="/$2">$1</a>');
    });

    eleventyConfig.addFilter("checkGenusImage", function (name) {
        const fs = require("fs");
        const path = require("path");

        // Path where images are stored
        const imagePath = path.join(
            __dirname,
            "data/genera/",
            `${name}/`,
            `${name}.jpg`,
        );

        // Check if the image exists
        return fs.existsSync(imagePath);
    });

    eleventyConfig.addFilter("formatCommonNames", function (names) {
        if (!names) return "";

        // Split string into array if it's not already an array
        if (typeof names === "string") {
            names = names.split(",").map((n) => n.trim()).filter((n) => n);
        }

        if (names.length === 0) {
            return "";
        }

        if (names.length === 1) {
            return names[0];
        }

        const allButLast = names.slice(0, -1).join(", ");
        const last = names[names.length - 1];
        return `${allButLast} or ${last}`;
    });

    eleventyConfig.addFilter("formatRegions", function (regions) {
        if (!regions) return "";

        // Split string into array if it's not already an array
        if (typeof regions === "string") {
            regions = regions.split(",").map((n) => n.trim()).filter((n) => n);
        }

        if (regions.length === 0) {
            return "";
        }

        // Limit to maximum of 3 regions
        regions = regions.slice(0, 3);

        if (regions.length === 1) {
            return regions[0];
        }

        const allButLast = regions.slice(0, -1).join(", ");
        const last = regions[regions.length - 1];
        return `${allButLast} and ${last}`;
    });

    // GEOJSON

    const fs = require("fs");
    const path = require("path");

    eleventyConfig.addFilter(
        "inlineGeoJSON",
        function (regionsObj, speciesSlug) {
            const normalize = (str) => str?.toUpperCase().trim();

            const parseList = (input) =>
                (typeof input === "string" ? input.split(",") : input || [])
                    .map((r) => normalize(r))
                    .filter(Boolean);

            const nativeRegions = parseList(regionsObj.native);
            const introducedRegions = parseList(regionsObj.introduced);

            const toFind = [
                ...nativeRegions.map((r) => ({ name: r, native: true })),
                ...introducedRegions.map((r) => ({ name: r, native: false })),
            ];

            let features = [];

            for (const level of [1, 2, 3, 4]) {
                const levelPath = path.join(
                    __dirname,
                    `data/geojson/level${level}.geojson`,
                );
                if (!fs.existsSync(levelPath)) {
                    console.warn(`Missing geojson level ${level}`);
                    continue;
                }

                const geo = JSON.parse(fs.readFileSync(levelPath, "utf-8"));
                const nameKey = `LEVEL${level}_NAM`;

                const matched = [];

                toFind.forEach((region, i) => {
                    const feature = geo.features.find(
                        (f) => normalize(f.properties[nameKey]) === region.name,
                    );
                    if (feature) {
                        const clone = JSON.parse(JSON.stringify(feature));
                        clone.properties = {
                            ...clone.properties,
                            native: region.native,
                            introduced: !region.native,
                        };
                        features.push(clone);
                        matched.push(i);
                    }
                });

                // Remove matched regions
                matched.reverse().forEach((i) => toFind.splice(i, 1));

                if (toFind.length === 0) break;
            }

            if (features.length === 0) {
                console.warn(`No matching regions for ${speciesSlug}`);
                return "";
            }

            const geojson = {
                type: "FeatureCollection",
                features,
            };

            return `<script>const data = ${JSON.stringify(geojson)};</script>`;
        },
    );

    eleventyConfig.addFilter("slug", function (input) {
        return input
            .toString()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/--+/g, "-")
            .trim();
    });

    eleventyConfig.addFilter(
        "excludeCurrent",
        function (collection, currentUrl) {
            return collection.filter((item) => item.url !== currentUrl);
        },
    );

    // eleventy.after hook
    eleventyConfig.on("eleventy.after", async function ({ dir }) {
        const inputPath = dir.output;
        const outputPath = path.join(dir.output, "pagefind");

        console.log("Creating Pagefind index of %s", inputPath);

        const pagefind = await import("pagefind");
        const { index } = await pagefind.createIndex();
        const { page_count } = await index.addDirectory({ path: inputPath });
        await index.writeFiles({ outputPath });

        console.log(
            "Created Pagefind index of %i pages in %s",
            page_count,
            outputPath,
        );
    });

    eleventyConfig.addGlobalData("generated", () => {
        let now = DateTime.local();
        return now.toFormat("dd LLLL yyyy 'at' h:mma");
    });

    return {
        dir: {
            input: ".",
            output: "build",
            includes: "web/_includes",
            layouts: "web/_layouts",
            data: "web/_data",
        },
    };
};
