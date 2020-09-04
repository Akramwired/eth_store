pragma solidity ^0.5.0;
contract Marketplace {
    string public name;
    mapping(uint => Product) public products;
    uint public productCount = 0;

    struct Product {
        uint id;
        string name;
        uint price;
        address payable owner;
        bool purchased;
    }
    
    constructor() public {
        name = "Akramwired E-commerce";
    }

    event ProductCreated (
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );

    event ProductPurchased (
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );    
    

    function createProduct(string memory _name, uint _price) public{
        // Requiring a valid name
        require(bytes(_name).length > 0);
        // Requiring a valid price
        require(_price > 0);
        // Incrementing the productCount counter cache
        productCount ++;
        // Creating the product
        products[productCount] = Product(productCount, _name, _price, msg.sender, false);
        // Triggering the event
        emit ProductCreated(productCount, _name, _price, msg.sender, false);
    }

    function purchaseProduct(uint _id) public payable {
        // Fetching the product
        Product memory _product = products[_id];
        // Fetching the owner
        address payable _seller = _product.owner;
        // Making sure the validity of the product id
        require(_product.id > 0 && _product.id <= productCount);
        // Making sure that there is enough Ether in the transaction
        require(msg.value >= _product.price);
        // Making sure that the product has not been purchased already
        require(_product.purchased == false);
        // Making sure that the buyer is not the seller
        require(_seller != msg.sender);
        // Transfering the ownership to the buyer
        _product.owner = msg.sender;
        // Marking the product as purchased
        _product.purchased = true;
        // Updating the product
        products[_id] = _product;
        // Pay the seller with Ether
        address(_seller).transfer(msg.value);
        // Triggering the event
        emit ProductPurchased(productCount, _product.name, _product.price, msg.sender, true);
    }
}