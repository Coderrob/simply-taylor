/**
 * Site interactions and responsive image loading.
 */

(function() {
  'use strict';

  function loadAllImages() {
    var images = document.querySelectorAll('img[data-src]');
    for (var i = 0; i < images.length; i++) {
      ImageLoader.load(images[i], { load: true });
    }
  }

  function getAnime() {
    var animeGlobal = window.anime;

    if (animeGlobal && typeof animeGlobal.animate === 'function') {
      return animeGlobal;
    }

    if (typeof animeGlobal === 'function') {
      var adapter = {
        animate: function(targets, params) {
          var options = params || {};
          return animeGlobal(Object.assign({}, options, { targets: targets }));
        }
      };

      if (typeof animeGlobal.stagger === 'function') {
        adapter.stagger = animeGlobal.stagger;
      }

      return adapter;
    }

    return null;
  }

  function animateBlogList(anime) {
    var cards = document.querySelectorAll('.blog-list-item');
    if (!cards.length) return;

    anime.animate(cards, {
      opacity: [0, 1],
      translateY: [56, 0],
      rotate: [1.5, 0],
      delay: anime.stagger(120, { start: 120 }),
      duration: 1100,
      ease: 'out(3)'
    });

    for (var i = 0; i < cards.length; i++) {
      bindCardHover(cards[i], anime);
    }
  }

  function bindCardHover(card, anime) {
    var activeAnimation = null;

    function play(state) {
      if (activeAnimation && typeof activeAnimation.pause === 'function') {
        activeAnimation.pause();
      }

      activeAnimation = anime.animate(card, {
        translateY: state === 'enter' ? -10 : 0,
        rotate: state === 'enter' ? -0.4 : 0,
        scale: state === 'enter' ? 1.01 : 1,
        duration: state === 'enter' ? 420 : 520,
        ease: state === 'enter' ? 'out(4)' : 'out(2)'
      });
    }

    card.addEventListener('mouseenter', function() {
      play('enter');
    });

    card.addEventListener('mouseleave', function() {
      play('leave');
    });
  }

  function animateBlogItem(anime) {
    var article = document.querySelector('.collection-type-blog.view-item article');
    if (!article) return;

    var children = article.children;
    anime.animate(children, {
      opacity: [0, 1],
      translateY: [34, 0],
      delay: anime.stagger(90, { start: 120 }),
      duration: 900,
      ease: 'out(3)'
    });
  }

  function animateHome(anime) {
    var heroBits = document.querySelectorAll('.home-billboard-copy > *, .home-billboard-image, .home-spray-notes > *');
    var cards = document.querySelectorAll('.home-module, .home-card');
    var manifesto = document.querySelector('.home-manifesto, .home-module-poster');

    if (heroBits.length) {
      anime.animate(heroBits, {
        opacity: [0, 1],
        translateY: [28, 0],
        rotate: [1.2, 0],
        delay: anime.stagger(90, { start: 100 }),
        duration: 900,
        ease: 'out(3)'
      });
    }

    if (cards.length) {
      anime.animate(cards, {
        opacity: [0, 1],
        translateY: [34, 0],
        rotate: [1, 0],
        delay: anime.stagger(130, { start: 240 }),
        duration: 1000,
        ease: 'out(3)'
      });
    }

    if (manifesto) {
      anime.animate(manifesto, {
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 880,
        delay: 420,
        ease: 'out(3)'
      });
    }
  }

  function animateButtons(anime) {
    var buttons = document.querySelectorAll('.link, .category, .tag, .blog-list-pagination a, .blog-item-pagination a');

    for (var i = 0; i < buttons.length; i++) {
      bindButtonHover(buttons[i], anime);
    }
  }

  function bindButtonHover(button, anime) {
    var activeAnimation = null;

    function play(scale, duration) {
      if (activeAnimation && typeof activeAnimation.pause === 'function') {
        activeAnimation.pause();
      }

      activeAnimation = anime.animate(button, {
        scale: scale,
        duration: duration,
        ease: 'out(4)'
      });
    }

    button.addEventListener('mouseenter', function() {
      play(1.03, 280);
    });

    button.addEventListener('mouseleave', function() {
      play(1, 360);
    });
  }

  function initAnimations() {
    var anime = getAnime();
    if (!anime) return;

    animateHome(anime);
    animateBlogList(anime);
    animateBlogItem(anime);
    animateButtons(anime);
  }

  document.addEventListener('DOMContentLoaded', function() {
    loadAllImages();
    initAnimations();
  });

  window.addEventListener('resize', loadAllImages);
}());
