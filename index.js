const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

// Bien
let url = "https://kimetsu-no-yaiba.fandom.com/wiki/Kimetsu_no_Yaiba_Wiki";
let characterUrl = "https://kimetsu-no-yaiba.fandom.com/wiki/";

// Setup
const app = express();

app.use(bodyParser.json({limit: "50mb"}));
app.use(cors());
dotenv.config();
app.use(
    bodyParser.urlencoded({
        limit: "50mb",
        extended: true,
        parameterLimit: 50000,
    })
)

// Routes

// GET ALL CHARACTERS
app.get('/v1', (req, resp) => {
    const thumbnails = [];
    const limit = Number(req.query.limit);
    try {
        axios(url).then((res) => {
            const html = res.data;
            const $ = cheerio.load(html);
            $(".portal", html).each(function () {
                const name = $(this).find("a").attr("title");
                const url = $(this).find("a").attr("href");
                const img = $(this).find("a > img").attr("data-src");
                thumbnails.push({
                    name,
                    url: `https://anime-slayer-demo.onrender.com/v1${url.split("/wiki")[1]}`,
                    img
                })
            })
            if (limit && limit > 0) {
                resp.status(200).json(thumbnails.splice(0, limit));
            } else {
                resp.status(200).json(thumbnails);
            }
        })
    } catch (err) {
        resp.status(500).json(err)
    }
})

// GET A CHARACTER
app.get('/v1/:character', (req, resp) => {
    // v1/:character: ":" co nghia la req.params
    // console.log(req.params);
    let url = `${characterUrl}${req.params.character}`;
    console.log({url})
    let titles = [];
    let details = [];
    let characters = [];
    let characterObj = {};
    let galleries = [];

    try {
        axios(url).then((res) => {
            const html = res.data;
            const $ = cheerio.load(html);

            // get gallery
            $(".wikia-gallery-item",html).each(function(){
                const gallery = $(this).find("a > img").attr("data-src");
                galleries.push(gallery);
             })

            
            $("aside", html).each(function() {

                // get banner image
                const image = $(this).find("img").attr("src");

                // get the title of character title
                $(this).find("section > div > h3").each(function () {
                    titles.push($(this).text())
                });

                // get character details
                $(this).find("section > div > div").each(function() {
                    details.push($(this).text());
                })

                if (image !== undefined) {
                    // create obj with title as key and detail as value
                    for (let i = 0; i < titles.length; i++) {
                        characterObj[titles[i].toLowerCase()] = details[i];
                    }

                    characters.push({
                        name: req.params.character.replace("_", " "),
                        gallery: galleries,
                        image: image,
                        ...characterObj
                    }); // the samec characters.push(characters)  
                }
            })

            resp.status(200).json(characters);
        })
        
    } catch (err) {
        resp.status(500).json(err);
    }
})

// Run port
app.listen(process.env.PORT || 8080, () => {
    console.log('Server in running.....!')
})
