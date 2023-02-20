import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { placeOrder } from "./apiService";
import { CardWiget } from "./CardWidget";

export async function initStripe() {
    const stripe = await loadStripe(process.env.STRIPE_PUBLIC_KEY);

    let card = null;

    //function for creating card wight
    //shifted to CardWidget class file
    // function mountWight() {
    //     const elements = stripe.elements();
    //     let style = {
    //         base: {
    //             color: '#32325d',
    //             fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    //             fontSmoothing: 'antialiased',
    //             fontSize: '16px',
    //             '::placeholder': {
    //                 color: '#aab7c4'
    //             }
    //         },
    //         invalid: {
    //             color: '#fa755a',
    //             iconColor: '#fa755a'
    //         }
    //     };

    //     card = elements.create('card', { style, hidePostalCode: true });
    //     card.mount('#card-element');
    // }



    const paymentType = document.querySelector('#paymentType');
    if (!paymentType) {
        return;
    }

    paymentType.addEventListener('change', (e) => {
        if (e.target.value === 'card') {
            //Display Widget
            card = new CardWiget(stripe);
            card.mount();
            // mountWight();
        } else {
            card.destory();
        }
    });
    //ajax call 

    const paymentForm = document.querySelector('#payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            let formData = new FormData(paymentForm);
            let formObject = {};
            for (let [key, value] of formData.entries()) {
                formObject[key] = value;
            }

            if (!card) {
                placeOrder(formObject);
                return;
            }
            const token = await card.createToken();
            formObject.stripeToken = token.id;
            placeOrder(formObject);

            // stripe.createToken(card).then((result) => {
            //     formObject.stripeToken = result.token.id;
            //     console.log(formObject);
            //     placeOrder(formObject);
            // }).catch((err) => {
            //     console.log(err);
            // });
        });
    }
}