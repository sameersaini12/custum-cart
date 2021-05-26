import axios from 'axios';
import moment from 'moment';
import Noty from 'noty';
let socket = io();

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

const orderTableBody = document.querySelector("#orderTableBody");
    let orders= []
    let markup
    axios.get("/admin/orders" ,{
        headers : {
            "X-Requested-With" : "XMLHttpRequest"
        }
    }).then((res)=> {
        orders = res.data
        markup = generateMarkup(orders);
        orderTableBody.innerHTML = markup
    }).catch((err)=> {
        console.log(err)
    })

    const renderItems = (items) => {
        const parsedItems = Object.values(items);
        return parsedItems.map((menuitem)=> {
            return `
                <p>${menuitem.item.title} - ${menuitem.qty} pcs</p>
            `
        }).join('')
    }

    const generateMarkup = (orders)=> {
        return orders.map((order)=> {
            return `
            <tr>
                <td>
                    <p>${order._id}</p>
                    <div> ${renderItems(order.items)} </div>
                </td>
                <td> ${order.customerId.name} </td>
                <td> ${order._id} </td>
                <td>
                    <div>
                        <form action="/admin/order/status" method="POST">
                            <input type="hidden" name="orderId" value="${order._id}" />
                            <select name="status" onchange="this.form.submit()">
                                <option value="order-placed" ${order.status === 'order-placed' ? 'selected' : ''}>Order Placed</option>
                                <option value="order-accepted" ${order.status === 'order-accepted' ? 'selected' : ''}>Order Accepted</option>
                                <option value="out-of-delivery" ${order.status === 'out-of-delivery' ? 'selected' : ''}>Out of Delivery</option>
                                <option value="comming-soon" ${order.status === 'comming-soon' ? 'selected' : ''}>Comming Soon</option>
                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            </select>
                        </form>
                    </div>
                </td>
                <td>
                    ${moment(order.createdAt).format('hh:mm A')}
                </td>
                <td>
                    ${order.paymentStatus ? 'Paid' : 'Not Paid'}
                </td>
            </tr>`
        }).join('')
    }

    socket.on('orderPlaced' , (order)=> {
        new Noty({
            type: 'success',
            timeout : 1000 ,
            text : "New Order",
            progressBar : false,
        }).show();
        orders.unshift(order);
        orderTableBody.innerHTML = ''
        orderTableBody.innerHTML = generateMarkup(orders);
    })

    let statuses = document.querySelectorAll('.status_line')
    let hiddenInput = document.querySelector('#hiddenInput')
    let order = hiddenInput ? hiddenInput.value : null
    order = JSON.parse(order)
    let time = document.createElement('small')
    
    function updateStatus(order) {
        statuses.forEach((status) => {
            status.classList.remove('step-completed')
            status.classList.remove('current')
        })
        let stepCompleted = true;
        statuses.forEach((status) => {
           let dataProp = status.dataset.status
           if(stepCompleted) {
                status.classList.add('step-completed')
           }
           if(dataProp === order.status) {
                
                stepCompleted = false
                time.innerHTML = moment(order.createdAt).format('hh:mm A')
                status.appendChild(time);
               if(status.nextElementSibling) {
                status.nextElementSibling.classList.add('current')
               }
           }
        })
    
    }
    
    updateStatus(order);

    
    //socket
    if(order) {
        socket.emit('join' , `order_${order._id}`)
        }
        
    let adminAreaPath = window.location.pathname;
        if(adminAreaPath.includes("admin"))
        {
            socket.emit('join' , 'adminRoom')
        }
         
        socket.on('orderUpdated' , (data)=> {
            const updateOrder = {...order};
            updateOrder.updateAt = moment().format()
            updateOrder.status = data.status
            updateStatus(updateOrder);
            new Noty({
                type: 'success',
                timeout : 1000 ,
                text : "Order updated",
                progressBar : false,
            }).show();
        })