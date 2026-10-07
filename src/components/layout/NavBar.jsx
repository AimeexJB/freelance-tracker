import { useRef, useState } from 'react'
import './NavBar.scss'

function NavBar({ tabs, activeTab, onTabChange, onCreateInvoice }) {
  const tabRefs = useRef([])
  const [menuOpen, setMenuOpen] = useState(false)

  function handleKeyDown(event, index) {
    let newIndex = null
    if (event.key === 'ArrowRight') newIndex = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft') newIndex = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') newIndex = 0
    if (event.key === 'End') newIndex = tabs.length - 1
    if (event.key === 'Escape') {
      setMenuOpen(false)
      return
    }
    if (newIndex !== null) {
      event.preventDefault()
      onTabChange(tabs[newIndex].id)
      tabRefs.current[newIndex]?.focus()
    }
  }

  function handleTabClick(tabId) {
    onTabChange(tabId)
    setMenuOpen(false)
  }

  return (
    <header className="navbar">
      <a className="navbar__skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="navbar__brand">
        <span className="navbar__brand-mark" aria-hidden="true">
          &yen;
        </span>
        <span className="navbar__brand-name">Freelance Tracker</span>
      </div>
      <nav id="nav-tabs" className={`navbar__tabs ${menuOpen ? 'is-open' : ''}`} role="tablist" aria-label="Sections">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el
            }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`navbar__tab ${activeTab === tab.id ? 'is-active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <button className="navbar__cta" onClick={onCreateInvoice}>
        + Create Invoice
      </button>
      <button
        type="button"
        className="navbar__menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="nav-tabs"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
      </button>
    </header>
  )
}

export default NavBar
