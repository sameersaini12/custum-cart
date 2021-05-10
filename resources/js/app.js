import axios from 'axios';
import Noty from 'noty';

const addToCart = document.querySelectorAll(".add-to-cart");
const cartCounter = document.querySelector("#cartCounter");

const updateCart = (product)=> {
    axios.post("/update-cart" , product).then((res)=> {
        cartCounter.innerHTML = res.data.totalQty;
        new Noty({
            type: 'success',
            timeout : 1000,
            text : 'Item added to cart',
            progressBar : false
        }).show();
    }).catch((err)=> {
        new Noty({
            type: 'error',
            timeout : 1000,
            text : 'Something went wrong',
            progressBar : false
        }).show();
    })
}

addToCart.forEach((btn)=> {
    btn.addEventListener('click' , (e)=> {
        let product = JSON.parse(btn.dataset.product);
        updateCart(product);
    })
})