// Formulario de demo (demo.html).
//
// Mejora progresiva, igual que el resto del sitio: sin JS el formulario se ve
// entero en una sola página y se envía por POST común a lead.php, que redirige
// a gracias.html. Con JS se muestra de a una pregunta por pantalla, valida cada
// paso y envía por fetch para poder mostrar un error sin perder lo cargado.
(function () {
  'use strict';

  var form = document.getElementById('lead-form');
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll('.step'));
  var backBtn = document.getElementById('lead-back');
  var nextBtn = document.getElementById('lead-next');
  var countEl = document.getElementById('lead-count');
  var barEl = document.getElementById('lead-progress-bar');
  var errorEl = document.getElementById('lead-error');
  var otraField = document.getElementById('field-otra');
  var otraInput = document.getElementById('especialidad_otra');
  var current = 0;
  var sending = false;

  var WHATSAPP_URL = 'https://wa.me/message/32RX4Y3TNNZ4O1';

  form.classList.add('is-stepped');

  // Los botones "Elegir plan" del sitio llegan con ?plan=..., y se preselecciona
  // la cantidad de profesionales (se puede cambiar igual).
  var params = new URLSearchParams(window.location.search);
  var planToProfesionales = { esencial: '1', profesional: '2-4', integral: '9+' };
  var preset = planToProfesionales[params.get('plan')];
  if (preset) {
    var presetInput = form.querySelector('input[name="profesionales"][value="' + preset + '"]');
    if (presetInput) presetInput.checked = true;
  }

  function stepRadios(step) {
    return step.querySelectorAll('input[type="radio"]');
  }

  function checkedValue(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function syncOtra() {
    var isOtra = checkedValue('especialidad') === 'otra';
    otraField.classList.toggle('is-visible', isOtra);
  }

  function showError(msg) {
    errorEl.innerHTML = msg;
    errorEl.classList.toggle('is-visible', Boolean(msg));
  }

  function render() {
    steps.forEach(function (step, i) {
      step.classList.toggle('is-active', i === current);
    });
    var isLast = current === steps.length - 1;
    backBtn.style.visibility = current === 0 ? 'hidden' : 'visible';
    nextBtn.textContent = isLast ? 'Enviar' : 'Siguiente';
    countEl.textContent = 'Paso ' + (current + 1) + ' de ' + steps.length;
    barEl.style.width = ((current + 1) / steps.length) * 100 + '%';
    syncOtra();
    showError('');
  }

  function focusStep() {
    var step = steps[current];
    var target =
      step.querySelector('input[type="radio"]:checked') ||
      step.querySelector('input[type="radio"]') ||
      step.querySelector('input:not([tabindex="-1"])');
    if (target) target.focus({ preventScroll: true });
  }

  function validPhone(value) {
    return value.replace(/\D/g, '').length >= 8;
  }

  function validEmail(value) {
    return value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  // Devuelve un mensaje de error para el paso, o '' si está completo.
  function validateStep(step) {
    if (stepRadios(step).length) {
      var name = stepRadios(step)[0].name;
      if (!checkedValue(name)) return 'Elegí una opción para seguir.';
      if (name === 'especialidad' && checkedValue(name) === 'otra' && !otraInput.value.trim()) {
        otraInput.focus();
        return 'Contanos cuál es tu especialidad.';
      }
      return '';
    }
    var required = step.querySelectorAll('input[required]');
    for (var i = 0; i < required.length; i++) {
      if (!required[i].value.trim()) {
        required[i].focus();
        return 'Completá todos los datos, salvo el email que es opcional.';
      }
    }
    var phone = form.querySelector('#whatsapp');
    if (!validPhone(phone.value)) {
      phone.focus();
      return 'Revisá el número de WhatsApp: incluí el código de área.';
    }
    var email = form.querySelector('#email');
    if (!validEmail(email.value.trim())) {
      email.focus();
      return 'Revisá el email, o dejalo vacío.';
    }
    return '';
  }

  function go(index) {
    current = Math.max(0, Math.min(index, steps.length - 1));
    render();
    focusStep();
  }

  function next() {
    var err = validateStep(steps[current]);
    if (err) {
      showError(err);
      return;
    }
    if (current < steps.length - 1) {
      go(current + 1);
    } else {
      submit();
    }
  }

  function submit() {
    if (sending) return;
    sending = true;
    nextBtn.disabled = true;
    nextBtn.textContent = 'Enviando…';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok || !data.ok) throw new Error(data.error || 'error');
          return data;
        });
      })
      .then(function (data) {
        // Solo datos no personales en la URL: el camino y la especialidad.
        var esp = checkedValue('especialidad');
        window.location.href =
          'gracias.html?ruta=' + encodeURIComponent(data.ruta) + '&esp=' + encodeURIComponent(esp);
      })
      .catch(function () {
        sending = false;
        nextBtn.disabled = false;
        nextBtn.textContent = 'Reintentar';
        showError(
          'No pudimos enviar el formulario. Probá de nuevo o escribinos directo por ' +
            '<a href="' + WHATSAPP_URL + '" target="_blank" rel="noreferrer">WhatsApp</a>.',
        );
      });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    next();
  });

  backBtn.addEventListener('click', function () {
    go(current - 1);
  });

  // Elegir una opción avanza solo (salvo "Otra especialidad", que pide texto).
  steps.forEach(function (step, i) {
    Array.prototype.forEach.call(stepRadios(step), function (radio) {
      radio.addEventListener('change', function () {
        syncOtra();
        showError('');
        if (radio.value === 'otra') {
          otraInput.focus();
          return;
        }
        // Solo con un clic o una tecla: navegar con flechas también dispara
        // "change" y no queremos saltar de paso mientras alguien recorre opciones.
        if (Date.now() - arrowAt < 150) return;
        setTimeout(function () {
          if (current === i) next();
        }, 220);
      });
    });
  });

  var arrowAt = 0;
  document.addEventListener(
    'keydown',
    function (e) {
      if (/^Arrow/.test(e.key)) arrowAt = Date.now();
    },
    true,
  );

  // Atajos tipo Typeform: A/B/C/D eligen la opción del paso actual.
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' && e.target.type !== 'radio') return;
    var radios = stepRadios(steps[current]);
    var idx = 'abcd'.indexOf(e.key.toLowerCase());
    if (idx === -1 || !radios[idx]) return;
    e.preventDefault();
    radios[idx].checked = true;
    radios[idx].focus();
    radios[idx].dispatchEvent(new Event('change', { bubbles: true }));
  });

  render();
})();
