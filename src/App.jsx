import { useEffect, useState } from 'react'
import './App.css'
import { api, getToken, setToken, getSavedUser, saveUser } from './api.js'

function App() {
  const [view, setView] = useState('shop')
  const [user, setUser] = useState(getSavedUser())
  const [message, setMessage] = useState('')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState(null)
  const [selected, setSelected] = useState(null)
  const [orders, setOrders] = useState([])
  const [adminOrders, setAdminOrders] = useState([])

  const isAdmin = user?.role === 'admin'
  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

  function showToast(text) {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 250)

    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const { products: list, categories: cats } = await api.getProducts({ category, search: debouncedSearch })
        if (!cancelled) setProducts(list)
        if (!cancelled && !cats) {
          const c = await api.getCategories()
          if (!cancelled) setCategories(c.categories)
        }
      } catch (err) {
        if (!cancelled) showToast(err.message)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [category, debouncedSearch])

  useEffect(() => {
    async function loadCart() {
      if (!getToken()) return
      try {
        const { cart: c } = await api.getCart()
        setCart(c)
      } catch (err) {
        showToast(err.message)
      }
    }
    loadCart()
  }, [user])

  useEffect(() => {
    async function loadOrders() {
      if (view !== 'orders' || !getToken()) return
      try {
        const { orders: list } = await api.getMyOrders()
        setOrders(list)
      } catch (err) {
        showToast(err.message)
      }
    }
    loadOrders()
  }, [view])
  useEffect(() => {
    async function loadAdmin() {
      if (view !== 'admin' || !getToken()) return
      try {
        const { orders: list } = await api.getAllOrders()
        setAdminOrders(list)
      } catch (err) {
        showToast(err.message)
      }
    }
    loadAdmin()
  }, [view])

  function handleLoginResult(result) {
    setToken(result.token)
    saveUser(result.user)
    setUser(result.user)
    setView('shop')
    showToast(`Welcome ${result.user.name}`)
  }

  function handleLogout() {
    setToken(null)
    saveUser(null)
    setUser(null)
    setCart(null)
    setView('shop')
    showToast('Logged out')
  }

  async function handleAddToCart(product, quantity = 1) {
    if (!getToken()) {
      setView('auth')
      return
    }
    try {
      const { cart: c } = await api.addToCart(product._id, quantity)
      setCart(c)
      showToast('Added to cart')
    } catch (err) {
      showToast(err.message)
    }
  }

  async function handleCartUpdate(productId, quantity) {
    try {
      const { cart: c } = await api.updateCartItem(productId, quantity)
      setCart(c)
    } catch (err) {
      showToast(err.message)
    }
  }

  async function handleCartRemove(productId) {
    try {
      const { cart: c } = await api.removeCartItem(productId)
      setCart(c)
    } catch (err) {
      showToast(err.message)
    }
  }

  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => setView('shop')}>ecomsite</button>
        <nav>
          <button className={view === 'shop' ? 'navlink active' : 'navlink'} onClick={() => setView('shop')}>Shop</button>
          {isAdmin && <button className={view === 'admin' ? 'navlink active' : 'navlink'} onClick={() => setView('admin')}>Admin</button>}
          {user && !isAdmin && <button className={view === 'orders' ? 'navlink active' : 'navlink'} onClick={() => setView('orders')}>My Orders</button>}
          {user && (
            <button className={view === 'cart' ? 'navlink cart-link active' : 'navlink cart-link'} onClick={() => setView('cart')}>
              Cart{cartCount > 0 ? ` (${cartCount})` : ''}
            </button>
          )}
          {user ? (
            <button className="navlink" onClick={handleLogout}>Logout ({user.name})</button>
          ) : (
            <button className="navlink" onClick={() => setView('auth')}>Login</button>
          )}
        </nav>
      </header>

      {message && <div className="toast">{message}</div>}

      <main>
        {view === 'shop' && (
          <ShopView
            products={products}
            categories={categories}
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            loading={loading}
            onOpen={(p) => { setSelected(p); setView('product') }}
            onAddToCart={handleAddToCart}
          />
        )}

        {view === 'product' && selected && (
          <ProductView product={selected} onAddToCart={handleAddToCart} onBack={() => setView('shop')} />
        )}

        {view === 'cart' && (
          <CartView cart={cart} onUpdate={handleCartUpdate} onRemove={handleCartRemove} showToast={showToast} onPlaced={(orderId) => { setCart(null); setView('orders'); showToast(`Order ${orderId} placed`) }} />
        )}

        {view === 'orders' && <OrdersView orders={orders} />}

        {view === 'auth' && <AuthView onLogin={handleLoginResult} />}

        {view === 'admin' && isAdmin && (
          <AdminView
            showToast={showToast}
            products={products}
            onProductsChanged={async () => {
              const { products: list } = await api.getProducts({ category, search })
              setProducts(list)
            }}
            orders={adminOrders}
          />
        )}
      </main>
    </>
  )
}

function ShopView({ products, categories, search, setSearch, category, setCategory, loading, onOpen, onAddToCart }) {
  return (
    <section id="shop">
      <div className="filters">
        <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="empty">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="empty">No products found</p>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <article key={p._id} className="card" onClick={() => onOpen(p)}>
              <img src={p.image} alt={p.title} loading="lazy" />
              <div className="card-body">
                <h3>{p.title}</h3>
                <p className="muted">{p.category}</p>
                <div className="card-footer">
                  <span className="price">${Number(p.price).toFixed(2)}</span>
                  <button onClick={(e) => { e.stopPropagation(); onAddToCart(p) }} disabled={p.stock === 0}>Add to cart</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function ProductView({ product, onAddToCart, onBack }) {
  const [qty, setQty] = useState(1)
  return (
    <section id="product">
      <button className="navlink" onClick={onBack}>&larr; Back to shop</button>
      <div className="product-detail">
        <img src={product.image} alt={product.title} />
        <div>
          <h2>{product.title}</h2>
          <p className="muted">{product.category} &middot; rating {product.rating}</p>
          <p className="price big">${Number(product.price).toFixed(2)}</p>
          <p>{product.description}</p>
          <p className="muted">{product.stock} left in stock</p>
          <div className="row">
            <select value={qty} onChange={(e) => setQty(Number(e.target.value))}>
              {Array.from({ length: Math.max(product.stock, 1) }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <button disabled={product.stock === 0} onClick={() => onAddToCart(product, qty)}>
              {product.stock === 0 ? 'Out of stock' : 'Add to cart'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function CartView({ cart, onUpdate, onRemove, showToast, onPlaced }) {
  const [address, setAddress] = useState('')
  const [placing, setPlacing] = useState(false)

  // local draft quantities : clicking +/- updates these instantly while a debounced timer
  // sends the final value to the backend, so one burst of clicks = one api call
  const [pendingQty, setPendingQty] = useState({})

  useEffect(() => {
    const entries = Object.entries(pendingQty)
    if (entries.length === 0) return

    const timer = window.setTimeout(() => {
      entries.forEach(([id, quantity]) => onUpdate(id, quantity))
      setPendingQty({})
    }, 250)

    return () => window.clearTimeout(timer)
  }, [pendingQty, onUpdate])

  function displayQty(item) {
    const draft = pendingQty[item.productId._id]
    return draft !== undefined ? draft : item.quantity
  }

  function changeQty(item, next) {
    setPendingQty((pending) => ({
      ...pending,
      [item.productId._id]: Math.max(1, Math.min(next, item.productId.stock))
    }))
  }

  if (!cart) return <p className="empty">Loading cart...</p>
  if (cart.items.length === 0) return <p className="empty">Your cart is empty</p>

  const total = cart.items.reduce((sum, item) => sum + (item.productId?.price || item.price) * item.quantity, 0)

  async function placeOrder() {
    if (!address.trim()) return
    setPlacing(true)
    try {
      const { order } = await api.placeOrder(address)
      await api.clearCart()
      onPlaced(order._id)
    } catch (err) {
      showToast(err.message)
      setPlacing(false)
    }
  }

  return (
    <section id="cart">
      <h2>Your cart</h2>
      <div className="cart-list">
        {cart.items.map((item) => (
          <div key={item.productId._id} className="cart-row">
            <img src={item.productId.image} alt={item.productId.title} />
            <div>
              <h4>{item.productId.title}</h4>
              <p className="muted">${Number(item.productId.price).toFixed(2)} each</p>
            </div>
            <div className="row">
              <button onClick={() => changeQty(item, displayQty(item) - 1)} disabled={displayQty(item) <= 1}>-</button>
              <span>{displayQty(item)}</span>
              <button onClick={() => changeQty(item, displayQty(item) + 1)} disabled={displayQty(item) >= item.productId.stock}>+</button>
            </div>
            <span className="price">${(Number(item.productId.price) * item.quantity).toFixed(2)}</span>
            <button onClick={() => onRemove(item.productId._id)}>Remove</button>
          </div>
        ))}
      </div>
      <h3>Total : ${total.toFixed(2)}</h3>
      <div className="checkout">
        <input placeholder="Shipping address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <button disabled={placing} onClick={placeOrder}>{placing ? 'Placing....' : 'Place order'}</button>
      </div>
    </section>
  )
}

function OrdersView({ orders }) {
  if (orders.length === 0) return <p className="empty">No orders yet</p>
  return (
    <section id="orders">
      <h2>My orders</h2>
      {orders.map((order) => (
        <div key={order._id} className="order-card">
          <div className="order-head">
            <span>#{order._id.slice(-6)}</span>
            <span className="muted">{new Date(order.createdAt).toLocaleString()}</span>
            <span className={`status ${order.status}`}>{order.status}</span>
            <span className="price">${Number(order.total).toFixed(2)}</span>
          </div>
          <div className="order-items">
            {order.items.map((item) => (
              <div key={item.productId} className="order-item">
                <img src={item.image} alt={item.title} />
                <span>{item.title} &times; {item.quantity}</span>
                <span className="price">${(Number(item.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <p className="muted">Ships to : {order.shippingAddress}</p>
        </div>
      ))}
    </section>
  )
}

function AuthView({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '', phone: '' })
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (otpSent) {
        await api.resetPassword({ email: form.email, otp, newPassword })
        setOtpSent(false)
        setMode('login')
        setError('')
      } else if (mode === 'login') {
        const result = await api.login({ email: form.email, password: form.password })
        onLogin(result)
      } else {
        await api.signup(form)
        const result = await api.login({ email: form.email, password: form.password })
        onLogin(result)
      }
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  async function sendOtp(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.forgotPassword({ email: form.email })
      setOtpSent(true)
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  return (
    <section id="auth">
      {otpSent ? (
        <form className="auth-card" onSubmit={sendOtp}>
          <h2>Reset password</h2>
          <p className="muted">Enter the OTP sent to {form.email}</p>
          {error && <p className="error">{error}</p>}
          <input required placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
          <input required placeholder="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <button disabled={busy}>{busy ? 'Working....' : 'Reset password'}</button>
          <button type="button" className="link" onClick={() => { setOtpSent(false); setMode('login'); setError('') }}>Back to login</button>
        </form>
      ) : (
        <form className="auth-card" onSubmit={mode === 'forgot' ? sendOtp : submit}>
          <h2>{mode === 'login' ? 'Login' : 'Create account'}</h2>
          {error && <p className="error">{error}</p>}
          {mode === 'signup' && <input required placeholder="Name" value={form.name} onChange={(e) => update('name', e.target.value)} />}
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          {mode === 'login' ? (
            <input required type="password" placeholder="Password" value={form.password} onChange={(e) => update('password', e.target.value)} />
          ) : (
            <input required type="password" placeholder="Password (min 6 chars)" minLength={6} value={form.password} onChange={(e) => update('password', e.target.value)} />
          )}
          {mode === 'signup' && <input placeholder="Address" value={form.address} onChange={(e) => update('address', e.target.value)} />}
          {mode === 'signup' && <input placeholder="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />}
          <button disabled={busy}>{busy ? 'Working....' : mode === 'login' ? 'Login' : 'Sign up'}</button>
          {mode === 'login' && (
            <>
              <button type="button" className="link" onClick={() => setMode('forgot')}>Forgot password?</button>
              <button type="button" className="link" onClick={() => { setMode('signup'); setError('') }}>Need an account? Sign up</button>
            </>
          )}
          {mode === 'signup' && (
            <button type="button" className="link" onClick={() => { setMode('login'); setError('') }}>Already have an account? Login</button>
          )}
        </form>
      )}
    </section>
  )
}

function AdminView({ products, onProductsChanged, orders, showToast }) {
  const [form, setForm] = useState({ title: '', price: '', category: '', image: '', description: '', stock: '' })
  const [busy, setBusy] = useState(false)

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function createProduct(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.createProduct({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        rating: 0
      })
      setForm({ title: '', price: '', category: '', image: '', description: '', stock: '' })
      await onProductsChanged()
    } catch (err) {
      showToast(err.message)
    }
    setBusy(false)
  }

  async function removeProduct(id) {
    try {
      await api.deleteProduct(id)
      await onProductsChanged()
    } catch (err) {
      showToast(err.message)
    }
  }

  async function changeStatus(orderId, status) {
    try {
      await api.updateOrderStatus(orderId, status)
    } catch (err) {
      showToast(err.message)
    }
  }

  return (
    <section id="admin">
      <h2>Admin panel</h2>
      <div className="admin-cols">
        <form className="auth-card" onSubmit={createProduct}>
          <h3>Add product</h3>
          <input required placeholder="Title" value={form.title} onChange={(e) => update('title', e.target.value)} />
          <input required type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={(e) => update('price', e.target.value)} />
          <input required placeholder="Category" value={form.category} onChange={(e) => update('category', e.target.value)} />
          <input required placeholder="Image URL" value={form.image} onChange={(e) => update('image', e.target.value)} />
          <input placeholder="Description" value={form.description} onChange={(e) => update('description', e.target.value)} />
          <input required type="number" min="0" placeholder="Stock" value={form.stock} onChange={(e) => update('stock', e.target.value)} />
          <button disabled={busy}>{busy ? 'Saving....' : 'Create'}</button>
        </form>

        <div>
          <h3>Products ({products.length})</h3>
          <div className="admin-products">
            {products.map((p) => (
              <div key={p._id} className="cart-row">
                <img src={p.image} alt={p.title} />
                <div>
                  <h4>{p.title}</h4>
                  <p className="muted">${Number(p.price).toFixed(2)} &middot; stock {p.stock}</p>
                </div>
                <button onClick={() => removeProduct(p._id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3>All orders ({orders.length})</h3>
          <div className="admin-orders">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-head">
                  <span>#{order._id.slice(-6)}</span>
                  <span className="muted">{order.user?.name || 'Unknown'}</span>
                  <span className="price">${Number(order.total).toFixed(2)}</span>
                </div>
                <div className="row">
                  <select value={order.status} onChange={(e) => changeStatus(order._id, e.target.value)}>
                    <option value="pending">pending</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default App
