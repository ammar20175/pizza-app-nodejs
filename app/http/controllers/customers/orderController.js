const Order = require('../../../models/order');
const moment = require('moment');
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

function orderController() {
    return {
        store(req, res) {

            const { phone, address, stripeToken, paymentType } = req.body
            // console.log('this is phone', phone);
            // console.log('this is address', address)
            // validate
            if (!phone || !address) {
                return res.status(422).json({ message: 'All fields are required' });
            }

            const order = new Order({
                customerId: req.user._id,
                items: req.session.cart.items,
                phone,
                address
            })

            order.save().then(result => {
                // console.log("this is from result", result)
                Order.populate(result, { path: 'customerId' }, (err, placedOrder) => {
                    // req.flash('success', 'order placed successfully.');

                    //stripe paymeny
                    if (paymentType === 'card') {
                        stripe.charges.create({
                            amount: req.session.cart.totalPrice * 100,
                            source: stripeToken,
                            currency: 'usd',
                            description: `Pizza order:${placedOrder._id}`
                        }).then(() => {

                            placedOrder.paymentStatus = true;
                            placedOrder.paymentType = paymentType;
                            placedOrder.save().then((ord) => {
                                //will get updated version of order
                                // console.log(ord);
                                //emit event 
                                const eventEmitter = req.app.get('eventEmitter');
                                eventEmitter.emit('orderPlaced', ord);
                                delete req.session.cart;
                                return res.json({ success: 'Payment successfull,order placed successfully.' });
                            }).catch((err) => {

                            })

                        }).catch((err) => {
                            delete req.session.cart;
                            return res.json({ success: 'Payment failed,You can pay at Delivery time' });
                        })
                    } else {
                        delete req.session.cart;
                        return res.json({ message: 'Order placed Succesfully' });
                    }



                    // return res.redirect('/customer/orders');

                });

            }).catch(error => {
                return res.status(500).json({ message: 'something went wrong' });
                // req.flash('error', 'something went wrong');
                // return res.redirect('/cart');
            });
        },

        async index(req, res) {
            const orders = await Order.find({ customerId: req.user._id },
                null,
                { sort: { createdAt: -1 } }
            );

            res.header('Cache-Control', 'no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
            res.render('customers/orders', { orders: orders, moment: moment })
        },

        async show(req, res) {
            const order = await Order.findById(req.params.id);

            // Authorize user
            if (req.user._id.toString() === order.customerId.toString()) {
                return res.render('customers/singleOrder', { order });
            }
            return res.redirect('/');
        }
    }
}

module.exports = orderController;