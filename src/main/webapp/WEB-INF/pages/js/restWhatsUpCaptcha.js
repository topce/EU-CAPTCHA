let EuCaptchaToken;
let degrees = 0;

function getLastSelectedValue() {
  const language = sessionStorage.getItem('language');
  if (language) {
    document.getElementById('dropdown-language').value = language;
  } else {
    sessionStorage.setItem('language', 'en-GB');
    document.getElementById('dropdown-language').value = 'en-GB';
  }
}
$(function () {
  function getLanguage() {
    let language = sessionStorage.getItem('language');
    if (language) {
      return language;
    } else {
      return 'en-GB';
    }
  }
  function getWhatsUpcaptcha() {
    const getCaptchaUrl = $.ajax({
      type: 'GET',
      url: ctx + '/api/captchaImg?captchaType=WHATS_UP&locale=' + getLanguage(),
      success: function (jsonData) {
        EuCaptchaToken = getCaptchaUrl.getResponseHeader('x-jwtString');
        $('#captchaImage').attr(
          'src',
          'data:image/png;base64,' + jsonData.captchaImg
        );
        $('#captchaImage').attr('captchaId', jsonData.captchaId);
        degrees = jsonData.degree;
      },
    });
  }

  function reloadCaptcha() {
    const reloadCaptchaUrl = $.ajax({
      type: 'GET',
      url:
        ctx +
        '/api/reloadCaptchaImg/' +
        $('#captchaImage').attr('captchaId') +
        '?captchaType=WHATS_UP&locale=' +
        getLanguage(),
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('x-jwtString', EuCaptchaToken);
      },
      success: function (jsonData) {
        EuCaptchaToken = reloadCaptchaUrl.getResponseHeader('x-jwtString');
        $('#captchaImage').attr(
          'src',
          'data:image/png;base64,' + jsonData.captchaImg
        );
        $('#captchaImage').attr('captchaId', jsonData.captchaId);
        degrees = jsonData.degree;
      },
    });
  }

  function validateCaptcha() {
    const validateCaptcha = $.ajax({
      type: 'POST',
      url: ctx + '/api/validateCaptcha/' + $('#captchaImage').attr('captchaId'),
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader(
          'Content-Type',
          'application/x-www-form-urlencoded'
        );
        xhr.setRequestHeader('x-jwtString', EuCaptchaToken);
      },
      data: {
        captchaAnswer: $('#captchaAnswer').val() + '',
        useAudio: false,
        captchaType: 'WHATS_UP',
      },
      dataType: 'json',
      cache: false,
      timeout: 600000,
      success: function (obj) {
        $('input').css({ border: '' });
        if ('success' === obj.responseCaptcha) {
          $('#success').css('visibility', 'visible');
          $('#fail').css('visibility', 'hidden');
        } else {
          $('#fail').css('visibility', 'visible');
          $('#success').css('visibility', 'hidden');
          reloadCaptcha();
        }
      },
      error: function (e) {
        console.error('error' + e);
      },
    });
  }

  function toggle_visibility(id) {
    $('#fail').css('visibility', 'hidden');
    $('#success').css('visibility', 'hidden');
    if (id === 'btnslider') {
      $('#btnToLeft').css('visibility', 'hidden');
      $('#btnToRight').css('visibility', 'hidden');
      $('#btnslider').css('visibility', 'hidden');
      $('#btnarrows').css('visibility', 'visible');
      $('#slidecontainer').css('visibility', 'visible');
      getWhatsUpcaptcha();
    } else {
      $('#slidecontainer').css('visibility', 'hidden');
      $('#btnarrows').css('visibility', 'hidden');
      $('#btnslider').css('visibility', 'visible');
      $('#btnToLeft').css('visibility', 'visible');
      $('#btnToRight').css('visibility', 'visible');
      getWhatsUpcaptcha();
    }
  }

  $('#btnslider').click(function () {
    toggle_visibility('btnslider');
  });

  $('#btnarrows').click(function () {
    toggle_visibility('btnarrows');
  });

  $('#captchaReload').click(function () {
    $('#fail').css('visibility', 'hidden');
    $('#success').css('visibility', 'hidden');
    reloadCaptcha();
  });

  $('#captchaSubmit').click(function () {
    validateCaptcha();
  });

  let degree = 0;

  function rotate(orientation, rotationAngle) {
    if (rotationAngle != undefined) {
      degree = rotationAngle;
    } else {
      if (
        degrees * orientation + degree > 360 ||
        degrees * orientation + degree < -360
      )
        degree = 0;
      else degree += degrees * orientation;
    }

    $('#captchaAnswer').val(degree);

    $($('#captchaImage').get(0)).css({
      transform: 'rotate(' + degree + 'deg)',
      '-ms-transform': 'rotate(' + degree + 'deg)',
      '-moz-transform': 'rotate(' + degree + 'deg)',
      '-webkit-transform': 'rotate(' + degree + 'deg)',
      '-o-transform': 'rotate(' + degree + 'deg)',
    });
  }

  $('#btnToLeft').click(function (e) {
    rotate(-1);
  });

  $('#btnToRight').click(function (e) {
    rotate(1);
  });

  $(document).ready(function () {
    $('#dropdown-language').change(function () {
      const selectedOption = $('#dropdown-language').val();
      $('#dropdown-language').val(selectedOption);
      if (selectedOption !== '') {
        sessionStorage.setItem('language', selectedOption);
        window.location.replace('?lang=' + selectedOption);
      }
    });
    toggle_visibility('btnarrows');
  });

  getWhatsUpcaptcha();

  $('#validateWhatsUpCaptcha').click(() => validateCaptcha());

  let slider = document.getElementById('captcha-range');
  let output = document.getElementById('captcha-range-value');
  output.innerHTML = slider.value;

  slider.oninput = function () {
    rotate(1, this.value);
    output.innerHTML = this.value;
  };
});
