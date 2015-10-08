var wssMap = (function() {
    var private_token = 'pk.eyJ1IjoibGF1cmVuYmVuaWNob3UiLCJhIjoiQ1BlZGczRSJ9.EVMieITn7lHNi6Ato9wFwg';
    var private_map_id = 'laurenbenichou.54e91cf8';
    var api_url = '//central.youthradio.org/api/post/list'
    var spots;
    var narrative = $("#narrative")[0];
    var currentId = 'cover';
    var locations = {};
    locations.type = "FeatureCollection";


    // Initial cover TODO: add about + image for about icon
    locations.features = [{
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [37.812, -122.294]
        },
        properties: {
            id: "cover",
            zoom: 15
        }
    }, {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [37.806908, -122.269952]
        },
        properties: {
            id: "about",
            bg_icon: "images/youth_radio_80.png",
            bg_icon_active: "images/youth_radio_120.png"
        }
    }];

    // initmap function
    var initMap = function() {
        L.mapbox.accessToken = private_token;
        window.map = L.mapbox.map('map', private_map_id, {
            zoomControl: false
        }).setView([37.812, -122.294], 15);
        map.scrollWheelZoom.disable();
        spots = L.mapbox.featureLayer().addTo(map);
        getData();
        return map;
    };


    // Create json from data received from API
    var createGeojson = function(el) {
        var new_place = {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [el.location.geo["1"], el.location.geo["0"]]
            },
            properties: {
                id: el.css_id,
                bg_icon: el.icon.url,
                bg_icon_active: el.icon_active.url
            }
        };
        locations.features.push(new_place);
        return false;
    };


    // Get data from wss-backend API
    var getData = function() {
        // $.ajaxSetup({ cache: true });
        $.getJSON(api_url, function(data) {
            // if data is empty then return error
            if (data.posts.length == 0) return sweetAlert("Oops...", "Database is empty!", "error");

            // check if element should be visible or not
            var elements = data.posts;
            var visibleEl = checkPublishable(elements);
            // return Geojson
            return visibleEl.forEach(createGeojson);
        }).error(function(error) {
            var error_mge = "Something went wrong! Please try again later ";
            sweetAlert("Oops...", error_mge, "error");
        }).done(function(data) {

            // set geojson
            spots.setGeoJSON(locations);
            // define the css icon
            defineCssIcon(spots);

            // check if elements are draft and create dom section
            var visibleEl = checkPublishable(data.posts);
            createSections(visibleEl);

            // create click event
            markersOnClick();
        });
    };

    var checkPublishable = function(elements) {
        if (window.location.pathname == "/yristaging/") {
            return elements
        } else {
            var publishedElements = []
            elements.forEach(function(el) {
                if (el.state == "published") {
                    publishedElements.push(el)
                }
            });
            return publishedElements;
        }
    };

    var defineCssIcon = function(spots) {
        spots.eachLayer(function(e) {
            var className = 'map-icon icon-' + e.feature.properties.id;
            var coordinates = e.feature.geometry.coordinates;
            var html = "<div data-id='" + e.feature.properties.id + "'></div>";
            var cssIcon = L.divIcon({
                // Specify a class name we can refer to in CSS.
                className: className,
                // Set marker width and height
                iconSize: [80, 80],
                html: html
            });
            if (e.feature.properties.id === "about") {
                L.marker(coordinates, {
                    icon: cssIcon
                }).addTo(map).bindPopup('<h1> Youth Radio Interactive HQ </h1>');
            } else {
                L.marker(coordinates, {
                    icon: cssIcon
                }).addTo(map);
            }
            defineBgIcon(e);
        });

    };


    // Set background image for icon
    var defineBgIcon = function(e) {
        if (e.feature.properties.bg_icon && e.feature.properties.bg_icon_active) {
            var className = '.icon-' + e.feature.properties.id;
            var bg_img = 'url("https:' + e.feature.properties.bg_icon + '")';
            var bg_img_active = 'url("https:' + e.feature.properties.bg_icon_active + '")!important';
            var icon_active = className + '.active';
            // set css classes based on info from the data we received.
            $(className).css('background-image', bg_img);
            jss.set(icon_active, {
                'background-image': bg_img_active
            });

            if (e.feature.properties.id === 'about') {
                var bg_img = 'url("' + e.feature.properties.bg_icon + '")';
                var bg_img_active = 'url("' + e.feature.properties.bg_icon_active + '")!important';
                $(className).css('background-image', bg_img);
                jss.set(icon_active, {
                    'background-image': bg_img_active
                });
            }
        }
    };

    var createSections = function(data) {

        // sorts by .sortOrder number
        data.sort(function(a, b) {
            return b.sortOrder - a.sortOrder;
        }).forEach(function(d) {


            // create section
            var section = "<section id='" + d.css_id + "'></section>";

            // Append section to narrative div.
            $("#cover").after(section);
            var id = "#" + d.css_id;


            // create elements of section
            var title = "<h3>" + d.title + "</h3>";
            var description = d.description;
            var illustration = " <img class='feature-img' src='https:" + d.illustration.url + "'></img>";
            // append  elements
            $(id).append(title, illustration, description);

            // if audio exists, append it
            if (d.audio) {
                var audio = "<audio controls='controls' id='audio-player' src='https:" + d.audio.url + "'></audio>";
                $(id).append(audio);
            }

            // if audio exists, append it
            if (d.source) {
                var source = "<p><small><a href='" + d.source + "'" + "target='_blank'>Source</a></small></p>";
                $(id).append(source);
            }

            // if video exists, append it
            if (d.video) {
                var video = "<div class='videoWrapper'>" + d.video + "</div>";
                $(id).append(video);
            }


            // add bg color when active
            var id_active = id + ".active";
            jss.set(id_active, {
                'background-color': d.bg_color
            });

            // Create global section variable once all the sections have been created in the DOM
            window.sections = $('section');
        });
    };

    narrative.onscroll = function() {

        var narrativeHeight = narrative.offsetHeight;
        var newId = currentId;
        // Find the section that's currently scrolled-to.
        // We iterate backwards here so that we find the topmost one.
        for (var i = sections.length - 1; i >= 0; i--) {
            var rect = sections[i].getBoundingClientRect();
            if (rect.top >= 0 && rect.top / 0.5 <= narrativeHeight) {
                newId = sections[i].id;
            }
        }
        setId(newId);
    };

    function setId(newId) {
        // If ID hasn't change, do nothing
        if (newId === currentId) return;
        if (newId === 'cover') {
            $('body').attr('class', 'section-0');
        } else {
            $('body').attr('class', ' ');
        }
        // otherwise, iterate through layers, setting the current marker to a different style and zooming to it
        spots.eachLayer(function(layer) {
            if (layer.feature.properties.id === newId) {
                var coordinates = layer.feature.geometry.coordinates;
                var all_el = $(".map-icon");
                var el = $("div[class*='" + newId + "']")[0];
                all_el.removeClass("active");
                el.className = el.className + " active";
                if (newId === "cover") {
                    map.setView(coordinates, 15);
                } else {
                    map.setView(coordinates, 16);
                }
            }
        });
        // highlight the current section
        for (var i = 0; i < sections.length; i++) {
            sections[i].className = sections[i].id === newId ? 'active' : '';
        }
        // And then set the new id as the current one,
        // so that we know to do nothing at the beginning
        // of this function if it hasn't changed between calls
        currentId = newId;
    }


    function markersOnClick() {
        $(".map-icon").on("click", function() {
            var data = $(this).children().data().id;
            var id = "#" + data;
            window.location.hash = id;
            $("section").removeClass("active");
            $(id).addClass("active");
            setId(data);
            event.preventDefault();
        });
    }


    // return initMap function to be called onload
    return {
        initMap: initMap
    };

})();



// Adnimation function
var wssAnim = (function() {
    var fb_app_id = "459957714160273";

    var initAnim = function() {
        fullscreenFix();
        fadeOnClick();
        animateLogo();
        initSoc();
        $(window).resize(fullscreenFix);
    };

    /* fix vertical when not overflow
    call fullscreenFix() if .fullscreen content changes */
    var fullscreenFix = function() {
        var h = $('body').height();
        // set .fullscreen height
        $(".content-b").each(function() {
            if ($(this).innerHeight() <= h) {
                $(this).closest(".fullscreen").addClass("not-overflow");
            }
        });
    };


    var fadeOnClick = function() {
        var target = $("#splash");
        var target_two = $("#main-content-wrapper");
        $(".cust-button").on("click", function(e) {
            e.preventDefault();
            target.fadeOut("slow");
            target_two.addClass("visible");

        });
    };

    var animateLogo = function() {
        var target = $("#logo");
        setTimeout(function() {
            target.addClass("show");
        }, 500);
        setTimeout(function() {
            target.fadeIn();
            target.addClass("move-left");
            $(".target").addClass("show");
        }, 1500);
    };

    var initSoc = function() {
        new Share(".share-bttn", {
            networks: {
                facebook: {
                    app_id: fb_app_id
                },
                twitter: {
                    description: "West Side Stories: A New Interactive From Youth Radio Interactive via @youthradio."
                }
            }
        });
    };

    return {
        initAnim: initAnim
    };

})();


$(document).foundation();
$(document).ready(function() {
    wssMap.initMap();
    wssAnim.initAnim();
});