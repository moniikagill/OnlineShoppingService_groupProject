var pid;
var quan;
$(document).ready(function (e) {
  const cart = $('#cart');
  const cartInfo = $('#cart-info');
  //var pid;
  cartInfo.click(function () {
    cart.toggleClass('show-cart');
  });

  var cartItemList = [];


  // to load the items that are already in the cart
  // var listOFitemsAlreadyThere = cart.find(".cart-item");

  // $.each(listOFitemsAlreadyThere, function(index, item) {
  //   cartItemList.push({id: item.find("#product-id").text(), count: item.find("#product-id").text()});
    
  // })

  
  $(".bottom-right").each(function (index) {
    const shopItem = $(this).closest(".card");
    $(this).on("click", function () {

      var foundInList = false;
      var itemCount = 1;

      let item = {};
      item.img = shopItem.find(".card-img-top").attr('src');
      item.name = shopItem.find("#name").text();
      item.price = parseInt(shopItem.find("#price").text());
      item.id = shopItem.find("#product-id").text();
      pid = item.id; console.log(pid+ "this is my product id");
      
      debugger;
      for (var x = 0; x < cartItemList.length; x++) {
        if (cartItemList[x].id === item.id) {
          cartItemList[x].count += 1;
          foundInList = true;
          itemCount = cartItemList[x].count;
          break;
        }
      }

      if (!foundInList) {
        cartItemList.push({id: item.id, count: 1});

        const cartItem = document.createElement('div');
        cartItem.setAttribute("id", item.product_id);
      cartItem.classList.add('cart-item', 'd-flex', 'justify-content-between', 'text-capitalize', 'my-3');

      cartItem.innerHTML =
        `
           <img src="${item.img}" width="100px" class="img-fluid rounded-circle checkoutImg" id="item-img" alt="">

            <div style="display:none">${item.id}</div>
            <div class="item-text">
              <p id="cart-item-title-${item.id}" class="font-weight-bold mb-0">${item.name}</p>
              <span></span>
              <span class="cart-item-price" class="mb-0">$${item.price}</span> <span id="quantity"></span>
            </div>

            <a href="#" class="cart-item-remove" onclick="removeCartItem(this);">
              <i class="fa fa-trash"></i>
            </a>
        `;

      cart.prepend($(cartItem));
      }
      else {
        $("#cart-item-title-"+item.id).text(item.name + " [" + itemCount + "]");
      }
       quan = itemCount;
       console.log(quan);
      updateTotalCost(item.price);
      console.log(cartItemList);

    });
  });
});

// show totals
function updateTotalCost(addedCost) {
  let currentTotal = parseInt($("#cart-total").text());
  currentTotal += addedCost;
  $("#cart-total").text(currentTotal);
}

function removeCartItem(el) {

}
function getCartonLoad(id){
  
  $.ajax({
    url: '/api/user/'+ id +'/cart',
    contentType: "application/json",
    type: 'GET',
    
  }).done(function (results) {
    JSON.stringify(results);
    const cart = $('#cart');
    var cartItemList = [];

    $.each(results, function (index, item) {
      console.log(item)
      const cart = $('#cart');
      var cartItemList = [];

      cartItemList.push({id: item.product_id, count: item.quantity});

      const cartItem = document.createElement('div');
      cartItem.setAttribute("id", item.product_id);
      cartItem.classList.add('cart-item', 'd-flex', 'justify-content-between', 'text-capitalize', 'my-3');

      cartItem.innerHTML =
        `
           <img src="${item.product_img}" width="100px" class="img-fluid rounded-circle checkoutImg" id="item-img" alt="">

            <div style="display:none">${item.product_id}</div>
            <div class="item-text">
              <p id="cart-item-title-${item.product_id}" class="font-weight-bold mb-0">${item.product_name}</p>
              <span></span>
              <span class="cart-item-price" class="mb-0">$${item.price}</span> <span id="quantity"></span>
            </div>

            <a href="#" class="cart-item-remove" onclick="removeCartItem(this);">
              <i class="fa fa-trash"></i>
            </a>
        `;

      cart.prepend($(cartItem));

    })
    //console.log(results);

    //return results;
  });
  //console.log(items);  
  

 // $.each(items.responseJSON, function(index){
   // $.each(this, function(index, item){
     //function (index, item) {
    /*cartItemList.push({id: item.id, count: 1});

        const cartItem = document.createElement('div');
      cartItem.classList.add('cart-item', 'd-flex', 'justify-content-between', 'text-capitalize', 'my-3');

      cartItem.innerHTML =
        `
           <img src="${item.img}" width="100px" class="img-fluid rounded-circle checkoutImg" id="item-img" alt="">

            <div style="display:none">${item.id}</div>
            <div class="item-text">
              <p id="cart-item-title-${item.id}" class="font-weight-bold mb-0">${item.name}</p>
              <span></span>
              <span class="cart-item-price" class="mb-0">$${item.price}</span> <span id="quantity"></span>
            </div>

            <a href="#" class="cart-item-remove" onclick="removeCartItem(this);">
              <i class="fa fa-trash"></i>
            </a>
        `;

      cart.prepend($(cartItem));
  })
  */
  //console.log(items.responseJSON[index]);
  //})
//})
  
}
function settingCart() {
  var email = $("#user-details").text();
  console.log(email+ "tetsing the email with posting");
  
  $.ajax({
    url: '/api/getCustId',
    contentType: "application/json",
    type: 'POST',
    data: JSON.stringify({
      "user": {
        email: email
      }
    })

  }).done(function (data) { console.log(data+ "this is the data");
    $.ajax({
      url: '/api/postCart',
      contentType: "application/json",
      type: 'POST',
      data: JSON.stringify({
        "cart": {
          cust_id: data,
          product_id: pid,
          quantity: quan
        }
      })}).done(function (data) {
        console.log("success");
        console.log(data + "cheching data");
        
      }).fail(function (response) { alert(response.responseText); });
    }).fail(function (response) { alert(response.responseText); });
  }


// function settingCart() {
//   var email = $("#user-details");
//   console.log(email+ "tetsing the email with posting");
//   $.ajax({
//     url: '/api/getCustId',
//     contentType: "application/json",
//     type: 'POST',
//     data: JSON.stringify({
//       "user": {
//         email: email
//       }
//     })

//   }).done(function (data) { console.log(data+ "this is the data");
//     $.ajax({
//       url: '/api/postCart',
//       contentType: "application/json",
//       type: 'POST',
//       data: JSON.stringify({
//         "cart": {
//           cust_id: data,
//           product_id: pid,
//           quantity: quan
//         }
//       })}).done(function (data) {
//         console.log("success");
        
//       }).fail(function (response) { alert(response.responseText); });
//     }).fail(function (response) { alert(response.responseText); });
  
//   }
  
  function checkoutCart(){

  }
