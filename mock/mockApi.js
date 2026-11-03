class MockApi {
    async getProducts() {
        // mock data pulled from fakestoreapi.com, mapped to our Product schema
        const res = await fetch('https://fakestoreapi.com/products');
        const data = await res.json();
        return data.map((p) => ({
            title: p.title,
            description: p.description,
            price: p.price,
            category: p.category.toLowerCase(),
            image: p.image,
            rating: p.rating ? p.rating.rate : 0,
            // fakestoreapi has no stock field, so stock is derived deterministically
            stock: (Math.abs(Math.round(p.price * 10)) % 50) + 5
        }));
    }
}

module.exports = new MockApi();
