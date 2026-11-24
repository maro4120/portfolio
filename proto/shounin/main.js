'use strict';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const form = document.querySelector('#course-quiz');
const result = document.querySelector('#quiz-result');
form.addEventListener('change', () => {
  const answers = new FormData(form);
  if (!['q1', 'q2', 'q3'].every(key => answers.has(key))) return;
  const id = answers.get('q3') === 'yes' ? 'career'
    : answers.get('q2') === 'yes' ? 'premium'
    : answers.get('q1') === 'no' ? 'start' : 'complete';
  document.querySelectorAll('.is-selected').forEach(card => card.classList.remove('is-selected'));
  document.querySelectorAll('.match-label').forEach(label => label.remove());
  const card = document.getElementById(id);
  const label = document.createElement('p');
  label.className = 'match-label';
  label.textContent = 'あなたにおすすめ';
  card.prepend(label);
  card.classList.add('is-selected');
  card.classList.remove('is-pending');
  result.textContent = `あなたにおすすめ：${card.querySelector('h3').textContent}`;
  card.focus({ preventScroll: true });
  card.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center' });
});
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('is-pending');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06 });
  document.querySelectorAll('.reveal').forEach(element => {
    element.classList.add('is-pending');
    observer.observe(element);
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      observer.disconnect();
      document.querySelectorAll('.is-pending').forEach(element => element.classList.remove('is-pending'));
    }
  });
}
