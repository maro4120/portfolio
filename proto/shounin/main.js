'use strict';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const behavior = () => reducedMotion.matches ? 'instant' : 'smooth';
const header = document.querySelector('.header');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
menuButton.hidden = false;
header.classList.add('menu-ready');
const mobileMenu = window.matchMedia('(max-width: 700px)');
const backdrop = document.createElement('div');
backdrop.className = 'menu-backdrop';
backdrop.setAttribute('aria-hidden', 'true');
document.body.append(backdrop);
let menuScroll = 0;
let menuClosingTimer;
const backgroundRegions = [...document.querySelectorAll('main, footer, .header .brand, .header-cta')];
function finishMenuClose() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo({top: menuScroll, behavior: 'instant'});
  backgroundRegions.forEach(element => { element.inert = false; });
}
function closeMenu() {
  if (!header.classList.contains('menu-open')) return;
  header.classList.remove('menu-open');
  document.body.classList.remove('menu-active');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'メニューを開く');
  nav.inert = mobileMenu.matches;
  menuButton.focus({preventScroll: true});
  menuClosingTimer = window.setTimeout(finishMenuClose, reducedMotion.matches ? 0 : 300);
}
function openMenu() {
  clearTimeout(menuClosingTimer);
  if (!document.body.style.position) menuScroll = window.scrollY;
  document.documentElement.classList.remove('intro-motion');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${menuScroll}px`;
  document.body.style.width = '100%';
  backgroundRegions.forEach(element => { element.inert = true; });
  nav.inert = false;
  header.classList.add('menu-open');
  document.body.classList.add('menu-active');
  menuButton.setAttribute('aria-expanded', 'true');
  menuButton.setAttribute('aria-label', 'メニューを閉じる');
}
menuButton.addEventListener('click', () => header.classList.contains('menu-open') ? closeMenu() : openMenu());
backdrop.addEventListener('click', closeMenu);
nav.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || !header.classList.contains('menu-open')) return;
  closeMenu();
  // Unlock before anchor navigation, otherwise restoring scroll would undo it.
  clearTimeout(menuClosingTimer);
  finishMenuClose();
});
nav.inert = mobileMenu.matches;
mobileMenu.addEventListener('change', () => {
  closeMenu();
  clearTimeout(menuClosingTimer);
  if (document.body.style.position) finishMenuClose();
  nav.inert = mobileMenu.matches;
});
document.addEventListener('keydown', event => {
  if (!header.classList.contains('menu-open')) return;
  if (event.key === 'Escape') closeMenu();
  if (event.key === 'Tab') {
    const items = [menuButton, ...nav.querySelectorAll('a')];
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
window.setTimeout(() => document.documentElement.classList.remove('intro-motion'), 3100);

// Retain native details semantics and animate the measured height in both directions.
document.querySelectorAll('.faq-list details').forEach(details => {
  const summary = details.querySelector('summary');
  let animation;
  let targetOpen = details.open;
  summary.addEventListener('click', event => {
    event.preventDefault();
    const from = details.getBoundingClientRect().height;
    animation?.cancel();
    targetOpen = !targetOpen;
    details.classList.toggle('faq-closing', !targetOpen);
    details.open = true;
    const to = targetOpen ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height;
    if (reducedMotion.matches) {
      details.open = targetOpen;
      details.classList.remove('faq-closing');
      return;
    }
    animation = details.animate([{height: `${from}px`}, {height: `${to}px`}], {duration: 300, easing: 'ease-in-out'});
    animation.onfinish = () => {
      details.open = targetOpen;
      details.classList.remove('faq-closing');
      animation = null;
    };
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      animation?.cancel();
      details.open = targetOpen;
      details.classList.remove('faq-closing');
    }
  });
});
const track = document.querySelector('.course-grid');
const cards = [...track.querySelectorAll('.course-card')];
const form = document.querySelector('#course-quiz');
const result = document.querySelector('#quiz-result');
form.addEventListener('change', () => {
  const answers = new FormData(form);
  if (!['q1', 'q2', 'q3'].every(key => answers.has(key))) return;
  const id = answers.get('q3') === 'yes' ? 'career' : answers.get('q2') === 'yes' ? 'premium' : answers.get('q1') === 'no' ? 'start' : 'complete';
  cards.forEach(card => card.classList.remove('is-selected'));
  document.querySelectorAll('.match-label, .course-lamp').forEach(label => label.remove());
  const card = document.getElementById(id);
  const label = document.createElement('p');
  label.className = 'match-label';
  label.textContent = 'あなたにおすすめ';
  card.querySelector(".course-copy").prepend(label);
  const lamp = document.createElement('span');
  lamp.className = 'course-lamp';
  lamp.setAttribute('aria-hidden', 'true');
  const lampImage = document.createElement('img');
  lampImage.src = 'img/lamp-red.webp';
  lampImage.alt = '';
  lampImage.width = 100;
  lampImage.height = 120;
  lamp.append(lampImage);
  card.querySelector('.course-stage').append(lamp);
  card.classList.add('is-selected');
  card.classList.remove('is-pending');
  result.textContent = `あなたにおすすめ：${card.querySelector('h3').textContent}`;
  card.focus({preventScroll: true});
  card.scrollIntoView({block: "center", behavior: behavior()});
});
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('is-pending'); observer.unobserve(entry.target); }
    });
  }, {threshold: 0.06});
  document.querySelectorAll('.reveal:not(.course-card):not(#worries .reveal)').forEach(element => { element.classList.add('is-pending'); observer.observe(element); });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) { observer.disconnect(); document.querySelectorAll('.is-pending').forEach(element => element.classList.remove('is-pending')); }
  });
}

// Measure real rendered lines after fonts settle; reflow remains natural on resize.
const philosophy = document.querySelector('#worries');
async function prepareConcept() {
  if (!('IntersectionObserver' in window) || reducedMotion.matches) return;
  await document.fonts.ready;
  if (reducedMotion.matches) return;
  const textBlocks = [...philosophy.querySelectorAll('h2, .concern h3, .concern p')];
  const originals = textBlocks.map(element => element.innerHTML);
  function buildLines() {
    textBlocks.forEach((element, index) => {
      element.innerHTML = originals[index];
      element.textContent = element.textContent;
      const nodes = [...element.childNodes];
      for (const node of nodes) {
        if (node.nodeType !== Node.TEXT_NODE) continue;
        const fragment = document.createDocumentFragment();
        let line = '', lastTop;
        const flush = () => {
          if (!line) return;
          const span = document.createElement('span');
          span.className = 'concept-line';
          span.textContent = line;
          fragment.append(span);
          line = '';
        };
        const range = document.createRange();
        for (let i = 0; i < node.length; i++) {
          range.setStart(node, i); range.setEnd(node, i + 1);
          const top = range.getBoundingClientRect().top;
          if (lastTop !== undefined && Math.abs(top - lastTop) > 2) flush();
          line += node.textContent[i]; lastTop = top;
        }
        flush(); node.replaceWith(fragment);
      }
      element.querySelectorAll('br').forEach(br => br.remove());
    });
    const pieces = philosophy.querySelectorAll('.section-en, .concept-line, .text-link');
    pieces.forEach((element, index) => {
      element.classList.add('concept-piece');
      element.style.setProperty('--line-index', index);
    });
  }
  buildLines();
  philosophy.classList.add('concept-armed');
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    philosophy.classList.add('concept-play');
    observer.disconnect();
  }, {threshold: 0, rootMargin: '0px 0px -15% 0px'});
  observer.observe(philosophy);
  // Once resized, keep the completed presentation without replay or stale line breaks.
  function finishConcept() {
    observer.disconnect();
    philosophy.classList.remove('concept-armed', 'concept-play');
    textBlocks.forEach((element, index) => { element.innerHTML = originals[index]; });
  }
  window.addEventListener('resize', finishConcept, {once: true});
  reducedMotion.addEventListener('change', event => { if (event.matches) finishConcept(); });
}
prepareConcept();

// Observe sections so tall sections also reveal their edge decoration on entry.
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const shapes = [...document.querySelectorAll('.section-shape')];
  const shapeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelector('.section-shape').classList.remove('shape-pending');
      shapeObserver.unobserve(entry.target);
    });
  }, {threshold:0});
  shapes.forEach(shape => {
    shape.classList.add('shape-pending');
    shapeObserver.observe(shape.parentElement);
  });
  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    shapeObserver.disconnect();
    shapes.forEach(shape => shape.classList.remove('shape-pending'));
  });
}
