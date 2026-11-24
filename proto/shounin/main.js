'use strict';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const behavior = () => reducedMotion.matches ? 'instant' : 'smooth';
const header = document.querySelector('.header');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
menuButton.hidden = false;
header.classList.add('menu-ready');
function closeMenu() {
  header.classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'メニューを開く');
}
menuButton.addEventListener('click', () => {
  const open = header.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
});
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && header.classList.contains('menu-open')) { closeMenu(); menuButton.focus(); }
});
const track = document.querySelector('.course-grid');
const cards = [...track.querySelectorAll('.course-card')];
const prev = document.querySelector('.slide-prev');
const next = document.querySelector('.slide-next');
document.querySelector('.slider-controls').hidden = false;
function currentIndex() {
  const left = track.getBoundingClientRect().left + 8;
  return cards.reduce((best, card, index) => Math.abs(card.getBoundingClientRect().left - left) < Math.abs(cards[best].getBoundingClientRect().left - left) ? index : best, 0);
}
function goToCard(card) {
  track.scrollTo({left: track.scrollLeft + card.getBoundingClientRect().left - track.getBoundingClientRect().left - 8, behavior: behavior()});
}
function updateSlider() {
  prev.disabled = track.scrollLeft < 2;
  next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  document.querySelector('.slide-count').textContent = `${currentIndex() + 1} / ${cards.length}`;
}
prev.addEventListener('click', () => goToCard(cards[Math.max(0, currentIndex() - 1)]));
next.addEventListener('click', () => goToCard(cards[Math.min(cards.length - 1, currentIndex() + 1)]));
track.addEventListener('scroll', updateSlider, {passive: true});
window.addEventListener('resize', updateSlider);
track.addEventListener('keydown', event => {
  if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  goToCard(cards[Math.max(0, Math.min(cards.length - 1, currentIndex() + (event.key === 'ArrowRight' ? 1 : -1)))]);
});
updateSlider();
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
  card.prepend(label);
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
  goToCard(card);
  window.scrollTo({top: window.scrollY + track.getBoundingClientRect().top - 55, behavior: behavior()});
});
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('is-pending'); observer.unobserve(entry.target); }
    });
  }, {threshold: 0.06});
  document.querySelectorAll('.reveal:not(.course-card)').forEach(element => { element.classList.add('is-pending'); observer.observe(element); });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) { observer.disconnect(); document.querySelectorAll('.is-pending').forEach(element => element.classList.remove('is-pending')); }
  });
}
