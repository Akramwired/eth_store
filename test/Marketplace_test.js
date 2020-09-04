const { assert } = require("chai");

require("chai")
    .use(require("chai-as-promised"))
    .should();

const Marketplace = artifacts.require("Marketplace");
contract('Marketplace', ([deployer, seller, buyer])=> {
    let marketplace;
    
    before(async ()=> {
        marketplace = await Marketplace.deployed();
    });

    describe('deployment', async ()=> {
        it('deploys successfully', async ()=> {
            const address = await marketplace.address;
            assert.notEqual(address, 0x0);
            assert.notEqual(address, "");
            assert.notEqual(address, null);
            assert.notEqual(address, undefined);
        });
        it('a name has been initialized', async ()=> {
            const name = await marketplace.name();
            assert.equal(name, "Akramwired E-commerce");
        });
    });

    describe('product', async () => {
        let result, productCount;
        before(async () => {
            result = await marketplace.createProduct('rog strix', web3.utils.toWei('1', 'Ether'), { from: seller});
            productCount = await marketplace.productCount();
        });
        it('creating the product', async ()=> {
            // Success assertion
            assert.equal(productCount, 1);
            const event = result.logs[0].args;
            assert.equal(event.id.toNumber(), productCount, 'product id is correct');
            assert.equal(event.name, 'rog strix', 'product name is correct');
            assert.equal(event.price, '1000000000000000000', 'product price is correct');
            assert.equal(event.owner, seller, 'product owner is correct');
            assert.equal(event.purchased, false, 'purchased status of product is correct');
            // Failure assertion for name
            await marketplace.createProduct('', web3.utils.toWei('1', 'Ether'), { from: seller}).should.be.rejected;
            // Failure assertion for price
            await marketplace.createProduct('rog strix', 0, { from: seller}).should.be.rejected;
        });

        it('list the products', async () => {
            // Success assertion
            const product = await marketplace.products(productCount);
            assert.equal(product.id.toNumber(), productCount, 'product id is correct');
            assert.equal(product.name, 'rog strix', 'product name is correct');
            assert.equal(product.price, '1000000000000000000', 'product price is correct');
            assert.equal(product.owner, seller, 'product owner is correct');
            assert.equal(product.purchased, false, 'purchased status of product is correct');
        });

        it('purchases the product', async ()=> {
            // Tracking the seller balance before purchasing
            let oldSellerBalance;
            oldSellerBalance = await web3.eth.getBalance(seller);
            oldSellerBalance = new web3.utils.BN(oldSellerBalance);

            // Success assertion
            result = await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'Ether') });
            // Checking the log
            const event = result.logs[0].args;
            assert.equal(event.id.toNumber(), productCount, 'product id is correct');
            assert.equal(event.name, 'rog strix', 'product name is correct');
            assert.equal(event.price, '1000000000000000000', 'product price is correct');
            assert.equal(event.owner, buyer, 'product owner is correct');
            assert.equal(event.purchased, true, 'purchased status of product is correct');

            // Checking that the seller has received the fund
            let newSellerBalance;
            newSellerBalance = await web3.eth.getBalance(seller);
            newSellerBalance = new web3.utils.BN(newSellerBalance);

            let price;
            price = await web3.utils.toWei('1', 'Ether');
            price = new web3.utils.BN(price);

            /* console.log(oldSellerBalance, newSellerBalance, price); */
            const expectedBalance = oldSellerBalance.add(price);
            assert.equal(expectedBalance.toString(), newSellerBalance.toString());

            // Failure assertion: Trying to buy a product that doesnot exist i.e., product must have a valid id
            await marketplace.purchaseProduct(99, { from: buyer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
            // Failure assertion: Trying to buy a product without enough Ether
            await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('0.5', 'Ether') }).should.be.rejected;
            // Failure assertion: Trying to purchase the product twice i.e., the product cannot be purchased twice
            await marketplace.purchaseProduct(productCount, { from: deployer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
            // Failure assertion: Trying to purchase the product twice i.e., the buyer cannot be the seller
            await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
        });
    })
});