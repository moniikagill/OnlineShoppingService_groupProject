$(document).ready(function (e) {
  // this is the id of the form
  $("#login_form").submit(function (e) {


    e.preventDefault(); // avoid to execute the actual submit of the form.

    var form = $(this);
    var url = form.attr('action');

    $.post(url, form.serialize(), function (data) {
      var textStatus = data;

      fadeLogin(textStatus.username, textStatus.id);

      getCartonLoad(textStatus.id)
    }).fail(function (data) {
      var textStatus = data;
      console.log(textStatus)
      alert(textStatus.responseText);
    });

    
    $("#login_form").trigger("reset");

  });

  $("#sign-out").click(function () {
    $.get("/api/user/logout", function (data) {

      $("#user-details").text("");
      [$("#username_li"), $("#signout_li"), $("#cart_li")]
        .reduce(function (el, next) {
          return el.add(next);
        }).fadeOut("slow", function () {

          [$("#login_li"), $("#signup_li")]
            .reduce(function (el, next) {
              return el.add(next);
            })
            .fadeIn("slow")
        });
    }).fail(function (data) {
      var textStatus = data;
      console.log(textStatus)
      alert(textStatus.responseText);
    });
  });

  // browse button
  $("#browse").click(function () {
    $("#cafeitems").fadeIn("slow");
  });

  $("#loginButton").click(function () {
    let loginContainer = $("#loginContainer");
    let username = $("#username");

    if (loginContainer.is(":hidden")) {

      loginContainer.show("slide", { direction: "right" }, 700);
      username.focus();
    } else {

      let password = $("#password")

      if (username.val().length == 0 || password.val().length == 0) {
        loginContainer.hide("slide", { direction: "right" }, 700);
        return;
      }

      $("#login_form").submit();
    }
  });
});


function onSubmitFormEmail() {
  var email = $('#Form-email5').val();
  var pass = $('#Form-pass5').val();
  var name = $('#firstname').val();

  var lastname = $('#lastname').val();

  addNewUser(email, pass, name, lastname);
}


function addNewUser(email, password, name, lastname) {
  $.ajax({
    url: '/api/user/signup',
    contentType: "application/json",
    type: 'POST',
    data: JSON.stringify({
      "user": {
        username: email,
        password: password,
        cust_f_name: name,
        cust_l_name: lastname
      }
    })

  }).done(function (data) {
    fadeLogin(data.username, data.id);
    $('#darkModalForm').modal('hide');
  }).fail(function (response) { alert(response.responseText); });
}

function deleteUser(userid) {
  $.ajax({
    url: '/api/user/' + userid,
    type: 'DELETE',
    success: function (result) {
      window.location.href = '/';
    },
    error: function (result) {
      alert("Unable to remove user");
    }
  });
}

function fadeLogin(username, id) {
  [$("#login_li"), $("#signup_li"), $("#loginContainer")]
    .reduce(function (el, next) {
      return el.add(next);
    })
    .fadeOut("slow", function () {
      $("#user-details").text(username);
      $("#user-details").attr('href', '/api/user/' + id);

      [$("#username_li"), $("#signout_li"), $("#cart_li")]
        .reduce(function (el, next) {
          return el.add(next);
        }).fadeIn("slow");
    });
}