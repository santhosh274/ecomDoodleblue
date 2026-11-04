import { useEffect, useState, useCallback } from 'react'
import './App.css'
import { api, getToken, setToken, getSavedUser, saveUser } from './api.js'
import Slideshow from '../services/Slideshow.jsx'

const money = (n) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
}).format(Number(n))

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
  const [coupons, setCoupons] = useState([])

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
    async function loadAdminData() {
      if (view !== 'admin' || !getToken()) return
      try {
        const [ordersRes, couponsRes] = await Promise.all([
          api.getAllOrders(),
          api.getCoupons()
        ])
        setAdminOrders(ordersRes.orders)
        setCoupons(couponsRes.coupons)
      } catch (err) {
        showToast(err.message)
      }
    }
    loadAdminData()
  }, [view])

  function handleLoginResult(result) {
    setToken(result.token)
    saveUser(result.user)
    setUser(result.user)
    setView('shop')
    showToast(`Welcome, ${result.user.name}`)
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

  const handleCartUpdate = useCallback(async (productId, quantity) => {
  try {
    const { cart: c } = await api.updateCartItem(productId, quantity)
    setCart(c)
  } catch (err) {
    showToast(err.message)
  }
}, [])

  async function handleCartRemove(productId) {
    try {
      const { cart: c } = await api.removeCartItem(productId)
      setCart(c)
    } catch (err) {
      showToast(err.message)
    }
  }

  const navClass = (name, extra = '') => `navlink ${extra} ${view === name ? 'active' : ''}`.replace(/\s+/g, ' ').trim()

  return (
    <>
      
<header className="topbar">
  <div className="topbar-inner">
    <button
      className="brand"
      onClick={() => setView('shop')}
      aria-label="The Everything home"
    >

      <img src="/src/assets/everything.webp" alt="The Everything logo" className="brand-logo" width={50}/>
      <span className="brand-name">the everything<span>.</span></span>
    </button>

    <nav className="nav-menu" aria-label="Main navigation">
      <button
        className={navClass('shop')}
        onClick={() => setView('shop')}
      >
        Shop
      </button>

      {isAdmin && (
        <button
          className={navClass('admin')}
          onClick={() => setView('admin')}
        >
          Admin
        </button>
      )}

      {user && !isAdmin && (
        <button
          className={navClass('orders')}
          onClick={() => setView('orders')}
        >
          Orders
        </button>
      )}

      {user && (
        <button
          className={navClass('cart')}
          onClick={() => setView('cart')}
        >
          <span>Cart</span>
          {cartCount > 0 && (
            <span className="cart-count">{cartCount}</span>
          )}
        </button>
      )}
    </nav>

    <div className="nav-actions">
      {user ? (
        <>
          <div className="user-info">
            <span className="user-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </span>
            <span className="user-name">{user.name}</span>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Log out
            <span>↗</span>
          </button>
        </>
      ) : (
        <button
          className="login-btn"
          onClick={() => setView('auth')}
        >
          Sign in <span>↗</span>
        </button>
      )}
    </div>
  </div>
</header>
  {view === 'shop' && (
    <Slideshow
      products={products}
      formatPrice={money}
      onOpen={(product) => { setSelected(product); setView('product') }}
    />
  )}
      {message && <div className="toast" role="status">{message}</div>}

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
          <CartView
            cart={cart}
            onUpdate={handleCartUpdate}
            onRemove={handleCartRemove}
            showToast={showToast}
            onBrowse={() => setView('shop')}
            onPlaced={(orderId) => { setCart(null); setView('orders'); showToast(`Order ${orderId.slice(-6)} placed`) }}
          />
        )}

        {view === 'orders' && <OrdersView orders={orders} onBrowse={() => setView('shop')} />}

        {view === 'auth' && <AuthView onLogin={handleLoginResult} showToast={showToast} />}

        {view === 'admin' && isAdmin && (
          <AdminView
            showToast={showToast}
            products={products}
            onProductsChanged={async () => {
              const [{ products: list }, { categories: productCategories }] = await Promise.all([
                api.getProducts({ category, search: debouncedSearch }),
                api.getCategories()
              ])
              setProducts(list)
              setCategories(productCategories)
            }}
            orders={adminOrders}
            onOrderUpdated={(id, status) =>
              setAdminOrders((list) => list.map((o) => (o._id === id ? { ...o, status } : o)))
            }
            coupons={coupons}
            onCouponsChanged={async () => {
              const res = await api.getCoupons()
              setCoupons(res.coupons)
            }}
          />
        )}
      </main>
    </>
  )
}



function Stepper({ value, min = 1, max, onChange }) {
  return (
    <div className="stepper">
      <button type="button" aria-label="Decrease quantity" onClick={() => onChange(value - 1)} disabled={value <= min}>&minus;</button>
      <span>{value}</span>
      <button type="button" aria-label="Increase quantity" onClick={() => onChange(value + 1)} disabled={value >= max}>+</button>
    </div>
  )
}


function ShopView({ products, categories, search, setSearch, category, setCategory, loading, onOpen, onAddToCart }) {
  return (
    <section id="shop">
      <div className="shop-head">
        <h1>{category || 'All products'}</h1>
        {!loading && <span className="muted">{products.length} {products.length === 1 ? 'item' : 'items'}</span>}
      </div>

      <div className="filters">
        <input
          type="search"
          aria-label="Search products"
          placeholder="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="tabs">
          <button className={!category ? 'tab active' : 'tab'} onClick={() => setCategory('')}>All</button>
          {categories.map((c) => (
            <button key={c} className={category === c ? 'tab active' : 'tab'} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton">
              <div className="media" />
              <div className="bar" />
              <div className="bar short" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="empty">
          <h2>No matching products</h2>
          <p>Try a different search term or switch to another category.</p>
          <button onClick={() => { setSearch(''); setCategory('') }}>Clear filters</button>
        </div>
      ) : (
        <div className="grid">
          {products.map((p) => {
            const out = p.stock === 0
            const low = !out && p.stock <= 5
            return (
              <article key={p._id} className={out ? 'card soldout' : 'card'} onClick={() => onOpen(p)}>
                <div className="media">
                  <img src={p.image} alt={p.title} loading="lazy" />
                  {out && <span className="flag out">Sold out</span>}
                  {low && <span className="flag">{p.stock} left</span>}
                  {!out && (
                    <button
                      className="primary quick-add"
                      onClick={(e) => { e.stopPropagation(); onAddToCart(p) }}
                    >
                      Add to cart
                    </button>
                  )}
                </div>
                <div className="card-body">
                  <h3>{p.title}</h3>
                  <span className="muted">{p.category}</span>
                  <span className="price">{money(p.price)}</span>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}


function ProductView({ product, onAddToCart, onBack }) {
  const [qty, setQty] = useState(1)
  const out = product.stock === 0
  const low = !out && product.stock <= 5

  return (
    <section id="product">
      <button className="link back" onClick={onBack}>&larr; Back to shop</button>
      <div className="product-detail">
        <div className="media">
          <img src={product.image} alt={product.title} />
        </div>
        <div className="product-info">
          <span className="category">{product.category}</span>
          <h2>{product.title}</h2>
          <p className="price big">{money(product.price)}</p>
          <p className="desc">{product.description}</p>
          <p className={out ? 'stock-note out' : low ? 'stock-note low' : 'stock-note'}>
            {out ? 'Out of stock' : low ? `Only ${product.stock} left` : 'In stock'}
          </p>
          <div className="buy-row">
            {!out && <Stepper value={qty} max={product.stock} onChange={setQty} />}
            <button className="primary" disabled={out} onClick={() => onAddToCart(product, qty)}>
              {out ? 'Out of stock' : 'Add to cart'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}



function CartView({ cart, onUpdate, onRemove, showToast, onPlaced, onBrowse }) {
  const [address, setAddress] = useState('')
  const [placing, setPlacing] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [pendingQty, setPendingQty] = useState({})

  useEffect(() => {
  const entries = Object.entries(pendingQty)
  if (entries.length === 0) return

  const timer = window.setTimeout(async () => {
    await Promise.all(
      entries.map(([id, quantity]) => onUpdate(id, quantity))
    )

    setPendingQty((current) => {
      const updated = { ...current }

      entries.forEach(([id, quantity]) => {
        if (updated[id] === quantity) {
          delete updated[id]
        }
      })

      return updated
    })
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

  if (!cart) return <p className="empty muted">Loading cart...</p>
  const items = cart.items.filter((item) => item?.productId)
  if (items.length === 0) {
    return (
      <div className="empty">
        <h2>Your cart is empty</h2>
        <p>Add something from the shop and it will show up here.</p>
        <button className="primary" onClick={onBrowse}>Browse products</button>
      </div>
    )
  }

  const subtotal = items.reduce((sum, item) => sum + (item.productId.price || item.price) * displayQty(item), 0)
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercentage) / 100 : 0
  const total = subtotal - discountAmount

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return
    try {
      const result = await api.validateCoupon(couponInput.trim())
      setAppliedCoupon({ code: result.code, discountPercentage: result.discountPercentage })
      showToast(`Coupon applied: ${result.discountPercentage}% off`)
      setCouponInput('')
    } catch (err) {
      showToast(err.message)
    }
  }

  async function placeOrder() {
    if (!address.trim()) {
      showToast('Enter a shipping address')
      return
    }
    setPlacing(true)
    try {
      const { order } = await api.placeOrder(address, appliedCoupon?.code)
      await api.clearCart()
      onPlaced(order._id)
    } catch (err) {
      showToast(err.message)
      setPlacing(false)
    }
  }

  return (
    <section id="cart">
      <h2 className="page-title">Cart</h2>
      <div className="cart-layout">
        <div className="cart-list">
          {items.map((item) => (
            <div key={item.productId._id} className="cart-row">
              <div className="thumb"><img src={item.productId.image} alt={item.productId.title} /></div>
              <div>
                <h4>{item.productId.title}</h4>
                <p className="muted">{money(item.productId.price)} each</p>
                <button className="link remove" onClick={() => onRemove(item.productId._id)}>Remove</button>
              </div>
              <Stepper
                value={displayQty(item)}
                max={item.productId.stock}
                onChange={(n) => changeQty(item, n)}
              />
              <span className="price line-total">{money(Number(item.productId.price) * displayQty(item))}</span>
            </div>
          ))}
        </div>

        <aside className="summary">
          <h3>Order summary</h3>

          <div className="sum-lines">
            <div className="sum-line"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            {appliedCoupon && (
              <div className="sum-line discount"><span>Discount ({appliedCoupon.discountPercentage}%)</span><span>&minus;{money(discountAmount)}</span></div>
            )}
            <div className="sum-line total"><span>Total</span><span>{money(total)}</span></div>
          </div>

          <div className="field">
            <label htmlFor="coupon">Promo code</label>
            <div className="inline-field">
              <input id="coupon" placeholder="WELCOME10" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} />
              <button type="button" onClick={handleApplyCoupon}>Apply</button>
            </div>
            {appliedCoupon && (
              <p className="coupon-applied">
                <span>{appliedCoupon.code} applied</span>
                <button className="link danger" onClick={() => setAppliedCoupon(null)}>Remove</button>
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="address">Shipping address</label>
            <input id="address" placeholder="Street, city, postal code" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <button className="primary" disabled={placing} onClick={placeOrder}>
            {placing ? 'Placing order...' : `Place order · ${money(total)}`}
          </button>
        </aside>
      </div>
    </section>
  )
}

function OrdersView({ orders, onBrowse }) {
  if (orders.length === 0) {
    return (
      <div className="empty">
        <h2>No orders yet</h2>
        <p>Orders you place will show up here with their delivery status.</p>
        <button className="primary" onClick={onBrowse}>Browse products</button>
      </div>
    )
  }
  return (
    <section id="orders">
      <h2 className="page-title">Orders</h2>
      {orders.map((order) => (
        <div key={order._id} className="order-card">
          <div className="order-head">
            <span className="id">#{order._id.slice(-6)}</span>
            <span className="muted">{new Date(order.createdAt).toLocaleDateString()}</span>
            <span className={`status ${order.status}`}>{order.status}</span>
            <span className="price">{money(order.total)}</span>
          </div>
          <div className="order-items">
            {order.items.map((item) => (
              <div key={item.productId} className="order-item">
                <div className="thumb"><img src={item.image} alt={item.title} /></div>
                <span>{item.title} &times; {item.quantity}</span>
                <span className="price">{money(Number(item.price) * item.quantity)}</span>
              </div>
            ))}
          </div>
          <p className="order-foot muted">Ships to {order.shippingAddress}</p>
        </div>
      ))}
    </section>
  )
}

function AuthView({ onLogin, showToast }) {
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

  function goTo(next) {
    setMode(next)
    setOtpSent(false)
    setError('')
  }

  async function run(action) {
    setError('')
    setBusy(true)
    try {
      await action()
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  function submitCredentials(e) {
    e.preventDefault()
    run(async () => {
      if (mode === 'login') {
        onLogin(await api.login({ email: form.email, password: form.password }))
      } else {
        await api.signup(form)
        goTo('login')
        showToast('Account created. Log in to continue.')
      }
    })
  }

  function sendOtp(e) {
    e.preventDefault()
    run(async () => {
      await api.forgotPassword({ email: form.email })
      setOtpSent(true)
    })
  }

  function submitReset(e) {
    e.preventDefault()
    run(async () => {
      await api.resetPassword({ email: form.email, otp, newPassword })
      goTo('login')
      showToast('Password updated. Log in with the new one.')
    })
  }

  return (
    <section id="auth">
      {otpSent ? (
        <form className="auth-card" onSubmit={submitReset}>
          <h2>Enter your code</h2>
          <p className="muted">We sent a verification code to {form.email}.</p>
          {error && <p className="error">{error}</p>}
          <input required placeholder="Verification code" value={otp} onChange={(e) => setOtp(e.target.value)} />
          <input required placeholder="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <button className="primary" disabled={busy}>{busy ? 'Saving...' : 'Update password'}</button>
          <button type="button" className="link" onClick={() => goTo('login')}>Back to log in</button>
        </form>
      ) : mode === 'forgot' ? (
        <form className="auth-card" onSubmit={sendOtp}>
          <h2>Reset password</h2>
          <p className="muted">Enter your email and we will send you a code.</p>
          {error && <p className="error">{error}</p>}
          <input required type="email" placeholder="Email address" value={form.email} onChange={(e) => update('email', e.target.value)} />
          <button className="primary" disabled={busy}>{busy ? 'Sending...' : 'Send code'}</button>
          <button type="button" className="link" onClick={() => goTo('login')}>Back to log in</button>
        </form>
      ) : (
        <form className="auth-card" onSubmit={submitCredentials}>
          <h2>{mode === 'login' ? 'Log in' : 'Create account'}</h2>
          {error && <p className="error">{error}</p>}
          {mode === 'signup' && <input required placeholder="Full name" value={form.name} onChange={(e) => update('name', e.target.value)} />}
          <input required type="email" placeholder="Email address" value={form.email} onChange={(e) => update('email', e.target.value)} />
          <input required type="password" placeholder="Password" minLength={mode === 'signup' ? 6 : undefined} value={form.password} onChange={(e) => update('password', e.target.value)} />
          {mode === 'signup' && <input placeholder="Address (optional)" value={form.address} onChange={(e) => update('address', e.target.value)} />}
          {mode === 'signup' && <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => update('phone', e.target.value)} />}
          <button className="primary" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}</button>
          {mode === 'login' ? (
            <div className="auth-links">
              <button type="button" className="link" onClick={() => goTo('forgot')}>Forgot password?</button>
              <button type="button" className="link" onClick={() => goTo('signup')}>Create account</button>
            </div>
          ) : (
            <button type="button" className="link" onClick={() => goTo('login')}>Already have an account? Log in</button>
          )}
        </form>
      )}
    </section>
  )
}

/* ---------- Admin ---------- */

function AdminView({ products, onProductsChanged, orders, onOrderUpdated, coupons, onCouponsChanged, showToast }) {
  const [form, setForm] = useState({ title: '', price: '', category: '', image: '', description: '', stock: '' })
  const [editingProduct, setEditingProduct] = useState(null)
  const [couponForm, setCouponForm] = useState({ code: '', discountPercentage: '' })
  const [busy, setBusy] = useState(false)

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function updateEdit(key, value) {
    setEditingProduct((p) => ({ ...p, [key]: value }))
  }

  function updateCoupon(key, value) {
    setCouponForm((f) => ({ ...f, [key]: value }))
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
      showToast('Product created')
    } catch (err) {
      showToast(err.message)
    }
    setBusy(false)
  }

  async function updateProductSubmit(e) {
    e.preventDefault()
    if (!editingProduct) return
    setBusy(true)
    try {
      await api.updateProduct(editingProduct._id, {
        title: editingProduct.title,
        description: editingProduct.description,
        price: Number(editingProduct.price),
        category: editingProduct.category,
        image: editingProduct.image,
        stock: Number(editingProduct.stock)
      })
      setEditingProduct(null)
      await onProductsChanged()
      showToast('Product updated successfully')
    } catch (err) {
      showToast(err.message)
    }
    setBusy(false)
  }

  async function removeProduct(id) {
    try {
      await api.deleteProduct(id)
      await onProductsChanged()
      showToast('Product deleted')
    } catch (err) {
      showToast(err.message)
    }
  }

  async function changeStatus(orderId, status) {
    try {
      await api.updateOrderStatus(orderId, status)
      onOrderUpdated(orderId, status)
      showToast('Order status updated')
    } catch (err) {
      showToast(err.message)
    }
  }

  async function handleCreateCoupon(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.createCoupon({
        code: couponForm.code.trim().toUpperCase(),
        discountPercentage: Number(couponForm.discountPercentage)
      })
      setCouponForm({ code: '', discountPercentage: '' })
      if (onCouponsChanged) await onCouponsChanged()
      showToast('Coupon created successfully')
    } catch (err) {
      showToast(err.message)
    }
    setBusy(false)
  }

  async function removeCoupon(code) {
    try {
      await api.deleteCoupon(code)
      if (onCouponsChanged) await onCouponsChanged()
      showToast('Coupon deleted')
    } catch (err) {
      showToast(err.message)
    }
  }

  return (
    <section id="admin">
      <h2 className="page-title">Admin Dashboard</h2>

      {editingProduct && (
        <div className="admin-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setEditingProduct(null) }}>
          <form className="auth-card admin-form admin-modal" onSubmit={updateProductSubmit} role="dialog" aria-modal="true" aria-labelledby="edit-product-title">
            <h3 id="edit-product-title">Edit Product</h3>
            <label className="muted">Title</label>
            <input required value={editingProduct.title} onChange={(e) => updateEdit('title', e.target.value)} />
            <label className="muted">Price (₹)</label>
            <input required type="number" min="0" step="0.01" value={editingProduct.price} onChange={(e) => updateEdit('price', e.target.value)} />
            <label className="muted">Category</label>
            <input required value={editingProduct.category} onChange={(e) => updateEdit('category', e.target.value)} />
            <label className="muted">Image URL</label>
            <input required value={editingProduct.image} onChange={(e) => updateEdit('image', e.target.value)} />
            <label className="muted">Description</label>
            <input value={editingProduct.description || ''} onChange={(e) => updateEdit('description', e.target.value)} />
            <label className="muted">Stock</label>
            <input required type="number" min="0" value={editingProduct.stock} onChange={(e) => updateEdit('stock', e.target.value)} />

            <div className="admin-modal-actions">
              <button type="submit" className="primary" disabled={busy}>{busy ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={() => setEditingProduct(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-cols">
        {/* Product Management */}
        <div>
          <form className="auth-card admin-form admin-create-form" onSubmit={createProduct}>
            <h3>Add Product</h3>
            <input required placeholder="Title" value={form.title} onChange={(e) => update('title', e.target.value)} />
            <input required type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={(e) => update('price', e.target.value)} />
            <input required placeholder="Category" value={form.category} onChange={(e) => update('category', e.target.value)} />
            <input required placeholder="Image URL" value={form.image} onChange={(e) => update('image', e.target.value)} />
            <input placeholder="Description" value={form.description} onChange={(e) => update('description', e.target.value)} />
            <input required type="number" min="0" placeholder="Stock" value={form.stock} onChange={(e) => update('stock', e.target.value)} />
            <button className="primary" disabled={busy}>{busy ? 'Saving...' : 'Create Product'}</button>
          </form>

          <h3>Products ({products.length})</h3>
          <div className="admin-list">
            {products.map((p) => (
              <div key={p._id} className="admin-row">
                <div className="thumb"><img src={p.image} alt={p.title} /></div>
                <div className="grow">
                  <h4>{p.title}</h4>
                  <p className="muted">{money(p.price)} &middot; {p.stock} in stock</p>
                </div>
                <button onClick={() => setEditingProduct({ ...p })}>Edit</button>
                <button onClick={() => removeProduct(p._id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>

        {/* Coupon Management */}
        <div>
          <form className="auth-card admin-form admin-create-form" onSubmit={handleCreateCoupon}>
            <h3>Create Coupon</h3>
            <input required placeholder="Coupon Code (e.g. SAVE20)" value={couponForm.code} onChange={(e) => updateCoupon('code', e.target.value)} />
            <input required type="number" min="1" max="100" placeholder="Discount Percentage (%)" value={couponForm.discountPercentage} onChange={(e) => updateCoupon('discountPercentage', e.target.value)} />
            <button className="primary" disabled={busy}>{busy ? 'Saving...' : 'Create Coupon'}</button>
          </form>

          <h3>Active Coupons ({coupons.length})</h3>
          <div className="admin-list">
            {coupons.length === 0 ? (
              <p className="muted" style={{ padding: '1rem 0' }}>No active coupons created yet.</p>
            ) : (
              coupons.map((c) => (
                <div key={c._id || c.code} className="admin-row">
                  <div>
                    <h4>{c.code}</h4>
                    <p className="muted">{c.discountPercentage}% discount</p>
                  </div>
                  <button onClick={() => removeCoupon(c.code)}>Delete</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Management */}
        <div>
          <h3>Orders ({orders.length})</h3>
          <div className="admin-list">
            {orders.map((order) => (
              <div key={order._id} className="admin-row">
                <div className="grow">
                  <h4>#{order._id.slice(-6)} &middot; {order.user?.name || 'Unknown'}</h4>
                  <p className="muted">{money(order.total)}</p>
                </div>
                <select value={order.status} onChange={(e) => changeStatus(order._id, e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default App