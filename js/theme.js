/* ========================================================================
 * Angle: theme.js
 * Map Shortcode Javascript file
 * ========================================================================
 * Copyright 2014 Oxygenna LTD
 * ======================================================================== */

'use strict';

// ignore camel case because it breaks jshint for vars from php localisation
/* jshint camelcase: false */

/* global jQuery: false, skrollr: false */

// If script is not localized apply defaults
var scriptData = scriptData || {
    navbarHeight : 90,
    navbarScrolled : 70,
    navbarScrolledPoint : 200,
    scrollFinishedMessage : 'No more items to load.',
    hoverMenu : {
        hoverActive : false,
        hoverDelay : 1,
        hoverFadeDelay : 200
    }
};

var initScrollr = false;

jQuery(document).ready(function( $ ) {
    // Parallax Scrolling - on desktops only - Full height sections fix for ios
    // ======================
    if(!(/Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i).test(navigator.userAgent || navigator.vendor || window.opera)){
        initScrollr = true;
    } else {
        // Assign the 'oxy-agent' class when not assigned by PHP - for the html Version
        // ======================
        $('body:not([class*="oxy-agent-"])').addClass('oxy-agent-');
        if((/iPhone/i).test(navigator.userAgent || navigator.vendor || window.opera)){
            $('body').not('.oxy-agent-iphone').addClass('oxy-agent-iphone');
        }
        if((/iPad/i).test(navigator.userAgent || navigator.vendor || window.opera)){
            $('body').not('.oxy-agent-ipad').addClass('oxy-agent-ipad');
        }
    }

    function magnificInit() {
         // Magnific Image Popup
        // ======================

        $('.magnific').magnificPopup({
            type:'image',
            removalDelay: 300,
            mainClass: 'mfp-fade'
        });

        // Magnific Video Popup
        // ======================

        $('.magnific-youtube, .magnific-vimeo, .magnific-gmaps').magnificPopup({
            disableOn: 700,
            type: 'iframe',
            mainClass: 'mfp-fade',
            removalDelay: 300,
            preloader: false,
            fixedContentPos: false
        });

        // Magnific Gallery Popup
        // ======================

        $('.magnific-gallery').each(function(index , value){
            var gallery = $(this);
            var galleryImages = $(this).data('links').split(',');
            var items = [];
            for(var i=0;i<galleryImages.length; i++){
                items.push({
                    src:galleryImages[i],
                    title:''
                });
            }
            gallery.magnificPopup({
                mainClass: 'mfp-fade',
                items:items,
                gallery:{
                    enabled:true,
                    tPrev: $(this).data('prev-text'),
                    tNext: $(this).data('next-text')
                },
                type: 'image'
            });
        });

        // Magnific Audio
        // ======================

        $('.magnific-audio').each(function(index , value){
            var audio = $(this);
            var href = $(this).attr('href');
            audio.magnificPopup({
                items: {
                    src: '<audio controls="" preload="auto"><source src="'+ href +'"></audio>',
                    type: 'inline'
                },
                callbacks: {
                    open: function() {
                        $(this.currItem.inlineElement).mediaelementplayer();
                    }
                },
                closeBtnInside: true
            });
        });

        // Magnific Product Popup
        // ======================

        $('.product-gallery').magnificPopup({
            delegate: 'li figcaption a',
            type: 'image',
            mainClass: 'mfp-fade',
            gallery:{
                enabled:true,
                navigateByImgClick:true
            }
        });
    }

    magnificInit();

    // Flexslider Init
    // ======================

    function flexInit(element) {
        // is our slider inside a masonry container?
        var $isotopeContainer = $(element).closest('div.isotope');

        // We use data atributes on the flexslider items to control the behaviour of the slideshow
        var slider = $(element),

            //data-slideshow: defines if the slider will start automatically (true) or not
            sliderShow = slider.attr('data-flex-slideshow') === 'false' ? false : true,

            //data-flex-animation: defines the animation type, slide (default) or fade
            sliderAnimation = !slider.attr('data-flex-animation') ? 'slide' : slider.attr('data-flex-animation'),

            //data-flex-speed: defines the animation speed, 7000 (default) or any number
            sliderSpeed = !slider.attr('data-flex-speed') ? 7000 : slider.attr('data-flex-speed'),

            //data-flex-sliderdirection: defines the slide direction
            direction = !slider.attr('data-flex-sliderdirection') ? 'horizontal' : slider.attr('data-flex-sliderdirection'),

            //data-flex-duration: defines the transition speed in milliseconds
            sliderDuration = !slider.attr('data-flex-duration') ? 600 : slider.attr('data-flex-duration'),

            //data-flex-directions: defines the visibillity of the nanigation arrows, hide (default) or show
            sliderDirections = slider.attr('data-flex-directions') === 'hide' ? false : true,

            //data-flex-directions-type: defines the type of the direction arrows, fancy (with bg) or simple
            sliderDirectionsType = slider.attr('data-flex-directions-type') === 'fancy' ? 'flex-directions-fancy' : '',

            //data-flex-directions-position: defines the positioning of the direction arrows, default (inside the slider) or outside the slider
            sliderDirectionsPosition = slider.attr('data-flex-directions-position') === 'outside' ? 'flex-directions-outside' : '',

            //data-flex-controls: defines the visibillity of the nanigation controls, hide (default) or show
            sliderControls = slider.attr('data-flex-controls') === 'thumbnails' ? 'thumbnails' : slider.attr('data-flex-controls') === 'hide' ? false : true,

            //data-flex-controlsposition: defines the positioning of the controls, inside (default) absolute positioning on the slideshow, or outside
            sliderControlsPosition = slider.attr('data-flex-controlsposition') === 'inside' ? 'flex-controls-inside' : 'flex-controls-outside',

            //data-flex-controlsalign: defines the alignment of the controls, center (default) left or right
            sliderControlsAlign = !slider.attr('data-flex-controlsalign') ? 'flex-controls-center' : 'flex-controls-' + slider.attr('data-flex-controlsalign'),

            //data-flex-reverse:reverse the animation direction
            sliderReverse = slider.attr('data-flex-reverse') === 'false' ? false : true,

            //data-flex-animationLoop :gives the slider a seamless infinite loop
            sliderAnimationLoop = slider.attr('data-flex-animationloop') === 'false' ? false : true,

            //data-flex-itemwidth: the width of each item in case of a multiitem carousel, 0 (default for 100%) or a nymber representing pixels
            sliderItemWidth = !slider.attr('data-flex-itemwidth') ? 0 : parseInt(slider.attr('data-flex-itemwidth'), 10),

            //data-flex-itemmax: the max number of items in a carousel
            sliderItemMax = !slider.attr('data-flex-itemmax') ? 0 : parseInt(slider.attr('data-flex-itemmax'), 0),

            //data-flex-itemmin: the max number of items in a carousel
            sliderItemMin = !slider.attr('data-flex-itemmin') ? 0 : parseInt(slider.attr('data-flex-itemmin'), 0),

            //data-flex-captionvertical: defines the vertical positioning of the captions, top or bottom
            sliderCaptionsVertical = slider.attr('data-flex-captionvertical') === 'top' ? 'flex-caption-top' : '',

            //data-flex-captionvertical: defines the horizontal positioning of the captions, left or right or alternate
            sliderCaptionsHorizontal = slider.attr('data-flex-captionhorizontal') === 'alternate' ? 'flex-caption-alternate' : 'flex-caption-'+ slider.attr('data-flex-captionhorizontal');

        //assign the positioning classes to the navigation
        slider.addClass(sliderControlsPosition).addClass(sliderControlsAlign).addClass(sliderDirectionsType).addClass(sliderDirectionsPosition).addClass(sliderCaptionsHorizontal).addClass(sliderCaptionsVertical);

        slider.flexslider({
            slideshow: sliderShow,
            animation: sliderAnimation,
            direction: direction,
            slideshowSpeed: parseInt(sliderSpeed),
            animationSpeed: parseInt(sliderDuration),
            itemWidth: sliderItemWidth,
            minItems: sliderItemMin,
            maxItems: sliderItemMax,
            controlNav: sliderControls,
            directionNav: sliderDirections,
            prevText: '',
            nextText: '',
            smoothHeight: true,
            animationLoop:sliderAnimationLoop,
            reverse:sliderReverse,
            useCSS : false,
            after: function(slider) {
                if($isotopeContainer.length > 0 ){
                    // if flexslider is inside masonry container, trigger relayout in case of uneven sized images
                    $isotopeContainer.isotope( 'reLayout' );
                }
            }
        });
    }


    $('.flexslider[id]').filter(function(){
        return $(this).parents('.carousel').length < 1;
    }).each(function(){
        var that = this;
        $(this).imagesLoaded().done( function(instance){
            flexInit(that);
        });
    });


    // Function to init bootstrap's tooltip
    $('[data-toggle="tooltip"]').tooltip();

    // Function to init bootstrap's carousel
    $('.carousel').carousel({
        interval: 7000
    });

    // init nested flexsliders inside each slide when shown
    $('.carousel').on('slid',function(event){
        setTimeout(function(){
            initNestedSliders();
        },0);
    });

    function initNestedSliders(){
        $('.carousel').find('.active .flexslider[id]').each(function(){
            if(!$(this).hasClass('triggered')){
                $(this).addClass('triggered');
                flexInit(this);
            }
        });
    }

    // for initial slide there is no slid event
    initNestedSliders();

    // PIE Charts
    // ======================

    $('.chart').each( function() {
        var $chart = $(this);
        $chart.waypoint(function() {
            var $waypoint = $(this);
            $waypoint.easyPieChart({
                barColor: $waypoint.attr('data-bar-color'),
                trackColor: $waypoint.attr('data-track-color'),
                lineWidth: $waypoint.attr('data-line-width'),
                scaleColor: false,
                animate: 1000,
                size: $waypoint.attr('data-size'),
                lineCap: 'square'
            });
        },{
            triggerOnce: true,
            offset: 'bottom-in-view'
        });

        $chart.css('left', '50%');
        $chart.css('margin-left', - $chart.attr('data-size') / 2 );
    });

    // Counters
    // ==================

    $('.counter').each( function() {
        var $counter = $(this);
        $counter.waypoint(function() {
            $counter.find('.odometer').html( $counter.attr( 'data-count' ) );
        },{
            triggerOnce: true,
            offset: 'bottom-in-view'
        });
    });

    // Icon Animations
    // ======================

    $('[data-animation]').each(function(){
        var element         = $(this);

        element.on('mouseenter', function(){
            element.addClass('animated ' + element.attr('data-animation'));

        });

        element.on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(e) {
            element.removeClass('animated ' + element.attr('data-animation'));
        });

    });

    // Isotope Init
    // ======================

    $('.isotope').each( function( index, element ) {
        var $container = $(element);
        $container.imagesLoaded().done( function( loadedContainer ) {
            setTimeout(function(){
                // wait for possible flexsliders to render before rendering isotope
                $container.isotope();
                setTimeout(function(){
                    $container.removeClass('no-transition');
                    // remove no-tranlstion class so all other calls animate
                },500);
            },100);
        });
    });

    var filters = $('.isotope-filters');
    filters.on('click', 'a', function(e) {
        var active = $(this),
            activeClass = active.data('filter'),
            parentFilters = active.closest('.isotope-filters');

        if(active.hasClass('selected')){
            // don't do anything if clicked already selected filter
            return false;
        }
        // clear all active filters
        parentFilters.find('a').removeClass('active');
        // make clicked filter active
        active.addClass('active');
        // filter the collection below the isotope-filters (find for recent posts , addback for port)
        parentFilters.next().find('.isotope').addBack('.isotope').isotope({ filter: active.attr('data-filter') });

        // return false to prevent click
        return false;
    });

    $(window).smartresize(function(){
        // just trigger relayout
        $('.isotope').isotope('reLayout');
    });



    // Social Icons Hover Colours
    // ======================

    $('[data-iconcolor]').each(function(){
        var element         = $(this);
        var original_color  =$(element).css('background-color');
        var original_text_color  =$(element).find('i').css('color');
        element.on('mouseenter', function(){
            element.css('background-color' , element.attr('data-iconcolor'));
            element.find('i').css('color' , '#ffffff');
            if (element.parents('.social-icons').hasClass('social-simple')) {
                element.find('i').css('color' , element.attr('data-iconcolor'));
            }
        });
        element.on('mouseleave', function(){
            element.css('background-color' ,original_color);
            element.find('i').css('color' , original_text_color);
            if (element.parents('.social-icons').hasClass('social-simple')) {
                element.find('i').css('color' , original_text_color);
            }
        });

    });

    // Fix for embedded videos
    // ======================

    var frames = $( '.video-wrapper iframe' );
    for (var i = 0; i < frames.length; i++) {
        if(frames[i].src.indexOf('?') === -1){
            frames[i].src += '?wmode=opaque';
        }
        else{
            frames[i].src += '&wmode=opaque';
        }
    }

    // Function to fix accordion arrows
    $('.accordion-body').on('hide', function () {
        $(this).parent('.accordion-group').find('.accordion-toggle').addClass('collapsed');
    });

    // Adjust full height sections on IOS
    $('[class*="oxy-agent-"] .section-fullheight').removeClass('section-fullheight').css('min-height', $(window).height()).find('.container, .container-fullwidth').css('min-height', $(window).height()).find('.row, [class*="col-md"]').css('position', 'static');

    // fix placeholders for IE 8 & 9
    $('html.ie8, html.ie9').find('input, textarea').placeholder();

    // Setiing responsive videos
    $( '.video-wrapper' ).fitVids();

    // Play videos & audio
    $('audio').mediaelementplayer({
        pauseOtherPlayers: false,
        enableAutosize: false,
        setDimensions:false,
    });

    $('.section-background-video').mediaelementplayer({
        pauseOtherPlayers: false,
        enableAutosize: false,
        setDimensions:false,
        success: function(mediaElement, node, player) {
            // video tag is initially hidden ( in order to hide the poster and display the cover bg only )
            var attr = $(mediaElement).attr('poster');
            if(typeof attr !== typeof undefined && attr !== false) {
                $(mediaElement).parent().css('background-image','url(\'' + $(mediaElement).attr('poster') + '\')');
            }
            var $section = $(mediaElement).closest('section');

            // loadded data event does not trigger on ios, its dektop only
            mediaElement.addEventListener('loadeddata', function () {
                // player arg has media property filled only after loadeddata even triggers ( first frame loaded! )
                var containerHeight    = $section.outerHeight();
                var containerWidth     = $section.outerWidth();
                var playerHeight       = player.media.videoHeight;
                var playerWidth        = player.media.videoWidth;
                var aspectRatio        = ( playerHeight / playerWidth * 100 ) + '%';
                var scaleFactor        = containerWidth /playerWidth;
                var playerActualHeight = playerHeight * scaleFactor;

                $(mediaElement).parent().css('padding-bottom', aspectRatio);
                if( playerActualHeight >= containerHeight ){
                    $(mediaElement).css('top', ( containerHeight - (playerHeight * scaleFactor) )/2 );
                }
                else {
                    $(mediaElement).css('background-image', '');
                }

                $(mediaElement).show();

                $(window).smartresize(function(){
                        containerHeight    = $section.outerHeight();
                        containerWidth     = $section.outerWidth();
                        scaleFactor        = containerWidth /playerWidth;
                        playerActualHeight = playerHeight * scaleFactor;
                    if( playerActualHeight >= containerHeight ){
                        $(mediaElement).css('top', ( containerHeight - (playerHeight * scaleFactor) )/2 );
                    }
                    else {
                        $(mediaElement).css('background-image', '');
                    }
                });
            });

            if( !$('body:not([class*="oxy-agent-"])').length ) {
                // if mobile show video immediately ( no loadeddata event here )
                $(mediaElement).show();
            }
            // ipad safari needs a javascript controller for the video
            if( $('body').hasClass('oxy-agent-ipad') ) {
                $section.on('click', function (e) {
                    if(mediaElement.paused) {
                        mediaElement.play();
                    }
                    else {
                        mediaElement.pause();
                    }
                });
            }
        }
    });

    // Rotating-words
    // $('.rotating-words strong').textrotator({
    //   animation: 'flipUp', // You can pick the way it animates when rotating through words. Options are dissolve (default), fade, flip, flipUp, flipCube, flipCubeUp and spin.
    //   separator: ',',  // If you don't want commas to be the separator, you can define a new separator (|, &, * etc.) by yourself using this field.
    //   speed: 7000 // How many milliseconds until the next word show.
    // });

    // add background colour to icons
    $('[data-bgcolor]').each(function(){
        var element         = $(this),
            bg              = element.attr('data-bgcolor');
        element.find('.box-inner').css('background-color' , bg);
    });

    $('.countdown').each(function() {
        var countdown = $(this);
        var date = countdown.attr('data-date' );
        countdown.countdown( date ).on('update.countdown', function(event) {
            $(this).find('.counter-days').html( event.offset.totalDays );
            $(this).find('.counter-hours').html( event.offset.hours );
            $(this).find('.counter-minutes').html( event.offset.minutes );
            $(this).find('.counter-seconds').html( event.offset.seconds );
        });
    });

    // WooCommerce minicart
    $('body.woo-cart-popup').on('click', '.mini-cart-overview a ', function() {
        var $cartLink = $(this);
        $('.mini-cart-underlay').toggleClass('cart-open');
        $cartLink.attr( 'href' , '#mini-cart-container' );
        $('#mini-cart-container').toggleClass('active');
    });

    // Add wrapper to select boxes
    $('select').not('.country_to_state, #billing_state, #shipping_state, #calc_shipping_state').wrap('<div class="select-wrap">');

    var menu = $('#masthead');
    var menuInitOffset = $('#masthead').position();
    menuInitOffset = menuInitOffset === undefined ? 0 : menuInitOffset.top;

    var menuItems = $('.navbar').find('a');
    var scrollMenuItems = menuItems.map(function(){
        var item = this.hash;
        if (item && $(item).length ) {
            return item;
        }
    });

    if( scrollMenuItems.length ) {
        var sections = [];
        $('body').find('section').each( function() {
            // if section has an id
            if( this.id ) {
                sections.push(this);
            }
        });
        if( sections.length ) {
            menuItems.parent().removeClass('active current-menu-item');
            $.each( sections, function( index, section) {
                var $section = $(section);

                // set all section up waypoints
                $section.waypoint({
                    offset: function() {
                        return sectionWaypointOffset( $section, 'up', menu );
                    },
                    handler: function(direction) {
                        if( 'up' === direction ) {
                            sectionWaypointHandler( scrollMenuItems, menuItems, section );
                        }
                    }
                });
                // set all section down waypoints
                $section.waypoint({
                    offset: function() {
                        return sectionWaypointOffset( $section, 'down', menu );
                    },
                    handler: function(direction) {
                        if( 'down' === direction ) {
                            sectionWaypointHandler( scrollMenuItems, menuItems, section );
                        }
                    }
                });
            });
        }
    }

    function sectionWaypointOffset( $section, direction, menu ) {
        // if we are going up start from -1 to make sure event triggers
        var offset = direction === 'up' ? -($section.height() / 2) : 0;
        var menuHeight = parseInt(scriptData.navbarHeight);
        if( menu.length && menu.hasClass('navbar-sticky') && menu.hasClass('navbar-scrolled') ){
            menuHeight = parseInt(scriptData.navbarScrolled);
        }
        var sectionOffset = $section.offset().top;
        var menuOffset = menu.length? menu.position().top : 0;
        if( menu.length && menu.hasClass('navbar-sticky') && (  (menuOffset + menuHeight)  <= sectionOffset ) ){
            offset += menuHeight;
        }
        return offset;
    }

    function sectionWaypointHandler( scrollMenuItems, menuItems, section ) {
        if( scrollMenuItems.length ) {
            menuItems.parent().removeClass('active current-menu-item').end().filter('[href$="' + section.id + '"]').parent().addClass('active current-menu-item');
        }
    }

    // Add scroll to behavior to hash menu tags
    $('.navbar a, a.scroll-to-id').on('click', function(e) {
        var target = this.hash;
        var offset = 0;

        if(target && $(target).length){
            e.preventDefault();

            var targetOffset = $(target).offset().top;
            var menuHeight = parseInt(scriptData.navbarHeight);

            if(menu !== undefined && menu.hasClass('navbar-sticky') && ( menuInitOffset + menuHeight <= targetOffset)){
                var scrollPoint = parseInt( scriptData.navbarScrolledPoint );
                var navHeightBeforeScrollPoint = parseInt( scriptData.navbarHeight );
                var navHeightAfterScrollPoint = parseInt( scriptData.navbarScrolled );

                offset = scrollPoint <= targetOffset ? navHeightAfterScrollPoint : navHeightBeforeScrollPoint;
            }

            $.scrollTo( $(target), 800, {
                axis: 'y',
                offset: -offset + 1
            } );
        }
    });

    // Init classes for portfolios
    var portfolios = $('.portfolio');
    portfolios.each(function() {
        var portfolio = $(this);

        portfolio.find('.portfolio-item').css('display', 'block');

        if ( portfolio.hasClass('portfolio-hex') ) {
            portfolio.find('figure').append('<div class="hex-right"></div><div class="hex-left"></div>');
            portfolio.find('.more, .link').addClass('hex-alt');
        }
        if ( portfolio.hasClass('portfolio-round') ) {
            portfolio.find('img').addClass('img-circle');
        }

        if ( portfolio.hasClass('portfolio-shadows') && portfolio.hasClass('portfolio-hex') ) {
            portfolio.find('figure').wrap('<div class="flat-shadow">');
        }

        if ( portfolio.hasClass('portfolio-shadows') && portfolio.hasClass('portfolio-round') ) {
            portfolio.find('figure').wrap('<div class="flat-shadow">');
        }

        if ( portfolio.hasClass('portfolio-shadows') && portfolio.hasClass('portfolio-rect') ) {
            portfolio.find('figure').wrap('<div class="flat-shadow flat-rect">');
        }
        if ( portfolio.hasClass('portfolio-shadows') && portfolio.hasClass('portfolio-square') ) {
            portfolio.find('figure').wrap('<div class="flat-shadow flat-square">');
        }
    });

    // Init SkrollR after portfolio init
    if ( initScrollr === true) {
        skrollr.init({
            forceHeight: false
        });
    }

    // Init classes for Hex boxes
    $('.box-hex').append('<div class="hex-right"></div><div class="hex-left"></div>');

    // make WP calendar use boostrap table class
    $('#wp-calendar').addClass( 'table' );

    // Add top bar functionallity
    $('.top-bar, #masthead').find('.widget_search form').wrap('<div class="top-search">');
    $('.top-search').append('<i class="fa fa-search search-trigger navbar-text"></i>');
    $('body').on('click', '.search-trigger', function() {
        $('.top-search').toggleClass('active');
        $('.search-trigger').toggleClass('fa-minus');
        $('.top-search').find('form').fadeToggle(150);
    });

    // header menu changes
    var mastheader = $('.navbar-sticky');

    // stop navbar when at top of the page
    mastheader.waypoint('sticky', {
        stuckClass: 'navbar-stuck'
    });

    // trigger the waypoint only for fixed position navbar
    var menuContainer = $('#masthead.navbar-sticky');
    if(false && menuContainer.length && menuContainer.hasClass('navbar-sticky')){
        // calculate menu offset in case menu is placed inside the page
        var menuOffset =  menuContainer.position().top;
        $('body').waypoint({
            offset: -( parseInt( scriptData.navbarScrolledPoint ) + menuOffset ),
            handler: function(direction) {
                // add / remove scrolled class
                menuContainer.toggleClass('navbar-scrolled');

                menuContainer.one('MSTransitionEnd webkitTransitionEnd oTransitionEnd transitionend', function(){
                    // refresh waypoints only once transition ends in order to get correct offsets for sections.
                    if( !menuContainer.hasClass( 'refreshing' ) ) {
                        $.waypoints('refresh');
                    }
                    menuContainer.toggleClass('refreshing');
                });
            }
        });
    }

    $('body').waypoint({
        offset: -200,
        handler: function(direction) {
            if(direction === 'down'){
                $('.go-top').css('bottom', '12px').css('opacity', '1');
            }
            else{
                $('.go-top').css('bottom', '-44px').css('opacity', '0');
            }
        }
    });

     // Animate the scroll to top
    $('.go-top').click(function(event) {
        event.preventDefault();
        $('html, body').animate({scrollTop: 0}, 300);
    });

    // Init On scroll animations
    $('.os-animation').each( function() {
        var osElement = $(this),
            osAnimationClass = osElement.attr('data-os-animation'),
            osAnimationDelay = osElement.attr('data-os-animation-delay');

        osElement.css('-webkit-animation-delay', osAnimationDelay);
        osElement.css('-moz-animation-delay', osAnimationDelay);
        osElement.css('animation-delay', osAnimationDelay);

        osElement.waypoint(function() {
            $(this).addClass('animated').addClass(osAnimationClass);
        },{
            triggerOnce: true,
            offset: '80%'
        });
    });


    var $scrollContainer = $('div.isotope-infinite');
    if($scrollContainer.length > 0){
        $scrollContainer.infinitescroll({
            navSelector  : 'div.infinite-scroll',    // selector for the paged navigation
            nextSelector : 'div.infinite-scroll a',  // selector for the NEXT link (to page 2)
            itemSelector : 'div.isotope-infinite .infinite-item',     // selector for all items you'll retrieve
            contentSelector : 'div.isotope-infinite',
            loading: {
                finishedMsg: scriptData.scrollFinishedMessage,
                msgText: scriptData.scrollTextMessage
              }
            },
            // call Isotope as a callback
            function( newElements ) {
                $(newElements).each(function(index, element){
                    // format videos for recent posts shortcode
                    if($(element).find('article').hasClass('format-video')){
                        $(element).find('.video-wrapper').fitVids();
                    }

                    if($(element).find('article').hasClass('format-audio')){
                        $(element).find('audio').mediaelementplayer({
                            pauseOtherPlayers: false,
                            enableAutosize: false,
                            setDimensions:false,
                        });
                    }

                    // format portfolio items
                    if( $(element).hasClass('portfolio-item') ){
                        var parent = $(element).closest('.portfolio');
                        $(element).css('display', 'block');

                        if ( $(parent).hasClass('portfolio-hex') ) {
                            $(element).find('figure').append('<div class="hex-right"></div><div class="hex-left"></div>');
                            $(element).find('.more, .link').addClass('hex-alt');
                        }
                        if ( $(parent).hasClass('portfolio-round') ) {
                            $(element).find('img').addClass('img-circle');
                        }

                        if ( $(parent).hasClass('portfolio-shadows') && $(parent).hasClass('portfolio-hex') ) {
                            $(element).find('figure').wrap('<div class="flat-shadow">');
                        }

                        if ( $(parent).hasClass('portfolio-shadows') && $(parent).hasClass('portfolio-round') ) {
                            $(element).find('figure').wrap('<div class="flat-shadow">');
                        }

                        if ( $(parent).hasClass('portfolio-shadows') && $(parent).hasClass('portfolio-rect') ) {
                            $(element).find('figure').wrap('<div class="flat-shadow flat-rect">');
                        }
                        if ( $(parent).hasClass('portfolio-shadows') && $(parent).hasClass('portfolio-square') ) {
                            $(element).find('figure').wrap('<div class="flat-shadow flat-square">');
                        }
                    }
                });
                // using insert instead of append will properly apply current filters
                $scrollContainer.isotope( 'insert', $( newElements ), function(){
                    $scrollContainer.isotope( 'reLayout' );
                    // initialize popups for elements added through ajax
                    magnificInit();
                });
            }
        );
    }

        // Hover menu
    // ======================
    if (scriptData.hoverMenu.hoverActive === true) {
        if($('body:not([class*="oxy-agent"])').length) {
            $('.navbar .dropdown').hover(function() {
                $(this).find('.dropdown-menu').first().stop(true, true).delay(scriptData.hoverMenu.hoverDelay).fadeIn(parseInt(scriptData.hoverMenu.hoverFadeDelay));
            }, function() {
                $(this).find('.dropdown-menu').first().stop(true, true).delay(scriptData.hoverMenu.hoverDelay).fadeOut(parseInt(scriptData.hoverMenu.hoverFadeDelay));
            });
        }

        $('#masthead .nav li.dropdown a').on('click', function(){
            var $dropdown = $(this);
            if($dropdown.parent().hasClass('open') && ($dropdown.attr('data-link') !== undefined) ) {
                window.location = $dropdown.attr('data-link');
            }
        });
    }

    // woocommerce

    // if country changed and js injects text input make sure it has a form-control class
    $('body').on( 'country_to_state_changed', function(e, data) {
        $('.input-text').addClass('form-control');
    });

});

