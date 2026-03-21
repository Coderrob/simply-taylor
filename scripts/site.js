/**
 * Site interactions and responsive image loading.
 */

(function () {
  "use strict";

  /** @typedef {'enter' | 'leave'} HoverState */

  const EVENTS = {
    domReady: "DOMContentLoaded",
    resize: "resize",
    mouseEnter: "mouseenter",
    mouseLeave: "mouseleave",
  };

  const SELECTORS = {
    lazyImages: "img[data-src]",
    blogCards: ".blog-list-item",
    blogItemArticle: ".collection-type-blog.view-item article",
    homeHeroBits:
      ".home-collision__billboard-copy > *, .home-collision__billboard-image, .home-collision__notes > *, .home-billboard-copy > *, .home-billboard-image, .home-spray-notes > *",
    homeCards: ".home-collision__module, .home-module, .home-card",
    homeManifesto:
      ".home-collision__module--poster, .home-module-poster, .home-manifesto",
    interactiveButtons:
      ".link, .category, .tag, .blog-list-pagination a, .blog-item-pagination a",
  };

  const ANIMATION_EASING = {
    reveal: "out(3)",
    hoverIn: "out(4)",
    hoverOut: "out(2)",
  };

  const HOVER_STATE = {
    enter: "enter",
    leave: "leave",
  };

  const METHOD_NAMES = {
    animate: "animate",
    stagger: "stagger",
    pause: "pause",
  };

  /**
   * Returns shared runtime guards exposed on window.
   *
   * @returns {null | { hasFunction: Function, isFunction: Function }} Guard helpers.
   * @throws {Error} Never intentionally throws.
   */
  function getGuards() {
    return window.ScriptGuards || null;
  }

  /**
   * Forces lazy-load candidates to load immediately.
   *
   * @returns {void}
   * @throws {Error} Never intentionally throws.
   */
  function loadAllImages() {
    var images = document.querySelectorAll(SELECTORS.lazyImages);
    for (var i = 0; i < images.length; i++) {
      ImageLoader.load(images[i], { load: true });
    }
  }

  /**
   * Adapts anime.js API across bundle variants.
   *
   * @returns {null | { animate: Function, stagger?: Function }} Anime adapter or null.
   * @throws {Error} Never intentionally throws.
   */
  function getAnime() {
    var guards = getGuards();
    if (!guards) return null;

    var animeGlobal = window.anime;

    if (guards.hasFunction(animeGlobal, METHOD_NAMES.animate)) {
      return animeGlobal;
    }

    if (guards.isFunction(animeGlobal)) {
      var adapter = {
        animate: function (targets, params) {
          var options = params || {};
          return animeGlobal(Object.assign({}, options, { targets: targets }));
        },
      };

      if (guards.hasFunction(animeGlobal, METHOD_NAMES.stagger)) {
        adapter.stagger = animeGlobal[METHOD_NAMES.stagger];
      }

      return adapter;
    }

    return null;
  }

  /**
   * Animates blog cards on list pages.
   *
   * @param {{ animate: Function, stagger?: Function }} anime Anime adapter.
   * @returns {void}
   * @throws {Error} Never intentionally throws.
   */
  function animateBlogList(anime) {
    var cards = document.querySelectorAll(SELECTORS.blogCards);
    if (!cards.length) return;

    anime.animate(cards, {
      opacity: [0, 1],
      translateY: [56, 0],
      rotate: [1.5, 0],
      delay: anime.stagger(120, { start: 120 }),
      duration: 1100,
      ease: ANIMATION_EASING.reveal,
    });

    for (var i = 0; i < cards.length; i++) {
      bindCardHover(cards[i], anime);
    }
  }

  /**
   * Returns hover animation parameters for card state transitions.
   *
   * @param {HoverState} state Hover state.
   * @returns {{ translateY: number, rotate: number, scale: number, duration: number, ease: string }} Animation options.
   * @throws {Error} Never intentionally throws.
   */
  function cardHoverConfig(state) {
    var configByState = {
      enter: {
        translateY: -10,
        rotate: -0.4,
        scale: 1.01,
        duration: 420,
        ease: "out(4)",
      },
      leave: {
        translateY: 0,
        rotate: 0,
        scale: 1,
        duration: 520,
        ease: ANIMATION_EASING.hoverOut,
      },
    };

    configByState.enter.ease = ANIMATION_EASING.hoverIn;

    return configByState[state] || configByState.leave;
  }

  /**
   * Stops an anime.js instance if it supports pause().
   *
   * @param {any} animation Active animation candidate.
   * @param {{ hasFunction: Function }} guards Guard helpers.
   * @returns {void}
   * @throws {Error} Never intentionally throws.
   */
  function stopAnimationIfPossible(animation, guards) {
    if (guards.hasFunction(animation, METHOD_NAMES.pause)) {
      animation[METHOD_NAMES.pause]();
    }
  }

  /**
   * Binds hover animation behavior to one blog card.
   *
   * @param {Element} card Card element.
   * @param {{ animate: Function }} anime Anime adapter.
   * @returns {void}
   * @throws {Error} Never intentionally throws.
   */
  function bindCardHover(card, anime) {
    var guards = getGuards();
    if (!guards) return;

    var activeAnimation = null;

    /**
     * Plays a card hover state animation.
     *
     * @param {HoverState} state Desired state.
     * @returns {void}
     * @throws {Error} Never intentionally throws.
     */
    function play(state) {
      stopAnimationIfPossible(activeAnimation, guards);

      var config = cardHoverConfig(state);
      activeAnimation = anime.animate(card, config);
    }

    card.addEventListener(EVENTS.mouseEnter, function () {
      play(HOVER_STATE.enter);
    });

    card.addEventListener(EVENTS.mouseLeave, function () {
      play(HOVER_STATE.leave);
    });
  }

  /**
   * Animates single-post content on blog item pages.
   *
   * @param {{ animate: Function, stagger?: Function }} anime Anime adapter.
   * @returns {void}
   * @throws {Error} Never intentionally throws.
   */
  function animateBlogItem(anime) {
    var article = document.querySelector(SELECTORS.blogItemArticle);
    if (!article) return;

    var children = article.children;
    anime.animate(children, {
      opacity: [0, 1],
      translateY: [34, 0],
      delay: anime.stagger(90, { start: 120 }),
      duration: 900,
      ease: ANIMATION_EASING.reveal,
    });
  }

  /**
   * Runs animation only when the target collection is non-empty.
   *
   * @param {{ animate: Function }} anime Anime adapter.
   * @param {NodeListOf<Element> | Element | null} targets Animation targets.
   * @param {Object} params Anime params.
   * @returns {void}
   * @throws {Error} Never intentionally throws.
   */
  function animateIfPresent(anime, targets, params) {
    var guards = getGuards();
    if (!guards) return;

    var hasLength =
      guards.isPresent(targets) &&
      guards.isPresent(targets.length) &&
      targets.length > 0;
    var hasSingleElement = Boolean(guards.isPresent(targets) && !hasLength);
    if (hasLength || hasSingleElement) {
      anime.animate(targets, params);
    }
  }

  /**
   * Animates the homepage hero, cards, and manifesto modules.
   *
   * @param {{ animate: Function, stagger?: Function }} anime Anime adapter.
   * @returns {void}
   * @throws {Error} Never intentionally throws.
   */
  function animateHome(anime) {
    var heroBits = document.querySelectorAll(SELECTORS.homeHeroBits);
    var cards = document.querySelectorAll(SELECTORS.homeCards);
    var manifesto = document.querySelector(SELECTORS.homeManifesto);

    animateIfPresent(anime, heroBits, {
      opacity: [0, 1],
      translateY: [28, 0],
      rotate: [1.2, 0],
      delay: anime.stagger(90, { start: 100 }),
      duration: 900,
      ease: ANIMATION_EASING.reveal,
    });

    animateIfPresent(anime, cards, {
      opacity: [0, 1],
      translateY: [34, 0],
      rotate: [1, 0],
      delay: anime.stagger(130, { start: 240 }),
      duration: 1000,
      ease: ANIMATION_EASING.reveal,
    });

    animateIfPresent(anime, manifesto, {
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 880,
      delay: 420,
      ease: ANIMATION_EASING.reveal,
    });
  }

  /**
   * Binds hover animations to interactive link-like controls.
   *
   * @param {{ animate: Function }} anime Anime adapter.
   * @returns {void}
   * @throws {Error} Never intentionally throws.
   */
  function animateButtons(anime) {
    var buttons = document.querySelectorAll(SELECTORS.interactiveButtons);

    for (var i = 0; i < buttons.length; i++) {
      bindButtonHover(buttons[i], anime);
    }
  }

  /**
   * Binds hover scaling behavior to one interactive button.
   *
   * @param {Element} button Button-like element.
   * @param {{ animate: Function }} anime Anime adapter.
   * @returns {void}
   * @throws {Error} Never intentionally throws.
   */
  function bindButtonHover(button, anime) {
    var guards = getGuards();
    if (!guards) return;

    var activeAnimation = null;

    function play(scale, duration) {
      stopAnimationIfPossible(activeAnimation, guards);

      activeAnimation = anime.animate(button, {
        scale: scale,
        duration: duration,
        ease: ANIMATION_EASING.hoverIn,
      });
    }

    button.addEventListener(EVENTS.mouseEnter, function () {
      play(1.03, 280);
    });

    button.addEventListener(EVENTS.mouseLeave, function () {
      play(1, 360);
    });
  }

  /**
   * Initializes all page animations when anime.js is available.
   *
   * @returns {void}
   * @throws {Error} Never intentionally throws.
   */
  function initAnimations() {
    var anime = getAnime();
    if (!anime) return;

    animateHome(anime);
    animateBlogList(anime);
    animateBlogItem(anime);
    animateButtons(anime);
  }

  document.addEventListener(EVENTS.domReady, function () {
    loadAllImages();
    initAnimations();
  });

  window.addEventListener(EVENTS.resize, loadAllImages);
})();
