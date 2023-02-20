import axios from "axios";

//this function is for ajax call 
export function placeOrder(formObject) {
    axios.post('/orders', formObject).then((res) => {
        window.location.href = '/customer/orders'
    }).catch((err) => {
        console.log(err);
    });
}