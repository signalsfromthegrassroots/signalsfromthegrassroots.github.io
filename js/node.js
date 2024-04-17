var FUNDING_SOURCES = [
  {{ fundingSources,list_2 }}
];
FUNDING_SOURCES.forEach(function (fundingSource) {
paypal.Buttons({
  fundingSource: fundingSource,
  style: {
    color: (fundingSource==paypal.FUNDING.PAYLATER) ? 'gold' : '',
    layout: 'vertical',
    shape: 'rect'
  },
  createOrder: function(data, actions) {
    return actions.order.create({
      purchase_units: [
        {
          "amount":
            {
              "currency_code":"USD",
              "value":100
            }
        }
      ]
    });
  },

  onApprove: function(data, actions) {
    return actions.order.capture().then(function(orderData) {
      console.log('Capture result', orderData, JSON.stringify(orderData, null, 2));
      const element = document.getElementById('paypal-button-container');
      element.innerHTML = '';
      element.innerHTML = '<h3>Thank you for your payment!</h3>';
    });
  },

  onError: function(err) {
    console.log(err);
  }

}).render("#paypal-button-container");
});

// If this returns false or the card fields aren't visible, see Step #1.
if (paypal.HostedFields.isEligible()) {
let orderId;
// Renders card fields

paypal.HostedFields.render({
  // Call your server to set up the transaction
  createOrder: () => {
    return fetch("/api/orders", {
      method: "post",
      // use the "body" param to optionally pass additional order information like
      // product ids or amount.
    })
    .then((res) => res.json())
    .then((orderData) => {
      orderId = orderData.id; // needed later to complete capture
      return orderData.id;
    });
  },
  styles: {
    ".valid": {
      color: "green",
    },
    ".invalid": {
      color: "red",
    },
  },
  fields: {
    number: {
      selector: "#card-number",
      placeholder: "4111 1111 1111 1111",
    },
    cvv: {
      selector: "#cvv",
      placeholder: "123",
    },
    expirationDate: {
      selector: "#expiration-date",
      placeholder: "MM/YY",
    },
  },
}).then((cardFields) => {
  document.querySelector("#card-form").addEventListener("submit", (event) => {
    event.preventDefault();
    cardFields
      .submit({
        // Cardholder's first and last name
        cardholderName: document.getElementById("card-holder-name").value,
        // Billing Address
        billingAddress: {
          // Country Code
          countryCodeAlpha2: document.getElementById(
            "card-billing-address-country"
          ).value,
        },
      })
      .then(() => {
        fetch(`/api/orders/${orderId}/capture`, {
          method: "post",
        })
        .then((res) => res.json())
        .then((orderData) => {
          const errorDetail =
            Array.isArray(orderData.details) && orderData.details[0];
          if (errorDetail) {
            var msg = "Sorry, your transaction could not be processed.";
            if (errorDetail.description)
              msg += "\n\n" + errorDetail.description;
            if (orderData.debug_id) msg += " (" + orderData.debug_id + ")";
            return alert(msg); // Show a failure message
          }
          // Show a success message or redirect
          alert("Transaction completed!");
        });
      })
      .catch((err) => {
        alert("Payment could not be captured! " + JSON.stringify(err));
      });
    });
  });
} else {
  // Hides card fields if the merchant isn't eligible
  document.querySelector("#card-form").style = "display: none";
}