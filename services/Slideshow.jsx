import { useEffect, useState } from 'react'

export default function Slideshow({ products, formatPrice, onOpen }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const limitedProducts = products.slice(0, 5)

  useEffect(() => {
    if (isHovered || limitedProducts.length < 2) return

    
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % limitedProducts.length)
    }, 2000)

    return () => window.clearInterval(timer)
  }, [isHovered, limitedProducts.length])

  if (limitedProducts.length === 0) return null

  const slideIndex = activeIndex % limitedProducts.length
  const product = limitedProducts[slideIndex]

  function showSlide(index) {
    setActiveIndex((index + limitedProducts.length) % limitedProducts.length)
  }

  return (
    <section
      className="slideshow"
      aria-label="Featured products"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="slideshow-slide" key={product._id}>
        <div className="slideshow-copy">
          <p className="slideshow-eyebrow">Featured pick</p>
          <h1 className="slideshow-title">{product.title}</h1>
          <p className="slideshow-category">{product.category}</p>
          <p className="slideshow-price">{formatPrice(product.price)}</p>
          <button className="primary" onClick={() => onOpen(product)}>View product</button>
          
          <div className="slideshow-controls" aria-label="Slideshow controls">
            <button className="slideshow-arrow" aria-label="Previous slide" onClick={() => showSlide(slideIndex - 1)}>
              &#8592;
            </button>
            <div className="slideshow-dots" aria-label="Choose a slide">
              {limitedProducts.map((slide, index) => (
                <button
                  key={slide._id}
                  className={`slideshow-dot ${index === slideIndex ? 'active' : ''}`}
                  aria-label={`Show slide ${index + 1}`}
                  aria-current={index === slideIndex}
                  onClick={() => showSlide(index)}
                />
              ))}
            </div>
            <button className="slideshow-arrow" aria-label="Next slide" onClick={() => showSlide(slideIndex + 1)}>
              &#8594;
            </button>
          </div>
        </div>
        
        <div className="slideshow-image-wrap">
          <img className="slideshow-image" src={product.image} alt={product.title} />
        </div>
      </div>
    </section>
  )
}