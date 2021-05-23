// global variables
var resultURLS = [];

// crawlers
var animefeverCrawler= new XMLHttpRequest();
var hanimeCrawler= new XMLHttpRequest();
// dummy value in case something goes wrong
var hostname = "Not loaded";

// utility Functions to be called by various things at various times when needed

// loads on index.html load
function onLoad() {
    var input = document.getElementById("anime_search");
    // add listener so "enter" can be used to search
    input.addEventListener("keyup", function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            // click hidden button that triggers searchAnime()
            document.getElementById("SearchBtn").click();
        }
    });
}

async function fetchDetails() {
    // Sort URLS by length (shorter URLS have higher hit chance)
    sortedURLS = resultURLS.sort((a,b) => a.length - b.length);
    for (let i = 0; i < resultURLS.length; i++) {
        // punch in the URL list to getAnimeDetails() and wait a bit for the API to load
        await getAnimeDetails(sortedURLS[i], true);
        await sleep(800);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }



function removeOldData() {

    // remove List
    $(document).ready(function () {
        $('#seriesList > *').remove();
    });

    // remove data
    localStorage.removeItem("cleanTitle");
    localStorage.removeItem("directLink");
    localStorage.removeItem("numberOfEpisodes");
    localStorage.removeItem("EpisodesArray");
    localStorage.removeItem("Dub/Sub");
    localStorage.removeItem("AnimeCoverImageURL");
    localStorage.removeItem("animeDesc");
    localStorage.removeItem("animeScore");

    // delete all resultURLs
    resultURLS = [];

}

// finds hostname from "x" URL z.B. https://www.google.com/search
function hostnameFinder(x) {
    // splits URL in array, indexed after each "/""
    var pathArray = x.split( '/' );
    var url = pathArray[2];
    // -> [0] https:/ ; [1] / ; [2] www.google.com ; [3] /search
    return url;
    // url = z.B. "google.com"
} 

// ------- algorithm begin! --------


// main function that gets execed when 'enter' has been pressed
function searchAnime() {

    // remove Data from local storage if present, so stuff doesn't get piled up
    removeOldData();

    // basically 1:1 what gets typed in by the user
    var UncleanedRequestedAnime = document.getElementById("anime_search").value;

    // replace " " with "+""
    var requestedAnime = UncleanedRequestedAnime.split(' ').join("+");
    
    // search URL
    // hardset temporarily until other sites get implemented
    var animefeverURL = "https://animefever.nz/search/"+requestedAnime;  


    // Look for animes on animefever.nz
    animefeverCrawler.open("GET", animefeverURL, true);
    animefeverCrawler.responseType = "document";
    animefeverCrawler.onload = function()
    {
        if(animefeverCrawler.readyState == 4 && animefeverCrawler.status == 200) 
            {                 
                // select all animes in a list
                var findAnime = animefeverCrawler.responseXML.querySelectorAll(".card-container .card-wrapper>a");

                // searchResults is an array of all found animes
                var searchResults = Array.from(findAnime);
                
                for (i = 0; i < searchResults.length; i++) {
                    resultString = searchResults[i].toString();
                    if (resultString.search("dub") != -1) {
                        // If -1 is output, then there is no dub in title

                        // resultURLS are all found dubs in an Array
                        resultURLS.push(resultString);
                    }
                } fetchDetails();
            }
    };
    animefeverCrawler.onerror = function()
    {
        console.error("Error! ", animefeverCrawler.status, animefeverCrawler.statusText);
    }
    animefeverCrawler.send();
}

// Site specific
// needs to be adjusted for every site
async function getAnimeDetails(x, draw) 
{
    animefeverCrawler.open("GET", x, true);
    animefeverCrawler.responseType = "document";
    animefeverCrawler.onload = async function() {
        if(animefeverCrawler.readyState == 4 && animefeverCrawler.status == 200) {      

            // Episodes in an unsorted Array
            var REVepisodes = animefeverCrawler.responseXML.querySelectorAll(".episodes-container a");

            // Episode links in a sorted Array
            var episodes = Array.from(REVepisodes).reverse();

            // number of Episodes
            var numberOfEpisodes = episodes.length;
            
            

            // Title
            var title = animefeverCrawler.responseXML.querySelectorAll(".anime-name");
            var cleanTitle = title[0].textContent;

            // source
            var source = hostnameFinder(x);

            console.log("Title: ", cleanTitle);
            console.log("Number of episodes: " , numberOfEpisodes);
            console.log("Host: ", source);
            console.log("direct link: ", x)
            console.log("--------------------------------------------");
        } 
        
        // draw == true means series list is supposed to be drawn
        // data is only passed through to drawAnimeDetail(); Nothings gets stored
        if(draw == true) {
            drawAnimeDetails(cleanTitle, numberOfEpisodes, x, episodes, source);
        } else {

            // else means User clicked on specific Anime and its data should be stored

            localStorage.setItem("cleanTitle", cleanTitle);
            localStorage.setItem("numberOfEpisodes", numberOfEpisodes);
            localStorage.setItem("directLink", x);
            localStorage.setItem("EpisodesArray", episodes);
            localStorage.setItem("Dub/Sub", "dub"); // TODO add dub/sub change

            // create a title compatible with MAL API
            // optimized for animefever.nz !
            function searchableTitleAnimefevernz() {
                var lowerCased = cleanTitle.toLowerCase();
                // remove the " (dub)" part from the title
                var replaced = lowerCased.replace(" (dub)", "");
                // remove spaces and replace with "_", like in MAL
                var finalTitle = replaced.split(' ').join("_");
                return finalTitle;
                // e.g. "anime_title"
            }


            // get all MAL details with the now created compatible title
            // figure out which function to run via hostname
            // x = directLink
            if (hostnameFinder(x) == "animefever.nz") {
                console.log("host is recognized as Animefever");
                getMALdetails(searchableTitleAnimefevernz());
            }
        
            // load animation: Animation has to play for <2.4s
            var loadingBar = document.createElement("div");
            loadingBar.setAttribute("id", "loadingBar");

            var loadingBarWrapper = document.createElement("div");
            loadingBarWrapper.setAttribute("id", "loadingBarWrapper");
            loadingBarWrapper.appendChild(loadingBar);

            var loadingText = document.createElement("span");
            loadingText.setAttribute("id", "loadingText");
            loadingText.setAttribute("class", "cortado_reg");
            loadingText.innerText = "Loading...";

            var animationWrapper = document.createElement("div");
            animationWrapper.setAttribute("id", "loadingAnimationWrapper");

            animationWrapper.appendChild(loadingText);
            animationWrapper.appendChild(loadingBarWrapper);
            
            contentWraper = document.getElementById("body");
            contentWraper.prepend(animationWrapper);

            // Redirect to details after waiting 2.4s for API
            await sleep(2400);
            window.open('details.html', '_blank');
        }
        // Why is this marked out?
        // return drawAnimeDetails(title, numberOfEpisodes, episodes);
    };
    animefeverCrawler.onerror = function() 
    {
        console.error("Error! ", animefeverCrawler.status, animefeverCrawler.statusText);
    }
    animefeverCrawler.send();
    
}



// Not site-specific. Uses Internal variables
function drawAnimeDetails(cleanTitle, numberOfEpisodes, directLink, episodes, source) {

        //dd[0].innerText = x[0].textContent;
        //dd[1].innerText = y;

        // x = cleanTitle
        // y = Number of Episodes
        // z = episodes
        directLink = directLink;
        var seriesList = document.getElementById("seriesList"),
        div = document.createElement("div"),
        entry_title = document.createElement("span"),
        numberEpisodes = document.createElement("span"),
        sourceName = document.createElement("span"),
        clone;

        createElements = function() {
            clone = div.cloneNode();
            // Append stuff
            clone.appendChild(entry_title);
            clone.appendChild(numberEpisodes);
            clone.append(sourceName);

            // set Text content
            entry_title.textContent = cleanTitle;
            numberEpisodes.textContent =  "Episodes: " + numberOfEpisodes;
            sourceName.textContent = source;

            // set Attributes
            clone.setAttribute("class", "list_entry pointer");
            clone.setAttribute("onclick", "getAnimeDetails('" + directLink  + "', false);");

            entry_title.setAttribute("class", "entry_title mont_semiBold");
            numberEpisodes.setAttribute("class", "number_of_episodes mont_light");
            sourceName.setAttribute("class", "source mont_italic");

            seriesList.appendChild(clone);
        };

        createElements();

}


// Everything here is for Details.html !!
 
// global variables
var animeCoverImage;
var animeDescription;
var animeScore;

// run getMALdetails with the title as parameter
// returns description, CoverImage and Score
// gets called for 1 specific anime only!
function getMALdetails(AnimeTitle) {
    
    var request = new XMLHttpRequest();
    request.responseType = "json";
    var animeURL = "https://api.jikan.moe/v3/search/anime?q="+AnimeTitle;
    request.open("GET" , animeURL , true);
    request.onload = function (x) 
    {
        if(request.readyState == 4 && request.status == 200) 
        {
            var resultDocument = request.response.results[0];
            // check resultDocument == request.response.result[i]
            // make array
            var animeTitleSpace = AnimeTitle.split("_").join(" ");
            console.log("Looking for: " , animeTitleSpace);
            for(i = 0; i < request.response.results.length; i++) {
                // "title in JSON"
                
                var responseAnimeTitles = request.response.results[i].title.toLowerCase();
                
                if (responseAnimeTitles === animeTitleSpace) {
                    var matchedResult = request.response.results[i];
                    console.log("Matched result: " ,matchedResult);
                }
            }

            animeCoverImage = matchedResult.image_url;
            animeDescription = matchedResult.synopsis;
            animeScore = matchedResult.score;

            localStorage.setItem("AnimeCoverImageURL", animeCoverImage);
            localStorage.setItem("animeDesc", animeDescription);
            localStorage.setItem("animeScore", animeScore);
        }
    };

    request.onerror = function()
    {
        console.error("Error! ", request.status, request.statusText);
    }
    request.send();
}



// create Elements with all gathered Data
// Is specific for only 1 Anime. Does not work with multiples !
async function drawDetails() {
    
    //  get all infos: Now really easy! No private Variable problems!!  ^_^
    var AnimeTitle = localStorage.getItem("cleanTitle");
    var AnimeDirectLink = localStorage.getItem("directLink");
    var AnimeNumberOfEpisodes = localStorage.getItem("numberOfEpisodes");
    var AnimeEpisodeString = localStorage.getItem("EpisodesArray");
    var dubOrSub = localStorage.getItem("Dub/Sub");
    var CoverImageURL = localStorage.getItem("AnimeCoverImageURL");
    var animeDescription = localStorage.getItem("animeDesc");
    var animeScore = localStorage.getItem("animeScore");

    


    var AnimeEpisodeArray = AnimeEpisodeString.split(',');

    // get origin URL
    hostname = hostnameFinder(AnimeDirectLink);

    // Draw episodes as List
    var episodesList = document.getElementById("gridContainer"),
    // dont delete this, I'm pretty sure the program needs that
    gridItem = document.createElement("span"),
    clone;

    AnimeEpisodeArray.forEach(function(episode, index) {

        clone = episodesList.cloneNode();
        clone.textContent = "Episode " +  (index + 1);
        // remove comment for working episode
        //clone.setAttribute("onclick", "window.open(" + "'" + episode + "', '_blank'" + "); ");
        clone.setAttribute("onclick", "window.open(https://www.google.com); ");
        clone.setAttribute("class", "gridItem mont_light pointer");
        episodesList.appendChild(clone);
    }); 

    // Draw Anime Title

    var title = document.getElementById("titleWrapper"),

    // Anime Title
    titleElement = document.createElement("span");

    // Title Shadow
    titleShadow = document.createElement("span");

    //set attributes
    titleElement.setAttribute("class", "cortado_reg");
    titleElement.setAttribute("id", "animeTitle");
    titleElement.textContent = AnimeTitle;

    titleShadow.setAttribute("class", "cortado_reg");
    titleShadow.setAttribute("id", "animeTitleShadow");
    titleShadow.textContent = AnimeTitle;

    // Append Shadow to Title Element
    titleElement.appendChild(titleShadow);

    title.appendChild(titleElement);

    // draw tags

    var tags = document.getElementById("AnimeTags");

    numberTag = document.createElement("span");
    numberTag.setAttribute("class", "tagItem mont_light pointer");
    numberTag.textContent = AnimeNumberOfEpisodes + " Episoden";
    tags.appendChild(numberTag);

    dubSubTag = document.createElement("span");
    dubSubTag.setAttribute("class", "tagItem mont_light pointer");
    dubSubTag.textContent = dubOrSub;
    tags.appendChild(dubSubTag);

    originTag = document.createElement("span");
    originTag.setAttribute("class", "tagItem mont_light pointer");
    originTag.textContent = hostname;
    tags.appendChild(originTag);

    scoreTag = document.createElement("span");
    scoreTag.setAttribute("class", "tagItem mont_light pointer");
    scoreTag.textContent = "Score: " + animeScore;
    tags.appendChild(scoreTag);

    // draw description
    var findDescription = document.getElementById("description");
    findDescription.textContent = animeDescription;
    
    // draw cover Image
    var findImageTag = document.getElementById("coverImage");
    findImageTag.setAttribute("src", CoverImageURL)
    
}